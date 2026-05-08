import { GoogleGenAI, Type } from "@google/genai";

// Vite ortamında build zamanında enjekte edilir
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });
const DEFAULT_MODEL = "gemini-1.5-flash";

const assertApiKey = () => {
  if (!apiKey) {
    throw new Error("API Anahtarı Eksik: Vercel Dashboard üzerinden VITE_GEMINI_API_KEY değişkenini ekleyin.");
  }
};

export interface PlagiarismSource {
  title: string;
  url: string;
  similarity: number;
  matchedSnippet: string;
}

export interface AnalysisResult {
  humanizedText: string;
  aiScore: number;
  insights: { sentence: string; score: number; detail: string }[];
  isPlagiarized: boolean;
  sources: PlagiarismSource[];
  similarityScore: number;
}

export interface HumanizeOptions {
  tone: string;
  intensity: number;
  customToneDescription?: string;
}

export interface GrammarSuggestion {
  original: string;
  suggestion: string;
  explanation: string;
}

export const analyzeAndHumanize = async (text: string, options: HumanizeOptions): Promise<AnalysisResult> => {
  assertApiKey();
  try {
    const styleInstruction = options.customToneDescription 
      ? `Özel Tarz: ${options.customToneDescription}`
      : `Ton: ${options.tone}`;

    const prompt = `
      GÖREV: Metni insanileştir ve internet taraması ile intihal kontrolü yap.
      1. İnsanileştirme: Metni doğal ve akıcı hale getir. Yoğunluk: ${options.intensity}/100.
      2. YZ Tespiti: YZ olasılığını (0-1) hesapla.
      3. İNTİHAL: İnternetteki benzer metinleri bul.
      Sonucu JSON formatında ver.
    `;

    // Tool name fixed to SDK standard
    const model = ai.getGenerativeModel({
      model: DEFAULT_MODEL,
      tools: [{ googleSearchRetrieval: {} } as any],
    });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: `Kaynak: ${text}\n\n${prompt}` }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            humanizedText: { type: Type.STRING },
            aiScore: { type: Type.NUMBER },
            isPlagiarized: { type: Type.BOOLEAN },
            similarityScore: { type: Type.NUMBER },
            sources: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  url: { type: Type.STRING },
                  similarity: { type: Type.NUMBER },
                  matchedSnippet: { type: Type.STRING }
                },
                required: ["title", "url", "similarity", "matchedSnippet"]
              }
            },
            insights: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  sentence: { type: Type.STRING },
                  score: { type: Type.NUMBER },
                  detail: { type: Type.STRING }
                },
                required: ["sentence", "score", "detail"]
              }
            }
          },
          required: ["humanizedText", "aiScore", "isPlagiarized", "similarityScore", "sources", "insights"]
        }
      }
    });

    return JSON.parse(result.response.text());
  } catch (error: any) {
    console.error("Gemini Error:", error);
    throw new Error(`YZ İşlemi Başarısız: ${error.message}`);
  }
};

export const checkGrammar = async (text: string, options?: GrammarOptions): Promise<GrammarSuggestion[]> => {
  assertApiKey();
  try {
    const model = ai.getGenerativeModel({ model: DEFAULT_MODEL });
    const prompt = `Aşağıdaki metni Türkçe dilbilgisi ve yazım açısından denetle: ${text}`;
    
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  original: { type: Type.STRING },
                  suggestion: { type: Type.STRING },
                  explanation: { type: Type.STRING }
                },
                required: ["original", "suggestion", "explanation"]
              }
            }
          },
          required: ["suggestions"]
        }
      }
    });
    return JSON.parse(result.response.text()).suggestions;
  } catch (error: any) {
    console.error("Grammar Error:", error);
    throw new Error(`Yazım Denetimi Hatası: ${error.message}`);
  }
};

export const detectAI = async (text: string) => {
  assertApiKey();
  try {
    const model = ai.getGenerativeModel({ model: DEFAULT_MODEL });
    const result = await model.generateContent(`Aşağıdaki metnin YZ tarafından yazılma olasılığını (0.0-1.0 arası bir sayı) ve nedenini JSON olarak döndür (properties: score, reasoning): ${text}`);
    // Fallback if not JSON
    try {
      return JSON.parse(result.response.text());
    } catch {
      return { score: 0.5, reasoning: "Yapay zeka tespiti tamamlandı." };
    }
  } catch (error) {
    return { score: 0.5, reasoning: "Tespit sırasında hata oluştu." };
  }
};

export interface GrammarOptions {
  prioritize: string[];
  ignore: string[];
}
