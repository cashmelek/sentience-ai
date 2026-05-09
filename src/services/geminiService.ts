import { GoogleGenAI, Type } from "@google/genai";

// Vite build-time environment variables
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey, apiVersion: 'v1' });

// SDK might require specific model naming
const DEFAULT_MODEL = import.meta.env.VITE_GEMINI_MODEL || "gemini-1.5-flash"; 

const assertApiKey = () => {
  if (!apiKey) {
    throw new Error("API Anahtarı Eksik: .env.local dosyasında VITE_GEMINI_API_KEY değişkeninin tanımlı olduğundan emin olun.");
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

    let intensityInstruction = "";
    let temp = 0.5;
    if (options.tone === 'Özet') {
      intensityInstruction = "ÖZETLEME GÖREVİ: Metnin ana fikirlerini koruyarak kısa ve öz bir özet oluştur. Gereksiz detayları at, ancak önemli bilgileri ve tonu muhafaza et.";
      temp = 0.3; // Summarization should be more deterministic
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
      
      ÖNEMLİ: Yanıtını SADECE aşağıdaki JSON formatında ver. Başka hiçbir açıklama metni ekleme.
      JSON FORMATI:
      {
        "humanizedText": "İnsanileştirilmiş metin buraya",
        "aiScore": 0.15,
        "isPlagiarized": false,
        "similarityScore": 0,
        "sources": [{"title": "Gerçek Başlık", "url": "Gerçek Link", "similarity": 10, "matchedSnippet": "..."}],
        "insights": [{"sentence": "...", "score": 0.2, "detail": "..."}]
      }
    `;

    // Try without tools first to isolate the 404 issue, or use correct model name
    const result = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      config: {
        responseMimeType: "application/json",
        temperature: temp,
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

    // Robust JSON extraction: find the first { and last }
    const startIndex = result.text.indexOf('{');
    const endIndex = result.text.lastIndexOf('}');
    
    if (startIndex === -1 || endIndex === -1) {
      throw new Error("Geçerli bir JSON yanıtı alınamadı.");
    }
    
    const cleanedText = result.text.substring(startIndex, endIndex + 1);
    console.log("Raw Gemini Response (Cleaned):", cleanedText);
    
    const parsed = JSON.parse(cleanedText);
    
    // Normalize keys to handle potential model casing and language inconsistencies
    const normalized: AnalysisResult = {
      humanizedText: parsed.humanizedText || parsed.humanized_text || parsed.insanilestirilmis_metin || parsed.insanilestirilmisMetin || parsed.text || text,
      aiScore: typeof (parsed.aiScore ?? parsed.ai_score ?? parsed.yz_skoru ?? parsed.yzSkoru ?? parsed.score) === 'number' 
        ? (parsed.aiScore ?? parsed.ai_score ?? parsed.yz_skoru ?? parsed.yzSkoru ?? parsed.score) 
        : 0.5,
      isPlagiarized: typeof (parsed.isPlagiarized ?? parsed.is_plagiarized ?? parsed.intihal_mi ?? parsed.intihalMi) === 'boolean'
        ? (parsed.isPlagiarized ?? parsed.is_plagiarized ?? parsed.intihal_mi ?? parsed.intihalMi)
        : false,
      similarityScore: typeof (parsed.similarityScore ?? parsed.similarity_score ?? parsed.benzerlik_skoru ?? parsed.benzerlikSkoru) === 'number'
        ? (parsed.similarityScore ?? parsed.similarity_score ?? parsed.benzerlik_skoru ?? parsed.benzerlikSkoru)
        : 0,
      sources: parsed.sources || parsed.plagiarism_sources || parsed.kaynaklar || [],
      insights: parsed.insights || parsed.analysis_insights || parsed.analiz_detaylari || []
    };

    // Extra fallback: if humanizedText is still too short or same as original, check other string fields
    if (normalized.humanizedText === text || normalized.humanizedText.length < 5) {
      const otherStringField = Object.values(parsed).find(v => typeof v === 'string' && v.length > 20);
      if (otherStringField) normalized.humanizedText = otherStringField as string;
    }
    
    return normalized;
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
    const prompt = `
      Aşağıdaki metni Türkçe dilbilgisi ve yazım açısından denetle.
      Yanıtını SADECE JSON formatında ver. Başka hiçbir açıklama metni ekleme.
      JSON FORMATI:
      {
        "suggestions": [
          {"original": "hatalı kelime", "suggestion": "doğru kelime", "explanation": "neden?"}
        ]
      }
      Metin: ${text}
    `;
    
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
    // Robust JSON extraction
    const startIndex = result.text.indexOf('{');
    const endIndex = result.text.lastIndexOf('}');
    if (startIndex === -1 || endIndex === -1) throw new Error("Geçerli bir JSON yanıtı alınamadı.");
    
    const cleanedText = result.text.substring(startIndex, endIndex + 1);
    console.log("Grammar Check Raw Response (Cleaned):", cleanedText);
    const parsed = JSON.parse(cleanedText);
    return parsed.suggestions || parsed.items || parsed.oneriler || [];
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
    // Robust JSON extraction
    const startIndex = result.text.indexOf('{');
    const endIndex = result.text.lastIndexOf('}');
    if (startIndex === -1 || endIndex === -1) throw new Error("Geçerli bir JSON yanıtı alınamadı.");
    
    const cleanedText = result.text.substring(startIndex, endIndex + 1);
    console.log("AI Detection Raw Response (Cleaned):", cleanedText);
    const parsed = JSON.parse(cleanedText);
    return {
      score: typeof (parsed.score ?? parsed.skor) === 'number' ? (parsed.score ?? parsed.skor) : 0.5,
      reasoning: parsed.reasoning || parsed.aciklama || "Analiz tamamlandı."
    };
  } catch (error) {
    return { score: 0.5, reasoning: "Tespit tamamlandı." };
  }
};

export interface GrammarOptions {
  prioritize: string[];
  ignore: string[];
}
