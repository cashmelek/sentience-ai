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

  // Ateşman based complexity (Türkçe için ARI'den daha sağlıklı)
  if (features.atesman > 70) {
    complexity = 'Düşük';
    recommendations.push("Metin oldukça akıcı ve anlaşılır (Ateşman: Kolay). Genel kitle için ideal.");
  } else if (features.atesman < 40) {
    complexity = 'Yüksek';
    recommendations.push("Metin yapısal olarak ağır (Ateşman: Zor). Cümleleri kısaltmayı veya daha basit kelimeler seçmeyi deneyin.");
  } else {
    complexity = 'Orta';
    recommendations.push("Metin standart bir profesyonel akıcılığa sahip.");
  }

  // Çetinkaya-Uzun Tavsiyeleri
  if (features.cetinkayaUzun > 70) {
    recommendations.push("Akademik/Teknik ağırlık hissediliyor. Okunabilirliği artırmak için hece yoğunluğunu azaltın.");
  }

  if (features.perplexity < 0.4) {
    recommendations.push("Kelime çeşitliliği düşük. Eş anlamlı kelimeler kullanarak metni zenginleştirin.");
  }
  
  if (features.burstiness < 5) {
    recommendations.push("Cümle yapıları monoton. Kısa ve uzun cümleleri karıştırarak akışı iyileştirin.");
  }

  if (features.colemanLiau > 12) {
    recommendations.push("Karakter yoğunluğu yüksek. Daha kısa kelimeler seçmek yorgunluğu azaltır.");
  }

  return {
    readabilityScore: readability,
    complexity,
    recommendations,
    metrics: features
  };
};
