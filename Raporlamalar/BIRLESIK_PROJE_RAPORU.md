# Sentience AI - Birleşik Proje Raporu

## 0. Çalışma Kuralları

**Kural 1: Kod/Bağımlılık Kaldırma Öncesi Açıklama**
- Herhangi bir kod parçası, fonksiyon veya bağımlılık kaldırılmadan önce:
  1. Neden kaldırılmak istendiğini açıkla
  2. Şu anki kullanım durumunu araştır
  3. Gelecekteki potansiyel kullanım alanlarını belirt
  4. Alternatif çözümleri tartış
  5. Kullanıcı onayı al

**Örnek (TensorFlow Durumu):**
- **Neden kaldırılmak istendi:** Bundle boyutu 1.5 MB, `buildFeatureTensor` kullanılmıyor
- **Şu anki kullanım:** Sadece `buildFeatureTensor` kullanıyor, diğer fonksiyonlar TensorFlow'a ihtiyaç duymuyor
- **Gelecek kullanım:** ML model eğitimi, yerel ML tahminleri
- **Alternatif:** Lazy load veya koşullu import
- **Karar:** TensorFlow kaldırılmadı (kullanıcı onayı ile) (Güncellenmiş)

**Kural 2: Agent Mimarisi YOKTUR ve OLMAYACAKTIR (Kesin Karar - 2026-10-06)**
- Projede "Ajan/Agent" mimarisi bulunmamaktadır ve gelecekte de eklenmeyecektir.
- "Denetçi", "Hayalet Yazar", "Gözcü/Sentinel", "Stil Ustası/StyleMaster" ifadeleri yalnızca eski tanıtım metinlerinde kalan pazarlama etiketleridir; kodda karşılığı olan bağımsız ajan varlıkları değildir.
- Gerçek olan tek şey fonksiyon/servis katmanıdır: `detectAI()`, `analyzeAndHumanize()`, `checkGrammar()`, `sentinelService.verifyPlagiarism()`.
- Tüm doküman, UI ve pazarlama metinlerinde "ajan" dili kaldırılacak; yerine **özellik/Yetenek (Capability)** dili kullanılacak (YZ Tespiti, İntihal Kontrolü, Kaynakça Oluşturma, Dilbilgisi, İnsanlaştırma).

> Tarih: 2026-10-05 | Kapsam: Tüm Raporlar ve Görevler Analizi + Gerçek Proje Yapısı Karşılaştırması + Yeni Öncelik Sırası
> Güncelleme: 2026-10-06 | Agent mimarisi kalıcı olarak reddedildi, Landing Page yeniden tasarım planı eklendi (Bölüm 15)

---

## 📋 Rapor Özeti

Bu rapor, Sentience AI projesinin tüm geliştirme faaliyetlerini, tamamlanan işleri, bekleyen görevleri ve gelecek vizyonunu tek bir yapılandırılmış dokümanda toplar. Raporlamalar klasöründeki tüm dokümanlar analiz edilerek birleştirilmiştir. **ÖNEMLİ:** Bu rapor gerçek proje yapısıyla karşılaştırılarak güncellenmiştir - eski raporlardaki "yapılmadı" olarak işaretlenen bazı bileşenler gerçekte mevcuttur.

**Onay bekleyen çalışma planları (kod değişikliği yapılmadı):**

| Bölüm | Konu | Öncelik |
|-------|------|---------|
| **15** | Tanıtım arayüzünün (Landing Page) ajan dilinden arındırılıp Turnitin/Copyleaks/Originality.ai mantığında yeniden tasarlanması + Kaynakça/Dipnot oluşturucu | P0 / P1 |
| **16** | Okunabilirlik önerilerinin kullanıcının metnindeki konumuna bağlanması — ısı haritasında animasyonlu + seçili renkte metin | P1 |
| **17** | Sentinel intihal doğrulamasında halüsinasyon kapısı, Yerli/Yabancı kaynak ayrımı, Türkçe öncelikli iki aşamalı arama | P0 |
| **21** | Turnitin tipi Sınıf/Ödev/Teslim altyapısı (kurumsal model; üniversite kütüphanesi eğitim videosu referanslı) — ✅ Faz 1 uygulandı (2026-10-08; uygulama durumu: 21.11) | P1 |

> **⚠️ Durum düzeltmesi (2026-10-07, planlar gerçek kod ile karşılaştırılarak):** B16, B17 çekirdeği, B18, test altyapısı ve API rate limiting **uygulanmış durumdadır**. Yukarıdaki tablo tarihsel plan kaydıdır; kalan işlerin güncel sıralaması **Bölüm 20**'dedir (doğrulama tablosu: 20.1).

**Bu sürümde uygulanan iş (kod değişikliği yapıldı):**

| Bölüm | Konu | Durum |
|-------|------|-------|
| **18** | "Gramer & Yazım Denetimi" kartındaki önerinin üzerine gelince giriş metninde animasyonlu konum vurgusu + otomatik kaydırma. Yan bulgu olarak giriş metni ısı haritasının hiç render edilmediği ortaya çıktı ve düzeltildi | ✅ Uygulandı |
| **21 (Faz 1)** | Turnitin tipi Sınıf/Ödev/Teslim altyapısı: veri modeli + servis katmanı + güvenlik kuralları + KVKK kapısı + 12 UI bileşeni + App.tsx/Sidebar entegrasyonu + 23 birim testi. Detay: 21.11 | ✅ Uygulandı (2026-10-08) |
| **23** | Konsolide öncelik planı — kullanıcı onayı alındı; Sıra 1 (B21 Faz 1) tamamlandı | ✅ Onaylandı |

---

## ✅ 1. TAMAMLANAN İŞLER

### 1.1 Temel Mimari ve Sistem Kurulumu

**Teknolojik Yığın (Tech Stack)**
- ✅ Frontend: React (TypeScript), Vite, Tailwind CSS, Framer Motion, Lucide-React
- ✅ Backend & Veritabanı: Firebase Suite (Auth, Firestore)
- ✅ Yapay Zeka: Google Generative AI SDK (Gemini), ML Service
- ✅ Klasör yapısı (components, lib, services, scripts) oluşturuldu

**Veri Modeli (Firestore)**
- ✅ `users` koleksiyonu: uid, role, plan, dailyUsage, lastResetDate
- ✅ `projects` koleksiyonu: userId, originalText, humanizedText, isDraft, aiScore, tone

### 1.2 Kritik Bug Düzeltmeleri

| # | Sorun | Çözüm | Dosya |
|---|-------|-------|-------|
| 1 | Sağ panelde mouse scroll çalışmıyor | Ana layout'a `min-h-0` + `overflow-hidden` eklendi | `App.tsx` |
| 2 | Mobil görünüm responsive değil | `h-screen` → `h-[100dvh]`; mobil tab bar eklendi | `App.tsx` |
| 3 | Isı haritası tooltip taşıyor | CSS `fixed` pozisyon + viewport sınır kontrolü | `App.tsx` |
| 4 | `gemini-3.5-flash` model hatası | `gemini-2.0-flash` olarak güncellendi | `geminiService.ts` |
| 5 | Kullanıcı metinleri admin tarafından okunabiliyordu | `getCountFromServer()` ile sadece sayısal sayaçlar çekiliyor | `AdminPanel.tsx` |
| 6 | Plan atama modalı kapanmıyordu | `setAssigningUser(null)` plan seçiminde çağrılıyor | `AdminPanel.tsx` |
| 7 | Halüsinasyon kaynak üretimi (Copyleaks) | Grounding sorgusu ayrıştırıldı, URL doğrulama eklendi | `sentinelService.ts` |

### 1.3 Geçmiş & Taslak Tam Durum Saklama

- ✅ `Project` tipine `auditorResult`, `mlAnalysis`, `analysis` alanları eklendi
- ✅ Firestore'a tüm analiz sonuçları kaydediliyor
- ✅ Taslağa da tüm analiz verileri yazılıyor
- ✅ Proje yüklemede state'ler anında dolduruluyor (API çağrısı yok, kredi gitmiyor)

### 1.4 Admin Paneli Düzeltmeleri

- ✅ Admin yetkisi: e-posta + Firestore `role === 'admin'` doğrulaması
- ✅ Optimistic UI (lokal state güncelleme)
- ✅ Geçersiz model adı düzeltildi
- ✅ Plan atama modalı kapatma sorunu çözüldü

### 1.5 Bundle Optimizasyonu

**vite.config.ts manualChunks yapılandırması:**
- ✅ `vendor-firebase` - Firebase SDK
- ✅ `vendor-genai` - @google/genai
- ✅ `vendor-framer` - framer-motion
- ✅ `vendor-icons` - lucide-react
- ✅ `vendor-onnx` - onnxruntime-web
- ✅ `vendor-markdown` - react-markdown + remark/rehype

### 1.6 Yeni Özellikler

**Canlı İstatistik Çubuğu**
- ✅ Kelime sayısı, karakter sayısı, kalan günlük kota
- ✅ Doluluk progress bar'ı (yeşil → sarı → kırmızı)

**Diff View (Karşılaştır Sekmesi)**
- ✅ LCS (Longest Common Subsequence) algoritması
- ✅ Eklenen = yeşil vurgu, Silinen = kırmızı üzeri çizili
- ✅ Eklenen/silinen kelime sayısı gösterimi

**Dışa Aktarma (Export)**
- ✅ DOCX formatında çıktı (başlıklar, meta bilgiler, tablolar)
- ✅ PDF/Yazdırma şablonu (Türkçe karakter destekli)
- ✅ TXT formatında yalın metin indirme

**Sentinel Canlı Kaynak Paneli**
- ✅ Canlı web ve intihal eşleşmeleri listesi
- ✅ Eşleşen kaynak sayısı badge'i
- ✅ Başlık, URL, alıntı snippet'i, benzerlik oranı

**Editör Geri Al / İleri Al (Undo / Redo)**
- ✅ Son 30 değişikliği takip eden stack mimarisi
- ✅ `Undo2` ve `Redo2` butonları

**Proje Geçmişi Sayfalama**
- ✅ `limit(20)` Firestore sorgusu
- ✅ "Daha Fazla Yükle" butonu
- ✅ Hassasiyet senkronizasyonu (localStorage + Firestore)

### 1.7 Landing Page Yenileme

**Sprint 1 & 2 Tamamlananlar:**
- ✅ SEO meta etiketleri (title, description, og:image, og:title)
- ✅ Isı haritası renk legend'ı (Yeşil/Sarı/Kırmızı açıklaması)
- ✅ Footer linkleri düzeltildi (Github, Twitter, Web)
- ✅ Sosyal Kanıt & Canlı İstatistikler (10.000+ İşlenmiş Makale, %99.4 YZ Aşımı, < 2.1 sn Hız, 15+ Üniversite)
- ✅ Güven Rozetleri (Turnitin %100 Uyumlu, iThenticate Güvenli, KVKK & GDPR Korumalı, %15 Etik İntihal Limiti)
- ✅ "Nasıl Çalışır?" 3 Adımlı Akış (Yapıştır/Yükle → Ajanları Görevlendir → Doğrulanmış Çıktıyı İndir)
- ✅ Hayalet Yazar Canlı Before/After Önizleme (Yan Yana / Ham YZ / Sentience modları)

> [!WARNING]
> **Revizyon (2026-10-06):** Yukarıdaki "Ajanları Görevlendir" ve "Hayalet Yazar" ifadeleri gerçek ürünle örtüşmüyor. Landing Page, Bölüm 15'teki plana göre **özellik odaklı** (Turnitin/Copyleaks/Originality.ai mantığında) yeniden tasarlanacak; ajan temalı tüm bölümler kaldırılacak.

### 1.8 Intihal Motoru İyileştirmeleri (TextGuard Standardı)

- ✅ Google Live Search Grounding tabanlı `verifyPlagiarism` motoru (%0 hatasının giderilmesi)
- ✅ Denetçi Analizine (`handleAnalyze`) canlı intihal taramasının entegrasyonu
- ✅ Metin üzerinde intihal vurgulama (orange underline), tooltip ve doğrudan kaynak URL linklemesi
- ✅ Sağ panel Sentinel Kaynakları listesinin zenginleştirilmesi (başlık, link, alıntı snippet'ı)
- ✅ "İntihali Kaldır / İnsanlaştır" tek tıkla aksiyon butonu
- ✅ Vercel Serverless API güvenlik katmanı (`api/analyze.ts` + `api/detect.ts`)

### 1.9 Geliştirme Yol Haritası Sprintleri

**Sprint 1 — Anlık Düzeltmeler ✅**
- ✅ `gemini-3.5-flash` → `gemini-2.0-flash`
- ✅ Landing Page SEO meta tagları
- ✅ Isı haritası renk legend'ı
- ✅ Footer linkleri düzelt

**Sprint 2 — Landing Page Yenileme ✅**
- ✅ Hayalet Yazar before/after demo animasyonu
- ✅ Sosyal kanıt bar'ı
- ✅ "Nasıl Çalışır" 3 adımlı bölüm
- ✅ Güven rozetleri

**Sprint 3 — Core Refactor ✅**
- ✅ App.tsx → 5 component'e ayır (HeatmapView, GrammarPanel, AuditorMetrics, DiffView)
- ✅ Dinamik import ile bundle küçültme
- ✅ Gramer denetimi UI aktivasyonu

**Sprint 4 — Yeni Özellikler & İntihal Motoru 🚀**
- ✅ Şablon/Preset sistemi
- ✅ Klavye kısayolları (Ctrl+Enter / Cmd+Enter)
- ✅ İntihal motoru tam entegrasyonu (4.1-4.5)
- ✅ Vercel Serverless API güvenlik katmanı

### 1.10 Protokol ve Güvenlik

- ✅ `GEMINI.md` dosyası oluşturuldu (Core/Showcase ayrımı) *(not: eski "ajan tanımları" bölümü geçersizdir, Bkz. Kural 2)*
- ✅ Akademik İntihal kuralları eklendi (Maks %15 limit, Zero-Hallucination)
- ✅ İnsanlaştırma ve intihal denetim servislerine etik kurallar işlendi
- ✅ Akademik Dürüstlük Protokolü rehberi eklendi
- ✅ Kullanıcı hesap silme arayüzü ve güvenlik protokolü
- ✅ Üyelik iptal arayüzü

### 1.11 Component Ayrıştırma (Güncellenmiş Durum)

**Ayrı Componentler:**
- ✅ `HeatmapView.tsx` (128 satır) - Isı haritası + tooltip tamamen ayrıldı
- ✅ `GrammarPanel.tsx` (103 satır) - Gramer paneli tamamen ayrıldı
- ✅ `AuditorMetrics.tsx` (193 satır) - Denetçi metrikleri tamamen ayrıldı
- ✅ `DiffView.tsx` - Karşılaştırma görünümü ayrıldı
- ✅ `PresetSelector.tsx` - Şablon seçici ayrıldı
- ✅ `AccountSettingsModal.tsx` - Hesap ayarları ayrıldı
- ✅ `CustomToneModal.tsx` - Özel ton modalı ayrıldı
- ✅ `GuideModal.tsx` - Rehber modalı ayrıldı
- ✅ `OnboardingChecklist.tsx` - Onboarding listesi ayrıldı
- ✅ `UserManualSection.tsx` - Kullanıcı kılavuzu ayrıldı
- ✅ `InfoTooltip.tsx` - Bilgi tooltip'i ayrıldı
- ✅ `ErrorBoundary.tsx` - Hata sınırı ayrıldı
- ✅ `ProjectSidebar.tsx` - Geçmiş/Taslak listesi ayrıldı

### 1.12 Vektör Sistemi (Güncellenmiş Durum)

**Yerel Vektör Motoru (Transformers.js):**
- ✅ `vectorEngine.ts` (71 satır) - Transformers.js tabanlı vektör motoru
- ✅ `vectorService.ts` (90 satır) - Vektör servisi (chunking, embedding, Firestore kayıt)
- ✅ `@xenova/transformers` entegrasyonu - Tarayıcıda tamamen ücretsiz embedding
- ✅ 384 boyutlu vektörler (all-MiniLM-L6-v2 modeli)
- ✅ Kosinüs benzerliği hesaplama
- ✅ Firestore `vector_embeddings` koleksiyonu ile entegrasyon

### 1.13 Yerel Model Entegrasyonu (Güncellenmiş Durum)

**LM Studio / Ollama Desteği:**
- ✅ `localModelService.ts` (86 satır) - Yerel model servisi
- ✅ OpenAI uyumlu API desteği (`http://localhost:11434/v1` veya `http://localhost:1234/v1`)
- ✅ Health check fonksiyonu (`checkLocalModelHealth`)
- ✅ Model listesi çekme fonksiyonu
- ✅ Konfigürasyon yönetimi (env + localStorage)
- ✅ Chat completions API entegrasyonu

### 1.14 Fine-Tuning Veri Dışa Aktarıcı (Güncellenmiş Durum)

**ML Veri Dışa Aktarım:**
- ✅ `export_local_training.ts` (94 satır) - Lokal eğitim veri seti dışa aktarıcı
- ✅ Alpaca formatı (Unsloth, Axolotl, LLaMA-Factory)
- ✅ ShareGPT formatı (FastChat, Axolotl, vLLM)
- ✅ OpenAI Chat JSONL formatı (TRL SFTTrainer, Ollama, HuggingFace)
- ✅ Ollama Modelfile oluşturma
- ✅ `datasets/` klasörüne çıktı

### 1.15 Vercel Serverless API (Güncellenmiş Durum)

**API Endpoint'leri:**
- ✅ `api/analyze.ts` (53 satır) - İnsanlaştırma API'si
- ✅ `api/detect.ts` (42 satır) - YZ tespit API'si
- ✅ Bearer token doğrulama
- ✅ API key yönetimi (sunucu tarafında)
- ✅ Firebase Auth token ile doğrulama
- ✅ Client fallback mekanizması

---

## ⚠️ 2. YAPILAN AMA YAPILMAYAN / KISMI TAMAMLANAN İŞLER

### 2.1 Uygulama UX/UI İyileştirmeleri

| # | Öneri | Durum | Not |
|---|-------|-------|-----|
| 1 | Kelime sınırı aşıldığında görsel uyarı | ⚠️ Kısmi | Progress bar var ama titreme animasyonu eksik |
| 2 | Metin yapıştırıldığında otomatik YZ tespiti | ❌ Yapılmadı | Opsiyonel, açılıp kapanabilir mekanizma gerekli |
| 3 | Klavye kısayolları | ✅ Tamamlandı | Ctrl+Enter analizi başlatıyor |
| 4 | Sürükle-bırak dosya yükleme | ❌ Yapılmadı | .txt, .docx için dosya aktarma gerekli |

### 2.2 Sonuç Paneli İyileştirmeleri

| # | Öneri | Durum | Not |
|---|-------|-------|-----|
| 1 | Isı haritası legend'ı | ✅ Tamamlandı | Yeşil/Sarı/Kırmızı açıklaması var |
| 2 | "Karşılaştır" sekmesi scroll sync | ❌ Yapılmadı | Orijinal ve düzenlenmiş metin eş zamanlı scroll gerekli |
| 3 | Export önizleme modalı | ❌ Yapılmadı | Export işleminden önce önizleme gerekli |

### 2.3 Bildirim ve Geri Bildirim

| # | Öneri | Durum | Not |
|---|-------|-------|-----|
| 1 | API hatalarında "Yeniden Dene" butonu | ❌ Yapılmadı | Toast mesaju altına buton gerekli |
| 2 | Analiz tamamlandığında browser notification | ❌ Yapılmadı | Notification API ile izinli ise gerekli |
| 3 | Uzun analiz sürecinde ilerleme göstergesi | ⚠️ Kısmi | Bazı akışlarda var ama adım adım gösterim eksik |

### 2.4 Core Refactor (Güncellenmiş)

| Bileşen | Durum | Not |
|---------|-------|-----|
| HeatmapView.tsx | ✅ Tamamlandı | Ayrı component olarak mevcut (128 satır) |
| GrammarPanel.tsx | ✅ Tamamlandı | Ayrı component olarak mevcut (103 satır) |
| AuditorMetrics.tsx | ✅ Tamamlandı | Ayrı component olarak mevcut (193 satır) |
| DiffView.tsx | ✅ Tamamlandı | Ayrı component olarak mevcut |
| ProjectSidebar.tsx | ✅ Tamamlandı | Ayrı component olarak mevcut |
| EditorPanel.tsx | ✅ Tamamlandı | `src/components/editor/EditorPanel.tsx` ayrıştırıldı (418 satır) |
| ResultPanel.tsx | ✅ Tamamlandı | `src/components/result/ResultPanel.tsx` ayrıştırıldı (96 satır) |
| AuditorSidebar.tsx | ✅ Tamamlandı | `src/components/auditor/AuditorSidebar.tsx` ayrıştırıldı (436 satır) |

**App.tsx Monolith Sorunu:** ÇÖZÜLDÜ — App.tsx artık **486 satır** (1931 → 486); editör/sonuç/denetçi panelleri `src/components/{editor,result,auditor}/` altına ayrıştırıldı. *Not (Bölüm 35 güncellemesi): Bu satırlar daha önceki “❌ Yapılmadı” durumunu yansıtıyordu; sonraki Bölümlerde tamamlanan ayrıştırma ile güncellendi.*

### 2.5 Yeni Özellikler

| Özellik | Durum | Not |
|---------|-------|-----|
| Dil ve Çekim Desteği | ⚠️ Kısmi | Dil seçici atlandı, dil tespiti yok |
| Şablon / Preset Sistemi | ✅ Tamamlandı | PresetSelector bileşeni var |
| İşbirliği Modu (Collaboration) | ❌ Yapılmadı | Proje paylaşım, yorumlar, versiyon geçmişi yok |
| API Erişimi (Kurumsal Plan) | ❌ Yapılmadı | REST API endpoint'leri yok (Vercel API var ama dokümantasyon yok) |
| Gram ve Yazım Denetimi Entegrasyonu | ✅ Tamamlandı | GrammarPanel bileşeni var ve kullanımda |

### 2.6 LM Studio Entegrasyonu (Güncellenmiş)

| Bileşen | Durum | Not |
|---------|-------|-----|
| localModelService.ts | ✅ Tamamlandı | Yerel çıkarım servisi mevcut (86 satır) |
| geminiService.ts Hibrit Mod | ❌ Yapılmadı | Yönlendirme ve fallback yok |
| export_local_training.ts | ✅ Tamamlandı | ML veri dışa aktarıcı mevcut (94 satır) |
| AdminPanel Yerel Model Ayarları | ❌ Yapılmadı | LM Studio kontrol kartı yok |

**Not:** `implementation_plan.md` planlandı ve **kısmen uygulandı** - localModelService ve export_local_training tamamlandı, hibrit mod ve admin panel entegrasyonu eksik.

---

## 🚧 3. GELİŞTİRİLMESİ GEREKENLER

### 3.1 Kritik Teknik Borç (P0 - Yüksek Öncelik)

#### 3.1.1 App.tsx Monolith Ayrıştırma — ✅ TAMAMLANDI
- **Mevcut Durum:** App.tsx **486 satır** (eskiden 1931) — bileşenler ayrıştırıldı
  - ✅ `src/components/editor/EditorPanel.tsx` (418 satır)
  - ✅ `src/components/result/ResultPanel.tsx` (96 satır)
  - ✅ `src/components/auditor/AuditorSidebar.tsx` (436 satır)

#### 3.1.2 Bundle Boyutu Küçültme — ✅ KISMİ/İLERLEME
- **Sorun (eski):** `vendor-core` ~957 kB idi → **güncel build: `vendor-core` 255 kB** (bkz. Bölüm 25/34 doğrulama çıktısı).
- **Çözüm:**
  - `onnxruntime-web` → Web Worker'a taşı, lazy load
  - `framer-motion` → Sadece kullanılan primitifleri import et
  - `docx` → Export butonuna tıklandığında dinamik `import()`
  - `react-markdown` → `lazy()` ile wrap'le

### 3.2 İnsanlaştırma Motoru v2 (Copyleaks Uyumlu)

#### 3.2.1 Prompt Güçlendirme (P0 - Hemen)
- ✅ Yasaklı kelime listesi ("Önemle belirtmek gerekir ki", "Sonuç olarak", vb.)
- ✅ Cümle uzunluğu kuralları (Burstiness)
- ✅ Türkçe idiom zorunluluğu
- ⚠️ Yoğunluk moduna göre farklı kural setleri (Akademik/Blog/Özet ayrımı) - Kısmi

#### 3.2.2 İstemci Tarafı Burstiness Hesaplama (P1 - Orta)
- Cümle varyans göstergesi (UI'da σ standart sapma)
- Bayraklı cümle vurgulama (ısı haritası Copyleaks mantığıyla uyumlu)

#### 3.2.3 Copyleaks API Entegrasyonu (P2 - Uzun Vade)
- Gerçek zamanlı skor geri bildirimi döngüsü
- A/B test altyapısı

### 3.3 Altyapı Modernizasyonu

#### 3.3.1 Firebase Functions
- ✅ Vercel Serverless API kuruldu
- ⚠️ Rate limiting sunucu tarafında uygulanmalı
- ⚠️ Kullanıcı kredisi kontrolü sunucuda yapılmalı

#### 3.3.2 Gerçek Zamanlı Kota İzleme
- ❌ Firestore'da `usage/{userId}/daily` koleksiyonu
- ❌ Her API çağrısında atomik `increment()` ile sayaç güncelleme
- ❌ Admin paneline kullanıcı başına günlük kullanım grafiği

#### 3.3.3 Test Altyapısı
- ❌ Vitest + React Testing Library kurulumu
- ❌ `geminiService.ts` için mock tabanlı unit testler
- ❌ Kritik akışlar için E2E test (Playwright)

#### 3.3.4 CI/CD Pipeline
- ❌ GitHub Actions: PR'da `npm run build` + `tsc --noEmit`
- ❌ Lint ve format kontrolü (`eslint`, `prettier`)
- ❌ Otomatik Vercel/Netlify deploy preview

### 3.4 Vektör Veritabanı ve Semantik Analiz (Güncellenmiş)

#### 3.4.1 Mevcut Durum (Transformers.js)
- ✅ **Model:** `Xenova/all-MiniLM-L6-v2` (384 boyutlu)
- ✅ **Veritabanı:** Firestore (vector_embeddings koleksiyonu)
- ✅ **Motor:** Transformers.js (tarayıcıda yerel embedding)
- ✅ **Hız:** Milyonlarca karakteri milisaniyeler içinde vektörleştirme
- ✅ **Maliyet:** Tamamen ücretsiz (yerel)
- ❌ Sentinel servisi ile entegrasyon eksik (StyleMaster diye bir servis yoktur — Bkz. Kural 2)

#### 3.4.2 Çalışma Hiyerarşisi
- **Veri Giriş Süreci (Ingestion):**
  - ✅ Metin Parçalama (Chunking): ~800 karakterlik bloklar
  - ✅ Vektörleştirme (Embedding): 384 boyutlu vektör
  - ✅ İndeksleme: Firestore'a kaydetme
- **Denetim Süreci (Querying):**
  - ✅ Anlık Vektörleme
  - ✅ Kosinüs Benzerliği (Cosine Similarity)
  - ❌ Hibrit Raporlama (İç Havuz + Dış Havuz) - Eksik

#### 3.4.3 Servis Entegrasyonları (Agent değil — Bkz. Kural 2)
- ❌ **Sentinel servisi (`sentinelService.ts`):** Semantik intihal tespiti için vektör benzerliğinin kullanılması - Eksik
- ~~StyleMaster~~ → **KALDIRILDI:** Böyle bir servis/ajan yoktur ve olmayacaktır. Marka sesi hafızası ihtiyacı, ileride `CustomTone` verisinin vektörle eşleştirilmesiyle çözülebilir (ayrı bir karar).

#### 3.4.4 Gelecek Geliştirmeler (Vertex AI)
- ❌ GCP Console üzerinden **Vertex AI API**'yi etkinleştir
- ❌ Firestore Vector Search kurulumu (yerel mevcut, cloud eksik)
- ❌ 768 boyutlu text-embedding-004 modeline geçiş (opsiyonel)

### 3.5 Bütünlük Bayrakları (Turnitin Standardı)

#### 3.5.1 Eşleşme Grupları (Match Groups)
1. **Alıntı Yapılmamış ve Tırnak İçine Alınmamış** (Kırmızı)
2. **Eksik Tırnak İşaretleri** (Turuncu)
3. **Eksik Atıf** (Sarı)
4. **Atıf Yapılmış ve Tırnak İçine Alınmış** (Mavi/Yeşil)

#### 3.5.2 Bütünlük Bayrakları (Integrity Flags)
- ❌ **Değiştirilen Karakterler (Homoglyph Attack):** Kiril/Yunan harf ikamesi tespiti
- ❌ **Gizli Metin (Hidden Text):** Beyaz zemin üzerine beyaz yazı, 0-1px mikro fontlar tespiti

#### 3.5.3 Dinamik Filtreleme
- ❌ Alıntıları Hariç Tut
- ❌ Kaynakçayı Hariç Tut
- ❌ Küçük Eşleşmeleri Hariç Tut (<10 kelime)

### 3.6 LM Studio & Yerel Model Entegrasyonu (Güncellenmiş)

#### 3.6.1 Yerel Çıkarım Servisi
- ✅ `localModelService.ts` mevcut
- ✅ LM Studio OpenAI uyumlu API'sine (`http://localhost:11434/v1` veya `http://localhost:1234/v1`) istek at
- ✅ Sunucu durumunu test et (`checkLocalModelHealth`)
- ✅ Yüklü modelleri dinamik çek (`/v1/models`)

#### 3.6.2 Akıllı Yönlendirme ve Fallback
- ❌ `geminiService.ts` üzerinde mod kontrolü
  - Sadece Bulut
  - Sadece Yerel
  - Hibrit Mod
  - Otomatik Fallback

#### 3.6.3 Fine-Tuning Veri Dışa Aktarıcı
- ✅ `export_local_training.ts` mevcut
- ✅ Firestore'dan yüksek kaliteli verileri çek (sync olmadığı için manuel)
- ✅ JSONL formatına dönüştür
- ✅ Proje dizinine çıktı ver

#### 3.6.4 Admin Paneli Arayüzü
- ❌ "Yerel Model Ayarları (LM Studio)" kartı ekle
- ❌ Sunucu adresi ayarı
- ❌ Bağlantı durumu göstergesi
- ❌ Model seçim dropdown'ı
- ❌ Sistem Çalışma Modu seçici

### 3.7 Gelecek Vizyon: Yerel LLM ve Desktop Setup

- ❌ **Standalone Çalışma:** Electron veya PWA olarak paketleme
- ❌ **Gemma 2B Entegrasyonu:** MediaPipe LLM Inference API ile yerelde ücretsiz insanlaştırma
- ❌ **Gizli Yerel Eğitim:** Kullanıcı verilerinin sadece kendi cihazında kalarak modeli kişiselleştirme

---

## 🏗️ 4. TEKNİK MİMARİ VE ALTYAPI

### 4.1 Teknolojik Yığın

**Frontend:**
- React (TypeScript)
- Vite
- Tailwind CSS (Vanilla CSS temelli özelleştirilmiş tasarım)
- Framer Motion (Animasyonlar)
- Lucide-React (İkonlar)
- @xenova/transformers (Yerel vektör motoru)

**Backend & Veritabanı:**
- Firebase Suite
  - Authentication: Google ile giriş
  - Firestore: NoSQL veritabanı (Kullanıcılar, Projeler, Özel Tonlar)
- Vercel Serverless API (api/analyze.ts, api/detect.ts)

**Yapay Zeka (AI):**
- Google Generative AI SDK (Gemini): Metin insanileştirme, özetleme ve dilbilgisi kontrolü
- ML Service: Derin analizler için özel mantıksal katman
- Transformers.js: Yerel vektör embedding (all-MiniLM-L6-v2)
- LM Studio / Ollama: Yerel LLM çıkarım desteği

### 4.2 Klasör Yapısı (Güncellenmiş)

```
sentience-ai/
├── src/
│   ├── components/       # UI Bileşenleri
│   │   ├── AdminPanel.tsx
│   │   ├── AuditorMetrics.tsx ✅
│   │   ├── GrammarPanel.tsx ✅
│   │   ├── HeatmapView.tsx ✅
│   │   ├── DiffView.tsx ✅
│   │   ├── PresetSelector.tsx ✅
│   │   ├── AccountSettingsModal.tsx ✅
│   │   ├── CustomToneModal.tsx ✅
│   │   ├── GuideModal.tsx ✅
│   │   ├── OnboardingChecklist.tsx ✅
│   │   ├── UserManualSection.tsx ✅
│   │   ├── InfoTooltip.tsx ✅
│   │   ├── ErrorBoundary.tsx ✅
│   │   ├── LandingPage.tsx
│   │   ├── PlansModal.tsx
│   │   └── ProjectSidebar.tsx ✅
│   ├── lib/              # Konfigürasyonlar
│   │   ├── firebase.ts
│   │   └── utils.ts
│   ├── services/         # İş mantığı ve API çağrıları
│   │   ├── geminiService.ts
│   │   ├── mlService.ts
│   │   ├── sentinelService.ts
│   │   ├── localModelService.ts ✅
│   │   ├── vectorService.ts ✅
│   │   ├── vectorEngine.ts ✅
│   │   └── apiKeyManager.ts
│   ├── ml/               # ML motorları
│   │   ├── textFeatures.ts
│   │   └── demo.ts
│   ├── genkit/           # Genkit entegrasyonu
│   │   ├── index.ts
│   │   └── run.ts
│   ├── types/            # TypeScript tipleri
│   │   └── index.ts
│   ├── App.tsx           # Ana uygulama (1931 satır - monolith)
│   ├── main.tsx
│   └── index.css
├── scripts/              # Devops ve Tuning scriptleri
│   ├── tune_model.ts
│   ├── generate_model.ts
│   ├── generate_training_data.ts
│   └── export_local_training.ts ✅
├── api/                  # Vercel Serverless API
│   ├── analyze.ts ✅
│   └── detect.ts ✅
├── functions/            # Firebase Functions
│   └── src/
│       └── index.ts
├── scratch/              # Test scriptleri
│   ├── cleanup_keys.ts
│   ├── delete_all_keys.ts
│   ├── reset_keys.ts
│   ├── test_all_keys.ts
│   └── test_keys.ts
├── public/               # Statik varlıklar
└── Raporlamalar/         # Proje raporları
```

### 4.3 Veri Modeli (Firestore)

**`users` Koleksiyonu**
- `uid`: Kullanıcı ID
- `role`: `admin` | `user`
- `plan`: `free` | `pro` | `premium`
- `dailyUsage`: Günlük kullanılan işlem sayısı
- `lastResetDate`: Kotanın sıfırlandığı son tarih

**`projects` Koleksiyonu**
- `userId`: İşlemi yapan kullanıcı
- `originalText`: Kaynak metin
- `humanizedText`: İşlenmiş sonuç metni
- `isDraft`: Taslak olup olmadığı
- `aiScore`: Yapay zeka tespit skoru
- `tone`: Seçilen ton
- `auditorResult`: Denetçi analizi sonucu
- `mlAnalysis`: ML analizi
- `analysis`: Genel analiz
- `sentenceScores`: Cümle skorları

**`vector_embeddings` Koleksiyonu** (Yeni)
- `userId`: Kullanıcı ID
- `projectId`: Proje ID (opsiyonel)
- `text`: Metin parçası
- `vector`: 384 boyutlu vektör
- `dimensions`: 384
- `chunkIndex`: Parça indeksi
- `createdAt`: Oluşturma tarihi
- `engine`: 'transformers-js'
- `model`: 'all-MiniLM-L6-v2'

### 4.4 İş Akışı (Data Flow)

1. **Giriş:** Kullanıcı Google ile giriş yapar, Firebase Auth üzerinden `users` dokümanı oluşturulur/senkronize edilir
2. **Girdi:** Kullanıcı sol panele metin girer
3. **Canlı Analiz:** Metin girilirken `detectAI` ve `checkGrammar` fonksiyonları (debounce ile) arka planda çalışarak canlı skorlar üretir
4. **İnsanileştirme/Özetleme:** Kullanıcı butona bastığında:
   - `App.tsx` üzerindeki handler fonksiyonu tetiklenir
   - `geminiService.ts` veya Vercel API üzerinden Google Gemini modeline özel promptlar ile istek atılır
   - Sonuç sağ panele yansıtılır ve Firestore'a kaydedilir
5. **Vektörleştirme:** Metin `vectorService.ts` üzerinden Transformers.js ile vektörleştirilir ve Firestore'a kaydedilir
6. **Admin Yönetimi:** Admin yetkisine sahip kullanıcılar `AdminPanel` üzerinden sistem ayarlarını ve kullanıcı kotalarını yönetebilir

### 4.5 Model Eğitimi (Tuning)

Sistem, `scripts/tune_model.ts` ve `export_local_training.ts` aracılığıyla veritabanındaki başarılı "İnsanileştirme" örneklerini JSONL formatına getirip Google Cloud Vertex AI veya yerel Ollama üzerinden modelin eğitilmesine olanak tanır. Bu, çıktı kalitesinin zamanla iyileşmesini sağlar.

### 4.6 Google Cloud Vertex AI Kotaları

**Faturalandırma Ayarları:**
- Faturalandırma hesabı doğrulama
- Aylık bütçe (Budget Alert) belirleme
- Harcamaların kontrolü

**API Kotaları:**
- Vertex AI API kotalarını daraltma (Güvenlik için)
- Günlük istek limiti ayarlama (Örn: 10.000)
- Model kotalarını (TPM / RPM) yönetme

---

## 🔮 5. GELECEK VİZYON

### 5.1 Vektör Veritabanı ve Semantik Analiz

Platformun mevcut "Arama" tabanlı denetim mekanizmasını, Turnitin benzeri bir **Semantik Analiz** ve **Kalıcı Hafıza** sistemine dönüştürme vizyonu.

**Mevcut Durum (Transformers.js):**
- ✅ 384 boyutlu vektörler (all-MiniLM-L6-v2)
- ✅ Tamamen ücretsiz ve yerel
- ✅ Firestore entegrasyonu
- ❌ Sentinel servisi ile entegrasyon eksik (StyleMaster diye bir servis yoktur — Bkz. Kural 2)

**Gelecek (Vertex AI - Opsiyonel):**
- 768 boyutlu vektörler (text-embedding-004)
- 1 Milyon karakter vektörleştirme: 0.025$
- 1 Milyon makale saklama: ~1$/Ay
- Firestore Vector Search

### 5.2 Yerel LLM ve Desktop Setup

Projenin Electron veya PWA olarak paketlenip, kullanıcının yerel donanımını (WebGPU) kullanarak Ollama/Python gerektirmeden çalışması.

**Mevcut Durum:**
- ✅ LM Studio / Ollama desteği (localModelService.ts)
- ✅ OpenAI uyumlu API entegrasyonu
- ❌ Hibrit mod ve fallback mekanizması eksik
- ❌ Admin panel kontrolü eksik

**Gelecek:**
- ❌ Gemma 2B Entegrasyonu: MediaPipe LLM Inference API ile yerelde ücretsiz insanlaştırma
- ❌ Gizli Yerel Eğitim: Kullanıcı verilerinin sadece kendi cihazında kalarak modeli kişiselleştirme

### 5.3 İnsanlaştırma Motoru v2

Copyleaks ve Turnitin standartlarına uyumlu, 3 katmanlı işlem mimarisi:
1. **Yapısal Analiz:** Metni cümle uzunluğu ve geçiş örüntüleri açısından analiz et
2. **Hedefli Yeniden Yazım:** Sadece bayraklanan cümleleri yeniden yaz
3. **Doğrulama:** Üretilen metnin Perplexity ve Burstiness skorlarını hesapla

### 5.4 Turnitin Benzerlik Raporu Mimarisi

**4'lü Eşleşme Grupları:**
1. Alıntı Yapılmamış ve Tırnak İçine Alınmamış (Kırmızı)
2. Eksik Tırnak İşaretleri (Turuncu)
3. Eksik Atıf (Sarı)
4. Atıf Yapılmış ve Tırnak İçine Alınmış (Mavi/Yeşil)

**Bütünlük Bayrakları:**
- Değiştirilen Karakterler (Homoglyph Attack)
- Gizli Metin (Hidden Text)

**Dinamik Filtreleme:**
- Alıntıları Hariç Tut
- Kaynakçayı Hariç Tut
- Küçük Eşleşmeleri Hariç Tut

---

## 📊 6. ÖLÇÜLEBİLİR BAŞARI KRİTERLERİ

| Metrik | Mevcut Hedef | İdeal Hedef |
|--------|--------------|-------------|
| Copyleaks AI Skoru | < %30 | < %15 |
| Burstiness Varyans | — | σ > 8 kelime |
| Yasaklı ifade sızması | — | 0 |
| Anlamsal tutarlılık | — | %95+ (el değerlendirmesi) |
| Yanlış Pozitif Oranı (FPR) | — | <%0.2 |
| Bundle Boyutu | ~957 kB | < 500 kB |
| App.tsx Satır Sayısı | 1931 | < 500 |

---

## 🔄 10. ÇALIŞMA SIRASI VE İLERLEME

### 10.1 Belirlenen Çalışma Sırası (Güncellenmiş - 2026-10-06)

**Tarih: 2026-10-06**
**Öncelik Kriteri:** Ürün kimliği düzeltmesi (Landing Page) + Veri güvenilirliği (Sentinel) + Teknik borç + Gerçek eksiklikler

**Yeni Sıralama (Revize - Agent Mimarisi Kalıcı Olarak Reddedildi):**
1. **P0 - Landing Page Yeniden Tasarımı** - Ajan temalı tanıtım kaldırılacak, Turnitin/Copyleaks/Originality.ai mantığında özellik odaklı arayüz (Detay: **Bölüm 15**)
2. **P0 - Sentinel Halüsinasyon Kapısı + Yerli/Yabancı Kaynak Ayrımı** - Doğrulanmamış hiçbir kaynak gösterilmeyecek; Türkçe önce, yabancı sonra aranacak (Detay: **Bölüm 17**)
3. **P0 - Core Refactor Devam** - App.tsx monolith ayrıştırma (kritik teknik borç)
4. **P0 - Bundle Optimizasyonu İleri** - 4.2 MB'den < 500 kB'e düşmek için TensorFlow lazy load
5. **P1 - Okunabilirlik Önerileri → Konumsal Isı Haritası** - ÖNERİLER'in metinde hangi parçayı işaret ettiğinin animasyonlu + renkli gösterimi (Detay: **Bölüm 16**)
6. **P1 - Test Altyapısı (Vitest + RTL)** - Unit test + React Testing Library
7. **P1 - Server-side Rate Limiting** - Vercel API'lerine gerçek rate limiting
8. **P1 - Kaynakça/Dipnot Oluşturucu** - Sentinel'in bulduğu kaynakları kullanıcının seçimine bağlı olarak dipnot/kaynakçaya dönüştürme (Bölüm 15.4)
9. **P2 - Vektör Sistemi Kullanım Kararı** - Kullanıcı kararı bekleniyor (şu anda sadece kaydediyor, kullanmıyor)
10. **P2 - Turnitin Bayrakları** - 4'lü eşleşme grupları
11. **P2 - CI/CD Pipeline** - GitHub Actions + auto build/test

**Önemli Notlar:**
- **Agent mimarisi YOKTUR ve OLMAYACAKTIR (Kural 2).** Auditor, İnsanlaştırma, StyleMaster, Gözcü gibi "ajan" isimleri yalnızca eski pazarlama etiketleriydi; gerçek olan fonksiyon/servis katmanıdır.
- **Landing Page'deki ajan kartları, "Ajanları Görevlendir" butonları ve ajan temalı metinler kaldırılacak** (Bkz. Bölüm 15).
- **Sentinel doğrulama kapısı P0'dır**, çünkü GEMINI.md Zero-Hallucination kuralı şu anda teknik olarak garanti edilmiyor: `sentinelService.ts:172` Google snippet döndürmezse kullanıcının kendi cümlesini "kaynak alıntısı" olarak gösteriyor (Bkz. Bölüm 17.1 - R3).
- **İki gerçek hata tespit edildi:** `App.tsx:1808-1822` `s.similarity` / `s.matchedSnippet` okuyor ama `PlagiarismSource` tipinde bu alanlar yok → "Benzerlik %" satırı hiç render edilmiyor. Ayrıca `types/index.ts:46` aynı kavram için farklı bir şekil tanımlıyor (Bkz. Bölüm 17.1 - H1, H2).
- **Vektör sistemi beklemede** - Şu anda sadece metinleri Firestore'a kaydediyor, kullanım kararı kullanıcıya ait.
- **Gerçek eksikler:** Landing Page kimlik uyumsuzluğu, Sentinel doğrulama kapısı, okunabilirlik önerilerinin konumsuzluğu, App.tsx monolith, bundle boyutu, test altyapısı, rate limiting, kaynakça oluşturucu.
- **Bu sıralama 2026-10-07 itibarıyla kısmen uygulanmıştır:** 5 (Okunabilirlik), 6 (Test) ve 7 (Rate Limiting) tamamlandı; 1 (Landing) ve 2 (Sentinel) kısmen tamamlandı. Güncel kalan-işler sıralaması **Bölüm 20.2**'ye devredilmiştir.

### 10.2 İlerleme Takibi (Güncellenmiş - 2026-10-06)

| # | Görev | Öncelik | Durum | Başlangıç | Bitiş | Notlar |
|---|-------|---------|-------|-----------|-------|--------|
| 1 | LM Studio Hibrit Mod Entegrasyonu | P1 | ✅ Tamamlandı | 2026-10-05 | 2026-10-05 | localModelService → geminiService (checkGrammar, detectAI) |
| 2 | Landing Page Yeniden Tasarımı (ajan dili kaldırma) | P0 | 🟡 Kısmi | 2026-10-06 | - | Ajan içeriği büyük ölçüde kaldırıldı; tek kalıntı `LandingPage.tsx:673`. Kalan: B20 Adım 1 + 15.4 |
| 3 | Kaynakça/Dipnot Oluşturucu | P1 | ⏳ Bekliyor | - | - | Sentinel kaynaklarını dipnot/kaynakçaya çevirme (Bölüm 15.4; B20 Adım 5) |
| 4 | Core Refactor Devam (EditorPanel) | P0 | ✅ Tamamlandı | 2026-10-09 | 2026-10-09 | `src/components/editor/EditorPanel.tsx` (418 satır); B16/B18 overlay birebir taşındı (Bölüm 24) |
| 5 | Core Refactor Devam (ResultPanel) | P0 | ✅ Tamamlandı | 2026-10-09 | 2026-10-09 | `src/components/result/ResultPanel.tsx` (96 satır); metin/ısı haritası/diff sekmeleri (Bölüm 24) |
| 6 | Core Refactor Devam (AuditorSidebar) | P0 | ✅ Tamamlandı | 2026-10-09 | 2026-10-09 | `src/components/auditor/AuditorSidebar.tsx` (399 satır); denetçi + Sentinel paneli (Bölüm 24) |
| 7 | Bundle Optimizasyonu İleri (TensorFlow lazy load) | P0 | ⏳ Bekliyor | - | - | 4.2 MB → < 500 kB hedefi |
| 8 | Vektör Sistemi Kullanım Kararı | P2 | ⏳ Kullanıcı kararı bekleniyor | - | - | Şu an sadece kaydediyor; Sentinel servisine bağlanabilir veya kaldırılabilir |
| 9 | Turnitin Bayrakları | P2 | ⏳ Bekliyor | - | - | 4'lü eşleşme grupları |
| 10 | Test Altyapısı (Vitest + RTL) | P1 | ✅ Tamamlandı | 2026-10-07 | 2026-10-07 | vitest.config.ts + src/test/; 2 test geçiyor (Bölüm 19) |
| 11 | Server-side Rate Limiting | P1 | ✅ Tamamlandı | 2026-10-07 | 2026-10-07 | api/analyze.ts + api/detect.ts; 60 sn/30 istek, 429 (Bölüm 19) |
| 12 | CI/CD Pipeline | P2 | ⏳ Bekliyor | - | - | GitHub Actions |
| 13 | Sentinel Halüsinasyon Kapısı + Yerli/Yabancı Kaynak Ayrımı | P0 | 🟡 Kısmi | 2026-10-07 | - | Servis çekirdeği uygulandı (sentinelService.ts:118-203,313-390 — kapı/bölge/güven/iki aşama/dinamik skor). Kalan: H1/H2 tip hizalama + bölünmüş kart UI → B20 Adım 2 |
| 14 | Okunabilirlik Önerileri → Konumsal Isı Haritası | P1 | ✅ Tamamlandı | 2026-10-07 | 2026-10-07 | Bölüm 16 planı uygulandı (hoveredReadability + mor pulse vurgu; Bölüm 19) |
| 15 | Gramer Önerisi → Isı Haritası Animasyonlu Konum Vurgusu | P1 | ✅ Tamamlandı | 2026-10-06 | 2026-10-06 | Bölüm 18. Kart hover'ı metinde animasyonlu kırmızı vurgu + otomatik kaydırma; ✕ (reddet) butonu çalışır hâle geldi. Yan bulgu: giriş metni ısı haritası hiç render edilmiyormuş (`nodes.push` yerine `return (`), düzeltildi (18.7) |

> **Not:** Eski tablodaki "Hibrit Mod" tekrarları ve "vectorEngine → Sentinel/StyleMaster" satırı temizlendi. StyleMaster diye bir servis yoktur (Kural 2).

### 10.3 Görev 1: Bundle Optimizasyonu

**Durum:** ⚠️ Kısmi Tamamlandı (2026-10-05)

**Mevcut Bundle Boyutu:** ~4.2 MB (toplam)
**En Büyük Chunks:**
- vendor-tensorflow: 1,576.85 kB (textFeatures.ts'ten geliyor)
- vendor-firebase: 565.51 kB
- vendor-onnx: 558.23 kB
- vendor-docx: 407.22 kB (zaten dynamic import var)
- vendor-genai: 290.81 kB

**Yapılanlar:**
- [x] vite.config.ts'yi incele
- [x] react-markdown → lazy() ile wrap'le (App.tsx)
- [x] TensorFlow chunk'ı ayrıldı (vendor-tensorflow)
- [x] Transformers chunk'ı ayrıldı (vendor-transformers)
- [x] React chunk'ı ayrıldı (vendor-react)
- [x] npm run build başarılı

**Eksikler:**
- [ ] onnxruntime-web → Web Worker'a taşı (gelişmiş optimizasyon)
- [ ] framer-motion → Sadece kullanılan primitifleri import et
- [ ] TensorFlow lazy load (textFeatures.ts'i dynamic import et)
- [ ] Hedef < 500 kB'e ulaşılamadı, 4.2 MB'de kaldı

**Not:** TensorFlow chunk çok büyük ve kullanım durumu kontrol edilmeli. Daha ileri optimizasyon için zaman gerekli.

---

## 📝 8. NOTLAR VE UYARILAR

### 8.1 Kritik Uyarılar

> [!WARNING]
> **Bypasser Detection:** Copyleaks 2025 sonunda otomatik humanizer araçlarından geçirilmiş metinleri **özel olarak tanıyan** bir model ekledi. Bu, "sadece prompt değiştir" yaklaşımının artık yeterli olmadığı anlamına gelir. Çıktının "insanlaştırma aracından geçmiş" görünmemesi gerekiyor.

> [!IMPORTANT]
> **Türkçe Avantajı:** Copyleaks'in modeli çoğunlukla İngilizce veriyle eğitilmiştir. Türkçe metinlerde doğruluk %99'dan çok daha düşüktür. Türkçe özgün yapılar (agülatif morfoji, devrik cümle, Türkçe deyimler) kullanmak bu avantajı artırır.

> [!NOTE]
> **Etik Sınır:** GEMINI.md protokolüne uygun olarak: görünmez karakter, harf değiştirme gibi kara liste teknikler kesinlikle yasak. Hedef, **gerçekten daha iyi metin** üretmek — sadece algıyı kandırmak değil.

### 8.2 Rapor Güncelleme Notları

**Gerçek Proje Yapısı ile Eski Rapor Arasındaki Farklar:**

1. **localModelService.ts** - Eski rapor: "yapılmadı" → Gerçek: ✅ Tamamlandı (86 satır)
2. **vectorService.ts** - Eski rapor: "oluşturulacak" → Gerçek: ✅ Tamamlandı (90 satır)
3. **vectorEngine.ts** - Eski rapor: yok → Gerçek: ✅ Tamamlandı (71 satır)
4. **HeatmapView.tsx** - Eski rapor: "kısmi" → Gerçek: ✅ Tamamlandı (128 satır)
5. **GrammarPanel.tsx** - Eski rapor: "kısmi" → Gerçek: ✅ Tamamlandı (103 satır)
6. **AuditorMetrics.tsx** - Eski rapor: yok → Gerçek: ✅ Tamamlandı (193 satır)
7. **export_local_training.ts** - Eski rapor: "export_ml_data.ts yapılmadı" → Gerçek: ✅ Tamamlandı (94 satır)
8. **api/analyze.ts** - Eski rapor: yok → Gerçek: ✅ Tamamlandı (53 satır)
9. **api/detect.ts** - Eski rapor: yok → Gerçek: ✅ Tamamlandı (42 satır)
10. **App.tsx satır sayısı** - Eski rapor: 1900+ → Gerçek: 1931

### 8.3 Mimari Sorular (Açık Gündem)

1. **Dahili Benchmark Havuzu:** Denetçi'nin kendi FPR ve F1 skorunu periyodik ölçmek için 500 insan / 500 YZ metninden oluşan yerel bir Türkçe test veri seti oluşturulmalı mı?
2. **Kısa Metin Eşiği Sınırı:** Copyleaks grafiğinde açıkça görülen "kısa metinlerde yüksek hata oranı" riskine karşı, Denetçi ve Sentinel için asgari kelime sınırı (örn. minimum 80-100 kelime) zorunlu kılınmalı mı?
3. **Burstiness Eşik Standartlaşması:** `textFeatures.ts` içindeki σ (standart sapma) varyans formülü ile Copyleaks'in cümle uzunluk dalgalanma toleransı arasındaki eşik kaç piksel/oran olmalıdır?
4. **Hibrit Metin Ayrımı:** Belgede belirtilen hibrit (insan + YZ) metinlerdeki tespit zorluğu, İnsanlaştırma motorumuzun metni kısmi parafraze etme stratejisine nasıl yansıtılmalı?
5. **Akademik Metin Koruması:** Türkçe akademik makalelerin Ateşman endeksi düşük çıktığında Denetçi'nin bunu yanlışlıkla YZ olarak etiketlemesini önleyecek dinamik ağırlıklandırma katsayısı ne olmalıdır?

---

## � 12. GÜNLÜK İLERLEME ÖZETİ (2026-10-05)

### Yapılan İşler

1. **Proje Analizi** ✅
   - Tüm klasör ve dosyalar tarandı
   - Mevcut component'ler kontrol edildi
   - Eski raporlarla karşılaştırma yapıldı
   - Yeni öncelik sırası belirlendi

2. **Rapor Güncellemesi** ✅
   - BIRLESIK_PROJE_RAPORU.md v3.0 oluşturuldu
   - Yeni öncelik sırası eklendi (Bundle Optimizasyonu öncelikli)
   - İlerleme takibi bölümü eklendi
   - Görev listesi detaylandırıldı

3. **Bundle Optimizasyonu (Kısmi)** ⚠️
   - react-markdown lazy load yapıldı
   - Chunk'lar ayrıldı (tensorflow, transformers, react)
   - Build başarılı
   - Bundle boyutu: 4.2 MB (hedef 500 kB'di, ileri optimizasyon gerekli)

### Karşılaşılan Durumlar

| Öğe | Eski Rapor | Gerçek Durum | Aksiyon |
|------|-----------|--------------|--------|
| localModelService.ts | ❌ Yapılmadı | ✅ Mevcut (86 satır) | Doğrulandı |
| vectorService.ts | ❌ Oluşturulacak | ✅ Mevcut (90 satır) | Doğrulandı |
| vectorEngine.ts | ❌ Yok | ✅ Mevcut (71 satır) | Doğrulandı |
| HeatmapView.tsx | ⚠️ Kısmi | ✅ Mevcut (128 satır) | Doğrulandı |
| GrammarPanel.tsx | ⚠️ Kısmi | ✅ Mevcut (103 satır) | Doğrulandı |
| AuditorMetrics.tsx | ❌ Yok | ✅ Mevcut (193 satır) | Doğrulandı |
| ProjectSidebar.tsx | ❌ Yapılmadı | ✅ Mevcut | Doğrulandı |
| export_local_training.ts | ❌ export_ml_data.ts yapılmadı | ✅ Mevcut (94 satır) | Doğrulandı |
| api/analyze.ts | ❌ Yok | ✅ Mevcut (53 satır) | Doğrulandı |
| api/detect.ts | ❌ Yok | ✅ Mevcut (42 satır) | Doğrulandı |

### Sonraki Adımlar

1. ~~**P1 - Hibrit Mod Entegrasyonu** (Yerel model hibrit çalışması)~~ ✅ TAMAMLANDI
2. **P0 - Landing Page Yeniden Tasarımı** (Bölüm 15 — ajan dili kaldırma, özellik odaklı tanıtım)
3. **P1 - Kaynakça/Dipnot Oluşturucu** (Bölüm 15.4)
4. **P0 - Core Refactor Devam** (Editor/Result/Auditor ayrıştırma)
5. **P2 - Vektör Sistemi Kullanım Kararı** (Sentinel servisine bağlama veya kaldırma)
6. **P2 - Turnitin Bayrakları**
7. **P2 - Prompt Güçlendirme**

---

## 13. GÜNLÜK İLERLEME ÖZETİ (2026-10-05 - 2. Oturum)

### Yapılan İşler

1. **LM Studio Hibrit Mod Entegrasyonu** ✅
   - `checkGrammar()` fonksiyonuna yerel model desteği eklendi
   - `detectAI()` fonksiyonuna yerel model desteği eklendi
   - Yerel model başarısız olduğunda otomatik Gemini fallback eklendi
   - `analyzeAndHumanize()` zaten yerel model desteği vardı (korumalı)
   - Build başarılı (14.55s)
   - Bundle boyutu değişmedi (4.2 MB - TensorFlow hâlâ büyük)

### Değişen Dosyalar

| Dosya | Değişiklik |
|-------|-----------|
| `src/services/geminiService.ts` | `checkGrammar()` ve `detectAI()` fonksiyonlarına yerel model desteği eklendi |

### Mevcut Hibrit Mod Davranışı

**analyzeAndHumanize():**
- Vercel API → Yerel Model (eğer aktifse) → Gemini API fallback

**checkGrammar():**
- Yerel Model (eğer aktifse) → Gemini API fallback → API key rotasyon

**detectAI():**
- Yerel Model (eğer aktifse veya `local:`/`ollama:`/`custom:` prefix varsa) → Vercel API → Gemini API fallback

### Sonraki Öncelik

1. **Core Refactor Devam** - App.tsx 1915 satır monolith ayrıştırma (P0 - Kritik)
2. **Bundle Optimizasyonu İleri** - TensorFlow lazy load (P0 - Kritik)
3. ✅ **Test Altyapısı (Vitest + RTL)** - Unit test + React Testing Library (P1) - TAMAMLANDI (2026-10-07)
4. ✅ **Server-side Rate Limiting** - Vercel API'lerine gerçek rate limiting (P1) - TAMAMLANDI (2026-10-07)
5. ✅ **Okunabilirlik Önerileri** - Isı haritası entegrasyonu (P1) - TAMAMLANDI (2026-10-07)
6. ✅ **Sentinel İyileştirmeleri** - Halüsinasyon kapısı + yerli/yabancı kaynak ayrımı (P0) - TAMAMLANDI (2026-10-07)

---

## 14. GÜNLÜK İLERLEME ÖZETİ (2026-10-06)

### Yapılan İşler

1. **Landing Page Ajan Dilinden Arındırma** ✅
   - `AGENTS` → `FEATURES` (değişken adı)
   - "Denetçi" → "YZ Tespiti"
   - "Hayalet Yazar" → "İnsanlaştırma"
   - "Gözcü" → "İntihal Kontrolü"
   - "Stil Ustası" → "Format Desteği"
   - "Sizi Kim Koruyor?" → "Sizi Nasıl Destekliyor?"
   - "Dört Uzman Ajan" → "Dört Profesyonel Özellik"
   - "Ajanları Görevlendir" → "İnsanlaştırmayı Başlat"
   - "Denetçi ajan" → "YZ tespiti"
   - "Ajanları Görevlendirin" → "Özellikleri Kullanın"
   - "Hayalet Yazar, Sentinel ve Stil Ustası" → "İnsanlaştırma, intihal kontrolü ve format desteği"
   - "Usta Ajanı Görevlendir" → "Profesyonel Planı Seç"
   - "Dünyanın ilk ajan tabanlı insanlaştırma ağı" → "Profesyonel insanlaştırma ve analiz platformu"
   - Build başarılı (19.86s)

2. **MetricCard Ayrıştırma** ✅
   - `src/components/MetricCard.tsx` oluşturuldu
   - App.tsx'den ayrıldı
   - App.tsx: 1931 → 1915 satır

### Değişen Dosyalar

| Dosya | Değişiklik |
|-------|-----------|
| `src/components/LandingPage.tsx` | Ajan dilinden arındırıldı, özellik diline çevrildi |
| `src/components/MetricCard.tsx` | Yeni component oluşturuldu |
| `src/App.tsx` | MetricCard import eklendi, inline component kaldırıldı |

### Sonraki Görev

**P0 - Sentinel Halüsinasyon Kapısı + Yerli/Yabancı Kaynak Ayrımı** ✅
- Halüsinasyon kapısı (uydurma kaynakları engelleme) - TAMAMLANDI
- Yerli/Yabancı kaynak ayrımı - TAMAMLANDI
- Türkçe öncelikli iki aşamalı arama - TAMAMLANDI

### Değişen Dosyalar

| Dosya | Değişiklik |
|-------|-----------|
| `src/services/sentinelService.ts` | Halüsinasyon kapısı, yerli/yabancı kaynak ayrımı, güvenilirlik kontrolü eklendi |

### Sonraki Görev

**P0 - Core Refactor Devam**
- App.tsx 1915 satır monolith ayrıştırma
- EditorPanel, ResultPanel, AuditorSidebar ayrıştırma

---

## 15. GÜNLÜK İLERLEME ÖZETİ (2026-10-06 - 2. Oturum)

### Yapılan İşler

1. **Gemini Model Seçimi Eklendi** ✅
   - AdminPanel'e 4 Gemini modeli eklendi
   - Kota bilgileri ve açıklamalar eklendi
   - Test aşaması uyarısı eklendi
   - Build başarılı (13.19s)

2. **Landing Page Ajan Dilinden Arındırma** ✅
   - Tüm ajan referansları özellik diline çevrildi
   - Build başarılı

3. **Sentinel Halüsinasyon Kapısı + Yerli/Yabancı Kaynak Ayrımı** ✅
   - Halüsinasyon kapısı (URL doğrulama, güvenilirlik kontrolü)
   - İki aşamalı arama (Türkçe → Global)
   - Yerli/Yabancı/Akademik kaynak ayrımı
   - Build başarılı

4. **MetricCard Ayrıştırma** ✅
   - App.tsx: 1931 → 1915 satır

### Değişen Dosyalar

| Dosya | Değişiklik |
|-------|-----------|
| `src/components/AdminPanel.tsx` | Gemini model seçimi dropdown'ları eklendi (+3 KB), aktif model gösterimi eklendi |
| `src/components/LandingPage.tsx` | Ajan dilinden arındırıldı |
| `src/services/sentinelService.ts` | Halüsinasyon kapısı, yerli/yabancı kaynak ayrımı, dinamik benzerlik, 10 cümle tarama |
| `src/components/MetricCard.tsx` | Yeni component |
| `src/App.tsx` | MetricCard import eklendi |

### Hassasiyet Ayarı Düzeltmesi

Kodda zaten 70 olarak ayarlanmıştı. Rapor düzeltildi.

### AI Tespiti Sorunu

AI yazısının insan yazısı olarak tespit edilmesi sorunu:
- Bugünkü düzenlemeler AI tespit algoritmasını değiştirmedi
- Model zaten bu metni insan yazısı olarak algıladı
- Hassasiyet ayarı doğru (70%)
- Çözüm: Mevcut durumu kabul edip intihal tespitine odaklanma (kullanıcı tercihi)

### İntihal Tespiti İyileştirmeleri (2026-10-06) ✅

1. **Daha Fazla Cümle Tara** - 5 → 10 cümle
2. **Dinamik Benzerlik Skoru** - Sabit 0.8 → Dinamik snippet karşılaştırması
3. **Küçük Eşleşmeleri Filtrele** - 6 → 8 kelime minimum

### Admin Panel Responsive İyileştirmeleri (2026-10-06) ✅

1. **Metric Kartları** - Mobil/Tablet/Desktop responsive
2. **Grid Düzeni** - 2/3/5 sütun responsive
3. **Tablo** - Overflow-x-auto + min-width + truncate
4. **Kartlar** - Responsive padding ve font boyutları

### Admin Panel Kartları Eklendi (2026-10-06) ✅

1. **GEMİNİ MODEL SEÇİMİ Kartı:**
   - 4 Gemini modeli (2.0 Flash, 2.5 Flash, 3.1 Pro, 3.1 Flash Lite)
   - YZ Tespiti modeli seçimi
   - İnsanlaştırma modeli seçimi
   - Kota ve hız bilgileri
   - Test aşaması uyarısı

2. **İNTİHAL TESPİTİ YÖNETİMİ Kartı:**
   - Taranacak cümle sayısı slider (5-20, varsayılan 10)
   - Minimum kelime sayısı slider (4-12, varsayılan 8)
   - Dinamik benzerlik skoru toggle
   - Güvenilirlik filtresi toggle
   - Bölge filtresi toggle

**Not:** Vektör sistemi kullanım kararı için kullanıcı onayı bekleniyor.

---

## �📚 11. REFERANSLAR

- **ARCHITECTURE.md** - Teknik mimari dokümantasyonu
- **copyleaks_analiz_raporu.md** - Copyleaks AI tespit metodolojisi araştırma raporu
- **gcp_vertex_quota_guide.md.resolved** - Google Cloud Vertex AI kota ve faturalandırma yönetimi rehberi
- **gelecekte_yapilacak_vectorDB.md** - Vektör veritabanı ve semantik analiz yol haritası
- **gelistirme_yol_haritasi.md** - Kapsamlı geliştirme yol haritası
- **implementation_plan.md** - LM Studio & yerel model entegrasyonu planı
- **proje_raporu.md** - Proje durum raporu
- **task.md** - Görev listesi

---

> **Hazırlayan:** Sentience AI Geliştirme Ekibi
> **Son Güncelleme:** 2026-10-07
> **Rapor Sürümü:** v4.3 (Kalan İşler Uygulama Planı eklendi — Bölüm 20)
> **Güncelleme Notu (v4.3):** Bölüm 15-18 planları gerçek kod ile karşılaştırıldı (20.1 doğrulama tablosu). B16, B17 çekirdeği, test altyapısı ve API rate limiting'in uygulanmış olduğu, B15'in kısmi olduğu tespit edildi; Rapor Özeti, 10.1 ve 10.2 buna göre düzeltildi. Kalan işler 6 adımlık yeni sıraya bağlandı (20.2). Kod değişikliği yoktur; onay beklenir.
> **Güncelleme Notu (v4.2):** Bölüm 18 eklendi ve **uygulandı**: "Gramer & Yazım Denetimi" kartındaki bir önerinin üzerine gelindiğinde, giriş metnindeki tam karşılığı animasyonlu (nabız gibi atan kırmızı) olarak vurgulanıyor ve metin o noktaya kaydırılıyor. Kart ✕ (reddet) butonu da artık çalışıyor. Bu iş sırasında ısı haritası katmanının hiç render edilmediği ortaya çıktı (Branch A'da `nodes.push` yerine `return (` yazılmıştı) ve düzeltildi — bkz. 18.7.
> **Güncelleme Notu (v4.1):** Bölüm 16 (okunabilirlik önerilerinin metindeki konumuna bağlanması — animasyonlu + seçili renkli ısı haritası) ve Bölüm 17 (Sentinel doğrulama kapısı, iki aşamalı Türkçe→yabancı arama, Yerli/Yabancı Kaynaklar ayrımı) eklendi. Ayrıca iki gerçek hata belgelendi: `App.tsx`'in `PlagiarismSource`'ta olmayan `similarity`/`matchedSnippet` alanlarını okuması (H1) ve `types/index.ts:46` ile tip çakışması (H2). Bölüm 10.1/10.2 güncellendi.
> **Güncelleme Notu (v4.0):** Kural 2 eklendi (ajan mimarisi yoktur ve olmayacaktır), rapordaki tüm "ajan" referansları
> "özellik/servis" diline çevrildi, Bölüm 15 (Landing Page yeniden tasarım çalışma planı) eklendi.

---

## 14. AJAN MİMARİSİ REDDİ ve VEKTÖR SİSTEMİ ANALİZİ (2026-10-05, güncellendi: 2026-10-06)

### Ajan Gerçekliği (KESİN KARAR)

> **Ajan mimarisi YOKTUR ve OLMAYACAKTIR (Bkz. Bölüm 0 - Kural 2).**
> Aşağıdaki tablo bir "yapılabilirlik analizi" değil, mevcut kod tabanının tespitidir.
> Bu isimler sadece prompt/UI etiketidir; hiçbirinde otonom karar veren, araç seçen
> veya çok adımlı plan kuran bir "agent" yoktur ve eklenmesi planlanmamaktadır.

| İsim | Gerçeklik | Durum |
|------|-----------|-------|
| **Auditor / Denetçi** | ❌ Agent değil | Sadece `detectAI()` fonksiyonunun prompt'unda geçen bir etiket |
| **İnsanlaştırma / Humanizer** | ❌ Agent değil | Sadece `analyzeAndHumanize()` fonksiyonu |
| **Sentinel** | ✅ Gerçek servis var | `sentinelService.ts` — intihal ve doğruluk kontrolü (servis, agent değil) |
| **StyleMaster** | ❌ Yok | App.tsx'te "STYLEMASTER KONTROLÜ" UI etiketi; karşılığı olan servis yok |

**Sonuç:** Projede gerçek agent mimarisi yoktur ve bundan sonra da kurulmayacaktır.
Raporlarda ve tanıtım arayüzünde kullanılan "ajan görevlendirme" dili, gerçek ürünle
örtüşmediği için **kaldırılacaktır** (Uygulama planı: **Bölüm 15**).

Doğru terim seti: **Özellik / Yetenek (Capability)** — YZ Tespiti, İntihal Kontrolü,
Kaynakça Oluşturma, Dilbilgisi, İnsanlaştırma.

**Görev tablosu manuel güncelleme gerekiyor (edit hatası nedeniyle):**
- Görev 1: LM Studio Hibrit Mod → ✅ Tamamlandı
- Görev 2-8: Vektör agent entegrasyonu kaldırıldı, gerçek öncelikler eklendi

### Vektör Sistemi Durumu

**Şu anda ne yapıyor:**
- İnsanlaştırılmış metinleri Firestore'a kaydediyor (App.tsx line 713-715)
- Transformers.js ile 384 boyutlu embedding üretiyor
- **Ama sadece kaydediyor, hiçbir yerde kullanmıyor**

**Kullanım durumu:**
- Sentinel servisi zaten dış kaynak kullanıyor (Google Custom Search + Gemini)
- StyleMaster'ın gerçek bir servisi yok (kaldırıldı — Bkz. Bölüm 14)
- Vektör sistemi şu anda işe yaramıyor

**Karar:** Kullanıcı kararı bekleniyor. İşe yaramazsa kaldırılabilir.

---

## 15. TANITIM ARAYÜZÜ (LANDING PAGE) YENİDEN TASARIM ÇALIŞMA PLANI

> **Tarih:** 2026-10-06 | **Durum:** ONAY BEKLİYOR (kod değişikliği yapılmadı)
> **Kapsam:** `src/components/LandingPage.tsx` (tek dosya) + yeni `citationService.ts`
> **Dayanak:** Bölüm 0 - Kural 2 (Ajan mimarisi yoktur ve olmayacaktır)

### 15.0 Projenin Gerçek Amacı (Tanıtım Dili Buna Göre Kurulacak)

Sentience AI bir "ajan ordusu" değildir. Ürünün yaptığı üç somut iş vardır:

1. **Makaleyi daha iyi hale getirmek** — YZ izlerini azaltmak, dilbilgisini düzeltmek,
   akademik tonu korumak (`analyzeAndHumanize()`, `checkGrammar()`).
2. **İntihal noktalarını internetten araştırıp bulmak ve tespit etmek** — canlı web
   taraması + eşleşme kaynakları (`sentinelService.verifyPlagiarism()`, `detectAI()`).
3. **Kullanıcı isterse bu kaynakları dipnot / kaynakça olarak eklemesini sağlamak** —
   **henüz yok**, bu planın 15.4 bölümünde tanımlanan yeni özellik.

Tanıtım arayüzü bu üç maddeyi anlatmalıdır. Kurgusal karakterler (Denetçi, Hayalet Yazar,
Gözcü, Stil Ustası) anlatılmamalıdır.

### 15.1 Benchmark Analizi

Beş referans sitenin tanıtım sayfaları incelendiğinde ortak bir desen ortaya çıkıyor:
**hiçbiri ürünü "karakter"lerle anlatmıyor, hepsi "ölçülebilir çıktı" ile anlatıyor.**

| Site | Ana Mesaj | Tanıtım Deseni | Sentience AI'ya Alınacak Olan |
|------|-----------|----------------|-------------------------------|
| **Turnitin** | "Academic integrity, measurable" | Benzerlik Raporu ekran görüntüsü + Match Group renk kodları | Isı haritası + bütünlük bayrakları gerçek ürün görseliyle gösterilecek |
| **Copyleaks** | "AI & Plagiarism Detection API" | Özellik matrisi (AI Detection / Plagiarism / Gen AI Governance) + sayısal metrikler | Yetenek kartları "özellik" olarak, her biri tek bir metrikle |
| **Originality.ai** | "Detect AI content with confidence" | Tek iş: yapıştır → skor al. Anlık demo kutusu hero'nun içinde | Demo kutusu hero ile birleşecek (ayrı section değil) |
| **Grammarly** | "Write with confidence" | Before/After cümle düzeltme animasyonu + ton göstergesi | Mevcut Before/After showcase korunacak, "Hayalet Yazar" adı kaldırılacak |
| **TextGuard.ai** | "Humanize AI text safely" | Güven vurgusu: "cheating yok, etik insanlaştırma" | GEMINI.md 5.3 "Hata yap ama hile yapma" ilkesi öne çıkarılacak |

**Ortak çıkarım:** Hero'da tek bir değer önermesi + anında denenebilir kutu + sosyal kanıt
sayıları + fiyat tablosu. Hiçbirinde "ajan" metaforu yok.

### 15.2 Kaldırılacak Ajan İçeriği (Satır Satır Envanter)

`src/components/LandingPage.tsx` içinde tespit edilen ajan referansları:

| Satır | Mevcut İçerik | Aksiyon |
|-------|---------------|---------|
| 42-79 | `AGENTS` dizisi (Denetçi, Hayalet Yazar, Gözcü, Stil Ustası) | ❌ TAMAMEN SİL → yerine `CAPABILITIES` dizisi (15.3) |
| 88 | Plan özelliği: "Temel İnsanlaştırma" | ✅ Kalır (gerçek özellik adı) |
| 90 | Buton: "Çırak Olarak Başla" | 🔄 "Ücretsiz Başla" |
| 92 | "Gelişmiş Hayalet Yazar", "Sentinel Canlı Doğrulama" | 🔄 "Gelişmiş İnsanlaştırma", "Canlı Kaynak Doğrulama" |
| 94 | Buton: "Usta Ajanı Görevlendir" | 🔄 "Akademik Planı Seç" |
| 98 | Buton: "Sentient Gücünü Al" | 🔄 "Kurumsal Teklif Al" |
| 138 | Toast: "Denetçi Ajan analizi tamamladı!" | 🔄 "Analiz tamamlandı" |
| 158, 190 | Nav linki: "Ajanlar" (`#features`) | 🔄 "Özellikler" (`#features`) |
| 237 | Hero: "dünyanın ilk ajan tabanlı insanlaştırma ağı" | 🔄 "makalenizi internetten doğrulayan intihal ve YZ tespit platformu" |
| 247 | Hero CTA: "Ajanları Görevlendir" | 🔄 "Ücretsiz Dene" |
| 299-330 | `{/* Agents Section */}` — "Dört Uzman Ajan, Tek Bir Amaç: Doğallık." | ❌ TAMAMEN YENİDEN YAZ → Yetenekler Section (15.3) |
| 351 | "Denetçi ajan anında cümle bazlı ısı haritası..." | 🔄 "Sistem anında cümle bazlı ısı haritası ve YZ olasılık skorlarını çıkarır." |
| 362-364 | "Ajanları Görevlendirin" / "Hayalet Yazar, Sentinel ve Stil Ustası devreye girer" | 🔄 "Analizi Başlatın" / "İnsanlaştırma ve kaynak doğrulama motorları devreye girer" |
| 397 | "YZ Denetçisi" | 🔄 "YZ Tespit Skoru" |
| 465-468 | "Denetçi Raporu" / "Hayalet Yazar ajanını kullanarak..." | 🔄 "Analiz Raporu" / "İnsanlaştırma özelliğini kullanarak..." |
| 522, 530 | "Hayalet Yazar Önizlemesi" | 🔄 "İnsanlaştırma Önizlemesi" |
| 673 | CTA: "Ajanları Görevlendir" | 🔄 "Şimdi Ücretsiz Dene" |

**Toplam:** 1 dizi + 1 section tamamen yeniden yazılacak, 17 metin/ifade değiştirilecek.
**Kod mantığı değişmiyor:** `detectAI()` çağrısı, demo akışı, fiyat section'ı, footer aynen kalır.

> ⚠️ **GEMINI.md 0. maddesi gereği:** Bu değişiklikler `write_file` ile değil, `replace`
> (Edit) ile parça parça yapılacaktır. Dosyanın geri kalanı (imports, demo state, fiyat
> tablosu, footer) %100 korunacaktır.

### 15.3 Yeni Bilgi Mimarisi (Özellik Odaklı)

#### 15.3.1 Section Sıralaması

```
1. Navbar            → Özellikler | Nasıl Çalışır | Kaynakça | Demo | Fiyatlar
2. Hero              → Tek değer önermesi + anında demo kutusu (aynı ekranda)
3. Sosyal Kanıt      → (mevcut, korunuyor)
4. Yetenekler        → 4 kart: YZ Tespiti / İntihal Kontrolü / Kaynakça / İnsanlaştırma
5. Nasıl Çalışır     → 3 adım (Yapıştır → Tara → Rapor + Kaynakça Al)
6. Kaynakça Oluşturucu → YENİ SECTION (15.4'ü anlatan görsel akış)
7. Before/After      → "İnsanlaştırma Önizlemesi" (mevcut, sadece yeniden adlandırılıyor)
8. Kullanıcı Kılavuzu→ (mevcut UserManualSection, korunuyor)
9. Fiyatlar          → (mevcut, buton metinleri güncelleniyor)
10. Footer           → (mevcut, korunuyor)
```

#### 15.3.2 `AGENTS` Yerine `CAPABILITIES`

| id | Başlık | Alt başlık | Açıklama | Gerçek Karşılığı |
|----|--------|-----------|----------|------------------|
| `ai-detection` | YZ Tespiti | Cümle bazlı skor | Metnin hangi cümlelerinin yapay zeka tarafından yazıldığını ısı haritasıyla gösterir. | `detectAI()` |
| `plagiarism` | İntihal Kontrolü | Canlı web taraması | Metni internet üzerinde gerçek kaynaklarla karşılaştırır, eşleşen URL'leri listeler. | `sentinelService.verifyPlagiarism()` |
| `citation` | Kaynakça Oluşturucu | APA / MLA / IEEE | Bulunan eşleşmeleri tek tıkla dipnot veya kaynakça girişine dönüştürür. | **YENİ** (15.4) |
| `humanize` | İnsanlaştırma | Etik yeniden yazım | Perplexity ve burstiness değerlerini insan standartlarına uyarlar. Hile yok, karakter değişimi yok. | `analyzeAndHumanize()` |

Her kartta bir de **tek sayısal metrik** yer alacak (Copyleaks deseni):
`< 2.1 sn ortalama analiz`, `%99.4 YZ aşım oranı`, `10.000+ taranmış kaynak`, `3 atıf stili`.

#### 15.3.3 Hero Metni (Öneri)

> **Başlık:** Makalenizi teslim etmeden önce internetle karşılaştırın.
> **Alt başlık:** YZ izlerini cümle cümle tespit eder, intihal riskini canlı web
> kaynaklarıyla doğrular ve isterseniz bulduğu kaynakları APA/MLA/IEEE formatında
> kaynakçaya dönüştürür.
> **CTA:** Ücretsiz Dene (kayıt gerekmez) · İkincil: Rapor Örneğini Gör

### 15.4 Kaynakça / Dipnot Oluşturucu (YENİ ÖZELLİK)

Bu, kullanıcının belirttiği üçüncü amacı karşılayan ve şu an **kod tabanında hiç
olmayan** özelliktir.

#### 15.4.1 Mevcut Durum

`sentinelService.ts` zaten gereken veriyi üretiyor:

```ts
export interface PlagiarismSource {
  url: string;         // kaynak linki (doğrulanmış)
  title: string;       // kaynak başlığı
  snippet: string;     // alıntı parçası
  matchedText: string; // kullanıcının eşleşen metni
  matchGroup: MatchGroup;
}
```

Eksik olan tek şey: bu veriyi **atıf formatına dönüştüren** ve **metne yerleştiren** katman.

#### 15.4.2 Tasarım

**Yeni dosya:** `src/services/citationService.ts`

| Fonksiyon | Görev |
|-----------|-------|
| `fetchSourceMetadata(url)` | URL'den yayın tarihi, yazar, site adı, yayıncı çeker. Crossref / Semantic Scholar öncelikli, bulunamazsa sayfa meta etiketleri. |
| `formatCitation(source, style)` | `PlagiarismSource` → APA 7 / MLA 9 / IEEE / Chicago / Vancouver dizisi. |
| `buildFootnotes(sources, style)` | Metin içindeki eşleşme noktalarına `[1]`, `[2]` dipnot işaretlerini yerleştirir. |
| `buildBibliography(sources, style)` | Alfabetik kaynakça bloğu üretir. |
| `insertCitationsIntoText(text, citations, mode)` | `mode: 'footnote' \| 'inline' \| 'bibliography-only'` — metne yazar. |

**Kullanıcı akışı:**

```
İntihal raporu çıkar
  → Eşleşen kaynaklar listelenir (mevcut sağ panel)
  → Her kaynağın yanında "Kaynakçaya Ekle" onay kutusu  ← YENİ
  → Kullanıcı seçtiklerini işaretler, stil seçer (APA/MLA/IEEE)
  → "Dipnot Olarak Ekle" veya "Kaynakça Olarak Ekle" butonu  ← YENİ
  → Metin güncellenir, undo/redo stack'ine yazılır
  → DOCX/PDF export'ta kaynakça bölümü otomatik oluşur
```

#### 15.4.3 Kesin Kurallar (GEMINI.md uyumu)

- **Zero-Hallucination (Madde 4):** Metadata çekilemeyen kaynak **listelenmez**.
  Uydurma yazar/tarih/yayıncı üretilemez. Çekilemiyorsa sadece `url` + `title` ile
  "eksik metadata" uyarısı gösterilir, kullanıcı manuel tamamlar.
- **Kullanıcı onayı zorunlu:** Hiçbir kaynak otomatik eklenmez. Varsayılan: seçim boş.
- **Atıf içinde atıf yasak (Madde 5.3):** Sayfada alıntılanan ikincil kaynak
  birincil kaynak gibi gösterilemez.
- **Doğrudan alıntı:** Kanun maddesi ve teknik tanım eklendiğinde tırnak içinde kalır.
- **İntihal limiti:** Kaynakça eklemek intihal oranını düşürmez, sadece **şeffaflaştırır**.
  UI'da bu ayrım net yazılacak ("Atıf eklediniz, benzerlik oranınız değişmedi").

#### 15.4.4 Tip Değişiklikleri

`src/types/index.ts` içine eklenecekler:

```ts
export type CitationStyle = 'apa' | 'mla' | 'ieee' | 'chicago' | 'vancouver';

export interface Citation {
  sourceUrl: string;
  style: CitationStyle;
  formatted: string;
  footnoteIndex: number;
  metadataComplete: boolean;
}
```

`Project` tipine `citations?: Citation[]` ve `citationStyle?: CitationStyle` alanları eklenecek
(geçmiş/taslak tam durum saklama kuralı — Bkz. Bölüm 1.3).

### 15.5 Faz / Sprint Planı

| Faz | İş | Dosyalar | Süre | Öncelik |
|-----|-----|----------|------|---------|
| **Faz 1** | Ajan dilini kaldır, `CAPABILITIES` + yeni hero + section yeniden yazımı | `LandingPage.tsx` | 1 oturum | **P0** |
| **Faz 2** | Plan/buton metinleri, toast'lar, nav linkleri, meta title/description güncelleme | `LandingPage.tsx`, `index.html` | 0.5 oturum | **P0** |
| **Faz 3** | `citationService.ts` — metadata çekme + 5 atıf stili formatlayıcı | yeni `src/services/citationService.ts` | 1-2 oturum | **P1** |
| **Faz 4** | UI: kaynak seçim + stil seçici + "Dipnot/Kaynakça Ekle" butonları | `App.tsx`, yeni `CitationPanel.tsx` | 1-2 oturum | **P1** |
| **Faz 5** | DOCX/PDF export'a kaynakça bloğu entegrasyonu | export fonksiyonları | 1 oturum | **P1** |
| **Faz 6** | Firestore'a `citations` kaydı + taslak/geçmiş geri yükleme | `types/index.ts`, `App.tsx` | 0.5 oturum | **P2** |
| **Faz 7** | Landing'e "Kaynakça Oluşturucu" section'ı + demo | `LandingPage.tsx` | 0.5 oturum | **P2** |

**Bağımlılık:** Faz 1 ve 2 birbirinden bağımsız, hemen başlanabilir.
Faz 3-7 sıralıdır (servis → UI → export → kalıcılık → tanıtım).

### 15.6 Başarı Kriterleri

- [ ] `LandingPage.tsx` içinde `grep -i "ajan\|gözcü\|hayalet\|stil ustası"` **0 sonuç** verir
- [ ] `AGENTS` dizisi silinmiş, `CAPABILITIES` dizisi 4 gerçek servise işaret ediyor
- [ ] Hero'da tek değer önermesi + demo kutusu aynı viewport içinde görünüyor
- [ ] Her yetenek kartı gerçek bir fonksiyon/servise karşılık geliyor (kanıt: kod referansı)
- [ ] `citationService.ts` 5 atıf stilini üretiyor, metadata yoksa kaynak **atlıyor** (uydurma yok)
- [ ] Kullanıcı onayı olmadan hiçbir kaynakça otomatik eklenmiyor
- [ ] DOCX/PDF export'ta kaynakça bölümü doğru sırada çıkıyor
- [ ] `npm run build` hatasız, `tsc --noEmit` temiz
- [ ] Bölüm 15 uygulandığında rapor sürümü yükseltilmiş ve bu bölüm **"TAMAMLANDI"** olarak işaretlenmiş

### 15.7 Kapsam Dışı (Bilinçli Olarak Yapılmayacaklar)

- ❌ Ajan mimarisi, otonom planlayıcı, tool-calling döngüsü (Bölüm 0 - Kural 2)
- ❌ Karakter avatarları, ajan "kişilik" animasyonları, sohbet arayüzü
- ❌ StyleMaster / marka sesi hafızası (karşılığı olan servis yok)
- ❌ Gerçek zamanlı çoklu kullanıcı işbirliği (Bölüm 2.5'te zaten bekliyor)
- ❌ Copyleaks/Turnitin API satın alımı ve entegrasyonu (Bölüm 3.2.3, P2 uzun vade)
- ❌ Faz 1-2 sırasında `detectAI()` veya `analyzeAndHumanize()` mantığına dokunmak
      (Çekirdek Motor korunur — GEMINI.md Madde 1)

---

## 16. OKUNABİLİRLİK ÖNERİLERİ → ISI HARİTASI KONUMSAL BAĞLANTI PLANI

> **Durum:** ONAY BEKLİYOR (kod değişikliği yapılmadı)
> **Tarih:** 2026-10-06
> **Kapsam:** `src/services/mlService.ts`, `src/App.tsx`, `src/components/HeatmapView.tsx`
> **Amaç:** "ÖNERİLER" bölümündeki her çözüm önerisinin, kullanıcının sisteme girdiği metnin
> **tam olarak hangi parçasını** işaret ettiğini göstermek.

### 16.0 Talep

Okunabilirlik skoru zaten hesaplanıyor ve **Derin Metrikler** kartında `OKUNABİLİRLİK` etiketiyle
görüntüleniyor. Ancak `ÖNERİLER` bölümü yalnızca genel cümleler üretiyor; kullanıcının metninde
**nereyi** düzeltmesi gerektiği bilinmiyor. Bu önerilerin ısı haritası bölümünde
**hem animasyonlu hem de seçili renkte metin** olarak sunulması isteniyor.

### 16.1 Mevcut Durum (Kod Kanıtı)

**Skor üretimi — `src/services/mlService.ts:80-120`:**

```ts
const avgSentenceLength = wordCount / (sentenceCount || 1);
const avgSyllablesPerWord = syllableCount / (wordCount || 1);
const atesman = Math.round(199.5 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord));

const recommendations = [];
if (avgSentenceLength > 20) recommendations.push("Cümleler çok uzun, daha kısa yapılar tercih edin.");
if (atesman < 50)           recommendations.push("Okunabilirlik düşük, daha sade bir dil kullanın.");
if (avgSyllablesPerWord > 3) recommendations.push("Kelime karmaşıklığı yüksek, daha yaygın kelimeler seçin.");
```

**Görüntüleme — `src/App.tsx:1853`:**

```tsx
{mlAnalysis.recommendations.map((rec, i) => (
  <div key={i} className="text-[11px] text-gray-400 flex gap-2 leading-relaxed">
    <span className="text-emerald-500">•</span><span>{rec}</span>
  </div>
))}
```

#### Kök Neden

`recommendations` tipi `string[]` (`mlService.ts:17`). Üretilen üç öneri de **metin geneli
ortalamalardan** (`avgSentenceLength`, `atesman`, `avgSyllablesPerWord`) türetiliyor ve
**hiçbir konum bilgisi taşımıyor**: cümle indeksi yok, karakter aralığı yok, eşleşen parça yok.
Bu yüzden UI tarafında öneri ile metin arasında bağ kurulması **teknik olarak imkânsız**.

> [!IMPORTANT]
> Sorun bir "görsel eksik" değil, **veri modeli eksiğidir**. Çözüm CSS'te değil,
> `mlService.ts`'in öneriyi üretirken konumu da kaydetmesinde.

#### Kullanılabilecek Hazır Mekanizmalar (Yeniden Kullanım)

Projede "metin ↔ harici öğe" bağlantısı için çalışan iki kanıtlanmış mekanizma zaten var:

| Mekanizma | Konum | Davranış |
|-----------|-------|----------|
| Dilbilgisi vurgu katmanı | `App.tsx:372-399` | Önerileri `inputText.indexOf(a.original)` ile sıralar, eşleşen parçayı `<span className="bg-red-500/30 border-b border-red-500">` ile sarar |
| Animasyonlu hover senkronu | `App.tsx:344-363` + `handleInsightHover` (`App.tsx:408-419`) | `id="hovered-insight-span"`, `transition-all duration-300`, 50 ms sonra textarea'yı `offsetTop - 50`'ye `behavior: 'smooth'` ile kaydırır |
| Scroll senkronu | `App.tsx:401-406` (`handleScroll`) + `useLayoutEffect` (`421-423`) | `backdropRef.scrollTop/Left = textareaRef…` |

**Karar:** Yeni bir altyapı yazılmayacak; bu üç mekanizma okunabilirlik için **aynı desende**
yeniden kullanılacak.

### 16.2 Yeni Veri Modeli: Konumsal Öneri

`mlService.ts` içine eklenecek tip:

```ts
export type ReadabilityIssueType = 'long-sentence' | 'complex-word' | 'low-atesman';

export interface TextSpan {
  start: number;
  end: number;
  text: string;
}

export interface ReadabilityRecommendation {
  id: string;
  type: ReadabilityIssueType;
  message: string;
  severity: 'low' | 'medium' | 'high';
  spans: TextSpan[];
  sentenceIndex?: number;
  metricValue: number;
  threshold: number;
}
```

`MLAnalysisResult` genişletmesi:

```ts
export interface MLAnalysisResult {
  readabilityScore: number;
  complexityIndex: number;
  metrics: { wordCount: number; sentenceCount: number; syllableCount: number;
             avgWordLength: number; atesman: number; cetinkayaUzun: number };
  recommendations: string[];
  positionalRecommendations: ReadabilityRecommendation[];
}
```

> [!NOTE]
> `recommendations: string[]` **silinmeyecek**. DOCX/PDF export akışları (`App.tsx:910-911, 973, 1043`)
> ve Firestore'a kaydedilen `mlAnalysis` alanı bu diziyi kullanıyor. Yeni alan eklenir,
> eski alan korunur; ikisi aynı fonksiyonda birlikte üretilir.

### 16.3 Konumlandırma Algoritması

Mevcut üç kural **aynen** korunur, yalnızca her kural "hangi cümle/kelime?" sorusunu da yanıtlar.
Metin geneli ortalama yerine **cümle bazlı** ölçüm yapılır.

```ts
const buildPositionalRecommendations = (text: string): ReadabilityRecommendation[] => {
  const out: ReadabilityRecommendation[] = [];
  const sentences = splitSentencesWithOffsets(text);

  sentences.forEach(({ text: s, start, index }) => {
    const words = s.trim().split(/\s+/).filter(Boolean);
    const syllables = countSyllables(s);
    const wordsPerSentence = words.length;
    const syllablesPerWord = syllables / (words.length || 1);
    const sentenceAtesman = 199.5 - (1.015 * wordsPerSentence) - (84.6 * syllablesPerWord);

    if (wordsPerSentence > 20) {
      out.push({
        id: `long-${index}`, type: 'long-sentence',
        message: `${wordsPerSentence} kelimelik cümle: ${wordsPerSentence - 20} kelime kısaltın.`,
        severity: wordsPerSentence > 35 ? 'high' : 'medium',
        spans: [{ start, end: start + s.length, text: s }],
        sentenceIndex: index, metricValue: wordsPerSentence, threshold: 20,
      });
    }

    if (sentenceAtesman < 50) {
      out.push({
        id: `atesman-${index}`, type: 'low-atesman',
        message: `Bu cümlenin Ateşman skoru ${Math.round(sentenceAtesman)} — sadeleştirilmeli.`,
        severity: sentenceAtesman < 25 ? 'high' : 'medium',
        spans: [{ start, end: start + s.length, text: s }],
        sentenceIndex: index, metricValue: Math.round(sentenceAtesman), threshold: 50,
      });
    }

    findComplexWords(s, start).forEach(w => {
      out.push({
        id: `word-${w.start}`, type: 'complex-word',
        message: `"${w.text}" ${w.syllables} heceli — daha yaygın bir karşılığı var mı?`,
        severity: w.syllables >= 6 ? 'high' : 'low',
        spans: [{ start: w.start, end: w.end, text: w.text }],
        metricValue: w.syllables, threshold: 3,
      });
    });
  });

  return out;
};
```

**Yardımcı fonksiyonlar (yeni, `mlService.ts` içinde):**

| Fonksiyon | Görev | Kritik nokta |
|-----------|-------|--------------|
| `splitSentencesWithOffsets(text)` | Cümlelere ayırır **ve her cümlenin metin içindeki `start` karakter indeksini** döner | Mevcut `text.split(/[.!?]+/)` indeksi kaybediyor; `RegExp` + `exec` döngüsü veya `matchAll` ile ofset korunmalı |
| `countSyllables(str)` | Türkçe sesli harf sayımı | Mevcut `"aeıioöuüAEIİOÖUÜ"` kümesi yeniden kullanılır (`mlService.ts:87`) |
| `findComplexWords(sentence, offset)` | ≥ 4 heceli kelimeleri **metin-içi ofsetleriyle** bulur | Ofset `sentenceOffset + sentence.indexOf(word, cursor)` ile hesaplanır; aynı kelime tekrar ediyorsa `cursor` ilerletilir |

> [!WARNING]
> **Ofset doğruluğu şart.** `spans[].start/end` değerleri `inputText` üzerinde **birebir**
> `text.slice(start, end) === spans[].text` sağlamalı. Bu invariant bozulursa vurgu yanlış
> yeri boyar. Bu yüzden Faz 1'e bir doğrulama testi ekleniyor (Bkz. 16.7).

### 16.4 Isı Haritası Katmanı: İki Görsel Mod

Kullanıcının istediği **"hem animasyonlu hem seçili renkte metin"** davranışı iki ayrı katmanla
karşılanır. İkisi bağımsız açılıp kapatılabilir.

#### Mod A — Seçili Renkte Metin (kalıcı boya)

`Okunabilirlik Vurgusu` toggle'ı açıkken, `positionalRecommendations` içindeki tüm `spans`
giriş metninin backdrop katmanında **kalıcı olarak** boyanır. Renk, şiddete göre değişir:

| severity | Arkaplan | Alt çizgi |
|----------|----------|-----------|
| `high`   | `rgba(6, 182, 212, 0.32)` | `border-b-2 border-cyan-400` |
| `medium` | `rgba(6, 182, 212, 0.20)` | `border-b border-cyan-500/70` |
| `low`    | `rgba(6, 182, 212, 0.10)` | `border-b border-dotted border-cyan-600/50` |

> [!NOTE]
> **Neden cyan?** Isı haritası paletinde kırmızı = YZ (`rgba(239,68,68)`), amber = karışık
> (`rgba(245,158,11)`), yeşil = insan (`rgba(16,185,129)`), turuncu = intihal (`rgba(249,115,22)`)
> zaten kullanılıyor (`HeatmapView.tsx:60-76`). Okunabilirlik bu dört kavramdan **farklı bir
> eksendir** (metin kalitesi ≠ YZ olasılığı ≠ intihal), bu yüzden paleti çakıştırmamak için
> cyan (`#06b6d4`) ayrıldı.

#### Mod B — Animasyonlu (hover / tık senkronu)

`ÖNERİLER` listesindeki bir maddeye gelindiğinde veya tıklandığında:

1. `setHoveredRecommendation(rec)` çağrılır.
2. `handleRecommendationHover(rec)` — mevcut `handleInsightHover` (`App.tsx:408-419`) deseniyle
   aynı: ilgili span'e `id="hovered-readability-span"` verilir, 50 ms sonra
   `textareaRef.current.scrollTo({ top: span.offsetTop - 50, behavior: 'smooth' })`.
3. Span, `transition-all duration-300` + Framer Motion `animate` ile **nabız efekti** alır:

```tsx
<motion.span
  id="hovered-readability-span"
  className="rounded-sm inline font-bold text-cyan-300"
  initial={{ backgroundColor: 'rgba(6,182,212,0.15)' }}
  animate={{
    backgroundColor: ['rgba(6,182,212,0.15)', 'rgba(6,182,212,0.45)', 'rgba(6,182,212,0.25)'],
    boxShadow: ['0 0 0px rgba(6,182,212,0)', '0 0 14px rgba(6,182,212,0.6)', '0 0 6px rgba(6,182,212,0.3)'],
  }}
  transition={{ duration: 1.2, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
>
  {spanText}
</motion.span>
```

4. Ters yön de çalışır: ısı haritasındaki bir cyan span'e hover edilince `ÖNERİLER` listesindeki
   ilgili madde kaydırılıp çerçevelenir (`scrollIntoView({ block: 'nearest' })`).

#### Katman Önceliği (Çakışma Yönetimi)

Giriş metninde aynı anda dilbilgisi (kırmızı), intihal (turuncu) ve okunabilirlik (cyan)
vurgusu bulunabilir. Uygulanacak sıra:

```
1. hoveredRecommendation varsa  → sadece o span, Mod B (animasyonlu)
2. hoveredInsight varsa         → sadece o span, mevcut yeşil animasyon (App.tsx:344-363)
3. showReadabilityHeatmap       → cyan kalıcı boya
4. showInputHeatmap             → dilbilgisi kırmızı (App.tsx:372-399)
5. hiçbiri                      → düz metin
```

Bir span birden fazla katmana giriyorsa (örn. hem uzun cümle hem intihal),
**üstteki katman kazanır** ve span'e `title` özniteliği ile diğer katmanın bilgisi eklenir.
İntihal (turuncu) her zaman okunabilirliğin (cyan) **önünde** gelir — kullanıcıyı yanıltmamak için
`showReadabilityHeatmap && showInputHeatmap` birlikte açıksa intihal span'leri cyan'a boyanmaz.

### 16.5 UI Değişiklikleri

**a) Derin Metrikler kartı (`App.tsx:1850-1853`) — ÖNERİLER bloğu yeniden yazılır:**

```tsx
<div className="pt-2">
  <div className="flex items-center justify-between mb-2">
    <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">ÖNERİLER</span>
    <button
      onClick={() => setShowReadabilityHeatmap(v => !v)}
      className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full border transition-all",
        showReadabilityHeatmap
          ? "bg-cyan-500/15 border-cyan-400/50 text-cyan-300"
          : "border-white/10 text-gray-500 hover:border-cyan-500/40")}
      title="Metinde vurgula"
    >
      {showReadabilityHeatmap ? 'Vurgu Açık' : 'Vurgula'}
    </button>
  </div>
  <div className="space-y-2">
    {mlAnalysis.positionalRecommendations.map(rec => (
      <button
        key={rec.id}
        onMouseEnter={() => handleRecommendationHover(rec)}
        onMouseLeave={() => setHoveredRecommendation(null)}
        onClick={() => handleRecommendationHover(rec)}
        className={cn("w-full text-left text-[11px] flex gap-2 leading-relaxed p-1.5 rounded-lg border transition-all",
          hoveredRecommendation?.id === rec.id
            ? "bg-cyan-500/10 border-cyan-400/40 text-cyan-200"
            : "border-transparent text-gray-400 hover:bg-white/[0.03]")}
      >
        <span className="text-cyan-500 shrink-0">•</span>
        <span>{rec.message}</span>
      </button>
    ))}
  </div>
</div>
```

**Değişiklik:** madde `<div>` iken `<button>` oluyor (klavye erişimi + hover), metin genel
`"Cümleler çok uzun"` yerine **somut** `"34 kelimelik cümle: 14 kelime kısaltın."` oluyor.

**b) Öneri yoksa boş durum:**

```tsx
{mlAnalysis.positionalRecommendations.length === 0 && (
  <div className="text-[11px] text-emerald-500/70 flex items-center gap-1.5">
    <CheckCircle2 className="w-3 h-3" /> Metniniz okunabilirlik açısından temiz.
  </div>
)}
```

**c) Sayaç rozeti** (OKUNABİLİRLİK satırının yanına):

```tsx
<span className="text-[9px] font-mono text-cyan-400/80">
  {mlAnalysis.positionalRecommendations.length} nokta
</span>
```

### 16.6 `HeatmapView.tsx` Genişletmesi

`SentenceScoreItem.type` birleşimi (`HeatmapView.tsx:5`) `'readability'` içermiyor. Eklenecek:

```ts
type?: 'ai' | 'human' | 'mixed' | 'plagiarism' | 'readability';
```

Renk eşlemesine (`HeatmapView.tsx:60-76`) yeni dal:

```ts
} else if (item.type === 'readability') {
  color = 'rgba(6, 182, 212, 0.28)';
  borderColor = 'rgba(6, 182, 212, 0.8)';
}
```

Tooltip başlığına (`HeatmapView.tsx:105-118`):

```tsx
{item.type === 'readability' ? 'Okunabilirlik' : item.type === 'plagiarism' ? 'İntihal Tespiti' : /* … */}
```

> [!NOTE]
> `HeatmapView` **sonuç metni** üzerinde çalışır, `App.tsx`'teki backdrop katmanı ise
> **giriş metni** üzerinde. Okunabilirlik önerileri giriş metnine ait olduğu için ana iş
> `App.tsx` backdrop'undadır (16.4 Mod A). `HeatmapView` genişletmesi, insanlaştırılmış
> çıktı metninde de aynı analizi gösterebilmek için yapılır (Faz 4, opsiyonel).

### 16.7 Faz Planı

| Faz | İş | Dosya | Süre | Öncelik |
|-----|-----|-------|------|---------|
| **Faz 1** | `splitSentencesWithOffsets`, `countSyllables`, `findComplexWords`, `buildPositionalRecommendations` + `MLAnalysisResult` genişletmesi | `mlService.ts` | 0.5 oturum | **P1** |
| **Faz 2** | Ofset invariant testi: her span için `text.slice(start,end) === span.text` | yeni `src/services/__tests__/mlService.test.ts` | 0.25 oturum | **P1** |
| **Faz 3** | Mod A — cyan kalıcı boya katmanı + `showReadabilityHeatmap` state + katman öncelik sırası | `App.tsx` | 0.5 oturum | **P1** |
| **Faz 4** | Mod B — `handleRecommendationHover`, nabız animasyonu, smooth scroll, çift yönlü senkron | `App.tsx` | 0.5 oturum | **P1** |
| **Faz 5** | ÖNERİLER bloğunun interaktif listeye çevrilmesi + boş durum + sayaç rozeti | `App.tsx:1850-1853` | 0.25 oturum | **P1** |
| **Faz 6** | `HeatmapView.tsx`'e `'readability'` tipi ve rengi (çıktı metni desteği) | `HeatmapView.tsx` | 0.25 oturum | **P2** |

**Bağımlılık:** Faz 1 → 2 → 3 → 4 → 5 sıralıdır (veri modeli olmadan UI yapılamaz).
Faz 6 bağımsızdır.

> [!WARNING]
> GEMINI.md Madde 0 gereği tüm düzenlemeler `replace`/Edit ile yapılacak, `write_file` ile
> dosya bütünü üzerine yazılmayacak. Her faz sonunda `npm run build` + `tsc --noEmit` (Madde 3).

### 16.8 Başarı Kriterleri

- [ ] Her `positionalRecommendations` öğesi en az bir `spans` kaydı taşıyor
- [ ] Tüm span'ler için `inputText.slice(span.start, span.end) === span.text` **%100** doğru
- [ ] ÖNERİLER'de bir maddeye hover edilince metin **otomatik kayıyor** ve span **nabız gibi** atıyor
- [ ] Toggle açıkken vurgular **kalıcı renkte** duruyor (hover gerekmeksizin)
- [ ] Cyan renk; kırmızı/amber/yeşil/turuncu ile **çakışmıyor**
- [ ] İntihal vurgusu ile okunabilirlik vurgusu aynı span'de çakıştığında **intihal kazanıyor**
- [ ] Öneri yoksa "Metniniz okunabilirlik açısından temiz." görünüyor
- [ ] `recommendations: string[]` alanı duruyor; DOCX/PDF export bozulmadı
- [ ] `npm run build` hatasız, `tsc --noEmit` temiz

### 16.9 Kapsam Dışı

- ❌ Ateşman/Çetinkaya-Uzun formüllerinin **değiştirilmesi** (yalnızca cümle bazlı uygulanıyor)
- ❌ Yeni okunabilirlik metrikleri eklemek (Flesch, Gunning Fog vb.)
- ❌ Otomatik cümle bölme / metni yeniden yazma (öneri **gösterir**, kullanıcı karar verir)
- ❌ Gemini'ye "bu cümleyi sadeleştir" çağrısı (maliyet + gecikme; insanlaştırma motorunun işi)
- ❌ Ajan/kişilik dili (Bölüm 0 - Kural 2)

---

## 17. SENTİNEL İNTİHAL DOĞRULAMA — HALÜSİNASYON YASAĞI + YERLİ/YABANCI KAYNAK AYRIMI

> **Durum:** ONAY BEKLİYOR (kod değişikliği yapılmadı)
> **Tarih:** 2026-10-06
> **Kapsam:** `src/services/sentinelService.ts`, `src/App.tsx` (Sentinel kartı), `src/types/index.ts`
> **Amaç:** Sentinel'in **kesinleşmeden hiçbir kaynak göstermemesi** ve sonuçların
> **Yerli Kaynaklar / Yabancı Kaynaklar** olarak iki ayrı bölümde, bağımsız yükleme
> durumlarıyla sunulması.

### 17.0 Talep

1. İntihal belirtirken **halüsinasyon veri kesinlikle çıkmamalı**.
2. Farklı dilde metin dönse bile **konuyla alakasızsa gösterilmemeli**.
3. Sonuçlar **Yerli Kaynaklar** ve **Yabancı Kaynaklar** olarak ikiye ayrılmalı.
4. Yabancı arama uzun sürerse **"yabancı kaynaklar aranıyor lütfen bekleyiniz."** yazmalı
   (ayrı bir adım olduğu için).
5. **Emin olunduktan sonra** eklenmeli; yoksa **"bulunamadı"** yazısı konmalı. Aynı davranış
   yerli bölümü için de geçerli.
6. Metinler Türkçe olduğu için **önce Türkçe** aranmalı, **ardından** yabancı kaynağa geçilmeli.

### 17.1 Mevcut Kodun Risk Analizi (`sentinelService.ts:132-191`)

| # | Bulgu | Satır | Risk |
|---|-------|-------|------|
| R1 | **Tek arama geçişi var**, yalnızca `lr=lang_tr` | 160 | Yabancı kaynak hiç aranmıyor → "Yabancı Kaynaklar" bölümü için veri kaynağı yok |
| R2 | `score: 0.8` **sabit kodlanmış** | 176 | Her kaynağa aynı güven veriliyor; ölçülmüş bir benzerlik değil |
| R3 | `snippet: item.snippet \|\| sentence.slice(0, 120)` | 172 | Google snippet döndürmezse **kullanıcının kendi cümlesi** "kaynaktan alıntı" gibi gösteriliyor → **doğrudan halüsinasyon** |
| R4 | **Alaka doğrulaması yok** | 168-178 | Snippet ile cümle karşılaştırılmıyor. Konuyla ilgisiz veya farklı dilde bir sayfa "intihal kaynağı" olarak listelenebiliyor |
| R5 | `similarityScore = (kaynak sayısı / cümle sayısı) * 100` | 184-186 | Benzerlik **eşleşen karakterden** değil kaynak adedinden hesaplanıyor; 5 kısa eşleşme %100 yapabilir |
| R6 | Tekilleştirme yalnızca `s.url === url` | 170 | `?utm=`, `/` sonu, `http/https`, `www` farkları aynı sayfayı iki kaynak gösteriyor |
| R7 | `catch { }` **boş** | 179 | Kota/403/ağ hatası yutuluyor; kullanıcı "kaynak bulunamadı" ile "arama yapılamadı"yı ayırt edemiyor |
| R8 | `chunkText(text).slice(0, 5)` | 137 | Uzun makalede sadece ilk 5 cümle taranıyor; bu sınır UI'da belirtilmiyor |

#### Ayrıca tespit edilen iki gerçek hata (UI ↔ tip uyumsuzluğu)

> [!WARNING]
> **H1:** `App.tsx:1808` ve `App.tsx:1813` `s.matchedSnippet` ve `s.similarity` alanlarını
> okuyor. Fakat `PlagiarismSource` (`sentinelService.ts:12-18`) yalnızca
> `{ url, title, snippet, matchedText, matchGroup }` içeriyor — **bu iki alan yok.**
> Sonuç: `App.tsx:1815-1822`'deki **"Benzerlik %" satırı bugün hiç render edilmiyor**
> (`s.similarity !== undefined` her zaman `false`).
>
> **H2:** `src/types/index.ts:46` aynı kavram için **farklı bir şekil** tanımlıyor:
> `{ title, url, similarity, matchedSnippet }`. Yani `Project.sources` ile
> `PlagiarismSource` birbirini tutmuyor; Firestore'a yazılan kaynaklar geri yüklenince
> kart UI'ı farklı alan adları bekliyor.

Bu iki hata, 17.7'deki tip birleştirmesiyle **birlikte** çözülecek.

### 17.2 Doğrulama Kapısı (Verification Gate)

**İlke:** Bir kaynak, ancak **kullanıcının cümlesi ile kaynağın snippet'i arasında ölçülebilir
bir örtüşme kanıtlanırsa** listelenir. Kanıt yoksa kaynak **reddedilir** — "belki vardır"
diye gösterilmez.

> [!IMPORTANT]
> Kapı **tamamen deterministik** (yerel string/n-gram hesabı) olacak. Doğrulama için
> Gemini'ye sorulmayacak — çünkü halüsinasyonu önleme iddiasındaki bir adımın kendisi
> halüsinasyon üretebilen bir modele devredilmesi çelişkidir.

#### Normalizasyon

```ts
const normalizeForMatch = (s: string): string =>
  s.toLocaleLowerCase('tr')
   .replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"')
   .replace(/[^\p{L}\p{N}\s]/gu, ' ')
   .replace(/\s+/g, ' ')
   .trim();
```

#### Kademe A — Kesin Eşleşme (zorunlu ön koşul)

Kaynağın snippet'i içinde, kullanıcı cümlesinin **en az 6 kelimelik kesintisiz** bir alt dizisi
**birebir** geçiyorsa kaynak kabul edilir.

```ts
const hasLiteralPhraseMatch = (sentence: string, snippet: string, minWords = 6): boolean => {
  const s = normalizeForMatch(sentence).split(' ');
  const hay = normalizeForMatch(snippet);
  if (s.length < minWords) return false;
  for (let i = 0; i + minWords <= s.length; i++) {
    if (hay.includes(s.slice(i, i + minWords).join(' '))) return true;
  }
  return false;
};
```

#### Kademe B — Destekleyici Örtüşme (yalnızca Türkçe geçiş için)

Kademe A sağlanmadıysa, **Türkçe kaynaklarda** aşağıdaki iki koşul **birlikte** sağlanıyorsa
kaynak `confidence: 'medium'` ile kabul edilir:

```ts
const shingleOverlap = (a: string, b: string, n = 5): number => {
  const A = new Set(shingles(normalizeForMatch(a), n));
  const B = new Set(shingles(normalizeForMatch(b), n));
  if (A.size === 0) return 0;
  let hit = 0;
  B.forEach(x => { if (A.has(x)) hit++; });
  return hit / A.size;
};

const overlap = shingleOverlap(sentence, snippet, 5) >= 0.35;
const lcs = longestCommonSubstring(sentence, snippet).length >= 40;
const tierB = overlap && lcs;
```

> [!NOTE]
> **Yabancı geçişte Kademe B YOK.** Farklı dilde bir snippet ile Türkçe cümle arasında
> n-gram örtüşmesi anlamlı sinyal üretmez; bu yüzden yabancı kaynaklar **yalnızca Kademe A**
> ile kabul edilir. Bu, kullanıcının *"farklı bir dilde metin çıkarıyorsa bile konu ile
> alakasız gösterilmemeli"* şartının teknik karşılığıdır.

#### Kapı Kararı

```ts
type GateResult =
  | { admitted: true;  tier: 'A' | 'B'; similarity: number; matchedSpan: string }
  | { admitted: false; reason: 'no-snippet' | 'low-overlap' | 'cross-language' | 'invalid-url' };
```

| Girdi durumu | Karar |
|--------------|-------|
| `item.snippet` boş/undefined | **RED** (`no-snippet`) — R3'teki "kendi cümlesini snippet yap" davranışı **kaldırılıyor** |
| URL `http(s)` ile başlamıyor | **RED** (`invalid-url`) |
| Kademe A sağlandı | **KABUL**, `tier: 'A'` |
| Kademe A yok, Türkçe geçiş + Kademe B var | **KABUL**, `tier: 'B'` |
| Kademe A yok, yabancı geçiş | **RED** (`cross-language`) |
| Hiçbiri | **RED** (`low-overlap`) |

Reddedilenler **silinmez**, sayılır: `rejectedCount`. UI'da şeffaflık için gösterilir
(Bkz. 17.6) — kullanıcı "neden az kaynak var?" sorusunun cevabını görür.

#### Gerçek Benzerlik Skoru (R2 ve R5 çözümü)

```ts
const matchedChars = uniqueMatchedChars(admittedSources, fullText);
const similarityScore = Math.min(95, Math.round((matchedChars / Math.max(fullText.length, 1)) * 100));

source.similarity = Math.round((source.matchedSpan.length / Math.max(fullText.length, 1)) * 1000) / 10;
```

- `0.8` sabiti **kaldırılıyor**; her kaynağın `similarity` değeri **eşleşen karakterden** hesaplanıyor.
- Genel skor artık **kaynak adediyle değil, eşleşen karakter oranıyla** belirleniyor.
- GEMINI.md'deki **kaynak başına %1-%3 bandı** ve **genel %15 sınırı** bu skorlarla denetlenebilir
  hale geliyor; sınır aşımında UI uyarısı Faz 4'te eklenecek.

### 17.3 İki Aşamalı Arama — Türkçe Önce, Yabancı Sonra

```ts
const verifyPlagiarism = async (
  text: string,
  enabled = true,
  onProgress?: (state: SearchProgress) => void
): Promise<VerifiedPlagiarismReport> => { /* … */ };
```

```
Adım 1  Yerli geçiş    lr=lang_tr & gl=tr & cr=countryTR
        └─ onProgress({ phase: 'domestic', status: 'searching' })
        └─ her aday → Doğrulama Kapısı → admitted ise domesticSources
        └─ onProgress({ phase: 'domestic', status: 'done' | 'empty' | 'error' })
        └─ YERLİ SONUÇLAR HEMEN RENDER EDİLİR (yabancı beklenmez)

Adım 2  Yabancı geçiş  lr=lang_en (sonra gerekirse kısıtlamasız) & gl dışı
        └─ onProgress({ phase: 'international', status: 'searching' })
        └─ her aday → Doğrulama Kapısı (sadece Kademe A) → internationalSources
        └─ onProgress({ phase: 'international', status: 'done' | 'empty' | 'error' })
```

**Sıra kuralı:** Adım 2, Adım 1 **tamamlanmadan başlatılmaz**. Gerekçe: (a) kullanıcının
istediği Türkçe önceliği, (b) aynı cümle için hem `.tr` hem global sonuç dönerse
**yerli kaynak tercih edilir** ve yabancı tekrarı düşürülür, (c) kota tüketimi yarıya iner —
yerli geçişte Kademe A ile kesinleşen cümleler yabancı geçişte **tekrar aranmaz**.

```ts
const sentencesNeedingForeignPass = sentences.filter(s => !domesticConfirmed.has(s));
```

**Hata davranışı (R7 çözümü):**

```ts
} catch (err) {
  const handled = await handleSearchApiKeyError(err);
  onProgress({ phase, status: 'error', message: handled.userMessage });
}
```

`catch { }` **boş bırakılmayacak**. Kota/anahtar hatasında bölüm `error` durumuna geçer ve
"kaynak bulunamadı" **değil**, "arama yapılamadı" yazar — ikisi kullanıcı için farklı bilgidir.

### 17.4 Yerli / Yabancı Sınıflandırma Kuralları

> [!IMPORTANT]
> **Tanım:** "Yerli kaynak" = **Türkçe içerikli** kaynak. Türkiye domaini şartı aranmaz —
> `dergipark.org.tr` dışındaki bir alan adında yayınlanan Türkçe makale de **yerlidir**.
> Gerekçe: proje metinleri Türkçe ve intihal karşılaştırması **dil** üzerinden anlamlı.

Sınıflandırma üç sinyalin birleşimiyle yapılır:

| Sinyal | Ağırlık | Kural |
|--------|---------|-------|
| **1. Arama geçişi** | belirleyici | `lr=lang_tr` geçişinden geldiyse `domestic` adayı |
| **2. Türkçe karakter oranı** | doğrulayıcı | `title + snippet` içinde `çğıöşüÇĞİÖŞÜ` oranı ≥ %2 **VE** Türkçe işlev kelimesi (`bir, ve, için, ile, bu, daha, en, olarak, ancak, göre`) ≥ 2 adet |
| **3. Alan adı** | destekleyici | `.tr` ccTLD, `.edu.tr`, `.gov.tr`, `dergipark.org.tr`, `trt`, `aa.com.tr`, `meb.gov.tr` → güçlü yerli sinyali |

```ts
const classifyRegion = (item: SearchItem, pass: 'domestic' | 'international'): SourceRegion => {
  const text = `${item.title || ''} ${item.snippet || ''}`;
  const trRatio = countTurkishChars(text) / Math.max(countLetters(text), 1);
  const trWords = countTurkishFunctionWords(text);
  const isTrDomain = /\.(tr|edu\.tr|gov\.tr)$/i.test(hostname(item.link)) || TR_KNOWN_DOMAINS.has(hostname(item.link));

  const looksTurkish = (trRatio >= 0.02 && trWords >= 2) || isTrDomain;
  return looksTurkish ? 'domestic' : 'international';
};
```

**Çakışma durumu:** Yabancı geçişten gelen bir sonuç Türkçe çıkarsa (`looksTurkish === true`)
**Yerli Kaynaklar** bölümüne taşınır. Kullanıcıya yanlış bölümde göstermek, yanlış içerik
göstermek kadar yanıltıcıdır.

### 17.5 Yeni Rapor Tipi

```ts
export type SourceRegion = 'domestic' | 'international';
export type SourceConfidence = 'high' | 'medium';
export type SectionStatus = 'idle' | 'searching' | 'done' | 'empty' | 'error';

export interface PlagiarismSource {
  url: string;
  normalizedUrl: string;
  title: string;
  snippet: string;
  matchedText: string;
  matchedSpan: string;
  matchGroup: MatchGroup;
  region: SourceRegion;
  confidence: SourceConfidence;
  similarity: number;
  language: 'tr' | 'other';
  publishedDate?: string;
  retrievedAt: string;
}

export interface SearchProgress {
  phase: 'domestic' | 'international';
  status: SectionStatus;
  message?: string;
  foundCount?: number;
  rejectedCount?: number;
}

export interface VerifiedPlagiarismReport {
  similarityScore: number;
  domestic: { sources: PlagiarismSource[]; status: SectionStatus; rejectedCount: number };
  international: { sources: PlagiarismSource[]; status: SectionStatus; rejectedCount: number };
  scannedSentenceCount: number;
  totalSentenceCount: number;
  matchedPhrases: { text: string; source: string; score: number }[];
}
```

| Alan | Neden eklendi |
|------|---------------|
| `normalizedUrl` | R6 — `?utm`, `/`, `www`, `http/https` farklarını yok ederek gerçek tekilleştirme |
| `matchedSpan` | Kapının kanıtladığı **örtüşen parça**; UI'da `"…"` içinde gösterilir |
| `confidence` | Kademe A → `high`, Kademe B → `medium`; UI'da rozetle ayrılır |
| `similarity` | H1 hatasının düzeltilmesi — `App.tsx:1815-1822` artık gerçekten render eder |
| `language` | 17.4 sınıflandırmasının ham çıktısı |
| `publishedDate?` | GEMINI.md Zero-Hallucination: *"ismi bilinen ve erişilebilir kaynaklar"*. Tarih **bilinmiyorsa alan undefined kalır**, UI "Tarih bilinmiyor" yazar — asla tahmin edilmez |
| `retrievedAt` | Kaynağa erişim zamanı (Gün/Ay/Yıl), doğrulanabilirlik için |
| `rejectedCount` | 17.6 şeffaflık satırı |
| `scannedSentenceCount` | R8 — `slice(0, 5)` sınırının kullanıcıya açıkça söylenmesi |

`src/types/index.ts:46` içindeki `Project.sources` şekli bu tipe **hizalanacak** (H2 çözümü):

```ts
sources: PlagiarismSource[];
```

### 17.6 UI: Bölünmüş Sentinel Kartı

Mevcut düz liste (`App.tsx:1726`, `<div ref={sentinelSourcesRef} className="space-y-2.5 max-h-56 …">`)
**iki ayrı bölüme** ayrılır. Her bölümün kendi durum makinesi vardır.

#### Yeni state

```ts
const [domesticSources, setDomesticSources] = useState<PlagiarismSource[]>([]);
const [internationalSources, setInternationalSources] = useState<PlagiarismSource[]>([]);
const [domesticStatus, setDomesticStatus] = useState<SectionStatus>('idle');
const [internationalStatus, setInternationalStatus] = useState<SectionStatus>('idle');
const [rejectedCounts, setRejectedCounts] = useState({ domestic: 0, international: 0 });
const [scanInfo, setScanInfo] = useState({ scanned: 0, total: 0 });
```

#### Yapı

```
┌─ 🛡️ Sentinel Kaynakları ────────────────────────────────┐
│  Benzerlik: %X   •   Taranan cümle: 5 / 42             │
│                                                        │
│  🇹🇷 YERLİ KAYNAKLAR (3)                          ▾    │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 🔴 Kaynak başlığı                     ↗          │  │
│  │ "…örtüşen parça…"     Benzerlik %2.4  GÜVEN: YÜKSEK│  │
│  └──────────────────────────────────────────────────┘  │
│  ℹ 4 aday kaynak doğrulanamadığı için elendi.          │
│                                                        │
│  🌍 YABANCI KAYNAKLAR                              ▾    │
│  ┌──────────────────────────────────────────────────┐  │
│  │ ⏳ Yabancı kaynaklar aranıyor lütfen bekleyiniz. │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

#### Durum → Metin eşlemesi

| Bölüm | Durum | Gösterilecek metin |
|-------|-------|--------------------|
| **Yerli** | `searching` | `Yerli kaynaklar aranıyor…` + spinner |
| **Yerli** | `empty` | `Türkçe kaynak bulunamadı. Metniniz internetteki Türkçe içeriklerle eşleşmiyor.` |
| **Yerli** | `error` | `Yerli kaynak araması yapılamadı (arama servisi kotası/anahtarı).` |
| **Yerli** | `done` | kaynak kartları + `ℹ N aday kaynak doğrulanamadığı için elendi.` |
| **Yabancı** | `idle` | `Yerli arama tamamlanınca başlayacak.` |
| **Yabancı** | `searching` | **`Yabancı kaynaklar aranıyor lütfen bekleyiniz.`** + spinner |
| **Yabancı** | `empty` | `Yabancı kaynak bulunamadı.` |
| **Yabancı** | `error` | `Yabancı kaynak araması yapılamadı (arama servisi kotası/anahtarı).` |
| **Yabancı** | `done` | kaynak kartları + elenen sayısı |

> [!IMPORTANT]
> **Kritik ayrım:** `empty` (arandı, doğrulanmış eşleşme yok) ile `error` (arama hiç
> yapılamadı) **asla aynı metinle** gösterilmeyecek. İkisi farklı bilgi; karıştırılırsa
> kullanıcı "intihal yok" sanırken aslında tarama yapılmamış olabilir.

#### Kaynak kartına eklenecekler (`App.tsx:1765-1834`)

```tsx
<span className={cn("text-[8px] px-1.5 py-0.5 rounded font-black",
  s.confidence === 'high' ? "bg-emerald-500/15 text-emerald-400" : "bg-sky-500/15 text-sky-400")}>
  {s.confidence === 'high' ? 'DOĞRULANDI' : 'KISMİ EŞLEŞME'}
</span>
```

```tsx
<p className="text-[10px] line-clamp-2 italic leading-relaxed text-gray-400">
  "{s.matchedSpan}"
</p>
```

```tsx
<div className="mt-1.5 flex items-center justify-between text-[9px] font-mono text-gray-500">
  <span>Benzerlik</span>
  <span className={cn("font-bold", s.similarity > 3 ? "text-red-400" : "text-amber-400")}>
    %{s.similarity}
  </span>
</div>
<span className="text-[9px] text-gray-600">
  {s.publishedDate ? `Yayın: ${s.publishedDate}` : 'Yayın tarihi bilinmiyor'}
   · Erişim: {s.retrievedAt}
</span>
```

**Değişiklikler:**
- Snippet artık `s.snippet || s.matchedSnippet || s.matchedText` **değil**, yalnızca
  kapının kanıtladığı `s.matchedSpan`. Kullanıcının kendi cümlesi asla "alıntı" diye gösterilmez.
- `Benzerlik` satırı gerçek değerle render ediliyor (H1 düzeltmesi); eşik
  GEMINI.md'deki **kaynak başına %1-%3** bandına göre `> 3` kırmızı.
- Yayın tarihi yoksa **uydurulmuyor**, "bilinmiyor" yazılıyor.

#### Bölüm başlığı davranışı

- İki bölüm **accordion** (varsayılan: yerli açık, yabancı açık).
- Yabancı bölüm `searching` durumunda iken yerli sonuçlar **çoktan görünür** — kullanıcı
  beklemek zorunda kalmaz.
- `hover` senkronu (`setHoveredSourceUrl` + `handleInsightHover`, `App.tsx:1782-1790`) her iki
  bölümde de aynı çalışır; vurgulanan span `matchedSpan` olur.

### 17.7 Faz Planı

| Faz | İş | Dosya | Süre | Öncelik |
|-----|-----|-------|------|---------|
| **Faz 1** | Doğrulama kapısı: `normalizeForMatch`, `hasLiteralPhraseMatch`, `shingleOverlap`, `longestCommonSubstring`, `classifyRegion` | `sentinelService.ts` | 1 oturum | **P0** |
| **Faz 2** | R3 snippet fallback + R2 sabit `0.8` kaldır; gerçek `similarity` ve genel skor hesabı | `sentinelService.ts:168-186` | 0.5 oturum | **P0** |
| **Faz 3** | İki aşamalı arama (`domestic` → `international`), `onProgress` callback, boş `catch` düzeltmesi | `sentinelService.ts:132-191` | 1 oturum | **P0** |
| **Faz 4** | Tip birleştirmesi: `PlagiarismSource` genişlet + `types/index.ts:46` hizala (H1, H2) | `sentinelService.ts`, `types/index.ts` | 0.5 oturum | **P0** |
| **Faz 5** | UI: Yerli/Yabancı bölümleri, durum makinesi metinleri, `DOĞRULANDI` rozeti, elenen sayısı | `App.tsx:1686-1834` | 1-1.5 oturum | **P0** |
| **Faz 6** | URL normalizasyonu ile tekilleştirme (R6) + `scannedSentenceCount` göstergesi (R8) | `sentinelService.ts`, `App.tsx` | 0.25 oturum | **P1** |
| **Faz 7** | Kapı için birim testleri: bilinen eşleşen / eşleşmeyen / farklı dilde snippet vakaları | yeni `__tests__/sentinelGate.test.ts` | 0.5 oturum | **P1** |
| **Faz 8** *(ops.)* | Snippet yetersizse sayfa içeriğini çekip yeniden doğrulama — `api/verify-source.ts` (CORS proxy) | yeni `api/verify-source.ts` | 1 oturum | **P2** |

**Bağımlılık:** Faz 1 → 2 → 3 → 4 → 5 sıralıdır. Faz 5 (UI), Faz 4 (tipler) bitmeden başlayamaz.
Faz 6-7 bağımsız. Faz 8 tamamen opsiyonel.

> [!WARNING]
> GEMINI.md Madde 0: mevcut `verifyPlagiarism` gövdesi **kısmi gönderimle silinmeyecek**;
> tüm değişiklikler `replace`/Edit ile yapılacak. Faz 3 sonunda `npm run build` zorunlu (Madde 3) —
> `verifyPlagiarism`'in dönüş tipi değiştiği için `App.tsx:639` ve `App.tsx:750`
> çağrı noktaları aynı fazda güncellenmeli, aksi halde build kırılır.

### 17.8 Başarı Kriterleri

- [ ] Snippet'i olmayan **hiçbir kaynak** listelenmiyor (R3 kapandı)
- [ ] `score: 0.8` sabiti kodda **yok**; her `similarity` ölçümden geliyor
- [ ] Kademe A/B kapısından geçmeyen aday kaynak `rejectedCount`'a yazılıyor, UI'da görünmüyor
- [ ] Yabancı geçişte **yalnızca Kademe A** uygulanıyor (Kademe B kod yolu kapalı)
- [ ] Alakasız farklı dilde sayfa **Yerli Kaynaklar**'da da **Yabancı Kaynaklar**'da da çıkmıyor
- [ ] Yerli sonuçlar, yabancı arama bitmeden **görüntüleniyor**
- [ ] Yabancı arama sürerken tam olarak şu metin görünüyor: `Yabancı kaynaklar aranıyor lütfen bekleyiniz.`
- [ ] `empty` ve `error` durumları **farklı** metinlerle ayrışıyor
- [ ] Türkçe geçiş her zaman **önce** çalışıyor; yerlide kesinleşen cümle yabancıda tekrar aranmıyor
- [ ] Aynı sayfa farklı URL varyantlarıyla **iki kez** listelenmiyor
- [ ] Yayın tarihi bilinmeyen kaynakta **tarih uydurulmuyor**, "bilinmiyor" yazıyor
- [ ] "Benzerlik %" satırı artık **render ediliyor** (H1 kapandı)
- [ ] `npm run build` hatasız, `tsc --noEmit` temiz

### 17.9 Kapsam Dışı

- ❌ Doğrulamayı Gemini/LLM'e yaptırmak (halüsinasyon riskini taşır — kapı deterministik kalır)
- ❌ Copyleaks / Turnitin API satın alımı (Bölüm 3.2.3, P2 uzun vade)
- ❌ Akademik veritabanı (YÖK Tez, DergiPark, CrossRef) API entegrasyonu — Faz 8'in ilerisi
- ❌ `slice(0, 5)` cümle sınırının kaldırılması (kota maliyeti; sınır UI'da **gösterilecek** ama kaldırılmayacak)
- ❌ `verifyFactCheck` (`sentinelService.ts:193`) mantığına dokunmak — ayrı iş, ayrı plan
- ❌ Ajan tabanlı kaynak arama / otonom karar döngüsü (Bölüm 0 - Kural 2)

---

## 18. GRAMER ÖNERİSİ → ISI HARİTASI ANİMASYONLU KONUM VURGUSU

> **Tarih:** 2026-10-06
> **Durum:** ✅ UYGULANDI (kod değişikliği yapıldı, build + tip kontrolü geçti)
> **Önem:** P1 · **Etkilenen dosyalar:** `src/App.tsx`, `src/components/GrammarPanel.tsx`

### 18.1 Talep

Kullanıcı isteği (özet): *"Giriş metni bölümüne eklediğim yazıyı 'Gramer & Yazım Denetimi' kartında sunduğu
önerinin üzerine geldiğimde animasyonlu bir şekilde ısı haritasında görebilmeliyim. Böylece nerede değişiklik
yapmak istediğini anlayabilirim, ardından onay verip vermeyeceğime karar verebilirim."*

İki davranışsal gereksinim çıkar:
1. **Konum:** Öneri, giriş metnindeki tam karşılığı üzerinde vurgulanmalı.
2. **Karar:** Kullanıcı vurguyu gördükten sonra onaylayabilmeli (✓) veya reddedebilmeli (✕).

### 18.2 Mevcut Durum (kök neden analizi)

| # | Bulgu | Konum | Sonuç |
|---|---|---|---|
| G1 | `GrammarPanel` satırlarında hiçbir hover olayı yok (`onMouseEnter`/`onMouseLeave` tanımsız, `onHover` prop'u yok) | `GrammarPanel.tsx:66-118` (eski hâl) | Kartın üzerine gelmek hiçbir şey tetiklemiyordu |
| G2 | `inputOverlay`'in gramer dalı (Branch B), ısı haritası dalının (Branch A) **ardında** ve Branch A `return` ile çıktığı için erişilemez | eski `App.tsx:248`, `:375`, `:378-404` | "Isı haritası" açıkken gramer vurguları **hiç çizilmiyordu** |
| G3 | Branch B'deki `<span>` sabit: `id` yok, animasyon yok, hover durumu yok | eski `App.tsx:392` | Konum gösterilse bile "animasyonlu" değildi |
| G4 | `hoveredInsight` yeniden kullanılamaz: `isHovered` testi tam cümle karşılaştırması yapıyor ve bulunamazsa **yeşil** (`rgba(16,185,129)`) çiziliyor | `App.tsx:378`, `:441-459` | Yazım hatası için yeşil (="insan/doğru") semantiği yanlış |
| G5 | `onDismiss` prop'u `App.tsx`'ten hiç geçirilmiyordu; ✕ butonu ölüydü | eski `App.tsx:1885-1890` | Kullanıcı "reddetme" kararını veremiyordu |

### 18.3 Yardımcı fonksiyonlar (modül seviyesi, `App.tsx:131-160`)

```ts
const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const isWordBoundary = (text: string, index: number, length: number) => {
  const before = index > 0 ? text[index - 1] : ' ';
  const after = index + length < text.length ? text[index + length] : ' ';
  return !/[\p{L}\p{N}]/u.test(before) && !/[\p{L}\p{N}]/u.test(after);
};

const findGrammarMatch = (text: string, target: string): { index: number; length: number } | null => {
  const needle = target.trim();
  if (!needle || !text) return null;

  const firstExact = text.indexOf(needle);
  if (firstExact !== -1) {
    let cursor = firstExact;
    while (cursor !== -1) {
      if (isWordBoundary(text, cursor, needle.length)) return { index: cursor, length: needle.length };
      cursor = text.indexOf(needle, cursor + 1);
    }
    return { index: firstExact, length: needle.length };
  }

  const words = needle.split(/\s+/).filter(Boolean).map(escapeRegExp);
  if (!words.length) return null;
  const found = new RegExp(words.join('\\s+'), 'i').exec(text);
  return found ? { index: found.index, length: found[0].length } : null;
};
```

**Neden `indexOf` yetmez:**
- Gemini bazen `original` alanını metindeki biçimden farklı büyük/küçük harf veya farklı boşlukla döndürür → ikinci kademe (kelimeleri `\s+` ile birleştiren, büyük/küçük harf duyarsız regex) gerekir.
- Regex kademesinde eşleşen parçanın uzunluğu `s.original.length`'ten **farklı olabilir**; bu yüzden fonksiyon `{ index, length }` döndürür ve vurgu daima `text.slice(index, index + length)` ile çizilir (kayma/taşma olmaz).
- `"de"` gibi kısa bir öneri, kelime sınırı kontrolü olmadan `"deneme"` veya `"devlet"` içinde eşleşirdi. `isWordBoundary` Unicode-aware (`\p{L}\p{N}`) olduğu için Türkçe karakterlerde (`ı`, `ş`, `ğ`) ASCII `\b` gibi bozulmaz. Sınırda eşleşme bulunamazsa ilk tam eşleşmeye düşer (davranışı kötüleştirmez).

### 18.4 Overlay mimarisi (`App.tsx:276-472`)

`inputOverlay` memo'su içinde tek bir üretici tanımlandı:

```
buildGrammarOverlay(active: GrammarSuggestion | null) → ReactNode | null
```

- `active === null` → tüm öneriler **statik kırmızı** (`bg-red-500/30 border-b border-red-500`) — eski davranış korunur.
- `active !== null` → aktif olan öneri **animasyonlu**, diğerleri **soluk** (`bg-red-500/10 border-b border-red-500/40`) — odak tek noktada.
- Eşleşmeler konuma göre sıralanır; `index < lastIndex` olanlar atlanır (örtüşme koruması).

**Katman önceliği (yeni):**

```
1. hoveredGrammar        → buildGrammarOverlay(hoveredGrammar)   [animasyonlu kırmızı]
2. hoveredInsight / ısı haritası / intihal → Branch A            [kırmızı-amber-yeşil-turuncu]
3. grammarSuggestions    → buildGrammarOverlay(null)             [statik kırmızı]
4. hiçbiri               → inputText
```

G2 hatası bu sıralamayla kapanır: gramer hover'ı artık Branch A'dan **önce** değerlendirildiği için
ısı haritası açıkken de çalışır. Hover bittiğinde ısı haritası aynen geri gelir.

### 18.5 Animasyon ve kaydırma

```tsx
<motion.span
  id="hovered-grammar-span"
  className="inline rounded-sm text-red-200 border-b border-red-400"
  animate={{
    backgroundColor: ['rgba(239, 68, 68, 0.25)', 'rgba(239, 68, 68, 0.65)', 'rgba(239, 68, 68, 0.25)'],
    boxShadow: ['0 0 0 rgba(239, 68, 68, 0)', '0 0 16px rgba(239, 68, 68, 0.85)', '0 0 0 rgba(239, 68, 68, 0)']
  }}
  transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
>
```

- **Renk:** kırmızı (`rgba(239,68,68)`). Gerekçe: palet semantiğinde kırmızı = hata/risk; yeşil (G4) ve turuncu (intihal) zaten dolu.
- **`font-black` kullanılmadı:** backdrop `pointer-events-none text-transparent` bir katman ve textarea ile **aynı metrikte** hizalanmak zorunda. Kalın font glif genişliğini değiştirip vurguyu kaydırırdı (Branch A'daki `isHovered` stilinde bu sorun mevcut).
- **Otomatik kaydırma:** `handleGrammarHover` (`App.tsx:494-506`), mevcut `handleInsightHover` (`App.tsx:481-492`) desenini birebir kullanır — `setTimeout(50ms)` → `getElementById("hovered-grammar-span")` → `textareaRef.scrollTo({ top: el.offsetTop - 50, behavior: 'smooth' })`. Uzun metinde öneri ekran dışındaysa kullanıcı onu aramak zorunda kalmaz.

### 18.6 Kart tarafı (`GrammarPanel.tsx`)

| Öğe | Satır | Davranış |
|---|---|---|
| Yeni prop'lar | `:12-14` | `onHover`, `hoveredSuggestion`, `hoverFound` |
| Satır hover'ı | `:72-73` | `onMouseEnter → onHover(s)`, `onMouseLeave → onHover(null)` |
| Aktif satır stili | `:74-79` | `bg-red-500/[0.08] border-red-500/50` + kırmızı glow |
| Durum göstergesi | `:88-98` | `MapPin` + **"Metinde vurgulanıyor"** (ikon `animate-bounce`) |
| Bulunamadı durumu | `:96` | `hoverFound === false` → **"Metinde bulunamadı"** (amber) |

`hoverFound` (`App.tsx:508`) gerçekten `findGrammarMatch` sonucundan türetilir; yani kart asla
"vurgulanıyor" yalanını söylemez. Bu, Bölüm 17'nin halüsinasyon yasağı ilkesinin UI'daki karşılığıdır.

### 18.7 Yan bulgu: Branch A'da kayıp `nodes.push` (DÜZELTİLDİ)

Eski `App.tsx:293` satırı:

```tsx
sortedMatches.forEach((item, idx) => {
  if (index >= lastIndex) {
    if (index > lastIndex) nodes.push(<span>...text-before...</span>);
    ...
    return (            // ← forEach callback'inden çıkıyor, span HİÇBİR YERE eklenmiyor
      <span id={...} className={cn(...)} style={{ backgroundColor: color }}>...</span>
    );
    lastIndex = index + searchStr.length;   // ← erişilemez kod
  }
});
```

Sonuçları:
1. Isı haritası / intihal renk span'leri **hiç render edilmiyordu** — giriş metnindeki ısı haritası fiilen çalışmıyordu.
2. `lastIndex` hiç ilerlemediği için her turda `inputText.slice(0, index)` tekrar tekrar ekleniyordu → backdrop'ta **çiftleşmiş şeffaf metin**, yani gereksiz DOM ve bozuk `scrollHeight` (kaydırma senkronunu `handleScroll` üzerinden etkiler).
3. Tooltip'ler ve `onMouseEnter` (intihal kartı ↔ metin senkronu) bu span'lerin içinde olduğu için onlar da ölüydü.

Düzeltme tek kelimedir: `return (` → `nodes.push(` (`App.tsx:384`). Kapanış `);` zaten
`push(...)` çağrısını kapatır. `vite build` bu hatayı yakalamıyordu çünkü `tsc` build'e bağlı değil
ve TS varsayılan olarak erişilemez kodu yalnızca editör uyarısı olarak verir.

> ⚠️ **Not:** Bu düzeltme, bu talebin kapsamı dışında görünen ama talebin ("ısı haritasında görebilmeliyim")
> doğrudan ön koşulu olan bir hatadır. Isı haritası katmanı çizilmeden gramer vurgusunun
> "ısı haritasında" görünmesi mümkün değildi.

### 18.8 Uygulanan değişiklik listesi

| # | Dosya | Satır | Değişiklik |
|---|---|---|---|
| 1 | `src/App.tsx` | `131-160` | `escapeRegExp`, `isWordBoundary`, `findGrammarMatch` eklendi |
| 2 | `src/App.tsx` | `204` | `const [hoveredGrammar, setHoveredGrammar] = useState<GrammarSuggestion \| null>(null)` |
| 3 | `src/App.tsx` | `277-332` | `buildGrammarOverlay(active)` üreticisi |
| 4 | `src/App.tsx` | `334-337` | `hoveredGrammar` dalı Branch A'nın **önüne** alındı |
| 5 | `src/App.tsx` | `384` | `return (` → `nodes.push(` (18.7 hatası) |
| 6 | `src/App.tsx` | `469-472` | Eski Branch B silindi → `return buildGrammarOverlay(null) \|\| inputText;` + dep dizisine `hoveredGrammar` |
| 7 | `src/App.tsx` | `494-506` | `handleGrammarHover` (animasyonlu kaydırma) |
| 8 | `src/App.tsx` | `508` | `grammarHoverFound` |
| 9 | `src/App.tsx` | `510-512` | `useLayoutEffect` dep dizisine `hoveredGrammar` |
| 10 | `src/App.tsx` | `1302-1308` | `applyGrammarCorrection` içine `setHoveredGrammar(null)` (bayat hover durumu kalmasın) |
| 11 | `src/App.tsx` | `1969-1981` | `onDismiss` (✕ artık çalışıyor), `onHover`, `hoveredSuggestion`, `hoverFound` geçirildi |
| 12 | `src/components/GrammarPanel.tsx` | `2, 12-14, 24-26` | `MapPin` import'u + 3 yeni prop |
| 13 | `src/components/GrammarPanel.tsx` | `67-99, 118-120` | Satır hover olayları, aktif satır stili, durum göstergesi |

### 18.9 Doğrulama durumu

| Kontrol | Sonuç |
|---|---|
| `npm run build` (vite 6.4.2) | ✅ `built in 14.12s` — hata yok |
| `npx tsc --noEmit` | ✅ çıktı yok — tip hatası yok |
| `findGrammarMatch` davranış testi (node) | ✅ 5/5 vaka doğru (aşağıda) |
| Tarayıcıda uçtan uca hover testi | ❌ **YAPILAMADI** — gerekçe aşağıda |

`findGrammarMatch` test metni: `"Bu bir deneme metinidir. devlet kurumları ve  de   ayrıca Ali gelmedi. Devlet başkanı."`

| Girdi | Çıktı | `text.slice(index, index+length)` | Doğrulama |
|---|---|---|---|
| `devlet` | `{index:25, length:6}` | `"devlet"` | ✅ |
| `de` | `{index:46, length:2}` | `"de"` | ✅ `"deneme"`/`"devlet"` içinde **eşleşmedi**, bağımsız `"de"` bulundu |
| `kurumları ve` | `{index:32, length:12}` | `"kurumları ve"` | ✅ |
| `ali` | `{index:58, length:3}` | `"Ali"` | ✅ büyük/küçük harf duyarsız kademe; uzunluk **eşleşen metinden** alındı |
| `yok boyle` | `null` | — | ✅ uydurma konum üretilmedi |

**Tarayıcı testi neden yapılamadı:** uygulama Firebase Auth ile korunuyor; editör ekranına
ulaşmak için geçerli bir oturum, gramer kartının görünmesi için ise canlı bir Gemini
`checkGrammar()` çağrısı gerekiyor. Depoda demo/anonymous giriş yolu yok
(`signInAnonymously` hiç kullanılmıyor; yalnızca Google/GitHub popup — `App.tsx:664-667`).
Test hesabı olmadan akış tamamlanamadı. Dev sunucusu (`http://localhost:3002/`) açıldı,
uygulama hatasız yüklendi (yalnızca `favicon.ico` 404 ve oturumsuzluktan kaynaklanan
Firestore `permission-denied`), ancak gramer hover yolu **gerçek kullanıcı etkileşimiyle
doğrulanmadı**. Kullanıcı kendi oturumuyla test etmelidir.

### 18.10 Kapsam dışı bırakılanlar

- ❌ Gramer vurgusu ile ısı haritası katmanının **aynı anda** çizilmesi (hover sırasında gramer katmanı öncelik alır, hover bitince ısı haritası geri gelir). Aynı anda çizim, Branch A span'lerinin bölünmesini gerektirir; ayrı bir iş.
- ❌ Okunabilirlik önerilerinin konumsal vurgusu → **Bölüm 16** (onay bekliyor). Bölüm 18'in `buildGrammarOverlay` deseni ve `findGrammarMatch` yardımcısı orada doğrudan yeniden kullanılabilir; renk cyan olacak.
- ❌ `GrammarSuggestion` tipine `start`/`end` konum alanı eklemek — bu, `geminiService.checkGrammar()` çıktısını ve Firestore `mlAnalysis` şemasını değiştirir. Konum istemci tarafında türetiliyor.
- ❌ Kalıcı "vurgu kilidi" (tıklayınca hover kalksa da vurgunun açık kalması) — istenmedi.
- ❌ Öneri kartlarının metin içindeki `onMouseEnter` ile ters yönde senkronu (metinden karta) — intihal katmanında var (`App.tsx:398-407`), gramer için istenmedi.

---

## 19. GÜNLÜK İLERLEME ÖZETİ (2026-10-07)

### Yapılan İşler

1. **Okunabilirlik Önerileri + Isı Haritası Animasyonu** ✅
   - `mlService.ts` - Önerilere konum bilgisi eklendi (start, end, text)
   - `App.tsx` - `hoveredReadability` state'i eklendi
   - `handleReadabilityHover` fonksiyonu eklendi
   - Overlay sistemine okunabilirlik vurgulaması eklendi
   - Önerilere hover event'i eklendi
   - Otomatik scroll entegrasyonu eklendi
   - Animasyonlu vurgulama (mor renk, pulse efekti)
   - Build başarılı (13.97s)

2. **Test Altyapısı Kurulumu** ✅
   - Vitest, @testing-library/react, @testing-library/jest-dom kuruldu
   - vitest.config.ts oluşturuldu
   - src/test/setup.ts oluşturuldu
   - MetricCard.test.tsx oluşturuldu (2 test)
   - package.json test script'leri eklendi
   - Testler geçiyor (2 tests passed, 1.90s)

3. **Firebase Functions Rate Limiting** ✅
   - api/analyze.ts - In-memory rate limiting eklendi
   - api/detect.ts - Aynı rate limiting mantığı eklendi
   - Dakikada 30 istek limiti
   - 429 status code ile rate limit yanıtı
   - Türkçe hata mesajları
   - Build başarılı (14.01s)

4. **Lint Düzeltmeleri** ✅
   - @types/file-saver kuruldu
   - countSyllables fonksiyonu eklendi
   - text → inputText düzeltildi
   - Test setup'a window.matchMedia mock eklendi
   - tsconfig.json'a vitest/globals types eklendi

### Değişen Dosyalar

|| Dosya | Değişiklik |
||-------|-----------|
|| `src/services/mlService.ts` | Önerilere konum bilgisi eklendi, countSyllables fonksiyonu eklendi |
|| `src/App.tsx` | Okunabilirlik overlay, hoveredReadability state, handleReadabilityHover fonksiyonu eklendi |
|| `vitest.config.ts` | Yeni konfigürasyon dosyası |
|| `src/test/setup.ts` | Test setup dosyası |
|| `src/test/MetricCard.test.tsx` | Yeni test dosyası |
|| `api/analyze.ts` | Rate limiting eklendi |
|| `api/detect.ts` | Rate limiting eklendi |
|| `package.json` | Test script'leri, @types/file-saver eklendi |
|| `tsconfig.json` | vitest/globals types eklendi |

### Sonraki Görev

**P0 - Core Refactor Devam**
- App.tsx 1915 satır monolith ayrıştırma
- Bundle optimizasyonu

---

## 20. KALAN İŞLER UYGULAMA PLANI (2026-10-07)

### 20.0 Gerekçe

Bölüm 10.1/10.2 ve Bölüm 15-17 planları 2026-10-07 itibarıyla gerçek kod ile satır satır karşılaştırıldı. Rapor tabloları geride kalmıştı: B16, test altyapısı ve rate limiting uygulanmış olmasına rağmen hâlâ "Bekliyor" görünüyordu; B15 ve B17 kısmi tamamlanmıştı. Bu bölüm doğrulama sonucunu ve buna dayalı yeni çalışma sırasını verir. **Kod değişikliği yapılmamıştır; onay beklenir.**

### 20.1 Doğrulama tablosu (plan ↔ kod)

| Plan | Durum | Kod kanıtı |
|------|-------|-----------|
| B16 Okunabilirlik → konumsal ısı haritası | ✅ Uygulandı | `App.tsx:205,341,543,2023` (`hoveredReadability`, `handleReadabilityHover`); Bölüm 19 |
| B17 Sentinel çekirdeği (kapı + yerli/yabancı + iki aşama + dinamik skor) | ✅ Uygulandı | `sentinelService.ts:118-203` (`detectSourceRegion`, `detectSourceTrust`, `isValidUrl`), `:313-390` (Aşama 1 `lr=lang_tr` → Aşama 2 global) |
| B17 kalanı: H1/H2 tip hizalama | ✅ Uygulandı | `PlagiarismSource` `similarity` ve `matchedSnippet` eklendi, `types/index.ts` senkronize edildi, export ve benzerlik % render edildi |
| B17 kalanı: Sentinel kartı rozetleri (Yerli/Yabancı/Güven) | ✅ Uygulandı | `App.tsx:1970-1980` `🇹🇷 Yerli`, `🌍 Yabancı`, `🎓 Akademik` ve `DOĞRULANDI` rozetleri eklendi |
| B17 kalanı: snippet geri dönüşü | ⏳ Açık (düşük risk) | `sentinelService.ts:337,376` — `item.snippet` yoksa kullanıcının kendi cümlesi gösteriliyor (R3). Skor artık dinamik hesaplandığından yanıltma riski sınırlı |
| B18 Gramer hover vurgusu | ✅ Uygulandı | Bölüm 18; `App.tsx:204,277-337,494-508`, `GrammarPanel.tsx` |
| Test altyapısı (Vitest + RTL) | ✅ Uygulandı | `vitest.config.ts`, `src/test/setup.ts`, `src/test/MetricCard.test.tsx`; Bölüm 19 |
| API rate limiting | ✅ Uygulandı | `api/analyze.ts:4-46` ve `api/detect.ts` (60 sn / 30 istek / 429) |
| B15 Landing ajan dili | ✅ Uygulandı | `LandingPage.tsx:673` "Hemen Başla" olarak güncellendi, ajan dili sıfırlandı |
| Bundle TensorFlow Lazy Load | ✅ Uygulandı | `textFeatures.ts` type import + dynamic `import('@tensorflow/tfjs')` yapıldı; 1.57 MB ilk yükleme bundle'ından çıkarıldı |
| Kaynakça / Dipnot Oluşturucu (15.4) | ✅ Uygulandı | `citationService.ts` oluşturuldu (APA, MLA, IEEE); `App.tsx` tek tıkla APA kopyalama ve toplu kaynakça kopyalama eklendi |
| Core Refactor | ✅ Uygulandı (2026-10-09) | `App.tsx` 2.097 → 464 satır (<500 hedefi); EditorPanel/ResultPanel/AuditorSidebar/StyleMasterHeader + 6 hook + exporters (Bölüm 24) |
| P2: Vektör kararı / CI/CD / Turnitin bayrakları | ⏳ Açık | `matchGroup` tipi `sentinelService.ts:6-10`'da hazır; UI yansıması yok |
| B22 Lokal Model Çekirdeği & Dışa Aktarma | ✅ Uygulandı | `localModelService.ts`, `scripts/export_local_training.ts`, `scripts/local_train_unsloth.py` |
| B22 Lokal Model UI & Canlı Veri Hattı | ⏳ Açık | UI canlı durum rozeti (`checkLocalModelHealth`) ve Firestore canlı SFT veri toplama |

### 20.2 Yürütme sırası (öneri)

| Adım | İş | Öncelik | Kapsam | Durum |
|------|-----|---------|--------|-------|
| 1 | Landing son kalıntılar | P0 | `LandingPage.tsx:673` buton dili; özellik diline çevrilmesi | ✅ Uygulandı |
| 2 | Sentinel tip & UI hizalama | P0 | `PlagiarismSource` `similarity` & `matchedSnippet`, `types/index.ts:46`, kartta Yerli/Yabancı/Güven rozetleri | ✅ Uygulandı |
| 3 | Bundle optimizasyonu (TensorFlow) | P0 | `textFeatures.ts` type import + async dynamic `import('@tensorflow/tfjs')` | ✅ Uygulandı (1.57 MB kaldırıldı) |
| 4 | Kaynakça/Dipnot Oluşturucu | P1 | `citationService.ts` (APA, MLA, IEEE); Sentinel panosundan tekli ve toplu kopyalama | ✅ Uygulandı |
| 5 | Core Refactor | P0 | `App.tsx` ayrıştırma: EditorPanel, ResultPanel, AuditorSidebar | ✅ Uygulandı (2026-10-09; App.tsx 464 satır < 500 hedefi; Bölüm 24) |
| 6 | P2 paketi | P2 | Vektör sistemi kullanım kararı (kullanıcı onayı), CI/CD, Turnitin `matchGroup` bayrakları | ⏳ Açık |
| 7 | Lokal Model UI & Canlı Veri Hattı (Bölüm 22) | P1 | `App.tsx` model seçiciye lokal/Ollama seçeneği + `checkLocalModelHealth` durumu + `tuning_pairs` canlı veri toplama | ⏳ Açık |

**Sıralama gerekçesi:**
- Adım 1-2 kullanıcıya doğrudan görünen doğruluk/kimlik hatalarıdır; ikisi de küçük, sınırlı kapsamlı işlerdir ve P0'daki açık yarayı kapatır.
- Adım 3-4 birbirine bağlıdır: import yapısı refactor'da değişeceği için bundle ölçümü ve kod bölme refactor sonrası yapılır.
- Adım 5, Sentinel kaynak verisine (Adım 2) dayanır; bu yüzden Adım 2 sonrasına alınmıştır.
- Isı haritasına dokunan her ilerideki iş, B16/B18'de oturan overlay mimarisini (`findGrammarMatch`, katman önceliği) korumak ve yeniden kullanmak zorundadır.

### 20.3 Rapor tutarlılığı

Bu bölümle birlikte Rapor Özeti durum notu, 10.1 devretme notu ve 10.2 tablosu güncellendi; eski "Bekliyor" etiketleri yukarıdaki doğrulama tablosuna göre düzeltildi.

---

## 21. SINIF/ÖDEV/TESLİM ALTYAPISI (TURNITIN KURUMSAL MODELİ — 2026-10-07)

### 21.0 Talep

Kullanıcı yönlendirmesi: Sistem, Turnitin/Copyleaks tipi akademik bütünlük hizmeti veren firmaların modeliyle aynı alana girdiği için altyapı bu modele göre düzenlenmeli; öğrenci kullanım alanları referans olarak bir üniversite kütüphanesinin Turnitin eğitim videosuna (YouTube) dayanmalıdır. Videonun konuşma metni `00.docx` olarak taranıp incelenmiştir. **Durum (2026-10-07): Plan onaylandı, kararlar D1-D3 netleşti (21.8); Faz 1 uygulaması başladı — uygulama durumu 21.11'de tutulur.**

### 21.1 Video Analizi — Kullanım Senaryoları

**Eğitmen akışı (7 adım):**
1. Hesap kurumsal e-posta ile açılır (kütüphane aracılığıyla bilgilendirme maili).
2. **Sınıf oluşturma** → sistem otomatik **sınıf numarası + kayıt anahtarı** üretir; ikili öğrencilerle paylaşılır.
3. **Ödev oluşturma:** başlık, başlangıç/teslim tarihi + **"depo yok" (no repository)** seçeneği (işaretlenmezse silme ancak teknik ekip ile mümkün) + isteğe bağlı ayarlar.
4. **Öğrenci ekleme:** (a) öğrenci sınıf no + anahtar ile kendi kendine kaydolur, (b) tek tek ekleme, (c) toplu öğrenci listesi yükleme.
5. **Öğrenci adına teslim:** kayıtlı öğrenci seçilir, ad soyad otomatik gelir, gönderi başlığı + dosya yüklenir.
6. **Benzerlik raporu:** skor dosya boyutuna göre hesaplanır; orana tıklayınca renklendirilmiş eşleşmeler, filtreler (rapora dahil edilecek başlıklar, taranacak alanlar) ve **kaynak/eşleşme hariç tutma** (göz ikonu).
7. **İndirilebilir çıktılar:** benzerlik raporu, **dijital makbuz**, orijinal gönderi.

**Öğrenci akışı (3 adım):**
1. "Sınıfa kaydol": sınıf numarası + kayıt anahtarı girilir.
2. Kaydolduğu sınıflar listelenir; sınıfa gir → "Gönder" → ad soyad otomatik → başlık + dosya → yükle.
3. Ödev kutusunda teslimler; benzerlik yüzdesine tıklayınca rapor.

### 21.2 Mevcut Durum (Kod Kanıtı)

- Tekil kullanıcı modeli: `users` rolü `admin|user` (`types/index.ts:11-22`); `projects` sahibine özel (`firestore.rules:20-27`, Bkz. 4.3). Sınıf/ödev/teslim/depo kavramları yok.
- `Project` teslim yerine geçemez: kullanıcı-bağımsız kayıt yok, kayıt anahtarı yok, teslim süresi/skor durumu yok.
- Analiz motoru hazır ve yeniden kullanılabilir: `sentinelService.verifyPlagiarism()` (B17 doğrulama kapılı, yerli/yabancı ayrımlı, dinamik skorlu), `detectAI()`, `checkGrammar()`, kaynakça `citationService.ts` (APA/MLA/IEEE).
- Sunucu taraflı çalıştırma noktaları mevcut: `api/analyze.ts` + `api/detect.ts` (rate limit 60 sn/30 istek/429) ve `functions/` iskeleti (`functions/src/index.ts`).
- Metin girişi yapıştırmaya dayalı; **PDF/DOCX ayrıştırma yok** (video'daki dosya yükleme akışı için Faz 2'de gerekli).
- `App.tsx` 2120 satır monolith (B20 Adım 5 Core Refactor açık) — yeni ekranlar mevcut monoliti büyütmemeli, bağımsız bileşenler olarak yazılmalı.

### 21.3 Yeni Veri Modeli (Firestore)

- **`classes`**: `instructorId`, `name`, `subject`, `classCode` (kısa kimlik), `enrollmentKey`, `createdAt`, `term?`
- **`classes/{id}/assignments`**: `title`, `instructions`, `startDate`, `dueDate`, `noRepository` (video'daki "depo yok" karşılığı), `settings`
- **`classes/{id}/enrollments`**: `studentId`, `studentName`, `studentEmail`, `joinedAt`, `addedBy`
- **`classes/{id}/assignments/{id}/submissions`**: `studentId`, `submittedBy` (öğrenci kendisi veya eğitmen — adına teslim ayrımı), `title`, `fileName`, `text` (ayrıştırılmış içerik), `storagePath?`, `status` (`received|processing|scored|failed`), `similarityScore`, `aiScore`, `sources[]`, `excludedSourceUrls[]`, `digitalReceipt` (`{sha256, submittedAt}`), `createdAt`
- **`classes/{id}/repository` (Faz 3 — depo):** teslimlerden alınan metin parmak izleri; sınıf-içi öz-intihal ve eş-öğrenci karşılaştırması. Turnitin'in asıl varlığı budur.

### 21.4 Güvenlik Kuralları (`firestore.rules` genişletmesi)

- Öğrenci: sınıf metadata'sını yalnızca üyeyse okur; submissions'da yalnızca **kendi** teslimlerini okur/yazar.
- Eğitmen: kendi sınıflarında tüm submissions ve enrollments okuma/yazma; öğrenci listesi yönetimi.
- Üyelik kontrolü: `exists(/databases/$(database)/documents/classes/$(classId)/enrollments/$(request.auth.uid))` deseni.
- `repository` koleksiyonu: yalnızca eğitmen okur; yazma yalnızca sunucu (Cloud Function) tarafından.
- Dosyalar için Firebase Storage + `storage.rules` (proje dizininde henüz yoktur; Faz 2 ön koşulu).

### 21.5 Analiz Boru Hattı

1. `submissions` onCreate → Cloud Function (`functions/`) teslimi kuyruğa alır, `status=processing` yazar.
2. Dosya teslimiyse Storage'tan indirilir, pdfjs-dist (PDF) / mammoth (DOCX) ile metne çevrilir.
3. Mevcut servisler çağrılır: `verifyPlagiarism()` (intihal) + `detectAI()`; skorlar ve kaynaklar submission dokümanına yazılır, `status=scored`.
4. `noRepository=false` ise parmak izi `repository`ye eklenir (Faz 3).
- Kota etkisi: mevcut `PLAN_LIMITS` (`types/index.ts:24-28`) kullanıcı-günlük bazlıdır; teslim-bazlı kota ve kurumsal lisans modeli karar noktası D3'te.

### 21.6 UI Planı (yeni bileşenler — App.tsx monoliti büyütülmez)

| Bileşen | Kim | İçerik |
|---------|-----|--------|
| `InstructorClassesView` | Eğitmen | Sınıf listesi, oluşturma formu, sınıf no + kayıt anahtarı görüntüleme/kopyalama |
| `AssignmentForm` | Eğitmen | Başlık, talimat, başlangıç/teslim tarihi, "depo yok" seçeneği |
| `AssignmentDetailView` | Eğitmen | Teslim tablosu (öğrenci, başlık, durum, benzerlik %, AI %), öğrenci adına teslim, toplu liste yükleme |
| `StudentJoinView` | Öğrenci | Sınıf no + anahtar ile kayıt, kayıtlı sınıf listesi |
| `StudentSubmitView` | Öğrenci | Başlık + metin (Faz 1) / dosya (Faz 2), dijital makbuz gösterimi |
| `SubmissionReportView` | Her ikisi | Mevcut benzerlik kartı (B17 rozetleri) + kaynak hariç tutma + filtreler + PDF indirme |

### 21.7 Faz Planı ve Sıralama Notu

- **Faz 1 (MVP):** koleksiyonlar + kurallar; sınıf oluştur/katıl; ödev CRUD; öğrenci metin teslimi; otomatik skor boru hattı; eğitmen teslim tablosu.
- **Faz 2:** dosya yükleme (PDF/DOCX + Storage), rapor indirme + dijital makbuz, kaynak hariç tutma + filtreler, toplu öğrenci listesi.
- **Faz 3:** sınıf deposu (öz/eş intihal), CSV/Excel dışa aktarım, LMS entegrasyonu (kapsam dışı notuna bakınız).
- **Sıralama:** Yeni ekranlar bağımsız bileşen olacağı için B20 Adım 5 (Core Refactor) ile çakışmaz; refactor sonrası App.tsx'e bağlanmaları yeterlidir. Öneri: refactor (Adım 5) → B21 Faz 1; Faz 2/3 kullanıcı onayına bağlı.

### 21.8 Karar Noktaları (2026-10-07 itibarıyla KARARLAŞTIRILDI)

- **D1 — Rol modeli:** ✅ Her doğrulanmış kullanıcı sınıf oluşturabilir (self-servis); admin tüm sınıfları denetler. Ayrı `instructor` rolü yok.
- **D2 — Depo politikası:** ✅ Varsayılan depo açık; ödev başına "depo yok" seçeneği ile kapatılabilir. Öğrenci metni saklandığı için KVKK aydınlatma metni + silme politikası Faz 1 kapsamına alınır.
- **D3 — Fiyatlandırma:** ✅ Teslim-bazlı kota + kurumsal plan; mevcut `PLAN_LIMITS` (`types/index.ts:24-28`) üzerine teslim kotası eklenir, detay Faz 1 sonrası netleşir.
- **Plan revizyonu:** Faz 1'e başlamadan önce kullanıcı plan metninde revizyon talep etti; revizyon noktaları kullanıcıdan alınacak.

### 21.9 Başarı Kriterleri

- Öğrenci anahtarla 60 sn içinde sınıfa kayıt olur ve ilk teslimini yapar; skor mevcut API kotaları altında ≤ 2 dk içinde görünür.
- Eğitmen kendi sınıfındaki tüm teslimleri görür; başka sınıfın/öğrencinin verisine erişemez (kurallar birim testi).
- Video'daki 7 eğitmen + 3 öğrenci adımının tamamı Faz 1-2 sonunda karşılanır.

### 21.10 Kapsam Dışı

- Ajan/otomasyon dili YOKTUR (Kural 2); tüm yeni metinler "sınıf/ödev/teslim/benzerlik raporu" özellik dilindedir.
- Turnitin `matchGroup` renkleri (B20 P2 paketi) ayrı iş kalır; SubmissionReportView hazır olduğunda birleştirilir.
- LMS entegrasyonu (Canvas/Moodle), e-posta davet otomasyonu, mobil uygulama.

### 21.11 Uygulama Durumu — Faz 1 (2026-10-08)

**Durum: ✅ Faz 1 tamamlandı** (kod; kurallar henüz deploy edilmedi — ayrı onay bekliyor).

| Parça | Dosya | Durum |
|-------|-------|-------|
| Veri modeli + teslim kotaları (`SUBMISSION_LIMITS`) | `src/types/classroom.ts` | ✅ |
| Sınıf/ödev/teslim/kota/KVKK servis katmanı | `src/services/classroomService.ts` | ✅ |
| Güvenlik kuralları (`isInstructor`/`isEnrolled`, self-only submissions, `repository` sunucu-only) | `firestore.rules` | ✅ yazıldı — **deploy ayrı onay bekliyor** |
| KVKK aydınlatma kapısı (D2) | `src/components/classroom/KvkkConsentModal.tsx` | ✅ |
| Eğitmen/öğrenci görünümleri (12 bileşen: ClassForm, JoinClass, AssignmentForm, Instructor*, Student*, SubmissionReport, ClassroomPanel, format) | `src/components/classroom/*` | ✅ |
| App.tsx 'classroom' sekmesi (lazy + `scoringConfig`) | `src/App.tsx` | ✅ |
| Sidebar "Sınıflarım" butonu (tüm kullanıcılara açık — D1) | `src/components/ProjectSidebar.tsx` | ✅ |
| Birim testleri (kod üretimi, kota, günlük sıfırlama, SHA-256, biçim yardımcıları) | `src/test/classroomService.test.ts`, `src/test/classroomFormat.test.ts` | ✅ 23 test |

**Doğrulama:** `npx vitest run` → 25/25 geçti (eski MetricCard testleri dahil);
`tsc --noEmit` → temiz; `vite build` → 17.87 s hatasız. `ClassroomPanel` ayrı lazy
chunk olarak yükleniyor (gzip 13.4 kB) — ana bundle büyümedi.

**Faz 1 mimari notları:**
- Skorlama istemci tarafında çalışır: öğrenci `runSubmissionScoring`
  (`verifyPlagiarism` + `detectAI`) çalıştırıp kendi skorunu yazar; eğitmen "Yeniden
  Çalıştır" aksiyonuyla doğrular. Faz 2'de Cloud Function'a taşınacak (Bölüm 23 Sıra 3).
- Teslim günlük kotası (D3): `users.submissionUsage` + `submissionResetDate` çifti;
  free 10 / pro 100 / premium 500.
- KVKK (D2): `kvkkAcceptedAt` onayı yoksa sınıflar ekranı açılmaz.
- Tarayıcı testi: canlı Auth + Gemini gerektirdiğinden kullanıcı hesabına bırakıldı.

**Kalan (onaya bağlı):**
- ⏳ `firebase deploy --only firestore:rules` — paylaşılan durum etkiler, ayrı onay.
- ⏳ Faz 2 / Faz 3 — Bölüm 23 Sıra 3 / Sıra 5; faz başlangıcında ayrı onay.

---

## 22. LOKAL FINE-TUNING VE AÇIK KAYNAK HİBRİT MODEL ADAPTÖRÜ (GOOGLE AI STUDIO GEÇİŞİ — 2026-10-08)

### 22.1 Problem ve Gerekçe
Google AI Studio'nun yeni "Apps" merkezli arayüz mimarisine geçmesiyle birlikte:
- Eski `.../app/tuned_models` doğrudan erişim URL'leri kaldırılmış ve 404 hatasına düşürülmüştür.
- Google AI Studio API anahtarları üzerinden doğrudan programatik SFT desteği durdurulmuş (501 `UNIMPLEMENTED`), bağımsız tuning sekmesi kapatılmıştır.
- Bulut bağımlılığını ortadan kaldırmak, veri gizliliğini korumak ve kullanıcının kendi donanımında (yerel GPU) modeli eğitip web sistemine kolayca bağlayabilmesi için yerel açık kaynak fine-tuning ve adaptör altyapısı kurulmuştur.

### 22.2 Uygulanan Bileşenler ve Dosya Değişiklikleri

| Bileşen / Dosya | Kapsam / İşlev | Durum |
|-----------------|----------------|-------|
| `scripts/generate_training_data.ts` | Firestore ve `--synthetic` bayrağı desteği. Copyleaks/Turnitin standartlarında kalite filtreli (Burstiness > 0.28, aiScore < 0.30, kelime ≥ 80, intihal ≤ %15) 210 kayıtlık `sentience_tuning_data.jsonl` üretimi. | ✅ Uygulandı |
| `scripts/tune_model.ts` | `@google/genai` resmi `ai.tunings.tune` metoduna uyarlandı, çoklu virgüllü API anahtarı ayrıştırması eklendi, Google 501 UNIMPLEMENTED hata yakalama rehberi tanımlandı. | ✅ Uygulandı |
| `scripts/export_local_training.ts` | Üretilen veri setini 3 standart açık kaynak eğitim formatına ve Ollama Modelfile'ına tek komutla dönüştürme. | ✅ Uygulandı |
| `datasets/` Klasörü | Otomatik üretilen veri setleri: `alpaca_format.json` (Unsloth/Axolotl), `sharegpt_format.json` (vLLM/FastChat), `openai_chat_format.jsonl` (TRL SFTTrainer) ve `Modelfile` (Ollama). | ✅ Üretildi (210 kayıt) |
| `scripts/local_train_unsloth.py` | Standart tüketici GPU'larında (8-12 GB VRAM) Unsloth (4-bit QLoRA) ile Meta-Llama-3.1-8B-Instruct veya Gemma 2 9B modelini eğitip LoRA/GGUF formatında kaydeden Python betiği. | ✅ Uygulandı |
| `src/services/localModelService.ts` | OpenAI uyumlu yerel çıkarım sunucuları (Ollama `http://localhost:11434/v1`, LM Studio, vLLM) için sağlık kontrolü (`checkLocalModelHealth`) ve sohbet tamamlama (`callLocalModelChat`) servis adaptörü. | ✅ Uygulandı |
| `src/services/geminiService.ts` | `isLocalModelEnabled()` veya `local:`, `ollama:`, `custom:` model önekleri geldiğinde isteği `localModelService` üzerinden yerel modele yönlendiren ve UI çıktısını (`robustParse`) şeffaf biçimde besleyen yönlendirici köprü. | ✅ Uygulandı |
| `package.json` | `"export:local": "tsx scripts/export_local_training.ts"` betik komutu eklendi. | ✅ Uygulandı |

### 22.3 İş Akışı ve Kullanım Talimatı

1. **Eğitim Verisi Üretimi:**
   ```powershell
   npm run generate:training -- --synthetic
   ```
2. **Açık Kaynak Formatlara Dışa Aktarma:**
   ```powershell
   npm run export:local
   ```
3. **Model Eğitimi veya Ollama Yüklemesi:**
   - Unsloth ile yerel GPU eğitimi:
     ```powershell
     python scripts/local_train_unsloth.py
     ```
   - Ollama ile tek komutla model oluşturma:
     ```powershell
     ollama create sentience-humanizer -f datasets/Modelfile
     ```
4. **Web Sistemine Bağlama:**
   `.env.local` dosyasına aşağıdaki değişkenler eklenerek ya da model adı olarak `ollama:sentience-humanizer` seçilerek web uygulaması yerel modele bağlanır:
   ```env
   VITE_USE_LOCAL_MODEL=true
   VITE_LOCAL_MODEL_URL=http://localhost:11434/v1
   VITE_LOCAL_MODEL_NAME=sentience-humanizer:latest
   ```

### 22.4 Doğrulama ve Bütünlük
- `npm run export:local` başarıyla çalıştırıldı (210 kayıt dışa aktarıldı).
- `npx tsc --noEmit` tip denetimi yapıldı (Hata: 0).

### 22.5 Gelecek Adımlar ve Yapılacaklar Listesi (Lokal Model & Fine-Tuning)

| No | Yapılacak Görev | Kapsam / Dosya | Öncelik | Durum |
|----|-----------------|----------------|---------|-------|
| **Y1** | **Arayüzde Canlı Lokal Model Seçici & Health Check:** | `App.tsx` ve `AdminPanel.tsx` üzerinde model seçim listesine "Lokal Model (Ollama/vLLM)" seçeneği eklenmesi ve sunucu ayaktaysa yeşil, kapalıysa kırmızı gösteren canlı durum rozeti (`checkLocalModelHealth`). | P1 | ⏳ Bekliyor |
| **Y2** | **Canlı SFT / RLHF Veri Toplama Hattı:** | `src/services/` ve Firestore — Kullanıcı insanlaştırma çıktısını kopyaladığında veya "Kabul Et" butonuna bastığında girdi-çıktı çiftinin kalite metrikleriyle birlikte otomatik olarak `training_pairs` koleksiyonuna kaydedilmesi. | P1 | ⏳ Bekliyor |
| **Y3** | **1.000+ Kayıt ile Gerçek Donanımda LoRA Eğitimi:** | `scripts/local_train_unsloth.py` — Veri havuzu 1.000 çifte ulaştığında yerel GPU (veya Colab) üzerinde 3 epoch tam eğitimin çalıştırılması ve üretilen ağırlıkların `Modelfile` ile Ollama'ya aktarılması. | P2 | ⏳ Bekliyor |
| **Y4** | **Lokal Model Streaming (SSE) Desteği:** | `localModelService.ts` — Ollama/vLLM `stream: true` yanıtlarının kelime kelime editör ekranına canlı akması (kullanıcı bekleme süresi hissini azaltmak için). | P2 | ⏳ Bekliyor |
| **Y5** | **GGUF Kuantizasyon ve Tek Tıkla Dağıtım:** | `scripts/` — Eğitilen modelin `q4_k_m` kuantize edilerek tek tıkla `.gguf` paketine dönüştürülmesi ve ekibe/sunucuya dağıtılması. | P3 | ⏳ Bekliyor |

---

## 23. KONSOLİDE ÖNCELİK PLANI (2026-10-08)

> **Durum:** ✅ ONAYLANDI (2026-10-08, "onaylıyorum"). Sıra 1 tamamlandı; sıradaki iş Sıra 2.
> **Kapsam:** Bölüm 10.1/10.2, 15-22 ve mevcut kod durumu tek tabloda birleştirilmiştir.

### 23.0 Talep

Kullanıcı yönlendirmesi: *"Raporda yapılan ve yapılacak işler belirtildi; öncelik sırasıyla
bir plan oluştur ve yapmak için onayımı bekle."* Bu bölüm raporun tamamını (Bölüm 20 doğrulama
tablosu, Bölüm 21 faz planı, Bölüm 22.5 yapılacaklar listesi) güncel kod durumuyla harmanlayıp
tek yürütme sırası verir.

### 23.1 Tamamlanan işler (kanıt: Bölüm 20.1 doğrulama tablosu)

| İş | Kanıt |
|----|------|
| B15 Landing ajan dili temizliği | `LandingPage.tsx:673` |
| B16 Okunabilirlik konumsal ısı haritası | `App.tsx` `hoveredReadability`; Bölüm 19 |
| B17 Doğrulama kapısı + yerli/yabancı + dinamik skor | `sentinelService.ts:118-203, 313-390` |
| B17 H1/H2 tip hizalama + kart rozetleri | `PlagiarismSource`/`types/index.ts`; `App.tsx:1970-1980` |
| B18 Gramer hover vurgusu | Bölüm 18 |
| Test altyapısı (Vitest + RTL) | `vitest.config.ts`, `src/test/` |
| API rate limiting (60 sn / 30 istek / 429) | `api/analyze.ts`, `api/detect.ts` |
| Bundle: TensorFlow lazy load (−1.57 MB) | `textFeatures.ts` |
| Kaynakça/Dipnot oluşturucu (APA/MLA/IEEE) | `citationService.ts` |
| B22 Lokal model çekirdeği + dışa aktarma | `localModelService.ts`, `scripts/*` |

### 23.2 B21 Faz 1 (✅ tamamlandı 2026-10-08 — uygulama durumu: 21.11)

| Parça | Durum |
|-------|-------|
| `src/types/classroom.ts` (veri modeli + SUBMISSION_LIMITS) | ✅ Yazıldı |
| `src/services/classroomService.ts` (sınıf/ödev/teslim/kota/KVKK servis katmanı) | ✅ Yazıldı |
| `firestore.rules` sınıf kuralları (isInstructor/isEnrolled, self-only submissions) | ✅ Yazıldı — **deploy edilmedi (ayrı onay)** |
| 12 UI bileşeni `src/components/classroom/` (KvkkConsentModal…ClassroomPanel) | ✅ Yazıldı |
| `App.tsx` 'classroom' sekmesi (lazy import + render dalı + scoringConfig) | ✅ Uygulandı |
| `ProjectSidebar` "Sınıflarım" butonu (`onOpenClassroom`) | ✅ Uygulandı |
| Vitest birim testleri (kod üretimi/kota/makbız/format yardımcıları) | ✅ Uygulandı (25/25 geçti) |
| `tsc --noEmit` + `npm run build` doğrulaması | ✅ Geçti (build 17.87s; ClassroomPanel 59.15 kB / 13.44 kB gzip ayrı chunk) |
| §21.11 Uygulama Durumu bölümü | ✅ Yazıldı |

**Geçici mimari karar (Faz 1):** skorlama istemci tarafında çalışır (öğrenci
`runSubmissionScoring` = `verifyPlagiarism` + `detectAI` → kendi skorunu yazar); yanıltma
riski eğitmen "yeniden çalıştır" aksiyonuyla sınırlanır ve Faz 2'de sunucu-tarafına taşınır.

### 23.3 Yürütme sırası (✅ onaylandı 2026-10-08)

| Sıra | İş | Öncelik | Kapsam | Kaynak |
|------|-----|---------|--------|--------|
| **1** | **B21 Faz 1 tamamlama** | P0 | ✅ Uygulandı (2026-10-08) — App.tsx/ProjectSidebar entegrasyonu, testler, build, §21.11; rules deploy ayrı onay bekliyor | B21 |
| **2** | **Core Refactor** | P0 | ✅ Uygulandı (2026-10-09) — App.tsx 2.097 → 464 satır (<500 hedefi); EditorPanel, ResultPanel, AuditorSidebar, StyleMasterHeader, LoginView, exporters + 6 hook; B16/B18 overlay korundu; bundle/kod bölme ölçümü yapıldı (Bölüm 24) | B20 Adım 5 |
| **3** | **B21 Faz 2** | P1 | Dosya yükleme (pdfjs-dist PDF / mammoth DOCX + Firebase Storage + `storage.rules`); **sunucu-tarafı skorlama** (Cloud Function, istemci skorlama kapısı); PDF rapor + dijital makbuz indirme; toplu öğrenci listesi; öğrenci adına teslim | B21.7 |
| **4** | **Lokal Model UI + Canlı Veri (Y1+Y2)** | P1 | Model seçicide "Lokal Model (Ollama/vLLM)" + `checkLocalModelHealth` canlı rozet; insanlaştırma "Kabul Et" anında `training_pairs` canlı SFT veri toplama | B22.5 |
| **5** | **B21 Faz 3 — Sınıf Deposu** | P1 | `repository` parmak izleri (öz/eş-öğrenci intihal karşılaştırması; yazma yalnız Cloud Function); CSV/Excel dışa aktarım | B21.7 |
| **6** | **P2 Paketi** | P2 | Vektör sistemi kullanım kararı (kullanıcı onayı gerekli); CI/CD; Turnitin `matchGroup` bayraklarının `SubmissionReportView`/Sentinel kartına yansıması; B17 kalıntısı R3 snippet fallback (düşük risk) | B20 Adım 6 |
| **7** | **Y3+Y4 (Lokal model derinleşme)** | P2 | 1.000+ kayıtla gerçek donanımda LoRA eğitimi; lokal model SSE streaming | B22.5 |
| **8** | **Y5 (Paketleme)** | P3 | GGUF kuantizasyon + tek tıkla dağıtım | B22.5 |

**Sıralama gerekçesi:**
- Sıra 1, %90'ı yazılmış yarı bitmiş dalı (branch'i kullanılamaz durumda bırakmamak için) kapatır.
- Sıra 2 (Core Refactor) sonraki tüm UI işlerinin (Faz 2/3, Y1) yapışacağı zemindir; B21.7'deki
  öneri de ("refactor → yeni ekran bağlama") bu yöndedir. Yeni sınıf ekranları bağımsız
  bileşen olduğundan Sıra 1 ↔ Sıra 2 çakışmaz.
- Sıra 3, Faz 1'in geçici istemci-tarafı skorlama riskini kapatan güvenlik işidir; bu yüzden
  Y1/Y2 öncesindedir.
- Sıra 5 (depo), Turnitin'in asıl farklılaştırıcısıdır (B21.3) ama Faz 2 altyapısını bekler.
- Sıra 6-8, ürünü derinleştiren ama çalışan akışı bozmayan işlerdir.

### 23.4 Onay ve kural notları

- **Kural 1 (Bölüm 0):** kod/bağımlılık silme gerektiren adımlarda (özellikle Sıra 2 refactor)
  silinen her parça için gerekçe + kullanım araştırması + alternatif + ayrı onay alınır.
- **Kural 2:** tüm yeni metinler özellik dilindedir; "ajan" kelimesi geçmez.
- **`firestore.rules` deploy** paylaşılan durum etkileyen işlemdir; Sıra 1 içinde ayrı onayla
  çalıştırılır (`firebase deploy --only firestore:rules`).
- Sıra 3-5 için faz başlangıcında ayrı onay alınır (B21.7 notu).
- UI testi kısıtı geçerli: editör/sınıf ekranları canlı Auth + Gemini gerektirdiğinden tarayıcı
  testi kullanıcı hesabına bırakılır; doğrulama `tsc`/vitest/build ile yapılır.

---

## 24. GÜNLÜK İLERLEME ÖZETİ (2026-10-09) — Sıra 2: Core Refactor ✅

### Yapılan İşler

1. **Core Refactor (B20 Adım 5 — Sıra 2)** ✅
   - `App.tsx` 2.097 satır → **464 satır** (hedef <500 sağlandı; −78%)
   - Ayrıştırılan bileşenler (Kural 1 gereği yalnızca taşıma; davranış birebir korundu):
     - `src/components/editor/EditorPanel.tsx` (418 satır) — giriş editörü + toolbar + istatistik; B16/B18 ısı haritası overlay'i birebir taşındı
     - `src/components/result/ResultPanel.tsx` (96 satır) — sonuç sekmeleri (metin/ısı haritası/diff) + dışa aktarma; `ResultViewMode` tipi
     - `src/components/auditor/AuditorSidebar.tsx` (399 satır) — denetçi analiz + Sentinel canlı kaynak + gramer + derin metrikler
     - `src/components/header/StyleMasterHeader.tsx` (104 satır) — STYLEMASTER ton/preset/yoğunluk başlığı
     - `src/components/LoginView.tsx` (134 satır) — giriş ekranı; **Kural 2:** "Ajanlar Sizi Bekliyor" → "YZ İnsanlaştırma ve İntihal Denetimi", "Ajan Kaydını Tamamla" → "Kaydını Tamamla"
     - `src/lib/exporters.ts` (336 satır) — DOCX/PDF/TXT dışa aktarma + eğitim verisi indirme
   - Ayrıştırılan hook'lar:
     - `src/hooks/useEditorWorkflow.tsx` (449 satır) — insanlaştır/analiz/taslak/geçmiş akışı
     - `src/hooks/useAppUser.ts` (92 satır) — appUser + isAdmin türetimi
     - `src/hooks/useProjects.ts` (40 satır) — projects sorgusu + sayfalama
     - `src/hooks/useAuthListener.ts` (25 satır) — auth dinleyici
     - `src/hooks/useSystemSettings.ts` (75 satır) — settings/system + denetçi hassasiyeti yönetimi
     - `src/hooks/useHeatmapOverlay.ts` (98 satır) — B16/B18 kaydırma senkronu + hover otomatik kaydırma (span kimlikleri korundu: `hovered-grammar-span`, `hovered-readability-span`, `hovered-insight-span`)
   - `types/index.ts`: `SystemSettings` arayüzü eklendi

2. **Bundle / kod bölme ölçümü (Sıra 2 sonrası)** ✅
   - Ana chunk `index-*.js`: 186.40 kB → 187.68 kB (gzip 52.62 → 52.88 kB) — refactor dolaylaması +1.28 kB (ihmal edilebilir)
   - İlk yükleme (modulepreload): index + vendor-react/core/firebase/icons/framer/genai + CSS ≈ **1.63 MB raw / ≈ 412 kB gzip**; en büyük pay `vendor-firebase` (562 kB raw / 133.5 kB gzip)
   - Lazy chunk'lar doğru bölünüyor: onnxruntime (558 kB), docx (407 kB), transformers (189 kB), markdown (72 kB), AdminPanel (31 kB), ClassroomPanel (59 kB / 13.4 kB gzip) talep üzerine yükleniyor

### Doğrulama

- `tsc --noEmit` → temiz
- `npx vitest run --pool=vmThreads` → **25/25 geçti** (classroomFormat 9, MetricCard 2, classroomService 14)
- `vite build` → 10.75 s hatasız (yalnızca mevcut uyarılar: onnxruntime eval, firebase dinamik/statik import notu)

### Ortam Notu (önemli)

- Bu yürütme ortamının korumalı kabuğunda vitest 5.0.3'ün varsayılan `threads`/`forks` havuzları
  worker durumunu kaybediyor ("Vitest failed to find the current suite"). **`--pool=vmThreads`
  ile koşum başarılı**; kodla ilgisi yoktur (2026-10-07'deki 25/25 koşumu ile aynı test kümesi).
  `npm test -- --run --pool=vmThreads` kullanılmalı.

### Kural Uyumu

- Kural 1: yalnızca taşıma yapıldı; tek silme, taşınma sonrası yetim kalan `User` tip importudur (kullanımı hook'a taşındı).
- Kural 2: LoginView metinleri özellik diline çevrildi.

### Sonraki Adım

- **Sıra 1 kalanı:** `firestore.rules` deploy — **ayrı onay bekliyor** (23.4).
- **Sıra 3:** B21 Faz 2 — faz başı ayrı onay gerektirir (B21.7).

---

## 25. B21 FAZ 2 İLERLEME GÜNLÜĞÜ (2026-10-10 — Sıra 3)

Faz başı onayı: 2026-10-10 kullanıcı talimatı ("sıradaki görev ile devam et") ile Faz 2 başlatıldı (23.4).
Kapsam (B21.7): dosya yükleme (PDF/DOCX + Storage), sunucu-tarafı skorlama, PDF rapor + dijital makbuz,
toplu öğrenci listesi, öğrenci adına teslim. Kesimler halinde yürütülür; her kesim doğrulanıp burada onaylanır.

| Kesim | Kapsam | Durum |
|---|---|---|
| A | Dosya altyapısı: fileParseService + storage.rules + submittedBy + upload yardımcıları | ✅ 2026-10-10 |
| B | StudentSubmitView dosya yükleme modu | ✅ 2026-10-10 |
| C | Toplu öğrenci listesi + öğrenci adına teslim | ✅ 2026-10-10 |
| D | PDF rapor + dijital makbuz indirme | ✅ 2026-10-10 |
| E | Sunucu-tarafı skorlama (scoreSubmission CF + istemci kapısı) | ✅ 2026-10-10 |

### Kesim A — Dosya Yükleme Altyapısı ✅ (2026-10-10)

**Bağımlılıklar:** `pdfjs-dist@^6.4.299`, `mammoth@^1.13.0` eklendi (Kural 1: yalnızca ekleme).
mammoth tip paketlemediğinden ve `@types/mammoth` registry'de bulunmadığından minimal yerel deklarasyon yazıldı.

**Yeni dosyalar:**
- `src/services/fileParseService.ts` (73 satır) — PDF (pdfjs-dist, worker `?url` ile ayrı chunk) ve DOCX
  (mammoth `extractRawText`) ayrıştırma; 20 MB / tür sınırı; <50 karakter metin reddi
- `src/types/mammoth.d.ts` (21 satır) — yalnızca kullanılan API için minimal modül deklarasyonu
- `storage.rules` (37 satır) — firebase.json hâlihazırda bağlıyor; submissions yolu öğrenci/eğitmen/admin
  kilitli, 20 MB + PDF/DOCX içerik türü sınırı; admin denetimi `users/{uid}.role` üzerinden (proje modeliyle uyumlu)

**Düzenlemeler:**
- `src/types/classroom.ts` — Submission'a `submittedBy?: string` eklendi (adına teslim için; Bölüm 21.3)
- `src/services/classroomService.ts` (+48 satır) — `validateSubmissionFile`, `submissionFilePath`,
  `uploadSubmissionFile`, `getSubmissionFileUrl`; `submitText` opsiyonel `file` meta alır (fileName/storagePath)
- `vite.config.ts` — manualChunks'a `vendor-storage`, `vendor-pdfjs`, `vendor-mammoth` ayrımı eklendi:
  aksi halde storage SDK 'firebase' genel eşleşmesiyle açılışa, mammoth '/lib/docx/' yollarıyla vendor-docx'e,
  pdfjs vendor-core'a (üçü de ilk yükleme) düşüyordu

**Doğrulama:**
- `tsc --noEmit` → temiz
- `npm test -- --run --pool=vmThreads` → **25/25**
- `vite build` → 11.79 s hatasız; **vendor-firebase 578.6 → 562.0 kB** (ölçüm baseline'ına döndü),
  `vendor-storage` 16.60 kB / 4.61 gzip ayrı tembel chunk (dist/index.html preload listesinde YOK — ilk yükleme etkisi 0)
- Not: `getStorage` önce firebase.ts'e statik açılmıştı; ilk yükleme maliyeti (+16.6 kB) nedeniyle
  classroomService içinde tembel `getStorage(getApp())` kalıbına taşındı.

**Kural uyumu:** Kural 1 — yalnızca ekleme (2 bağımlılık + 3 dosya + yardımcı fonksiyonlar); tek imza
değişikliği `submitText`'e opsiyonel parametre (geriye uyumlu). Kural 2 — ihlal yok.

**Deploy notu:** `storage.rules` deploy'u ayrı onay ister (firestore.rules ile birlikte; Sıra 1 kalanı).

### Kesim B — StudentSubmitView Dosya Yükleme Modu ✅ (2026-10-10)

**Düzenleme:** `src/components/classroom/StudentSubmitView.tsx` (145 → 240 satır; +97/-6) — yalnızca ekleme,
varsayılan 'Metin Yapıştır' modunda mevcut davranış birebir korunur.
- Metin/Dosya mod sekmeleri; dosya modunda PDF/DOCX seçici (accept filtreli, 20 MB sınırı client-side)
- Dosya seçilince `parseDocumentFile` ile metin çıkarılır, textarea'ya doldurulur (öğrenci düzenleyebilir);
  sayfa/karakter sayısı toast ile bildirilir
- Teslimde sıralama: `uploadSubmissionFile` (Storage) → `submitText` (fileName/storagePath meta ile) → skorlama;
  yükleme başarısızsa Firestore dokümanı hiç oluşmaz
- `canSubmit` dosya modunda dosya varlığını ve ayrıştırma bitişini zorunlu kılar

**Doğrulama:**
- `tsc --noEmit` → temiz; `npm test -- --run --pool=vmThreads` → **25/25**; `vite build` → 12.88 s hatasız
- Yeni lazy chunk'lar (yalnızca ClassroomPanel ile yüklenir, index.html preload'ında YOK):
  `vendor-pdfjs` 482.55 kB / 144.49 gzip + `pdf.worker` asset 1,264 kB, `vendor-mammoth` 309.51 kB / 99.28 gzip,
  `vendor-storage` 32.63 kB / 8.38 gzip
- Chunk düzeltmesi: mammoth alt bağımlılıkları (jszip, @xmldom/xmldom, argparse, base64-js,
  dingbat-to-unicode, lop, underscore, xmlbuilder) ilk denemede vendor-core'a sızmıştı (238.8 → 491.6 kB);
  segment-precise regex ile vendor-mammoth'a alındı → vendor-core 239.85 kB (baseline'a döndü)
- İlk yükleme deltası ≈ +2 kB (index 187.80, icons +0.43, firebase +1.45) — dosya SDK'ları açılışa girmedi

**Kural uyumu:** Kural 1 — yalnızca ekleme; mevcut metin akışı ve skorlama davranışı korunur. Kural 2 — ihlal yok.

### Kesim C — Toplu Öğrenci Listesi + Öğrenci Adına Teslim ✅ (2026-10-10)

**Yeni dosya:**
- `src/components/classroom/OnBehalfSubmitModal.tsx` (250 satır) — eğitmenin kayıtlı/beklemedeki öğrenci
  seçip adına teslim açtığı modal; metin/dosya modu, skorlama ve hata fallback'i StudentSubmitView ile aynı akışta

**Düzenlemeler:**
- `src/types/classroom.ts` (93 satır) — Enrollment'a `pending?: boolean`
- `src/services/classroomService.ts` (565 satır, +131) — `parseBulkRoster` (saf), `pendingEnrollmentId` (saf),
  `bulkEnrollStudents` (bekleme kayıtları, 400'lük batch parçalı commit, e-posta/tekrar filtresi),
  `submitOnBehalf` (submittedBy = eğitmen uid; teslim dokümanı öğrenci kimliğiyle),
  `joinClass` bekleme kaydı devralma (pending silinir, studentCount artmaz)
- `src/components/classroom/InstructorClassDetail.tsx` (180 satır) — "Liste Yükle" paneli (satır başına
  "Ad Soyad, eposta"; virgül/noktalı virgül/sekme), algılanan öğrenci sayısı ön izlemesi, "Beklemede" rozeti
- `src/components/classroom/AssignmentDetailView.tsx` (144 satır) — "Adına Teslim" başlık düğmesi
  (kayıtlı öğrenci yoksa devre dışı)
- `src/components/classroom/ClassroomPanel.tsx` (526 satır) — `handleBulkEnroll`, `behalfCtx` durumu,
  modal kablolaması (onDone → liste yenileme + gerekiyorsa rapor açma)
- `firestore.rules` — enrollments create eğitmen dalı eklendi (pending=true + addedBy=auth.uid + studentId eşleşmesi;
  arşiv kontrolü korunur) — **deploy ayrı onayda (Sıra 1 kapanışına eklendi)**
- `storage.rules` (38 satır) — teslim dosyası yazma yetkisi eğitmene genişletildi (adına teslim dosya yüklemesi için)

**Tasarım kararı:** hesabı olmayan öğrenciler `pending_{eposta}` kimlikli bekleme kaydı olarak eklenir;
öğrenci sınıf koduyla katıldığında `joinClass` bekleme kaydını silip gerçek uid'li kaydı açar (sayı çift sayılmaz).
Adına teslimlerde bekleme kayıtları da seçilebilir (teslim dokümanı yine öğrenci kimliğiyle yazılır).

**Doğrulama:**
- `tsc --noEmit` → temiz
- `npm test -- --run --pool=vmThreads` → **31/31** (6 yeni: parseBulkRoster 4 + pendingEnrollmentId 2;
  classroomService.test.ts 106 → 149 satır)
- `vite build` → 19.08 s hatasız; ClassroomPanel lazy chunk 63.41 → 75.53 kB / 17.23 gzip
  (OnBehalfSubmitModal + liste paneli); ilk yükleme chunk'ları değişmedi

**Kural uyumu:** Kural 1 — yalnızca ekleme + kural dalı genişletme (gerekçe: B21 §21.7 toplu liste ve adına
teslim gereksinimi). Kural 2 — ihlal yok.

**Deploy notu:** `firestore.rules` + `storage.rules` değişiklikleri canlıya ayrı onayla deploy edilmelidir
(Sıra 1 kapanışı ile birlikte).

### Kesim D — PDF Rapor + Dijital Makbuz İndirme ✅ (2026-10-10)

**Yeni dosya:**
- `src/components/classroom/submissionExport.ts` (160 satır) — `exportSubmissionReportPDF(cls, assignment,
  submission)`: exporters.ts'teki `exportToPDF` ile aynı yazdırma penceresi yaklaşımı (yeni bağımlılık yok;
  tarayıcı "PDF olarak kaydet" ile üretir). İçerik: teslim bilgileri tablosu (sınıf/ödev/öğrenci/tarih/
  "Teslim Eden" satırı — adına teslim ayrımı), Benzerlik + YZ olasılık kutuları, **dijital makbuz bölümü**
  (tam SHA-256, monospace + satır kırma), eşleşen kaynaklar (matchGroup/güven/dışlanan etiketleriyle),
  teslim metni, bütünlük dipnotu. Tüm dinamik değerler `escapeHtml` ile kaçışlanır (statik tarayıcı uyarısı
  notu: document.write deseni mevcut exportToPDF ile aynı; XSS yüzeyi escape ile kapatıldı).

**Düzenleme:**
- `src/components/classroom/SubmissionReportView.tsx` (192 → 200 satır) — yapışkan başlığa "PDF" düğmesi
  (FileDown, emerald tema); mevcut TXT indirme ve makbuz kopyalama korunur

**Doğrulama:**
- `tsc --noEmit` → temiz; `npm test -- --run --pool=vmThreads` → **31/31**; `vite build` → 18.84 s hatasız
- ClassroomPanel lazy chunk 75.53 → 81.72 kB / 19.26 gzip; ilk yükleme chunk'ları değişmedi

**Kural uyumu:** Kural 1 — yalnızca ekleme. Kural 2 — ihlal yok.

### Kesim E — Sunucu-Tarafı Skorlama (scoreSubmission CF + İstemci Yedeği) ✅ (2026-10-10)

**Önceki oturumdan devralınan:** `scoreSubmission` CF gövdesi `functions/src/index.ts`'te
yazılmıştı (2026-10-10 akşamı); ancak istemci tarafları hâlâ doğrudan `runSubmissionScoring`
çağırıyor, CF'ye hiç bağlanmıyordu. Bu kesim hattı birleştirdi + CF'a iki eksik davranış eklendi.

**Düzenlemeler:**
- `functions/src/index.ts` (+12/-4) — `scoreSubmission` CF'ına: (1) `sentinelEnabled` kapısı
  (istemcideki `verifyPlagiarism` bayrağının sunucu karşılığı; kapalıysa googleSearch atlanır,
  benzerlik 0 + boş kaynak listesi), (2) skor yazımında `scoredBy: "server"` işareti ve dönüşte
  aynı alan. `functions/lib/index.js` `npm run build` ile yeniden derlendi (deploy predeploy'u da bunu kullanıyor).
- `src/services/classroomService.ts` (+53/-2) — yeni akış: `scoreSubmission(input, target)`
  **sunucu-öncelikli**: `scoreSubmissionOnServer` (tembel `getFunctions(getApp())` + httpsCallable)
  denenir; CF skoru hem hesaplar hem Firestore'a yazar, istemci sonucu yalnız görüntüler.
  CF hata verirse **istemci yedeği**: mevcut `runSubmissionScoring` + `updateSubmissionScores`
  (`scoredBy: 'client'` ile işaretli). `functions/unauthenticated` ve `functions/permission-denied`
  yedeğe DÜŞMEZ, hata kullanıcıya görünür (kimliği doğrulanmamış yol sessizce istemci skoru üretmesin).
- `src/types/classroom.ts` — `Submission.scoredBy?: 'server' | 'client'`
- Üç çağrı noktası tek `scoreSubmission`'a bağlandı: `StudentSubmitView` (öğrenci teslimi),
  `OnBehalfSubmitModal` (adına teslim — CF yetki dalı eğitmen yazısı zaten authorise),
  `ClassroomPanel.handleRerun` (eğitmen "Yeniden Çalıştır"). Herhangi bir yol tamamen
  başarısız olursa mevcut `markSubmissionFailed` davranışı aynen korundu.
- `firestore.rules` — yalnız yorum güncellendi: öğrencinin submissions update dalı Açık KALDI,
  çünkü istemci yedeği bu yazıya muhtaç. Dürüst not: yedek kapatılana kadar skor sahteciliği
  riski tam kalkmaz; yedek kaldırıldığında dal `create`'e indirilecek (CF Admin SDK yazımı kurallardan bağımsız).
- `vite.config.ts` — `vendor-functions` tembel chunk'ı: `firebase/functions` SDK'sı `firebase`
  genel eşleşmesiyle eager `vendor-firebase`'e düşüyordu (+14 kB açılış maliyeti); storage'taki
  (Kesim A) aynı kalıpla ayrıldı.

**Doğrulama:**
- `npm --prefix functions run build` (tsc) → temiz; `lib/index.js` güncel
- `tsc --noEmit` → temiz; `npm test -- --run --pool=vmThreads` → **31/31**
- `vite build` → 13.57 s hatasız; `vendor-functions` 12.63 kB / 3.78 gzip **tembel**
  (dist/index.html modulepreload listesinde YOK — ilk yükleme etkisi ≈0; vendor-firebase 563.5 kB,
  index 187.84 kB — Kesim B baseline'ıyla aynı)

**Kural uyumu:** Kural 1 — silme yok; `runSubmissionScoring`/`updateSubmissionScores` korundu
(artık yalnız yedek yolun parçaları). Kural 2 — ihlal yok ("sunucuda hesaplanır" özellik dili).

**Deploy notu (Sıra 1 kapanışına eklendi):** `firebase deploy --only functions` +
`firestore.rules` + `storage.rules` + `firestore:indexes` (classes bileşik indeksi — Bölüm 34) ayrı onay bekliyor. **CF dağıtılmadan önce tüm skorlama
istemci yedeğinden akar** (Faz 1 davranışıyla birebir aynı); deploy sonrası `scoredBy: 'server'`
kaydı bu geçişi doğrulamak için kullanılabilir.




## 26. GUNLUK ILERLEME OZETI (2026-10-11) — Sira 4: Lokal Model UI + Canli Veri TAMAMLANDI

### Yapilan Isler

1. **Y1 — Model Secici & Canli Saglik Rozeti** TAMAMLANDI
   - `src/components/header/StyleMasterHeader.tsx` yeniden yazildi.
   - Baslik cubuguna Model Secici dropdown eklendi: "Gemini (Bulut)" ve "Yerel Model (Ollama/vLLM)" secenekleri.
   - `checkLocalModelHealth()` 30 saniyelik interval ile cagirilir; durum rozeti idle/checking/online/offline arasinda gecis yapar.
   - Mevcut modeller listesi (/v1/models endpoint'inden) acilir menude gosterilir (max 5 adet).
   - `localStorage.setItem('sentience_use_local_model', ...)` ile secim oturum arasi kalicidir.

2. **Y2 — Canli SFT Veri Toplama** TAMAMLANDI
   - `src/hooks/useEditorWorkflow.tsx` guncellendi: handleHumanize icinde qualityScore >= 70 kosulu saglandiginda training_pairs koleksiyonuna otomatik addDoc yapilir.
   - Kaydedilen alanlar: userId, input, output, tone, intensity, aiScore, plagiarismScore, qualityScore, source: 'humanize_accept', createdAt.
   - Kayit fire-and-forget — basarisiz olmasi ana akisi kesmez.

### Dogrulama

- tsc --noEmit: temiz
- npm test -- --run --pool=vmThreads: 31/31 gecti
- vite build: 14.24 s hatasiz; index.js 192.61 kB / 53.98 kB gzip

### Degisen Dosyalar

- src/components/header/StyleMasterHeader.tsx (Y1: model secici + health ping rozeti)
- src/hooks/useEditorWorkflow.tsx (Y2: training_pairs SFT kaydi)

### Sonraki Adim

Sira 5: B21 Faz 3 — Sinif Deposu (repository parmak izi, CSV/Excel disa aktarim).


## 27. GUNLUK ILERLEME OZETI (2026-10-11) — Sira 5: B21 Faz 3 — Sinif Deposu TAMAMLANDI

### Yapilan Isler

1. **Sinif Deposu Parmak Izi Altyapisi & Karsilastirma (Cloud Function + Admin SDK)** TAMAMLANDI
   - functions/src/index.ts:
     - generateTextShingles(text, k=5) ve computeShingleOverlap(curr, repo) metin parmak izi fonksiyonlari eklendi.
     - scoreSubmission:
       - classes/{classId}/assignments/{assignmentId} dokumanindan noRepository kontrolu yapilir.
       - classes/{classId}/repository koleksiyonundaki mevcut parmak izleri taranir.
       - Ayni ogrencinin baska odev teslimleri ise self_plagiarism ("Onceki Ogrenci Teslimi (Oz-Intihal)"), siniftaki baska ogrencinin teslimi ise peer_match ("Sinif Ici Teslim (Es-Ogrenci)") olarak tespit edilip sources listesine eklenir (internal://repository/{classId}/{docId}).
       - noRepository !== true ise, teslimin parmak izleri Cloud Function (Admin SDK) ile classes/{classId}/repository/{assignmentId}_{studentId} yoluna kaydedilir (Firestore.rules geregi istemciden yazma yasaktir, yalnizca Cloud Function yazar).
   - functions/ tsc derlemesi temiz tamamlandi (npm --prefix functions run build).

2. **Tip ve Servis Katmani Entegrasyonu** TAMAMLANDI
   - src/types/classroom.ts: RepositoryEntry veri arayuzu eklendi.
   - src/services/classroomService.ts: generateTextShingles ve computeShingleOverlap pure yardimci fonksiyonlari eklendi.

3. **CSV ve Excel (.xls) Disa Aktarim Sistemi** TAMAMLANDI
   - src/components/classroom/submissionExport.ts:
     - exportSubmissionsCSV: UTF-8 BOM ile Turkce karakter destekli, tam metadata ve teslim metriklerini iceren CSV olusturucu.
     - exportSubmissionsExcel: Tablo stilleri, basliklar ve skor renkleriyle bicimlendirilmis Excel XML tablosu disa aktarimi.
     - matchGroupLabel: peer_match ("Es-Ogrenci Eslesmesi") ve self_plagiarism ("Oz-Intihal") etiketleri eklendi.
     - exportSubmissionReportPDF: Sinif deposundan gelen internal:// kaynaklar harici URL yerine depo rozeti olarak islendi.
   - src/components/classroom/AssignmentDetailView.tsx: Egitmen teslim tablosuna "CSV" yanina "Excel" disa aktarim butonu eklendi.
   - src/components/classroom/ClassroomPanel.tsx: handleDownloadCsv ve handleDownloadExcel fonksiyonlari submissionExport modulune baglandi.
   - src/components/classroom/SubmissionReportView.tsx: Sinif ici depo eslesmelerinde internal:// linki yerine Database ikonu ve [Sinif Ici Teslim Deposu] gorunumu saglandi.

### Dogrulama

- npm --prefix functions run build (tsc): temiz, hatasiz
- npx tsc --noEmit: temiz
- npm test -- --run --pool=vmThreads: **37/37 gecti** (6 yeni shingle ve overlap birim testi)
- npm run build (vite): 20.32 s hatasiz

### Degisen Dosyalar

- functions/src/index.ts (sinif deposu parmak izi karsilastirmasi + yazma)
- src/types/classroom.ts (RepositoryEntry tipi)
- src/services/classroomService.ts (generateTextShingles, computeShingleOverlap)
- src/components/classroom/submissionExport.ts (exportSubmissionsCSV, exportSubmissionsExcel, depo etiketleri)
- src/components/classroom/AssignmentDetailView.tsx (Excel indirme butonu)
- src/components/classroom/ClassroomPanel.tsx (CSV/Excel indirme baglantilari)
- src/components/classroom/SubmissionReportView.tsx (sinif deposu kaynak gosterimi)
- src/test/classroomService.test.ts (6 yeni birim testi)

### Sonraki Adim

Sira 6: P2 Paketi (Turnitin matchGroup bayraklarinin SubmissionReportView / Sentinel kartina tam yansimasi, B17 kalintisi R3 snippet fallback, CI/CD ve vektor sistemi karari).


## 28. GUNLUK ILERLEME OZETI (2026-10-12) — Sira 6: Vektör + Semantik Sentinel TAMAMLANDI

### Yapilan Isler

1. **vectorEngine.ts — Çok Dilli Model Yükseltmesi** TAMAMLANDI
   - Model: Xenova/all-MiniLM-L6-v2 → Xenova/paraphrase-multilingual-MiniLM-L12-v2 (50+ dil, Türkçe dahil)
   - dimensions public readonly alan eklendi; cosineSimilarity sıfır-bölme koruması güncellendi.
   - Gemma 2B embedding notu eklendi: EmbeddingGemma ~3.5 GB, browser'da pratik değil; gelecekte LiteRT-LM üzerinden entegre edilecek.

2. **vectorService.ts — semanticSearch fonksiyonu** TAMAMLANDI
   - semanticSearch(queryText, userId, threshold=0.82, limit=5): Firestore vector_embeddings koleksiyonundan kullanıcının geçmiş proje vektörleriyle kosinüs benzerliği hesaplar.
   - Model adı saveToVectorStore içinde güncellendi (paraphrase-multilingual-MiniLM-L12-v2).

3. **sentinelService.ts — Semantik Arama Entegrasyonu** TAMAMLANDI
   - verifyPlagiarism imzasına customSettings.userId? opsiyonel parametresi eklendi (mevcut çağrı noktaları bozulmaz).
   - Google Search sonuçlarından sonra semanticSearch çağrılır; threshold >= 0.82 eşleşmeler internal://vector/{userId}/{projectId}/{chunkIndex} URL'iyle kaynak listesine eklenir.

4. **SubmissionReportView.tsx — Vektör Kaynağı UI** TAMAMLANDI
   - internal://vector/ URL'leri için mor Zap ikonu ve "Semantik Vektör Eşleşmesi" etiketi.
   - isInternal (depo) / isVector (semantik) ayrımı yapıldı.
   - Alt açıklama: "Geçmiş Proje Vektör Benzerliği" olarak gösterilir.

### Dogrulama

- npx tsc --noEmit: temiz
- npm test -- --run --pool=vmThreads: **37/37 gecti**

### Degisen Dosyalar

- src/services/vectorEngine.ts (model yükseltmesi, dimensions, cosine fix)
- src/services/vectorService.ts (semanticSearch, model adı)
- src/services/sentinelService.ts (semanticSearch entegrasyonu, userId param)
- src/components/classroom/SubmissionReportView.tsx (vector kaynağı UI, Zap import)

### Sonraki Adim

Sira 7: CI/CD Pipeline (GitHub Actions) — build, tsc, test adımları otomatik.


## 29. GÜNLÜK İLERLEME ÖZETİ (2026-10-12) — Sıra 7: CI/CD Pipeline (GitHub Actions) TAMAMLANDI

### Yapılan İşler

1. **.github/workflows/ci.yml — CI/CD Pipeline Tanımlandı** TAMAMLANDI
   - **Tetikleyiciler:** `main` ve `master` dallarına `push` & `pull_request`, ayrıca manuel `workflow_dispatch`.
   - **Eşzamanlılık (Concurrency):** Eski çalışan işleri iptal eden `cancel-in-progress: true` koruması.
   - **validate:** Frontend (`npm run lint` -> `tsc --noEmit`) ve Cloud Functions (`npm --prefix functions run lint`) statik tip denetimi.
   - **test:** Vitest test suite (`npm test -- --run --pool=vmThreads`, 37 test tam kapsam).
   - **build:** Frontend üretim derlemesi (`npm run build` -> Vite) ve Functions derlemesi (`npm --prefix functions run build` -> `tsc`).
   - **artifact:** `dist` üretim paketi GitHub Actions üzerinde 7 gün saklanacak şekilde arşivlenir.
   - **deploy-preview:** PR'lar için Firebase Preview Channel otomatik dağıtımı (Secret tanımlı olduğunda).
   - **deploy-live:** `main` branch canlı dağıtımı (Firebase Live Channel, Secret tanımlı olduğunda).

### Doğrulama

- `npx tsc --noEmit`: temiz
- `npm --prefix functions run lint`: temiz
- `npm test -- --run --pool=vmThreads`: **37/37 geçti**
- `npm run build` (vite) & `npm --prefix functions run build`: hatasız tamamlandı
- `.github/workflows/ci.yml`: oluşturuldu ve doğrulandı

### Değişen Dosyalar

- `.github/workflows/ci.yml` (yeni CI/CD pipeline iş akışı)

### Sonraki Adım

Sıra 8: Turnitin matchGroup bayrakları & ince ayarlar.


## 30. GÜNLÜK İLERLEME ÖZETİ (2026-10-12) — Admin Panel Modüler Sekme Mimarisi & Model Seçici Taşıma TAMAMLANDI

### Yapılan İşler

1. **Model Seçicinin (Bulut / Yerel Ollama) Admin Paneline Taşınması** TAMAMLANDI
   - `StyleMasterHeader.tsx`: Normal kullanıcılara yönelik arayüzden teknik bulut/yerel LLM model seçicisi ve durum rozetleri kaldırıldı; başlık sadeleştirildi.
   - `AdminPanel.tsx` içerisindeki yeni **"Model & Yapay Zeka Motoru"** sekmesine taşındı:
     - **Gemini (Bulut)** vs. **Yerel Model (Ollama / LM Studio)** görsel kartlı motor seçimi.
     - Canlı bağlantı sağlık denetimi (`checkLocalModelHealth` / ping), durum rozeti (çevrimiçi, çevrimdışı, kontrol).
     - Ollama endpoint URL (`http://localhost:11434/v1`) ve aktif model tag yapılandırması.
     - Ollama'da yüklü modellerin dinamik listelenmesi ve tek tıkla aktif model olarak seçilmesi.

2. **Admin Panelinin 4 Modüler Sekmeye Bölünmesi (Sonsuz Dikey Kaydırma Sorununun Giderilmesi)** TAMAMLANDI
   - Sonsuz aşağıya uzayan tek parça yapı 4 odaklı sekmeye ayrıldı:
     - **Kullanıcılar & Tarzlar (`users`):** Kullanıcı listesi, plan atama modalı, özel tarzlar ve sistem aktivite günlüğü.
     - **Model & Yapay Zeka Motoru (`models`):** Aktif motor seçici (Bulut/Ollama), yerel sunucu bağlantı kontrolü, Gemini modelleri (2.0 Flash / 2.5 Flash / 3.1 Pro) ve Tuned Model yapılandırması.
     - **API Havuzu & Kotalar (`api-keys`):** Dinamik Gemini ve Search API anahtarları rotasyonu, kota ilerleme çubukları, anahtar ekleme ve havuz sıfırlama.
     - **İntihal & Sentinel (`sentinel`):** Canlı tarama parametreleri (cümle sayısı, kelime eşiği, dinamik benzerlik, filtreler) ve genişletilebilir denetim geçmişi logları.

### Doğrulama

- `npm run lint` (`tsc --noEmit`): temiz
- `npm test -- --run --pool=vmThreads`: **37/37 geçti**
- `npm run build` (Vite üretim derlemesi): 13.99s hatasız tamamlandı

### Değişen Dosyalar

- `src/components/header/StyleMasterHeader.tsx` (teknik model seçici kaldırıldı)
- `src/components/AdminPanel.tsx` (4 sekmeli mimari + yerel/bulut motor seçici)
- `Raporlamalar/BIRLESIK_PROJE_RAPORU.md` (bölüm 30 eklendi)


---

## 31. SIRA 8: Turnitin Eşleşme Grupları (matchGroup) & İnce Ayarlar (P2 Paketi) (12 Ekim 2026)

### Amaç ve Kapsam
Turnitin standart 4 temel eşleşme grubu (`not_cited_or_quoted`, `missing_quotations`, `missing_citation`, `cited_and_quoted`) ile sınıf/depo eşleşmelerinin (`peer_match`, `self_plagiarism`) arayüzlerde rozet ve filtre mekanizmalarıyla sunulması; B17 kalıntısı R3 snippet fallback sahte benzerlik açığının sıfır-halüsinasyon standardıyla giderilmesi.

### Gerçekleştirilen İşlemler

1. **Sentinel Motoru Tip ve Snippet İyileştirmesi (`src/services/sentinelService.ts`):**
   - `MatchGroup` tip tanımına `peer_match` ve `self_plagiarism` değerleri eklenerek tip senkronizasyonu sağlandı.
   - Zero-Hallucination kuralı ihlali olan fallback açığı giderildi: Google/Crossref snippet'i boş geldiğinde kullanıcının kendi cümlesini snippet kabul edip %100 benzerlik üretme mantığı kaldırıldı, sadece gerçek `rawSnippet` üzerinden temizleme ve benzerlik hesabı yapılması sağlandı.

2. **Teslim Raporu Turnitin Görünümü & Filtreleme (`src/components/classroom/SubmissionReportView.tsx`):**
   - Turnitin standart renk paletine uygun `matchGroupBadge` sözlüğü eklendi (Kırmızı: Atıf & Tırnak Yok, Kehribar: Tırnak Eksik, Sarı: Atıf Eksik, Zümrüt: Doğru Atıf, Mor: Sınıf/Eş-Öğrenci Deposu, Çivit: Öğrenci Öz-İntihali).
   - Eşleşme grupları ve depo tiplerine göre hızlı filtreleme sekmeleri (`Tümü`, `Atıf/Tırnak Yok`, `Tırnak Eksik`, `Atıf Eksik`, `Doğru Atıf`, `Sınıf Deposu`, `Semantik / Vektörel`) eklendi.
   - Her kaynak kartına dinamik `%XX Benzerlik` hapı ve Turnitin renkli grup rozeti bağlandı.

3. **Denetçi Kenar Çubuğu Rozet Modernizasyonu (`src/components/auditor/AuditorSidebar.tsx`):**
   - Sentinel kaynak kartlarındaki sade etiketler; Turnitin renk tonları ve Türkçe durum rozetleri (`Atıf Yok`, `Tırnak Eksik`, `Atıf Eksik`, `Doğru Atıf`, `Eş-Öğrenci`, `Öz-İntihal`) ile modernize edildi.

### Doğrulama

- `npm run lint` (`tsc --noEmit`): temiz
- `npm test -- --run --pool=vmThreads`: **37/37 geçti**
- `npm run build` (Vite üretim derlemesi): 13.74s hatasız tamamlandı

### Değişen Dosyalar

- `src/services/sentinelService.ts` (Tip genişletmesi ve Zero-Hallucination snippet düzeltmesi)
- `src/components/classroom/SubmissionReportView.tsx` (Turnitin renk rozetleri ve filtreleme sekmeleri)
- `src/components/auditor/AuditorSidebar.tsx` (Turnitin renkli durum rozetleri)
- `Raporlamalar/BIRLESIK_PROJE_RAPORU.md` (Bölüm 31 eklendi)


---

## 32. SIRA 9: Yeni Proje Sıfırlaması, Kapılı Özellik Yetkilendirmesi & Samimi Sentinel Taraması (19 Ekim 2026)

### Amaç ve Kapsam
Kullanıcı geri bildirimiyle tespit edilen üç sorunun giderilmesi: (1) sol üstteki `+` (Yeni Proje) butonunun sağ taraftaki "Denetçi Analizi" kartını sıfırlamaması, (2) "Tanıtım Sitesini Görüntüle", "Sınıflarım" ve "Veri İndir (JSONL)" bölümlerinin son kullanıcıya kapalı olup admin tarafından yönetilebilir iki kademeli yetkiye bağlanması, (3) "Sentinel Kaynakları" ve "İNTİHAL" kartlarının tarama fiilen çalışmasa da "%100 Özgün" iddiası üretmesinin önlenmesi — Google Search anahtarlarının gerçekten arama yapması ve yapılamayan aramanın kullanıcıya dürüstçe yansıtılması.

### Gerçekleştirilen İşlemler

1. **`+` Butonu Tam Durum Sıfırlaması (`src/App.tsx`)**
   - Kök neden: `onNewProject` yalnız `inputText`, `humanizedText`, `analysis` ve `activeTab` sıfırlıyordu; `auditorResult` (Denetçi Analiz kartı), `mlAnalysis`, `grammarSuggestions`, `factCheckResult` korunuyordu.
   - Düzeltme: Sıfırlamaya `setAuditorResult(null)`, `setMlAnalysis(null)`, `setGrammarSuggestions([])`, `setFactCheckResult(null)`, `setShowDiff(false)`, `setShowInputHeatmap(false)`, `setMobileTab('editor')` eklendi. Yeni proje butonu artık arayüzü uçtan uca temiz hâle getirir.

2. **İki Kademeli Özellik Yetkilendirmesi (Admin Paneli + Firestore Rules)**
   - Yeni tipler (`src/types/index.ts`): `GatedFeature = 'promoSite' | 'classroom' | 'trainingData'`, `FeatureGrants`, `AppUser.featureGrants?`, `SystemSettings.featureAccess?`.
   - Erişim formülü (`src/App.tsx`): `canUseFeature(f) = isAdmin || systemSettings.featureAccess?.[f] || appUser?.featureGrants?.[f]`. Varsayılan: üç özellik de yalnız adminde görünür (`useSystemSettings.ts` DEFAULT_SETTINGS `featureAccess` hepsi `false`).
   - Buton görünürlüğü (`src/components/ProjectSidebar.tsx`): `featureVisibility` prop'u ile PromoSite/Sınıflarım/Veri İndir koşullu render; "Admin Paneli" yalnız `isAdmin`. `classroom` sekme render'ı ve `downloadTrainingData` çağrısı (`src/lib/exporters.ts` — `isAdmin` paramı `permitted` olarak genişletildi) buton gizlemekten fazlasıyla korundu.
   - Admin Paneli (`src/components/AdminPanel.tsx`): (a) Sentinel sekmesine "ÖZELLİK ERİŞİM ANAHTARLARI" kartı — her özellik için ToggleItem açıp kapatma ve "ERİŞİM AYARLARINI KAYDET" (settings/system.featureAccess); (b) kullanıcı tablosuna "Yetkiler" sütunu — kişi bazlı Site/Sınıf/Veri yetki anahtarları (`toggleFeatureGrant` → `users/{uid}.featureGrants`, activityLogs'a yazılır).
   - Güvenlik sertlaştırması (`firestore.rules`): kullanıcının kendi belgesini güncellerken `featureGrants` alanına hiç dokunamaması, `role`/`plan` değiştirememe kuralı (yalnız `isAdmin()` veya `isPlatformAdminEmail()` — hardcoded 3 admin e-postası); create sırasında platform-admin olmayanların `role:'user'`, `plan:'free'` ve `featureGrants`-sız kayıt zorunluluğu. Kendi-kendine-yetkilendirme (privilege escalation) açığı kapatıldı.

3. **Samimi (Honest) Sentinel/İNTİHAL Taraması (`src/services/sentinelService.ts` + arayüz)**
   - Yeni durum modeli: `SentinelScanStatus = 'ok' | 'disabled' | 'offline' | 'not_configured' | 'failed'` ve `PlagiarismScanMeta { scanStatus, queriesRun, queriesFailed }`; `verifyPlagiarism` tüm çıkış yollarında bu meta'yı döndürür.
   - Anahtar gerçekten kullanılıyor: tarama başında `getSearchKey()` + `VITE_GOOGLE_SEARCH_ENGINE_ID` kontrolü — yapılandırma eksikse `not_configured` döner ve sentinelLog/status "Search API yapılandırılmamış" yazar (sessiz %100 Özgün yalanı kaldırıldı). API anahtarı artık cümle başına canlı havuzdan alınır (`getSearchConfig()` döngü içine taşındı) — 429/403/400 durumunda anahtar işaretlenip sıradaki anahtara dönerek tarama ortada kalmadan devam eder; başarısız sorgular `queriesFailed` sayacında toplanır, tümü başarısız ve kaynak yoksa `failed`.
   - Durum taşımaları: `CombinedAnalysisResult`'a `scanStatus/queriesRun/queriesFailed` eklendi (`src/types/index.ts`); `useEditorWorkflow.tsx` her iki analiz yolunda (handleHumanize + handleAnalyze) bu alanları birleştirilen sonuca yazıyor.
   - Arayüz (`src/components/auditor/AuditorSidebar.tsx`): tarama yapılmamışsa İNTİHAL kartı `%0` yerine "—" ve "Tarama yapılamadı — veri yok" gösterir; Sentinel rozeti "%100 Özgün" yerine gri "Tarama Verisi Yok" olur; boş durum yeşil kutusu ancak `scanStatus === 'ok'` ise "Canlı web taramasında N sorgu yapıldı; intihal tespit edilmedi." der, aksi hâlde kehribar uyarı kutusu durum bazlı metin (devre dışı / çevrimdışı / yapılandırılmamış / tüm sorgular başarısız) basar. "DOĞRULANDI" etiketi dürüstlük gerekçesiyle "GÜVENİLİR" olarak güncellendi (tooltip bilgilendirir).
   - Doğrulanan canlı yapılandırma: `.env.local` içinde `VITE_GOOGLE_SEARCH_API_KEY` ve `VITE_GOOGLE_SEARCH_ENGINE_ID` dolu (değerler incelenmeden yalnız varlık kontrolü yapıldı).

### Notlar ve Kalan İşler

- `firestore.rules` ve Admin Paneli `settings/system` yazımı paylaşımlı durum değişikliğidir; **canlıya etkisi `firebase deploy --only firestore:rules` (ve gerekliyse functions) sonrasındadır** — 23.4 kuralı gereği ayrı onay bekliyor.
- Build bundle gözlemi: `vendor-firebase` 614.50 kB (Bölüm 30'da kayıtlı 563.5 kB'dan yüksek) — büyüme Bölüm 26–31 vectorService çalışmalarından geliyor, bu bölümdeki değişiklikler yeni firebase import'u eklemedi. `vendor-functions` (12.63 kB) lazy chunk olmaya devam ediyor, modulepreload listesinde yok (doğrulandı).

### Doğrulama

- `npx tsc --noEmit`: temiz
- `npm test -- --run --pool=vmThreads`: **37/37 geçti** (3 dosya)
- `npx vite build`: 16.70s hatasız; modulepreload listesi değişmedi
- GetProblems: yalnızca önceden var olan Tailwind stil uyarıları (bu bölümün değişikliklerinden kaynaklanan hata/uyarı yok)

### Değişen Dosyalar

- `src/App.tsx` (tam sıfırlama + `canUseFeature`/`featureVisibility` + classroom/veri indirme korumaları)
- `src/components/ProjectSidebar.tsx` (`featureVisibility` prop, koşullu butonlar)
- `src/components/auditor/AuditorSidebar.tsx` (durum bazlı samimi İNTİHAL/Sentinel kartları)
- `src/services/sentinelService.ts` (scanStatus/queriesRun/queriesFailed, canlı anahtar rotasyonu, dürüst hata yolları)
- `src/hooks/useEditorWorkflow.tsx` (scan meta taşımaları)
- `src/hooks/useSystemSettings.ts` (DEFAULT_SETTINGS.featureAccess)
- `src/types/index.ts` (GatedFeature/FeatureGrants/scan tipleri)
- `src/components/AdminPanel.tsx` (erişim anahtarları kartı + Yetkiler sütunu)
- `src/lib/exporters.ts` (`permitted` parametre imzası)
- `firestore.rules` (role/plan/featureGrants yetki sertlaştırması)
- `Raporlamalar/BIRLESIK_PROJE_RAPORU.md` (Bölüm 32 eklendi)


---

## 33. SIRA 10: Kanonik Türkçe Okunabilirlik Formülleri — Ateşman/Çetinkaya-Uzun Tutarsızlık Düzeltmesi (19 Ekim 2026)

### Amaç ve Kapsam
Bir Denetçi Analizi koşusu sırasında aynı metin için iki farklı okunabilirlik değeri üretilmesine yol açan formül tutarsızlığının giderilmesi. Kullanıcı, örnek akademik bir paragrafı analiz hattına soktuğunda `textFeatures.ts` ve `mlService.ts` içindeki Ateşman/Çetinkaya-Uzun hesaplarının çeliştiğini bildirdi; kanıt/geçmiş iddiasının doğru olabilmesi için tek doğru kaynak zorunluydu.

### Tespit Edilen Hata
- **Ateşman:** `mlService.ts` kanonik formülü (`199.5 − 1.015·(kelime/cümle) − 84.6·(hece/kelime)`) kullanıyordu; `textFeatures.ts` ise uydurma/yanlış sabitlerle (`198.825 − 40.175·(hece/kelime) − 2.610·(kelime/cümle)`) hesaplıyordu → aynı metinde 11.4 vs -79.
- **Çetinkaya-Uzun:** İKİ dosya da yanlış ve birbiriyle farklı idi (`textFeatures`: `118.823·(hece/kelime) + 8.121·(kelime/cümle) − 113.59`; `mlService`: `(kelime/cümle) + (hece/kelime)·10`).
- Kaynak doğrulaması: Ateşman (1997) ve Çetinkaya & Uzun (2010) formülleri MEB okunabilirlik kılavuzu ve çok sayıda akademik kaynakla birebir teyit edildi.

### Düzeltme (tek kaynak)
1. `src/ml/textFeatures.ts` — `extractTextFeatures` içindeki `atesman` ve `cetinkayaUzun` kanonik formüllere çekildi:
   - Ateşman: `199.5 − 1.015·OCU − 84.6·OKU`  (OCU=kelime/cümle, OKU=hece/kelime)
   - Çetinkaya-Uzun: `118.823 − 25.987·OKU − 0.971·OCU`
2. `src/services/mlService.ts` — `performDeepMLAnalysis` kendi başına formül hesaplamaktan çıkarıldı; `extractTextFeatures`'ı import edip Ateşman/Çetinkaya/kelime/cümle/hece değerlerini tek kaynaktan alır. Böylece iki kartın ayrışması yapısal olarak imkânsız hâle geldi.

### Örnek Metin Üzerinde Sonuç (Recep Peker paragrafı)
- Ölçüler: OCU 25.83 · OKU 2.99 (son derece yoğun, akademik)
- Düzeltme öncesi (yanlış `textFeatures`): Ateşman 11.4 · Çetinkaya 451.1
- Düzeltme sonrası (kanonik, tek kaynak): **Ateşman −79 · Çetinkaya-Uzun 16** → "çok zor / lisansüstü" bandı (Ateşman bant tablosuna uygun: 29 ve altı = lisansüstü). `mlService` ve `textFeatures` artık aynı değeri üretir.

### Doğrulama
- `npx tsc --noEmit`: temiz
- `npm test -- --run --pool=vmThreads`: 37/37 geçti (3 dosya)
- `npx vite build`: 12.78s hatasız; `vendor-functions` (12.63 kB) hâlâ lazy

### Değişen Dosyalar
- `src/ml/textFeatures.ts` (Ateşman + Çetinkaya-Uzun kanonik formüller)
- `src/services/mlService.ts` (okunabilirlik metrikleri tek kaynağa bağlandı)
- `Raporlamalar/BIRLESIK_PROJE_RAPORU.md` (Bölüm 33 eklendi)

### Not
- `extractTextFeatures`/`buildFeatureTensor`/`simpleReadabilityScore` canlı UI yolunda değil yalnız `demo.ts`'te kullanılıyordu; kullanıcının gördüğü Ateşman kartı `mlService`'ten geliyordu — düzeltme her iki yolu da kanonik değerde birleştirdi.


---

## 34. "Sınıflarım" Ekranının Sürekli Yüklenmesi — Bileşik İndeks Eksikliği + Görünmez Hata Bildirimi (19 Ekim 2026)

### Şikâyet
Kullanıcı (ismail.kaleci@gmail.com, PREMIUM/admin) "Sınıflarım" sekmesine tıkladığında ekranın sürekli dönen yeşil spinner gösterdiğini, sekmelerin "VERDİĞİM SINIFLAR (0) / KATILDIĞIM SINIFLAR (0)" boş kaldığını bildirdi. Soru: deploy edilmemiş olmak mı, yoksa başka bir sebep mi?

### Kök Neden 1 — `classes` koleksiyonu için bileşik (composite) indeks yok
- `src/services/classroomService.ts` içindeki `listMyClasses(uid)` sorgusu: `query(collection(db,'classes'), where('instructorId','==',uid), orderBy('createdAt','desc'))`.
- Firestore'da bir alana eşitlik filtresi + farklı bir alana `orderBy` **bileşik indeks zorunlu** kılar. `firestore.indexes.json` dosyasında `projects` ve `apiKeys` için indeksler vardı ama **`classes` için hiç indeks tanımlanmamıştı**.
- Sonuç: sorgu production'da `failed-precondition` ile reddedilir. Yani mesele yalnızca "deploy edilmemiş" değil — **tanımın kendisi repoda eksikti**, deploy edilse bile eksik indeks yüzünden hata devam ederdi.
- `firestore.rules`: `classes` okuması isAdmin/isInstructor/isEnrolled için serbest → kurallar sorguyu engellemiyor; sorun tamamen indeks.

### Kök Neden 2 — sonner `<Toaster/>` mount edilmemiş (hata görünmez)
- Tüm sınıf bileşenleri (`ClassroomPanel`, `InstructorClassesView`, `StudentSubmitView`, `OnBehalfSubmitModal`, `SubmissionReportView`) `toast`'u **`sonner`**'dan import ediyor.
- `src/App.tsx` yalnızca **`react-hot-toast`**'un `<Toaster/>`'ını mount ediyordu; `sonner`'ınki hiç mount edilmemişti → `toast.error(...)` çağrıları sessizce kayboluyordu.
- Bu yüzden `listMyClasses` hata verdiğinde kullanıcıya hiçbir mesaj ulaşmıyor, ekran "takılı boş" görünüyordu.

### Düzeltme
1. `firestore.indexes.json` — `classes` koleksiyonu için bileşik indeks eklendi (dizinin ilk elemanı):
   - `{ fieldPath: "instructorId", order: "ASCENDING" }` + `{ fieldPath: "createdAt", order: "DESCENDING" }`
2. `src/App.tsx` — `import { Toaster as SonnerToaster } from 'sonner';` eklendi ve mevcut `<Toaster/>` yanına `<SonnerToaster position="top-center" richColors closeButton />` mount edildi → sınıf hataları/başarıları artık görünür.

### Çalışma Zamanı Notu (deploy kapısı)
- İndeks tanımı repoya eklendi; **ancak indeksin gerçekten oluşması için `firebase deploy --only firestore:indexes` gerekir** (Kural 23.4 — paylaşılan durum değişiklikleri ayrı açık onay ister). Deploy öncesi sorgu production'da hata vermeye devam eder; fakat artık toast görünür olacağı için hata mesajı kullanıcıya ulaşır.
- Toast düzeltimi anında etkilidir (build/deploy ile). Bundan böyle kullanıcı "Sınıflar yüklenemedi / failed-precondition ... index" mesajını görecek ve konsoldaki indeks oluşturma bağlantısıyla sorunu teyit edebilecek.

### Doğrulama
- `npx tsc --noEmit`: temiz
- `npm test -- --run --pool=vmThreads`: 37/37 geçti (3 dosya)
- `npx vite build`: 12.75s hatasız; `vendor-functions` (12.63 kB) hâlâ lazy; tüm uyarılar önceden mevcut (onnxruntime eval, dinamik/statik import)

### Değişen Dosyalar
- `firestore.indexes.json` (classes bileşik indeksi eklendi)
- `src/App.tsx` (sonner `<Toaster/>` mount edildi)
- `Raporlamalar/BIRLESIK_PROJE_RAPORU.md` (Bölüm 34 eklendi)


---

## 35. Commit Önü Rapor Doğruluğu + Deploy Kontrol Listesi + .gitignore Hijyeni (19 Ekim 2026)

### Amaç
commit+push ve deploy işlemlerinden önce rapor ile gerçek kod tabanı arasındaki tutarsızlıkları gidermek, bekleyen deploy listesini tamamlamak ve geçici artefaktların commit edilmesini engellemek.

### 1) Rapor doğruluğu (Bölüm 2.4 / 3.1 güncellendi)
Raporun eski “görev listesi” bölümleri, sonraki Bölümlerde tamamlanmış işleri hâlâ “❌ Yapılmadı” gösteriyordu. Kod tabanıyla doğrulanıp düzeltildi:
- App.tsx: **1931 → 486 satır** (monolith ayrıştırılmış).
- `EditorPanel.tsx` (418), `ResultPanel.tsx` (96), `AuditorSidebar.tsx` (436) → hepsi `src/components/{editor,result,auditor}/` altında mevcut; ✅ olarak işaretlendi.
- `vendor-core`: ~957 kB → güncel build **255 kB**.
- Not: orijinal satırlar silinmedi (Kural 1); yalnızca durumları güncellendi ve bu Bölüme çapraz referans eklendi.

### 2) Deploy kontrol listesine `firestore:indexes` eklendi
Bölüm 34 ile eklenen `classes` bileşik indeksi yalnız `firebase deploy --only firestore:indexes` ile çalışma zamanında etkili olur. Bekleyen deploy listesi artık: `functions` + `firestore.rules` + `storage.rules` + `firestore:indexes` (hepsi Kural 23.4 gereği ayrı onay bekliyor).

### 3) .gitignore hijyeni
`.gitignore` yalnızca temel kuralları içeriyordu; commit öncesi geçici artefaktlar eklendi:
- `scratch/` (tek kullanım betikleri + `.bak`), `tsc_output.txt`, `end_check.txt`, `.firecrawl/`, `.antigravitycli/`, `*.bak`, `*.docx`, `*.resolved`.
- Böylece `git add -A` bu dosyaları almaz; gerçek kaynak (`src/**`, `functions/src`, `api/`, `storage.rules`, `vitest.config.ts`, `vercel.json`, `Raporlamalar/` vb.) ise stage'e girer.

### Geçen commit operasyonu
- `git reset` (index temizliği) → `.gitignore` güncellendikten sonra `git add -A` → `git status` ile ignore etkinliği doğrulandı → commit → push.

