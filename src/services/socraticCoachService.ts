import { getGeminiClient, validateModelName } from './geminiService';

export interface SocraticFeedbackItem {
  id: string;
  category: 'citation' | 'objectivity' | 'methodology' | 'clarity' | 'originality';
  title: string;
  question: string;
  pedagogicalTip: string;
  highlightText?: string;
  severity: 'tip' | 'warning' | 'inquiry';
}

export interface SocraticCoachReport {
  scoreSummary: {
    citationReadiness: number;
    academicObjectivity: number;
    methodologicalStructure: number;
  };
  inquiries: SocraticFeedbackItem[];
  encouragement: string;
}

const SUBJECTIVE_TERMS = [
  'bence', 'bana göre', 'harika', 'mükemmel', 'kesinlikle', 'apaçık',
  'herkes bilir ki', 'tartışmasız', 'çok bariz', 'asla', 'şüphesiz',
  'inanılmaz', 'fevkalade', 'kusursuz', 'apaçık ortadadır'
];

const CLAIM_VERBS = [
  'gösterilmiştir', 'kanıtlanmıştır', 'belirtilmiştir', 'ortaya koymuştur',
  'vurgulanmaktadır', 'iddia edilmektedir', 'tespit edilmiştir', 'bulunmuştur'
];

const STRUCTURAL_KEYWORDS = [
  'giriş', 'yöntem', 'metodoloji', 'bulgular', 'tartışma', 'sonuç',
  'literatür', 'amaç', 'kapsam', 'hipotez', 'örneklem', 'veri'
];

export function analyzeSocraticHeuristics(text: string): SocraticCoachReport {
  const trimmed = text.trim();
  const paragraphs = trimmed.split(/\n+/).filter(p => p.trim().length > 30);
  const inquiries: SocraticFeedbackItem[] = [];

  let citationCount = 0;
  const citationMatches = trimmed.match(/\([A-ZÇĞİÖŞÜa-zçğıöşü\s]+,\s*(?:19|20)\d{2}\)|\[\d+\]|(?:ve ark\.|et al\.)/g);
  if (citationMatches) {
    citationCount = citationMatches.length;
  }

  const claimCount = CLAIM_VERBS.reduce((acc, verb) => {
    const re = new RegExp(`\\b${verb}\\b`, 'gi');
    const matches = trimmed.match(re);
    return acc + (matches ? matches.length : 0);
  }, 0);

  if (claimCount > 0 && citationCount === 0) {
    inquiries.push({
      id: 'soc-cite-1',
      category: 'citation',
      title: 'İddia Cümlelerinde Doğrudan Atıf Eksikliği',
      question: 'Metninizde "...kanıtlanmıştır/gösterilmiştir" şeklinde iddia bildiren ifadeler yer alıyor. Bu iddiaları literatürde hangi araştırmacının bulgusuna dayandırıyorsunuz?',
      pedagogicalTip: 'Akademik dürüstlük gereği her genelgeçer olmayan iddia parantez içi atıfla (örn: Yılmaz, 2024 veya [1]) desteklenmelidir.',
      severity: 'warning'
    });
  } else if (citationCount > 0 && claimCount > citationCount * 2) {
    inquiries.push({
      id: 'soc-cite-2',
      category: 'citation',
      title: 'Kaynak / İddia Yoğunluğu Dengesi',
      question: 'Birçok araştırma iddiası öne sürülmüş fakat atıf sayısı sınırlı kalmış. İkincil kaynaklar yerine birincil makalelere yer verdiniz mi?',
      pedagogicalTip: 'Literatür sentezinde her paragrafta ana savı destekleyen en az 1-2 güvenilir akademik kaynağa başvurulmalıdır.',
      severity: 'inquiry'
    });
  }

  const foundSubjective: string[] = [];
  SUBJECTIVE_TERMS.forEach(term => {
    if (new RegExp(`\\b${term}\\b`, 'i').test(trimmed)) {
      foundSubjective.push(term);
    }
  });

  if (foundSubjective.length > 0) {
    inquiries.push({
      id: 'soc-obj-1',
      category: 'objectivity',
      title: 'Akademik Tarafsızlık (Hedging / İhtiyat Dili)',
      question: `Metninizde "${foundSubjective.slice(0, 3).join('", "')}" gibi mutlak veya öznel niteleyiciler tespit edildi. Bu cümleleri araştırmacı tarafsızlığıyla ("veriler ... yönünde yorumlanabilir") nasıl ifade edebilirsiniz?`,
      pedagogicalTip: 'Bilimsel yazımda dogmatik ifadeler yerine verinin sınırlarını kabul eden ihtiyatlı akademik dil (hedging) tercih edilir.',
      highlightText: foundSubjective[0],
      severity: 'warning'
    });
  }

  let foundStructureCount = 0;
  STRUCTURAL_KEYWORDS.forEach(kw => {
    if (new RegExp(`\\b${kw}\\b`, 'i').test(trimmed)) {
      foundStructureCount++;
    }
  });

  if (paragraphs.length >= 3 && foundStructureCount < 2) {
    inquiries.push({
      id: 'soc-struct-1',
      category: 'methodology',
      title: 'Araştırma Metodolojisi ve Akış Kurgusu',
      question: 'Çalışmanızın problem tanımı, veri toplama yöntemi ve varılan sonuç bölümleri belirgin şekilde ayrılmış mı?',
      pedagogicalTip: 'Okuyucunun argümanı takip edebilmesi için çalışmanın amacı ve yöntem sınırları ilk sayfalarda açıkça tanımlanmalıdır.',
      severity: 'inquiry'
    });
  }

  inquiries.push({
    id: 'soc-orig-1',
    category: 'originality',
    title: 'Özgün Yazar Sesi ve Sentez Düzeyi',
    question: 'Bu metindeki paragraflar kaynaklardan derlenmiş özetler mi, yoksa bulguları kendi teorik çerçevenizden geçirdiğiniz özgün bir tartışma mı?',
    pedagogicalTip: 'Yüksek kaliteli bir akademik teslimde kaynaklar sadece dayanak oluşturur; ana tartışma ve sentez öğrencinin kendi kelimeleriyle yürütülür.',
    severity: 'tip'
  });

  const citationReadiness = Math.min(100, Math.max(30, Math.round((citationCount / Math.max(1, paragraphs.length)) * 70 + 30)));
  const academicObjectivity = Math.max(25, 100 - (foundSubjective.length * 15));
  const methodologicalStructure = Math.min(100, Math.max(40, foundStructureCount * 18 + 20));

  return {
    scoreSummary: {
      citationReadiness,
      academicObjectivity,
      methodologicalStructure
    },
    inquiries,
    encouragement: 'Sokratik Koç metninizi yeniden yazmaz; kendi akademik sesinizi bulmanız ve dürüstlük ilkelerine uygun şekilde çalışmanızı olgunlaştırmanız için rehberlik eder.'
  };
}

export async function analyzeWithSocraticCoach(text: string, modelName: string = 'gemini-2.5-flash-lite'): Promise<SocraticCoachReport> {
  const heuristicReport = analyzeSocraticHeuristics(text);
  if (!text || text.trim().length < 80) {
    return heuristicReport;
  }

  try {
    const ai = getGeminiClient();
    const validatedModel = validateModelName(modelName);
    const systemPrompt = `Sen üniversite ve lisansüstü düzeyde bilimsel araştırmalara rehberlik eden "Socratic Academic Coach" (Sokratik Akademik Danışman) pedagojik ajanısın.
KESİN KURALLAR:
1. ASLA KULLANICININ METNİNİ YENİDEN YAZMA VEYA SENTETİK METİN ÖNERME.
2. Öğrenciye yalnızca düşünmeye, kaynak araştırmaya ve atıf vermeye teşvik eden 3 adet derin Sokratik soru (question) ve pedagojik ipucu (pedagogicalTip) üret.
3. Çıktıyı kesinlikle geçerli tek bir JSON formatında döndür. Markdown blokları, backtick veya açıklama yazma.

JSON Şeması:
{
  "inquiries": [
    {
      "category": "citation" | "objectivity" | "methodology" | "clarity" | "originality",
      "title": "Kısa başlık",
      "question": "Sokratik soru",
      "pedagogicalTip": "Pedagojik tavsiye",
      "severity": "tip" | "warning" | "inquiry"
    }
  ],
  "citationReadiness": 85,
  "academicObjectivity": 90,
  "methodologicalStructure": 80,
  "encouragement": "Öğrenciye yönelik 1 cümlelik teşvik edici akademik not"
}`;

    const response = await ai.models.generateContent({
      model: validatedModel,
      contents: [{ role: 'user', parts: [{ text: `Aşağıdaki akademik metin taslağını incele ve Sokratik pedagojik değerlendirme üret:\n\n${text.substring(0, 4000)}` }] }],
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.2,
        responseMimeType: 'application/json'
      }
    });

    const rawText = response.text?.trim() || '';
    if (rawText) {
      const parsed = JSON.parse(rawText);
      if (Array.isArray(parsed.inquiries) && parsed.inquiries.length > 0) {
        return {
          scoreSummary: {
            citationReadiness: Number(parsed.citationReadiness) || heuristicReport.scoreSummary.citationReadiness,
            academicObjectivity: Number(parsed.academicObjectivity) || heuristicReport.scoreSummary.academicObjectivity,
            methodologicalStructure: Number(parsed.methodologicalStructure) || heuristicReport.scoreSummary.methodologicalStructure
          },
          inquiries: parsed.inquiries.map((item: any, idx: number) => ({
            id: `soc-ai-${idx + 1}`,
            category: item.category || 'clarity',
            title: item.title || 'Akademik Değerlendirme',
            question: item.question || '',
            pedagogicalTip: item.pedagogicalTip || '',
            severity: item.severity || 'inquiry'
          })),
          encouragement: parsed.encouragement || heuristicReport.encouragement
        };
      }
    }
  } catch (err) {
    console.warn('Socratic Coach Gemini call fallback to heuristics:', err);
  }

  return heuristicReport;
}
