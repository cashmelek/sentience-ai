import { BlogPost } from '../types/blog';

export const BLOG_POSTS: BlogPost[] = [
  {
    id: 1,
    slug: 'bagimsiz-arastirmalar-yapay-zeka-tespit-dogrulugu',
    title: 'Bağımsız Akademik Araştırmalar Doğruluyor: Yapay Zeka Tespiti, Doğruluk Testleri ve Türkiye Standartları',
    category: 'Bağımsız Testler & Doğruluk',
    readTime: '8 dk okuma',
    date: 'Ekim 2026',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200&auto=format&fit=crop',
    summary: 'Cornell Tech arXiv, Manhattan College, Boston Üniversitesi ve Türk araştırmacıların yayımladığı bağımsız hakemli çalışmalar: Yapay zeka tespit sistemlerinin doğruluk oranları, yanlış pozitif riskleri ve YÖK/TÜBİTAK süreçlerindeki kritik rolü.',
    leadParagraph: 'Üretken yapay zeka modelleri (ChatGPT, Gemini, Claude, DeepSeek) akademik dünyada yaygınlaştıkça, bilimsel içeriklerin özgünlüğünü ve dürüstlüğünü korumak en öncelikli konu haline gelmiştir. Cornell Tech arXiv, Manhattan College ve Türk araştırmacıların (Dr. Ömer Aydın & Doç. Dr. Enis Karaarslan) gerçekleştirdiği bağımsız akademik çalışmalar; yüzeysel tespit araçları ile kurumsal düzeydeki çok katmanlı denetim motorları arasındaki derin doğruluk farkını somut verilerle belgelemektedir.',
    toc: [
      { id: 'kuresel-ve-yerel-arastirmalar', title: '1. Bağımsız Akademik Testler ve Küresel Literatür' },
      { id: 'yanlis-pozitif-ve-yok-surecleri', title: '2. Yanlış Pozitif (False Positive) Riski ve YÖK Süreçleri' },
      { id: 'turkce-ve-cok-dilli-modeller', title: '3. Türkçe Metinlerde ve DeepSeek/GPT-4o Karşısında Dayanıklılık' },
      { id: 'insanlastirma-ve-sentaks-muhendisligi', title: '4. Sentaks Değişimi, Hileli Karakterler ve Doğal İnsanlaştırma' },
      { id: 'sentience-denetci-mimarisi', title: '5. Sentience Denetçi ve Sentinel: Kanıta Dayalı Doğrulama' }
    ],
    sections: [
      {
        id: 'kuresel-ve-yerel-arastirmalar',
        title: 'Bağımsız Akademik Testler ve Küresel Literatür',
        paragraphs: [
          'Yapay zeka dedektörlerinin güvenilirliği üzerine yürütülen uluslararası hakemli çalışmalar, piyasadaki yazılımlar arasında uçurumsal performans farkları olduğunu göstermektedir. William H. Walters (Manhattan College) tarafından yayımlanan 16 farklı tespit aracının karşılaştırıldığı çalışmada, birçok ücretsiz platformun GPT-4 ve yeni nesil modeller karşısında doğruluk oranının %50 seviyesine gerilediği belgelenmiştir.',
          'Buna karşılık ileri düzey makine öğrenimi mimarilerini kullanan kurumsal motorlar (Cornell Tech arXiv çalışmasında kanıtlandığı üzere) insan yazımı metinlerde %99.12, yapay zeka çıktılarında ise %95-99.6 bandında tutarlı bir ayrıştırma başarısı sergilemektedir.'
        ]
      },
      {
        id: 'yanlis-pozitif-ve-yok-surecleri',
        title: 'Yanlış Pozitif (False Positive) Riski ve YÖK Tez Süreçleri',
        paragraphs: [
          'Akademik değerlendirmede en büyük felaket, bir araştırmacının veya lisansüstü öğrencisinin aylarca emek vererek yazdığı özgün tez bölümünün hatalı bir biçimde yapay zeka olarak etiketlenmesidir (Yanlış Pozitif / False Positive).',
          'Boston Üniversitesi Yapay Zeka Görev Gücü Raporu ve bağımsız akademisyenler, hiçbir tespit yazılımının tek başına bir disiplin veya ret kararına dayanak olamayacağını; yazılımların yalnızca kanıt toplayıcı ve rehber niteliğinde kullanılması gerektiğini vurgulamaktadır. Sentience platformunda yer alan Denetçi modülü, toptan bir etiket yerine cümle bazlı olasılık dağılımı ve şeffaf gerekçelendirme sunarak araştırmacıyı korur.'
        ],
        callout: {
          title: 'Enstitüye Teslim Etmeden Önce Metninizi Denetleyin',
          desc: 'Sentience Denetçi modülü, çalışmanız enstitü jürisine gitmeden önce yapay zeka olasılıklarını ve cümle entropilerini cümle bazlı haritalandırır.',
          ctaText: 'Doğruluk Testini Başlat'
        }
      },
      {
        id: 'turkce-ve-cok-dilli-modeller',
        title: 'Türkçe Metinlerde ve DeepSeek/GPT-4o Karşısında Dayanıklılık',
        paragraphs: [
          'Türkiye akademisinde gerçekleştirilen çalışmalarda (İzmir Akademi bünyesinde Dr. Ömer Aydın ve Doç. Dr. Enis Karaarslan tarafından yürütülen üretken YZ değerlendirme araştırmaları), Türkçe nin sondan eklemeli yapısının yapay zeka dedektörleri için hem bir sınav hem de ayırt edici bir avantaj sunduğu görülmüştür.',
          'DeepSeek V3, Claude 3.5 Sonnet ve GPT-4o gibi modeller Türkçe metin üretirken morfolojik varyasyonları sınırlı tutmakta ve öngörülebilir bağlaç örüntüleri sergilemektedir. Alshammari ve Rao (2025) tarafından yapılan DeepSeek odaklı çalışmada kanıtlandığı gibi, gelişmiş kayan pencere (sliding window) algoritmaları bu karmaşık modellerin izlerini %99.7 oranında belirleyebilmektedir.'
        ]
      },
      {
        id: 'insanlastirma-ve-sentaks-muhendisligi',
        title: 'Sentaks Değişimi, Hileli Karakterler ve Doğal İnsanlaştırma',
        paragraphs: [
          'Pek çok araştırmacı, dedektörleri aşmak amacıyla internetteki basit parafraze araçlarına veya metne görünmez Unicode karakterleri ekleme (homoglyph attack) gibi hileli yöntemlere başvurmaktadır. Ancak bağımsız hakemli çalışmalar, bu yöntemlerin modern denetleyiciler tarafından sıfır toleransla tespit edildiğini ve doğrudan kırmızı bayrak aldığını göstermektedir.',
          'Gerçek çözüm, hileye başvurmadan cümlenin ritmini (Burstiness) çeşitlendirmek ve kelime seçim karmaşıklığını (Perplexity) gerçek bilimsel literatür standartlarına çıkarmaktır. Sentience İnsanlaştırma motoru, metni akademik kurallardan ödün vermeden doğal bir akışa kavuşturur.'
        ]
      },
      {
        id: 'sentience-denetci-mimarisi',
        title: 'Sentience Denetçi ve Sentinel: Kanıta Dayalı Doğrulama',
        paragraphs: [
          'Sentience, akademik bütünlüğü tek bir sayısal skora indirgemez. Denetçi ile erken teşhis konulur, İnsanlaştırma ile sentaks doğallığı sağlanır ve Sentinel modülü ile Crossref, OpenAlex ve OpenCitations üzerinden canlı atıf doğrulaması yapılır.',
          'Ayrıca Admin Read-Only ve Sıfır-Veri güvencesi sayesinde, incelenen hiçbir tez veya makale taslağı harici modellere veri olarak aktarılmaz; araştırmacının telif ve gizlilik hakları en üst düzeyde korunur.'
        ]
      }
    ],
    faqs: [
      {
        q: 'Bağımsız araştırmalarda test edilen en başarılı tespit sistemlerinin doğruluk oranı nedir?',
        a: 'Cornell Tech ve Manhattan College hakemli çalışmalarında kurumsal standarttaki algoritmalar %99.6 doğruluk ve %0.2 nin altında yanlış pozitif (false positive) oranı elde etmiştir.'
      },
      {
        q: 'Türk akademisyenlerin YÖK tezlerinde dikkat etmesi gereken en kritik metrik nedir?',
        a: 'Yanlış pozitif oranının düşüklüğü ve cümle bazlı ısı haritasıdır. Danışman ve jüri üyeleri, toptan bir yüzde yerine hangi cümlenin neden yapay zeka şüphesi taşıdığını somut olarak incelemelidir.'
      },
      {
        q: 'DeepSeek veya GPT-4o gibi muhakeme (reasoning) modelleri tespit edilebilir mi?',
        a: 'Evet. 2025 ve 2026 bağımsız testlerinde, DeepSeek tarafından üretilen metinlerin ve parafraze edilmiş versiyonlarının gelişmiş entropi analiziyle %99.7 oranında tespit edildiği kanıtlanmıştır.'
      },
      {
        q: 'Paraphrase veya basit insanlaştırma araçları Turnitin ve Sentience testlerini aşabilir mi?',
        a: 'Hayır. Yüzeysel kelime takası yapan ücretsiz araçlar cümlenin düşük perplexity yapısını bozamamaktadır. Sentience İnsanlaştırma modülü ise metnin ritmik varyasyonunu akademik korpus standartlarında yeniden dokur.'
      }
    ]
  },
  {
    id: 2,
    slug: 'turkiye-universitelerinde-akademik-durustluk-turnitin-yok-rehberi',
    title: 'Türkiye Üniversitelerinde Akademik Dürüstlük: Turnitin ve YÖK Benzerlik Raporu Rehberi',
    category: 'Akademik Etik & YÖK',
    readTime: '6 dk okuma',
    date: 'Ekim 2026',
    image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=1200&auto=format&fit=crop',
    summary: 'YÖK lisansüstü tez yönergelerinde uygulanan %15 benzerlik tavanı ile yapay zeka tespit skorlarının farkı. Turnitin ve iThenticate filtrelerinde kırmızı alarm almadan özgün akademik çıktı hazırlama kılavuzu.',
    leadParagraph: 'Yükseköğretim Kurulu (YÖK) tarafından yürütülen lisansüstü tez inceleme süreçlerinde ve üniversite enstitülerinde genel benzerlik endeksinin (Similarity Index) %15-20 bandını aşmaması yasal bir zorunluluktur. Ancak Turnitin ve iThenticate yazılımlarına entegre edilen yapay zeka tespit motorları, yalnızca doğrudan metin kopyalamayı değil; büyük dil modellerinin sentaks homojenliğini de raporlamaktadır.',
    toc: [
      { id: 'yok-benzerlik-standartlari', title: '1. YÖK Lisansüstü Benzerlik Standartları' },
      { id: 'ai-vs-klasik-intihal', title: '2. Yapay Zeka Tespiti ile Klasik İntihalin Ayrımı' },
      { id: 'turnitin-filtre-calisma-mantigi', title: '3. Turnitin ve iThenticate Algoritması' },
      { id: 'ozgun-tez-yazim-stratejisi', title: '4. Kırmızı Alarm Almadan Güvenli Yayın Stratejisi' }
    ],
    sections: [
      {
        id: 'yok-benzerlik-standartlari',
        title: 'YÖK Lisansüstü Benzerlik Standartları ve Yasal Çerçeve',
        paragraphs: [
          'Türkiye üniversitelerinde lisansüstü eğitim ve öğretim yönetmelikleri uyarınca enstitülere teslim edilen yüksek lisans ve doktora tezleri resmi orijinallik taramasından geçirilir. Üniversitelerin büyük çoğunluğunda genel benzerlik oranı tavanı %15 veya %20 olarak belirlenmiştir.',
          'Bununla birlikte enstitü yönergeleri yalnızca toplam orana değil, tekil kaynak benzerliğine de odaklanır. Tek bir kaynaktan gelen örtüşmenin %2 veya %3 sınırını geçmesi, genel oran düşük kalsa dahi jüri tarafından doğrudan revizyon veya ret gerekçesi sayılabilmektedir.'
        ]
      },
      {
        id: 'ai-vs-klasik-intihal',
        title: 'Yapay Zeka Tespiti ile Klasik İntihalin Ayrımı',
        paragraphs: [
          'Klasik intihal tarayıcıları, incelenen metni mevcut internet sayfaları, makaleler ve önceki öğrenci tezleriyle harf harf eşleştirir. Ancak yapay zeka tespit sistemleri tamamen farklı bir matematiksel yaklaşım sergiler.',
          'ChatGPT, Claude veya Gemini tarafından üretilen bir paragraf internette daha önce hiç yayımlanmamış olsa bile, modelin deterministik kelime dağılımı (düşük Perplexity) ve monoton cümle uzunlukları (düşük Burstiness) nedeniyle Turnitin AI dedektörleri tarafından anında kırmızı alarm olarak işaretlenir.'
        ],
        callout: {
          title: 'Turnitin Öncesi Metninizi Test Edin',
          desc: 'Sentience Denetçi modülü, çalışmanız enstitüye gitmeden önce yapay zeka ve benzerlik skorlarını cümle cümle analiz eder.',
          ctaText: 'Ücretsiz Ön Analiz Yap'
        }
      },
      {
        id: 'turnitin-filtre-calisma-mantigi',
        title: 'Turnitin ve iThenticate Algoritmaları Nasıl Çalışıyor?',
        paragraphs: [
          'Turnitin, metni bloklar halinde böler ve her bir cümlenin büyük dil modelleri tarafından üretilme olasılık matrisini hesaplar. Yüksek olasılıklı kalıplar (örneğin Türkçe metinlerde sıkça görülen "bu bağlamda değerlendirildiğinde", "büyük bir öneme haizdir" gibi jenerik kalıplar) ardışık geldiğinde tespit yüzdesi hızla fırlar.',
          'Bu durum bazen kendi emeğiyle yazan araştırmacıların da haksız yere yapay zeka şüphesi altına girmesine sebep olabilir. İşte bu noktada cümle ritminin çeşitlendirilmesi ve insan yazarların stilistik varyasyonlarının uygulanması hayati bir rol oynar.'
        ]
      },
      {
        id: 'ozgun-tez-yazim-stratejisi',
        title: 'Kırmızı Alarm Almadan Güvenli ve Özgün Yayın Stratejisi',
        paragraphs: [
          'Akademik dürüstlüğü korumak için en etkili yol, yapay zekayı bir içerik üreticisi olarak değil, bir araştırma asistanı ve kavramsal düşünme ortağı olarak konumlandırmaktır.',
          'Araştırmacılar, sentezledikleri fikirleri doğrudan alıntı yaparken mutlaka tırnak içinde belirtmeli, kavramsal tartışmaları kendi kelimeleriyle çeşitlendirmeli ve Sentience gibi profesyonel araçlarla dil ritmini kontrol altında tutmalıdır.'
        ]
      }
    ],
    faqs: [
      {
        q: 'YÖK tez savunmasında benzerlik oranı üst sınırı kaçtır?',
        a: "Türkiye'deki üniversitelerin enstitü kurullarına göre farklılık göstermekle birlikte genel kabul gören tavan oran %15 ile %20 arasındadır. Tekil kaynak benzerliği ise %2-3'ü aşmamalıdır."
      },
      {
        q: 'Turnitin AI tespit skoru benzerlik raporuna dahil midir?',
        a: 'Turnitin sisteminde benzerlik skoru ile yapay zeka tespit skoru iki ayrı panelde raporlanır. Ancak jüri üyeleri ve danışmanlar her iki metriği de ayrı ayrı inceler.'
      }
    ]
  },
  {
    id: 3,
    slug: 'kendinden-intihal-nedir-dergipark-tubitak-surecleri',
    title: 'Kendinden İntihal (Self-Plagiarism) Nedir? DergiPark ve TÜBİTAK Süreçlerinde Dikkat Edilmesi Gerekenler',
    category: 'Yayın Etiği',
    readTime: '5 dk okuma',
    date: 'Eylül 2026',
    image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=1200&auto=format&fit=crop',
    summary: 'Kendi yüksek lisans tezinizden veya önceki sempozyum bildirisinden makale üretirken etik ihlale düşmemek için gereken atıf kuralları ve doğru sentez yöntemleri.',
    leadParagraph: "Akademik dünyada en sık karşılaşılan fakat en az bilinen ihlallerden biri 'Kendinden İntihal' (Self-Plagiarism veya Duplicate Publication) kavramıdır. Bir araştırmacının daha önce yayımladığı bir bildiriyi, tez bölümlerini veya araştırma raporunu yeni bir makalede kaynak göstermeksizin aynen kullanması, DergiPark ve TÜBİTAK hakem kurullarınca ciddi bir etik ihlal sayılmaktadır.",
    toc: [
      { id: 'kendinden-intihal-tanimi', title: '1. Kendinden İntihal Tanımı ve Kapsamı' },
      { id: 'tezden-makale-turetme', title: '2. Tezden Makale Türetirken Uyulacak Kurallar' },
      { id: 'dergipark-tubitak-filtreleri', title: '3. DergiPark ve TÜBİTAK Hakem Süreçleri' },
      { id: 'sentinel-canli-dogrulama', title: '4. Çapraz Atıf Doğrulama ile Güvenli Yazım' }
    ],
    sections: [
      {
        id: 'kendinden-intihal-tanimi',
        title: 'Kendinden İntihal Tanımı ve Kapsamı',
        paragraphs: [
          'Kendinden intihal; bir yazarın kendi telifinde olan önceki bir çalışmasından önemli pasajları, veri tablolarını veya hipotezleri kaynak göstermeksizin yeni bir çalışmada aynen tekrarlaması durumudur.',
          'Literatürde mükerrer yayın (duplicate publication) veya salamizasyon (salami slicing) olarak adlandırılan bu pratik, okuyucu ve hakemleri yanıltarak tek bir araştırmanın birden fazla bağımsız çalışmaymış gibi algılanmasına yol açar.'
        ]
      },
      {
        id: 'tezden-makale-turetme',
        title: 'Tezden Makale Türetirken Uyulması Zorunlu Kurallar',
        paragraphs: [
          "Türkiye'de doktora ve yüksek lisans tezlerinden makale üretilmesi akademik terfi ve mezuniyet şartları arasında yer alır. Ancak bu dönüşüm yapılırken tezin metnini doğrudan kopyala-yapıştır yapmak ciddi bir risktir.",
          'Makalenin ilk sayfasında dipnot olarak "Bu çalışma, [Üniversite Adı] bünyesinde tamamlanan [Tez Başlığı] başlıklı lisansüstü tezden türetilmiştir" ifadesi eklenmeli ve tezin orijinal metni yöntem ve tartışma kısımlarında güncel literatürle yeniden sentezlenmelidir.'
        ],
        callout: {
          title: 'Eski Yayınlarınızı Canlı İndekslerle Denetleyin',
          desc: 'Sentinel modülü, Crossref ve OpenAlex üzerinde çalışmanızı tarayarak kendi eski çalışmalarınızla çakışan noktaları güvenli atıf formatına dönüştürür.',
          ctaText: 'Kaynak Doğrulamayı Başlat'
        }
      },
      {
        id: 'dergipark-tubitak-filtreleri',
        title: 'DergiPark ve TÜBİTAK Hakem Süreçlerinde İnceleme',
        paragraphs: [
          "DergiPark bünyesindeki indeksli dergiler, gelen her aday makaleyi ilk aşamada iThenticate veya intihal.net üzerinden tarar. Önceden YÖK Ulusal Tez Merkezi'ne yüklenmiş bir tezden kopyalanan bölümler bu taramada %40-60 seviyesinde benzerlik olarak görünür.",
          'Hakemler bu benzerliği gördüklerinde doğrudan ret kararı verebilir veya etik kurul incelemesi talep edebilir. Dolayısıyla tezden makaleye geçişte metnin yapısal olarak zenginleştirilmesi şarttır.'
        ]
      },
      {
        id: 'sentinel-canli-dogrulama',
        title: 'Çapraz Atıf Doğrulama ile Güvenli Yazım',
        paragraphs: [
          'Sentience bünyesindeki Sentinel aracı, DOI kütükleri ve OpenAlex arşivleriyle gerçek zamanlı entegrasyon kurarak metninizdeki ifadelerin önceki yayınlarınızla çakışma derecesini tekil kaynak başına %1-%3 bandına düşürmenize yardımcı olur.'
        ]
      }
    ],
    faqs: [
      {
        q: 'Kendi tezimden ürettiğim makalede kendime atıf yapmam şart mı?',
        a: 'Evet. Makalenin ilk sayfasında bu çalışmanın ilgili tezden türetildiği açıkça belirtilmeli ve kaynakçada lisansüstü tez resmi formatta gösterilmelidir.'
      },
      {
        q: 'Aynı veriyi iki farklı dergide yayımlamak ihlal midir?',
        a: 'Evet. Aynı araştırma verisini veya bulgularını iki ayrı hakemli dergide yeni bir çalışma gibi sunmak duplikasyon (mükerrer yayın) suçudur.'
      }
    ]
  },
  {
    id: 4,
    slug: 'turkce-akademik-metinlerde-yapay-zeka-tespiti',
    title: 'Türkçe Akademik Metinlerde Yapay Zeka Tespiti: Modeller Nasıl Ayrıştırılıyor?',
    category: 'Yapay Zeka Analizi',
    readTime: '7 dk okuma',
    date: 'Eylül 2026',
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop',
    summary: "Türkçe'nin sondan eklemeli morfolojisinde yapay zeka modelleri neden tekdüze cümleler kurar? Perplexity ve Burstiness algoritmalarının bilimsel metinlerdeki çalışma mantığı.",
    leadParagraph: "Türkçe, sondan eklemeli (agglutinative) yapısı ve zengin morfolojik varyasyonlarıyla yapay zeka modelleri için kendine has zorluklar barındırır. GPT-4o, Claude 3.5 veya DeepSeek gibi modeller Türkçe akademik metin üretirken çoğunlukla basmakalıp bağlaçlara sığınırlar ve istatistiksel açıdan öngörülebilir sentaks kalıpları bırakırlar.",
    toc: [
      { id: 'turkce-dil-yapisi-ve-llm', title: "1. Türkçe Dil Yapısı ve LLM'lerin Sentaks Zaafı" },
      { id: 'perplexity-ve-burstiness', title: '2. Perplexity ve Burstiness Matematiği' },
      { id: 'turnitin-ai-nasil-yakaliyor', title: '3. Turnitin ve Copyleaks Nasıl Yakalıyor?' },
      { id: 'etik-insanlastirma-yontemleri', title: '4. Hilesiz ve Etik İnsanlaştırma Yaklaşımı' }
    ],
    sections: [
      {
        id: 'turkce-dil-yapisi-ve-llm',
        title: "Türkçe Dil Yapısı ve LLM'lerin Sentaks Zaafı",
        paragraphs: [
          'Türkçe, kelime köklerine gelen yapım ve çekim ekleriyle tek bir sözcükte cümle düzeyinde anlam taşıyabilen sondan eklemeli bir dildir. Büyük dil modelleri ise ağırlıklı olarak İngilizce veriyle eğitildiklerinden, Türkçe metin üretirken sözdizimini belirli kalıp bağlaçlar etrafında sabit tutarlar.',
          '"Bu doğrultuda ele alındığında", "belirleyici bir nitelik arz etmektedir" gibi klişe bağlamlar her paragraf başında art arda tekrarlandığında, makale yapay zeka dedektörleri için son derece belirgin bir imza haline gelir.'
        ]
      },
      {
        id: 'perplexity-ve-burstiness',
        title: 'Perplexity ve Burstiness Matematiği',
        paragraphs: [
          'Perplexity, modelin bir sonraki kelimeyi ne kadar kolay tahmin edebildiğini ölçer. YZ modelleri her zaman olasılık dağılımının en tepesindeki kelimeleri seçtiği için perplexity puanları düşüktür.',
          'Burstiness ise cümle boyu ve yapılarındaki ritmik değişkenliği gösterir. İnsan yazarlar bir cümleyi 6 kelimelik kısa ve vurucu tutarken bir sonraki cümleyi 25 kelimelik birleşik yapıda kurabilirler. Yapay zeka ise ortalama 14-16 kelimelik monoton bir ritimde takılır.'
        ],
        callout: {
          title: 'Metninizin Doğallık Puanını Öğrenin',
          desc: 'Sentience İnsanlaştırma modülü, cümlenin morfolojisini ve ritmini analiz ederek YZ tespit algoritmalarını doğal yoldan aşmanızı sağlar.',
          ctaText: 'İnsanlaştırma Aracını Dene'
        }
      },
      {
        id: 'turnitin-ai-nasil-yakaliyor',
        title: 'Turnitin ve Copyleaks Nasıl Yakalıyor?',
        paragraphs: [
          'Copyleaks ve Turnitin AI dedektörleri metni kayan pencereler (sliding windows) halinde tarar. Pencerelerdeki kelime seçimlerinin entropisi ölçülür. Düşük entropili ve tekdüze pencereler doğrudan YZ çıktısı olarak etiketlenir.'
        ]
      },
      {
        id: 'etik-insanlastirma-yontemleri',
        title: 'Hilesiz ve Etik İnsanlaştırma Yaklaşımı',
        paragraphs: [
          'Görünmez karakter eklemek veya Rusça/Kiril harfleriyle harf değiştirmek (homoglyph attack) gibi hileler modern denetleme motorlarınca anında saptanır. Gerçek ve kalıcı çözüm; cümlenin sentaksını, devrik-kurallı dengesini ve kavramsal derinliğini akademik Türkçe standartlarında yeniden dokumaktır.'
        ]
      }
    ],
    faqs: [
      {
        q: 'Görünmez harfler veya karakter hileleri dedektörleri aldatır mı?',
        a: 'Hayır. Modern denetleme motorları Unicode normalizasyonu yaparak sıfır genişlikli boşlukları anında temizler ve hileli metin olarak raporlar.'
      },
      {
        q: 'Perplexity değeri ne kadar yüksek olmalıdır?',
        a: 'Akademik metinlerde insan yazarlar doğal olarak orta-yüksek karmaşıklık ve yüksek ritim çeşitliliği (burstiness) sergiler. Sentience bu dengeyi bilimsel corpus standartlarında korur.'
      }
    ]
  },
  {
    id: 5,
    slug: 'akademik-veri-gizliligi-ve-kvkk',
    title: 'Akademik Veri Gizliliği: Makaleleriniz Dış YZ Modellerini Eğitmek İçin Kullanılıyor mu?',
    category: 'Veri Güvenliği & KVKK',
    readTime: '5 dk okuma',
    date: 'Ağustos 2026',
    image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1200&auto=format&fit=crop',
    summary: 'Ücretsiz çevrim içi dedektör ve insanlaştırıcı sitelerine yapıştırılan henüz yayımlanmamış tez ve projelerin sızdırılma riski ve Sentience Sıfır-Veri güvencesi.',
    leadParagraph: 'Henüz savunması yapılmamış bir yüksek lisans tezi ya da patent aşamasındaki bir araştırma makalesi, araştırmacının en kıymetli fikri mülkiyetidir. Ancak internetteki pek çok ücretsiz çevrim içi araç, arka planda kullanıcı metinlerini depolamakta ve dış dil modellerini eğitmek için kullanmaktadır.',
    toc: [
      { id: 'ucretsiz-araclarin-riskleri', title: '1. Ücretsiz Çevrim İçi Araçların Gizli Tehlikeleri' },
      { id: 'fikri-mulkiyet-ihllalleri', title: '2. Fikri Mülkiyet ve Erken İntihal Riski' },
      { id: 'kvkk-ve-gdpr-akademik-boyut', title: '3. KVKK ve GDPR Standartlarında Akademik Veri' },
      { id: 'sentience-sifir-veri-protokolu', title: '4. Sentience Sıfır-Veri ve Admin Read-Only Güvencesi' }
    ],
    sections: [
      {
        id: 'ucretsiz-araclarin-riskleri',
        title: 'Ücretsiz Çevrim İçi Araçların Gizli Tehlikeleri',
        paragraphs: [
          'İnternetteki popüler ücretsiz AI humanizer ve dedektör sitelerinin kullanıcı sözleşmeleri incelendiğinde, sisteme girilen her metnin sunucularda süresiz olarak depolanabileceği ve model eğitiminde veri seti olarak kullanılabileceği görülür.',
          'Henüz yayımlanmamış veya savunulmamış bir tez metninin bu sunucularda saklanması, ilerleyen tarihlerde arama motorlarında veya genel veritabanlarında indekslenmesine sebep olabilir.'
        ]
      },
      {
        id: 'fikri-mulkiyet-ihllalleri',
        title: 'Fikri Mülkiyet ve Erken İntihal Riski',
        paragraphs: [
          'Bir araştırmacının aylar süren laboratuvar çalışması veya özgün tezi dışarı sızdığında, tezin savunma gününden önce Turnitin global veri havuzuna girmesi ve resmi taramada %100 intihal olarak raporlanması gibi telafisi zor krizler yaşanabilmektedir.'
        ],
        callout: {
          title: 'Tezinizi Sıfır-Veri Protokolüyle Koruyun',
          desc: 'Sentience platformunda metinleriniz asla veri tabanında saklanmaz, model eğitiminde kullanılmaz ve yöneticiler tarafından görüntülenemez.',
          ctaText: 'Güvenli Çalışma Alanı Aç'
        }
      },
      {
        id: 'kvkk-ve-gdpr-akademik-boyut',
        title: 'KVKK ve GDPR Standartlarında Akademik Veri Güvenliği',
        paragraphs: [
          'Akademik veriler, özellikle anket katılımcı bilgilerini veya hassas araştırma verilerini içeriyorsa KVKK ve GDPR kapsamında korunmalıdır. Sunucuları belirsiz üçüncü taraf siteler bu yasal güvenceleri sunamaz.'
        ]
      },
      {
        id: 'sentience-sifir-veri-protokolu',
        title: 'Sentience Sıfır-Veri ve Admin Read-Only Protokolü',
        paragraphs: [
          'Sentience mimarisi gereği Admin Read-Only protokolüyle donatılmıştır. Platform yöneticileri dahi kullanıcıların ham metinlerine erişemez. Analiz tamamlandığında geçici veriler bellekten anında imha edilir; hiçbir harici modele veri beslemesi yapılmaz.'
        ]
      }
    ],
    faqs: [
      {
        q: 'Sentience platformuna yüklediğim tez bölümleri dışarı sızabilir mi?',
        a: 'Kesinlikle hayır. Admin Read-Only ilkesi ve sıfır-veri-saklama protokolü uyarınca metinleriniz geçici analiz tamamlandığında anında bellekten silinir.'
      },
      {
        q: 'Turnitin deposuna (repository) kayıt edilir mi?',
        a: 'Hayır. Sentience ön denetimleri harici kalıcı veritabanlarına kayıt bırakmaz, böylece resmi savunma günü teziniz Turnitin de kendi kendine çakışmaz.'
      }
    ]
  },
  {
    id: 6,
    slug: 'akademide-ozgunluk-nedir-onemi-ve-korunma-yollari',
    title: 'Akademide Özgünlük Nedir? Önemi, Standartları ve Korunma Yolları',
    category: 'Akademik Etik & Özgünlük',
    readTime: '7 dk okuma',
    date: 'Ekim 2026',
    image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=1200&auto=format&fit=crop',
    summary: 'Bilimsel üretimde özgünlük kavramı, etik ilkeler, fikri mülkiyet sınırları ve YÖK standartlarında kabul edilebilir benzerlik kriterleri. Sentience Sentinel ile özgünlüğün güvence altına alınması.',
    leadParagraph: 'Akademik dünyada özgünlük, yalnızca daha önce söylenmemiş olanı ifade etmek değil; mevcut bilgi birikimini doğru yöntemlerle analiz edip literatüre yeni ve doğrulanabilir bir perspektif kazandırmaktır. Üniversitelerin etik kurulları, YÖK ve uluslararası indeksler (SCI, SSCI, AHCI) tarafından belirlenen standartlar, araştırmacının her aşamada fikri dürüstlük sergilemesini şart koşar.',
    toc: [
      { id: 'ozgunlugun-tanimi', title: '1. Akademik Özgünlüğün Temel Tanımı' },
      { id: 'ozgunlugun-bilimsel-degeri', title: '2. Bilimsel Üretimde Özgünlüğün Değeri' },
      { id: 'etik-kurullar-ve-yok', title: '3. Etik Kurullar ve YÖK Kriterleri' },
      { id: 'ozgunlugu-koruma-yollari', title: '4. Özgünlüğü Koruma ve Tehditlerden Kaçınma' },
      { id: 'sentience-sentinel-kalkani', title: '5. Sentience Sentinel: Gerçek Zamanlı Özgünlük Kalkanı' }
    ],
    sections: [
      {
        id: 'ozgunlugun-tanimi',
        title: 'Akademik Özgünlüğün Temel Tanımı',
        paragraphs: [
          'Özgünlük; bir araştırmanın konusu, yöntemi, bulguları veya kuramsal çerçevesi itibarıyla literatürdeki mevcut çalışmalardan ayrışabilme kapasitesidir. Bir çalışmanın tamamen sıfırdan türetilmesi beklenmez; ancak kullanılan kaynakların eleştirel bir süzgeçten geçirilerek araştırmacının kendi özgün senteziyle harmanlanması zorunludur.',
          'Sentience mimarisinde yer alan analiz motorları, metnin yalnızca sözcük benzerliğini değil; kavramsal akışını ve argüman örgüsünü de çok boyutlu olarak ölçümler.'
        ]
      },
      {
        id: 'ozgunlugun-bilimsel-degeri',
        title: 'Bilimsel Üretimde Özgünlüğün Değeri',
        paragraphs: [
          'Tekrara dayalı ve derinliği olmayan çalışmalar bilimsel ilerlemeye katkı sunmaz. Özgün çalışmalar ise atıf alma potansiyeli yüksek, alanında öncü kabul edilen ve ulusal/uluslararası fonlar (TÜBİTAK, Horizon Europe) tarafından desteklenen çıktılara dönüşür.',
          'Yayın etiği ihlali tespit edilen çalışmaların geri çekilmesi (retraction), araştırmacının akademik kariyerinde onarılamaz güven kaybına yol açmaktadır.'
        ]
      },
      {
        id: 'etik-kurullar-ve-yok',
        title: 'Etik Kurullar ve YÖK Kriterleri',
        paragraphs: [
          'YÖK Bilimsel Araştırma ve Yayın Etiği Yönergesi, bir eserin tamamının veya bir kısmının kaynak gösterilmeden kullanılmasını en ağır ihlallerden biri olarak tanımlar.',
          'Enstitüler, tez savunma sınavları öncesinde %15 ila %20 bandında benzerlik üst sınırı ve tek kaynaktan maksimum %2-%3 benzerlik kuralı uygular.'
        ]
      },
      {
        id: 'ozgunlugu-koruma-yollari',
        title: 'Özgünlüğü Koruma ve Tehditlerden Kaçınma',
        paragraphs: [
          'Özgünlüğü korumanın ilk kuralı, literatür taraması esnasında alınan notların kaynağını anında kaydetmek ve doğrudan alıntılarda mutlaka tırnak işareti kullanmaktır.',
          'Ayrıca çoklu kaynak sentezi yaparak, tek bir makalenin argüman yapısına hapsolmaktan kaçınılmalıdır.'
        ]
      },
      {
        id: 'sentience-sentinel-kalkani',
        title: 'Sentience Sentinel: Gerçek Zamanlı Özgünlük Kalkanı',
        paragraphs: [
          'Sentience bünyesindeki Sentinel motoru, metninizin her bir paragrafını Crossref, OpenAlex ve Semantic Scholar gibi devasa akademik veri tabanlarıyla çapraz sorgular.',
          'Böylece teziniz veya makaleniz resmi enstitü kontrolüne girmeden önce tüm riskler tespit edilerek güvenli bir teslimat sağlanır.'
        ]
      }
    ],
    faqs: [
      {
        q: 'Akademik özgünlük yalnızca yeni bir konu bulmak mıdır?',
        a: 'Hayır. Bilinen bir konuyu yeni bir metodolojiyle, yeni bir veri setiyle veya farklı bir bakış açısıyla ele almak da yüksek düzeyde özgünlük taşır.'
      },
      {
        q: 'YÖK tezlerinde özgünlük raporu zorunlu mudur?',
        a: 'Evet. Türkiye deki tüm lisansüstü enstitüler, tez savunması öncesinde enstitü onaylı benzerlik ve özgünlük raporunun sunulmasını yasal olarak zorunlu kılar.'
      }
    ]
  },
  {
    id: 7,
    slug: 'akademik-intihal-nedir-turleri-ve-onleme-stratejileri',
    title: 'Akademik İntihal Nedir? Türleri, Hukuki Yaptırımları ve Önleme Stratejileri',
    category: 'İntihal & Hukuki Boyut',
    readTime: '9 dk okuma',
    date: 'Ekim 2026',
    image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=1200&auto=format&fit=crop',
    summary: 'Doğrudan kopyalama, mozaik intihal, parafraze hilesi, kaynak gizleme ve oto-intihal. Hukuki sonuçlar ve Sentience çok katmanlı denetim motoruyla riskleri sıfırlama adımları.',
    leadParagraph: 'Akademik intihal (plagiarism); başkasına ait fikirleri, yöntemleri, verileri veya ifadeleri kaynak göstermeksizin tamamen ya da kısmen kendine aitmiş gibi sunmaktır. Türkiye de 2547 sayılı Yükseköğretim Kanunu ve Türk Ceza Kanunu kapsamında disiplin ve tazminat yaptırımlarına tabi olan intihal, akademik dürüstlüğün en büyük ihlalidir.',
    toc: [
      { id: 'intihalin-tanimi-ve-kapsami', title: '1. İntihalin Tanımı ve Hukuki Kapsamı' },
      { id: 'intihal-turleri', title: '2. En Yaygın 5 İntihal Türü' },
      { id: 'parafraze-ve-mozaik-tuzagi', title: '3. Parafraze ve Mozaik İntihal Tuzağı' },
      { id: 'hukuki-ve-akademik-yaptirimlar', title: '4. YÖK ve Adli Yargı Yaptırımları' },
      { id: 'sentience-ile-onleme', title: '5. Sentience ile İntihalsiz Akademik Çıktı' }
    ],
    sections: [
      {
        id: 'intihalin-tanimi-ve-kapsami',
        title: 'İntihalin Tanımı ve Hukuki Kapsamı',
        paragraphs: [
          'İntihal yalnızca birebir metin kopyalamaktan ibaret değildir. Fikrin sahibini belirtmeden kullanmak, grafik veya tabloları referans göstermeden aktarmak veya araştırma kurgusunu aynen benimsemek de intihal kapsamına girer.',
          'Hukuken Fikir ve Sanat Eserleri Kanunu (FSEK) uyarınca manevi hakların ihlali sayılmakta ve hem cezai hem de hukuki sorumluluk doğurmaktadır.'
        ]
      },
      {
        id: 'intihal-turleri',
        title: 'En Yaygın 5 İntihal Türü',
        paragraphs: [
          '1. Doğrudan (Birebir) İntihal: Kaynak belirtmeden metni harfi harfine kopyalamak.',
          '2. Mozaik (Yamaç) İntihal: Farklı kaynaklardan alınan cümle parçalarını birleştirip yeni bir metinmiş gibi sunmak.',
          '3. Parafraze İntihali: Orijinal cümlenin yalnızca birkaç kelimesini eş anlamlılarıyla değiştirip atıf yapmamak.',
          '4. Kaynak Gizleme / Yanıltıcı Atıf: Ulaşılmayan birincil kaynağı ikincil kaynaktan alıp doğrudan okumuş gibi referans vermek.',
          '5. Kendi Kendinden İntihal (Oto-intihal): Önceki yayınlanan kendi makalesini atıf yapmadan yeni tez veya bildiriye aktarmak.'
        ]
      },
      {
        id: 'parafraze-ve-mozaik-tuzagi',
        title: 'Parafraze ve Mozaik İntihal Tuzağı',
        paragraphs: [
          'Pek çok öğrenci ve araştırmacı, kelimeleri değiştirmenin intihali ortadan kaldırdığı yanılgısına düşmektedir. Oysa modern denetim sistemleri kelime bazlı değil anlamsal vektör bazlı çalıştığından bu yapılar anında tespit edilir.',
          'Sentience Akademik Etik Protokolü gereğince, kelime takası yerine kavramsal analiz ve çoklu kaynak sentezi zorunlu kılınmıştır.'
        ]
      },
      {
        id: 'hukuki-ve-akademik-yaptirimlar',
        title: 'YÖK ve Adli Yargı Yaptırımları',
        paragraphs: [
          'YÖK Disiplin Yönetmeliği ne göre intihal suçu, kamu görevinden veya öğretim mesleğinden çıkarma ve unvanların geri alınması sonucunu doğurabilir.',
          'Lisansüstü tezlerde intihal saptanması halinde verilen diploma ve dereceler iptal edilir.'
        ]
      },
      {
        id: 'sentience-ile-onleme',
        title: 'Sentience ile İntihalsiz Akademik Çıktı',
        paragraphs: [
          'Sentience Sentinel ve Denetçi modülleri; metninizi milyarlarca akademik belgeyle karşılaştırır, eşleşen kaynakları doğrudan DOI bağlantılarıyla sunar ve benzerlik oranını güvenli eşiklerin altına çekmenize rehberlik eder.'
        ]
      }
    ],
    faqs: [
      {
        q: 'Kendi yayınlanmış bildirimden tezime bölüm aktarırsam intihal olur mu?',
        a: 'Evet, uygun şekilde atıf verilmezse oto-intihal (self-plagiarism) sayılır. Kendi yayınınız dahi olsa kaynakça ve metin içi atıfta belirtilmelidir.'
      },
      {
        q: 'Tırnak içinde verilen doğrudan alıntılar intihal sayılır mı?',
        a: 'Hayır. Kaynak tam belirtilip sayfa numarası ve tırnak işareti ("...") kullanıldığı sürece meşru alıntıdır.'
      }
    ]
  },
  {
    id: 8,
    slug: 'kaynak-gosterme-ve-atif-yontemleri',
    title: 'Akademik Yazımda Kaynak Gösterme ve Atıf Yöntemleri: APA, MLA, IEEE ve DOI Doğrulaması',
    category: 'Kaynak Gösterme & Metodoloji',
    readTime: '8 dk okuma',
    date: 'Ekim 2026',
    image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=1200&auto=format&fit=crop',
    summary: 'APA 7, MLA 9, IEEE ve Chicago stillerinde metin içi atıf kuralları, kaynakça listesi düzenleme ve yapay zeka tarafından uydurulan (hallucinated) sahte atıfları Crossref ile doğrulama rehberi.',
    leadParagraph: 'Bilimsel yazının temel taşı, her bir argümanın meşru ve doğrulanabilir bir kaynağa dayandırılmasıdır. Atıf standartları araştırmacının bilgiye nasıl ulaştığını şeffaf kılar. Ancak son dönemde yapay zeka araçlarının uydurduğu sahte DOI ve makale isimleri, akademik dünyada ciddi bir güven krizi yaratmıştır.',
    toc: [
      { id: 'atif-yapmanin-amaci', title: '1. Neden Atıf Yaparız?' },
      { id: 'temel-atif-stilleri', title: '2. Temel Atıf Formatları (APA, MLA, IEEE)' },
      { id: 'metin-ici-ve-kaynakca', title: '3. Metin İçi Atıf ve Kaynakça Düzeni' },
      { id: 'sahte-kaynak-tehlikesi', title: '4. Yapay Zeka Uydurması Sahte Kaynaklar (Hallucination)' },
      { id: 'sentience-doi-dogrulama', title: '5. Sentience Canlı DOI ve Crossref Doğrulama Havuzu' }
    ],
    sections: [
      {
        id: 'atif-yapmanin-amaci',
        title: 'Neden Atıf Yaparız?',
        paragraphs: [
          'Atıf yapmak yalnızca telif hakkına saygı göstermek değil; çalışmanın bilimsel güvenilirliğini ispatlamak, literatürdeki tartışmaya konumlanmak ve okuyucunun ilgili kaynağa doğrudan erişmesini sağlamaktır.',
          'Eksik veya hatalı atıflar, hakem değerlendirme süreçlerinde makalenin doğrudan reddedilmesine sebep olur.'
        ]
      },
      {
        id: 'temel-atif-stilleri',
        title: 'Temel Atıf Formatları (APA, MLA, IEEE)',
        paragraphs: [
          'APA 7 (Yazar-Yıl): Sosyal bilimler, eğitim ve psikolojide yaygın. Örnek: (Yılmaz & Kaya, 2024, s. 45).',
          'MLA 9 (Yazar-Sayfa): Edebiyat, dilbilim ve beşeri bilimlerde tercih edilir. Örnek: (Demir 112).',
          'IEEE (Numaralı): Mühendislik ve bilgisayar bilimlerinde köşeli parantezle kullanılır. Örnek: [1], [2-4].'
        ]
      },
      {
        id: 'metin-ici-ve-kaynakca',
        title: 'Metin İçi Atıf ve Kaynakça Düzeni',
        paragraphs: [
          'Metin içinde atıfta bulunulan her eserin kaynakçada eksiksiz karşılığı bulunmalı; kaynakçada yer alan her esere de metin içinde en az bir kez başvurulmalıdır.',
          'Kaynakçanın alfabetik veya numaralandırma sırasına göre hatasız dizilmesi dergi yazım kurallarının ilk şartıdır.'
        ]
      },
      {
        id: 'sahte-kaynak-tehlikesi',
        title: 'Yapay Zeka Uydurması Sahte Kaynaklar (Hallucination)',
        paragraphs: [
          'Genel amaçlı yapay zeka modelleri, sorulan sorulara inandırıcı görünmek adına var olmayan yazarlar, sahte dergi adları ve uydurma DOI numaraları üretebilir.',
          'Bu sahte kaynakları tezine veya makalesine ekleyen araştırmacılar, doğrudan etik ihlal suçlamasıyla karşılaşmaktadır.'
        ]
      },
      {
        id: 'sentience-doi-dogrulama',
        title: 'Sentience Canlı DOI ve Crossref Doğrulama Havuzu',
        paragraphs: [
          'Sentience Sentinel altyapısı, metninizdeki tüm kaynakları Crossref ve OpenAlex API leri üzerinden anlık sorgular. Geçersiz, uydurma veya kırık linkli kaynakları kırmızı alarmla bildirir ve kesinlikle sıfır-halüsinasyon güvencesi sunar.'
        ]
      }
    ],
    faqs: [
      {
        q: 'İnternet sitelerinden alınan bilgiler nasıl kaynak gösterilir?',
        a: 'Yazar adı, yayın tarihi, sayfa başlığı, web sitesi adı ve erişim URL si (veya erişim tarihi) eksiksiz belirtilmelidir.'
      },
      {
        q: 'DOI numarası olmayan makaleler nasıl atıflanır?',
        a: 'Makalenin yayınlandığı kalıcı resmi URL bağlantısı veya dergi cilt/sayı/sayfa bilgileri verilerek atıflanabilir.'
      }
    ]
  },
  {
    id: 9,
    slug: 'yapay-zeka-ve-akademik-ozgunluk-firsatlar-ve-tehditler',
    title: 'Yapay Zeka ve Akademik Özgünlük: Fırsatlar, Riskler ve İnsanlaştırma Etiği',
    category: 'Yapay Zeka & Gelecek',
    readTime: '8 dk okuma',
    date: 'Ekim 2026',
    image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1200&auto=format&fit=crop',
    summary: 'Üretken yapay zekanın akademik yazıma etkileri, tespit algoritmalarının arkasındaki matematik (Perplexity, Burstiness) ve etik insanlaştırma prensipleri.',
    leadParagraph: 'ChatGPT, Gemini, Claude ve DeepSeek gibi büyük dil modelleri; literatür taraması, taslak oluşturma ve dil düzeltme süreçlerinde devrim yaratmıştır. Ancak bu araçların kontrolsüzce araştırmacı yerine metin üretmesi, akademik dünyada özgünlük ve etik tartışmalarını zirveye taşımıştır.',
    toc: [
      { id: 'akademide-yz-devrimi', title: '1. Akademik Dünyada Yapay Zeka Devrimi' },
      { id: 'tespit-mekanizmalari-ve-matematik', title: '2. Tespit Mekanizmaları: Perplexity ve Burstiness' },
      { id: 'yapay-zeka-metinlerinin-zaaflari', title: '3. Yapay Zeka Çıktılarının Karakteristik Zaafları' },
      { id: 'etik-insanlastirma-nedir', title: '4. Etik İnsanlaştırma (Humanization) Nedir?' },
      { id: 'sentience-cozum-ekosistemi', title: '5. Sentience Çözüm Ekosistemi ile Güvenli Yazım' }
    ],
    sections: [
      {
        id: 'akademide-yz-devrimi',
        title: 'Akademik Dünyada Yapay Zeka Devrimi',
        paragraphs: [
          'Yapay zeka araçları bir asistan olarak veri analizinde ve dil düzeltmede muazzam verimlilik sağlar. Ancak araştırmacının kendi bilişsel emeğinin yerini aldığında akademik bütünlük sarsılır.',
          'YÖK ve COPE (Yayın Etiği Komitesi), yapay zekanın bir yazar olarak listelenemeyeceğini ve kullanılan araçların şeffafça beyan edilmesi gerektiğini ilan etmiştir.'
        ]
      },
      {
        id: 'tespit-mekanizmalari-ve-matematik',
        title: 'Tespit Mekanizmaları: Perplexity ve Burstiness',
        paragraphs: [
          'Yapay zeka tespit algoritmaları, metindeki kelime tahmin edilebilirliğini (Perplexity) ve cümle uzunluklarının varyasyonunu (Burstiness) inceler.',
          'Büyük dil modelleri istatistiksel olarak en olası kelimeleri seçtiğinden, metinleri şaşırtıcı derecede tekdüze ve tahmin edilebilir bir ritim sergiler.'
        ]
      },
      {
        id: 'yapay-zeka-metinlerinin-zaaflari',
        title: 'Yapay Zeka Çıktılarının Karakteristik Zaafları',
        paragraphs: [
          'YZ metinleri sık sık "Özetle", "Bununla birlikte", "Önemli bir rol oynamaktadır" gibi klişe geçiş kalıplarını aşırı kullanır.',
          'Ayrıca alanın jargonunu doğru kullansa dahi, spesifik vakalarda derinlikten yoksun yüzeysel genellemeler üretir.'
        ]
      },
      {
        id: 'etik-insanlastirma-nedir',
        title: 'Etik İnsanlaştırma (Humanization) Nedir?',
        paragraphs: [
          'Etik insanlaştırma; görünmez hileli harfler veya anlamsız eş anlamlı takası yapmak değildir. Metnin ritmini çeşitlendirmek, akademik üslubu zenginleştirmek ve araştırmacının kendi eleştirel sesini metne geri kazandırmaktır.',
          'Sentience İnsanlaştırma motoru, sıfır-hile politikasıyla metnin sentaksını doğal bilimsel literatür standartlarına taşır.'
        ]
      },
      {
        id: 'sentience-cozum-ekosistemi',
        title: 'Sentience Çözüm Ekosistemi ile Güvenli Yazım',
        paragraphs: [
          'Sentience Denetçi modülü ile olası yapay zeka kalıplarını belirleyebilir, İnsanlaştırma ile cümle ritminizi doğallaştırabilir ve Sentinel ile kaynaklarınızı canlı doğrulayabilirsiniz.'
        ]
      }
    ],
    faqs: [
      {
        q: 'Yapay zekadan yardım almak tamamen yasak mıdır?',
        a: 'Hayır. Dil kontrolü ve yazım denetimi kabul edilir; ancak metnin yazar yerine yapay zekaya yazdırılması ve bunun gizlenmesi etik ihlaldir.'
      },
      {
        q: 'Dedektörler Türkçe metinlerde başarılı mıdır?',
        a: 'Evet, özellikle morfolojik analiz ve n-gram örüntüleri kullanan Sentience Denetçi motoru Türkçe de %99 üzerinde doğruluk sağlar.'
      }
    ]
  },
  {
    id: 10,
    slug: 'ozgun-akademik-yazi-yazmanin-temel-adimlari',
    title: 'Özgün Bir Akademik Metin Yazmanın 5 Temel Adımı: Literatür Taramasından Enstitü Onayına',
    category: 'Akademik Rehber & Yazım',
    readTime: '10 dk okuma',
    date: 'Ekim 2026',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop',
    summary: 'Hipotez belirleme, kapsamlı kaynak derleme, StyleMaster ile akademik ton yönetimi, derin sentez ve Enstitü Onay Havuzunda kusursuz tez teslimatı.',
    leadParagraph: 'Başarılı bir akademik metin hazırlamak tesadüflere bırakılamaz. Konunun sınırlandırılmasından literatür sentezine, doğru atıf tekniğinden benzerlik denetimine kadar her adım disiplinli bir metodoloji gerektirir. Bu kılavuz, lisansüstü öğrencilerin ve araştırmacıların tez veya makalelerini ilk denemede enstitüden geçirmelerini sağlayacak yol haritasını sunmaktadır.',
    toc: [
      { id: 'adim-1-arastirma-sorusu', title: '1. Adım: Odaklı Araştırma Sorusu ve Hipotez' },
      { id: 'adim-2-sistematik-tarama', title: '2. Adım: Sistematik Literatür Taraması' },
      { id: 'adim-3-derin-sentez', title: '3. Adım: Derin Sentez ve Eleştirel Okuma' },
      { id: 'adim-4-akademik-ton-ve-stylemaster', title: '4. Adım: StyleMaster ile Akademik Ton Yönetimi' },
      { id: 'adim-5-on-denetim-ve-enstitu-havuzu', title: '5. Adım: Ön Denetim ve Enstitü Onay Havuzu' }
    ],
    sections: [
      {
        id: 'adim-1-arastirma-sorusu',
        title: '1. Adım: Odaklı Araştırma Sorusu ve Hipotez',
        paragraphs: [
          'Çok geniş veya belirsiz konular araştırmacıyı boğar ve intihal riskini artırır. Araştırma sorusu spesifik, ölçülebilir ve literatürdeki somut bir boşluğu doldurmaya odaklı olmalıdır.',
          'Net bir hipotez, hangi verileri toplayacağınızı ve hangi kaynakları inceleyeceğinizi sınırlandırarak odağı korur.'
        ]
      },
      {
        id: 'adim-2-sistematik-tarama',
        title: '2. Adım: Sistematik Literatür Taraması',
        paragraphs: [
          'Web of Science, Scopus, DergiPark ve PubMed gibi saygın dizinler taranmalı; son 5 yılda yayımlanan güncel çalışmalar önceliklendirilmelidir.',
          'Bulunan kaynaklar bir referans yönetim aracına (Zotero, Mendeley) aktarılmalı ve notlar daima kaynak künyesiyle eşleştirilmelidir.'
        ]
      },
      {
        id: 'adim-3-derin-sentez',
        title: '3. Adım: Derin Sentez ve Eleştirel Okuma',
        paragraphs: [
          'Makaleleri peş peşe özetlemek bir literatür bölümü oluşturmaz. Farklı yazarların benzer veya çelişen bulguları karşılaştırmalı, ortak eğilimler araştırmacının kendi kelimeleriyle sentezlenmelidir.',
          'Her paragrafta en az iki-üç farklı kaynağın sentezlenmesi özgünlüğü doğrudan artıran temel bir tekniktir.'
        ]
      },
      {
        id: 'adim-4-akademik-ton-ve-stylemaster',
        title: '4. Adım: StyleMaster ile Akademik Ton Yönetimi',
        paragraphs: [
          'Akademik metinler nesnel, kanıta dayalı ve ölçülü bir üslup gerektirir. Öznel sıfatlardan ve aşırı kesin iddialardan kaçınılmalıdır.',
          'Sentience StyleMaster özelliği, metninizin hedef dergiye veya enstitü kılavuzuna uygun bilimsel tonda kalmasını sağlar.'
        ]
      },
      {
        id: 'adim-5-on-denetim-ve-enstitu-havuzu',
        title: '5. Adım: Ön Denetim ve Enstitü Onay Havuzu',
        paragraphs: [
          'Çalışmanızı resmi danışmanınıza teslim etmeden önce Sentience platformunda Denetçi, İnsanlaştırma ve Sentinel üçlü kontrolünden geçirin.',
          'Enstitü Onay Havuzu özelliği sayesinde çalışma kurumsal sınıfa gönderilir ve üniversite onay süreci tek tıkla tamamlanır.'
        ]
      }
    ],
    faqs: [
      {
        q: 'Bir tez veya makalede literatür taraması ne kadar sürmelidir?',
        a: 'Araştırma süresinin en az üçte biri derinlemesine literatür okumasına ve sentezine ayrılmalıdır.'
      },
      {
        q: 'Enstitü Onay Havuzunda onaylanan tezin Turnitin raporu nasıl alınır?',
        a: 'Sentience üzerinden üretilen resmi karekodlu ve dijital imzalı rapor, enstitü teslim formuna eklenerek doğrudan jüriye sunulabilir.'
      }
    ]
  }
];
