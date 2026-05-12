import * as tf from "@tensorflow/tfjs";
import { db, auth } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { extractTextFeatures, simpleReadabilityScore, buildFeatureTensor, TextFeatureSet } from "../ml/textFeatures";

export interface MLAnalysisResult {
  readabilityScore: number;
  complexity: 'Düşük' | 'Orta' | 'Yüksek';
  recommendations: string[];
  metrics: TextFeatureSet;
}

/**
 * Kullanıcı gizliliğini koruyarak anonim feedback gönderir.
 */
export const sendAnonymousFeedback = async (
  originalLength: number, 
  humanizedLength: number, 
  aiScore: number,
  tone: string
) => {
  try {
    if (!auth.currentUser) return;

    await addDoc(collection(db, "feedback_summaries"), {
      userId: auth.currentUser.uid,
      timestamp: serverTimestamp(),
      metrics: {
        lengthDiff: humanizedLength - originalLength,
        improvementRatio: (1 - aiScore),
        toneUsed: tone
      }
    });
  } catch (error) {
    console.error("Feedback gönderilemedi:", error);
  }
};

export const loadRemoteModel = async (modelName: string): Promise<tf.LayersModel | null> => {
  const modelUrl = `/models/${modelName}/model.json`;
  try {
    const model = await tf.loadLayersModel(modelUrl);
    return model;
  } catch (error) {
    return null;
  }
};

export const performDeepMLAnalysis = async (text: string): Promise<MLAnalysisResult> => {
  const features = extractTextFeatures(text);
  const readability = simpleReadabilityScore(text);
  
  let complexity: 'Düşük' | 'Orta' | 'Yüksek' = 'Orta';
  const recommendations: string[] = [];

  if (readability < 0.3) {
    complexity = 'Düşük';
    recommendations.push("Metin oldukça basit. Daha zengin bir kelime dağarcığı eklenebilir.");
  } else if (readability > 0.7) {
    complexity = 'Yüksek';
    recommendations.push("Metin karmaşıklığı yüksek. Okunabilirliği artırmak için cümleleri kısaltabilirsiniz.");
  } else {
    complexity = 'Orta';
    recommendations.push("Metin dengeli bir yapıya sahip.");
  }

  if (features.avgWordLength > 6) {
    recommendations.push("Kelimeler ortalama olarak uzun. Daha yaygın kelimeler tercih edilebilir.");
  }
  
  if (features.burstiness < 5) {
    recommendations.push("Cümle uzunlukları çok benzer (Düşük Burstiness). Bu durum YZ şüphesini artırabilir.");
  }

  return {
    readabilityScore: readability,
    complexity,
    recommendations,
    metrics: features
  };
};
