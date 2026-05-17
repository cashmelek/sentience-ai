import * as tf from "@tensorflow/tfjs";

export interface TextFeatureSet {
  length: number;
  wordCount: number;
  sentenceCount: number;
  syllableCount: number; // Türkçe hece sayısı
  avgWordLength: number;
  punctuationDensity: number;
  burstiness: number; // Cümle boyutu varyasyonu
  perplexity: number; // Kelime çeşitliliği
  ari: number; // Automated Readability Index
  atesman: number; // Ateşman Okunabilirlik Endeksi (Türkçe'ye özel)
  cetinkayaUzun: number; // Çetinkaya-Uzun Okunabilirlik Endeksi (Türkçe'ye özel)
  colemanLiau: number; // Coleman-Liau Index
}

/**
 * Türkçe hece sayısını hesaplar (Ünlü harf sayısına dayanır).
 */
export const countTurkishSyllables = (text: string): number => {
  const vowels = text.match(/[aeıioöuüAEIİOÖUÜ]/g);
  return vowels ? vowels.length : 0;
};

export const extractTextFeatures = (text: string): TextFeatureSet => {
  const normalized = text.trim();
  if (!normalized) {
    return {
      length: 0,
      wordCount: 0,
      sentenceCount: 0,
      syllableCount: 0,
      avgWordLength: 0,
      punctuationDensity: 0,
      burstiness: 0,
      perplexity: 0,
      ari: 0,
      atesman: 0,
      cetinkayaUzun: 0,
      colemanLiau: 0
    };
  }

  const sentences = normalized.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = normalized.split(/\s+/).filter(w => w.length > 0);
  const chars = normalized.replace(/\s/g, '').length;
  const punctuationMatches = normalized.match(/[.,;:!?]/g) ?? [];
  const totalSyllables = countTurkishSyllables(normalized);

  const totalWordChars = words.reduce((sum, w) => sum + w.length, 0);
  const avgWordLength = words.length ? totalWordChars / words.length : 0;
  const punctuationDensity = normalized.length ? punctuationMatches.length / normalized.length : 0;

  // Burstiness: Cümle uzunluklarının standart sapması
  const sentenceLengths = sentences.map(s => s.split(/\s+/).length);
  const avgSentenceLength = sentenceLengths.reduce((a, b) => a + b, 0) / (sentences.length || 1);
  const variance = sentenceLengths.reduce((a, b) => a + Math.pow(b - avgSentenceLength, 2), 0) / (sentences.length || 1);
  const burstiness = Math.sqrt(variance);

  // Perplexity (Simüle): Benzersiz kelime oranı
  const uniqueWords = new Set(words.map(w => w.toLowerCase())).size;
  const perplexity = words.length ? (uniqueWords / words.length) : 0;

  // ARI: 4.71 * (chars/words) + 0.5 * (words/sentences) - 21.43
  const ari = words.length && sentences.length 
    ? 4.71 * (chars / words.length) + 0.5 * (words.length / sentences.length) - 21.43
    : 0;

  // Ateşman Endeksi: 198.825 - 40.175 * (hece/kelime) - 2.610 * (kelime/cümle)
  const atesman = words.length && sentences.length
    ? 198.825 - 40.175 * (totalSyllables / words.length) - 2.610 * (words.length / sentences.length)
    : 0;

  // Çetinkaya-Uzun: 118.823 * (hece/kelime) + 8.121 * (kelime/cümle) - 113.59
  const cetinkayaUzun = words.length && sentences.length
    ? 118.823 * (totalSyllables / words.length) + 8.121 * (words.length / sentences.length) - 113.59
    : 0;

  // Coleman-Liau: 0.0588 * L - 0.296 * S - 15.8
  const L = words.length ? (chars / words.length) * 100 : 0;
  const S = words.length ? (sentences.length / words.length) * 100 : 0;
  const colemanLiau = 0.0588 * L - 0.296 * S - 15.8;

  return {
    length: normalized.length,
    wordCount: words.length,
    sentenceCount: sentences.length,
    syllableCount: totalSyllables,
    avgWordLength,
    punctuationDensity,
    burstiness,
    perplexity,
    ari: Math.max(0, Number(ari.toFixed(2))),
    atesman: Number(atesman.toFixed(2)),
    cetinkayaUzun: Number(cetinkayaUzun.toFixed(2)),
    colemanLiau: Math.max(0, Number(colemanLiau.toFixed(2)))
  };
};

export const buildFeatureTensor = (feature: TextFeatureSet): tf.Tensor2D => {
  return tf.tensor2d([
    [feature.length, feature.avgWordLength, feature.punctuationDensity, feature.burstiness, feature.perplexity, feature.ari, feature.atesman],
  ]);
};

/**
 * Metnin dilini karakter analizi ile tespit eder.
 */
export const detectLanguage = (text: string): 'tr' | 'en' => {
  // Türkçe'ye özgü karakterler
  const turkishChars = /[ğüşıöçĞÜŞİÖÇ]/;
  return turkishChars.test(text) ? 'tr' : 'en';
};

/**
 * Dile göre optimize edilmiş okunabilirlik skoru (0-1).
 */
export const simpleReadabilityScore = (text: string): number => {
  const feature = extractTextFeatures(text);
  const lang = detectLanguage(text);
  
  // 1. Ateşman (Türkçe Odaklı)
  const atesmanNormalized = Math.min(100, Math.max(0, feature.atesman)) / 100;
  
  // 2. Çetinkaya-Uzun (Türkçe Odaklı)
  const cetinkayaNormalized = 1 - (Math.min(100, Math.max(0, feature.cetinkayaUzun)) / 100);

  // 3. ARI (Global Odaklı) - ARI 1-14 arasıdır, 14+ zor kabul edilir
  const ariNormalized = 1 - (Math.min(14, Math.max(1, feature.ari)) / 14);

  // 4. Coleman-Liau (Global Odaklı) - 1-12 arasıdır
  const colemanNormalized = 1 - (Math.min(12, Math.max(1, feature.colemanLiau)) / 12);
  
  const diversityFactor = (feature.perplexity * 0.4 + Math.min(1, feature.burstiness / 30) * 0.6);
  
  let score: number;

  if (lang === 'tr') {
    // Türkçe metinlerde yerel algoritmalara %80 ağırlık
    score = (atesmanNormalized * 0.4 + cetinkayaNormalized * 0.4 + diversityFactor * 0.2);
  } else {
    // Yabancı metinlerde global (ARI/Coleman) algoritmalara %80 ağırlık
    score = (ariNormalized * 0.4 + colemanNormalized * 0.4 + diversityFactor * 0.2);
  }

  return Math.min(1, Math.max(0, Number(score.toFixed(4))));
};
