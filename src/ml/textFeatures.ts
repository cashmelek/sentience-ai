import * as tf from "@tensorflow/tfjs";

export interface TextFeatureSet {
  length: number;
  wordCount: number;
  sentenceCount: number;
  avgWordLength: number;
  punctuationDensity: number;
  burstiness: number; // Sentence length variation
  perplexity: number; // Vocabulary diversity (simulated)
}

export const extractTextFeatures = (text: string): TextFeatureSet => {
  const normalized = text.trim();
  if (!normalized) {
    return {
      length: 0,
      wordCount: 0,
      sentenceCount: 0,
      avgWordLength: 0,
      punctuationDensity: 0,
      burstiness: 0,
      perplexity: 0
    };
  }

  const sentences = normalized.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = normalized.split(/\s+/).filter(w => w.length > 0);
  const punctuationMatches = normalized.match(/[.,;:!?]/g) ?? [];

  const totalWordChars = words.reduce((sum, w) => sum + w.length, 0);
  const avgWordLength = words.length ? totalWordChars / words.length : 0;
  const punctuationDensity = normalized.length ? punctuationMatches.length / normalized.length : 0;

  // Burstiness: Standard deviation of sentence lengths
  const sentenceLengths = sentences.map(s => s.split(/\s+/).length);
  const avgSentenceLength = sentenceLengths.reduce((a, b) => a + b, 0) / (sentences.length || 1);
  const variance = sentenceLengths.reduce((a, b) => a + Math.pow(b - avgSentenceLength, 2), 0) / (sentences.length || 1);
  const burstiness = Math.sqrt(variance);

  // Perplexity (Simulated): Lexical diversity (unique words / total words)
  const uniqueWords = new Set(words.map(w => w.toLowerCase())).size;
  const perplexity = words.length ? (uniqueWords / words.length) : 0;

  return {
    length: normalized.length,
    wordCount: words.length,
    sentenceCount: sentences.length,
    avgWordLength,
    punctuationDensity,
    burstiness,
    perplexity
  };
};

export const buildFeatureTensor = (feature: TextFeatureSet): tf.Tensor2D => {
  return tf.tensor2d([
    [feature.length, feature.avgWordLength, feature.punctuationDensity, feature.burstiness, feature.perplexity],
  ]);
};

export const simpleReadabilityScore = (text: string): number => {
  const feature = extractTextFeatures(text);
  
  // Basic heuristic for readability (0-1)
  // Higher burstiness and higher perplexity often mean more human-like
  const score = (feature.perplexity * 0.6 + (feature.burstiness / 20) * 0.4);
  return Math.min(1, Math.max(0, Number(score.toFixed(4))));
};
