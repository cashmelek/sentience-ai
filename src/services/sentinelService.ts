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

const API_KEY = import.meta.env.VITE_GOOGLE_SEARCH_API_KEY;
const ENGINE_ID = import.meta.env.VITE_GOOGLE_SEARCH_ENGINE_ID;

import { db } from '../lib/firebase';
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
 * Sentinel olaylarını loglar (Gizlilik gereği metin içeriği alınmaz).
 */
export const logSentinelEvent = async (status: 'success' | 'error', duration: number, message: string) => {
  try {
    await addDoc(collection(db, 'sentinelLogs'), {
      status,
      duration,
      message,
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
  // Nokta, ünlem, soru işareti gibi işaretlerden böl
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  
  return sentences
    .map(s => s.trim())
    // Sadece belirli bir uzunluğun üzerindeki anlamlı cümleleri al (çok kısa kelimeleri arama yapma)
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

  // Tırnak işaretleri arasına alarak "tam eşleşme" (exact match) araması yapıyoruz
  const query = `"${snippet}"`;
  const url = `https://customsearch.googleapis.com/customsearch/v1?cx=${ENGINE_ID}&q=${encodeURIComponent(query)}&key=${API_KEY}&num=1`;

  try {
    const response = await fetch(url);
    if (response.status === 429) {
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
    const sampleSize = Math.min(chunks.length, 5); 
    const targetChunks = [...chunks].sort((a, b) => b.length - a.length).slice(0, sampleSize);

    for (const chunk of targetChunks) {
      const result = await searchInternetForSnippet(chunk);
      if (result) {
        matchCount++;
        if (!sources.some(s => s.url === result.url)) {
          sources.push(result);
        }
      }
      await new Promise(resolve => setTimeout(resolve, 500)); 
    }

    const similarityScore = Math.round((matchCount / targetChunks.length) * 100);
    const duration = Date.now() - startTime;

    // Başarılı işlemi logla ve durumu güncelle
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
