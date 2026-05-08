import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
// Use gemini-1.5-flash for maximum stability and tool compatibility
const DEFAULT_MODEL = "gemini-1.5-flash";

const assertApiKey = () => {
  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is missing!");
    throw new Error("GEMINI_API_KEY eksik. .env.local dosyasina ekleyin.");
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
      ? `Custom Refinement Logic: ${options.customToneDescription}`
      : `Target Reader Profile: ${options.tone}`;

    const prompt = `
      TASK: Humanize the provided text for bypassing advanced AI detectors and perform an exhaustive plagiarism check.
      
      1. Humanize: Rewrite the text to exhibit high 'perplexity' and 'burstiness'.
         - Logic: ${styleInstruction}
         - Intensity Scale: ${options.intensity}/100.
         
      2. AI Integrity Check: Provide an AI Detection Score (0.0 to 1.0).
      
      3. PLAGIARISM CHECK: Identify any potential matches.
      
      Output JSON. Ensure 'humanizedText' is polished.
    `;

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: [{ role: "user", parts: [{ text: `Orijinal Metin: ${text}\n\n${prompt}` }] }],
      config: {
        // Removed googleSearch temporarily to ensure basic humanize works first
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

    return JSON.parse(response.text);
  } catch (error) {
    console.error("analyzeAndHumanize Error:", error);
    throw error;
  }
};

export const checkGrammar = async (text: string, options?: GrammarOptions): Promise<GrammarSuggestion[]> => {
  assertApiKey();
  try {
    const priorityInfo = options?.prioritize?.length ? `Prioritize these types: ${options.prioritize.join(', ')}.` : '';
    const ignoreInfo = options?.ignore?.length ? `Ignore these types: ${options.ignore.join(', ')}.` : '';
    
    const prompt = `
      Analyze the text for Turkish grammar, nuance, spelling, and professional style. 
      ${priorityInfo}
      ${ignoreInfo}
      Text: ${text}
    `;

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
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
      }
    });
    return JSON.parse(response.text).suggestions;
  } catch (error) {
    console.error("checkGrammar Error:", error);
    return [];
  }
};

export const detectAI = async (text: string) => {
  assertApiKey();
  try {
    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: [{ role: "user", parts: [{ text: `Detect AI probability (0-1). Text: ${text}` }] }],
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
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("detectAI Error:", error);
    return { score: 0.5, reasoning: "Error during detection" };
  }
};

export interface GrammarOptions {
  prioritize: string[];
  ignore: string[];
}
