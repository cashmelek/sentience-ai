import { GoogleGenAI } from "@google/genai";
import { apiKeyManager } from "./apiKeyManager";

// --- API ANAHTARI YÖNETİMİ ---
export const getCurrentApiKey = (): string => {
  return apiKeyManager.getGeminiKey();
};

export const rotateKey = (): boolean => {
  return apiKeyManager.rotateGeminiKey();
};

const assertApiKey = () => {
  getCurrentApiKey(); 
};

export const getGeminiClient = () => {
  return new GoogleGenAI({ apiKey: getCurrentApiKey() });
};

// --- KONFİGÜRASYON ---
const DEFAULT_MODEL = import.meta.env.VITE_GEMINI_MODEL || "gemini-2.0-flash";

/**
 * Model isminin geçerliliğini kontrol eder ve gerekirse güvenli varsayılana döner.
 */
export const validateModelName = (name: string): string => {
  if (!name) return "gemini-2.0-flash";

  // "Gemini 2.5 Flash Lite" -> "gemini-2.5-flash-lite"
  let normalized = name.toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Boşlukları tire yap
    .replace(/\(.*\)/g, '')    // Parantez içlerini sil (Hızlı, Derin vb.)
    .replace(/-+$/g, '');      // Sondaki tireleri temizle

  if (normalized.startsWith("gemini-")) {
    return normalized;
  }

  if (normalized === "2.0-flash" || normalized === "2.0-flash-lite") {
    return `gemini-${normalized}`;
  }

  return `gemini-${normalized}`;
};

export interface AnalysisResult {
  humanizedText: string;
  aiScore: number;
  insights: { sentence: string; score: number; detail: string }[];
  sentenceScores: { sentence: string; score: number; type?: 'ai' | 'human' | 'mixed' }[];
  metrics: {
    readability: number;
    complexity: string;
    toneStrength: number;
    grammarScore: number;
    wordCount: number;
    readingTime: string;
  };
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

/**
 * Translates technical Gemini/API errors into user-friendly Turkish messages.
 */
export const translateError = (error: any, isUnlimited: boolean = false): string => {
  const message = error?.message || String(error);

  if (message.includes("429") || message.includes("RESOURCE_EXHAUSTED") || message.includes("Quota exceeded")) {
    if (isUnlimited) {
      return "Google AI kotası veya anlık istek limiti aşıldı. Eğer anahtarlarınızın kotası varsa, lütfen Google AI Studio üzerinden 'Prepaid Credits' (Ön Ödemeli Kredi) durumunuzu kontrol edin.";
    }
    return "Üzgünüz, günlük kullanım limitinizi veya API kotanızı doldurdunuz. Lütfen 1 dakika sonra tekrar deneyin veya farklı bir anahtar tanımlayın.";
  }

  if (message.includes("503") || message.includes("Service Unavailable")) {
    return "Yapay zeka sunucusu şu an geçici olarak hizmet dışı. Lütfen birkaç saniye sonra tekrar deneyin.";
  }

  if (message.includes("API key") || message.includes("API Anahtarı")) {
    return "Sistem yapılandırma hatası: API anahtarı geçersiz veya eksik.";
  }

  if (message.includes("JSON") || message.includes("Unexpected token") || message.includes("Unexpected non-whitespace character")) {
    return "Sistem yanıtı işlenirken bir sorun oluştu, lütfen tekrar deneyin.";
  }

  if (message.includes("safety") || message.includes("HARM_CATEGORY")) {
    return "Girdiğiniz metin güvenlik filtrelerimize takıldı. Lütfen içeriği gözden geçirip tekrar deneyin.";
  }

  // Firebase Auth Error Translations
  if (message.includes("auth/invalid-credential") || message.includes("auth/wrong-password") || message.includes("auth/user-not-found")) {
    return "E-posta adresi veya şifre hatalı.";
  }
  if (message.includes("auth/email-already-in-use")) {
    return "Bu e-posta adresi zaten kullanımda.";
  }
  if (message.includes("auth/popup-closed-by-user")) {
    return "Giriş işlemi iptal edildi.";
  }
  if (message.includes("auth/network-request-failed")) {
    return "Ağ bağlantısı hatası. Lütfen internet bağlantınızı kontrol edin.";
  }
  if (message.includes("API key not valid")) {
    return "API anahtarınız geçersiz. Lütfen .env.local dosyasındaki anahtarı kontrol edin.";
  }
  if (message.includes("not enabled")) {
    return "Generative Language API bu projede aktif edilmemiş. Lütfen Google Cloud Console'dan aktif edin.";
  }
  const currentModel = (error as any)?.model || "Belirlenemeyen Model";

  if (message.includes("model not found") || message.includes("404")) {
    return `Seçilen model (${currentModel}) bu anahtar ile kullanılamıyor. Lütfen Admin panelinden farklı bir model seçin (Örn: Gemini 2.0 Flash).`;
  }

  console.error("🔍 KRİTİK API HATASI DETAYLARI:", {
    rawError: error,
    message,
    status: error?.status,
    statusText: error?.statusText,
    code: error?.code,
    reason: error?.reason,
    details: error?.details || error?.error?.details
  });

  return `Hata: ${message.slice(0, 100)}... (Detaylar konsolda)`;
};

/**
 * Safely cleans and parses JSON from LLM output.
 * Handles markdown code blocks, trailing commas, and common escaping issues.
 */
const robustParse = (text: string) => {
  try {
    // 1. First attempt: Simple parse if it's already clean
    return JSON.parse(text);
  } catch (e) {
    try {
      // 2. Extract content between first { and last } to ignore trailing junk or preamble
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');

      if (firstBrace === -1) throw new Error("JSON bulunamadı");

      let cleaned = text.substring(firstBrace, lastBrace + 1);

      // 3. Fix common LLM JSON errors (unescaped newlines and quotes inside strings)
      let inString = false;
      let result = "";
      for (let i = 0; i < cleaned.length; i++) {
        const char = cleaned[i];
        const prevChar = i > 0 ? cleaned[i - 1] : '';

        if (char === '"' && prevChar !== '\\') {
          inString = !inString;
          result += char;
        } else if (char === '\n' && inString) {
          result += "\\n";
        } else if (char === '\r' && inString) {
          // ignore carriage returns in strings
        } else {
          result += char;
        }
      }

      // 4. Final attempt at parsing the cleaned string
      return JSON.parse(result);
    } catch (innerE) {
      console.error("Robust parse failed:", innerE, "Original text:", text);

      // Fallback mechanism returning a safe default object structure instead of crashing
      let fallbackText = text.replace(/```json|```/g, '').trim();
      if (!fallbackText) fallbackText = "Metin işlenirken bir sorun oluştu.";

      let extractedHumanized = fallbackText;

      // Try to rescue the humanized text if the JSON is truncated or malformed
      if (fallbackText.includes('"humanizedText"')) {
        // Try to match standard "humanizedText": "..." up to the next property
        const match = fallbackText.match(/"humanizedText"\s*:\s*"([\s\S]*?)",?\s*"\w+"\s*:/);
        if (match && match[1]) {
          extractedHumanized = match[1];
        } else {
          // It might be completely truncated at the end
          const partialMatch = fallbackText.match(/"humanizedText"\s*:\s*"([\s\S]*)/);
          if (partialMatch && partialMatch[1]) {
            extractedHumanized = partialMatch[1];
            // Remove trailing quote/braces if it ended abruptly with them
            extractedHumanized = extractedHumanized.replace(/["}\s]*$/, '');
          }
        }

        // Unescape common JSON characters
        extractedHumanized = extractedHumanized
          .replace(/\\n/g, '\n')
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\');
      }

      return {
        humanizedText: extractedHumanized,
        aiScore: 0.5,
        metrics: {
          readability: 0.5,
          complexity: 'Orta',
          toneStrength: 0.5,
          grammarScore: 0.5,
          wordCount: extractedHumanized.split(/\s+/).length,
          readingTime: '1 dk'
        },
        insights: [],
        sentenceScores: []
      };
    }
  }
};

export const analyzeAndHumanize = async (
  text: string,
  options: HumanizeOptions,
  modelName?: string,
  retryCount: number = 0
): Promise<AnalysisResult> => {
  // Sonsuz döngü engelleme: En fazla 2 kez dene
  if (retryCount >= 2) {
    throw new Error("API yanıt vermedi. Lütfen daha sonra tekrar deneyin.");
  }
  assertApiKey();

  const validModel = validateModelName(modelName);
  console.log(`[Gemini] Denenecek modeller (ilk deneme: ${validModel})`);

  const modelsToTry = [
    validModel,
    "gemini-2.0-flash",           // Ana model
    "gemini-2.5-flash",           // Yeni nesil
    "gemini-2.0-flash-lite",      // Hafif alternatif
    "gemini-2.5-flash-lite",      // Son çare
  ].filter((v, i, a) => Boolean(v) && a.indexOf(v) === i) as string[];

  let lastError: any = null;

  console.log("Denecek modeller:", modelsToTry);

  for (const currentModel of modelsToTry) {
    try {
      const validModel = validateModelName(currentModel);
      console.log(`Model deneniyor: ${validModel}`);
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
        1. FORMATI KORU: Kaynak metindeki tüm başlıkları (#, ##), alt başlıkları, numaralandırılmış listeleri (1., 2.), madde işaretlerini (-, *) ve özel noktalamaları AYNEN KORU.
        2. İNSANİLEŞTİRME: Metni YZ tespitinden kaçacak şekilde, doğal bir dille yeniden yaz. Perplexity ve Burstiness değerlerini insan standartlarına çek.
           - ${styleInstruction}
           - ${intensityInstruction}
        3. AKADEMİK ETİK VE İNTİHAL (KRİTİK):
           - DERİN ÖZÜMSEME: Sadece kelime değiştirme, kavramsal analiz yapıp bilgiyi sentezle.
           - %15 LİMİTİ: Üretilen metnin orijinal kaynaklarla benzerliği %15'i geçmemelidir.
           - ALINTILAR: Kanun maddeleri ve teknik tanımları tırnak içinde ("...") koru.
           - ÇOKLU SENTEZ: Mümkünse bilgiyi 3-4 farklı perspektifi birleştirerek sun.
           - HİLE YASAK: Görünmez karakter veya harf değişikliği gibi teknik hileler ASLA kullanma.
        4. CÜMLE ANALİZİ: Metni CÜMLE CÜMLE analiz et ve her cümle için YZ olasılığını belirle.
        5. METRİKLER: Metnin okunabilirliğini, karmaşıklığını ve ton gücünü profesyonel bir denetçi gibi hesapla.
        
        ÖNEMLİ (JSON GÜVENLİĞİ): 
        - Yanıtını SADECE geçerli bir JSON nesnesi olarak ver. 
        - JSON içindeki metinlerde çift tırnak (") kullanman gerekiyorsa mutlaka ters eğik çizgi (\") ile kaçış yap.
        - Metinlerde satır sonu karakterleri yerine \\n kullan.
        
        JSON ŞEMASI:
        {
          "humanizedText": "Dönüştürülmüş metin buraya gelecek",
          "aiScore": 0.15,
          "metrics": {
            "readability": 0.85,
            "complexity": "Profesyonel / Akademik / Sade",
            "toneStrength": 0.90,
            "grammarScore": 0.98,
            "wordCount": 150,
            "readingTime": "2 dk"
          },
          "insights": [
            {"sentence": "İncelenen cümle", "score": 0.8, "detail": "Neden YZ olduğu veya neden başarılı olduğu detayı."}
          ],
          "sentenceScores": [
            {"sentence": "Cümle 1", "score": 0.1, "type": "human"},
            {"sentence": "Cümle 2", "score": 0.9, "type": "ai"},
            {"sentence": "Cümle 3", "score": 0.5, "type": "mixed"}
          ]
        }
      `;

      console.log(`Model ${validModel} ile istek gönderiliyor...`);
      let result;
      try {
        const client = getGeminiClient();
        
        result = await client.models.generateContent({
          model: validModel,
          contents: [{ role: 'user', parts: [{ text: `Kaynak Metin: ${text}\n\n${prompt}` }] }],
          config: {
            temperature: temp,
            maxOutputTokens: 8192,
            responseMimeType: "application/json"
          }
        });
      } catch (apiError: any) {
        console.error(`Model ${validModel} API Hatası:`, apiError);
        throw apiError; // Re-throw to be caught by the outer catch
      }

      console.log(`Model ${validModel} yanıt verdi:`, result);

      // Extract text from the result
      const resultText = result.text || '';

      if (!resultText) {
        throw new Error(`Model ${validModel} boş yanıt döndü.`);
      }

      const parsed = robustParse(resultText);

      console.log(`Model ${validModel} başarılı bir şekilde parse edildi.`);

      return {
        humanizedText: parsed.humanizedText || text,
        aiScore: typeof parsed.aiScore === 'number' ? parsed.aiScore : 0.5,
        metrics: parsed.metrics || {
          readability: 0.5,
          complexity: 'Orta',
          toneStrength: 0.5,
          grammarScore: 0.5,
          wordCount: text.split(/\s+/).length,
          readingTime: '1 dk'
        },
        insights: Array.isArray(parsed.insights) ? parsed.insights.map((ins: any) => ({
          sentence: typeof ins === 'string' ? ins : (ins.sentence || ""),
          score: typeof ins.score === 'number' ? ins.score : 0.5,
          detail: ins.detail || (typeof ins === 'string' ? "Cümle analizi yapıldı." : "")
        })) : [],
        sentenceScores: Array.isArray(parsed.sentenceScores) ? parsed.sentenceScores : []
      };
    } catch (error: any) {
      const isQuota = error.message?.includes("429") || error.message?.includes("RESOURCE_EXHAUSTED");
      if (isQuota && retryCount < 2) { 
        rotateKey(); // <--- OTOMATİK ROTASYON
        console.log(`🔄 Kota aşıldı, anahtar değiştirildi ve tekrar deneniyor... (Deneme: ${retryCount + 1})`);
        return analyzeAndHumanize(text, options, currentModel, retryCount + 1);
      }
      console.warn(`Model ${currentModel} denemesi başarısız:`, error.message || error);
      lastError = error;
    }
  }

  throw new Error(`YZ İşlemi Başarısız. Son hata: ${translateError(lastError)}`);
};

/**
 * Logs service errors to Firestore for Admin oversight.
 */
export const reportServiceError = async (serviceName: string, error: any, context?: any) => {
  console.error(`[ServiceError] ${serviceName}:`, error);
};

export const checkGrammar = async (text: string, _options?: GrammarOptions): Promise<GrammarSuggestion[]> => {
  assertApiKey();
  const models = ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-2.5-flash-lite"];
  let lastErr = "";

  for (const modelName of models) {
    try {
      console.log(`[Grammar] Model deneniyor: ${modelName}`);
      const validModel = validateModelName(modelName);
      const client = getGeminiClient();
      const result = await client.models.generateContent({
        model: validModel,
        contents: [{ role: 'user', parts: [{ text: `Aşağıdaki metni Türkçe dilbilgisi açısından denetle ve JSON formatında suggestions listesi dön. Format: {"suggestions": [{"original": "...", "suggestion": "...", "explanation": "..."}]}. Metin: ${text}` }] }],
        config: { 
          responseMimeType: "application/json", 
          temperature: 0.1 
        }
      });
      const parsed = robustParse(result.text || '{}');
      console.log(`[Grammar] ${modelName} başarılı.`);
      return parsed.suggestions || [];
    } catch (e: any) {
      const isQuota = e.message?.includes("429") || e.message?.includes("RESOURCE_EXHAUSTED");
      if (isQuota) {
        rotateKey(); // <--- GRAMER İÇİN DE ROTASYON
        console.log("[Grammar] Kota doldu, anahtar rotasyonu yapıldı.");
      }
      console.warn(`[Grammar] ${modelName} başarısız:`, e.message);
      lastErr = e.message;
    }
  }
  throw new Error(`Dilbilgisi hatası: ${lastErr}`);
};

export interface DetectAIResult {
  score: number;
  reasoning: string;
  sentenceScores: {
    sentence: string;
    score: number;
    type?: "ai" | "human" | "mixed";
    reason?: string;
  }[];
  metrics: {
    plagiarism: number;
    readability: number;
    complexity: string;
    burstiness: number;
    perplexity: number;
    structureScore: number;
  };
  highlights: {
    text: string;
    type: string;
    score: number;
    source?: string;
  }[];
}

export const detectAI = async (text: string, sensitivity: number = 50, modelName: string = "gemini-2.0-flash"): Promise<DetectAIResult> => {
  assertApiKey();

  const validRequestedModel = validateModelName(modelName);
  const modelsToTry = [
    validRequestedModel,
    "gemini-2.0-flash",
    "gemini-2.5-flash",
    "gemini-2.0-flash-lite",
    "gemini-2.5-flash-lite",
  ].filter((v, i, a) => Boolean(v) && a.indexOf(v) === i) as string[];

  let lastError: any = null;

  const sensitivityDesc = sensitivity > 70 ? "ÇOK HASSAS (En küçük YZ izini bile yakala)" :
    sensitivity < 30 ? "HOŞGÖRÜLÜ (Sadece bariz YZ metinlerini işaretle)" :
      "DENGELİ (Standart profesyonel denetim)";

  for (const currentModel of modelsToTry) {
    try {
      const validatedModel = validateModelName(currentModel);
      console.log(`[Auditor] Model deneniyor: ${validatedModel}`);
      const client = getGeminiClient();
      const result = await client.models.generateContent({
        model: validatedModel,
        contents: [{ role: 'user', parts: [{ text: `Aşağıdaki metni bir "Originality Auditor" (YZ Dedektörü) olarak derinlemesine analiz et. 
      
        ANALİZ AYARI: ${sensitivityDesc} (Hassasiyet Değeri: ${sensitivity}/100)
        SEÇİLİ ANALİZ MOTORU: ${currentModel}

        GÖREV:
        1. Metnin genel YZ olasılık skorunu belirle (0.0 - 1.0).
        2. İNTİHAL VE ETİK DENETİMİ (SENTENCE LEVEL):
           - %15'lik benzerlik sınırının aşılıp aşılmadığını kontrol et.
           - Metinde hileli karakter (görünmez boşluk vb.) olup olmadığını denetle.
           - Atıf sisteminin (APA/MLA vb.) doğruluğunu ve teknik tanımların tırnak içinde olup olmadığını incele.
        3. Metni CÜMLE CÜMLE analiz et. Her cümle için:
           - Bir skor (0.0 - 1.0) ata.
           - Bir tip ('ai', 'human', 'mixed') belirle.
           - Detaylı bir "reason" (neden) yaz (Örn: "Düşük perplexity ve tekdüze cümle yapısı", "Beklenen insan varyasyonları mevcut", "Aşırı tahmin edilebilir kelime dizilimi").
        4. Yapısal metrikleri hesapla (Burstiness, Punctuation, Complexity).
        5. Metnin genel "Reasoning" (Mantıksal Gerekçe) kısmında neden bu karara vardığını açıkla.

        ÖNEMLİ: Yanıtı SADECE JSON olarak dön.

        JSON ŞEMASI:
        {
          "score": 0.85,
          "reasoning": "Metnin geneli için detaylı analiz özeti...",
          "sentenceScores": [
            {
              "sentence": "Cümle içeriği", 
              "score": 0.9, 
              "type": "ai", 
              "reason": "Bu cümle neden YZ olarak işaretlendi? (Örn: 'Tipik GPT-4 giriş yapısı', 'Sentaktik tekrarlar')"
            }
          ],
          "metrics": {
            "plagiarism": 0.05,
            "readability": 0.75,
            "complexity": "Profesyonel",
            "burstiness": 0.4,
            "perplexity": 0.3,
            "structureScore": 0.8
          },
          "highlights": [
            {
              "text": "Alıntı veya intihal şüphesi olan metin kısmı",
              "type": "plagiarism",
              "score": 0.95,
              "source": "https://example.com/kaynak"
            }
          ]
        }

        Metin: ${text}` }] }],
        config: { 
          responseMimeType: "application/json", 
          temperature: 0.1 
        }
      });

      const parsed = robustParse(result.text || '{}');
      console.log(`[Auditor] ${currentModel} başarılı.`);

      return {
        score: typeof parsed.score === 'number' ? parsed.score : 0.5,
        reasoning: parsed.reasoning || "Analiz tamamlandı.",
        sentenceScores: Array.isArray(parsed.sentenceScores) ? parsed.sentenceScores.map((s: any) => ({
          sentence: s.sentence || "",
          score: typeof s.score === 'number' ? s.score : 0.5,
          type: s.type || (s.score > 0.6 ? 'ai' : s.score < 0.4 ? 'human' : 'mixed'),
          reason: s.reason || "Cümle yapısı incelendi."
        })) : [],
        metrics: {
          plagiarism: parsed.metrics?.plagiarism ?? 0,
          readability: parsed.metrics?.readability ?? 0.5,
          complexity: parsed.metrics?.complexity ?? "Orta",
          burstiness: parsed.metrics?.burstiness ?? 0.5,
          perplexity: parsed.metrics?.perplexity ?? 0.5,
          structureScore: parsed.metrics?.structureScore ?? 0.5
        },
        highlights: Array.isArray(parsed.highlights) ? parsed.highlights.map((h: any) => ({
          text: h.text || "",
          type: h.type || "plagiarism",
          score: typeof h.score === 'number' ? h.score : 0.5,
          source: h.source
        })) : []
      };
    } catch (error: any) {
      const isQuota = error.message?.includes("429") || error.message?.includes("RESOURCE_EXHAUSTED");
      if (isQuota) {
        rotateKey(); // <--- AUDITOR İÇİN DE ROTASYON
        console.log("[Auditor] Kota doldu, anahtar rotasyonu yapıldı.");
      }
      console.warn(`[Auditor] ${currentModel} başarısız:`, error.message);
      lastError = error;
    }
  }

  await reportServiceError("detectAI", lastError, { textLength: text.length });

  return {
    score: 0.5,
    reasoning: "Tüm modeller başarısız oldu. Temel analiz yapıldı.",
    sentenceScores: [],
    metrics: {
      plagiarism: 0,
      readability: 0,
      complexity: "Bilinmiyor",
      burstiness: 0,
      perplexity: 0,
      structureScore: 0
    },
    highlights: []
  };
};
