import { extractTextFeatures } from './textFeatures';

export interface WorkerRequest {
  id: string;
  type: 'ANALYZE_FEATURES' | 'DEEP_ML_ANALYSIS';
  text: string;
}

export interface WorkerResponse {
  id: string;
  success: boolean;
  data?: any;
  error?: string;
}

const countSyllables = (word: string): number => {
  const count = word.match(/[aeıioöuüAEIİOÖUÜ]/g)?.length || 0;
  return Math.max(1, count);
};

const runDeepAnalysis = (text: string) => {
  const words = text.trim().split(/\s+/).filter(w => w.length > 0);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const features = extractTextFeatures(text);
  const wordCount = features.wordCount;
  const sentenceCount = features.sentenceCount;
  const syllableCount = features.syllableCount;
  const avgWordLength = features.avgWordLength;
  const avgSyllablesPerWord = wordCount ? syllableCount / wordCount : 0;
  const atesman = Math.round(features.atesman);
  const cetinkayaUzun = Math.round(features.cetinkayaUzun);
  const bezirciYilmaz = features.bezirciYilmaz;
  const lix = features.lix;
  const rix = features.rix;

  const recommendations = [];

  const longSentences = sentences.filter(s => s.split(/\s+/).length > 20);
  if (longSentences.length > 0) {
    longSentences.forEach(sentence => {
      const start = text.indexOf(sentence);
      if (start !== -1) {
        recommendations.push({
          text: "Cümle çok uzun, daha kısa yapılar tercih edin.",
          type: 'long_sentence' as const,
          position: {
            start,
            end: start + sentence.length,
            text: sentence.substring(0, 50) + (sentence.length > 50 ? '...' : '')
          }
        });
      }
    });
  }

  if (atesman < 50) {
    recommendations.push({
      text: "Okunabilirlik düşük, daha sade bir dil kullanın.",
      type: 'low_readability' as const
    });
  }

  const complexWords = words.filter(w => countSyllables(w) > 3);
  if (bezirciYilmaz > 14) {
    recommendations.push({
      text: "Metinde 5-6+ heceli eklemeli sözcük yoğunluğu yüksek (Bezirci-Yılmaz Seviyesi: " + bezirciYilmaz + "); akıcılık için sadeleştirilebilir.",
      type: 'complex_words' as const
    });
  }
  if (complexWords.length > 5) {
    recommendations.push({
      text: "Kelime karmaşıklığı yüksek, daha yaygın kelimeler seçin.",
      type: 'complex_words' as const
    });
  }

  return {
    readabilityScore: Math.min(1, Math.max(0, atesman / 100)),
    complexityIndex: avgSyllablesPerWord / 5,
    metrics: {
      wordCount,
      sentenceCount,
      syllableCount,
      avgWordLength,
      atesman,
      cetinkayaUzun,
      bezirciYilmaz,
      lix,
      rix
    },
    recommendations
  };
};

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const { id, type, text } = e.data;
  try {
    if (type === 'ANALYZE_FEATURES') {
      const data = extractTextFeatures(text);
      self.postMessage({ id, success: true, data });
    } else if (type === 'DEEP_ML_ANALYSIS') {
      const data = runDeepAnalysis(text);
      self.postMessage({ id, success: true, data });
    } else {
      self.postMessage({ id, success: false, error: 'Bilinmeyen işlem tipi' });
    }
  } catch (err: any) {
    self.postMessage({ id, success: false, error: err?.message || 'Hesaplama hatası' });
  }
};
