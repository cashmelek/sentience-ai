import { GoogleGenAI } from "@google/genai";
import { apiKeyManager } from "./apiKeyManager";
import { detectIntegrityFlags, IntegrityReport } from "../ml/textFeatures";
import { isLocalModelEnabled, callLocalModelChat } from "./localModelService";
import { auth } from "../lib/firebase";

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

// --- CONFIGURATION ---
const DEFAULT_MODEL = import.meta.env.VITE_GEMINI_MODEL || "gemini-2.0-flash";

/**
 * Model isminin geçerliliğini kontrol eder ve gerekirse güvenli varsayılana döner.
 */
export const validateModelName = (name: string): string => {
  if (!name) return "gemini-2.5-flash-lite";

  let normalized = name.toLowerCase().trim();

  if (normalized.startsWith("local:") || normalized.startsWith("ollama:") || normalized.startsWith("custom:")) {
    return name.trim();
  }

  if (
    normalized.includes("2.0-flash") ||
    normalized.includes("1.0") ||
    normalized.includes("1.5") ||
    normalized.includes("pro-vision")
  ) {
    return "gemini-2.5-flash-lite";
  }

  normalized = normalized
    .replace(/\s+/g, '-')
    .replace(/\(.*\)/g, '')
    .replace(/-+$/g, '');

  if (normalized.startsWith("gemini-")) {
    return normalized;
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

  if (message.includes("429") || message.includes("RESOURCE_EXHAUSTED") || message.includes("Quota exceeded") || message.includes("prepayment credits")) {
    if (isUnlimited) {
      return "Google AI kotası veya anlık istek limiti aşıldı. Eğer anahtarlarınızın kotası varsa, lütfen Google AI Studio üzerinden 'Prepaid Credits' (Ön ödemeli Kredi) durumunuzu kontrol edin.";
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
  if (message.includes("auth/unauthorized-domain")) {
    return "Bu alan adı (domain) Firebase yetkili alan adları listesinde kayıtlı değil. Lütfen Firebase Console üzerinden alan adını ekleyin.";
  }
  if (message.includes("auth/popup-blocked")) {
    return "Giriş penceresi (popup) tarayıcınız tarafından engellendi. Lütfen açılır pencerelere izin verin.";
  }
  if (message.includes("auth/popup-closed-by-user") || message.includes("auth/cancelled-popup-request")) {
    return "Giriş işlemi pencere kapatıldığı için iptal edildi.";
  }
  if (message.includes("auth/invalid-credential") || message.includes("auth/wrong-password") || message.includes("auth/user-not-found")) {
    return "E-posta adresi veya şifre hatalı. Kayıtlı değilseniz 'Kayıt Ol' sekmesinden hesap oluşturun.";
  }
  if (message.includes("auth/email-already-in-use")) {
    return "Bu e-posta adresi zaten kullanımda. Lütfen 'Giriş Yap' sekmesinden giriş yapın.";
  }
  if (message.includes("auth/weak-password")) {
    return "Şifreniz çok zayıf. Şifreniz en az 6 karakter olmalıdır.";
  }
  if (message.includes("auth/invalid-email")) {
    return "Geçersiz bir e-posta adresi girdiniz. Lütfen e-postanızı kontrol edin.";
  }
  if (message.includes("auth/operation-not-allowed")) {
    return "Bu giriş yöntemi Firebase panelinde etkinleştirilmemiş.";
  }
  if (message.includes("auth/too-many-requests")) {
    return "Çok fazla başarısız deneme yapıldı. Lütfen birkaç dakika sonra tekrar deneyin.";
  }
  if (message.includes("auth/network-request-failed")) {
    return "Ağ bağlantısı hatası. Lütfen internet bağlantınızı kontrol edin.";
  }
  if (message.includes("API key not valid")) {
    return "API anahtarınız geçersiz. Lütfen Admin panelindeki anahtarları kontrol edin.";
  }
  if (message.includes("not enabled")) {
    return "Generative Language API bu projede aktif edilmemiş. Lütfen Google Cloud Console'dan aktif edin.";
  }
  const currentModel = (error as any)?.model || "Belirlenemeyen Model";

  if (message.includes("model not found") || message.includes("404")) {
    return `Seçilen model (${currentModel}) bu anahtar ile kullanılamıyor. Lütfen Admin panelinden farklı bir model seçin (Örn: Gemini 3.5 Flash).`;
  }

  console.error("KRİTİK API HATASI DETAYLARI:", {
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
 * Handle API Key Error by classifying it and marking it as exhausted/invalid.
 */
export const handleApiKeyError = async (error: any): Promise<boolean> => {
  const message = error?.message || String(error);
  const isQuota = message.includes("429") || message.includes("RESOURCE_EXHAUSTED") || message.includes("prepayment credits") || error?.status === 429;
  const isInvalid = message.includes("400") || message.includes("API key not valid") || message.includes("not valid") || error?.status === 400;

  if (isQuota) {
    console.warn("[ApiKeyManager] Gemini key quota exhausted, marking as exhausted.");
    await apiKeyManager.markCurrentKeyExhausted('gemini');
    return true;
  }
  if (isInvalid) {
    console.warn("[ApiKeyManager] Gemini key invalid, marking as invalid.");
    await apiKeyManager.markCurrentKeyInvalid('gemini');
    return true;
  }
  return false;
};

/**
 * Safely cleans and parses JSON from LLM output.
 * Handles markdown code blocks, trailing commas, and common escaping issues.
 */
const robustParse = (text: string) => {
  try {
    return JSON.parse(text);
  } catch (e) {
    try {
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');

      if (firstBrace === -1) throw new Error("JSON bulunamadı");

      let cleaned = text.substring(firstBrace, lastBrace + 1);

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
          // ignore
        } else {
          result += char;
        }
      }

      return JSON.parse(result);
    } catch (innerE) {
      console.error("Robust parse failed:", innerE, "Original text:", text);

      let fallbackText = text.replace(/```json|```/g, '').trim();
      if (!fallbackText) fallbackText = "Metin işlenirken bir sorun oluştu.";

      let extractedHumanized = fallbackText;

      if (fallbackText.includes('"humanizedText"')) {
        const match = fallbackText.match(/"humanizedText"\s*:\s*"([\s\S]*?)",?\s*"\w+"\s*:/);
        if (match && match[1]) {
          extractedHumanized = match[1];
        } else {
          const partialMatch = fallbackText.match(/"humanizedText"\s*:\s*"([\s\S]*)/);
          if (partialMatch && partialMatch[1]) {
            extractedHumanized = partialMatch[1];
            extractedHumanized = extractedHumanized.replace(/["}\s]*$/, '');
          }
        }

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

export const reportServiceError = async (serviceName: string, error: any, context?: any) => {
  console.error(`[ServiceError] ${serviceName}:`, error);
};

export const analyzeAndHumanize = async (
  text: string,
  options: HumanizeOptions,
  modelName?: string,
  retryCount: number = 0
): Promise<AnalysisResult> => {
  // 1. Önce Vercel Serverless Güvenlik Katmanı denenir
  try {
    const token = await auth.currentUser?.getIdToken();
    if (token) {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ text, options, modelName })
      });
      if (response.ok) {
        const data = await response.json();
        if (data && !data.error) return data as AnalysisResult;
      }
    }
  } catch (backendError: any) {
    console.warn("[Backend] Vercel API çağrısı başarısız, yerel fallback kullanılıyor:", backendError?.message);
  }

  const maxRetries = Math.max(1, apiKeyManager.getActiveKeysCount('gemini'));
  if (retryCount >= maxRetries) {
    throw new Error("Tüm Gemini API anahtarları denendi fakat hiçbiri yanıt vermedi veya kotaları dolu.");
  }
  assertApiKey();

  // --- AKTİVİTE BAŞLADI ---
  await apiKeyManager.setKeyActivity('gemini', true);

  const validModel = validateModelName(modelName);
  console.log(`[Gemini] Denenecek modeller (ilk deneme: ${validModel})`);

  const modelsToTry = [
    validModel,
    "gemini-3.8-flash",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-3.1-pro",
    "gemini-3.1-flash-lite",
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

        ███ DİL KURALI (KESİN VE MUTLAK) ███
        - Ürettiğin "humanizedText" metni DAİMA ve YALNIZCA TÜRKÇE olmalıdır.
        - İngilizce veya başka bir dilde çıktı üretmek KESİNLİKLE YASAKTIR.
        - Kaynak metin hangi dilde olursa olsun, çıktı metni akıcı, doğal ve profesyonel TÜRKÇE olmalıdır.
        - Çeviri kokusundan (translation artifacts) kaçın: İngilizce kalıpların birebir Türkçeye aktarılması yasaktır.
        - Türkçeye özgü doğal söz dizimi kullan (Özne-Nesne-Yüklem). Devrik cümleleri de doğal oranlarda kullan.
        - "insights", "detail", "sentence" gibi tüm JSON alanlarındaki metinler de TÜRKÇE olmalıdır.
        
        ███ YASAKLI İFADELER — COPYLEAKS TETİKLEYİCİLERİ ███
        Aşağıdaki geçiş ifadelerini ve kelimelerini KULLANMA (bunlar YZ metnini açıkça işaret eder):
        - Yasaklı geçişler: "Önemle belirtmek gerekir ki", "Bu bağlamda", "Sonuç olarak", "Nitekim" (aşırı tekrar), "Dolayısıyla" (paragraf başında), "İlk olarak... İkinci olarak... Son olarak...", "Bununla birlikte" (mekanik tekrar), "Bu çerçevede"
        - Yasaklı slop kelimeler: "kapsamlı", "kritik" (metafor dışı), "verimli", "sürdürülebilir", "bütünleşik", "optimize etmek", "sinerji", "önemli ölçüde", "belirgin şekilde"
        - Yasaklı hedging: "genellikle düşünülür ki", "yaygın kanıya göre", "muhtemelen söylenebilir ki", "kanımca ifade etmek gerekirse"
        - Yasaklı yapılar: Üst üste 3+ benzer uzunlukta (±5 kelime) cümle dizisi. "Bu nedenle... Bu bağlamda... Bu doğrultuda..." kalıpları.

        KURALLAR:
        1. FORMATI KORU: Kaynak metindeki tüm başlıkları (#, ##), alt başlıkları, numaralandırılmış listeleri (1., 2.), madde işaretlerini (-, *) ve özel noktalamaları AYNEN KORU.
        2. İNSANİLEŞTİRME: Metni YZ tespitinden kaçacak şekilde, doğal bir Türkçe ile yeniden yaz. Perplexity ve Burstiness değerlerini insan standartlarına çek.
           - ${styleInstruction}
           - ${intensityInstruction}
        3. TÜRKÇE YAZIM KALİTESİ — BURSTINESS KURALLARI (KRİTİK):
           - Her 3 uzun cümleden sonra en az 1 kısa cümle (maksimum 8 kelime) gelmelidir. Örn: "Bu durumun sonuçları ağırdır." veya "Oysa tablo farklıdır."
           - Paragraf başlangıç cümleleri birbirinden yapısal olarak farklı olmalıdır: soru, eylem, sonuç veya gözlem cümlesi ile başla.
           - Üst üste aynı uzunluktaki iki cümle YASAKTIR (cümle uzunlukları ±5 kelimenin üzerinde farklılık göstermeli).
           - Edilgen ve etken yapıları dengeli kullan.
           - Akademik ve resmi metinlerde bile doğal Türkçe akışını koru.
           - Gereksiz yabancı kelime kullanma; Türkçe karşılığı varsa onu tercih et.
        4. TÜRKÇE ÖZGÜNLÜK — PERPLEXITY ARTIRMA:
           - En az 1 Türkçe deyim veya atasözü uyarlaması ekle (bağlam uygunsa): "taşı gediğine koymak", "gözden uzak olan gönülden de uzaklaşır", "ağaç yaşken eğilir" gibi.
           - Doğal Türkçe kuvvetlendirici kalıplar kullan: "Sanki...", "Adeta...", "Tam da bu noktada...", "Ne var ki...", "Oysa..."
           - Anadil konuşuruna özgü dolaylı anlatım: "...demek ki" yerine "bu bizi şu sonuca götürüyor" gibi özgün kuruluşlar.
           - Akademik metinde bile kişisel gözlem cümlesi ekle: "Bu bulgu pratikte şunu gösteriyor:" veya "Araştırmacılar için bu, şu anlama geliyor:"
        5. AKADEMİK ETİK VE İNTİHAL (KRİTİK):
           - DERİN ÖZÜMSEME: Sadece kelime değiştirme değil, kavramsal analiz yapıp bilgiyi sentezle.
           - %15 LİMİTİ: Üretilen metnin orijinal kaynaklarla benzerliği %15'i geçmemelidir.
           - ALINTILAR: Kanun maddeleri ve teknik tanımları tırnak içinde ("...") koru.
           - ÇOKLU SENTEZ: Mümkünse bilgiyi 3-4 farklı perspektifi birleştirerek sun.
           - HİLE YASAK: Görünmez karakter veya harf değişikliği gibi teknik hileler ASLA kullanma.
        6. CÜMLE ANALİZİ: Metni CÜMLE CÜMLE analiz et ve her cümle için YZ olasılığını belirle.
        7. METRİKLER: Metnin okunabilirliğini, karmaşıklığını ve ton gücünü profesyonel bir denetçi gibi hesapla.
        
        ÖNEMLİ (JSON GÜVENLİĞİ): 
        - Yanıtını SADECE geçerli bir JSON nesnesi olarak ver. 
        - JSON içindeki metinlerde çift tırnak (") kullanman gerekiyorsa mutlaka ters eğik çizgi (\\") ile kaçış yap.
        - Metinlerde satır sonu karakterleri yerine \\n kullan.
        
        JSON ŞEMASI:
        {
          "humanizedText": "Türkçe olarak dönüştürülmüş metin buraya gelecek",
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
            {"sentence": "İncelenen Türkçe cümle", "score": 0.8, "detail": "Neden YZ olduğu veya neden başarılı olduğu detayı (Türkçe)."}
          ],
          "sentenceScores": [
            {"sentence": "Türkçe Cümle 1", "score": 0.1, "type": "human"},
            {"sentence": "Türkçe Cümle 2", "score": 0.9, "type": "ai"},
            {"sentence": "Türkçe Cümle 3", "score": 0.5, "type": "mixed"}
          ]
        }
      `;

      let resultText = '';
      if (isLocalModelEnabled() || validModel.startsWith('local:') || validModel.startsWith('ollama:') || validModel.startsWith('custom:')) {
        const localCleanName = validModel.replace(/^(local:|ollama:|custom:)/, '');
        console.log(`Lokal model (${localCleanName}) ile istek gönderiliyor...`);
        try {
          resultText = await callLocalModelChat(prompt, `Kaynak Metin: ${text}`, { modelName: localCleanName || undefined });
        } catch (localErr: any) {
          const fallbackEnabled = typeof localStorage !== 'undefined' ? localStorage.getItem('sentience_fallback_to_cloud') !== 'false' : true;
          if (!fallbackEnabled) throw localErr;
          console.warn("[LocalModel] Yerel model yanıt vermedi, Gemini Bulut fallback devreye giriyor:", localErr.message);
          const client = getGeminiClient();
          const fallbackRes = await client.models.generateContent({
            model: "gemini-2.0-flash",
            contents: [{ role: 'user', parts: [{ text: `Kaynak Metin: ${text}\n\n${prompt}` }] }],
            config: {
              temperature: temp,
              maxOutputTokens: 8192,
              responseMimeType: "application/json"
            }
          });
          resultText = fallbackRes.text || '';
          await apiKeyManager.incrementUsage('gemini');
        }
      } else {
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
          throw apiError;
        }

        resultText = result.text || '';
        await apiKeyManager.incrementUsage('gemini');
        await apiKeyManager.setKeyActivity('gemini', false);
      }

      if (!resultText) {
        throw new Error(`Model ${validModel} boş yanıt döndü.`);
      }

      const parsed = robustParse(resultText);

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
      await apiKeyManager.setKeyActivity('gemini', false);
      
      const wasHandled = await handleApiKeyError(error);
      if (wasHandled) {
        console.log(`Kota aşıldı veya geçersiz anahtar, otomatik rotasyon yapıldı. Tekrar deneniyor... (Deneme: ${retryCount + 1}/${maxRetries})`);
        return analyzeAndHumanize(text, options, modelName, retryCount + 1);
      }
      console.warn(`Model ${currentModel} denemesi başarısız:`, error.message || error);
      lastError = error;
    }
  }

  throw new Error(`YZ İşlemi Başarısız. Son hata: ${translateError(lastError)}`);
};

export const checkGrammar = async (text: string, _options?: GrammarOptions, retryCount: number = 0): Promise<GrammarSuggestion[]> => {
  // Önce yerel modeli dene (eğer aktifse)
  if (isLocalModelEnabled()) {
    try {
      console.log("[Grammar] Yerel model deneniyor...");
      const localPrompt = `Aşağıdaki metni Türkçe dilbilgisi açısından denetle ve JSON formatında suggestions listesi dön. Format: {"suggestions": [{"original": "...", "suggestion": "...", "explanation": "..."}]}. Metin: ${text}`;
      const resultText = await callLocalModelChat(localPrompt, text);
      const parsed = robustParse(resultText);
      console.log("[Grammar] Yerel model başarılı.");
      return parsed.suggestions || [];
    } catch (localError: any) {
      console.warn("[Grammar] Yerel model başarısız, Gemini fallback kullanılıyor:", localError.message);
    }
  }

  const maxRetries = Math.max(1, apiKeyManager.getActiveKeysCount('gemini'));
  if (retryCount >= maxRetries) {
    throw new Error("Tüm Gemini API anahtarları denendi fakat hiçbiri dilbilgisi denetimi için yanıt vermedi veya kotaları dolu.");
  }
  assertApiKey();
  const models = ["gemini-3.1-flash-lite", "gemini-2.0-flash"];
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
      const wasHandled = await handleApiKeyError(e);
      if (wasHandled) {
        console.log("[Grammar] Kota doldu veya geçersiz anahtar, anahtar rotasyonu yapıldı. Tekrar deneniyor...");
        return checkGrammar(text, _options, retryCount + 1);
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
  integrityReport?: IntegrityReport;
}

export const detectAI = async (text: string, sensitivity: number = 50, modelName: string = "gemini-2.0-flash", retryCount: number = 0): Promise<DetectAIResult> => {
  const integrityReport = detectIntegrityFlags(text);

  // Önce yerel modeli dene (eğer aktifse)
  if (isLocalModelEnabled() || modelName.startsWith('local:') || modelName.startsWith('ollama:') || modelName.startsWith('custom:')) {
    try {
      const localCleanName = modelName.replace(/^(local:|ollama:|custom:)/, '');
      console.log(`[Auditor] Yerel model (${localCleanName}) ile istek gönderiliyor...`);
      const sensitivityDesc = sensitivity > 70 ? "ÇOK HASSAS (En küçük YZ izini bile yakala)" :
        sensitivity < 30 ? "HOŞGÖRÜLÜ (Sadece bariz YZ metinlerini işaretle)" :
          "DENGELİ (Standart profesyonel denetim)";
      const localPrompt = `Aşağıdaki metni bir "Originality Auditor" (YZ Dedektörü) olarak derinlemesine analiz et.

        ANALİZ AYARI: ${sensitivityDesc} (Hassasiyet Değeri: ${sensitivity}/100)
        SEÇİLİ ANALİZ MOTORU: ${localCleanName}

        GÖREV:
        1. Metnin genel YZ olasılık skorunu belirle (0.0 - 1.0).
        2. İNTİHAL VE ETİK DENETİMİ (SENTENCE LEVEL):
           - %15'lik benzerlik sınırının aşıldığı aşılmadığını kontrol et.
           - Metinde hileli karakter (görünmez boşluk vb.) olup olmadığını denetle.
           - Atıf sisteminin (APA/MLA vb.) doğruluğunu ve teknik tanımların tırnak içinde olup olmadığını incele.
        3. Metni CÜMLE CÜMLE analiz et. Her cümle için:
           - Bir skor (0.0 - 1.0) ata.
           - Bir tip ('ai', 'human', 'mixed') belirle.
           - Detaylı bir "reason" (neden) yaz (Örn: "Düşük perplexity ve tekdüze cümle yapısı", "Beklenen insan varyasyonları mevcut", "Aşırı tahmin edilebilir kelime dizilimi").
        4. Yapısal metrikleri hesapla (Burstiness, Punctuation, Complexity).
        5. Metnin genel "Reasoning" (Mantıksal Gerekçe) kısmında neden bu karara vardığını açıklarla.

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
        }`;
      const resultText = await callLocalModelChat(localPrompt, text, { modelName: localCleanName || undefined });
      const parsed = robustParse(resultText);
      console.log("[Auditor] Yerel model başarılı.");
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
        })) : [],
        integrityReport
      };
    } catch (localError: any) {
      console.warn("[Auditor] Yerel model başarısız, Vercel/Gemini fallback kullanılıyor:", localError.message);
    }
  }

  // 1. Önce Vercel Serverless Güvenlik Katmanı denenir
  try {
    const token = await auth.currentUser?.getIdToken();
    if (token) {
      const response = await fetch("/api/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ text, sensitivity, modelName })
      });
      if (response.ok) {
        const data = await response.json();
        if (data && !data.error) return data as DetectAIResult;
      }
    }
  } catch (backendError: any) {
    console.warn("[Backend] Vercel API detectAI çağrısı başarısız, yerel fallback kullanılıyor:", backendError?.message);
  }

  const maxRetries = Math.max(1, apiKeyManager.getActiveKeysCount('gemini'));
  if (retryCount >= maxRetries) {
    return {
      score: 0.5,
      reasoning: "Tüm API anahtarları kotalı veya geçersiz olduğu için analiz yapılamadı.",
      sentenceScores: [],
      metrics: {
        plagiarism: 0,
        readability: 0,
        complexity: "Bilinmiyor",
        burstiness: 0,
        perplexity: 0,
        structureScore: 0
      },
      highlights: [],
      integrityReport
    };
  }
  assertApiKey();

  const validRequestedModel = validateModelName(modelName);
  const modelsToTry = [
    validRequestedModel,
    "gemini-3.8-flash",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-3.1-pro",
    "gemini-3.1-flash-lite",
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
          temperature: 0 
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
        })) : [],
        integrityReport
      };
    } catch (error: any) {
      const wasHandled = await handleApiKeyError(error);
      if (wasHandled) {
        console.log("[Auditor] Kota veya geçersiz anahtar, anahtar rotasyonu yapıldı. Tekrar deneniyor...");
        return detectAI(text, sensitivity, modelName, retryCount + 1);
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
    highlights: [],
    integrityReport
  };
};
