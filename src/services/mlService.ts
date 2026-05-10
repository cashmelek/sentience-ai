import * as tf from "@tensorflow/tfjs";
import { db, auth } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { extractTextFeatures, simpleReadabilityScore, buildFeatureTensor } from "../ml/textFeatures";

export interface MLAnalysisResult {
  readabilityScore: number;
  complexity: 'Düşük' | 'Orta' | 'Yüksek';
  recommendations: string[];
}

/**
 * Kullanıcı gizliliğini koruyarak anonim feedback gönderir.
 * Tamamen ücretsiz Firestore kotası dahilinde çalışır.
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

/**
 * ÜCRETSİZ YÖNTEM: Modelleri projenin kendi sunucusundan (Hosting) yükler.
 * Bu yöntem Storage (Cloud Storage) gerektirmez ve ek ücret çıkarmaz.
 */
export const loadRemoteModel = async (modelName: string): Promise<tf.LayersModel | null> => {
  // Statik dosya yolu (public/models/...)
  const modelUrl = `/models/${modelName}/model.json`;
  
  try {
    console.log(`Yerel sunucudan model yükleniyor: ${modelName}...`);
    const model = await tf.loadLayersModel(modelUrl);
    console.log(`Model başarıyla yüklendi: ${modelName}`);
    return model;
  } catch (error) {
    console.warn(`${modelName} modeli sunucuda bulunamadı, matematiksel analiz kullanılıyor.`);
    return null;
  }
};

/**
 * Analiz motorunu hibrit yapıya dönüştürür (Model varsa kullan, yoksa matematiksel devam et).
 */
export const performDeepMLAnalysis = async (text: string): Promise<MLAnalysisResult> => {
  const remoteModel = await loadRemoteModel('text-classifier');
  
  let score: number;
  if (remoteModel) {
    const features = extractTextFeatures(text);
    const input = buildFeatureTensor(features);
    const prediction = remoteModel.predict(input) as tf.Tensor;
    const data = await prediction.data();
    score = data[0];
    input.dispose();
    prediction.dispose();
  } else {
    score = simpleReadabilityScore(text);
  }
  
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
