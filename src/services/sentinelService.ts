import { apiKeyManager } from './apiKeyManager';
import { db, auth } from '../lib/firebase';
import { doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getGeminiClient, validateModelName, handleApiKeyError } from './geminiService';
import { semanticSearch, generateEmbedding } from './vectorService';
import { vectorEngine } from './vectorEngine';
import { AcademicSearchService } from './academicSearchService';

export type MatchGroup =
  | 'not_cited_or_quoted'
  | 'missing_quotations'
  | 'missing_citation'
  | 'cited_and_quoted'
  | 'peer_match'
  | 'self_plagiarism'
  | 'internal_generator';

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
  semanticScore?: number;
}

export interface AcademicCompliance {
  isCompliant: boolean;
  maxPlagiarismRate: number;
  perSourceLimit: number;
  violations: string[];
}

export interface PlagiarismReport {
  similarityScore: number;
  sources: PlagiarismSource[];
  academicCompliance?: AcademicCompliance;
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
  
  if (originalLower.includes(snippetLower)) {
    return 1.0;
  }
  
  const STOPWORDS = new Set(['ve', 'veya', 'ile', 'için', 'bir', 'her', 'bu', 'şu', 'o', 'da', 'de', 'ise', 'gibi', 'kadar', 'en', 'daha', 'çok', 'ama', 'fakat', 'ancak', 'zira', 'çünkü', 'dolayısıyla', 'olarak']);
  const originalWords = originalLower.split(/\s+/).filter(w => !STOPWORDS.has(w) && w.length > 2);
  const snippetWords = snippetLower.split(/\s+/).filter(w => !STOPWORDS.has(w) && w.length > 2);
  
  if (snippetWords.length === 0) return 0;
  const intersection = snippetWords.filter(w => originalWords.includes(w));
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
    maxPlagiarismRate?: number;
    perSourceLimit?: number;
    academicCrossCheck?: {
      crossref?: boolean;
      semanticScholar?: boolean;
      pubmed?: boolean;
      core?: boolean;
    };
    embeddingProvider?: 'cloud' | 'local' | 'browser';
    embeddingThreshold?: number;
    userId?: string;
  }
): Promise<PlagiarismReport & PlagiarismScanMeta & { matchedPhrases: { text: string, source: string, score: number }[] }> => {
  if (!enabled) return { similarityScore: 0, sources: [], matchedPhrases: [], scanStatus: 'disabled', queriesRun: 0, queriesFailed: 0 };
  if (!isNetworkAvailable()) return { similarityScore: 0, sources: [], matchedPhrases: [], scanStatus: 'offline', queriesRun: 0, queriesFailed: 0 };
  const startTime = Date.now();

  const searchPhrasesCount = customSettings?.searchPhrasesCount || 10;
  const minWordCount = customSettings?.minWordCount || 8;
  const useDynamicSimilarity = customSettings?.useDynamicSimilarity !== false;
  const trustFilter = customSettings?.trustFilter !== false;
  const regionFilter = customSettings?.regionFilter !== false;

  const sentences = chunkText(text).slice(0, searchPhrasesCount);
  const allSources: PlagiarismSource[] = [];
  const allMatchedPhrases: { text: string, source: string, score: number }[] = [];

  let queriesRun = 0;
  let queriesFailed = 0;
  let quotaHit = false;

  for (const sentence of sentences) {
    const words = sentence.trim().split(/\s+/);
    if (words.length < minWordCount) continue;

    const isQuoted = /["""'].*?["""']/.test(sentence) || /[\u201C\u201D\u2018\u2019]/.test(sentence);
    const hasCitation = /(\(\d{4}\)|\[\d+\]|(et al\.)|(doi:)|https?:\/\/)/.test(sentence);

    const matchGroup: MatchGroup =
      isQuoted && hasCitation ? 'cited_and_quoted' :
      isQuoted && !hasCitation ? 'missing_citation' :
      !isQuoted && hasCitation ? 'missing_quotations' :
      'not_cited_or_quoted';

    try {
      const client = getGeminiClient();
      const groundingModels = ['gemini-2.5-flash', 'gemini-3.8-flash', 'gemini-2.5-flash-lite', 'gemini-3.1-flash-lite'];
      let groundingDone = false;
      for (const gModel of groundingModels) {
        if (groundingDone) break;
          try {
            queriesRun++;
            const prompt = `Sen Sentinel İntihal ve Akademik Kaynak Doğrulama motorusun.
Aşağıdaki cümle veya metin kesitini Google Search ile internette ara. Bu metnin veya içindeki alıntıların geçtiği orijinal makale, tez, kitap veya web kaynaklarını bul.
Sadece gerçekten mevcut ve erişilebilir kaynakları listele. Uydurma URL üretme.

SADECE geçerli JSON döndür:
{"sources":[{"url":"https://...","title":"...","snippet":"...","matchedText":"...","matchGroup":"not_cited_or_quoted","similarity":0.7}]}

Metin: ${sentence.slice(0, 300)}`;

            const gRes = await client.models.generateContent({
              model: gModel,
              contents: [{ role: 'user', parts: [{ text: prompt }] }],
              config: { temperature: 0, tools: [{ googleSearch: {} }] }
            });

            const chunks = (gRes.candidates?.[0]?.groundingMetadata?.groundingChunks || []) as any[];
            const chunkSources = chunks
              .filter((c: any) => c.web?.uri && isValidUrl(c.web.uri))
              .map((c: any) => ({
                url: c.web.uri as string,
                title: c.web.title || 'Web Kaynağı',
                snippet: '',
                matchedSnippet: '',
                matchedText: sentence,
                matchGroup,
                region: regionFilter ? detectSourceRegion(c.web.uri) : undefined,
                trust: detectSourceTrust(c.web.uri),
                similarity: 0.7
              } as PlagiarismSource));

            let textSources: PlagiarismSource[] = [];
            const raw = (gRes.text || '').replace(/```json|```/g, '').trim();
            if (raw.startsWith('{')) {
              try {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed.sources)) {
                  textSources = parsed.sources
                    .filter((s: any) => s.url && isValidUrl(s.url))
                    .map((s: any) => ({
                      url: s.url,
                      title: s.title || 'Web Kaynağı',
                      snippet: s.snippet || '',
                      matchedSnippet: s.snippet || '',
                      matchedText: s.matchedText || sentence,
                      matchGroup: s.matchGroup || matchGroup,
                      region: regionFilter ? detectSourceRegion(s.url) : undefined,
                      trust: detectSourceTrust(s.url),
                      similarity: typeof s.similarity === 'number' ? s.similarity : 0.7
                    } as PlagiarismSource));
                }
              } catch { }
            }

            const combined = [...chunkSources, ...textSources];
            for (const src of combined) {
              if (allSources.some(s => s.url === src.url)) continue;
              if (trustFilter && src.trust === 'low') continue;
              allSources.push(src);
              allMatchedPhrases.push({ text: sentence, source: src.url, score: src.similarity || 0.7 });
            }
            groundingDone = true;
          } catch (gErr: any) {
            queriesFailed++;
          }
        }
        if (!groundingDone) quotaHit = true;
      } catch { queriesFailed++; }
    }

  // Akademik Havuz Araması (OpenAlex, Crossref, Google Scholar CSE)
  const enableAcademicPool = customSettings?.academicCrossCheck?.crossref !== false;
  if (enableAcademicPool && sentences.length > 0) {
    try {
      const topAcademicQuery = sentences[0].slice(0, 90);
      const academicResults = await AcademicSearchService.multiAcademicSearch(topAcademicQuery);

      for (const aRes of academicResults) {
        if (!aRes.url || allSources.some(s => s.url === aRes.url)) continue;
        const dynamicScore = calculateDynamicSimilarity(sentences[0], aRes.snippet);

        allSources.push({
          url: aRes.url,
          title: `[${aRes.source.toUpperCase()}] ${aRes.title}`,
          snippet: aRes.snippet,
          matchedSnippet: aRes.snippet,
          matchedText: sentences[0],
          matchGroup: 'not_cited_or_quoted',
          region: (aRes.source === 'crossref' || aRes.source === 'openalex' || aRes.source === 'europepmc' || aRes.source === 'semanticscholar' || aRes.source === 'arxiv' || aRes.source === 'core') ? 'academic' : 'domestic',
          trust: 'high',
          similarity: dynamicScore
        });
        allMatchedPhrases.push({ text: sentences[0], source: aRes.url, score: dynamicScore });
      }
    } catch (aErr) {
      console.warn('[Sentinel] Akademik havuz taraması hatası:', aErr);
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
          title: 'Geçmiş Proje (Öz-İntihal / Semantik)',
          snippet: match.text.slice(0, 200),
          matchedText: match.text.slice(0, 200),
          matchGroup: 'self_plagiarism',
          region: 'domestic',
          trust: 'high',
          similarity: match.similarity,
        });
        allMatchedPhrases.push({ text: match.text.slice(0, 200), source: virtualUrl, score: match.similarity });
      }
    } catch { }
  }

  // Semantik Yeniden Sıralama (Re-Ranking & Semantic Verification)
  const embeddingProvider = customSettings?.embeddingProvider || 'cloud';
  const embeddingThreshold = customSettings?.embeddingThreshold ?? 0.70;

  if (allSources.length > 0) {
    try {
      const sentenceVecCache = new Map<string, number[]>();

      for (const src of allSources) {
        if (!src.snippet || !src.matchedText) continue;

        let sentVec = sentenceVecCache.get(src.matchedText);
        if (!sentVec) {
          sentVec = await generateEmbedding(src.matchedText, embeddingProvider);
          sentenceVecCache.set(src.matchedText, sentVec);
        }

        const snippetVec = await generateEmbedding(src.snippet, embeddingProvider);
        const semScore = vectorEngine.cosineSimilarity(sentVec, snippetVec);
        src.semanticScore = Math.round(semScore * 100);

        // Dil Uyum Filtresi: Türkçe metin için yabancı dildeki alakasız kaynakların elenmesi
        const isTurkishSentence = /[çğıöşüÇĞİÖŞÜ]/.test(src.matchedText);
        const isForeignSnippet = !/[çğıöşüÇĞİÖŞÜ]/.test(src.snippet) && /^[a-zA-Z0-9\s,.:;()'"-]+$/.test(src.snippet.slice(0, 50));
        if (isTurkishSentence && isForeignSnippet && semScore < 0.50) {
          src.similarity = 0.05;
          continue;
        }

        if (semScore >= embeddingThreshold && (src.similarity ?? 0) < semScore) {
          src.similarity = Number(semScore.toFixed(2));
        }
      }

      // Çok düşük semantik benzerliğe sahip yanlış pozitifleri filtrele
      const validSources = allSources.filter(s => (s.similarity ?? 0) > 0.15);
      if (validSources.length > 0) {
        allSources.length = 0;
        allSources.push(...validSources);
      }
    } catch (embErr) {
      console.warn('[Sentinel] Semantik doğrulama sırasında hata, kelime benzerliği korundu:', embErr);
    }
  }

  const similarityScore = allSources.length > 0
    ? Math.min(95, Math.round((allSources.length / Math.max(sentences.length, 1)) * 100))
    : 0;

  const scanStatus: SentinelScanStatus =
    queriesRun > 0 && queriesFailed === queriesRun && allSources.length === 0 ? 'failed' : 'ok';

  const maxPlagiarismRate = customSettings?.maxPlagiarismRate || 15;
  const perSourceLimit = customSettings?.perSourceLimit || 3;
  const violations: string[] = [];

  if (similarityScore > maxPlagiarismRate) {
    violations.push(`Genel benzerlik (%${similarityScore}), azami %${maxPlagiarismRate} limitini aşıyor.`);
  }

  const sourceFrequencies: Record<string, number> = {};
  allMatchedPhrases.forEach(m => {
    sourceFrequencies[m.source] = (sourceFrequencies[m.source] || 0) + 1;
  });
  Object.entries(sourceFrequencies).forEach(([src, count]) => {
    const contributionPercent = Math.round((count / Math.max(sentences.length, 1)) * 100);
    if (contributionPercent > perSourceLimit) {
      violations.push(`"${src.slice(0, 35)}..." kaynağından tekil benzerlik (%${contributionPercent}), azami %${perSourceLimit} limitini aşıyor.`);
    }
  });

  const academicCompliance: AcademicCompliance = {
    isCompliant: violations.length === 0,
    maxPlagiarismRate,
    perSourceLimit,
    violations
  };

  if (scanStatus === 'ok') {
    await logSentinelEvent('success', Date.now() - startTime, `Intihal: ${allSources.length} kaynak (${queriesRun} sorgu; ${allSources.filter(s => s.region === 'domestic').length} yerli, ${allSources.filter(s => s.region === 'international').length} yabancı). Uyum: ${academicCompliance.isCompliant ? 'Geçti' : 'İhlal'}`);
    await updateSentinelStatus('online', 'Sistem Kararlı');
  } else {
    await logSentinelEvent('error', Date.now() - startTime, `Tarama başarısız: ${queriesFailed}/${queriesRun} sorgu hatası${quotaHit ? ' (kota/anahtar)' : ''}.`);
    await updateSentinelStatus(quotaHit ? 'quota_full' : 'error', `Sorgu hatası ${queriesFailed}/${queriesRun}`);
  }
  return { similarityScore, sources: allSources, matchedPhrases: allMatchedPhrases, scanStatus, queriesRun, queriesFailed, academicCompliance };
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
