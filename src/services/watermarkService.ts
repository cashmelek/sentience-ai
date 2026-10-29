import { AIDisclosureMatrix, WatermarkAnalysisResult } from '../types/classroom';

const FNV_PRIME = 16777619;
const FNV_OFFSET_BASIS = 2166136261;

const hashWord = (str: string): number => {
  let hash = FNV_OFFSET_BASIS;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, FNV_PRIME) >>> 0;
  }
  return hash;
};

export const analyzeStatisticalWatermark = (text: string): WatermarkAnalysisResult => {
  if (!text || text.trim().length === 0) {
    return {
      watermarkScore: 0,
      hasWatermarkSignature: false,
      confidence: 'none',
      greenTokenRatio: 0.5,
      entropyVariance: 0,
      detectedPatternCount: 0,
      details: 'Metin analiz için yetersiz uzunlukta.'
    };
  }

  const words = text
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'«»]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1);

  if (words.length < 25) {
    return {
      watermarkScore: 0,
      hasWatermarkSignature: false,
      confidence: 'none',
      greenTokenRatio: 0.5,
      entropyVariance: 0,
      detectedPatternCount: 0,
      details: 'İstatistiksel filigran doğrulaması için en az 25 kelime gereklidir.'
    };
  }

  let greenCount = 0;
  const n = words.length - 1;

  for (let i = 1; i < words.length; i++) {
    const prevHash = hashWord(words[i - 1]);
    const currHash = hashWord(words[i]);
    const combined = (prevHash ^ Math.imul(currHash, 31)) >>> 0;
    if ((combined % 100) < 50) {
      greenCount++;
    }
  }

  const greenRatio = greenCount / n;
  const expectedMean = 0.5;
  const stdDev = Math.sqrt((expectedMean * (1 - expectedMean)) / n);
  const zScore = (greenRatio - expectedMean) / stdDev;

  const rawSentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 5);
  const sentenceLengths = rawSentences.map(s => s.split(/\s+/).filter(Boolean).length);

  let sentenceVariance = 0;
  if (sentenceLengths.length > 1) {
    const avgLen = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
    sentenceVariance = sentenceLengths.reduce((acc, len) => acc + Math.pow(len - avgLen, 2), 0) / sentenceLengths.length;
  }

  let watermarkScore = 0;
  if (zScore > 0) {
    watermarkScore = Math.min(100, Math.round(50 + (zScore / 4) * 50));
  } else {
    watermarkScore = Math.max(0, Math.round(50 + (zScore / 4) * 50));
  }

  if (sentenceVariance < 4 && sentenceLengths.length >= 4) {
    watermarkScore = Math.min(100, watermarkScore + 10);
  }

  const hasWatermarkSignature = watermarkScore >= 70;
  let confidence: 'none' | 'low' | 'moderate' | 'high' | 'definitive' = 'none';

  if (watermarkScore >= 85) {
    confidence = 'definitive';
  } else if (watermarkScore >= 70) {
    confidence = 'high';
  } else if (watermarkScore >= 55) {
    confidence = 'moderate';
  } else if (watermarkScore >= 40) {
    confidence = 'low';
  }

  const details = hasWatermarkSignature
    ? `İstatistiksel Sentience ritim imzası tespit edildi (Yeşil Token Oranı: %${Math.round(greenRatio * 100)}, Z-Skor: ${zScore.toFixed(2)}).`
    : `İstatistiksel ritim profili doğal insan yazımı normlarında (Yeşil Token Oranı: %${Math.round(greenRatio * 100)}).`;

  return {
    watermarkScore,
    hasWatermarkSignature,
    confidence,
    greenTokenRatio: Number(greenRatio.toFixed(3)),
    entropyVariance: Number(sentenceVariance.toFixed(2)),
    detectedPatternCount: greenCount,
    details
  };
};

export const checkDisclosureDiscrepancy = (
  disclosure: AIDisclosureMatrix | undefined,
  metrics: {
    aiScore?: number;
    internalGeneratorSimilarity?: number;
    hasWatermarkSignature?: boolean;
    watermarkScore?: number;
  }
): { hasDiscrepancy: boolean; reason?: string } => {
  if (!disclosure) {
    if ((metrics.internalGeneratorSimilarity && metrics.internalGeneratorSimilarity >= 70) ||
        (metrics.aiScore && metrics.aiScore >= 0.70) ||
        metrics.hasWatermarkSignature) {
      return {
        hasDiscrepancy: true,
        reason: 'Teslimde YZ Katkı Beyan Matrisi doldurulmamış ancak sistemde belirgin YZ / Sentetik üretim izi tespit edilmiştir.'
      };
    }
    return { hasDiscrepancy: false };
  }

  const textDraftingNone = disclosure.textDrafting.level === 'none';

  if (textDraftingNone && metrics.internalGeneratorSimilarity && metrics.internalGeneratorSimilarity >= 70) {
    return {
      hasDiscrepancy: true,
      reason: `Öğrenci YZ ile metin üretimi yapılmadığını beyan etmiştir; ancak platform içi sentetik üretim havuzuyla %${metrics.internalGeneratorSimilarity} oranında parmak izi eşleşmesi saptanmıştır.`
    };
  }

  if (textDraftingNone && (metrics.hasWatermarkSignature || (metrics.watermarkScore && metrics.watermarkScore >= 75))) {
    return {
      hasDiscrepancy: true,
      reason: `Öğrenci YZ ile metin üretimi yapılmadığını beyan etmiştir; ancak %${metrics.watermarkScore || 80} seviyesinde istatistiksel YZ ritim filigranı tespit edilmiştir.`
    };
  }

  if (textDraftingNone && metrics.aiScore && metrics.aiScore >= 0.75) {
    return {
      hasDiscrepancy: true,
      reason: `Öğrenci YZ desteği almadığını beyan etmiştir; ancak bağımsız YZ tespit motoru %${Math.round(metrics.aiScore * 100)} sentetik olasılık raporlamıştır.`
    };
  }

  return { hasDiscrepancy: false };
};
