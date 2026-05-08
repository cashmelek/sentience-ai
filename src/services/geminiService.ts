import { GoogleGenAI, Type } from "@google/genai";

// Vite ortamında import.meta.env kullanılır
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });
const DEFAULT_MODEL = "gemini-1.5-flash";

const assertApiKey = () => {
  if (!apiKey) {
    console.error("KRİTİK: VITE_GEMINI_API_KEY eksik!");
    throw new Error("Gemini API anahtarı bulunamadı. Lütfen Vercel ayarlarından VITE_GEMINI_API_KEY değişkenini kontrol edin.");
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
      GÖREV: Metni insanileştir ve Google Arama ile intihal kontrolü yap.
      
      1. İnsanileştirme: Metni daha doğal ve akıcı hale getir.
         - Mantık: ${styleInstruction}
         - Yoğunluk: ${options.intensity}/100.
         
      2. YZ Tespiti: YZ tarafından yazılma olasılığını (0.0 - 1.0) hesapla.
      
      3. İNTİHAL: Google Search aracını kullanarak internetteki benzer metinleri bul.
         - 'sources': [{ title, url, similarity, matchedSnippet }]
      
      Çıktıyı kesinlikle JSON formatında ver.
    `;

    const model = ai.getGenerativeModel({
      model: DEFAULT_MODEL,
      tools: [{ googleSearch: {} } as any],
    });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: `Kaynak Metin: ${text}\n\n${prompt}` }] }],
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

    const responseText = result.response.text();
    return JSON.parse(responseText);
  } catch (error) {
    console.error("analyzeAndHumanize hatası:", error);
    throw error;
  }
};

export const checkGrammar = async (text: string, options?: GrammarOptions): Promise<GrammarSuggestion[]> => {
  assertApiKey();
  try {
    const prompt = `
      Aşağıdaki metni Türkçe dilbilgisi ve yazım kuralları açısından denetle.
      Metin: ${text}
      Sonucu 'suggestions' dizisi içeren bir JSON olarak dön.
    `;

    const model = ai.getGenerativeModel({ model: DEFAULT_MODEL });
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
  } catch (error) {
    console.error("checkGrammar hatası:", error);
    return [];
  }
};

export const detectAI = async (text: string) => {
  assertApiKey();
  try {
    const model = ai.getGenerativeModel({ model: DEFAULT_MODEL });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: `Metnin YZ olasılığını (0-1) hesapla: ${text}` }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            reasoning: { type: Type.STRING }
          },
          required: ["score"]
        }
      }
    });
    return JSON.parse(result.response.text());
  } catch (error) {
    console.error("detectAI hatası:", error);
    return { score: 0.5, reasoning: "Hata" };
  }
};

export interface GrammarOptions {
  prioritize: string[];
  ignore: string[];
}
