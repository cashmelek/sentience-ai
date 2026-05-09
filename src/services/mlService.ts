import * as tf from "@tensorflow/tfjs";
import { extractTextFeatures, simpleReadabilityScore } from "../ml/textFeatures";

export interface MLAnalysisResult {
  readabilityScore: number;
  complexity: 'Düşük' | 'Orta' | 'Yüksek';
  recommendations: string[];
}

/**
 * TensorFlow.js kullanarak metin üzerinde gelişmiş analiz yapar.
 * Firebase ML altyapısına hazır bir yapı sunar.
 */
export const performDeepMLAnalysis = async (text: string): Promise<MLAnalysisResult> => {
  const score = simpleReadabilityScore(text);
  
  let complexity: 'Düşük' | 'Orta' | 'Yüksek' = 'Orta';
  const recommendations: string[] = [];

  if (score < 0.3) {
    complexity = 'Düşük';
    recommendations.push("Metin oldukça basit. Daha zengin bir kelime dağarcığı eklenebilir.");
  } else if (score > 0.7) {
    complexity = 'Yüksek';
    recommendations.push("Metin karmaşıklığı yüksek. Okunabilirliği artırmak için cümleleri kısaltabilirsiniz.");
  } else {
    complexity = 'Orta';
    recommendations.push("Metin dengeli bir yapıya sahip.");
  }

  // Cümle uzunluğu kontrolü
  const features = extractTextFeatures(text);
  if (features.avgWordLength > 6) {
    recommendations.push("Kelimeler ortalama olarak uzun. Daha yaygın kelimeler tercih edilebilir.");
  }

  return {
    readabilityScore: score,
    complexity,
    recommendations
  };
};
