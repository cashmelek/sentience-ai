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
  bezirciYilmaz: number; // Bezirci-Yılmaz Okunabilirlik Endeksi (FOBES - Türkçe'ye özel)
  lix: number; // Läsbarhetsindex (Uzun kelime tabanlı)
  rix: number; // Readability Index (Cümle başına uzun kelime)
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
      colemanLiau: 0,
      bezirciYilmaz: 0,
      lix: 0,
      rix: 0
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

  let h3Count = 0;
  let h4Count = 0;
  let h5Count = 0;
  let h6Count = 0;
  let longWordsCount = 0;

  words.forEach(w => {
    const cleanWord = w.replace(/[^a-zA-ZçğıöşüÇĞİÖŞÜ]/g, '');
    if (cleanWord.length > 6) {
      longWordsCount++;
    }
    const syl = countTurkishSyllables(cleanWord);
    if (syl === 3) h3Count++;
    else if (syl === 4) h4Count++;
    else if (syl === 5) h5Count++;
    else if (syl >= 6) h6Count++;
  });

  const oks = sentences.length ? words.length / sentences.length : 0;
  const h3PerSentence = sentences.length ? h3Count / sentences.length : 0;
  const h4PerSentence = sentences.length ? h4Count / sentences.length : 0;
  const h5PerSentence = sentences.length ? h5Count / sentences.length : 0;
  const h6PerSentence = sentences.length ? h6Count / sentences.length : 0;

  const bezirciYilmaz = (words.length && sentences.length)
    ? Math.sqrt(oks) * ((0.84 * h3PerSentence) + (1.5 * h4PerSentence) + (3.5 * h5PerSentence) + (26.35 * h6PerSentence))
    : 0;

  const lix = (words.length && sentences.length)
    ? (words.length / sentences.length) + ((longWordsCount * 100) / words.length)
    : 0;

  const rix = sentences.length ? longWordsCount / sentences.length : 0;

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
    colemanLiau: Math.max(0, Number(colemanLiau.toFixed(2))),
    bezirciYilmaz: Number(bezirciYilmaz.toFixed(2)),
    lix: Number(lix.toFixed(2)),
    rix: Number(rix.toFixed(2))
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

  const bezirciNormalized = 1 - (Math.min(16, Math.max(1, feature.bezirciYilmaz)) / 16);
  
  const diversityFactor = (feature.perplexity * 0.4 + Math.min(1, feature.burstiness / 30) * 0.6);
  
  let score: number;

  if (lang === 'tr') {
    // Türkçe metinlerde yerel algoritmalara %80 ağırlık
    score = (atesmanNormalized * 0.35 + cetinkayaNormalized * 0.35 + bezirciNormalized * 0.15 + diversityFactor * 0.15);
  } else {
    // Yabancı metinlerde global (ARI/Coleman) algoritmalara %80 ağırlık
    score = (ariNormalized * 0.4 + colemanNormalized * 0.4 + diversityFactor * 0.2);
  }

  return Math.min(1, Math.max(0, Number(score.toFixed(4))));
};

export interface IntegrityFlagDetail {
  type: 'homoglyph' | 'hidden_char' | 'hidden_text_pattern';
  char: string;
  codePoint: string;
  index: number;
  word?: string;
  expected?: string;
  description?: string;
}

export interface IntegrityReport {
  isClean: boolean;
  totalFlags: number;
  hasHomoglyphs: boolean;
  homoglyphCount: number;
  hasHiddenChars: boolean;
  hiddenCharCount: number;
  hasHiddenTextPatterns: boolean;
  hiddenTextPatternCount: number;
  details: IntegrityFlagDetail[];
  sanitizedText: string;
}

const HOMOGLYPH_MAP: Record<string, string> = {
  // Kiril Kucuk Harfler
  '\u0430': 'a', '\u0435': 'e', '\u043E': 'o', '\u0440': 'p', '\u0441': 'c',
  '\u0443': 'y', '\u0445': 'x', '\u0456': 'i', '\u0458': 'j', '\u0455': 's',
  '\u0434': 'g', '\u043F': 'n', '\u0442': 't', '\u04BB': 'h', '\u0501': 'd',
  '\u051B': 'q', '\u051D': 'w',
  // Kiril Buyuk Harfler
  '\u0410': 'A', '\u0412': 'B', '\u0415': 'E', '\u041A': 'K', '\u041C': 'M',
  '\u041D': 'H', '\u041E': 'O', '\u0420': 'P', '\u0421': 'C', '\u0422': 'T',
  '\u0425': 'X', '\u0406': 'I', '\u0408': 'J', '\u0405': 'S', '\u04AE': 'Y',
  // Yunan Kucuk Harfler
  '\u03B1': 'a', '\u03B2': 'b', '\u03B5': 'e', '\u03B9': 'i', '\u03BA': 'k',
  '\u03BD': 'v', '\u03BF': 'o', '\u03C1': 'p', '\u03C4': 't', '\u03C5': 'u',
  '\u03C7': 'x',
  // Yunan Buyuk Harfler
  '\u0391': 'A', '\u0392': 'B', '\u0395': 'E', '\u0396': 'Z', '\u0397': 'H',
  '\u0399': 'I', '\u039A': 'K', '\u039C': 'M', '\u039D': 'N', '\u039F': 'O',
  '\u03A1': 'P', '\u03A4': 'T', '\u03A5': 'Y', '\u03A7': 'X'
};

const HIDDEN_CHARS_SET = new Set([
  0x200B, // Zero-width space
  0x200C, // Zero-width non-joiner
  0x200D, // Zero-width joiner
  0x2060, // Word joiner
  0xFEFF, // Zero-width no-break space (BOM)
  0x00AD, // Soft hyphen
  0x200E, // Left-to-right mark
  0x200F, // Right-to-right mark
  0x202A, // LRE
  0x202B, // RLE
  0x202C, // PDF
  0x202D, // LRO
  0x202E, // RLO
  0x2061, // Function application
  0x2062, // Invisible times
  0x2063, // Invisible separator
  0x2064, // Invisible plus
  0x180E  // Mongolian vowel separator
]);

const getWordAt = (str: string, index: number): string => {
  let start = index;
  while (start > 0 && !/\s/.test(str[start - 1])) start--;
  let end = index;
  while (end < str.length && !/\s/.test(str[end])) end++;
  return str.substring(start, end).trim();
};

export const detectIntegrityFlags = (text: string): IntegrityReport => {
  if (!text) {
    return {
      isClean: true,
      totalFlags: 0,
      hasHomoglyphs: false,
      homoglyphCount: 0,
      hasHiddenChars: false,
      hiddenCharCount: 0,
      hasHiddenTextPatterns: false,
      hiddenTextPatternCount: 0,
      details: [],
      sanitizedText: ''
    };
  }

  const details: IntegrityFlagDetail[] = [];
  let sanitized = '';
  let homoglyphCount = 0;
  let hiddenCharCount = 0;
  let hiddenPatternCount = 0;

  // 1. Gizli HTML / Stil kaliplarini kontrol et
  const HIDDEN_TAG_REGEX = /<(?:span|div|p|font)[^>]*style=["'][^"']*(?:display\s*:\s*none|font-size\s*:\s*0(?:px)?|color\s*:\s*(?:white|#fff|#ffffff|transparent)|opacity\s*:\s*0)[^"']*["'][^>]*>([\s\S]*?)<\/(?:span|div|p|font)>/gi;
  let match: RegExpExecArray | null;
  while ((match = HIDDEN_TAG_REGEX.exec(text)) !== null) {
    hiddenPatternCount++;
    details.push({
      type: 'hidden_text_pattern',
      char: match[0].substring(0, 30),
      codePoint: 'HTML/CSS',
      index: match.index,
      description: 'Gorunmez CSS stili ile gizlenmis metin etiketi',
      word: match[1]?.trim() || match[0]
    });
  }

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const code = char.charCodeAt(0);

    if (HIDDEN_CHARS_SET.has(code)) {
      hiddenCharCount++;
      const wordContext = getWordAt(text, i);
      const hex = code.toString(16).toUpperCase().padStart(4, '0');
      details.push({
        type: 'hidden_char',
        char: '\\u' + hex,
        codePoint: 'U+' + hex,
        index: i,
        word: wordContext,
        description: 'Sifir genislikli veya gorunmez karakter'
      });
      continue;
    }

    if (HOMOGLYPH_MAP[char]) {
      homoglyphCount++;
      const expected = HOMOGLYPH_MAP[char];
      const wordContext = getWordAt(text, i);
      const hex = char.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0');
      details.push({
        type: 'homoglyph',
        char,
        codePoint: 'U+' + hex,
        index: i,
        word: wordContext,
        expected,
        description: "Latin '" + expected + "' yerine ikame edilmis karakter"
      });
      sanitized += expected;
    } else {
      sanitized += char;
    }
  }

  if (hiddenPatternCount > 0) {
    sanitized = sanitized.replace(HIDDEN_TAG_REGEX, '$1');
  }

  const totalFlags = homoglyphCount + hiddenCharCount + hiddenPatternCount;

  return {
    isClean: totalFlags === 0,
    totalFlags,
    hasHomoglyphs: homoglyphCount > 0,
    homoglyphCount,
    hasHiddenChars: hiddenCharCount > 0,
    hiddenCharCount,
    hasHiddenTextPatterns: hiddenPatternCount > 0,
    hiddenTextPatternCount: hiddenPatternCount,
    details: details.slice(0, 100),
    sanitizedText: sanitized
  };
};
