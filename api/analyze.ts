import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI } from "@google/genai";

// Basit in-memory rate limiting (Vercel serverless için yeterli)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 dakika
const RATE_LIMIT_MAX_REQUESTS = 30; // Dakikada maksimum 30 istek

const checkRateLimit = (identifier: string): boolean => {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  
  record.count++;
  return true;
};

const getApiKey = (): string => {
  const key = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "";
  if (!key) throw new Error("Server API key configuration is missing.");
  const keys = key.split(",").map((k) => k.trim()).filter(Boolean);
  return keys[Math.floor(Math.random() * keys.length)];
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Yetkilendirme gerekli." });
  }

  // Rate limiting check
  const userId = authHeader.replace("Bearer ", "").substring(0, 20); // Tokenın ilk 20 karakteri kullan
  if (!checkRateLimit(userId)) {
    return res.status(429).json({ 
      error: "Çok fazla istek. Lütfen bir dakika bekleyin.",
      retryAfter: RATE_LIMIT_WINDOW / 1000
    });
  }

  const { text, options, modelName } = req.body || {};
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return res.status(400).json({ error: "Geçerli bir metin girilmedi." });
  }

  const apiKey = getApiKey();
  const client = new GoogleGenAI({ apiKey });
  const selectedModel = modelName || "gemini-2.5-flash";

  let styleInstruction = `Ton: ${options?.tone || "Profesyonel"}`;
  if (options?.customToneName || options?.customToneDescription) {
    styleInstruction = `Özel Tarz: ${options.customToneName ? `[${options.customToneName}] ` : ""}${options.customToneDescription || ""}`;
  }

  let intensityInstruction = "DENGELİ DEĞİŞİM: Akıcıyı artır, sentaks varyasyonları ekle.";
  let temp = 0.7;
  const intensity = options?.intensity ?? 50;
  if (options?.tone === "Özet") { intensityInstruction = "ÖZETLEME GEREĞİ: Metnin ana fikirlerini koruyarak kısa ve öz bir özet oluştur."; temp = 0.3; }
  else if (intensity >= 70) { intensityInstruction = "RADİKAL İNSANLAŞTIRMA: Cümle yapılarını tamamen değiştir."; temp = 1.0; }
  else if (intensity < 30) { intensityInstruction = "DOĞAL İYİLEŞTİRME: Gramer hatalarını düzelt, küçük akıcılık dokunuşlar yap."; temp = 0.4; }

  const prompt = `GÖREV: Metni insanileştir ve analiz et.\nDİL KURALI: humanizedText TAMAMEN TÜRKÇE olmalıdır.\n${styleInstruction}\n${intensityInstruction}\nJSON: {"humanizedText":"...","aiScore":0.15,"metrics":{"readability":0.85,"complexity":"Profesyonel","toneStrength":0.90,"grammarScore":0.98,"wordCount":150,"readingTime":"2 dk"},"insights":[{"sentence":"...","score":0.8,"detail":"..."}],"sentenceScores":[{"sentence":"...","score":0.1,"type":"human"}]}`;

  try {
    const result = await client.models.generateContent({
      model: selectedModel,
      contents: [{ role: "user", parts: [{ text: `Kaynak Metin: ${text}\n\n${prompt}` }] }],
      config: { temperature: temp, maxOutputTokens: 8192, responseMimeType: "application/json" }
    });
    const parsed = JSON.parse(result.text || "{}");
    return res.status(200).json(parsed);
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || "Sunucu işlem hatası." });
  }
}
