import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { GoogleGenAI } from "@google/genai";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

const PLAN_LIMITS: Record<string, number> = {
  free: 10000,
  pro: 100000,
  premium: 500000
};

const getApiKey = (): string => {
  const key = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!key) {
    throw new HttpsError("failed-precondition", "Server API key configuration is missing.");
  }
  const keys = key.split(",").map(k => k.trim()).filter(Boolean);
  return keys[0];
};

const verifyUserLimit = async (uid: string, textLength: number) => {
  const userDoc = await db.collection("users").doc(uid).get();
  if (!userDoc.exists) {
    throw new HttpsError("not-found", "Kullanıcı profili bulunamadı.");
  }

  const userData = userDoc.data() || {};
  if (userData.role === "admin") {
    return;
  }

  const userPlan = userData.plan || "free";
  const dailyLimit = PLAN_LIMITS[userPlan] || PLAN_LIMITS.free;
  const currentUsage = userData.dailyUsage || 0;

  if (currentUsage + textLength > dailyLimit) {
    throw new HttpsError("resource-exhausted", `Günlük karakter limitinizi aştınız (${currentUsage}/${dailyLimit}).`);
  }
};

const recordUserUsage = async (uid: string, textLength: number) => {
  await db.collection("users").doc(uid).set({
    dailyUsage: admin.firestore.FieldValue.increment(textLength),
    lastActiveAt: new Date().toISOString()
  }, { merge: true });
};

export const analyzeAndHumanizeSecure = onCall({ cors: true, maxInstances: 10 }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Yetkilendirme gerekli.");
  }

  const { text, options, modelName } = request.data || {};
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    throw new HttpsError("invalid-argument", "Geçerli bir metin girilmedi.");
  }

  const uid = request.auth.uid;
  await verifyUserLimit(uid, text.length);

  const apiKey = getApiKey();
  const client = new GoogleGenAI({ apiKey });
  const selectedModel = modelName || "gemini-2.5-flash";

  let styleInstruction = `Ton: ${options?.tone || "Profesyonel"}`;
  if (options?.customToneName || options?.customToneDescription) {
    styleInstruction = `Özel Tarz: ${options.customToneName ? `[${options.customToneName}] ` : ""}${options.customToneDescription || ""}`;
  }

  let intensityInstruction = "DENGELİ DÖNÜŞÜM: Akıcılığı artır, sentaks varyasyonları ekle.";
  let temp = 0.7;
  const intensity = options?.intensity ?? 50;
  if (options?.tone === "Özet") {
    intensityInstruction = "ÖZETLEME GÖREVİ: Metnin ana fikirlerini koruyarak kısa ve öz bir özet oluştur.";
    temp = 0.3;
  } else if (intensity >= 70) {
    intensityInstruction = "RADİKAL İNSANLAŞTIRMA (Yüksek Yoğunluk): Cümle yapılarını tamamen değiştir, yepyeni bir metin yarat.";
    temp = 1.0;
  } else if (intensity < 30) {
    intensityInstruction = "DOĞAL İYİLEŞTİRME (Düşük Yoğunluk): Gramer hatalarını düzelt, küçük akıcılık dokunuşları yap.";
    temp = 0.4;
  }

  const prompt = `
GÖREV: Metni insanileştir ve analiz et.

DİL KURALI:
- Ürettiğin "humanizedText" metni DAİMA ve YALNIZCA TÜRKÇE olmalıdır.
- "insights", "detail", "sentence" gibi tüm JSON alanlarındaki metinler de TÜRKÇE olmalıdır.

KURALLAR:
1. FORMATI KORU: Başlıklar, madde işaretleri aynen korunsun.
2. İNSANİLEŞTİRME: Perplexity ve Burstiness değerlerini insan standartlarına çek.
   - ${styleInstruction}
   - ${intensityInstruction}
3. CÜMLE ANALİZİ: Metni CÜMLE CÜMLE analiz et ve her cümle için YZ olasılığını belirle.

JSON FORMATI:
{
  "humanizedText": "Türkçe olarak dönüştürülmüş metin",
  "aiScore": 0.15,
  "metrics": {
    "readability": 0.85,
    "complexity": "Profesyonel",
    "toneStrength": 0.90,
    "grammarScore": 0.98,
    "wordCount": 150,
    "readingTime": "2 dk"
  },
  "insights": [
    {"sentence": "Cümle", "score": 0.8, "detail": "Açıklama"}
  ],
  "sentenceScores": [
    {"sentence": "Cümle 1", "score": 0.1, "type": "human"}
  ]
}
`;

  try {
    const result = await client.models.generateContent({
      model: selectedModel,
      contents: [{ role: "user", parts: [{ text: `Kaynak Metin: ${text}\n\n${prompt}` }] }],
      config: {
        temperature: temp,
        maxOutputTokens: 8192,
        responseMimeType: "application/json"
      }
    });

    await recordUserUsage(uid, text.length);

    const parsed = JSON.parse(result.text || "{}");
    return parsed;
  } catch (err: any) {
    throw new HttpsError("internal", err?.message || "Sunucu işlem hatası.");
  }
});

export const detectAISecure = onCall({ cors: true, maxInstances: 10 }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Yetkilendirme gerekli.");
  }

  const { text, sensitivity, modelName } = request.data || {};
  if (!text || typeof text !== "string") {
    throw new HttpsError("invalid-argument", "Geçerli bir metin girilmedi.");
  }

  const apiKey = getApiKey();
  const client = new GoogleGenAI({ apiKey });
  const selectedModel = modelName || "gemini-2.5-flash";

  const prompt = `Aşağıdaki metni bir Originality Auditor olarak derinlemesine analiz et.
Hassasiyet: ${sensitivity || 50}/100.
Metin: ${text}

JSON FORMATI:
{
  "score": 0.85,
  "reasoning": "Açıklama",
  "sentenceScores": [
    {"sentence": "...", "score": 0.9, "type": "ai", "reason": "..."}
  ],
  "metrics": {
    "plagiarism": 0.05,
    "readability": 0.75,
    "complexity": "Profesyonel",
    "burstiness": 0.4,
    "perplexity": 0.3,
    "structureScore": 0.8
  },
  "highlights": []
}`;

  try {
    const result = await client.models.generateContent({
      model: selectedModel,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        temperature: 0.1,
        responseMimeType: "application/json"
      }
    });

    return JSON.parse(result.text || "{}");
  } catch (err: any) {
    throw new HttpsError("internal", err?.message || "Dedektör işlem hatası.");
  }
});

// ===== B21 Faz 2 — Sunucu-tarafı teslim skorlama (B21 §21.5 / §21.11) =====
// Skor sahteciliğini kaldırır: skorlar yalnızca bu fonksiyon ve yetkili istemci
// güncellemeleriyle yazılır. İstemcide CF kullanılamazsa istemci-tarafı yedek devreye girer.

interface ScoringSource {
  title?: string;
  url: string;
  similarity?: number;
  snippet?: string;
  trust?: string;
  matchGroup?: string;
}

// Kod çitlerini ve gevşek JSON'u temizler (zeminlemeli yanıtlar çit üretebilir)
const parseJsonLoose = (raw: string | undefined): any => {
  if (!raw) return {};
  const cleaned = raw.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return {};
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return {};
  }
};

function generateTextShingles(text: string, k = 5): string[] {
  if (!text) return [];
  const normalized = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = normalized.split(" ").filter((w) => w.length > 1);
  if (words.length < k) {
    return words.length > 0 ? [words.join(" ")] : [];
  }
  const set = new Set<string>();
  for (let i = 0; i <= words.length - k; i++) {
    set.add(words.slice(i, i + k).join(" "));
  }
  return Array.from(set);
}

function computeShingleOverlap(currShingles: string[], repoShingles: string[]): number {
  if (!currShingles.length || !repoShingles.length) return 0;
  const repoSet = new Set(repoShingles);
  let matched = 0;
  for (const s of currShingles) {
    if (repoSet.has(s)) matched++;
  }
  return Math.min(1, Math.round((matched / currShingles.length) * 100) / 100);
}

export const scoreSubmission = onCall({ cors: true, maxInstances: 10 }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Yetkilendirme gerekli.");
  }

  const { classId, assignmentId, studentId, sensitivity, auditorModel, sentinelEnabled } = request.data || {};
  if (!classId || !assignmentId || !studentId) {
    throw new HttpsError("invalid-argument", "classId, assignmentId ve studentId zorunludur.");
  }

  const uid = request.auth.uid;

  // Yetki: sınıf eğitmeni, admin veya teslimin sahibi (kayıtlı) öğrenci
  const classDoc = await db.collection("classes").doc(classId).get();
  if (!classDoc.exists) {
    throw new HttpsError("not-found", "Sınıf bulunamadı.");
  }
  const cls = classDoc.data() || {};

  let authorized = cls.instructorId === uid;
  if (!authorized && studentId === uid) {
    const enr = await db.collection("classes").doc(classId).collection("enrollments").doc(uid).get();
    authorized = enr.exists;
  }
  if (!authorized) {
    const userDoc = await db.collection("users").doc(uid).get();
    authorized = userDoc.data()?.role === "admin";
  }
  if (!authorized) {
    throw new HttpsError("permission-denied", "Bu teslimi skorlama yetkiniz yok.");
  }

  const submissionRef = db.collection("classes").doc(classId)
    .collection("assignments").doc(assignmentId)
    .collection("submissions").doc(studentId);
  const submissionSnap = await submissionRef.get();
  if (!submissionSnap.exists) {
    throw new HttpsError("not-found", "Teslim bulunamadı.");
  }
  const submission = submissionSnap.data() || {};
  const text = String(submission.text || "");
  if (text.trim().length < 50) {
    throw new HttpsError("failed-precondition", "Teslim metni çok kısa.");
  }

  await submissionRef.update({ status: "processing" });

  const apiKey = getApiKey();
  const client = new GoogleGenAI({ apiKey });
  const selectedModel = auditorModel || "gemini-2.5-flash";
  const sens = Number(sensitivity) || 50;
  // İstemcideki Sentinel kapısının sunucu karşılığı: kapalıysa web araması yapılmaz,
  // yalnızca YZ olasılığı hesaplanır (benzerlik 0, boş kaynak listesi)
  const runSimilarity = sentinelEnabled !== false;

  try {
    // 1) YZ olasılığı — istemcideki detectAISecure ile aynı JSON sözleşmesi
    const aiPrompt = `Aşağıdaki metni bir Originality Auditor olarak derinlemesine analiz et.
Hassasiyet: ${sens}/100.

JSON FORMATI:
{
  "score": 0.85,
  "reasoning": "Açıklama",
  "sentenceScores": [
    {"sentence": "...", "score": 0.9, "type": "ai", "reason": "..."}
  ],
  "metrics": {
    "plagiarism": 0.05,
    "readability": 0.75,
    "complexity": "Profesyonel",
    "burstiness": 0.4,
    "perplexity": 0.3,
    "structureScore": 0.8
  }
}`;
    const aiResult = await client.models.generateContent({
      model: selectedModel,
      contents: [{ role: "user", parts: [{ text: `Metin: ${text}\n\n${aiPrompt}` }] }],
      config: { temperature: 0.1, responseMimeType: "application/json" }
    });
    const ai = parseJsonLoose(aiResult.text);

    // 2) Benzerlik — Gemini googleSearch zeminlemesi (istemcideki Sentinel yolunun sunucu karşılığı)
    let sources: ScoringSource[] = [];
    let similarityScore = 0;
    if (runSimilarity) {
    const plagPrompt = `Aşağıdaki metni web'de ara ve metinle örtüşen kaynakları belirle.
Yalnızca GERÇEKTE eşleşen, erişilebilir URL'leri listele; uydurma URL yazma.
Her kaynak için örtüşme oranını 0-1 arasında ver.

JSON FORMATI:
{
  "sources": [
    {"title": "Kaynak başlığı", "url": "https://...", "similarity": 0.42, "snippet": "örtüşen bölüm", "matchGroup": "not_cited_or_quoted|missing_quotations|missing_citation|cited_and_quoted", "trust": "high|medium|low"}
  ],
  "similarityScore": 0.42
}`;
    const plagResult = await client.models.generateContent({
      model: selectedModel,
      contents: [{ role: "user", parts: [{ text: `Metin: ${text}\n\n${plagPrompt}` }] }],
      config: { temperature: 0.1, tools: [{ googleSearch: {} }] }
    });
    const plag = parseJsonLoose(plagResult.text);

    // Dışlanan kaynaklar skora katılmaz (B21 §21.7 filtreler)
    const rawSources: ScoringSource[] = Array.isArray(plag.sources) ? plag.sources : [];
    sources = rawSources
      .filter((s: any) => s && typeof s.url === "string" && s.url.startsWith("http"))
      .map((s: any) => ({
        title: typeof s.title === "string" ? s.title : "",
        url: s.url,
        similarity: typeof s.similarity === "number" ? Math.max(0, Math.min(1, s.similarity)) : undefined,
        snippet: typeof s.snippet === "string" ? s.snippet : "",
        trust: typeof s.trust === "string" ? s.trust : undefined,
        matchGroup: typeof s.matchGroup === "string" ? s.matchGroup : undefined
      }));
    }

    const assignmentDoc = await db.collection("classes").doc(classId)
      .collection("assignments").doc(assignmentId).get();
    const assignmentData = assignmentDoc.data() || {};
    const noRepository = assignmentData.noRepository === true;

    const currShingles = generateTextShingles(text, 5);

    try {
      const repoSnap = await db.collection("classes").doc(classId).collection("repository").get();
      for (const rDoc of repoSnap.docs) {
        if (rDoc.id === `${assignmentId}_${studentId}`) continue;
        const rData = rDoc.data() || {};
        const rShingles = Array.isArray(rData.shingles) ? rData.shingles : [];
        const overlap = computeShingleOverlap(currShingles, rShingles);
        if (overlap >= 0.08) {
          const isSelf = rData.studentId === studentId;
          const matchGroup = isSelf ? "self_plagiarism" : "peer_match";
          const title = isSelf
            ? `Önceki Öğrenci Teslimi (Öz-İntihal: ${rData.assignmentTitle || "Ödev"})`
            : `Sınıf İçi Teslim (${rData.studentName || "Eş-Öğrenci"})`;
          sources.push({
            title,
            url: `internal://repository/${classId}/${rDoc.id}`,
            similarity: overlap,
            snippet: rData.sampleSnippet || "Sınıf deposundaki kayıt ile örtüşen bölümler saptandı.",
            trust: "high",
            matchGroup
          });
        }
      }
    } catch (repoErr) {
      console.warn("Repository comparison error:", repoErr);
    }

    const excluded = new Set<string>(Array.isArray(submission.excludedSourceUrls) ? submission.excludedSourceUrls : []);
    const activeSources = sources.filter((s) => !excluded.has(s.url));
    similarityScore = activeSources.length > 0
      ? Math.max(...activeSources.map((s) => s.similarity ?? 0))
      : 0;

    const scores = {
      similarityScore,
      aiScore: typeof ai.score === "number" ? ai.score : 0,
      sources,
      sentenceScores: Array.isArray(ai.sentenceScores) ? ai.sentenceScores : [],
      metrics: ai.metrics || {}
    };

    await submissionRef.update({
      ...scores,
      status: "scored",
      scoredBy: "server",
      scoredAt: new Date().toISOString()
    });

    if (!noRepository) {
      try {
        await db.collection("classes").doc(classId).collection("repository").doc(`${assignmentId}_${studentId}`).set({
          classId,
          assignmentId,
          assignmentTitle: assignmentData.title || "",
          studentId,
          studentName: submission.studentName || "",
          studentEmail: submission.studentEmail || "",
          title: submission.title || "",
          shingles: currShingles.slice(0, 1000),
          sampleSnippet: text.slice(0, 300),
          createdAt: new Date().toISOString()
        }, { merge: true });
      } catch (saveRepoErr) {
        console.warn("Repository save error:", saveRepoErr);
      }
    }

    return { ...scores, status: "scored", scoredBy: "server" };
  } catch (err: any) {
    await submissionRef.update({ status: "failed" }).catch(() => {});
    throw new HttpsError("internal", err?.message || "Skorlama sırasında hata oluştu.");
  }
});
