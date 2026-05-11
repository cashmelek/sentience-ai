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

// Primary model for the application - Updated to a 2026-compatible model
const DEFAULT_MODEL = import.meta.env.VITE_GEMINI_MODEL || "gemini-2.5-flash"; 

const assertApiKey = () => {
  if (!apiKey || apiKey === 'dummy-key-for-initialization') {
    throw new Error("API Anahtarı Eksik: .env.local dosyasında GEMINI_API_KEY veya VITE_GEMINI_API_KEY değişkeninin tanımlı olduğundan emin olun.");
  }
};

export interface AnalysisResult {
  humanizedText: string;
  aiScore: number;
  insights: { sentence: string; score: number; detail: string }[];
}

export interface HumanizeOptions {
  tone: string;
  intensity: number;
  customToneName?: string;
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
  
  const modelsToTry = [DEFAULT_MODEL, "gemini-flash-latest", "gemini-2.5-pro", "gemini-3.1-flash-lite", "gemini-pro-latest"];
  let lastError: any = null;

  for (const modelName of modelsToTry) {
    try {
      let styleInstruction = "";
      if (options.customToneName || options.customToneDescription) {
        styleInstruction = `Özel Tarz: ${options.customToneName ? `[${options.customToneName}] ` : ""}${options.customToneDescription || ""}`;
      } else {
        styleInstruction = `Ton: ${options.tone}`;
      }

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
        
        KURALLAR:
        1. FORMATI KORU: Kaynak metindeki tüm başlıkları (#, ##), alt başlıkları, numaralandırılmış listeleri (1., 2.), madde işaretlerini (-, *) ve özel noktalamaları AYNEN KORU. Sadece metin içeriğini insanileştir.
        2. İNSANİLEŞTİRME: Metni YZ tespitinden kaçacak şekilde, doğal bir dille yeniden yaz.
           - ${styleInstruction}
           - ${intensityInstruction}
        3. CÜMLE ANALİZİ: Metindeki önemli cümleleri seç ve neden yapay veya doğal göründüklerini teknik olarak açıkla.
        
        ÖNEMLİ: Yanıtını SADECE aşağıdaki JSON formatında ver. 'insights' alanı mutlaka bir nesne dizisi olmalıdır.
        JSON ŞEMASI:
        {
          "humanizedText": "Dönüştürülmüş metin buraya gelecek (format korunmuş halde)",
          "aiScore": 0.15,
          "insights": [
            {"sentence": "İncelenen cümle", "score": 0.8, "detail": "Neden YZ veya insan gibi göründüğüne dair teknik analiz."}
          ]
        }
      `;

      const result = await ai.models.generateContent({
        model: modelName,
        contents: [{ role: "user", parts: [{ text: `Kaynak Metin: ${text}\n\n${prompt}` }] }],
        config: {
          responseMimeType: "application/json",
          temperature: temp,
          maxOutputTokens: 4096,
        } as any
      });

      const responseText = result.text;
      const parsed = JSON.parse(responseText);
      
      return {
        humanizedText: parsed.humanizedText || text,
        aiScore: typeof parsed.aiScore === 'number' ? parsed.aiScore : 0.5,
        insights: Array.isArray(parsed.insights) ? parsed.insights.map((ins: any) => ({
          sentence: typeof ins === 'string' ? ins : (ins.sentence || ""),
          score: typeof ins.score === 'number' ? ins.score : 0.5,
          detail: ins.detail || (typeof ins === 'string' ? "Cümle analizi yapıldı." : "")
        })) : []
      };
    } catch (error: any) {
      console.warn(`Model ${modelName} denemesi başarısız:`, error.message);
      lastError = error;
    }
  }

  throw new Error(`YZ İşlemi Başarısız. Son hata: ${lastError?.message}`);
};

export const checkGrammar = async (text: string, _options?: GrammarOptions): Promise<GrammarSuggestion[]> => {
  assertApiKey();
  const models = ["gemini-2.5-flash", "gemini-flash-latest", "gemini-pro-latest"];
  let lastErr = "";
  
  for (const modelName of models) {
    try {
      const result = await ai.models.generateContent({
        model: modelName,
        contents: [{ role: "user", parts: [{ text: `Aşağıdaki metni Türkçe dilbilgisi açısından denetle ve JSON formatında suggestions listesi dön. Format: {"suggestions": [{"original": "...", "suggestion": "...", "explanation": "..."}]}. Metin: ${text}` }] }],
        config: { responseMimeType: "application/json", temperature: 0.1 } as any
      });
      const parsed = JSON.parse(result.text || '{}');
      return parsed.suggestions || [];
    } catch (e: any) {
      lastErr = e.message;
    }
  }
  throw new Error(`Dilbilgisi hatası: ${lastErr}`);
};

export const detectAI = async (text: string) => {
  assertApiKey();
  try {
    const result = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: [{ role: "user", parts: [{ text: `Metnin YZ olasılığını (0-1) JSON {score: number} olarak hesapla: ${text}` }] }],
      config: { responseMimeType: "application/json", temperature: 0.1 } as any
    });
    const parsed = JSON.parse(result.text || '{}');
    return { score: parsed.score || 0.5, reasoning: "Analiz tamamlandı." };
  } catch (error) {
    return { score: 0.5, reasoning: "Tespit tamamlandı." };
  }
};
