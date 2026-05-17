import { apiKeyManager } from './apiKeyManager';
import { db, auth } from '../lib/firebase';
import { doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';

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
 * Metni anlamlı cümlelere böler.
 */
export const chunkText = (text: string): string[] => {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  return sentences.map(s => s.trim()).filter(s => s.split(' ').length > 4); 
};

/**
 * Google Custom Search JSON API kullanarak internette tam eşleşme arar.
 */
export const searchInternetForSnippet = async (snippet: string, retryCount = 0): Promise<PlagiarismSource | null> => {
  const { apiKey, engineId } = getSearchConfig();
  if (!apiKey || !engineId || !isNetworkAvailable()) return null;

  const query = `"${snippet}"`;
  const url = `https://customsearch.googleapis.com/customsearch/v1?cx=${engineId}&q=${encodeURIComponent(query)}&key=${apiKey}&num=1`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    markNetworkUp();

    if (response.status === 429 || response.status === 403) {
      if (retryCount < 1 && apiKeyManager.rotateSearchKey()) {
        console.warn("🔄 Sentinel: Kota doldu, anahtar değiştiriliyor...");
        return searchInternetForSnippet(snippet, retryCount + 1);
      }
      await updateSentinelStatus('quota_full', 'Google API Kotası Doldu');
      return null;
    }

    if (!response.ok) return null;
    const data = await response.json();

    // --- SAYAÇ ARTIMI ---
    await apiKeyManager.incrementUsage('google-search');

    if (data.items && data.items.length > 0) {
      const bestMatch = data.items[0];
      return {
        url: bestMatch.link,
        title: bestMatch.title,
        snippet: bestMatch.snippet,
        matchedText: snippet
      };
    }
  } catch (error: any) {
    if (error?.name === 'AbortError' || error?.message?.includes('Failed to fetch')) {
      markNetworkDown();
    }
  }
  return null;
};

/**
 * Tüm metni tarayıp gerçek intihal oranını ve kaynaklarını hesaplar.
 */
export const verifyPlagiarism = async (text: string, enabled: boolean = true): Promise<PlagiarismReport & { matchedPhrases: { text: string, source: string, score: number }[] }> => {
  if (!enabled) return { similarityScore: 0, sources: [], matchedPhrases: [] };
  const startTime = Date.now();
  const chunks = chunkText(text);
  if (chunks.length === 0) return { similarityScore: 0, sources: [], matchedPhrases: [] };

  let matchCount = 0;
  const sources: PlagiarismSource[] = [];
  const matchedPhrases: { text: string, source: string, score: number }[] = [];

  try {
    const targetChunks = [...chunks].sort((a, b) => b.length - a.length).slice(0, 5);
    for (const chunk of targetChunks) {
      const result = await searchInternetForSnippet(chunk);
      if (result) {
        matchCount++;
        matchedPhrases.push({ text: chunk, source: result.url, score: 1 });
        if (!sources.some(s => s.url === result.url)) sources.push(result);
      }
      await new Promise(resolve => setTimeout(resolve, 800)); 
    }

    const similarityScore = Math.round((matchCount / targetChunks.length) * 100);
    await logSentinelEvent('success', Date.now() - startTime, `${targetChunks.length} ifade tarandı.`);
    await updateSentinelStatus('online', 'Sistem Kararlı');
    return { similarityScore, sources, matchedPhrases };
  } catch (error: any) {
    return { similarityScore: 0, sources: [], matchedPhrases: [] };
  }
};

/**
 * Metindeki doğrulanabilir iddiaları ayıklar ve internet üzerinde gerçekliğini denetler.
 */
export const verifyFactCheck = async (text: string, enabled: boolean = true): Promise<FactCheckReport> => {
  const { apiKey, engineId } = getSearchConfig();
  if (!enabled || !apiKey || !engineId || !isNetworkAvailable()) return { confidenceScore: 0, claims: [] };

  const startTime = Date.now();
  try {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const potentialClaims = sentences.map(s => s.trim()).filter(s => s.length > 30 && (/\d+/.test(s) || /[A-Z]/.test(s))).slice(0, 3);
    if (potentialClaims.length === 0) return { confidenceScore: 1, claims: [] };

    const claims: FactCheckClaim[] = [];
    let verifiedCount = 0;

    for (const claimText of potentialClaims) {
      if (!isNetworkAvailable()) break;
      try {
        const url = `https://customsearch.googleapis.com/customsearch/v1?cx=${engineId}&q=${encodeURIComponent(claimText)}&key=${apiKey}&num=3`;
        const response = await fetch(url);
        markNetworkUp();
        if (response.status === 429 || response.status === 403) {
           if (apiKeyManager.rotateSearchKey()) continue; 
           break;
        }
        const data = await response.json();
        
        // --- SAYAÇ ARTIMI ---
        await apiKeyManager.incrementUsage('google-search');

        if (data.items && data.items.length > 0) {
          const source = data.items[0];
          claims.push({ claim: claimText, status: 'Verified', confidence: 0.85, source: source.link, sourceTitle: source.title, explanation: "Kaynak eşleşti." });
          verifiedCount++;
        } else {
          claims.push({ claim: claimText, status: 'Unverified', confidence: 0.5, explanation: "Kaynak bulunamadı." });
        }
      } catch { break; }
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    await logSentinelEvent('success', Date.now() - startTime, `Doğruluk: ${claims.length} iddia.`);
    return { confidenceScore: claims.length > 0 ? (verifiedCount / claims.length) : 1, claims };
  } catch { return { confidenceScore: 0, claims: [] }; }
};
