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

  const { text, sensitivity, modelName } = req.body || {};
  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Geçerli bir metin girilmedi." });
  }

  const apiKey = getApiKey();
  const client = new GoogleGenAI({ apiKey });
  const selectedModel = modelName || "gemini-2.5-flash-lite";
  const sens = sensitivity || 50;

  const sensitivityDesc = sens > 70 ? "ÇOK HASSAS" : sens < 30 ? "HOŞGÖRÜLÜ" : "DENGELİ";
  const prompt = `Metni Originality Auditor olarak analiz et. Hassasiyet: ${sens}/100 (${sensitivityDesc}).\nMetin: ${text}\nJSON: {"score":0.85,"reasoning":"...","sentenceScores":[{"sentence":"...","score":0.9,"type":"ai","reason":"..."}],"metrics":{"plagiarism":0.05,"readability":0.75,"complexity":"Profesyonel","burstiness":0.4,"perplexity":0.3,"structureScore":0.8},"highlights":[]}`;

  try {
    const result = await client.models.generateContent({
      model: selectedModel,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { temperature: 0, responseMimeType: "application/json" }
    });
    return res.status(200).json(JSON.parse(result.text || "{}"));
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || "Dedektör işlem hatası." });
  }
}
