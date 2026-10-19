import type { Tensor2D } from "@tensorflow/tfjs";

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

  // Kanonik Türkçe okunabilirlik endeksleri — TEK DOĞRU KAYNAK (mlService de burayı kullanır).
  // Kaynak: Ateşman (1997) ve Çetinkaya & Uzun (2010); MEB okunabilirlik kılavuzu ile birebir.
  //   OCU = kelime/cümle (ortalama cümle uzunluğu), OKU = hece/kelime (ortalama kelime uzunluğu)
  const kelimePerCumle = words.length / sentences.length;
  const hecePerKelime = totalSyllables / words.length;

  // Ateşman: 199.5 - 1.015 * (kelime/cümle) - 84.6 * (hece/kelime)
  const atesman = words.length && sentences.length
    ? 199.5 - 1.015 * kelimePerCumle - 84.6 * hecePerKelime
    : 0;

  // Çetinkaya-Uzun: 118.823 - 25.987 * (hece/kelime) - 0.971 * (kelime/cümle)
  const cetinkayaUzun = words.length && sentences.length
    ? 118.823 - 25.987 * hecePerKelime - 0.971 * kelimePerCumle
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

export const buildFeatureTensor = async (feature: TextFeatureSet): Promise<Tensor2D> => {
  const tf = await import("@tensorflow/tfjs");
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

export interface IntegrityFlagDetail {
  type: 'homoglyph' | 'hidden_char';
  char: string;
  codePoint: string;
  index: number;
  word?: string;
  expected?: string;
}

export interface IntegrityReport {
  isClean: boolean;
  totalFlags: number;
  hasHomoglyphs: boolean;
  homoglyphCount: number;
  hasHiddenChars: boolean;
  hiddenCharCount: number;
  details: IntegrityFlagDetail[];
  sanitizedText: string;
}

const HOMOGLYPH_MAP: Record<string, string> = {
  '\u0430': 'a', '\u0435': 'e', '\u043E': 'o', '\u0440': 'p', '\u0441': 'c',
  '\u0443': 'y', '\u0445': 'x', '\u0456': 'i', '\u0458': 'j', '\u0455': 's',
  '\u0410': 'A', '\u0412': 'B', '\u0415': 'E', '\u041A': 'K', '\u041C': 'M',
  '\u041D': 'H', '\u041E': 'O', '\u0420': 'P', '\u0421': 'C', '\u0422': 'T',
  '\u0425': 'X', '\u03BF': 'o', '\u03BD': 'v', '\u0391': 'A', '\u0392': 'B',
  '\u0395': 'E', '\u0397': 'H', '\u0399': 'I', '\u039A': 'K', '\u039C': 'M',
  '\u039D': 'N', '\u039F': 'O', '\u03A1': 'P', '\u03A4': 'T', '\u03A7': 'X'
};

const HIDDEN_CHARS_SET = new Set([
  0x200B,
  0x200C,
  0x200D,
  0x2060,
  0xFEFF,
  0x00AD,
  0x200E,
  0x200F
]);

export const detectIntegrityFlags = (text: string): IntegrityReport => {
  if (!text) {
    return {
      isClean: true,
      totalFlags: 0,
      hasHomoglyphs: false,
      homoglyphCount: 0,
      hasHiddenChars: false,
      hiddenCharCount: 0,
      details: [],
      sanitizedText: ''
    };
  }

  const details: IntegrityFlagDetail[] = [];
  let sanitized = '';
  let homoglyphCount = 0;
  let hiddenCharCount = 0;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const code = char.charCodeAt(0);

    if (HIDDEN_CHARS_SET.has(code)) {
      hiddenCharCount++;
      details.push({
        type: 'hidden_char',
        char: `\\u${code.toString(16).toUpperCase().padStart(4, '0')}`,
        codePoint: `U+${code.toString(16).toUpperCase().padStart(4, '0')}`,
        index: i
      });
      continue;
    }

    if (HOMOGLYPH_MAP[char]) {
      homoglyphCount++;
      const expected = HOMOGLYPH_MAP[char];
      details.push({
        type: 'homoglyph',
        char,
        codePoint: `U+${code.toString(16).toUpperCase().padStart(4, '0')}`,
        index: i,
        expected
      });
      sanitized += expected;
    } else {
      sanitized += char;
    }
  }

  const totalFlags = homoglyphCount + hiddenCharCount;

  return {
    isClean: totalFlags === 0,
    totalFlags,
    hasHomoglyphs: homoglyphCount > 0,
    homoglyphCount,
    hasHiddenChars: hiddenCharCount > 0,
    hiddenCharCount,
    details: details.slice(0, 50),
    sanitizedText: sanitized
  };
};

