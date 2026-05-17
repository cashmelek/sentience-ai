/**
 * Sentience AI - Makine Öğrenmesi Servisi
 * Bu servis metin analizi, özellik çıkarımı ve yerel model yönetimini sağlar.
 */

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
  recommendations: string[];
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
export const performDeepMLAnalysis = async (text: string): Promise<MLAnalysisResult> => {
  const words = text.trim().split(/\s+/).filter(w => w.length > 0);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  // Basit hece sayımı (Türkçe için sesli harf bazlı)
  const vowels = "aeıioöuüAEIİOÖUÜ";
  let syllableCount = 0;
  for (let char of text) {
    if (vowels.includes(char)) syllableCount++;
  }

  const wordCount = words.length;
  const sentenceCount = sentences.length;
  const avgWordLength = words.reduce((acc, w) => acc + w.length, 0) / (wordCount || 1);

  // Ateşman Okunabilirlik Formülü (Türkçe için)
  // 199.5 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord)
  const avgSentenceLength = wordCount / (sentenceCount || 1);
  const avgSyllablesPerWord = syllableCount / (wordCount || 1);
  const atesman = Math.round(199.5 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord));

  // Çetinkaya-Uzun Okunabilirlik (Türkçe için alternatif)
  const cetinkayaUzun = Math.round(avgSentenceLength + (avgSyllablesPerWord * 10));

  const recommendations = [];
  if (avgSentenceLength > 20) recommendations.push("Cümleler çok uzun, daha kısa yapılar tercih edin.");
  if (atesman < 50) recommendations.push("Okunabilirlik düşük, daha sade bir dil kullanın.");
  if (avgSyllablesPerWord > 3) recommendations.push("Kelime karmaşıklığı yüksek, daha yaygın kelimeler seçin.");

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
