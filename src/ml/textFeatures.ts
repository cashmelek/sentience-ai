import * as tf from "@tensorflow/tfjs";

export interface TextFeatureSet {
  length: number;
  avgWordLength: number;
  punctuationDensity: number;
}

export const extractTextFeatures = (text: string): TextFeatureSet => {
  const normalized = text.trim();
  const words = normalized.length ? normalized.split(/\s+/) : [];
  const punctuationMatches = normalized.match(/[.,;:!?]/g) ?? [];

  const totalWordChars = words.reduce((sum, w) => sum + w.length, 0);
  const avgWordLength = words.length ? totalWordChars / words.length : 0;
  const punctuationDensity = normalized.length
    ? punctuationMatches.length / normalized.length
    : 0;

  return {
    length: normalized.length,
    avgWordLength,
    punctuationDensity,
  };
};

export const buildFeatureTensor = (feature: TextFeatureSet): tf.Tensor2D => {
  return tf.tensor2d([
    [feature.length, feature.avgWordLength, feature.punctuationDensity],
  ]);
};

export const simpleReadabilityScore = (text: string): number => {
  const feature = extractTextFeatures(text);
  const model = tf.sequential();

  model.add(
    tf.layers.dense({
      units: 1,
      inputShape: [3],
      activation: "sigmoid",
    })
  );

  const input = buildFeatureTensor(feature);
  const output = model.predict(input) as tf.Tensor;
  const score = output.dataSync()[0];

  input.dispose();
  output.dispose();
  model.dispose();

  return Number(score.toFixed(4));
};
