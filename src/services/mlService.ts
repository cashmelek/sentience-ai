/**
 * Sentience AI - Makine Öğrenmesi Servisi
 * Bu servis metin analizi, özellik çıkarımı ve yerel model yönetimini sağlar.
 */

import { extractTextFeatures } from '../ml/textFeatures';

export interface MLAnalysisResult {
  readabilityScore: number;
  complexityIndex: number;
  metrics: {
    wordCount: number;
    sentenceCount: number;
    syllableCount: number;
    avgWordLength: number;
    atesman: number;
    cetinkayaUzun: number;
  };
  recommendations: {
    text: string;
    type: 'long_sentence' | 'low_readability' | 'complex_words' | 'general';
    position?: {
      start: number;
      end: number;
      text: string;
    };
  }[];
}

/**
 * Metnin kalitesini ve makine öğrenmesi eğitimine uygunluğunu hesaplar.
 */
export const calculateQualityScore = (
  originalText: string,
  humanizedText: string,
  aiScore: number,
  metrics: any
): { score: number; isTrainingReady: boolean; reason: string } => {
  let score = 0;
  let reasons = [];

  // 1. Uzunluk Kontrolü (Minimum 200 karakter)
  const length = originalText.length;
  if (length > 200) {
    score += 30;
  } else if (length > 100) {
    score += 15;
  } else {
    reasons.push("Metin çok kısa");
  }

  // 2. Başarı Oranı (AI Skoru ne kadar düşükse o kadar iyi - Fine-tuning için kritik)
  if (aiScore <= 0.10) {
    score += 40;
  } else if (aiScore <= 0.20) {
    score += 25;
  } else if (aiScore <= 0.40) {
    score += 10;
  } else {
    reasons.push("YZ izi hala çok belirgin");
  }

  // 3. Metrik Tutarlılığı (Okunabilirlik)
  if (metrics && metrics.readability > 0.4 && metrics.readability < 0.95) {
    score += 30;
  } else {
    reasons.push("Okunabilirlik değerleri doğal değil");
  }

  // 4. Dönüşüm Kalitesi (Metin çok fazla kısalmamalı veya uzamamalı)
  const ratio = humanizedText.length / (originalText.length || 1);
  if (ratio < 0.5 || ratio > 2.0) {
    score -= 20;
    reasons.push("Metin yapısı aşırı bozulmuş");
  }

  const isTrainingReady = score >= 70;

  return {
    score: Math.max(0, score),
    isTrainingReady,
    reason: isTrainingReady ? "Eğitim için yüksek kaliteli örnek" : reasons.join(", ")
  };
};

/**
 * Yerel modelleri kullanarak derin metin analizi yapar.
 */
const countSyllables = (word: string): number => {
  const vowels = "aeıioöuüAEIİOÖUÜ";
  let count = 0;
  for (let char of word) {
    if (vowels.includes(char)) count++;
  }
  return Math.max(1, count);
};

export const performDeepMLAnalysis = async (text: string): Promise<MLAnalysisResult> => {
  const words = text.trim().split(/\s+/).filter(w => w.length > 0);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

  // Okunabilirlik endeksleri tek kanonik kaynaktan (textFeatures) alınır — kartlar arasında tutarsızlık oluşmaz.
  const features = extractTextFeatures(text);
  const wordCount = features.wordCount;
  const sentenceCount = features.sentenceCount;
  const syllableCount = features.syllableCount;
  const avgWordLength = features.avgWordLength;
  const avgSyllablesPerWord = wordCount ? syllableCount / wordCount : 0;
  const atesman = Math.round(features.atesman);
  const cetinkayaUzun = Math.round(features.cetinkayaUzun);

  const recommendations = [];
  
  // Uzun cümleleri tespit et ve konum bilgisi ekle
  const longSentences = sentences.filter(s => s.split(/\s+/).length > 20);
  if (longSentences.length > 0) {
    longSentences.forEach(sentence => {
      const start = text.indexOf(sentence);
      if (start !== -1) {
        recommendations.push({
          text: "Cümle çok uzun, daha kısa yapılar tercih edin.",
          type: 'long_sentence',
          position: {
            start,
            end: start + sentence.length,
            text: sentence.substring(0, 50) + (sentence.length > 50 ? '...' : '')
          }
        });
      }
    });
  }
  
  // Okunabilirlik düşükse genel öneri
  if (atesman < 50) {
    recommendations.push({
      text: "Okunabilirlik düşük, daha sade bir dil kullanın.",
      type: 'low_readability'
    });
  }
  
  // Karmaşık kelimeleri tespit et
  const complexWords = words.filter(w => countSyllables(w) > 3);
  if (complexWords.length > 5) {
    recommendations.push({
      text: "Kelime karmaşıklığı yüksek, daha yaygın kelimeler seçin.",
      type: 'complex_words'
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
      cetinkayaUzun
    },
    recommendations
  };
};

/**
 * Anonimleştirilmiş sistem geri bildirimi gönderir.
 */
export const sendAnonymousFeedback = async (
  originalLength: number, 
  humanizedLength: number, 
  finalAiScore: number,
  tone: string
) => {
  console.log('[ML Feedback]', {
    ts: new Date().toISOString(),
    gain: originalLength - humanizedLength,
    success: finalAiScore < 0.2,
    tone
  });
};
