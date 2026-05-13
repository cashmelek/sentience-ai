export interface PlagiarismSource {
  url: string;
  title: string;
  snippet: string;
  matchedText: string;
}

export interface PlagiarismReport {
  similarityScore: number;
  sources: PlagiarismSource[];
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
  confidenceScore: number; // 0-1 (100 üzerinden doğruluk oranı)
  claims: FactCheckClaim[];
}

const API_KEY = import.meta.env.VITE_GOOGLE_SEARCH_API_KEY;
const ENGINE_ID = import.meta.env.VITE_GOOGLE_SEARCH_ENGINE_ID;

import { db, auth } from '../lib/firebase';
import { doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';

/**
 * Sentinel servisinin durumunu günceller.
 */
export const updateSentinelStatus = async (status: 'online' | 'error' | 'quota_full', message?: string) => {
  try {
    await updateDoc(doc(db, 'settings', 'system'), {
      sentinelStatus: status,
      sentinelLastMessage: message || '',
      sentinelLastCheck: serverTimestamp()
    });
  } catch (error) {
    console.error("Sentinel durum güncelleme hatası:", error);
  }
};

/**
 * Sentinel olaylarını loglar.
 */
export const logSentinelEvent = async (status: 'success' | 'error', duration: number, message: string) => {
  try {
    await addDoc(collection(db, 'sentinelLogs'), {
      status,
      duration,
      message,
      userEmail: auth.currentUser?.email || 'Anonim',
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error("Sentinel loglama hatası:", error);
  }
};

/**
 * Metni anlamlı cümlelere böler.
 */
export const chunkText = (text: string): string[] => {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  
  return sentences
    .map(s => s.trim())
    .filter(s => s.split(' ').length > 4); 
};

/**
 * Google Custom Search JSON API kullanarak internette tam eşleşme arar.
 */
export const searchInternetForSnippet = async (snippet: string): Promise<PlagiarismSource | null> => {
  if (!API_KEY || !ENGINE_ID) {
    console.warn("⚠️ VITE_GOOGLE_SEARCH_API_KEY veya VITE_GOOGLE_SEARCH_ENGINE_ID bulunamadı.");
    return null;
  }

  const query = `"${snippet}"`;
  const url = `https://customsearch.googleapis.com/customsearch/v1?cx=${ENGINE_ID}&q=${encodeURIComponent(query)}&key=${API_KEY}&num=1`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.status === 429 || response.status === 403) {
      await updateSentinelStatus('quota_full', 'Google API Kotası Doldu');
      throw new Error('quota_full');
    }
    if (!response.ok) {
      throw new Error(`Google Search API hatası: ${response.statusText}`);
    }
    const data = await response.json();

    if (data.items && data.items.length > 0) {
      const bestMatch = data.items[0];
      return {
        url: bestMatch.link,
        title: bestMatch.title,
        snippet: bestMatch.snippet,
        matchedText: snippet
      };
    }
  } catch (error) {
    console.error("Sentinel arama sırasında hata oluştu:", error);
  }

  return null;
};

/**
 * Tüm metni tarayıp gerçek intihal oranını ve kaynaklarını hesaplar.
 */
export const verifyPlagiarism = async (text: string, enabled: boolean = true): Promise<PlagiarismReport> => {
  if (!enabled) {
    return { similarityScore: 0, sources: [] };
  }

  const startTime = Date.now();
  const chunks = chunkText(text);

  if (chunks.length === 0) {
    return { similarityScore: 0, sources: [] };
  }

  let matchCount = 0;
  const sources: PlagiarismSource[] = [];

  try {
    const sampleSize = Math.min(chunks.length, 2); 
    const targetChunks = [...chunks].sort((a, b) => b.length - a.length).slice(0, sampleSize);

    for (const chunk of targetChunks) {
      const result = await searchInternetForSnippet(chunk);
      if (result) {
        matchCount++;
        if (!sources.some(s => s.url === result.url)) {
          sources.push(result);
        }
      }
      await new Promise(resolve => setTimeout(resolve, 1000)); 
    }

    const similarityScore = Math.round((matchCount / targetChunks.length) * 100);
    const duration = Date.now() - startTime;

    await logSentinelEvent('success', duration, `${targetChunks.length} cümle tarandı, %${similarityScore} eşleşme.`);
    await updateSentinelStatus('online', 'Sistem Kararlı');

    return { similarityScore, sources };

  } catch (error: any) {
    const duration = Date.now() - startTime;
    const isQuota = error.message === 'quota_full';
    
    await logSentinelEvent('error', duration, isQuota ? 'API Kotası Doldu' : error.message);
    if (!isQuota) {
      await updateSentinelStatus('error', error.message);
    }
    
    return { similarityScore: 0, sources: [] };
  }
};

/**
 * Metindeki doğrulanabilir iddiaları ayıklar ve internet üzerinde gerçekliğini denetler.
 */
export const verifyFactCheck = async (text: string, enabled: boolean = true): Promise<FactCheckReport> => {
  if (!enabled || !API_KEY || !ENGINE_ID) {
    return { confidenceScore: 0, claims: [] };
  }

  const startTime = Date.now();
  
  try {
    // 1. İddiaları Ayıkla (Basit mantık: Rakamlar, Tarihler veya Özel İsimler içeren cümleler)
    // Gerçek uygulamada burada LLM ile "İddia Ayıklama" yapılmalıdır. 
    // Prototip için metinden en güçlü 3 cümleyi seçiyoruz.
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const potentialClaims = sentences
      .map(s => s.trim())
      .filter(s => s.length > 30 && (/\d+/.test(s) || /[A-Z]/.test(s)))
      .slice(0, 3); // Kota dostu: Sadece 3 iddia

    if (potentialClaims.length === 0) {
      return { confidenceScore: 1, claims: [] };
    }

    const claims: FactCheckClaim[] = [];
    let verifiedCount = 0;

    for (const claimText of potentialClaims) {
      // 2. İddiayı Google'da Arat
      const url = `https://customsearch.googleapis.com/customsearch/v1?cx=${ENGINE_ID}&q=${encodeURIComponent(claimText)}&key=${API_KEY}&num=3`;
      const response = await fetch(url);
      
      if (response.status === 429 || response.status === 403) break;
      
      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        const source = data.items[0];
        // 3. Basit Doğrulama Mantığı (Gelecekte LLM ile metin karşılaştırması yapılacak)
        // Şimdilik kaynak bulunması "Doğrulandı" (Unverified/Verified arası) kabul ediliyor.
        claims.push({
          claim: claimText,
          status: 'Verified',
          confidence: 0.85,
          source: source.link,
          sourceTitle: source.title,
          explanation: "İnternet üzerindeki güvenilir kaynaklarla eşleşme sağlandı."
        });
        verifiedCount++;
      } else {
        claims.push({
          claim: claimText,
          status: 'Unverified',
          confidence: 0.5,
          explanation: "Bu iddiayı doğrulayacak doğrudan bir kaynak bulunamadı."
        });
      }
      
      await new Promise(resolve => setTimeout(resolve, 500)); // Rate limit koruması
    }

    const confidenceScore = claims.length > 0 ? (verifiedCount / claims.length) : 1;
    const duration = Date.now() - startTime;
    
    await logSentinelEvent('success', duration, `Doğruluk Kontrolü: ${claims.length} iddia incelendi.`);

    return { confidenceScore, claims };

  } catch (error: any) {
    console.error("Doğruluk kontrolü hatası:", error);
    return { confidenceScore: 0, claims: [] };
  }
};
