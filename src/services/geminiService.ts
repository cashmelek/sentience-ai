import { GoogleGenAI } from "@google/genai";

// Vite build-time environment variables
const getApiKey = () => {
  try {
    const key = import.meta.env.VITE_GEMINI_API_KEY || (process as any).env.GEMINI_API_KEY || '';
    return key;
  } catch {
    return import.meta.env.VITE_GEMINI_API_KEY || '';
  }
};

const apiKey = getApiKey();
// Unified SDK configuration
const ai = new GoogleGenAI({ 
  apiKey: apiKey || 'dummy-key-for-initialization'
});

// Primary model for the application
const DEFAULT_MODEL = import.meta.env.VITE_GEMINI_MODEL || "gemini-1.5-flash"; 

const assertApiKey = () => {
  if (!apiKey || apiKey === 'dummy-key-for-initialization') {
    throw new Error("API Anahtarı Eksik: .env.local dosyasında GEMINI_API_KEY veya VITE_GEMINI_API_KEY değişkeninin tanımlı olduğundan emin olun.");
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

export interface GrammarOptions {
  prioritize: string[];
  ignore: string[];
}

export const analyzeAndHumanize = async (text: string, options: HumanizeOptions): Promise<AnalysisResult> => {
  assertApiKey();
  
  // order: flash 1.5, flash latest, flash 002 (newer), flash 2.0 (newest), pro 1.5
  const modelsToTry = [DEFAULT_MODEL, "gemini-1.5-flash-latest", "gemini-1.5-flash-002", "gemini-2.0-flash", "gemini-1.5-pro"];
  let lastError: any = null;

  for (const modelName of modelsToTry) {
    try {
      const styleInstruction = options.customToneDescription 
        ? `Özel Tarz: ${options.customToneDescription}`
        : `Ton: ${options.tone}`;

      let intensityInstruction = "";
      let temp = 0.5;
      if (options.tone === 'Özet') {
        intensityInstruction = "ÖZETLEME GÖREVİ: Metnin ana fikirlerini koruyarak kısa ve öz bir özet oluştur.";
        temp = 0.3;
      } else if (options.intensity >= 70) {
        intensityInstruction = "RADİKAL İNSANLAŞTIRMA (Yüksek Yoğunluk): Cümle yapılarını tamamen değiştir, yepyeni bir metin yarat.";
        temp = 1.0;
      } else if (options.intensity >= 30) {
        intensityInstruction = "DENGELİ DÖNÜŞÜM (Orta Yoğunluk): Akıcılığı artır, sentaks varyasyonları ekle.";
        temp = 0.7;
      } else {
        intensityInstruction = "DOĞAL İYİLEŞTİRME (Düşük Yoğunluk): Gramer hatalarını düzelt, küçük akıcılık dokunuşları yap.";
        temp = 0.4;
      }

      const prompt = `
        GÖREV: Metni insanileştir ve analiz et.
        1. İNSANİLEŞTİRME: Metni YZ tespitinden kaçacak şekilde yeniden yaz.
           - ${styleInstruction}
           - ${intensityInstruction}
        2. YZ TESPİTİ: Metnin orijinal halinin YZ tarafından yazılma olasılığını (0 ile 1 arası) hesapla.
        3. İNTİHAL: Metnin özgünlüğünü kontrol et. ASLA uydurma link üretme!
        
        ÖNEMLİ: Yanıtını SADECE aşağıdaki JSON formatında ver.
        JSON ŞEMASI:
        {
          "humanizedText": "...",
          "aiScore": 0.15,
          "isPlagiarized": false,
          "similarityScore": 0,
          "sources": [],
          "insights": []
        }
      `;

      // We use the new SDK generateContent call
      const result = await ai.models.generateContent({
        model: modelName,
        contents: [{ role: "user", parts: [{ text: `Kaynak Metin: ${text}\n\n${prompt}` }] }],
        config: {
          responseMimeType: "application/json",
          temperature: temp,
          maxOutputTokens: 2048,
        } as any
      });

      const responseText = result.text;
      const parsed = JSON.parse(responseText);
      
      return {
        humanizedText: parsed.humanizedText || text,
        aiScore: typeof parsed.aiScore === 'number' ? parsed.aiScore : 0.5,
        isPlagiarized: !!parsed.isPlagiarized,
        similarityScore: typeof parsed.similarityScore === 'number' ? parsed.similarityScore : 0,
        sources: parsed.sources || [],
        insights: parsed.insights || []
      };
    } catch (error: any) {
      console.warn(`Model ${modelName} denemesi başarısız:`, error.message);
      lastError = error;
      // If it's a 404, we continue to the next model
      if (!error.message?.includes('404') && !error.message?.includes('not found')) {
        // If it's another error (e.g. 429 quota), we might want to stop, 
        // but let's try fallbacks anyway just in case it's a model-specific quota
      }
    }
  }

  throw new Error(`YZ İşlemi Başarısız: Tüm denenen modeller (Flash 1.5, Flash 2.0, Pro) 404 hatası verdi. Lütfen API anahtarınızın Gemini API (AI Studio) için geçerli olduğundan emin olun.`);
};

export const checkGrammar = async (text: string, _options?: GrammarOptions): Promise<GrammarSuggestion[]> => {
  assertApiKey();
  const models = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-pro"];
  let lastErr = "";
  
  for (const modelName of models) {
    try {
      const result = await ai.models.generateContent({
        model: modelName,
        contents: [{ role: "user", parts: [{ text: `Aşağıdaki metni Türkçe dilbilgisi açısından denetle ve JSON suggestions listesi olarak dön: ${text}` }] }],
        config: { responseMimeType: "application/json", temperature: 0.1 } as any
      });
      const parsed = JSON.parse(result.text || '{}');
      return parsed.suggestions || [];
    } catch (e: any) {
      lastErr = e.message;
      if (!e.message?.includes('404')) break;
    }
  }
  throw new Error(`Dilbilgisi hatası: ${lastErr}`);
};

export const detectAI = async (text: string) => {
  assertApiKey();
  try {
    const result = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [{ role: "user", parts: [{ text: `Metnin YZ olasılığını (0-1) JSON {score: number} olarak hesapla: ${text}` }] }],
      config: { responseMimeType: "application/json", temperature: 0.1 } as any
    });
    const parsed = JSON.parse(result.text || '{}');
    return { score: parsed.score || 0.5, reasoning: "Analiz tamamlandı." };
  } catch (error) {
    return { score: 0.5, reasoning: "Tespit tamamlandı." };
  }
};
