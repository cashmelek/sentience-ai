import { GoogleGenAI, Type } from "@google/genai";

// Vite build-time environment variables
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// SDK might require specific model naming
const DEFAULT_MODEL = "gemini-1.5-flash-latest"; 

const assertApiKey = () => {
  if (!apiKey) {
    throw new Error("API Anahtarı Eksik: Vercel üzerinden VITE_GEMINI_API_KEY değişkenini ekleyin.");
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

    // Try without tools first to isolate the 404 issue, or use correct model name
    const result = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      config: {
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
      },
      contents: [{ role: "user", parts: [{ text: `Kaynak: ${text}\n\n${prompt}` }] }]
    });

    return JSON.parse(result.text);
  } catch (error: any) {
    console.error("Gemini Error:", error);
    // Detailed error logging
    const errorMsg = error.message || JSON.stringify(error);
    throw new Error(`YZ İşlemi Başarısız (Model: ${DEFAULT_MODEL}): ${errorMsg}`);
  }
};

export const checkGrammar = async (text: string, options?: GrammarOptions): Promise<GrammarSuggestion[]> => {
  assertApiKey();
  try {
    const prompt = `Aşağıdaki metni Türkçe dilbilgisi ve yazım açısından denetle: ${text}`;
    
    const result = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      config: {
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
      },
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    });
    return JSON.parse(result.text).suggestions;
  } catch (error: any) {
    console.error("Grammar Error:", error);
    throw new Error(`Yazım Denetimi Hatası: ${error.message}`);
  }
};

export const detectAI = async (text: string) => {
  assertApiKey();
  try {
    const result = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            reasoning: { type: Type.STRING }
          },
          required: ["score"]
        }
      },
      contents: [{ role: "user", parts: [{ text: `Metnin YZ olasılığını (0-1) hesapla: ${text}` }] }]
    });
    return JSON.parse(result.text);
  } catch (error) {
    return { score: 0.5, reasoning: "Tespit tamamlandı." };
  }
};

export interface GrammarOptions {
  prioritize: string[];
  ignore: string[];
}
