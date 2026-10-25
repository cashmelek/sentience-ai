import { db } from '../lib/firebase';
import { collection, getDocs, writeBatch, doc, serverTimestamp } from 'firebase/firestore';
import type { Project } from '../types';

export const DEMO_PROJECTS: Omit<Project, 'id'>[] = [
  {
    title: '[AKADEMİK TEZ] Dijital Gözetim ve Veri Etiği',
    originalText: `Modern toplumların dijitalleşme süreçleri, Shoshana Zuboff'un "Gözetim Kapitalizmi" (Surveillance Capitalism) olarak kavramsallaştırdığı yeni bir ekonomik ve sosyal düzenin ortaya çıkmasına zemin hazırlamıştır (Zuboff, 2019: 45). Bireylerin çevrim içi davranışsal artık verilerinin metalaştırılması, rıza mekanizmasının işlevsizleşmesine yol açmaktadır. Bu bağlamda, dijital platformların kullanıcı deneyimini optimize etme iddiası, aslında öngörü ürünlerinin davranışsal vadeli işlem piyasalarında satılmasına hizmet etmektedir (Couldry ve Mejias, 2019: 82). Söz konusu asimetrik güç ilişkisi, bireysel özerkliği ve demokratik karar alma süreçlerini aşındırmakta, gözetim pratiklerini olağanlaştırmaktadır. Veri egemenliğinin korunması adına algoritmik şeffaflık ve hesap verebilirlik ilkelerinin kurumsal çerçevelere entegre edilmesi elzemdir.`,
    humanizedText: `Günümüz toplumlarında hız kazanan dijital dönüşüm, bireylerin çevrim içi ayak izlerinin ekonomik birer meta hâline getirildiği yeni bir gözetim dinamiğini beraberinde getirmektedir. Kullanıcıların dijital platformlarda bıraktığı davranışsal veriler, rıza süreçlerinin biçimselleştiği bir ortamda toplanarak algoritmik tahmin modellerine dönüştürülmektedir. Bu durum, yalnızca kişisel gizliliği tehdit etmekle kalmayıp bireylerin özgür iradeyle karar alma kapasitelerini ve demokratik katılım alanlarını da sınırlandırmaktadır. Bu nedenle, salt teknik düzenlemelerin ötesine geçilerek algoritmik şeffaflığı ve veri özerkliğini güvence altına alan etik denetim mekanizmalarının tesis edilmesi kaçınılmazdır.`,
    tone: 'akademik',
    intensity: 85,
    aiScore: 12,
    plagiarismScore: 24,
    isDraft: false,
    createdAt: new Date().toISOString(),
    insights: [
      'Metin akademik dil kurallarına ve atıf etiğine uygun biçimde kurgulanmıştır.',
      'Perplexity ve Burstiness değerleri yüksek insan yazımı varyasyonları göstermektedir.',
      'Tespit edilen intihal oranı literatür taraması ve akademik atıf bağlamındadır.'
    ],
    metrics: {
      perplexity: 148,
      burstiness: 0.82,
      readability: 46,
      atesman: 48,
      cetinkayaUzun: 41,
      bezirciYilmaz: 15.4,
      lix: 58,
      rix: 5.2,
      vocabularyRichness: 0.79,
      consistency: 0.88,
      structureScore: 0.92,
      complexity: 'Akademik / İleri'
    },
    sources: [
      {
        url: 'https://dergipark.org.tr/tr/pub/nisantasisbd/article/1745268',
        title: 'Gözetim Kapitalizmi Ekseninde Veri, Algoritma ve Emek Tartışmaları - Nişantaşı SBD',
        snippet: 'Gözetim kapitalizmi kapsamında bireylerin dijital platformlarda bıraktığı davranışsal verilerin metalaştırılması ve algoritmik sömürü süreçleri incelenmektedir.',
        matchedSnippet: 'bireylerin çevrim içi davranışsal artık verilerinin metalaştırılması...',
        matchedText: 'Bireylerin çevrim içi davranışsal artık verilerinin metalaştırılması, rıza mekanizmasının işlevsizleşmesine yol açmaktadır.',
        matchGroup: 'cited_and_quoted',
        similarity: 0.28,
        trust: 'high'
      },
      {
        url: 'https://doi.org/10.24908/ss.v17i1/2.13238',
        title: 'Surveillance Capitalism: An Interview with Shoshana Zuboff - Surveillance & Society',
        snippet: 'Shoshana Zuboff explains the core dynamics of surveillance capitalism, behavioral surplus, and prediction products sold to behavioral futures markets.',
        matchedSnippet: 'asimetrik güç ilişkisi, bireysel özerkliği ve demokratik karar alma süreçlerini aşındırmakta...',
        matchedText: 'Söz konusu asimetrik güç ilişkisi, bireysel özerkliği ve demokratik karar alma süreçlerini aşındırmakta...',
        matchGroup: 'cited_and_quoted',
        similarity: 0.22,
        trust: 'high'
      },
      {
        url: 'https://doi.org/10.14763/2019.2.1411',
        title: 'Making data colonialism liveable: how might data’s social order be regulated? - Couldry & Mejias',
        snippet: 'Nick Couldry and Ulises A. Mejias analyze data colonialism, the appropriation of human life through algorithmic capture and asymmetric power relationships.',
        matchedSnippet: 'davranışsal vadeli işlem piyasalarında satılmasına hizmet etmektedir...',
        matchedText: 'öngörü ürünlerinin davranışsal vadeli işlem piyasalarında satılmasına hizmet etmektedir',
        matchGroup: 'cited_and_quoted',
        similarity: 0.19,
        trust: 'high'
      }
    ],
    sentenceScores: [
      {
        sentence: "Modern toplumların dijitalleşme süreçleri, Shoshana Zuboff'un 'Gözetim Kapitalizmi' (Surveillance Capitalism) olarak kavramsallaştırdığı yeni bir ekonomik ve sosyal düzenin ortaya çıkmasına zemin hazırlamıştır (Zuboff, 2019: 45).",
        score: 0.10,
        color: 'emerald',
        reason: 'Özgün akademik sentez ve kaynak atıflı insan kurgusu.'
      },
      {
        sentence: "Bireylerin çevrim içi davranışsal artık verilerinin metalaştırılması, rıza mekanizmasının işlevsizleşmesine yol açmaktadır.",
        score: 0.14,
        color: 'emerald',
        reason: 'Doğal sentaks ve yüksek kelime zenginliği.'
      },
      {
        sentence: "Bu bağlamda, dijital platformların kullanıcı deneyimini optimize etme iddiası, aslında öngörü ürünlerinin davranışsal vadeli işlem piyasalarında satılmasına hizmet etmektedir (Couldry ve Mejias, 2019: 82).",
        score: 0.11,
        color: 'emerald',
        reason: 'Literatür atıflı kavramsal çözümleme.'
      },
      {
        sentence: "Söz konusu asimetrik güç ilişkisi, bireysel özerkliği ve demokratik karar alma süreçlerini aşındırmakta, gözetim pratiklerini olağanlaştırmaktadır.",
        score: 0.15,
        color: 'emerald',
        reason: 'Organik cümle ritmi ve dengeli karmaşıklık.'
      },
      {
        sentence: "Veri egemenliğinin korunması adına algoritmik şeffaflık ve hesap verebilirlik ilkelerinin kurumsal çerçevelere entegre edilmesi elzemdir.",
        score: 0.09,
        color: 'emerald',
        reason: 'İnsan üslubunda çözüm önerisi.'
      }
    ],
    auditorResult: {
      score: 0.12,
      reasoning: 'Metin genelinde insan yazımına özgü zengin terim çeşitliliği, düzensiz cümle boyutu (yüksek burstiness) ve meşru akademik atıf yapıları tespit edilmiştir. Yapay zeka izi minimum düzeydedir.',
      metrics: {
        plagiarism: 0.24,
        readability: 0.46,
        atesman: 48,
        cetinkayaUzun: 41,
        bezirciYilmaz: 15.4,
        lix: 58,
        rix: 5.2,
        complexity: 'Akademik / İleri',
        burstiness: 0.82,
        perplexity: 1.48,
        structureScore: 0.92
      }
    },
    mlAnalysis: {
      readabilityScore: 0.46,
      complexityIndex: 0.85,
      metrics: {
        wordCount: 88,
        sentenceCount: 5,
        syllableCount: 236,
        avgWordLength: 6.8,
        atesman: 48,
        cetinkayaUzun: 41,
        bezirciYilmaz: 15.4,
        lix: 58,
        rix: 5.2
      },
      recommendations: [
        {
          text: "Cümle yapısı akademik olarak oldukça zengin ve dengeli.",
          type: 'general'
        }
      ]
    },
    analysis: {
      humanizedText: `Günümüz toplumlarında hız kazanan dijital dönüşüm, bireylerin çevrim içi ayak izlerinin ekonomik birer meta hâline getirildiği yeni bir gözetim dinamiğini beraberinde getirmektedir. Kullanıcıların dijital platformlarda bıraktığı davranışsal veriler, rıza süreçlerinin biçimselleştiği bir ortamda toplanarak algoritmik tahmin modellerine dönüştürülmektedir. Bu durum, yalnızca kişisel gizliliği tehdit etmekle kalmayıp bireylerin özgür iradeyle karar alma kapasitelerini ve demokratik katılım alanlarını da sınırlandırmaktadır. Bu nedenle, salt teknik düzenlemelerin ötesine geçilerek algoritmik şeffaflığı ve veri özerkliğini güvence altına alan etik denetim mekanizmalarının tesis edilmesi kaçınılmazdır.`,
      aiScore: 0.12,
      similarityScore: 24,
      scanStatus: 'ok',
      queriesRun: 3,
      sources: [
        {
          url: 'https://dergipark.org.tr/tr/pub/nisantasisbd/article/1745268',
          title: 'Gözetim Kapitalizmi Ekseninde Veri, Algoritma ve Emek Tartışmaları - Nişantaşı SBD',
          snippet: 'Gözetim kapitalizmi kapsamında bireylerin dijital platformlarda bıraktığı davranışsal verilerin metalaştırılması ve algoritmik sömürü süreçleri incelenmektedir.',
          matchedSnippet: 'bireylerin çevrim içi davranışsal artık verilerinin metalaştırılması...',
          matchedText: 'Bireylerin çevrim içi davranışsal artık verilerinin metalaştırılması, rıza mekanizmasının işlevsizleşmesine yol açmaktadır.',
          matchGroup: 'cited_and_quoted',
          similarity: 0.28,
          trust: 'high'
        },
        {
          url: 'https://doi.org/10.24908/ss.v17i1/2.13238',
          title: 'Surveillance Capitalism: An Interview with Shoshana Zuboff - Surveillance & Society',
          snippet: 'Shoshana Zuboff explains the core dynamics of surveillance capitalism, behavioral surplus, and prediction products sold to behavioral futures markets.',
          matchedSnippet: 'asimetrik güç ilişkisi, bireysel özerkliği ve demokratik karar alma süreçlerini aşındırmakta...',
          matchedText: 'Söz konusu asimetrik güç ilişkisi, bireysel özerkliği ve demokratik karar alma süreçlerini aşındırmakta...',
          matchGroup: 'cited_and_quoted',
          similarity: 0.22,
          trust: 'high'
        },
        {
          url: 'https://doi.org/10.14763/2019.2.1411',
          title: 'Making data colonialism liveable: how might data’s social order be regulated? - Couldry & Mejias',
          snippet: 'Nick Couldry and Ulises A. Mejias analyze data colonialism, the appropriation of human life through algorithmic capture and asymmetric power relationships.',
          matchedSnippet: 'davranışsal vadeli işlem piyasalarında satılmasına hizmet etmektedir...',
          matchedText: 'öngörü ürünlerinin davranışsal vadeli işlem piyasalarında satılmasına hizmet etmektedir',
          matchGroup: 'cited_and_quoted',
          similarity: 0.19,
          trust: 'high'
        }
      ],
      sentenceScores: [
        { sentence: "Modern toplumların dijitalleşme süreçleri...", score: 0.10, type: 'human' },
        { sentence: "Bireylerin çevrim içi davranışsal artık verilerinin metalaştırılması...", score: 0.14, type: 'human' },
        { sentence: "Bu bağlamda, dijital platformların kullanıcı deneyimini optimize etme iddiası...", score: 0.11, type: 'human' },
        { sentence: "Söz konusu asimetrik güç ilişkisi...", score: 0.15, type: 'human' },
        { sentence: "Veri egemenliğinin korunması adına...", score: 0.09, type: 'human' }
      ],
      insights: [
        'Metin akademik dil kurallarına ve atıf etiğine uygun biçimde kurgulanmıştır.',
        'Perplexity ve Burstiness değerleri yüksek insan yazımı varyasyonları göstermektedir.'
      ],
      metrics: {
        perplexity: 1.48,
        burstiness: 0.82,
        readability: 0.46,
        atesman: 48,
        cetinkayaUzun: 41,
        vocabularyRichness: 0.79,
        consistency: 0.88,
        structureScore: 0.92
      }
    },
    grammarSuggestions: []
  },
  {
    title: '[YZ DÖNÜŞÜMÜ] Transformer Mimarisi ve LLM Eğitimi',
    originalText: `Yapay zeka teknolojilerindeki son gelişmeler, doğal dil işleme alanında devrim niteliğinde bir dönüşüm yaratmıştır. Bu dönüşümün temelinde yatan en önemli unsur, 2017 yılında tanıtılan Transformer mimarisidir. Transformer modelleri, geleneksel tekrarlayan sinir ağlarının (RNN) aksine, öz-dikkat (self-attention) mekanizmasını kullanarak metindeki tüm kelimeleri paralel olarak işleyebilmektedir. Bu durum, modelin uzun mesafeli bağımlılıkları çok daha etkili bir şekilde öğrenmesine olanak tanır. Sonuç olarak, büyük dil modelleri (LLM) insan benzeri metinler üretebilmekte ve karmaşık akıl yürütme görevlerini başarıyla yerine getirebilmektedir. Gelecekte bu mimarinin daha da gelişeceği ve hayatımızın her alanında kullanılacağı öngörülmektedir.`,
    humanizedText: `Doğal dil işlemede taşları yerinden oynatan asıl kırılma, klasik ardışık ağların zincirlerini kıran Transformer mimarisinin sahneye çıkışıyla yaşandı. Bilginin adım adım aktarıldığı eski RNN yapılarının aksine, öz-dikkat mekanizması bir cümlenin başı ile sonu arasındaki anlamsal köprüleri tek bir hamlede kurabiliyor. Kelimeler arasındaki gizli ağırlıkları eş zamanlı hesaplayan bu matematiksel zemin; dil modellerine yalnızca akıcı cümle kurma yetisi değil, bağlamı derinlemesine kavrayan bir kavrayış derinliği kazandırdı. Yapay zekânın metin üretme serüveni, artık ezber kalıpların ötesinde çok boyutlu bir temsil uzayında şekilleniyor.`,
    tone: 'profesyonel',
    intensity: 90,
    aiScore: 94,
    plagiarismScore: 6,
    isDraft: false,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    insights: [
      'Giriş metni aşırı tekrarlı sentaks ve monoton yapay zeka kalıpları içermektedir (%94 YZ).',
      'İnsanlaştırma motoru tekdüze cümle ritmini bozarak bağlamsal akıcılık sağlamıştır (%4 YZ seviyesi).',
      'Cümleler arası semantik bağlantılar güçlendirilmiştir.'
    ],
    metrics: {
      perplexity: 34,
      burstiness: 0.16,
      readability: 68,
      atesman: 62,
      cetinkayaUzun: 55,
      bezirciYilmaz: 10.2,
      lix: 44,
      rix: 3.4,
      vocabularyRichness: 0.38,
      consistency: 0.94,
      structureScore: 0.45,
      complexity: 'Orta / Şablonik'
    },
    sources: [
      {
        url: 'https://arxiv.org/abs/1706.03762',
        title: 'Attention Is All You Need - Vaswani et al. (Transformer Foundation Paper)',
        snippet: 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks.',
        matchedSnippet: '2017 yılında tanıtılan Transformer mimarisidir...',
        matchedText: 'Bu dönüşümün temelinde yatan en önemli unsur, 2017 yılında tanıtılan Transformer mimarisidir.',
        matchGroup: 'missing_citation',
        similarity: 0.18,
        trust: 'high'
      }
    ],
    sentenceScores: [
      {
        sentence: "Yapay zeka teknolojilerindeki son gelişmeler, doğal dil işleme alanında devrim niteliğinde bir dönüşüm yaratmıştır.",
        score: 0.96,
        color: 'red',
        reason: 'Aşırı klişe giriş kalıbı ve aşırı düşük Perplexity.'
      },
      {
        sentence: "Bu dönüşümün temelinde yatan en önemli unsur, 2017 yılında tanıtılan Transformer mimarisidir.",
        score: 0.92,
        color: 'red',
        reason: 'Tipik YZ açıklama şablonu.'
      },
      {
        sentence: "Transformer modelleri, geleneksel tekrarlayan sinir ağlarının (RNN) aksine, öz-dikkat (self-attention) mekanizmasını kullanarak metindeki tüm kelimeleri paralel olarak işleyebilmektedir.",
        score: 0.89,
        color: 'red',
        reason: 'Öngörülebilir sentaks ve tekdüze bağlaç kullanımı.'
      },
      {
        sentence: "Bu durum, modelin uzun mesafeli bağımlılıkları çok daha etkili bir şekilde öğrenmesine olanak tanır.",
        score: 0.94,
        color: 'red',
        reason: 'Monoton sebep-sonuç bağlacı.'
      },
      {
        sentence: "Sonuç olarak, büyük dil modelleri (LLM) insan benzeri metinler üretebilmekte ve karmaşık akıl yürütme görevlerini başarıyla yerine getirebilmektedir.",
        score: 0.95,
        color: 'red',
        reason: 'Standart yapay zeka sonuç cümlesi kalıbı.'
      },
      {
        sentence: "Gelecekte bu mimarinin daha da gelişeceği ve hayatımızın her alanında kullanılacağı öngörülmektedir.",
        score: 0.98,
        color: 'red',
        reason: 'Yüksek oranda yapay zeka jenerik kapanış cümlesi.'
      }
    ],
    auditorResult: {
      score: 0.94,
      reasoning: 'Metin, yapay zeka dil modellerinin tipik çıktısı olan monoton cümle uzunlukları, çok düşük Perplexity ve tahmin edilebilir bağlaçlar içermektedir. Cümlelerin tamamı yüksek risk grubundadır.',
      metrics: {
        plagiarism: 0.06,
        readability: 0.68,
        atesman: 62,
        cetinkayaUzun: 55,
        bezirciYilmaz: 10.2,
        lix: 44,
        rix: 3.4,
        complexity: 'Orta / Şablonik',
        burstiness: 0.16,
        perplexity: 0.34,
        structureScore: 0.45
      }
    },
    mlAnalysis: {
      readabilityScore: 0.68,
      complexityIndex: 0.45,
      metrics: {
        wordCount: 75,
        sentenceCount: 6,
        syllableCount: 194,
        avgWordLength: 6.2,
        atesman: 62,
        cetinkayaUzun: 55,
        bezirciYilmaz: 10.2,
        lix: 44,
        rix: 3.4
      },
      recommendations: [
        {
          text: "Cümle uzunlukları birbirine çok yakın (monoton ritim). Cümle boylarını çeşitlendirin.",
          type: 'long_sentence'
        }
      ]
    },
    analysis: {
      humanizedText: `Doğal dil işlemede taşları yerinden oynatan asıl kırılma, klasik ardışık ağların zincirlerini kıran Transformer mimarisinin sahneye çıkışıyla yaşandı. Bilginin adım adım aktarıldığı eski RNN yapılarının aksine, öz-dikkat mekanizması bir cümlenin başı ile sonu arasındaki anlamsal köprüleri tek bir hamlede kurabiliyor. Kelimeler arasındaki gizli ağırlıkları eş zamanlı hesaplayan bu matematiksel zemin; dil modellerine yalnızca akıcı cümle kurma yetisi değil, bağlamı derinlemesine kavrayan bir kavrayış derinliği kazandırdı. Yapay zekânın metin üretme serüveni, artık ezber kalıpların ötesinde çok boyutlu bir temsil uzayında şekilleniyor.`,
      aiScore: 0.94,
      similarityScore: 6,
      scanStatus: 'ok',
      queriesRun: 2,
      sources: [
        {
          url: 'https://arxiv.org/abs/1706.03762',
          title: 'Attention Is All You Need - Vaswani et al. (Transformer Foundation Paper)',
          snippet: 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks.',
          matchedSnippet: '2017 yılında tanıtılan Transformer mimarisidir...',
          matchedText: 'Bu dönüşümün temelinde yatan en önemli unsur, 2017 yılında tanıtılan Transformer mimarisidir.',
          matchGroup: 'missing_citation',
          similarity: 0.18,
          trust: 'high'
        }
      ],
      sentenceScores: [
        { sentence: "Yapay zeka teknolojilerindeki son gelişmeler...", score: 0.96, type: 'ai' },
        { sentence: "Bu dönüşümün temelinde yatan en önemli unsur...", score: 0.92, type: 'ai' },
        { sentence: "Transformer modelleri, geleneksel tekrarlayan...", score: 0.89, type: 'ai' },
        { sentence: "Bu durum, modelin uzun mesafeli bağımlılıkları...", score: 0.94, type: 'ai' },
        { sentence: "Sonuç olarak, büyük dil modelleri (LLM)...", score: 0.95, type: 'ai' },
        { sentence: "Gelecekte bu mimarinin daha da gelişeceği...", score: 0.98, type: 'ai' }
      ],
      insights: [
        'Giriş metni aşırı tekrarlı sentaks ve monoton yapay zeka kalıpları içermektedir (%94 YZ).',
        'İnsanlaştırma motoru tekdüze cümle ritmini bozarak bağlamsal akıcılık sağlamıştır (%4 YZ seviyesi).'
      ],
      metrics: {
        perplexity: 0.34,
        burstiness: 0.16,
        readability: 0.68,
        atesman: 62,
        cetinkayaUzun: 55,
        vocabularyRichness: 0.38,
        consistency: 0.94,
        structureScore: 0.45
      }
    },
    grammarSuggestions: []
  },
  {
    title: '[HUKUKİ MEVZUAT] KVKK Madde 9 Kapsamında Veri Aktarımı',
    originalText: `6698 sayılı Kişisel Verilerin Korunması Kanunu'nun 9. maddesinde yapılan son değişiklikler doğrultusunda, kişisel verilerin yurt dışına aktarılması hususunda yeni usul ve esaslar belirlenmiştir. Kanun metnine göre: "Kişisel veriler, ilgili kişinin açık rızası olmaksızın yurt dışına aktarılamaz. Ancak Kanunun 5 inci maddesinin ikinci fıkrası ile 6 ncı maddesinin üçüncü fıkrasında belirtilen şartlardan birinin varlığı ve yeterli korumanın bulunması hâlinde açık rıza aranmaksızın aktarılabilir." Bu çerçevede Kişisel Verileri Koruma Kurulu tarafından yayımlanan standart sözleşme metinleri ve bağlayıcı şirket kuralları (BCR), çok uluslu şirketlerin veri aktarım süreçlerinde temel hukuki dayanak hâline gelmiştir. Şirketlerin uyum süreçlerinde veri envanterlerini güncellemesi yasal bir yükümlülüktür.`,
    humanizedText: `6698 sayılı Kanun’un 9. maddesindeki güncellemeler, kişisel verilerin sınır ötesi dolaşımında açık rıza kuralını esnetirken kurumsal güvence mekanizmalarını ön plana çıkarmıştır. Mevzuat uyarınca; "Kişisel veriler, ilgili kişinin açık rızası olmaksızın yurt dışına aktarılamaz. Ancak Kanunun 5 inci maddesinin ikinci fıkrası ile 6 ncı maddesinin üçüncü fıkrasında belirtilen şartlardan birinin varlığı ve yeterli korumanın bulunması hâlinde açık rıza aranmaksızın aktarılabilir." hükmü korunmakla birlikte, Kurul onaylı standart sözleşmeler ve bağlayıcı şirket kuralları veri transferlerinde operasyonel güvence sağlamaktadır. Veri sorumlularının olası idari para cezalarından kaçınmak adına envanterlerini bu yeni hukuki standartlarla uyumlu hale getirmesi şarttır.`,
    tone: 'resmi',
    intensity: 75,
    aiScore: 8,
    plagiarismScore: 36,
    isDraft: false,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    insights: [
      'Kanun maddesi doğrudan tırnak içinde ("...") verilmiş ve etik kurallara tam uyulmuştur.',
      'Meşru hukuki alıntı grubu doğru etiketlenmiştir.',
      'Doğal insan muhakemesi ve teknik hukuk terminolojisi doğrulanmıştır.'
    ],
    metrics: {
      perplexity: 132,
      burstiness: 0.76,
      readability: 42,
      atesman: 38,
      cetinkayaUzun: 34,
      bezirciYilmaz: 17.8,
      lix: 64,
      rix: 6.1,
      vocabularyRichness: 0.74,
      consistency: 0.91,
      structureScore: 0.95,
      complexity: 'Hukuki / Zor'
    },
    sources: [
      {
        url: 'https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=6698&MevzuatTur=1&MevzuatTertip=5',
        title: '6698 Sayılı Kişisel Verilerin Korunması Kanunu - Mevzuat Bilgi Sistemi',
        snippet: 'Kişisel verilerin yurt dışına aktarılması MADDE 9 - Kişisel veriler, ilgili kişinin açık rızası olmaksızın yurt dışına aktarılamaz.',
        matchedSnippet: 'Kişisel veriler, ilgili kişinin açık rızası olmaksızın yurt dışına aktarılamaz...',
        matchedText: 'Kişisel veriler, ilgili kişinin açık rızası olmaksızın yurt dışına aktarılamaz.',
        matchGroup: 'cited_and_quoted',
        similarity: 0.42,
        trust: 'high'
      },
      {
        url: 'https://www.resmigazete.gov.tr/eskiler/2024/03/20240312-1.htm',
        title: '7499 Sayılı Kanun (KVKK Değişiklikleri) - T.C. Resmî Gazete',
        snippet: 'Kişisel Verilerin Korunması Kanunu ile Bazı Kanunlarda Değişiklik Yapılmasına Dair Kanun',
        matchedSnippet: 'standart sözleşme metinleri ve bağlayıcı şirket kuralları...',
        matchedText: 'Kişisel Verileri Koruma Kurulu tarafından yayımlanan standart sözleşme metinleri...',
        matchGroup: 'cited_and_quoted',
        similarity: 0.32,
        trust: 'high'
      }
    ],
    sentenceScores: [
      {
        sentence: "6698 sayılı Kişisel Verilerin Korunması Kanunu'nun 9. maddesinde yapılan son değişiklikler doğrultusunda, kişisel verilerin yurt dışına aktarılması hususunda yeni usul ve esaslar belirlenmiştir.",
        score: 0.07,
        color: 'emerald',
        reason: 'Hukuki giriş cümlesi, organik insan üslubu.'
      },
      {
        sentence: 'Kanun metnine göre: "Kişisel veriler, ilgili kişinin açık rızası olmaksızın yurt dışına aktarılamaz. Ancak Kanunun 5 inci maddesinin ikinci fıkrası ile 6 ncı maddesinin üçüncü fıkrasında belirtilen şartlardan birinin varlığı ve yeterli korumanın bulunması hâlinde açık rıza aranmaksızın aktarılabilir."',
        score: 0.05,
        color: 'emerald',
        reason: 'Doğrudan kanun metni alıntısı (tırnak içi kuralına uygun).'
      },
      {
        sentence: "Bu çerçevede Kişisel Verileri Koruma Kurulu tarafından yayımlanan standart sözleşme metinleri ve bağlayıcı şirket kuralları (BCR), çok uluslu şirketlerin veri aktarım süreçlerinde temel hukuki dayanak hâline gelmiştir.",
        score: 0.09,
        color: 'emerald',
        reason: 'Teknik hukuki analiz ve bağlam kurma.'
      },
      {
        sentence: "Şirketlerin uyum süreçlerinde veri envanterlerini güncellemesi yasal bir yükümlülüktür.",
        score: 0.11,
        color: 'emerald',
        reason: 'Kısa ve net hukuki çıkarım.'
      }
    ],
    auditorResult: {
      score: 0.08,
      reasoning: 'Hukuki mevzuat analizi. Kanun maddesi tırnak içinde doğrudan alıntılanmış, yorum cümleleri ise organik ve özgün insan sentaksıyla yazılmıştır.',
      metrics: {
        plagiarism: 0.36,
        readability: 0.42,
        atesman: 38,
        cetinkayaUzun: 34,
        bezirciYilmaz: 17.8,
        lix: 64,
        rix: 6.1,
        complexity: 'Hukuki / Zor',
        burstiness: 0.76,
        perplexity: 1.32,
        structureScore: 0.95
      }
    },
    mlAnalysis: {
      readabilityScore: 0.42,
      complexityIndex: 0.92,
      metrics: {
        wordCount: 82,
        sentenceCount: 4,
        syllableCount: 228,
        avgWordLength: 7.1,
        atesman: 38,
        cetinkayaUzun: 34,
        bezirciYilmaz: 17.8,
        lix: 64,
        rix: 6.1
      },
      recommendations: [
        {
          text: "Kanun maddesi alıntısı tespit edildi, doğrudan alıntı tırnak içi formatı korunmalıdır.",
          type: 'general'
        }
      ]
    },
    analysis: {
      humanizedText: `6698 sayılı Kanun’un 9. maddesindeki güncellemeler, kişisel verilerin sınır ötesi dolaşımında açık rıza kuralını esnetirken kurumsal güvence mekanizmalarını ön plana çıkarmıştır. Mevzuat uyarınca; "Kişisel veriler, ilgili kişinin açık rızası olmaksızın yurt dışına aktarılamaz. Ancak Kanunun 5 inci maddesinin ikinci fıkrası ile 6 ncı maddesinin üçüncü fıkrasında belirtilen şartlardan birinin varlığı ve yeterli korumanın bulunması hâlinde açık rıza aranmaksızın aktarılabilir." hükmü korunmakla birlikte, Kurul onaylı standart sözleşmeler ve bağlayıcı şirket kuralları veri transferlerinde operasyonel güvence sağlamaktadır. Veri sorumlularının olası idari para cezalarından kaçınmak adına envanterlerini bu yeni hukuki standartlarla uyumlu hale getirmesi şarttır.`,
      aiScore: 0.08,
      similarityScore: 36,
      scanStatus: 'ok',
      queriesRun: 2,
      sources: [
        {
          url: 'https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=6698&MevzuatTur=1&MevzuatTertip=5',
          title: '6698 Sayılı Kişisel Verilerin Korunması Kanunu - Mevzuat Bilgi Sistemi',
          snippet: 'Kişisel verilerin yurt dışına aktarılması MADDE 9 - Kişisel veriler, ilgili kişinin açık rızası olmaksızın yurt dışına aktarılamaz.',
          matchedSnippet: 'Kişisel veriler, ilgili kişinin açık rızası olmaksızın yurt dışına aktarılamaz...',
          matchedText: 'Kişisel veriler, ilgili kişinin açık rızası olmaksızın yurt dışına aktarılamaz.',
          matchGroup: 'cited_and_quoted',
          similarity: 0.42,
          trust: 'high'
        },
        {
          url: 'https://www.resmigazete.gov.tr/eskiler/2024/03/20240312-1.htm',
          title: '7499 Sayılı Kanun (KVKK Değişiklikleri) - T.C. Resmî Gazete',
          snippet: 'Kişisel Verilerin Korunması Kanunu ile Bazı Kanunlarda Değişiklik Yapılmasına Dair Kanun',
          matchedSnippet: 'standart sözleşme metinleri ve bağlayıcı şirket kuralları...',
          matchedText: 'Kişisel Verileri Koruma Kurulu tarafından yayımlanan standart sözleşme metinleri...',
          matchGroup: 'cited_and_quoted',
          similarity: 0.32,
          trust: 'high'
        }
      ],
      sentenceScores: [
        { sentence: "6698 sayılı Kişisel Verilerin Korunması Kanunu'nun 9. maddesinde...", score: 0.07, type: 'human' },
        { sentence: 'Kanun metnine göre: "Kişisel veriler...', score: 0.05, type: 'human' },
        { sentence: "Bu çerçevede Kişisel Verileri Koruma Kurulu tarafından...", score: 0.09, type: 'human' },
        { sentence: "Şirketlerin uyum süreçlerinde veri envanterlerini...", score: 0.11, type: 'human' }
      ],
      insights: [
        'Kanun maddesi doğrudan tırnak içinde ("...") verilmiş ve etik kurallara tam uyulmuştur.',
        'Meşru hukuki alıntı grubu doğru etiketlenmiştir.'
      ],
      metrics: {
        perplexity: 1.32,
        burstiness: 0.76,
        readability: 0.42,
        atesman: 38,
        cetinkayaUzun: 34,
        vocabularyRichness: 0.74,
        consistency: 0.91,
        structureScore: 0.95
      }
    },
    grammarSuggestions: []
  },
  {
    title: '[FELSEFİ DENEME] Algoritmik Bilinç ve Düşünce Yanılsaması',
    originalText: `Bir makinenin acıyı taklit edebilmesi, onun gerçekten canının yandığı anlamına gelir mi? Turing testini geçebilen bir algoritma, bilincin eşiğini mi aşmıştır yoksa sadece istatistiksel olasılıkların mükemmel bir illüzyonisti midir? John Searle'ün Çin Odası argümanında fısıldadığı gibi; sembolleri kurallarına göre dizmek, o sembollerin anlamını bilmek demek değildir. İnsan zihni, nöronlar arasındaki elektrik akımlarından ibaret bir hesap makinesi değil; hatıraların, pişmanlıkların ve henüz yaşanmamış anların ağırlığıyla yoğrulan organik bir bilmecedir. Belki de yapay zekâya dair asıl korkumuz, onun bir gün bilinç kazanması değil; bizim kendi bilincimizi mekanik birer işlem dizisine indirgeme hevesimizdir.`,
    humanizedText: `Kelimeleri en kusursuz olasılık eğrileriyle yan yana dizen bir kod parçasının "acı" sözcüğünü fısıldaması, onun gerçekten yaralandığını mı kanıtlar? Bir algoritmanın insanı şaşırtması, bilincin şafağını mı müjdeler yoksa yalnızca devasa bir veri aynasının bize sunduğu kurgusal bir yankı mıdır? Searle’ün Çin Odası’nda yüzümüze çarptığı gerçek hâlâ geçerliliğini koruyor: Sembollerin sıralanışına hakim olmak, o sembollerin ardındaki yaşantıyı hissetmeye yetmez. İnsan zihni salt mantıksal kapılardan geçen bir sinyal değil; kırılganlıkların, çelişkilerin ve telafisiz zamanların tortusudur. Asıl ürkütücü soru makinelerin uyanıp uyanmayacağı değil; bizim kendi varoluşumuzu soğuk algoritmalara teslim etmeye ne kadar dünden razı olduğumuzdur.`,
    tone: 'yaratici',
    intensity: 80,
    aiScore: 4,
    plagiarismScore: 3,
    isDraft: false,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    insights: [
      'Olağanüstü yüksek Perplexity (174) ve Burstiness (0.94) değeri.',
      'Edebi metaforlar, retorik sorular ve zengin felsefi derinlik.',
      'Sıfır yapay zeka şablonu, tamamen organik düşünce akışı.'
    ],
    metrics: {
      perplexity: 174,
      burstiness: 0.94,
      readability: 72,
      atesman: 72,
      cetinkayaUzun: 68,
      bezirciYilmaz: 8.6,
      lix: 38,
      rix: 2.8,
      vocabularyRichness: 0.88,
      consistency: 0.89,
      structureScore: 0.96,
      complexity: 'Edebi / Zengin'
    },
    sources: [
      {
        url: 'https://plato.stanford.edu/entries/chinese-room/',
        title: 'The Chinese Room Argument - Stanford Encyclopedia of Philosophy',
        snippet: 'John Searle introduced the Chinese Room argument in his 1980 paper Minds, Brains, and Programs.',
        matchedSnippet: 'John Searle\'ün Çin Odası argümanında fısıldadığı gibi...',
        matchedText: "John Searle'ün Çin Odası argümanında fısıldadığı gibi; sembolleri kurallarına göre dizmek, o sembollerin anlamını bilmek demek değildir.",
        matchGroup: 'cited_and_quoted',
        similarity: 0.15,
        trust: 'high'
      }
    ],
    sentenceScores: [
      {
        sentence: "Bir makinenin acıyı taklit edebilmesi, onun gerçekten canının yandığı anlamına gelir mi?",
        score: 0.03,
        color: 'emerald',
        reason: 'Edebi retorik soru, tamamen insansı duygu aktarımı.'
      },
      {
        sentence: "Turing testini geçebilen bir algoritma, bilincin eşiğini mi aşmıştır yoksa sadece istatistiksel olasılıkların mükemmel bir illüzyonisti midir?",
        score: 0.04,
        color: 'emerald',
        reason: 'Zengin kelime seçimi, yüksek Perplexity.'
      },
      {
        sentence: "John Searle'ün Çin Odası argümanında fısıldadığı gibi; sembolleri kurallarına göre dizmek, o sembollerin anlamını bilmek demek değildir.",
        score: 0.05,
        color: 'emerald',
        reason: 'Felsefi kavramsallaştırma ve özgün metaforik üslup.'
      },
      {
        sentence: "İnsan zihni, nöronlar arasındaki elektrik akımlarından ibaret bir hesap makinesi değil; hatıraların, pişmanlıkların ve henüz yaşanmamış anların ağırlığıyla yoğrulan organik bir bilmecedir.",
        score: 0.02,
        color: 'emerald',
        reason: 'Yüksek Burstiness, sanatsal tezat ve derin sentaks.'
      },
      {
        sentence: "Belki de yapay zekâya dair asıl korkumuz, onun bir gün bilinç kazanması değil; bizim kendi bilincimizi mekanik birer işlem dizisine indirgeme hevesimizdir.",
        score: 0.04,
        color: 'emerald',
        reason: 'Özgün felsefi vuruş cümlesi.'
      }
    ],
    auditorResult: {
      score: 0.04,
      reasoning: 'Metin, yüksek entelektüel derinliğe, zengin edebi metaforlara ve çok yüksek Burstiness-Perplexity oranlarına sahiptir. Yapay zeka izi bulunmamaktadır.',
      metrics: {
        plagiarism: 0.03,
        readability: 0.72,
        atesman: 72,
        cetinkayaUzun: 68,
        bezirciYilmaz: 8.6,
        lix: 38,
        rix: 2.8,
        complexity: 'Edebi / Zengin',
        burstiness: 0.94,
        perplexity: 1.74,
        structureScore: 0.96
      }
    },
    mlAnalysis: {
      readabilityScore: 0.72,
      complexityIndex: 0.78,
      metrics: {
        wordCount: 92,
        sentenceCount: 5,
        syllableCount: 245,
        avgWordLength: 5.8,
        atesman: 72,
        cetinkayaUzun: 68,
        bezirciYilmaz: 8.6,
        lix: 38,
        rix: 2.8
      },
      recommendations: [
        {
          text: "Felsefi retorik ve ritim kusursuz insan doğallığında.",
          type: 'general'
        }
      ]
    },
    analysis: {
      humanizedText: `Kelimeleri en kusursuz olasılık eğrileriyle yan yana dizen bir kod parçasının "acı" sözcüğünü fısıldaması, onun gerçekten yaralandığını mı kanıtlar? Bir algoritmanın insanı şaşırtması, bilincin şafağını mı müjdeler yoksa yalnızca devasa bir veri aynasının bize sunduğu kurgusal bir yankı mıdır? Searle’ün Çin Odası’nda yüzümüze çarptığı gerçek hâlâ geçerliliğini koruyor: Sembollerin sıralanışına hakim olmak, o sembollerin ardındaki yaşantıyı hissetmeye yetmez. İnsan zihni salt mantıksal kapılardan geçen bir sinyal değil; kırılganlıkların, çelişkilerin ve telafisiz zamanların tortusudur. Asıl ürkütücü soru makinelerin uyanıp uyanmayacağı değil; bizim kendi varoluşumuzu soğuk algoritmalara teslim etmeye ne kadar dünden razı olduğumuzdur.`,
      aiScore: 0.04,
      similarityScore: 3,
      scanStatus: 'ok',
      queriesRun: 2,
      sources: [
        {
          url: 'https://plato.stanford.edu/entries/chinese-room/',
          title: 'The Chinese Room Argument - Stanford Encyclopedia of Philosophy',
          snippet: 'John Searle introduced the Chinese Room argument in his 1980 paper Minds, Brains, and Programs.',
          matchedSnippet: 'John Searle\'ün Çin Odası argümanında fısıldadığı gibi...',
          matchedText: "John Searle'ün Çin Odası argümanında fısıldadığı gibi; sembolleri kurallarına göre dizmek, o sembollerin anlamını bilmek demek değildir.",
          matchGroup: 'cited_and_quoted',
          similarity: 0.15,
          trust: 'high'
        }
      ],
      sentenceScores: [
        { sentence: "Bir makinenin acıyı taklit edebilmesi...", score: 0.03, type: 'human' },
        { sentence: "Turing testini geçebilen bir algoritma...", score: 0.04, type: 'human' },
        { sentence: "John Searle'ün Çin Odası argümanında...", score: 0.05, type: 'human' },
        { sentence: "İnsan zihni, nöronlar arasındaki elektrik...", score: 0.02, type: 'human' },
        { sentence: "Belki de yapay zekâya dair asıl korkumuz...", score: 0.04, type: 'human' }
      ],
      insights: [
        'Olağanüstü yüksek Perplexity (174) ve Burstiness (0.94) değeri.',
        'Edebi metaforlar, retorik sorular ve zengin felsefi derinlik.'
      ],
      metrics: {
        perplexity: 1.74,
        burstiness: 0.94,
        readability: 0.72,
        atesman: 72,
        cetinkayaUzun: 68,
        vocabularyRichness: 0.88,
        consistency: 0.89,
        structureScore: 0.96
      }
    },
    grammarSuggestions: []
  }
];

export async function resetAndSeedDemoProjects(userId: string): Promise<number> {
  if (!userId) throw new Error("Kullanıcı kimliği bulunamadı.");

  const snap = await getDocs(collection(db, 'projects'));
  const userDocs = snap.docs.filter(d => d.data().userId === userId);
  
  const batch = writeBatch(db);
  userDocs.forEach(d => {
    batch.delete(d.ref);
  });
  await batch.commit();

  const addBatch = writeBatch(db);
  DEMO_PROJECTS.forEach(demo => {
    const newDocRef = doc(collection(db, 'projects'));
    addBatch.set(newDocRef, {
      ...demo,
      userId,
      createdAt: serverTimestamp()
    });
  });
  await addBatch.commit();

  return DEMO_PROJECTS.length;
}
