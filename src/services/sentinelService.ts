import { apiKeyManager } from './apiKeyManager';
import { db, auth } from '../lib/firebase';
import { doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getGeminiClient, validateModelName, handleApiKeyError } from './geminiService';
import { semanticSearch } from './vectorService';

export type MatchGroup =
  | 'not_cited_or_quoted'
  | 'missing_quotations'
  | 'missing_citation'
  | 'cited_and_quoted'
  | 'peer_match'
  | 'self_plagiarism';

export type SourceRegion =
  | 'domestic' // Yerli (.tr, .com.tr vb.)
  | 'international' // Yabancı
  | 'academic' // Akademik (.edu, .gov, .org)
  | 'unknown';

export type SourceTrust =
  | 'high' // Güvenilir (.edu, .gov, .org, resmi kurumlar)
  | 'medium' // Orta (bilinen haber siteleri, makale siteleri)
  | 'low' // Düşük (blog, forum, şüpheli domainler)
  | 'unknown';

export interface PlagiarismSource {
  url: string;
  title: string;
  snippet: string;
  matchedText: string;
  matchGroup: MatchGroup;
  region?: SourceRegion;
  trust?: SourceTrust;
  similarity?: number;
  matchedSnippet?: string;
}

export interface PlagiarismReport {
  similarityScore: number;
  sources: PlagiarismSource[];
}

// B22: Taramanın gerçek durumu — 'ok' dışında kaynak/skor verisi yoktur ve UI bunu kullanıcıya söylemek zorundadır
export type SentinelScanStatus = 'ok' | 'disabled' | 'offline' | 'not_configured' | 'failed';

export interface PlagiarismScanMeta {
  scanStatus: SentinelScanStatus;
  queriesRun: number;    // Google Custom Search'a gerçekten gönderilen sorgu sayısı
  queriesFailed: number; // HTTP hatasıyla (kota/geçersiz anahtar vb.) dönen sorgu sayısı
}

export interface FactCheckClaim {
  claim: string;
  status: 'Verified' | 'False' | 'Unverified' | 'Disputed';
  confidence: number;
  source?: string;
  sourceTitle?: string;
  explanation: string;
}

export interface FactCheckReport {
  confidenceScore: number; // 0-1
  claims: FactCheckClaim[];
}

const getSearchConfig = () => ({
  apiKey: apiKeyManager.getSearchKey(),
  engineId: import.meta.env.VITE_GOOGLE_SEARCH_ENGINE_ID
});

// --- AĞ DURUMU TAKİBİ ---
let _networkDown = false;
let _lastNetworkCheck = 0;
const NETWORK_CHECK_COOLDOWN = 30_000; 

const isNetworkAvailable = (): boolean => {
  if (!navigator.onLine) {
    _networkDown = true;
    return false;
  }
  if (_networkDown && (Date.now() - _lastNetworkCheck) < NETWORK_CHECK_COOLDOWN) {
    return false;
  }
  return true;
};

const markNetworkDown = () => {
  _networkDown = true;
  _lastNetworkCheck = Date.now();
};

const markNetworkUp = () => {
  _networkDown = false;
};

/**
 * Sentinel servisinin durumunu günceller.
 */
export const updateSentinelStatus = async (status: 'online' | 'error' | 'quota_full', message?: string) => {
  if (!isNetworkAvailable()) return;
  try {
    await updateDoc(doc(db, 'settings', 'system'), {
      sentinelStatus: status,
      sentinelLastMessage: message || '',
      sentinelLastCheck: serverTimestamp()
    });
    markNetworkUp();
  } catch { }
};

/**
 * Sentinel olaylarını loglar.
 */
export const logSentinelEvent = async (status: 'success' | 'error', duration: number, message: string) => {
  if (!isNetworkAvailable()) return;
  try {
    await addDoc(collection(db, 'sentinelLogs'), {
      status,
      duration,
      message,
      userEmail: auth.currentUser?.email || 'Anonim',
      timestamp: serverTimestamp()
    });
    markNetworkUp();
  } catch { }
};

/**
 * Kaynağın bölgesini tespit eder (Yerli/Yabancı/Akademik).
 */
const detectSourceRegion = (url: string): SourceRegion => {
  const urlLower = url.toLowerCase();
  
  // Akademik kaynaklar
  if (urlLower.includes('.edu') || urlLower.includes('.gov') || urlLower.includes('.org')) {
    return 'academic';
  }
  
  // Yerli kaynaklar
  if (urlLower.includes('.tr') || urlLower.includes('.com.tr') || urlLower.includes('.net.tr')) {
    return 'domestic';
  }
  
  // Yabancı kaynaklar
  return 'international';
};

/**
 * Kaynağın güvenilirliğini tespit eder (Halüsinasyon önleme).
 */
const detectSourceTrust = (url: string): SourceTrust => {
  const urlLower = url.toLowerCase();
  
  // Yüksek güvenilirlik
  if (urlLower.includes('.edu') || urlLower.includes('.gov') || urlLower.includes('.org')) {
    return 'high';
  }
  
  // Bilinen güvenilir haber ve makale siteleri
  const trustedDomains = [
    'wikipedia.org', 'scholar.google.com', 'researchgate.net',
    'tandfonline.com', 'springer.com', 'nature.com', 'sciencedirect.com',
    'jstor.org', 'ieee.org', 'acm.org', 'elsevier.com'
  ];
  
  if (trustedDomains.some(domain => urlLower.includes(domain))) {
    return 'high';
  }
  
  // Orta güvenilirlik (bilinen haber siteleri)
  const mediumTrustDomains = [
    'bbc.com', 'cnn.com', 'reuters.com', 'apnews.com',
    'nytimes.com', 'washingtonpost.com', 'theguardian.com',
    'hurriyet.com.tr', 'milliyet.com.tr', 'sabah.com.tr', 'haberturk.com.tr'
  ];
  
  if (mediumTrustDomains.some(domain => urlLower.includes(domain))) {
    return 'medium';
  }
  
  // Düşük güvenilirlik (blog, forum, şüpheli)
  const lowTrustPatterns = [
    'blog', 'forum', 'medium.com', 'wordpress.com', 'blogspot.com',
    'tumblr.com', 'reddit.com', 'quora.com'
  ];
  
  if (lowTrustPatterns.some(pattern => urlLower.includes(pattern))) {
    return 'low';
  }
  
  return 'unknown';
};

/**
 * URL doğrulama (Halüsinasyon kapısı).
 */
const isValidUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    // HTTPS zorunlu (güvenlik)
    if (urlObj.protocol !== 'https:') {
      return false;
    }
    // Geçersiz karakter kontrolü
    if (/[<>]/.test(url)) {
      return false;
    }
    // Domain uzunluk kontrolü (çok uzun domainler şüpheli)
    if (urlObj.hostname.length > 63) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

/**
 * Metni anlamlı cümlelere böler.
 */
export const chunkText = (text: string): string[] => {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  return sentences.map(s => s.trim()).filter(s => s.split(' ').length > 4); 
};

/**
 * Handle Search API Key Error by classifying it and marking it as exhausted/invalid.
 */
export const handleSearchApiKeyError = async (responseStatus: number): Promise<boolean> => {
  const isQuota = responseStatus === 429 || responseStatus === 403;
  const isInvalid = responseStatus === 400;
  
  if (isQuota) {
    console.warn("[ApiKeyManager] Search key quota exhausted, marking as exhausted.");
    await apiKeyManager.markCurrentKeyExhausted('google-search');
    return true;
  }
  if (isInvalid) {
    console.warn("[ApiKeyManager] Search key invalid, marking as invalid.");
    await apiKeyManager.markCurrentKeyInvalid('google-search');
    return true;
  }
  return false;
};

/**
 * İki metin arasındaki basit benzerlik oranını hesaplar (Kelime bazlı).
 */
const calculateTextSimilarity = (text1: string, text2: string): number => {
  if (!text1 || !text2) return 0;
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);
  const intersection = words1.filter(w => words2.includes(w));
  return intersection.length / Math.max(words1.length, words2.length);
};

/**
 * Dinamik benzerlik skoru hesaplar (snippet karşılaştırması).
 */
const calculateDynamicSimilarity = (originalText: string, snippet: string): number => {
  if (!originalText || !snippet) return 0;
  const originalLower = originalText.toLowerCase();
  const snippetLower = snippet.toLowerCase();
  
  // Tam eşleşme kontrolü
  if (originalLower.includes(snippetLower)) {
    return 1.0;
  }
  
  // Kelime bazlı benzerlik
  const originalWords = originalLower.split(/\s+/);
  const snippetWords = snippetLower.split(/\s+/);
  const intersection = snippetWords.filter(w => originalWords.includes(w));
  
  if (snippetWords.length === 0) return 0;
  return intersection.length / snippetWords.length;
};

/**
 * Tüm metni tarayıp gerçek intihal oranını ve kaynaklarını hesaplar (İki aşamalı arama + Halüsinasyon kapısı + Dinamik benzerlik + Admin ayarları).
 */
export const verifyPlagiarism = async (
  text: string,
  enabled: boolean = true,
  retryCount: number = 0,
  customSettings?: {
    searchPhrasesCount?: number;
    minWordCount?: number;
    useDynamicSimilarity?: boolean;
    trustFilter?: boolean;
    regionFilter?: boolean;
    userId?: string;
  }
): Promise<PlagiarismReport & PlagiarismScanMeta & { matchedPhrases: { text: string, source: string, score: number }[] }> => {
  if (!enabled) return { similarityScore: 0, sources: [], matchedPhrases: [], scanStatus: 'disabled', queriesRun: 0, queriesFailed: 0 };
  if (!isNetworkAvailable()) return { similarityScore: 0, sources: [], matchedPhrases: [], scanStatus: 'offline', queriesRun: 0, queriesFailed: 0 };
  const startTime = Date.now();

  // B22: yapılandırma eksikse sessizce "%0 intihal" yerine değil, net durum döndür
  if (!apiKeyManager.getSearchKey() || !import.meta.env.VITE_GOOGLE_SEARCH_ENGINE_ID) {
    await logSentinelEvent('error', 0, 'Google Search yapılandırılmamış (API key / Engine ID eksik) — tarama yapılmadı.');
    await updateSentinelStatus('error', 'Search API yapılandırılmamış');
    return { similarityScore: 0, sources: [], matchedPhrases: [], scanStatus: 'not_configured', queriesRun: 0, queriesFailed: 0 };
  }
  
  // Admin ayarları veya varsayılan değerler
  const searchPhrasesCount = customSettings?.searchPhrasesCount || 10;
  const minWordCount = customSettings?.minWordCount || 8;
  const useDynamicSimilarity = customSettings?.useDynamicSimilarity !== false; // varsayılan true
  const trustFilter = customSettings?.trustFilter !== false; // varsayılan true
  const regionFilter = customSettings?.regionFilter !== false; // varsayılan true
  
  const sentences = chunkText(text).slice(0, searchPhrasesCount);
  const allSources: PlagiarismSource[] = [];
  const allMatchedPhrases: { text: string, source: string, score: number }[] = [];

  // B22: sorgu sayaçları — kaç gerçek arama yapıldı, kaçı başarısız
  let queriesRun = 0;
  let queriesFailed = 0;
  let quotaHit = false;

  for (const sentence of sentences) {
    const words = sentence.trim().split(/\s+/);
    if (words.length < minWordCount) continue;

    const query = encodeURIComponent('"' + sentence.trim().slice(0, 120) + '"');

    const isQuoted = /["""'].*?["""']/.test(sentence) || /[\u201C\u201D\u2018\u2019]/.test(sentence);
    const hasCitation = /\(\d{4}\)|\[\d+\]|(et al\.)|(doi:)|https?:\/\//.test(sentence);

    const matchGroup: MatchGroup =
      isQuoted && hasCitation ? 'cited_and_quoted' :
      isQuoted && !hasCitation ? 'missing_citation' :
      !isQuoted && hasCitation ? 'missing_quotations' :
      'not_cited_or_quoted';

    // B22: her cümlede canlı anahtar al — kota yenen anahtar havuzdan düşer, sıradaki devralır
    const { apiKey, engineId } = getSearchConfig();
    if (apiKey && engineId) {
      // AŞAMA 1: Türkçe kaynak araması (öncelikli)
      try {
        queriesRun++;
        const trRes = await fetch(
          `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${engineId}&q=${query}&num=3&lr=lang_tr`
        );
        if (trRes.ok) {
          const data = await trRes.json();
          const items: any[] = data.items || [];
          for (const item of items) {
            const url: string = item.link || '';
            if (!url || !url.startsWith('http')) continue;
            if (allSources.some(s => s.url === url)) continue;
            
            // Halüsinasyon kapısı: URL doğrulama
            if (!isValidUrl(url)) continue;
            
            // Güvenilirlik kontrolü (admin ayarı)
            const trust = detectSourceTrust(url);
            if (trustFilter && trust === 'low') continue; // Düşük güvenilirlik kaynakları atla
            
            const rawSnippet = typeof item.snippet === 'string' ? item.snippet.trim() : '';
            const dynamicScore = useDynamicSimilarity 
              ? calculateDynamicSimilarity(sentence, rawSnippet || item.title || '')
              : (rawSnippet ? 0.8 : 0.4);
            
            allSources.push({
              url,
              title: item.title || '',
              snippet: rawSnippet,
              matchedSnippet: rawSnippet,
              matchedText: sentence,
              matchGroup,
              region: regionFilter ? detectSourceRegion(url) : undefined,
              trust,
              similarity: dynamicScore
            });
            allMatchedPhrases.push({ text: sentence, source: url, score: dynamicScore });
          }
        } else {
          // B22: sessizce yutma — hatayı say ve anahtarı işaretle (429/403 kota, 400 geçersiz)
          queriesFailed++;
          if (trRes.status === 429 || trRes.status === 403) quotaHit = true;
          await handleSearchApiKeyError(trRes.status);
        }
      } catch { queriesFailed++; }

      // AŞAMA 2: Global kaynak araması (Türkçe sonuç yetersizse)
      if (allSources.length < 2) {
        try {
          queriesRun++;
          const globalRes = await fetch(
            `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${engineId}&q=${query}&num=3`
          );
          if (globalRes.ok) {
            const data = await globalRes.json();
            const items: any[] = data.items || [];
            for (const item of items) {
              const url: string = item.link || '';
              if (!url || !url.startsWith('http')) continue;
              if (allSources.some(s => s.url === url)) continue;
              
              // Halüsinasyon kapısı: URL doğrulama
              if (!isValidUrl(url)) continue;
              
              // Güvenilirlik kontrolü (admin ayarı)
              const trust = detectSourceTrust(url);
              if (trustFilter && trust === 'low') continue;
              
              const rawSnippet = typeof item.snippet === 'string' ? item.snippet.trim() : '';
              const dynamicScore = useDynamicSimilarity 
                ? calculateDynamicSimilarity(sentence, rawSnippet || item.title || '') * 0.9
                : (rawSnippet ? 0.7 : 0.35);
              
              allSources.push({
                url,
                title: item.title || '',
                snippet: rawSnippet,
                matchedSnippet: rawSnippet,
                matchedText: sentence,
                matchGroup,
                region: regionFilter ? detectSourceRegion(url) : undefined,
                trust,
                similarity: dynamicScore
              });
              allMatchedPhrases.push({ text: sentence, source: url, score: dynamicScore });
            }
          } else {
            queriesFailed++;
            if (globalRes.status === 429 || globalRes.status === 403) quotaHit = true;
            await handleSearchApiKeyError(globalRes.status);
          }
        } catch { queriesFailed++; }
      }
    }
  }

  if (customSettings?.userId) {
    try {
      const semanticMatches = await semanticSearch(text, customSettings.userId, 0.82, 5);
      for (const match of semanticMatches) {
        const virtualUrl = `internal://vector/${customSettings.userId}/${match.projectId ?? 'unknown'}/${match.chunkIndex}`;
        if (allSources.some(s => s.url === virtualUrl)) continue;
        allSources.push({
          url: virtualUrl,
          title: 'Geçmiş Proje (Semantik Eşleşme)',
          snippet: match.text.slice(0, 200),
          matchedText: match.text.slice(0, 200),
          matchGroup: 'not_cited_or_quoted',
          region: 'domestic',
          trust: 'high',
          similarity: match.similarity,
        });
        allMatchedPhrases.push({ text: match.text.slice(0, 200), source: virtualUrl, score: match.similarity });
      }
    } catch { }
  }

  const similarityScore = allSources.length > 0
    ? Math.min(95, Math.round((allSources.length / Math.max(sentences.length, 1)) * 100))
    : 0;

  // B22: tüm sorgular patladıysa ve hiç kaynak yoksa 'failed' — UI "özgün" iddiası kuramaz
  const scanStatus: SentinelScanStatus =
    queriesRun > 0 && queriesFailed === queriesRun && allSources.length === 0 ? 'failed' : 'ok';

  if (scanStatus === 'ok') {
    await logSentinelEvent('success', Date.now() - startTime, `Intihal: ${allSources.length} kaynak (${queriesRun} sorgu; ${allSources.filter(s => s.region === 'domestic').length} yerli, ${allSources.filter(s => s.region === 'international').length} yabancı).`);
    await updateSentinelStatus('online', 'Sistem Kararli');
  } else {
    await logSentinelEvent('error', Date.now() - startTime, `Tarama başarısız: ${queriesFailed}/${queriesRun} sorgu hatası${quotaHit ? ' (kota/anahtar)' : ''}.`);
    await updateSentinelStatus(quotaHit ? 'quota_full' : 'error', `Sorgu hatası ${queriesFailed}/${queriesRun}`);
  }
  return { similarityScore, sources: allSources, matchedPhrases: allMatchedPhrases, scanStatus, queriesRun, queriesFailed };
};

export const verifyFactCheck = async (text: string, enabled: boolean = true, retryCount: number = 0): Promise<FactCheckReport> => {
  if (!enabled || !isNetworkAvailable()) return { confidenceScore: 0, claims: [] };
  const startTime = Date.now();
  
  const maxRetries = Math.max(1, apiKeyManager.getActiveKeysCount('gemini'));
  if (retryCount >= maxRetries) {
    return { confidenceScore: 0, claims: [] };
  }

  try {
    const client = getGeminiClient();
    await apiKeyManager.setKeyActivity('gemini', true);
    const model = validateModelName("gemini-2.5-flash");

    const prompt = `Aşağıdaki metindeki önemli iddiaları ayıkla ve Google Search ile internette doğruluklarını kontrol et.
Sadece gerçekliği kanıtlanabilir (sayısal, tarihsel, isme dayalı vb.) 3 iddiayı seç.
Her iddia için durumunu (Verified, False, Unverified, Disputed), güven skorunu (0.0 - 1.0), kaynağı ve açıklamasını belirt.
Sadece geçerli bir JSON objesi dön.

JSON Formatı:
{
  "confidenceScore": 0.85,
  "claims": [
    { 
      "claim": "...", 
      "status": "Verified", 
      "confidence": 0.9, 
      "source": "https://...", 
      "sourceTitle": "...", 
      "explanation": "..." 
    }
  ]
}

Metin:
${text}`;

    const response = await client.models.generateContent({
      model: model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        temperature: 0.1,
        tools: [{ googleSearch: {} }]
      }
    });

    await apiKeyManager.incrementUsage('gemini');
    await apiKeyManager.setKeyActivity('gemini', false);
    
    let parsed;
    try {
      parsed = JSON.parse(response.text || '{}');
    } catch(e) {
      const textResult = (response.text || '').replace(/\`\`\`json|\`\`\`/g, '').trim();
      parsed = JSON.parse(textResult || '{}');
    }
    
    await logSentinelEvent('success', Date.now() - startTime, `Doğruluk: ${(parsed.claims || []).length} iddia.`);
    return {
      confidenceScore: parsed.confidenceScore || 0,
      claims: parsed.claims || []
    };
  } catch (error: any) {
    await apiKeyManager.setKeyActivity('gemini', false);
    const wasHandled = await handleApiKeyError(error);
    if (wasHandled) {
      return verifyFactCheck(text, enabled, retryCount + 1);
    }
    return { confidenceScore: 0, claims: [] };
  }
};
