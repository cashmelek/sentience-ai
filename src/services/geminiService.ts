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
      return "Google AI kotasÄ± veya anlÄ±k istek limiti aÅŸÄ±ldÄ±. EÄŸer anahtarlarÄ±nÄ±zÄ±n kotasÄ± varsa, lÃ¼tfen Google AI Studio Ã¼zerinden 'Prepaid Credits' (Ã–n Ã¶demeli Kredi) durumunuzu kontrol edin.";
    }
    return "ÃœzgÃ¼nÃ¼z, gÃ¼nlÃ¼k kullanÄ±m limitinizi veya API kotanÄ±zÄ± doldurdunuz. LÃ¼tfen 1 dakika sonra tekrar deneyin veya farklÄ± bir anahtar tanÄ±mlayÄ±n.";
  }

  if (message.includes("503") || message.includes("Service Unavailable")) {
    return "Yapay zeka sunucusu ÅŸu an geÃ§ici olarak hizmet dÄ±ÅŸÄ±. LÃ¼tfen birkaÃ§ saniye sonra tekrar deneyin.";
  }

  if (message.includes("API key") || message.includes("API AnahtarÄ±")) {
    return "Sistem yapÄ±landÄ±rma hatasÄ±: API anahtarÄ± geÃ§ersiz veya eksik.";
  }

  if (message.includes("JSON") || message.includes("Unexpected token") || message.includes("Unexpected non-whitespace character")) {
    return "Sistem yanÄ±tÄ± iÅŸlenirken bir sorun oluÅŸtu, lÃ¼tfen tekrar deneyin.";
  }

  if (message.includes("safety") || message.includes("HARM_CATEGORY")) {
    return "GirdiÄŸiniz metin gÃ¼venlik filtrelerimize takÄ±ldÄ±. LÃ¼tfen iÃ§eriÄŸi gÃ¶zden geÃ§irip tekrar deneyin.";
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
    return "API anahtarÄ±nÄ±z geÃ§ersiz. LÃ¼tfen Admin panelindeki anahtarlarÄ± kontrol edin.";
  }
  if (message.includes("not enabled")) {
    return "Generative Language API bu projede aktif edilmemiÅŸ. LÃ¼tfen Google Cloud Console'dan aktif edin.";
  }
  const currentModel = (error as any)?.model || "Belirlenemeyen Model";

  if (message.includes("model not found") || message.includes("404")) {
    return `SeÃ§ilen model (${currentModel}) bu anahtar ile kullanÄ±lamÄ±yor. LÃ¼tfen Admin panelinden farklÄ± bir model seÃ§in (Ã–rn: Gemini 3.5 Flash).`;
  }

  console.error("KRÄ°TÄ°K API HATASI DETAYLARI:", {
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

      if (firstBrace === -1) throw new Error("JSON bulunamadÄ±");

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
      if (!fallbackText) fallbackText = "Metin iÅŸlenirken bir sorun oluÅŸtu.";

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
    console.warn("[Backend] Vercel API Ã§aÄŸrÄ±sÄ± baÅŸarÄ±sÄ±z, yerel fallback kullanÄ±lÄ±yor:", backendError?.message);
  }

  const maxRetries = Math.max(1, apiKeyManager.getActiveKeysCount('gemini'));
  if (retryCount >= maxRetries) {
    throw new Error("TÃ¼m Gemini API anahtarlarÄ± denendi fakat hiÃ§biri yanÄ±t vermedi veya kotalarÄ± dolu.");
  }
  assertApiKey();

  // --- AKTÄ°VÄ°TE BAÅLADI ---
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
        styleInstruction = `Ã–zel Tarz: ${options.customToneName ? `[${options.customToneName}] ` : ""}${options.customToneDescription || ""}`;
      } else {
        styleInstruction = `Ton: ${options.tone}`;
      }

      let intensityInstruction = "";
      let temp = 0.5;
      if (options.tone === 'Ã–zet') {
        intensityInstruction = "Ã–ZETLEME GÃ–REVÄ°: Metnin ana fikirlerini koruyarak kÄ±sa ve Ã¶z bir Ã¶zet oluÅŸtur.";
        temp = 0.3;
      } else if (options.intensity >= 70) {
        intensityInstruction = "RADÄ°KAR Ä°NSANLAÅTIRMA (YÃ¼ksek YoÄŸunluk): CÃ¼mle yapÄ±larÄ±nÄ± tamamen deÄŸiÅŸtir, yepyeni bir metin yarat.";
        temp = 1.0;
      } else if (options.intensity >= 30) {
        intensityInstruction = "DENGELÄ° DÃ–NÃœÅÃœM (Orta YoÄŸunluk): AkÄ±cÄ±lÄ±ÄŸÄ± artÄ±r, sentaks varyasyonlarÄ± ekle.";
        temp = 0.7;
      } else {
        intensityInstruction = "DOÄAL Ä°YÄ°LEÅTÄ°RME (DÃ¼ÅŸÃ¼k YoÄŸunluk): Gramer hatalarÄ±nÄ± dÃ¼zelt, kÃ¼Ã§Ã¼k akÄ±cÄ±lÄ±k dokunuÅŸlarÄ± yap.";
        temp = 0.4;
      }

      const prompt = `
        GÃ–REV: Metni insanileÅŸtir ve analiz et.

        â–ˆâ–ˆâ–ˆ DÄ°L KURALI (KESÄ°N VE MUTLAK) â–ˆâ–ˆâ–ˆ
        - ÃœrettiÄŸin "humanizedText" metni DAÄ°MA ve YALNIZCA TÃœRKÃ‡E olmalÄ±dÄ±r.
        - Ä°ngilizce veya baÅŸka bir dilde Ã§Ä±ktÄ± Ã¼retmek KESÄ°NLÄ°KLE YASAKTIR.
        - Kaynak metin hangi dilde olursa olsun, Ã§Ä±ktÄ± metni akÄ±cÄ±, doÄŸal ve profesyonel TÃœRKÃ‡E olmalÄ±dÄ±r.
        - Ã‡eviri kokusundan (translation artifacts) kaÃ§Ä±n: Ä°ngilizce kalÄ±plarÄ±n birebir TÃ¼rkÃ§eye aktarÄ±lmasÄ± yasaktÄ±r.
        - TÃ¼rkÃ§eye Ã¶zgÃ¼ doÄŸal sÃ¶z dizimi kullan (Ã–zne-Nesne-YÃ¼klem). Devrik cÃ¼mleleri de doÄŸal oranlarda kullan.
        - "insights", "detail", "sentence" gibi tÃ¼m JSON alanlarÄ±ndaki metinler de TÃœRKÃ‡E olmalÄ±dÄ±r.
        
        â–ˆâ–ˆâ–ˆ YASAKLI Ä°FADELER â€” COPYLEAKS TETÄ°KLEYÄ°CÄ°LERÄ° â–ˆâ–ˆâ–ˆ
        AÅŸaÄŸÄ±daki geÃ§iÅŸ ifadelerini ve kelimelerini KULLANMA (bunlar YZ metnini aÃ§Ä±kÃ§a iÅŸaret eder):
        - YasaklÄ± geÃ§iÅŸler: "Ã–nemle belirtmek gerekir ki", "Bu baÄŸlamda", "SonuÃ§ olarak", "Nitekim" (aÅŸÄ±rÄ± tekrar), "DolayÄ±sÄ±yla" (paragraf baÅŸÄ±nda), "Ä°lk olarak... Ä°kinci olarak... Son olarak...", "Bununla birlikte" (mekanik tekrar), "Bu Ã§erÃ§evede"
        - YasaklÄ± slop kelimeler: "kapsamlÄ±", "kritik" (metafor dÄ±ÅŸÄ±), "verimli", "sÃ¼rdÃ¼rÃ¼lebilir", "bÃ¼tÃ¼nleÅŸik", "optimize etmek", "sinerji", "Ã¶nemli Ã¶lÃ§Ã¼de", "belirgin ÅŸekilde"
        - YasaklÄ± hedging: "genellikle dÃ¼ÅŸÃ¼nÃ¼lÃ¼r ki", "yaygÄ±n kanÄ±ya gÃ¶re", "muhtemelen sÃ¶ylenebilir ki", "kanÄ±mca ifade etmek gerekirse"
        - YasaklÄ± yapÄ±lar: Ãœst Ã¼ste 3+ benzer uzunlukta (Â±5 kelime) cÃ¼mle dizisi. "Bu nedenle... Bu baÄŸlamda... Bu doÄŸrultuda..." kalÄ±plarÄ±.

        KURALLAR:
        1. FORMATI KORU: Kaynak metindeki tÃ¼m baÅŸlÄ±klarÄ± (#, ##), alt baÅŸlÄ±klarÄ±, numaralandÄ±rÄ±lmÄ±ÅŸ listeleri (1., 2.), madde iÅŸaretlerini (-, *) ve Ã¶zel noktalamalarÄ± AYNEN KORU.
        2. Ä°NSANÄ°LEÅTÄ°RME: Metni YZ tespitinden kaÃ§acak ÅŸekilde, doÄŸal bir TÃ¼rkÃ§e ile yeniden yaz. Perplexity ve Burstiness deÄŸerlerini insan standartlarÄ±na Ã§ek.
           - ${styleInstruction}
           - ${intensityInstruction}
        3. TÃœRKÃ‡E YAZIM KALÄ°TESÄ° â€” BURSTINESS KURALLARI (KRÄ°TÄ°K):
           - Her 3 uzun cÃ¼mleden sonra en az 1 kÄ±sa cÃ¼mle (maksimum 8 kelime) gelmelidir. Ã–rn: "Bu durumun sonuÃ§larÄ± aÄŸÄ±rdÄ±r." veya "Oysa tablo farklÄ±dÄ±r."
           - Paragraf baÅŸlangÄ±Ã§ cÃ¼mleleri birbirinden yapÄ±sal olarak farklÄ± olmalÄ±dÄ±r: soru, eylem, sonuÃ§ veya gÃ¶zlem cÃ¼mlesi ile baÅŸla.
           - Ãœst Ã¼ste aynÄ± uzunluktaki iki cÃ¼mle YASAKTIR (cÃ¼mle uzunluklarÄ± Â±5 kelimenin Ã¼zerinde farklÄ±lÄ±k gÃ¶stermeli).
           - Edilgen ve etken yapÄ±larÄ± dengeli kullan.
           - Akademik ve resmi metinlerde bile doÄŸal TÃ¼rkÃ§e akÄ±ÅŸÄ±nÄ± koru.
           - Gereksiz yabancÄ± kelime kullanma; TÃ¼rkÃ§e karÅŸÄ±lÄ±ÄŸÄ± varsa onu tercih et.
        4. TÃœRKÃ‡E Ã–ZGÃœNLÃœK â€” PERPLEXITY ARTIRMA:
           - En az 1 TÃ¼rkÃ§e deyim veya atasÃ¶zÃ¼ uyarlamasÄ± ekle (baÄŸlam uygunsa): "taÅŸÄ± gediÄŸine koymak", "gÃ¶zden uzak olan gÃ¶nÃ¼lden de uzaklaÅŸÄ±r", "aÄŸaÃ§ yaÅŸken eÄŸilir" gibi.
           - DoÄŸal TÃ¼rkÃ§e kuvvetlendirici kalÄ±plar kullan: "Sanki...", "Adeta...", "Tam da bu noktada...", "Ne var ki...", "Oysa..."
           - Anadil konuÅŸuruna Ã¶zgÃ¼ dolaylÄ± anlatÄ±m: "...demek ki" yerine "bu bizi ÅŸu sonuca gÃ¶tÃ¼rÃ¼yor" gibi Ã¶zgÃ¼n kuruluÅŸlar.
           - Akademik metinde bile kiÅŸisel gÃ¶zlem cÃ¼mlesi ekle: "Bu bulgu pratikte ÅŸunu gÃ¶steriyor:" veya "AraÅŸtÄ±rmacÄ±lar iÃ§in bu, ÅŸu anlama geliyor:"
        5. AKADEMÄ°K ETÄ°K VE Ä°NTÄ°HAL (KRÄ°TÄ°K):
           - DERÄ°N Ã–ZÃœMSEME: Sadece kelime deÄŸiÅŸtirme deÄŸil, kavramsal analiz yapÄ±p bilgiyi sentezle.
           - %15 LÄ°MÄ°TÄ°: Ãœretilen metnin orijinal kaynaklarla benzerliÄŸi %15'i geÃ§memelidir.
           - ALINTILAR: Kanun maddeleri ve teknik tanÄ±mlarÄ± tÄ±rnak iÃ§inde ("...") koru.
           - Ã‡OKLU SENTEZ: MÃ¼mkÃ¼nse bilgiyi 3-4 farklÄ± perspektifi birleÅŸtirerek sun.
           - HÄ°LE YASAK: GÃ¶rÃ¼nmez karakter veya harf deÄŸiÅŸikliÄŸi gibi teknik hileler ASLA kullanma.
        6. CÃœMLE ANALÄ°ZÄ°: Metni CÃœMLE CÃœMLE analiz et ve her cÃ¼mle iÃ§in YZ olasÄ±lÄ±ÄŸÄ±nÄ± belirle.
        7. METRÄ°KLER: Metnin okunabilirliÄŸini, karmaÅŸÄ±klÄ±ÄŸÄ±nÄ± ve ton gÃ¼cÃ¼nÃ¼ profesyonel bir denetÃ§i gibi hesapla.
        
        Ã–NEMLÄ° (JSON GÃœVENLÄ°ÄÄ°): 
        - YanÄ±tÄ±nÄ± SADECE geÃ§erli bir JSON nesnesi olarak ver. 
        - JSON iÃ§indeki metinlerde Ã§ift tÄ±rnak (") kullanman gerekiyorsa mutlaka ters eÄŸik Ã§izgi (\\") ile kaÃ§Ä±ÅŸ yap.
        - Metinlerde satÄ±r sonu karakterleri yerine \\n kullan.
        
        JSON ÅEMASI:
        {
          "humanizedText": "TÃ¼rkÃ§e olarak dÃ¶nÃ¼ÅŸtÃ¼rÃ¼lmÃ¼ÅŸ metin buraya gelecek",
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
            {"sentence": "Ä°ncelenen TÃ¼rkÃ§e cÃ¼mle", "score": 0.8, "detail": "Neden YZ olduÄŸu veya neden baÅŸarÄ±lÄ± olduÄŸu detayÄ± (TÃ¼rkÃ§e)."}
          ],
          "sentenceScores": [
            {"sentence": "TÃ¼rkÃ§e CÃ¼mle 1", "score": 0.1, "type": "human"},
            {"sentence": "TÃ¼rkÃ§e CÃ¼mle 2", "score": 0.9, "type": "ai"},
            {"sentence": "TÃ¼rkÃ§e CÃ¼mle 3", "score": 0.5, "type": "mixed"}
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
          detail: ins.detail || (typeof ins === 'string' ? "CÃ¼mle analizi yapÄ±ldÄ±." : "")
        })) : [],
        sentenceScores: Array.isArray(parsed.sentenceScores) ? parsed.sentenceScores : []
      };
    } catch (error: any) {
      await apiKeyManager.setKeyActivity('gemini', false);
      
      const wasHandled = await handleApiKeyError(error);
      if (wasHandled) {
        console.log(`Kota aÅŸÄ±ldÄ± veya geÃ§ersiz anahtar, otomatik rotasyon yapÄ±ldÄ±. Tekrar deneniyor... (Deneme: ${retryCount + 1}/${maxRetries})`);
        return analyzeAndHumanize(text, options, modelName, retryCount + 1);
      }
      console.warn(`Model ${currentModel} denemesi baÅŸarÄ±sÄ±z:`, error.message || error);
      lastError = error;
    }
  }

  throw new Error(`YZ Ä°ÅŸlemi BaÅŸarÄ±sÄ±z. Son hata: ${translateError(lastError)}`);
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
    throw new Error("TÃ¼m Gemini API anahtarlarÄ± denendi fakat hiÃ§biri dilbilgisi denetimi iÃ§in yanÄ±t vermedi veya kotalarÄ± dolu.");
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
        contents: [{ role: 'user', parts: [{ text: `AÅŸaÄŸÄ±daki metni TÃ¼rkÃ§e dilbilgisi aÃ§Ä±sÄ±ndan denetle ve JSON formatÄ±nda suggestions listesi dÃ¶n. Format: {"suggestions": [{"original": "...", "suggestion": "...", "explanation": "..."}]}. Metin: ${text}` }] }],
        config: { 
          responseMimeType: "application/json", 
          temperature: 0.1 
        }
      });
      const parsed = robustParse(result.text || '{}');
      console.log(`[Grammar] ${modelName} baÅŸarÄ±lÄ±.`);
      return parsed.suggestions || [];
    } catch (e: any) {
      const wasHandled = await handleApiKeyError(e);
      if (wasHandled) {
        console.log("[Grammar] Kota doldu veya geÃ§ersiz anahtar, anahtar rotasyonu yapÄ±ldÄ±. Tekrar deneniyor...");
        return checkGrammar(text, _options, retryCount + 1);
      }
      console.warn(`[Grammar] ${modelName} baÅŸarÄ±sÄ±z:`, e.message);
      lastErr = e.message;
    }
  }
  throw new Error(`Dilbilgisi hatasÄ±: ${lastErr}`);
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
    console.warn("[Backend] Vercel API detectAI Ã§aÄŸrÄ±sÄ± baÅŸarÄ±sÄ±z, yerel fallback kullanÄ±lÄ±yor:", backendError?.message);
  }

  const maxRetries = Math.max(1, apiKeyManager.getActiveKeysCount('gemini'));
  if (retryCount >= maxRetries) {
    return {
      score: 0.5,
      reasoning: "TÃ¼m API anahtarlarÄ± kotalÄ± veya geÃ§ersiz olduÄŸu iÃ§in analiz yapÄ±lamadÄ±.",
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

  const sensitivityDesc = sensitivity > 70 ? "Ã‡OK HASSAS (En kÃ¼Ã§Ã¼k YZ izini bile yakala)" :
    sensitivity < 30 ? "HOÅGÃ–RÃœLÃœ (Sadece bariz YZ metinlerini iÅŸaretle)" :
      "DENGELÄ° (Standart profesyonel denetim)";

  for (const currentModel of modelsToTry) {
    try {
      const validatedModel = validateModelName(currentModel);
      console.log(`[Auditor] Model deneniyor: ${validatedModel}`);
      const client = getGeminiClient();
      const result = await client.models.generateContent({
        model: validatedModel,
        contents: [{ role: 'user', parts: [{ text: `AÅŸaÄŸÄ±daki metni bir "Originality Auditor" (YZ DedektÃ¶rÃ¼) olarak derinlemesine analiz et. 
      
        ANALÄ°Z AYARI: ${sensitivityDesc} (Hassasiyet DeÄŸeri: ${sensitivity}/100)
        SEÃ‡Ä°LÄ° ANALÄ°Z MOTORU: ${currentModel}

        GÃ–REV:
        1. Metnin genel YZ olasÄ±lÄ±k skorunu belirle (0.0 - 1.0).
        2. Ä°NTÄ°HAL VE ETÄ°K DENETÄ°MÄ° (SENTENCE LEVEL):
           - %15'lik benzerlik sÄ±nÄ±rÄ±nÄ±n aÅŸÄ±lÄ±p aÅŸÄ±lmadÄ±ÄŸÄ±nÄ± kontrol et.
           - Metinde hileli karakter (gÃ¶rÃ¼nmez boÅŸluk vb.) olup olmadÄ±ÄŸÄ±nÄ± denetle.
           - AtÄ±f sisteminin (APA/MLA vb.) doÄŸruluÄŸunu ve teknik tanÄ±mlarÄ±n tÄ±rnak iÃ§inde olup olmadÄ±ÄŸÄ±nÄ± incele.
        3. Metni CÃœMLE CÃœMLE analiz et. Her cÃ¼mle iÃ§in:
           - Bir skor (0.0 - 1.0) ata.
           - Bir tip ('ai', 'human', 'mixed') belirle.
           - DetaylÄ± bir "reason" (neden) yaz (Ã–rn: "DÃ¼ÅŸÃ¼k perplexity ve tekdÃ¼ze cÃ¼mle yapÄ±sÄ±", "Beklenen insan varyasyonlarÄ± mevcut", "AÅŸÄ±rÄ± tahmin edilebilir kelime dizilimi").
        4. YapÄ±sal metrikleri hesapla (Burstiness, Punctuation, Complexity).
        5. Metnin genel "Reasoning" (MantÄ±ksal GerekÃ§e) kÄ±smÄ±nda neden bu karara vardÄ±ÄŸÄ±nÄ± aÃ§Ä±kla.

        Ã–NEMLÄ°: YanÄ±tÄ± SADECE JSON olarak dÃ¶n.

        JSON ÅEMASI:
        {
          "score": 0.85,
          "reasoning": "Metnin geneli iÃ§in detaylÄ± analiz Ã¶zeti...",
          "sentenceScores": [
            {
              "sentence": "CÃ¼mle iÃ§eriÄŸi", 
              "score": 0.9, 
              "type": "ai", 
              "reason": "Bu cÃ¼mle neden YZ olarak iÅŸaretlendi? (Ã–rn: 'Tipik GPT-4 giriÅŸ yapÄ±sÄ±', 'Sentaktik tekrarlar')"
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
              "text": "AlÄ±ntÄ± veya intihal ÅŸÃ¼phesi olan metin kÄ±smÄ±",
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
      console.log(`[Auditor] ${currentModel} baÅŸarÄ±lÄ±.`);

      return {
        score: typeof parsed.score === 'number' ? parsed.score : 0.5,
        reasoning: parsed.reasoning || "Analiz tamamlandÄ±.",
        sentenceScores: Array.isArray(parsed.sentenceScores) ? parsed.sentenceScores.map((s: any) => ({
          sentence: s.sentence || "",
          score: typeof s.score === 'number' ? s.score : 0.5,
          type: s.type || (s.score > 0.6 ? 'ai' : s.score < 0.4 ? 'human' : 'mixed'),
          reason: s.reason || "CÃ¼mle yapÄ±sÄ± incelendi."
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
        console.log("[Auditor] Kota veya geÃ§ersiz anahtar, anahtar rotasyonu yapÄ±ldÄ±. Tekrar deneniyor...");
        return detectAI(text, sensitivity, modelName, retryCount + 1);
      }
      console.warn(`[Auditor] ${currentModel} baÅŸarÄ±sÄ±z:`, error.message);
      lastError = error;
    }
  }

  await reportServiceError("detectAI", lastError, { textLength: text.length });

  return {
    score: 0.5,
    reasoning: "TÃ¼m modeller baÅŸarÄ±sÄ±z oldu. Temel analiz yapÄ±ldÄ±.",
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
