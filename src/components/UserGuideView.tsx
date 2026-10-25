import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Search,
  UserPlus,
  UploadCloud,
  FileCheck2,
  ShieldAlert,
  Sparkles,
  SearchCheck,
  Palette,
  GraduationCap,
  Building2,
  Download,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ArrowLeft,
  FileText,
  Printer,
  Compass,
  Layers,
  HelpCircle,
  SlidersHorizontal,
  QrCode,
  Network,
  Scale,
  Users
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Footer } from './Footer';
import {
  downloadIntegrityPledgeDocx,
  downloadThesisSimilarityCoverPdf,
  downloadCitationGuidePdf,
  downloadPlatformBrochurePdf,
  downloadAiAppealPetitionDocx
} from '../services/academicTemplateService';

interface DownloadableTemplate {
  id: string;
  title: string;
  format: 'docx' | 'pdf';
  badge: string;
  description: string;
  action: () => Promise<void> | void;
}

const ACADEMIC_TEMPLATES: DownloadableTemplate[] = [
  {
    id: 'integrity-pledge',
    title: 'Akademik Dürüstlük ve Özgünlük Taahhütnamesi',
    format: 'docx',
    badge: 'YÖK / Enstitü Standart',
    description: 'Lisansüstü tez ve makale teslimlerinde enstitü onayına sunulacak, etik ilkeleri ve YZ kullanım sınırlarını içeren resmi taahhüt metni.',
    action: downloadIntegrityPledgeDocx
  },
  {
    id: 'thesis-cover',
    title: 'YÖK Uyumlu Tez Benzerlik Raporu Kapak Sayfası',
    format: 'pdf',
    badge: 'Örnek Model Şablon',
    description: 'Turnitin ve Sentience benzerlik oranları, filtreleme kriterleri, Sentinel güven skoru ve jüri/danışman imza heyeti standart onay sayfası.',
    action: downloadThesisSimilarityCoverPdf
  },
  {
    id: 'citation-guide',
    title: 'APA 7 & IEEE Hızlı Kaynak Gösterme Kılavuzu',
    format: 'pdf',
    badge: 'Akademik Rehber',
    description: 'Sosyal, sağlık ve mühendislik bilimlerinde metin içi atıf kuralları, kaynakça standartları ve üretken YZ bildirim rehberi.',
    action: downloadCitationGuidePdf
  },
  {
    id: 'platform-brochure',
    title: 'Sentience Kurumsal Platform Tanıtım Broşürü',
    format: 'pdf',
    badge: 'Kurumsal Doküman',
    description: 'Sentinel benzerlik motoru, Turnitin bütünlük bayrakları (homoglifler), sınıf yönetimi ve KVKK uyumlu veri güvenliği teknik mimarisi.',
    action: downloadPlatformBrochurePdf
  },
  {
    id: 'ai-appeal-petition',
    title: 'Yapay Zeka Tespit İtiraz ve İnceleme Başvuru Dilekçesi',
    format: 'docx',
    badge: 'Resmi Başvuru Dilekçesi',
    description: 'Hatalı YZ tespiti (yanlış pozitif) durumlarında fakülte veya enstitüye sunulmak üzere hazırlanmış, versiyon geçmişi ve kanıt odaklı itiraz dilekçesi.',
    action: downloadAiAppealPetitionDocx
  }
];

interface UserGuideViewProps {
  onBack: () => void;
  onNavigateAuth?: () => void;
}

export interface GuideSectionItem {
  id: string;
  category: string;
  role?: string;
  title: string;
  badge: string;
  description: string;
  steps: string[];
  tips?: string[];
  warning?: string;
  actionText?: string;
}

export const GUIDE_SECTIONS: GuideSectionItem[] = [
  {
    id: 'kayit-ve-giris',
    category: 'Başlarken',
    role: 'Tümü',
    title: 'Kayıt Olma, Kurumsal (.edu.tr) Giriş ve Rol Yetkilendirme',
    badge: '1. Adım',
    description: 'Sentience AI platformuna bireysel veya üniversite kurumsal e-posta adresinizle erişim sağlayın; Öğrenci, Eğitmen veya Enstitü rolünüzü aktive edin.',
    steps: [
      'Ana sayfanın sağ üst köşesindeki "Giriş Yap / Kayıt Ol" butonuna tıklayın.',
      'Google hesabınızla tek tıkla bağlanabilir veya kurumsal (.edu.tr) e-posta bilginizle kayıt olabilirsiniz.',
      'Profil panelinizden kullanıcı rolünüzü (Öğrenci / Lisansüstü Araştırmacı / Öğretim Üyesi) seçin.',
      'Öğretim görevlisi veya danışman iseniz kurumsal e-postanızla otomatik "Eğitmen" sınıf açma yetkilendirmesi tanımlanır.',
      'Kurumsal lisanslı üniversite mensupları için sınırsız analiz kotası ve sınıf deposu otomatik aktive olur.'
    ],
    tips: [
      'Üniversiteniz kurumsal lisans anlaşması yapmışsa, kurumsal e-postanız ile sınırsız kota ve sınıf deposu otomatik tanımlanır.'
    ]
  },
  {
    id: 'dokuman-yukleme',
    category: 'Doküman Standartları',
    role: 'Tümü',
    title: 'Metin ve Dosya Yükleme Standartları (Format & Limitler)',
    badge: '2. Adım',
    description: 'Analiz edilecek tez, makale veya ödev dosyalarının format gereksinimleri, sayfa limitleri ve taranabilir metin standartları.',
    steps: [
      'Giriş yaptıktan sonra "Editör" sekmesine geçin veya Landing Page deki "Ücretsiz Deneme" alanını kullanın.',
      'Desteklenen dosya formatları: .docx (Microsoft Word), .pdf (Taranabilir dijital metin) ve .txt (Düz metin).',
      'Metninizin en az 50 kelime, maksimum ise paket kotanız veya kurumsal sınır kadar (örn. 150.000 kelimeye kadar tezler) olduğundan emin olun.',
      'Taranmış Görsel (OCR) Uyarısı: Sayfaları resim olarak taranmış PDF ler taranamayacağından doğrudan Word veya dijital PDF yüklenmelidir.',
      'Gizlilik ve Sıfır-Veri: Yüklediğiniz akademik metinler hiçbir genel yapay zeka modelinin eğitim havuzuna aktarılmaz.'
    ],
    tips: [
      'PDF dosyalarınızın taranmış görsel (OCR gerektiren resim) değil, seçilebilir gerçek dijital metin olmasına dikkat edin.'
    ],
    warning: 'Şifreli, parola korumalı veya salt-okunur kilitli PDF dosyaları güvenlik protokolü gereği otomatik olarak reddedilir.'
  },
  {
    id: 'denetci-modulu',
    category: 'Modüller',
    role: 'Öğrenci & Eğitmen',
    title: 'Denetçi: Çok Katmanlı Yapay Zeka Risk & Entropi Analizi',
    badge: 'Denetçi Modülü',
    description: 'Metninizin büyük dil modelleri (ChatGPT, Gemini, Claude, DeepSeek) tarafından üretilme olasılığını, cümle ısı haritasını ve Türkçe okunabilirlik skorlarını inceleyin.',
    steps: [
      'Editörün üst menüsünden "Denetçi" modülünü aktif hale getirin ve "Analizi Başlat" butonuna tıklayın.',
      'Genel Yapay Zeka Riski (%) yüzdesini ve güven aralığı skorunu gözlemleyin.',
      'Isı Haritası (Heatmap) sekmesinden cümle bazlı risk dağılımını (Kırmızı: Yüksek YZ, Sarı: Karışık, Yeşil: Özgün İnsan) inceleyin.',
      'Perplexity (Öngörülemezlik) ve Burstiness (Cümle uzunluk ritmi) metrikleri üzerinden yapay zekanın tekdüze kalıplarını saptayın.',
      'Okunabilirlik panelinden 4 temel Türkçe formülü (Ateşman, Çetinkaya-Uzun, Bezirci-Yılmaz YOD ve LIX) takip edin.'
    ],
    tips: [
      'Bezirci-Yılmaz formülünde 14 üzeri çıkan değerler, metninizde 5-6 heceli ağır kelimelerin yoğun olduğunu gösterir; cümlelerinizi sadeleştirebilirsiniz.'
    ]
  },
  {
    id: 'insanlastirma-modulu',
    category: 'Modüller',
    role: 'Öğrenci & Araştırmacı',
    title: 'İnsanlaştırma: Doğal Sentaks ve Ritim İyileştirme Motoru',
    badge: 'İnsanlaştırma Modülü',
    description: 'Yapay zeka kokan tekdüze cümle yapılarını hilesiz ve akademik kurallara uygun biçimde doğal insan ritmine kavuşturun.',
    steps: [
      'Modül seçiciden "İnsanlaştırma" modülünü seçin ve hedef tonu (Akademik, Kurumsal, Sade vb.) belirleyin.',
      '"İnsanlaştır" butonuna tıklayarak cümlenin ritmini (Burstiness) ve kelime öngörülemezliğini (Perplexity) zenginleştirin.',
      'Oluşan çıktıyı yan yana Diff ekranında orijinal metinle satır satır karşılaştırın.',
      'Sıfır-Hile güvencesi: Metne hiçbir görünmez karakter, homoglif veya yapay harf eklenmez; sadece gerçek Türkçe sentaksı geliştirilir.',
      'Dönüştürülen metni doğrudan DOCX veya PDF olarak dışa aktarın ya da tekrar Denetçi ile doğrulayın.'
    ],
    tips: [
      'Metni insanlaştırdıktan sonra tekrar Denetçi modülüyle tarayarak YZ olasılığının %0-5 seviyesine indiğini teyit edebilirsiniz.'
    ]
  },
  {
    id: 'sentinel-modulu',
    category: 'Modüller',
    role: 'Tümü',
    title: 'Sentinel: Canlı İntihal Denetimi ve Canlı DOI Doğrulama',
    badge: 'Sentinel Modülü',
    description: 'Metninizdeki kaynakları ve paragrafları küresel akademik veritabanlarıyla anlık karşılaştırın, sahte kaynakları engelleyin.',
    steps: [
      '"Sentinel" modülüne geçiş yapın; metniniz Crossref, OpenAlex, Semantic Scholar ve arXiv veri tabanlarıyla çapraz eşleştirmeye alınır.',
      'Genel İntihal Benzerlik Oranı (%) ve kaynak başına yüzde dağılımı listelenir.',
      'Doğrulanan her kaynağın resmi DOI numarası ve makale başlığı tıklanabilir link olarak verilir.',
      'Halüsinasyon Kalkanı: Metinde uydurma veya var olmayan bir kaynak tespit edilirse kırmızı uyarı bayrağı düşer.',
      'İntihal Raporunu YÖK ve enstitü formatına tam uyumlu biçimde karekodlu olarak indirin.'
    ],
    warning: 'YÖK ve enstitü standartlarına göre genel intihal oranı %15 in altında, tekil kaynak benzerliği ise %2-%3 bandında olmalıdır.'
  },
  {
    id: 'benzerlik-filtreleme-ve-ayarlar',
    category: 'Analiz & Raporlama',
    role: 'Öğrenci & Eğitmen',
    title: 'Benzerlik Raporu Filtreleme ve Dışlama Standartları',
    badge: 'Filtre Yönetimi',
    description: 'Kaynakça, doğrudan tırnak içi alıntılar ve küçük eşleşmelerin benzerlik hesabından doğru biçimde hariç tutulması rehberi.',
    steps: [
      'Kaynakça Hariç Tutma: "Kaynakça", "Referanslar" veya "Bibliography" başlığı altındaki standart atıf listesini rapordan hariç tutun.',
      'Alıntıları Dışlama: Tırnak işareti ("...") içinde verilmiş veya blok alıntı formatındaki teknik tanımları intihal oranından muaf tutun.',
      'Küçük Eşleşme Eşiği: 5-8 kelimeden az veya %1 in altındaki yaygın akademik kalıpların (örn. "bu çalışmanın amacı doğrultusunda") benzerlikten çıkarılmasını sağlayın.',
      'Mevzuat ve Kanun Maddeleri: Hukuki kanun metinleri ve tıbbi tanımlar gibi değiştirilemez teknik ifadeleri rapora şerh olarak ekleyin.',
      'Filtrelenmiş Nihai Skor: Filtreler uygulandıktan sonra güncellenen net intihal oranını resmi rapor olarak kaydedin.'
    ],
    tips: [
      'Kaynakça ve doğrudan tırnak içi alıntılar filtrelendiğinde intihal oranı genellikle %5 ila %12 arasında geriler; bu durum gerçek intihal oranını ortaya çıkarır.'
    ]
  },
  {
    id: 'ai-itiraz-ve-yanlis-pozitif',
    category: 'Analiz & Raporlama',
    role: 'Öğrenci & Araştırmacı',
    title: 'Yapay Zeka Şüphesi, Yanlış Pozitifler ve Akademik İtiraz Prosedürü',
    badge: 'Etik & İtiraz',
    description: 'Yapay zeka tespit algoritmalarının doğasında bulunan yanlış pozitif ihtimaline karşı öğrenci hakları ve savunma kanıtları rehberi.',
    steps: [
      'Yanlış Pozitif Olasılığını Bilme: Teknik formüller, kanun metinleri ve standart laboratuvar protokolleri kimi zaman tespit motorlarınca yüksek YZ riski alabilir.',
      'Kanıt Dosyası Hazırlama: Sentience Denetçi Isı Haritası raporunu ve her cümlenin entropi grafiğini PDF dökümü olarak kaydedin.',
      'Aşamalı Taslak Kayıtları: Çalışmanızın ilk taslaklarını, notlarınızı ve kaynakça araştırma geçmişinizi danışmanınıza kanıt olarak ibraz edin.',
      'SHA-256 Dijital Zaman Damgası: Dokümanın oluşturulma ve analiz edilme anındaki değişmez dijital makbuzunu enstitüye sunun.',
      'Akademik Komisyon Değerlendirmesi: YZ skoru tek başına bir intihal veya disiplin suçu teşkil etmez; danışman kanaati ve etik kurul incelemesi esastır.'
    ],
    warning: 'Hiçbir yapay zeka tespit skoru %100 kesinlik taşımaz. Şüpheli durumlarda öğrencinin taslak geçmişi ve sözlü savunması dikkate alınmalıdır.'
  },
  {
    id: 'asamali-odev-ve-tez',
    category: 'Sınıflar & Enstitü',
    role: 'Öğrenci & Eğitmen',
    title: 'Çok Aşamalı Tez & Ödev İş Akışı (Multipart Workflow)',
    badge: 'Aşamalı Süreç',
    description: 'Yazım sürecini aşamalara bölerek teslim gününde sürpriz intihal oranlarının önüne geçen aşamalı kontrol mekanizması.',
    steps: [
      '1. Aşama - Konu & Yöntem Taslağı: Tezin ilk bölümlerinin yüklenmesi, ön benzerlik taramasının yapılması.',
      '2. Aşama - Danışman Ön Kontrolü: Danışmanın benzerlik eşleşmelerini ve sentaks akışını sınıf panelinden incelemesi.',
      '3. Aşama - İnsanlaştırma & Kaynak Zenginleştirme: Benzerlik çıkan kısımların Sentinel ve İnsanlaştırma ile özgünleştirilmesi.',
      '4. Aşama - Nihai Tez Teslimi: Tezin tam metninin sisteme yüklenip karekodlu resmi orijinallik raporunun üretilmesi.',
      '5. Aşama - Enstitü Sevk Onayı: Danışman onayından sonra tezin Enstitü Onay Havuzuna otomatik aktarılması.'
    ],
    tips: [
      'Aşamalı kontrol yaklaşımı, teslim gününde ortaya çıkabilecek baraj aşımı (%15 üzeri intihal) stresini tamamen ortadan kaldırır.'
    ]
  },
  {
    id: 'sinif-ve-egitmen',
    category: 'Sınıflar & Enstitü',
    role: 'Eğitmen & Danışman',
    title: 'Sınıflarım: Eğitmen, Danışman ve Öğrenci İş Akışı',
    badge: 'Akademik Panel',
    description: 'Akademisyenler için sanal sınıf oluşturma, ödev verme, KVKK onaylı teslim alma ve öğrenci adına analiz yükleme.',
    steps: [
      'Eğitmen rolündeki kullanıcılar "Sınıflarım" sekmesinden yeni bir sınıf (örn: "2026 Lisansüstü Tez Semineri") oluşturur.',
      'Oluşan 6 haneli benzersiz Sınıf Kodunu öğrencileriyle paylaşır.',
      'Öğrenciler "Sınıfa Katıl" ile sınıfa dahil olur ve belirlenen ödev teslim tarihine kadar çalışmalarını yükler.',
      'Öğrenci Adına Yükleme: Danışmanlar, KVKK onayını teyit ederek öğrenci adına da dosya teslimi gerçekleştirebilir.',
      'Karekodlu Resmi Rapor: İncelenen her ödev için doğrulanabilir QR kodlu dijital orijinallik belgesi üretilir.'
    ],
    tips: [
      'Öğrenci ödevini sisteme yüklediğinde danışmana bildirim iletilir ve benzerlik raporu anında üretilir.'
    ]
  },
  {
    id: 'enstitu-onay-havuzu',
    category: 'Sınıflar & Enstitü',
    role: 'Enstitü & Yönetici',
    title: 'Enstitü Onay Havuzu: Tez Teslim ve Savunma Onayı',
    badge: 'Enstitü Süreci',
    description: 'Lisansüstü enstitü yöneticileri ve anabilim dalı başkanlıkları için merkezi tez kabul mekanizması.',
    steps: [
      'Danışman onayından geçen tezler "Enstitü Onay Havuzu" na sevk edilir.',
      'Enstitü raportörü; intihal oranı (%15 barajı), YZ tespit skoru ve kaynak bütünlüğünü tek ekranda inceler.',
      'Kriterleri sağlayan tezler "Onaylandı" damgasıyla imzalanır ve savunma jürisine sevk belgesi oluşturulur.',
      'Eksikliği bulunan çalışmalar gerekçe belirtilerek doğrudan öğrenci ve danışman paneline revizyona gönderilir.'
    ],
    warning: 'Enstitü Onay Havuzundaki onay mühürleri karekod ile şifrelenir ve savunma jürisine resmi tutanak olarak iletilir.'
  },
  {
    id: 'dijital-makbuz-ve-dogrulama',
    category: 'Doğrulama & Güvenlik',
    role: 'Tümü',
    title: 'Dijital Orijinallik Makbuzu ve Karekodlu Doğrulama',
    badge: 'Güvenlik & Doğrulama',
    description: 'Analiz edilen veya teslim edilen her çalışma için üretilen değiştirilemez SHA-256 dijital makbuz ve doğrulama sistemi.',
    steps: [
      'Otomatik Makbuz Üretimi: Analiz veya ödev teslimi tamamlandığında sistem anında resmi bir Dijital Makbuz oluşturur.',
      'SHA-256 Dijital Parmak İzi: Dokümanın o anki ham metin içeriği şifrelenerek değişmez bir zaman damgasıyla kayıt altına alınır.',
      'Doğrulanabilir Karekod (QR Code): Enstitü, jüri üyeleri veya kütüphane personeli karekodu taratarak belgenin doğruluğunu 1 saniyede teyit eder.',
      'İndirilebilir PDF Doğrulama Belgesi: Tez cilt kapağına veya jüri dosyasına iliştirilecek resmi orijinallik belgesi.',
      'Teslim İhtilaflarının Önlenmesi: Makbuz üzerinde teslim eden öğrenci, danışman, tarih, saat, sayfa ve kelime sayısı net olarak mühürlenir.'
    ],
    tips: [
      'Tez savunma sınavına girerken jüri üyelerine karekodlu resmi doğrulama belgesinin çıktısını sunmanız gerekmektedir.'
    ]
  },
  {
    id: 'kampus-ve-lms-entegrasyonu',
    category: 'Kurumsal & Entegrasyon',
    role: 'Enstitü & Yönetici',
    title: 'Kampüs & LMS Entegrasyonu (Moodle, Canvas, ÖBS & REST API)',
    badge: 'Kurumsal Entegrasyon',
    description: 'Üniversitelerin Moodle, Canvas, Blackboard öğrenim yönetim sistemleri ve Öğrenci Bilgi Sistemleri (ÖBS) entegrasyonu.',
    steps: [
      'LMS Eklentisi: Canvas, Moodle ve Blackboard sistemlerinde Sentience LTI 1.3 standardıyla otomatik intihal ve YZ denetimi.',
      'ÖBS Tekil Oturum (SSO): Üniversite personeli ve öğrencilerinin üniversite şifreleriyle doğrudan sisteme bağlanması.',
      'Geliştirici REST API: Enstitü bilgi işlem merkezleri için güvenli API anahtarı ve POST /api/v1/analyze uç noktaları.',
      'Otomatik Sınıf Senkronizasyonu: Dönem başında açılan derslerin ve öğrenci listelerinin LMS üzerinden otomatik içeri aktarılması.',
      'Sıfır-Veri Garantisi: Kurumsal entegrasyonlarda da ham metinler kalıcı veritabanında tutulmaz; analiz tamamlandığında bellekten silinir.'
    ],
    tips: [
      'Bilgi işlem daire başkanlıkları kurumsal API belgeleri ve entegrasyon anahtarları için Yönetici Paneli "Geliştirici API" sekmesini kullanabilir.'
    ]
  },
  {
    id: 'stylemaster-modulu',
    category: 'Modüller',
    role: 'Öğrenci & Araştırmacı',
    title: 'StyleMaster: Özel Ton ve Kurumsal Hafıza',
    badge: 'StyleMaster',
    description: 'Kendi makalelerinizden veya kurumunuzun yayın kılavuzundan üslup öğrenen akıllı ton kütüphanesi.',
    steps: [
      'StyleMaster panelinden "Yeni Ton Ekle" ye tıklayın.',
      'Örnek 2-3 özgün akademik makalenizi sisteme yükleyin.',
      'Sistem yazarın cümle kurma ritmini, kelime dağarcığını ve bağlaç kullanımını analiz ederek özel bir ton profili oluşturur.',
      'Yeni metinlerinizi bu özel tonla biçimlendirerek marka veya yazar kimliğinizi koruyun.'
    ],
    tips: [
      'Farklı dergiler için (örn: TÜBİTAK Dergisi, IEEE, Springer) ayrı ton profilleri oluşturarak makalenizi derginin üslup standartlarına otomatik uyarlayabilirsiniz.'
    ]
  },
  {
    id: 'dokumanlar-ve-indirilebilirler',
    category: 'Belgeler & İndirmeler',
    role: 'Tümü',
    title: 'Akademik Şablonlar ve Kullanım Belgeleri',
    badge: 'Kütüphane',
    description: 'Enstitü teslimlerinde ve bilimsel makalelerde kullanabileceğiniz resmi şablon ve taahhütnameler.',
    steps: [
      'Akademik Dürüstlük ve Özgünlük Taahhütnamesi Şablonu (.docx)',
      'YÖK Uyumlu Tez Benzerlik Raporu Kapak Sayfası (.pdf)',
      'APA 7 & IEEE Hızlı Kaynak Gösterme Kılavuzu (.pdf)',
      'Sentience Kurumsal Platform Tanıtım Broşürü (.pdf)',
      'Yapay Zeka Tespit İtiraz ve İnceleme Başvuru Dilekçesi Şablonu (.docx)'
    ],
    tips: [
      'Tez tesliminde enstitü sekreterliğine sunulacak orijinallik taahhütnamesini indirip ilgili alanları doldurmanız yeterlidir.'
    ]
  }
];

const CATEGORIES = [
  'Tümü',
  'Başlarken',
  'Doküman Standartları',
  'Modüller',
  'Analiz & Raporlama',
  'Sınıflar & Enstitü',
  'Doğrulama & Güvenlik',
  'Kurumsal & Entegrasyon',
  'Belgeler & İndirmeler'
];

const ROLE_FILTERS = [
  { id: 'all', label: 'Tüm Roller' },
  { id: 'Öğrenci', label: 'Öğrenci & Araştırmacı' },
  { id: 'Eğitmen', label: 'Eğitmen & Danışman' },
  { id: 'Enstitü', label: 'Enstitü & Yönetici' }
];

export function UserGuideView({ onBack, onNavigateAuth }: UserGuideViewProps) {
  const [selectedCategory, setSelectedCategory] = useState('Tümü');
  const [selectedRole, setSelectedRole] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeItem, setActiveItem] = useState<string>(GUIDE_SECTIONS[0].id);
  const [isMobileTopicsOpen, setIsMobileTopicsOpen] = useState(false);

  useEffect(() => {
    const handleHash = () => {
      if (typeof window !== 'undefined' && window.location.hash) {
        const hash = window.location.hash.replace('#', '');
        const exists = GUIDE_SECTIONS.some((s) => s.id === hash);
        if (exists) {
          setActiveItem(hash);
          setSelectedCategory('Tümü');
          setSelectedRole('all');
        }
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const filteredSections = GUIDE_SECTIONS.filter((section) => {
    const matchesCat =
      selectedCategory === 'Tümü' || section.category === selectedCategory;
    const matchesRole =
      selectedRole === 'all' ||
      !section.role ||
      section.role === 'Tümü' ||
      section.role.includes(selectedRole);
    const matchesSearch =
      section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      section.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      section.steps.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesRole && matchesSearch;
  });

  const currentDetail =
    GUIDE_SECTIONS.find((s) => s.id === activeItem) || filteredSections[0] || GUIDE_SECTIONS[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-slate-300 transition-colors flex items-center gap-2 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              Geri Dön
            </button>
            <div className="h-6 w-px bg-slate-800 hidden sm:block" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-sky-600 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                <Compass className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                  Sentience AI Kullanım Kılavuzu & Rehber
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                    v3.0
                  </span>
                </h1>
                <p className="text-xs text-slate-400 hidden sm:block">
                  Akademik İntihal, Yapay Zeka Tespiti, Sınıf ve Enstitü Standartları Kılavuzu
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {onNavigateAuth && (
              <button
                onClick={onNavigateAuth}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Hemen Başla</span>
                <span className="sm:hidden">Başla</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border-b border-slate-800/80 py-8 sm:py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-medium">
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            Resmi Destek ve Entegrasyon Kılavuzu
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Sentience AI Ekosistemini Keşfedin
          </h2>
          <p className="text-xs sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Kayıttan enstitü tez onayına, Denetçi analizinden canlı DOI kaynak doğrulamasına, aşamalı ödev tesliminden LMS entegrasyonuna kadar eksiksiz rehber.
          </p>

          {/* Search Bar */}
          <div className="pt-2 sm:pt-4 max-w-xl mx-auto relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rehberde konu veya modül ara... (örn: DOI, YÖK, Filtre)"
              className="w-full pl-11 pr-4 py-2.5 sm:py-3 bg-slate-900 border border-slate-800 rounded-2xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-inner"
            />
          </div>

          {/* Role Filters (Horizontally scrollable on mobile) */}
          <div className="pt-2 flex items-center justify-start sm:justify-center gap-2 overflow-x-auto no-scrollbar py-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1 shrink-0 mr-1">
              <Users className="w-3 h-3" /> Rol:
            </span>
            {ROLE_FILTERS.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedRole(r.id)}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs font-semibold transition-all border shrink-0',
                  selectedRole === r.id
                    ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                    : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                )}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Category Tabs (Horizontally scrollable on mobile) */}
          <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto no-scrollbar py-1.5 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  'px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border shrink-0',
                  selectedCategory === cat
                    ? 'bg-emerald-500 text-black border-emerald-400 shadow-sm'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Mobile Topic Selector Bar (Visible only on < 1024px) */}
        <div className="lg:hidden mb-6 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm flex items-center justify-between gap-3 shadow-lg">
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase font-mono text-emerald-400 font-bold flex items-center gap-1.5">
              <span>Aktif Konu:</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{currentDetail.badge}</span>
            </div>
            <div className="text-sm font-extrabold text-white truncate mt-0.5">
              {currentDetail.title}
            </div>
          </div>
          <button
            onClick={() => setIsMobileTopicsOpen(!isMobileTopicsOpen)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs font-bold text-slate-200 border border-slate-700 shrink-0 flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
          >
            <span>Konu Değiştir</span>
            <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", isMobileTopicsOpen && "rotate-180")} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar Navigation */}
          <aside className={cn(
            "lg:col-span-4 lg:sticky lg:top-24 lg:self-start space-y-3 transition-all",
            isMobileTopicsOpen ? "block mb-6 lg:mb-0" : "hidden lg:block"
          )}>
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-3.5 space-y-2.5 backdrop-blur-sm">
              <div className="flex items-center justify-between px-2 pt-1">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Konu Başlıkları
                  </h3>
                </div>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-semibold border border-slate-700/60">
                  {filteredSections.length} Konu
                </span>
              </div>

              {/* Scrollable Compact List */}
              <div className="max-h-[calc(100vh-180px)] overflow-y-auto pr-1.5 space-y-1.5 custom-scrollbar">
                {filteredSections.map((item) => {
                  const isSelected = item.id === currentDetail.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveItem(item.id);
                        setIsMobileTopicsOpen(false);
                        if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                          const el = document.getElementById('guide-detail-card');
                          el?.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                      className={cn(
                        'w-full text-left p-2.5 sm:p-3 rounded-xl border transition-all flex items-center justify-between gap-3 group relative cursor-pointer',
                        isSelected
                          ? 'bg-slate-800/90 border-emerald-500/60 text-white shadow-sm shadow-emerald-500/10'
                          : 'bg-slate-950/40 border-slate-800/60 hover:bg-slate-900/80 hover:border-slate-700 text-slate-300'
                      )}
                    >
                      {/* Left active marker indicator */}
                      {isSelected && (
                        <div className="absolute left-0 top-2 bottom-2 w-1 bg-emerald-400 rounded-r-full" />
                      )}

                      <div className="space-y-1 min-w-0 flex-1 pl-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={cn(
                              'text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-bold border',
                              isSelected
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : 'bg-slate-800 text-slate-400 border-slate-700/60'
                            )}
                          >
                            {item.badge}
                          </span>
                          {item.role && item.role !== 'Tümü' && (
                            <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
                              {item.role}
                            </span>
                          )}
                          <span className="text-[11px] text-slate-400 truncate">
                            {item.category}
                          </span>
                        </div>
                        <h4
                          className={cn(
                            'text-xs sm:text-sm font-semibold truncate transition-colors',
                            isSelected ? 'text-white' : 'text-slate-300 group-hover:text-white'
                          )}
                          title={item.title}
                        >
                          {item.title}
                        </h4>
                      </div>

                      <ChevronRight
                        className={cn(
                          'w-3.5 h-3.5 shrink-0 transition-transform',
                          isSelected
                            ? 'text-emerald-400 translate-x-0.5'
                            : 'text-slate-600 group-hover:text-slate-400'
                        )}
                      />
                    </button>
                  );
                })}

                {filteredSections.length === 0 && (
                  <div className="p-6 text-center bg-slate-950/40 rounded-xl border border-slate-800/60">
                    <HelpCircle className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                    <p className="text-xs text-slate-400">Aramanıza uygun konu bulunamadı.</p>
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* Detail Area */}
          <div className="lg:col-span-8" id="guide-detail-card">
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
              {/* Header */}
              <div className="space-y-3 pb-6 border-b border-slate-800">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono uppercase px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                    {currentDetail.badge}
                  </span>
                  {currentDetail.role && currentDetail.role !== 'Tümü' && (
                    <span className="text-xs font-mono uppercase px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
                      {currentDetail.role}
                    </span>
                  )}
                  <span className="text-xs text-slate-400 font-medium">
                    {currentDetail.category}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {currentDetail.title}
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {currentDetail.description}
                </p>
              </div>

              {/* Step by step checklist or Downloadable Templates */}
              {currentDetail.id === 'dokumanlar-ve-indirilebilirler' ? (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Download className="w-4 h-4 text-emerald-400" />
                    İndirilebilir Resmi Belgeler & Şablonlar (Tek Tıkla İndir)
                  </h4>

                  <div className="space-y-3.5">
                    {ACADEMIC_TEMPLATES.map((tmpl) => (
                      <div
                        key={tmpl.id}
                        className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700/90 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={cn(
                                'text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-md border',
                                tmpl.format === 'docx'
                                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              )}
                            >
                              .{tmpl.format.toUpperCase()}
                            </span>
                            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                              {tmpl.badge}
                            </span>
                          </div>
                          <h4 className="text-sm sm:text-base font-bold text-white tracking-tight">
                            {tmpl.title}
                          </h4>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            {tmpl.description}
                          </p>
                        </div>

                        <button
                          onClick={() => tmpl.action()}
                          className={cn(
                            'shrink-0 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer w-full sm:w-auto',
                            tmpl.format === 'docx'
                              ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-black shadow-emerald-900/20'
                          )}
                        >
                          <Download className="w-4 h-4" />
                          <span>İndir (.{tmpl.format})</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Uygulama Adımları
                  </h4>

                  <div className="space-y-3">
                    {currentDetail.steps.map((step, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-3.5 hover:border-slate-700 transition-colors"
                      >
                        <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-400 font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/20">
                          {idx + 1}
                        </div>
                        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                          {step}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tips & Warnings */}
              {currentDetail.tips && currentDetail.tips.length > 0 && (
                <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-800/30 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" />
                    Önemli İpucu & En İyi Pratik
                  </div>
                  {currentDetail.tips.map((tip, idx) => (
                    <p key={idx} className="text-xs text-emerald-200/90 leading-relaxed">
                      {tip}
                    </p>
                  ))}
                </div>
              )}

              {currentDetail.warning && (
                <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-800/30 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Kritik Dikkat Noktası
                  </div>
                  <p className="text-xs text-amber-200/90 leading-relaxed">
                    {currentDetail.warning}
                  </p>
                </div>
              )}

              {/* Quick actions bar */}
              <div className="pt-6 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div className="text-xs text-slate-400">
                  Sorularınız için: <span className="text-slate-200 font-mono">destek@sentience.ai</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => window.print()}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-2 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Yazdır / PDF Kaydet
                  </button>
                  {onNavigateAuth && (
                    <button
                      onClick={onNavigateAuth}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-xs shadow-md transition-all flex items-center gap-2"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Uygulamada Dene
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer
        onNavigateGuide={() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onNavigateBlog={() => {
          window.history.pushState({}, '', '/blog');
          window.dispatchEvent(new PopStateEvent('popstate'));
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onNavigatePricing={() => {
          window.history.pushState({}, '', '/#pricing');
          window.dispatchEvent(new PopStateEvent('popstate'));
          setTimeout(() => {
            document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
          }, 300);
        }}
      />
    </div>
  );
}
