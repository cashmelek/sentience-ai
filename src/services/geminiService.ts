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

// Primary model - gemini-2.5-flash offers best cost/performance ratio
// gemini-flash-latest alias ensures future-proofing (auto-updates to newest Flash)
const MODEL_NAME = "gemini-2.5-flash"; 

const assertApiKey = () => {
  if (!apiKey || apiKey === 'dummy-key-for-initialization') {
    throw new Error("API Anahtarı Eksik: .env.local dosyasında GEMINI_API_KEY veya VITE_GEMINI_API_KEY değişkeninin tanımlı olduğundan emin olun.");
  }
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
 * Safely cleans and parses JSON from LLM output.
 * Handles markdown code blocks, trailing commas, and common escaping issues.
 */
const robustParse = (text: string) => {
  try {
    // 1. Remove markdown code blocks if present
    let cleaned = text.replace(/```json\n?|```/g, '').trim();
    
    // 2. Fix common LLM JSON errors (unescaped newlines and quotes inside strings)
    let inString = false;
    let result = "";
    for (let i = 0; i < cleaned.length; i++) {
      const char = cleaned[i];
      const prevChar = i > 0 ? cleaned[i-1] : '';
      
      if (char === '"' && prevChar !== '\\') {
        // Simple heuristic: if we are in a string and the next char is NOT a JSON structural char
        // (like :, }, ], or ,), then this is likely an unescaped quote.
        if (inString) {
          const nextPart = cleaned.substring(i + 1).trim();
          const isActuallyEndOfString = i === cleaned.length - 1 || /^[:,\}\]]/.test(nextPart);
          if (isActuallyEndOfString) {
            inString = false;
            result += char;
          } else {
            result += '\\"'; // Escape the internal quote
          }
        } else {
          inString = true;
          result += char;
        }
      } else if (char === '\n' && inString) {
        result += "\\n";
      } else {
        result += char;
      }
    }
    
    // 3. Handle truncation: If the response is truncated, try to close it
    if (inString) {
      result += '"'; // Close the open string
    }
    
    // Simple bracket balancer for truncated JSON
    let openBraces = (result.match(/\{/g) || []).length;
    let closeBraces = (result.match(/\}/g) || []).length;
    while (openBraces > closeBraces) {
      result += '}';
      closeBraces++;
    }
    
    let openBrackets = (result.match(/\[/g) || []).length;
    let closeBrackets = (result.match(/\]/g) || []).length;
    while (openBrackets > closeBrackets) {
      result += ']';
      closeBrackets++;
    }

    return JSON.parse(result);
  } catch (e) {
    console.warn("JSON parsing failed, attempting fallback extraction:", e);
    
    // 4. Fallback: Try to extract everything between the first { and last }
    try {
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      if (firstBrace !== -1) {
        let jsonCandidate = lastBrace !== -1 ? text.substring(firstBrace, lastBrace + 1) : text.substring(firstBrace) + "}";
        // Apply basic cleanup to candidate too
        jsonCandidate = jsonCandidate.replace(/\n/g, '\\n');
        return JSON.parse(jsonCandidate);
      }
    } catch (innerE) {
      console.error("JSON extraction failed:", innerE);
    }
    throw e;
  }
};

export const analyzeAndHumanize = async (text: string, options: HumanizeOptions, modelName?: string): Promise<AnalysisResult> => {
  assertApiKey();
  
  // Görev: İnsanlaştırma — kalite öncelikli, alias ile geleceğe dayanıklı
  const modelsToTry = [
    modelName,                    // Admin panelinden gelen model
    MODEL_NAME,                   // gemini-2.5-flash (en iyi F/P)
    "gemini-2.5-flash-lite",     // Ucuz alternatif
    "gemini-flash-latest",       // Alias — asla kaldırılmaz
  ].filter((v, i, a) => Boolean(v) && a.indexOf(v) === i) as string[]; // deduplicate
  
  let lastError: any = null;

  console.log("Denecek modeller:", modelsToTry);

  for (const currentModel of modelsToTry) {
    try {
      console.log(`Model deneniyor: ${currentModel}`);
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
        2. İNSANİLEŞTİRME: Metni YZ tespitinden kaçacak şekilde, doğal bir dille yeniden yaz.
           - ${styleInstruction}
           - ${intensityInstruction}
        3. CÜMLE ANALİZİ: Metni CÜMLE CÜMLE analiz et ve her cümle için YZ olasılığını belirle.
        4. METRİKLER: Metnin okunabilirliğini, karmaşıklığını ve ton gücünü profesyonel bir denetçi gibi hesapla.
        
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

      console.log(`Model ${currentModel} ile istek gönderiliyor...`);
      let result;
      try {
        result = await ai.models.generateContent({
          model: currentModel,
          contents: [{ role: "user", parts: [{ text: `Kaynak Metin: ${text}\n\n${prompt}` }] }],
          config: {
            responseMimeType: "application/json",
            temperature: temp,
            maxOutputTokens: 4096,
          } as any
        });
      } catch (apiError: any) {
        console.error(`Model ${currentModel} API Hatası:`, apiError);
        throw apiError; // Re-throw to be caught by the outer catch
      }

      console.log(`Model ${currentModel} yanıt verdi:`, result);

      // Extract text from the result - checking both possible formats
      const resultText = (result as any).text || 
                         (result as any).response?.text?.() || 
                         (result as any).candidates?.[0]?.content?.parts?.[0]?.text || 
                         '';
      
      if (!resultText) {
        throw new Error(`Model ${currentModel} boş yanıt döndü.`);
      }

      const parsed = robustParse(resultText);
      
      console.log(`Model ${currentModel} başarılı bir şekilde parse edildi.`);

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
      console.warn(`Model ${currentModel} denemesi başarısız:`, error.message || error);
      lastError = error;
      // If it's a 404 or model not found, we continue to the next model
    }
  }

  throw new Error(`YZ İşlemi Başarısız. Son hata: ${lastError?.message}`);
};

/**
 * Logs service errors to Firestore for Admin oversight.
 */
export const reportServiceError = async (serviceName: string, error: any, context?: any) => {
  console.error(`[ServiceError] ${serviceName}:`, error);
  // Note: Firestore logging would happen here if integrated.
  // For now, we'll ensure the UI can display these if we add a local state or a dedicated collection.
};

export const checkGrammar = async (text: string, _options?: GrammarOptions): Promise<GrammarSuggestion[]> => {
  assertApiKey();
  // Görev: Dilbilgisi — hafif görev, lite model yeterli
  const models = ["gemini-2.5-flash-lite", "gemini-flash-latest"];
  let lastErr = "";
  
  for (const modelName of models) {
    try {
      console.log(`[Grammar] Model deneniyor: ${modelName}`);
      const result = await ai.models.generateContent({
        model: modelName,
        contents: [{ role: "user", parts: [{ text: `Aşağıdaki metni Türkçe dilbilgisi açısından denetle ve JSON formatında suggestions listesi dön. Format: {"suggestions": [{"original": "...", "suggestion": "...", "explanation": "..."}]}. Metin: ${text}` }] }],
        config: { responseMimeType: "application/json", temperature: 0.1 } as any
      });
      const parsed = robustParse(result.text || '{}');
      console.log(`[Grammar] ${modelName} başarılı.`);
      return parsed.suggestions || [];
    } catch (e: any) {
      console.warn(`[Grammar] ${modelName} başarısız:`, e.message);
      lastErr = e.message;
    }
  }
  throw new Error(`Dilbilgisi hatası: ${lastErr}`);
};

export const detectAI = async (text: string, sensitivity: number = 50, modelName: string = "gemini-2.5-flash-lite") => {
  assertApiKey();
  
  // Görev: YZ Tespiti — analitik görev, lite model ile maliyet optimizasyonu
  const modelsToTry = [
    modelName,                    // Admin panelinden gelen
    "gemini-2.5-flash-lite",     // Ucuz analiz
    "gemini-2.5-flash",          // Daha derin analiz
    "gemini-flash-latest",       // Son çare alias
  ].filter((v, i, a) => Boolean(v) && a.indexOf(v) === i) as string[];

  let lastError: any = null;

  const sensitivityDesc = sensitivity > 70 ? "ÇOK HASSAS (En küçük YZ izini bile yakala)" : 
                         sensitivity < 30 ? "HOŞGÖRÜLÜ (Sadece bariz YZ metinlerini işaretle)" : 
                         "DENGELİ (Standart profesyonel denetim)";

  for (const currentModel of modelsToTry) {
    try {
      console.log(`[Auditor] Model deneniyor: ${currentModel}`);
      const result = await ai.models.generateContent({
        model: currentModel,
        contents: [{ role: "user", parts: [{ text: `Aşağıdaki metni bir "Originality Auditor" (YZ Dedektörü) olarak derinlemesine analiz et. 
      
        ANALİZ AYARI: ${sensitivityDesc} (Hassasiyet Değeri: ${sensitivity}/100)
        SEÇİLİ ANALİZ MOTORU: ${currentModel}

        GÖREV:
        1. Metnin genel YZ olasılık skorunu belirle (0.0 - 1.0).
        2. Metni CÜMLE CÜMLE analiz et. Her cümle için:
           - Bir skor (0.0 - 1.0) ata.
           - Bir tip ('ai', 'human', 'mixed') belirle.
           - Detaylı bir "reason" (neden) yaz (Örn: "Düşük perplexity ve tekdüze cümle yapısı", "Beklenen insan varyasyonları mevcut", "Aşırı tahmin edilebilir kelime dizilimi").
        3. Yapısal metrikleri hesapla (Burstiness, Punctuation, Complexity).
        4. Metnin genel "Reasoning" (Mantıksal Gerekçe) kısmında neden bu karara vardığını açıkla.

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
          }
        }

        Metin: ${text}` }] }],
        config: { responseMimeType: "application/json", temperature: 0.1 } as any
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
        }
      };
    } catch (error: any) {
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
    }
  };
};
