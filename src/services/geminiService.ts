import { GoogleGenAI } from "@google/genai";

// Vite build-time environment variables
// Note: vite.config.ts defines process.env.GEMINI_API_KEY
const getApiKey = () => {
  try {
    // Vite token replacement
    const key = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
    return key;
  } catch {
    return import.meta.env.VITE_GEMINI_API_KEY || '';
  }
};

const apiKey = getApiKey();
// The new SDK expects an object: { apiKey: '...' }
const ai = new GoogleGenAI({ apiKey: apiKey || 'dummy-key-for-initialization' });

// SDK might require specific model naming
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
  try {
    const styleInstruction = options.customToneDescription 
      ? `Özel Tarz: ${options.customToneDescription}`
      : `Ton: ${options.tone}`;

    let intensityInstruction = "";
    let temp = 0.5;
    if (options.tone === 'Özet') {
      intensityInstruction = "ÖZETLEME GÖREVİ: Metnin ana fikirlerini koruyarak kısa ve öz bir özet oluştur. Gereksiz detayları at, ancak önemli bilgileri ve tonu muhafaza et.";
      temp = 0.3;
    } else if (options.intensity >= 70) {
      intensityInstruction = "RADİKAL İNSANLAŞTIRMA (Yüksek Yoğunluk): Cümle yapılarını ve uzunluklarını tamamen değiştir, güçlü eşanlamlı kelimeler kullan, paragrafları böl veya birleştir. Orijinal anlamı koruyarak yepyeni, yaratıcı ve tamamen farklı bir metin yarat. Asla kelime kelime aynı bırakma.";
      temp = 1.0;
    } else if (options.intensity >= 30) {
      intensityInstruction = "DENGELİ DÖNÜŞÜM (Orta Yoğunluk): Cümleleri daha akıcı hale getir, kelime tekrarlarını azalt, sentaks varyasyonları ekle.";
      temp = 0.7;
    } else {
      intensityInstruction = "DOĞAL İYİLEŞTİRME (Düşük Yoğunluk): Sadece gramer hatalarını düzelt ve küçük akıcılık dokunuşları yap. Orijinal yapıya sadık kal.";
      temp = 0.4;
    }

    const prompt = `
      GÖREV: Metni insanileştir ve analiz et.
      1. İNSANİLEŞTİRME: Metni YZ tespitinden kaçacak şekilde yeniden yaz.
         - ${styleInstruction}
         - ${intensityInstruction}
      2. YZ TESPİTİ: Metnin orijinal halinin YZ tarafından yazılma olasılığını (0 ile 1 arası) hesapla.
      3. İNTİHAL: Metnin özgünlüğünü kontrol et.
         - SEN BİR DİL MODELİSİN. Eğer %100 emin olduğun GERÇEK ve ÇALIŞAN bir URL yoksa ASLA uydurma (halüsinasyon) link üretme!
         - Gerçekten var olan, bilindik bir kaynak (örneğin Wikipedia vb.) yoksa 'sources' dizisini KESİNLİKLE BOŞ BIRAK ([]). Uydurma domainler yaratma.
      
      ÖNEMLİ: Yanıtını SADECE aşağıdaki JSON formatında ver.
      JSON ŞEMASI:
      {
        "humanizedText": "...",
        "aiScore": 0.15,
        "isPlagiarized": false,
        "similarityScore": 0,
        "sources": [{"title": "...", "url": "...", "similarity": 10, "matchedSnippet": "..."}],
        "insights": [{"sentence": "...", "score": 0.2, "detail": "..."}]
      }
    `;

    const result = await ai.models.generateContent({
      model: DEFAULT_MODEL,
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
    console.error("Gemini Error:", error);
    throw new Error(`YZ İşlemi Başarısız: ${error.message}`);
  }
};

export const checkGrammar = async (text: string, _options?: GrammarOptions): Promise<GrammarSuggestion[]> => {
  assertApiKey();
  try {
    const prompt = `
      Aşağıdaki metni Türkçe dilbilgisi ve yazım açısından denetle.
      Yanıtını SADECE JSON formatında ver.
      JSON ŞEMASI:
      {
        "suggestions": [{"original": "...", "suggestion": "...", "explanation": "..."}]
      }
      Metin: ${text}
    `;
    
    const result = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        temperature: 0.1,
      } as any
    });

    const responseText = result.text;
    const parsed = JSON.parse(responseText || '{}');
    return parsed.suggestions || [];
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
      contents: [{ role: "user", parts: [{ text: `Metnin YZ olasılığını (0-1) hesapla ve JSON olarak dön: { "score": number, "reasoning": string }. Metin: ${text}` }] }],
      config: {
        responseMimeType: "application/json",
        temperature: 0.1,
      } as any
    });

    const responseText = result.text;
    const parsed = JSON.parse(responseText || '{}');
    return {
      score: typeof parsed.score === 'number' ? parsed.score : 0.5,
      reasoning: parsed.reasoning || "Analiz tamamlandı."
    };
  } catch (error) {
    console.error("AI Detection Error:", error);
    return { score: 0.5, reasoning: "Tespit tamamlandı." };
  }
};
