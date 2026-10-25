# Sentience AI — Güncel Proje ve Geliştirme Raporu
> Son Güncelleme: 25 Ekim 2026 (17:30) | Sürüm: v2.5.0-production

---

## 1. 25 EKİM 2026 OTURUMUNDA TAMAMLANAN TÜM GELİŞTİRMELER

Aşağıdaki maddeler bu oturumda sırasıyla ele alınmış, kodlanmış, birim testleri ve build adımları ile doğrulanarak tamamlanmıştır:

### 1.1 Raporlama Konsolidasyonu ve Dizin Temizliği
- **Eski Dosyaların Birleştirilmesi:** `@Raporlamalar` dizininde bulunan 12 adet eski, parçalı ve çakışan rapor dosyası taranarak tek bir kanonik raporda (`GUNCEL_PROJE_VE_GELISTIRME_RAPORU.md`) birleştirildi ve eski dosyalar dizinden temizlendi.
- **Sürekli Raporlama Kuralı:** Gelecekte tamamlanan her işlemin bu merkezi rapora işlenmesi kuralı `GEMINI.md` ve merkezi `Beyin` vault'una (`projects/Sentience-AI/Kurallar.md`) kaydedildi.

### 1.2 Turnitin Bütünlük Bayrakları (Integrity Flags) & Hile Tespiti
- **Genişletilmiş Harf İkamesi (Homoglyph) Tespiti:** Kiril ve Yunan alfabelerinden Latin harfleri yerine ikame edilen 40+ harfin tespiti ve orijinal Latin karşılıklarına haritalanması (`HOMOGLYPH_MAP`).
- **Görünmez & Sıfır Genişlikli Karakterler:** 18 farklı Unicode sıfır genişlikli boşluk ve gizli biçimlendirme karakterinin (`HIDDEN_CHARS_SET` - ZWSP, ZWNJ, ZWJ, BOM, LRM, RLM vb.) filtrelenmesi.
- **CSS / HTML Gizli Metin Kalıpları:** `<span style="display:none">`, `font-size:0`, `color:white/transparent` gibi intihal motorlarını yanıltmaya yönelik kod bloklarının regex ile saptanması.
- **Kelime Bağlamı Analizi:** Hileli harfin tespit edildiği kelime bağlamı (`wordContext`) ve pozisyonuyla raporlanması.
- **AuditorSidebar Entegrasyonu:** Bütünlük bayrağı uyarı kartı, manipülasyon sayaçları ve tek tıkla "Metni Hilelerden Arındır" (`onApplySanitizedText`) temizleme butonu.
- **SubmissionReportView Entegrasyonu:** Turnitin standardında Bütünlük Bayrağı uyarı bandı, manipülasyon rozetleri ve katlanabilir detay paneli.
- **Birim Test Kapsamı:** `src/test/integrityFlags.test.ts` eklendi; vitest test suite 41/41 başarıyla geçti.

### 1.3 Dinamik Rapor Filtreleme (Turnitin Standardı)
- **Turnitin Filtreleme Seçenekleri:** `exclude_quotes` (Alıntıları Hariç Tut), `exclude_bibliography` (Kaynakçayı Hariç Tut), `exclude_minor` (<10 Kelime Eşleşmeleri Hariç Tut) butonları `AuditorSidebar.tsx` ve `SubmissionReportView.tsx` bileşenlerinde tam entegre edildi.
- **Dinamik Net Benzerlik Hesabı:** Filtreler seçildiğinde aktif kaynak oranına göre anlık net intihal skoru (`effectivePlgScore`) ve yüzdesi canlı olarak yeniden hesaplanır.

### 1.4 Karşılaştır (Diff View) Eş Zamanlı Scroll Sync
- **Kilitlenmeyen Karşılıklı Senkronizasyon:** Orijinal ve dönüştürülmüş metin bloklarının oran bazlı (ratio scroll) kaydırılması; çift yönlü geri bildirim döngüsü kilidini engelleyen `activeScroller` mekanizması.
- **Senkron Kontrol Anahtarı:** Kullanıcının senkron kaydırmayı tek tıkla açıp kapatabilmesini sağlayan araç çubuğu butonu (`Link2` / `Unlink`).

### 1.5 Editör UX Paketi: Dosya Ayrıştırma, Kota Titremesi & Hata Aksiyonu
- **Sürükle-Bırak Dosya Yükleme:** Editör alanına `.docx`, `.pdf`, `.txt` ve `.md` dosyalarının sürüklenip bırakılmasıyla metinlerin anında çıkarılarak editöre aktarılması (`parseDocumentFile`).
- **Görsel Kota Aşımı Titremesi:** Günlük karakter limiti aşıldığında veya yetersiz kaldığında kota çubuğu ve karakter sayacında `animate-shake` animasyonu ve uyarı bandı.
- **API Hatalarında "Yeniden Dene" Butonu:** İnsanlaştırma ve YZ analizi çağrıları hata aldığında toast bildiriminde doğrudan tıklanabilir "Yeniden Dene" (Retry) aksiyon butonu.

### 1.6 Classroom Faz 2: Hızlı Rubrik ve Değerlendirme Genişletmesi
- **Hızlı Rubrik Şablonları:** `SubmissionReportView.tsx` içerisine eğitmenin tek tıkla ekleyebileceği akademik rubrik dönütleri ("Mükemmel Akademik Dürüstlük", "Kaynakça Formatı", "Doğrudan Alıntı Tırnak Eksikliği", "Özgünlük Yetersiz") eklendi.
- **Revizyon Senkronizasyonu:** Öğrencinin eğitmen değerlendirmesini ve notunu anlık görerek son teslim tarihine kadar "Yeniden Teslim Et" ile teslimini revize edebilme akışı doğrulandı.

### 1.7 Dinamik Filtreleme "Kelime Eşiği" Özel Dropdown Yenilemesi
- **Özel Koyu Tema Popover:** Tarayıcının işletim sistemi tabanlı açık/mavi renkli yerel `<select>` menüsü yerine koyu cam temaya uygun (`bg-[#0f141a]`, `border-white/15`) `isWordThresholdOpen` kontrollü özel açılır menü oluşturuldu.
- **Dönen Chevron İkonu & Vurgu Göstergeleri:** Seçili değere göre aktif zümrüt nokta belirteci ve açılma/kapanma animasyonu bağlandı.

### 1.8 Rehber & Akademik Dokümantasyon İndirme Merkezi
- **Dinamik Şablon ve Belge Motoru (`src/services/academicTemplateService.ts`):** Rehberdeki statik maddeler yerine tam teşekküllü dinamik belge üreticileri inşa edildi:
  1. *Akademik Dürüstlük ve Özgünlük Taahhütnamesi (.docx):* YÖK Bilimsel Araştırma ve Yayın Etiği Yönergesi uyumlu, enstitü teslimlerine özel resmi taahhütname.
  2. *YÖK Uyumlu Tez Benzerlik Raporu Kapak Sayfası (.pdf):* Standart enstitü onay formatı, Seçenek 2 model şablon uyarısı, benzerlik/Sentinel güven metrikleri tablosu ve jüri imza heyeti alanlarıyla.
  3. *APA 7 & IEEE Hızlı Kaynak Gösterme Kılavuzu (.pdf):* Metin içi atıflar, kaynakça formatları ve üretken YZ bildirim rehberi.
  4. *Sentience Kurumsal Platform Tanıtım Broşürü (.pdf):* Sentinel intihal motoru, Turnitin bütünlük bayrakları ve KVKK uyumlu veri güvenliği mimari özeti.
  5. *Yapay Zeka Tespit İtiraz ve İnceleme Başvuru Dilekçesi (.docx):* Yanlış pozitif durumlarında kullanılmak üzere versiyon geçmişi ve kanıt odaklı resmi başvuru dilekçesi.
- **Kullanıcı Rehberi İçi İndirme Kartları (`src/components/UserGuideView.tsx`):** "Akademik Şablonlar ve Kullanım Belgeleri" bölümünde her belge için dosya türü etiketi (`.DOCX` / `.PDF`), açıklama ve doğrudan indirme butonu eklendi.

### 1.9 Rehber "Konu Başlıkları" Sabit (Sticky) & Bağımsız Scroll İyileştirmesi
- **Sayfa Orantı Koruması (`lg:sticky lg:top-24 lg:self-start`):** Sol menünün sayfa boyunca aşağı uzayıp sağ detay paneliyle olan dikey dengeyi bozmasını engellemek üzere sol kenar çubuğu ekrana sabitlendi.
- **Bağımsız Scroll Alanı (`max-h-[calc(100vh-180px)]`):** 14 konu başlığı kendi iç scroll konteynerine alınarak tüm sayfanın aşağı kaydırılması zorunluluğu ortadan kaldırıldı.
- **Kompakt Tasarım & Aktif Gösterge:** Konu kartı yükseklikleri optimize edildi; aktif seçili konuya zümrüt dikey gösterge çubuğu (`absolute left-0 w-1 bg-emerald-400`) bağlandı.
- **Mobilde Akıllı Odaklanma:** Küçük ekranlarda konuya tıklandığında ekranın otomatik olarak detay kartına yumuşak kayması (`scrollIntoView`) ve indirme butonlarının mobilde tam genişlik alması (`w-full sm:w-auto`) sağlandı.

### 1.10 Firebase Canlı Dağıtım (Production Deploy)
- **Canlıya Dağıtılan Bileşenler:** Firebase Hosting (34 statik dosya), `firestore.rules` (güvenlik kuralları) ve `firestore.indexes.json` (bileşik indeksler) başarıyla deploy edildi.
- **Canlı Erişim URL:** [https://sentience-ai-free-2026.web.app](https://sentience-ai-free-2026.web.app)
- **Proje Konsolu:** `sentience-ai-free-2026`

### 1.11 Tablet ve Mobil "Sıfır Hata" Responsive Entegrasyonu (25 Ekim 2026)
- **Rehber (UserGuideView) Mobil Ergonomisi:** Üst barda uzun alt açıklama mobilde gizlenerek (`hidden sm:block`) başlık çakışması önlendi. 5 satır kaplayan filtreler tek satırda parmakla kaydırılan (`overflow-x-auto no-scrollbar`) modern çipe dönüştürüldü. Mobilde 14 konunun ekranı işgal etmesini engelleyen kompakt "Konu Değiştir" çekmecesi bağlandı.
- **App.tsx Mobil Segmented Switcher:** 1024px altında `[ 📝 Giriş ] [ ✨ Sonuç ] [ 🛡️ Denetçi ]` sekmeleri en az 42px touch-target ve `touch-manipulation` ile optimize edildi.
- **DiffView Otomatik Mobil Adaptasyonu:** 768px altındaki ekranlarda karşılaştırma görünümü otomatik olarak tek kolon Satır İçi (Inline) moda geçecek şekilde ayarlandı.
- **Classroom Panel Mobil Kart Formatı:** `AssignmentDetailView.tsx` içerisindeki teslimat tablosu küçük ekranlarda yatay taşma yapmadan bağımsız öğrenci kartlarına (`md:hidden Card UI`) dönüştürüldü.
- **iOS / Android CSS Polish:** `src/index.css` içine safe-area değişkenleri, `no-scrollbar` ve `touch-manipulation` yardımcı sınıfları entegre edildi.

### 1.12 Editör Otomatik YZ Tespiti ve Masaüstü Tarayıcı Bildirimleri (Notification API)
- **Kalıcı Otomatik Tespit (Auto Detection) Düğmesi:** `EditorPanel.tsx` araç çubuğuna `Zap` ikonlu mor "Oto Tespit" toggle butonu eklendi. Tercih `localStorage` üzerinden kalıcı saklanır.
- **Yapıştırma (onPaste) & Dosya Yükleme Tetikleyicisi:** Özellik açıkken editöre metin yapıştırıldığında (≥30 karakter) veya dosya yüklendiğinde kullanıcı ekstra butona basmadan otomatik Denetçi analizi tetiklenir.
- **Tarayıcı Bildirimleri Altyapısı (`src/utils/browserNotification.ts`):** `requestNotificationPermission`, `isNotificationSupported`, `getNotificationPermission` ve `sendBrowserNotification` yardımcı fonksiyonları kuruldu.
- **Uzun İşlem Bildirimleri:** `useEditorWorkflow.tsx` içerisinde insanlaştırma ve derin analiz tamamlandığında arka planda çalışan tarayıcıya sistem bildirimi gönderilir; bildirime tıklandığında sekme otomatik odaklanır (`window.focus()`).
- **Hesap Ayarları İzin Yönetimi:** `AccountSettingsModal.tsx` profil sekmesine "Masaüstü Bildirimleri" kartı ve tek tıkla izin verme butonu entegre edildi.

### 1.13 Landing Page & Footer CMS Kalıcı Senkronizasyon Onarımı (25 Ekim 2026)
- **Kök Neden Tespiti:** Firestore güvenlik kurallarında `settings/{settingId}` dökümanı `allow read: if request.auth != null;` şeklinde kapalıydı. Sayfa yenilendiğinde (F5) veya henüz giriş yapmamış ziyaretçilerde `PERMISSION_DENIED` hatası alınıyor ve `DEFAULT_LANDING_CONFIG`'e düşülüyordu. Ayrıca admin yazma kuralında platform yönetici e-postaları (`isPlatformAdminEmail()`) eksikti.
- **Firestore Güvenlik Kuralı Ayırımı:** `firestore.rules` güncellenerek `match /settings/landingPage` için kamuya açık okuma (`allow read: if true;`) ve hem admin rolü hem de platform adminleri için yazma izni (`allow write: if isAdmin() || isPlatformAdminEmail();`) tanımlandı.
- **Çift Kademeli Önbellek & Force Refresh (`landingCmsService.ts`):** `fetchConfig(forceRefresh)` desteği eklendi. Yapılan değişikliklerin anında `localStorage` (`sentience_landing_cms_cache`) üzerine de yazılması sağlandı.
- **Canlı Olay Dinleme (`sentience_cms_updated`):** Yönetim panelinde "Kaydet" yapıldığında `window.dispatchEvent` ile `LandingPage.tsx` ve `Footer.tsx` bileşenlerinin sayfayı yenilemeye gerek kalmadan anlık güncellenmesi sağlandı.
- **Üretim Dağıtımı:** Güncellenen kurallar ve derlenmiş dosyalar `https://sentience-ai-free-2026.web.app` adresine deploy edildi.

### 1.14 Demo Yükleme Butonu Admin İzolasyonu ve Kök Yönetici Yetkilendirmesi (25 Ekim 2026)
- **Demo Sıfırlama Butonu İzolasyonu:** ProjectSidebar.tsx ve App.tsx bileşenlerinde onSeedDemoProjects propu ve görünürlüğü yalnızca isAdmin === true şartına bağlandı; normal kullanıcıların görmesi engellendi.
- **Firestore Kurallarında Kök Admin Fonksiyonu:** firestore.rules içerisindeki isAdmin() yardımcı fonksiyonu, isPlatformAdminEmail() e-postalarını doğrudan kapsayacak şekilde güncellendi.
- **Sistem Ayarları Halka Açık Okuma:** settings/{settingId} için allow read: if true; tanımlandı.
- **Canlı Dağıtım:** https://sentience-ai-free-2026.web.app adresine deploy edildi.

---

## 2. ÖNCEKİ OTURUMLARDA TAMAMLANAN GELİŞTİRMELER (EKİM 2026 ORTASI)

### 2.1 Admin Paneli Modüler Sekme ve Çekirdek Onarımları (24 Ekim 2026)

#### A. API Havuzu & Kotalar Kartı
- **4 Bağımsız Servis Havuzu (2x2 Grid):** Gemini API, CORE API, OpenAlex ve OpenCitations için dinamik anahtar yönetimi.
- **Canlı Sağlık Testi:** Her anahtar için gerçek zamanlı bağlantı ve yetki denetimi (`handleTestKey`). Durum rozetleri: `Aktif` (yeşil), `Hatalı` (kırmızı), `Bilinmiyor` (gri).
- **Kota Tüketim Çubukları:** Her anahtar için görsel doluluk çubuğu ve sayısal gösterge (`used/limit`).
- **Ertesi Gün Otomatik Sıfırlanma Sayacı:** Türkiye saati (UTC+3) ile gece yarısına (00:00) kalan süreyi saniye hassasiyetinde canlı geri sayan zamanlayıcı (`timeUntilReset`).
- **Durum Açma/Kapatma:** Anahtarların tek tıkla pasife (`is_active: false`) veya aktife alınabilmesi.

#### B. Model & Yapay Zeka Motoru Kartı
- **Güncel Model Matrisi:** `gemini-2.5-flash` (varsayılan), `gemini-3.8-flash`, `gemini-2.0-flash`, `gemini-3.1-pro` ve `gemini-3.1-flash-lite` modellerinin entegrasyonu.
- **Canlı Gecikme ve Ping:** Seçili modelin yanıt süresini ölçen milisaniye cinsinden gecikme rozeti ve ping testi.
- **Gelişmiş Hiperparametreler:** `Sıcaklık (Temperature: 0.0 - 2.0)` ve `Top-P (0.0 - 1.0)` kaydırıcı kontrolleri.
- **Bulut Yedekleme (Cloud Fallback) Koruma Anahtarı:** Yerel motor (Ollama / LM Studio) yanıt vermediğinde veya kotalar tükendiğinde otomatik olarak Gemini bulut servisine geçiş anahtarı.
- **Canlı Çıkarım Denemesi (Dry-Run Box):** Ayarları kaydetmeden önce doğrudan admin panelinden örnek metinle hızlı model test kutusu.

#### C. İntihal & Sentinel Kartı
- **Akademik Dürüstlük Eşikleri:** Genel İntihal Tavanı (%5 - %30 kaydırıcı, varsayılan %15) ve Kaynak Başına Benzerlik Sınırı (%1 - %10 kaydırıcı, varsayılan %3) kontrolleri.
- **Çoklu Akademik Doğrulama Kaynakları:** Crossref, Semantic Scholar, PubMed / arXiv ve CORE servisleri için bağımsız açma/kapatma anahtarları.
- **Canlı Sentinel Doğrulama Simülasyonu:** Panel üzerinden metin girilerek akademik kaynak taramasını ve benzerlik oranını anında test eden simülasyon aracı.
- **Filtrelenebilir Denetim Günlüğü:** `Tümü`, `Temiz (<%15)`, `İhlal (≥%15)` filtreli, arama ve sıralama destekli geçmiş denetim tablosu.

#### D. Kullanıcılar & Tarzlar Kartı
- **Dinamik Rol Yönetimi:** `Yönetici (Admin)` / `Üye (Member)` rollerinin anlık değiştirilmesi ve kritik yöneticilerin (`ADMIN_EMAILS`) yetkisinin düşürülmesini engelleyen güvenlik koruması.
- **Plan Bazlı Kota İlerleme Çubukları:** Kullanıcının abonelik paketine (`PLAN_LIMITS`) göre günlük karakter kotasının (`dailyUsage / charLimit`) doluluk oranını gösteren renk kodlu (yeşil/sarı/kırmızı) ilerleme çubuğu ve yüzde hesabı.
- **Tekil Kullanıcı Kota Sıfırlama:** Adminin her kullanıcı satırında tek tıkla o kullanıcının günlük kullanımını sıfırlayabilmesi (`handleResetSingleUserUsage`).
- **Özel Tarz Detay İnceleme Modalı:** Kullanıcıların oluşturduğu özel tarzların kurallarını, açıklamasını, örnek metnini ve oluşturan e-posta bilgisini gösteren inceleme modalı (`Eye` butonu).
- **Abonelik Dağılım Rozetleri:** Tablo başlığında sistemdeki `Ücretsiz`, `Pro` ve `Premium` üye sayılarını gösteren canlı sayaçlar.

### 1.13 Landing Page & Footer CMS Kalıcı Senkronizasyon Onarımı (25 Ekim 2026)
- **Kök Neden Tespiti:** Firestore güvenlik kurallarında `settings/{settingId}` dökümanı `allow read: if request.auth != null;` şeklinde kapalıydı. Sayfa yenilendiğinde (F5) veya henüz giriş yapmamış ziyaretçilerde `PERMISSION_DENIED` hatası alınıyor ve `DEFAULT_LANDING_CONFIG`'e düşülüyordu. Ayrıca admin yazma kuralında platform yönetici e-postaları (`isPlatformAdminEmail()`) eksikti.
- **Firestore Güvenlik Kuralı Ayırımı:** `firestore.rules` güncellenerek `match /settings/landingPage` için kamuya açık okuma (`allow read: if true;`) ve hem admin rolü hem de platform adminleri için yazma izni (`allow write: if isAdmin() || isPlatformAdminEmail();`) tanımlandı.
- **Çift Kademeli Önbellek & Force Refresh (`landingCmsService.ts`):** `fetchConfig(forceRefresh)` desteği eklendi. Yapılan değişikliklerin anında `localStorage` (`sentience_landing_cms_cache`) üzerine de yazılması sağlandı.
- **Canlı Olay Dinleme (`sentience_cms_updated`):** Yönetim panelinde "Kaydet" yapıldığında `window.dispatchEvent` ile `LandingPage.tsx` ve `Footer.tsx` bileşenlerinin sayfayı yenilemeye gerek kalmadan anlık güncellenmesi sağlandı.
- **Üretim Dağıtımı:** Güncellenen kurallar ve derlenmiş dosyalar `https://sentience-ai-free-2026.web.app` adresine deploy edildi.

### 1.14 Demo Yükleme Butonu Admin İzolasyonu ve Kök Yönetici Yetkilendirmesi (25 Ekim 2026)
- **Demo Sıfırlama Butonu İzolasyonu:** `ProjectSidebar.tsx` ve `App.tsx` bileşenlerinde `onSeedDemoProjects` prop'u ve görünürlüğü yalnızca `isAdmin === true` şartına bağlandı; normal kullanıcıların kenar çubuğunda "Örnekleri Sıfırla & Yükle" butonunu görmesi tamamen engellendi.
- **Firestore Kurallarında Kök Admin Fonksiyonu:** `firestore.rules` içerisindeki `isAdmin()` yardımcı fonksiyonu, `isPlatformAdminEmail()` e-postalarını doğrudan kapsayacak şekilde güncellendi. Böylece kullanıcı belgesindeki rol alanı gecikse bile adminler ayarlar, kullanıcılar, loglar ve modeller üzerinde kesintisiz yetkilendirildi.
- **Sistem Ayarları Halka Açık Okuma:** `settings/{settingId}` için `allow read: if true;` tanımlanarak bakım modu (`maintenanceMode`), modeller ve genel parametrelerin giriş yapmamış ziyaretçiler dahil tüm sekmelerde hatasız okunması sağlandı.
- **Canlı Dağıtım (Production):** Yapılan değişiklikler derlenip `https://sentience-ai-free-2026.web.app` adresine deploy edildi.

---

### 2.2 Turnitin Standartlarında Sınıf, Ödev ve Teslim Sistemi (Classroom)
- **Veri Modeli & Servisler:** `classes`, `assignments`, `submissions` koleksiyonları.
- **Eşleşme Grupları (Match Groups):** `not_cited_or_quoted` (kırmızı), `missing_quotations` (kehribar), `missing_citation` (sarı), `cited_and_quoted` (yeşil), `peer_match` (mor - sınıf havuzu), `self_plagiarism` (çivit - öğrenci öz-intihali).
- **Teslim Raporu (SubmissionReportView):** Turnitin renk standartları ve filtreleme sekmeleriyle kaynak analizi.
- **Firestore Composite Indexes:** `classes` koleksiyonu için `instructorId` + `createdAt` bileşik indeks tanımı.
- **Bildirim Düzeltmesi:** `sonner` Toaster bileşeni `App.tsx`'e monte edilerek sessiz hata kayıpları engellendi.

### 2.3 Dürüst (Honest) Sentinel Taraması
- API anahtarı veya Search Engine yapılandırılmadığında sessizce "%100 Özgün" yanıltması kaldırıldı.
- `SentinelScanStatus` (`ok`, `disabled`, `offline`, `not_configured`, `failed`) ve `PlagiarismScanMeta` yapısı kuruldu.
- Tarama başarısız olduğunda veya yapılandırılmadığında durum kullanıcıya şeffaf olarak yansıtılıyor.

### 2.4 Kanonik Türkçe Okunabilirlik Formülleri
- `textFeatures.ts` ve `mlService.ts` arasındaki formül çelişkisi giderildi; tüm hesaplamalar tek bir kanonik kaynağa bağlandı:
  - **Ateşman (1997):** `199.5 − 1.015·(kelime/cümle) − 84.6·(hece/kelime)`
  - **Çetinkaya-Uzun (2010):** `118.823 − 25.987·(hece/kelime) − 0.971·(kelime/cümle)`

### 2.5 İki Kademeli Yetkilendirme (Gated Features)
- Tanıtım Sitesi, Sınıflarım ve Veri İndirme (JSONL) özellikleri iki kademeli kontrole bağlandı (`isAdmin || featureAccess || featureGrants`).
- Firestore güvenlik kuralları (`firestore.rules`) sertleştirilerek yetki yükseltme (privilege escalation) açıkları kapatıldı.

### 2.6 Çok Dilli Yerel Vektör Motoru & Semantik Benzerlik
- `vectorEngine.ts`: `Xenova/paraphrase-multilingual-MiniLM-L12-v2` çok dilli modeline geçildi (50+ dil, Türkçe optimize).
- `vectorService.ts`: Firestore vektör verileri üzerinden semantik arama (`semanticSearch`) fonksiyonu tamamlandı.
- `sentinelService.ts`: Web taramasına ek olarak kullanıcının geçmiş projeleriyle yerel semantik vektör eşleşmesi entegre edildi (`internal://vector/...`).

### 1.13 Landing Page & Footer CMS Kalıcı Senkronizasyon Onarımı (25 Ekim 2026)
- **Kök Neden Tespiti:** Firestore güvenlik kurallarında `settings/{settingId}` dökümanı `allow read: if request.auth != null;` şeklinde kapalıydı. Sayfa yenilendiğinde (F5) veya henüz giriş yapmamış ziyaretçilerde `PERMISSION_DENIED` hatası alınıyor ve `DEFAULT_LANDING_CONFIG`'e düşülüyordu. Ayrıca admin yazma kuralında platform yönetici e-postaları (`isPlatformAdminEmail()`) eksikti.
- **Firestore Güvenlik Kuralı Ayırımı:** `firestore.rules` güncellenerek `match /settings/landingPage` için kamuya açık okuma (`allow read: if true;`) ve hem admin rolü hem de platform adminleri için yazma izni (`allow write: if isAdmin() || isPlatformAdminEmail();`) tanımlandı.
- **Çift Kademeli Önbellek & Force Refresh (`landingCmsService.ts`):** `fetchConfig(forceRefresh)` desteği eklendi. Yapılan değişikliklerin anında `localStorage` (`sentience_landing_cms_cache`) üzerine de yazılması sağlandı.
- **Canlı Olay Dinleme (`sentience_cms_updated`):** Yönetim panelinde "Kaydet" yapıldığında `window.dispatchEvent` ile `LandingPage.tsx` ve `Footer.tsx` bileşenlerinin sayfayı yenilemeye gerek kalmadan anlık güncellenmesi sağlandı.
- **Üretim Dağıtımı:** Güncellenen kurallar ve derlenmiş dosyalar `https://sentience-ai-free-2026.web.app` adresine deploy edildi.

### 1.14 Demo Yükleme Butonu Admin İzolasyonu ve Kök Yönetici Yetkilendirmesi (25 Ekim 2026)
- **Demo Sıfırlama Butonu İzolasyonu:** `ProjectSidebar.tsx` ve `App.tsx` bileşenlerinde `onSeedDemoProjects` prop'u ve görünürlüğü yalnızca `isAdmin === true` şartına bağlandı; normal kullanıcıların kenar çubuğunda "Örnekleri Sıfırla & Yükle" butonunu görmesi tamamen engellendi.
- **Firestore Kurallarında Kök Admin Fonksiyonu:** `firestore.rules` içerisindeki `isAdmin()` yardımcı fonksiyonu, `isPlatformAdminEmail()` e-postalarını doğrudan kapsayacak şekilde güncellendi. Böylece kullanıcı belgesindeki rol alanı gecikse bile adminler ayarlar, kullanıcılar, loglar ve modeller üzerinde kesintisiz yetkilendirildi.
- **Sistem Ayarları Halka Açık Okuma:** `settings/{settingId}` için `allow read: if true;` tanımlanarak bakım modu (`maintenanceMode`), modeller ve genel parametrelerin giriş yapmamış ziyaretçiler dahil tüm sekmelerde hatasız okunması sağlandı.
- **Canlı Dağıtım (Production):** Yapılan değişiklikler derlenip `https://sentience-ai-free-2026.web.app` adresine deploy edildi.

---

## 3. TARİHSEL ÇEKİRDEK MİMARİ VE BİLEŞENLER

### 3.1 Çekirdek Altyapı ve Veri Modeli
- **Teknoloji Yığını:** React 19, TypeScript, Vite, Tailwind CSS, Framer Motion, Lucide-React, Firebase SDK, @google/genai, @xenova/transformers.
- **Firebase Yapısı:** Google Auth, Firestore NoSQL şemaları (`users`, `projects`, `customTones`, `classes`, `submissions`, `vector_embeddings`, `activityLogs`).
- **Vercel Serverless API:** `api/analyze.ts` ve `api/detect.ts` uç noktaları.

### 3.2 Editör ve Sonuç Araçları
- **Monolith Ayrıştırması:** `App.tsx` (1931 satırdan 486 satıra düşürüldü); `EditorPanel`, `ResultPanel`, `AuditorSidebar`, `ProjectSidebar`, `HeatmapView`, `GrammarPanel`, `AuditorMetrics`, `DiffView` modüllerine ayrıldı.
- **Geri Al / İleri Al:** Son 30 adımı tutan Undo/Redo stack yapısı.
- **Diff View:** LCS (Longest Common Subsequence) algoritmasıyla kelime bazlı eklenen/silinen fark analizi.
- **Dışa Aktarma (Export):** DOCX (tablolu/biçimli), PDF/Yazdırma şablonu, TXT yalın metin indirme.
- **Proje Geçmişi ve Taslak:** Analiz sonuçlarının Firestore'a tam kaydedilmesi, projeler açıldığında yeniden API harcamadan anında görüntülenmesi, sayfalama (`limit(20)`).

### 3.3 Güvenlik ve Kurallar
- Adminlerin kullanıcı ham metinlerini okumasını engelleyen güvenlik mandadı (`getCountFromServer()` kullanımı).
- Etik intihal protokolü (%15 tavan, sıfır halüsinasyon, kaynak doğrulama).
- Kullanıcı hesap silme ve üyelik iptali akışları.

### 1.13 Landing Page & Footer CMS Kalıcı Senkronizasyon Onarımı (25 Ekim 2026)
- **Kök Neden Tespiti:** Firestore güvenlik kurallarında `settings/{settingId}` dökümanı `allow read: if request.auth != null;` şeklinde kapalıydı. Sayfa yenilendiğinde (F5) veya henüz giriş yapmamış ziyaretçilerde `PERMISSION_DENIED` hatası alınıyor ve `DEFAULT_LANDING_CONFIG`'e düşülüyordu. Ayrıca admin yazma kuralında platform yönetici e-postaları (`isPlatformAdminEmail()`) eksikti.
- **Firestore Güvenlik Kuralı Ayırımı:** `firestore.rules` güncellenerek `match /settings/landingPage` için kamuya açık okuma (`allow read: if true;`) ve hem admin rolü hem de platform adminleri için yazma izni (`allow write: if isAdmin() || isPlatformAdminEmail();`) tanımlandı.
- **Çift Kademeli Önbellek & Force Refresh (`landingCmsService.ts`):** `fetchConfig(forceRefresh)` desteği eklendi. Yapılan değişikliklerin anında `localStorage` (`sentience_landing_cms_cache`) üzerine de yazılması sağlandı.
- **Canlı Olay Dinleme (`sentience_cms_updated`):** Yönetim panelinde "Kaydet" yapıldığında `window.dispatchEvent` ile `LandingPage.tsx` ve `Footer.tsx` bileşenlerinin sayfayı yenilemeye gerek kalmadan anlık güncellenmesi sağlandı.
- **Üretim Dağıtımı:** Güncellenen kurallar ve derlenmiş dosyalar `https://sentience-ai-free-2026.web.app` adresine deploy edildi.

### 1.14 Demo Yükleme Butonu Admin İzolasyonu ve Kök Yönetici Yetkilendirmesi (25 Ekim 2026)
- **Demo Sıfırlama Butonu İzolasyonu:** `ProjectSidebar.tsx` ve `App.tsx` bileşenlerinde `onSeedDemoProjects` prop'u ve görünürlüğü yalnızca `isAdmin === true` şartına bağlandı; normal kullanıcıların kenar çubuğunda "Örnekleri Sıfırla & Yükle" butonunu görmesi tamamen engellendi.
- **Firestore Kurallarında Kök Admin Fonksiyonu:** `firestore.rules` içerisindeki `isAdmin()` yardımcı fonksiyonu, `isPlatformAdminEmail()` e-postalarını doğrudan kapsayacak şekilde güncellendi. Böylece kullanıcı belgesindeki rol alanı gecikse bile adminler ayarlar, kullanıcılar, loglar ve modeller üzerinde kesintisiz yetkilendirildi.
- **Sistem Ayarları Halka Açık Okuma:** `settings/{settingId}` için `allow read: if true;` tanımlanarak bakım modu (`maintenanceMode`), modeller ve genel parametrelerin giriş yapmamış ziyaretçiler dahil tüm sekmelerde hatasız okunması sağlandı.
- **Canlı Dağıtım (Production):** Yapılan değişiklikler derlenip `https://sentience-ai-free-2026.web.app` adresine deploy edildi.

---

## 4. ATLANANLAR VE YENİ YAPILACAKLAR LİSTESİ (YOL HARİTASI)

Geçmiş raporlar ve yol haritaları incelendiğinde henüz uygulanmamış veya geliştirilmesi gereken maddeler aşağıda önceliklendirilmiştir:

### 4.1 Öncelik 1 (P1): Turnitin Bütünlük Bayrakları ve Filtreleme
- [x] **Homoglyph (Karakter Değiştirme) Tespiti:** Kiril/Yunan harfleriyle Latin harflerinin değiştirilerek intihal motorlarının atlatılmasını saptayan algoritma (Genişletildi ve tamamlandı).
- [x] **Gizli Metin (Hidden Text) Tespiti:** Beyaz zemin üzerine beyaz yazı, 0-1px mikro fontlar, görünmez CSS stili veya sıfır genişlikli Unicode karakterlerin tespiti (Tamamlandı).
- [x] **Dinamik Hariç Tutma Filtreleri (Turnitin Standardı):**
  - Alıntıları rapordan hariç tut seçeneği (`exclude_quotes`).
  - Kaynakçayı rapordan hariç tut seçeneği (`exclude_bibliography`).
  - Belirli bir kelimenin altındaki küçük eşleşmeleri (<10 kelime) hariç tut seçeneği (`exclude_minor`).

### 4.2 Öncelik 2 (P2): Editör ve Kullanıcı Deneyimi (UX/UI) Eksikleri
- [x] **Karşılaştır Sekmesi Scroll Sync:** Orijinal metin ile insanlaştırılmış metnin yan yana senkronize kaydırılması (Kilitlenmeyen scroll sync ve açma/kapatma butonu eklendi).
- [x] **Kelime Sınırı Aşımı Uyarısı:** Karakter/kelime limiti aşıldığında kota çubuğunda görsel titreme (`animate-shake`) ve uyarı bandı eklendi.
- [x] **Sürükle-Bırak Dosya Yükleme:** Editöre doğrudan `.docx`, `.pdf`, `.txt` ve `.md` dosyalarının sürüklenip bırakılarak metne dönüştürülmesi sağlandı.
- [x] **Otomatik YZ Tespiti:** Metin yapıştırıldığında veya dosya yüklendiğinde kullanıcı isteğine bağlı olarak (`localStorage` kalıcı anahtarlı `Oto Tespit` butonu) otomatik Denetçi analizinin başlatılması sağlandı.
- [x] **Hata Geri Bildirim Butonu:** API çağrısı başarısız olduğunda bildirim kutusu içinde "Yeniden Dene" aksiyon butonu eklendi.
- [x] **Tarayıcı Bildirimleri:** Uzun süren insanlaştırma ve derin analiz işlemleri tamamlandığında `Notification API` üzerinden kullanıcıya sesli/görsel masaüstü bildirimi gönderilmesi (`browserNotification.ts`, `AccountSettingsModal` izin yönetimi).

### 4.3 Öncelik 3 (P3): Classroom & Geri Bildirim Faz 2
- [x] **Öğretmen Değerlendirme ve Notlandırma:** Teslim edilen ödevlere öğretmen tarafından not (0-100), genel yorum ve değerlendirme geçmişi kaydı (`gradeSubmission`).
- [x] **Rubrik (Değerlendirme Ölçütü) Sistemi:** Hızlı rubrik geri bildirim şablonları ("Mükemmel Akademik Dürüstlük", "Kaynakça Formatı", "Doğrudan Alıntı Tırnak Eksikliği", "Özgünlük Yetersiz") ile tek tıkla dönüt ekleme.
- [x] **Öğrenci Düzeltme Döngüsü:** Öğrencinin benzerlik raporunu ve eğitmen değerlendirmesini gördükten sonra son teslim tarihine kadar "Yeniden Teslim Et" ile revize edilmiş yeni sürüm yükleyebilmesi.

### 4.4 Öncelik 4 (P4): Derin Altyapı ve Performans
- [ ] **Cloud Vector Search (Vertex AI):** Tarayıcı tabanlı Transformers.js çözümüne alternatif olarak, milyonluk belgeler için GCP Vertex AI Vector Search bulut entegrasyonu.
- [ ] **GitHub Actions Otomasyon Genişletmesi:** PR'larda otomatik Lighthouse performans ve erişilebilirlik denetimlerinin eklenmesi.

### 4.5 Öncelik 5 (P5): Tablet ve Mobil "Sıfır Hata" Responsive Yol Haritası
- [x] **Rehber (UserGuideView) Mobil Ergonomisi (P1):** Uzun üst başlığın mobilde gizlenmesi (`hidden sm:block`), 5 satır kaplayan filtre etiketlerinin tek satırda parmakla kaydırılabilir (`overflow-x-auto no-scrollbar`) yapılması, mobilde kompakt konu seçici çekmecesi.
- [x] **Mobil Segmented Ekran Değiştirici (App.tsx) (P2):** 1024px altında Editör ve Sonuç panellerinin alt alta yığılmasını önleyen, üstte/altta `[ 📝 Giriş ] [ ✨ Sonuç ] [ 🛡️ Denetçi ]` kayar sekme mimarisi.
- [x] **Mobil Uyumlu Tek Kolon (Inline) Diff (P3):** 375px-768px küçük ekranlarda çift kolon split yerine kırmızı çizili / yeşil vurgulu tek akışlı karşılaştırma görünümü.
- [x] **Sınıf & Raporlama Kart Düzeni (P4):** Veri tablolarının mobilde taşmasını önleyen responsive kart düzenine (`Card UI`) geçirilmesi.
- [x] **iOS/Android Sistem Uyumu & CSS Polish (P5):** Dynamic Viewport Height (`100dvh`), `env(safe-area-inset-bottom)` ve butonlarda minimum 44x44px touch target standartları.

### 1.13 Landing Page & Footer CMS Kalıcı Senkronizasyon Onarımı (25 Ekim 2026)
- **Kök Neden Tespiti:** Firestore güvenlik kurallarında `settings/{settingId}` dökümanı `allow read: if request.auth != null;` şeklinde kapalıydı. Sayfa yenilendiğinde (F5) veya henüz giriş yapmamış ziyaretçilerde `PERMISSION_DENIED` hatası alınıyor ve `DEFAULT_LANDING_CONFIG`'e düşülüyordu. Ayrıca admin yazma kuralında platform yönetici e-postaları (`isPlatformAdminEmail()`) eksikti.
- **Firestore Güvenlik Kuralı Ayırımı:** `firestore.rules` güncellenerek `match /settings/landingPage` için kamuya açık okuma (`allow read: if true;`) ve hem admin rolü hem de platform adminleri için yazma izni (`allow write: if isAdmin() || isPlatformAdminEmail();`) tanımlandı.
- **Çift Kademeli Önbellek & Force Refresh (`landingCmsService.ts`):** `fetchConfig(forceRefresh)` desteği eklendi. Yapılan değişikliklerin anında `localStorage` (`sentience_landing_cms_cache`) üzerine de yazılması sağlandı.
- **Canlı Olay Dinleme (`sentience_cms_updated`):** Yönetim panelinde "Kaydet" yapıldığında `window.dispatchEvent` ile `LandingPage.tsx` ve `Footer.tsx` bileşenlerinin sayfayı yenilemeye gerek kalmadan anlık güncellenmesi sağlandı.
- **Üretim Dağıtımı:** Güncellenen kurallar ve derlenmiş dosyalar `https://sentience-ai-free-2026.web.app` adresine deploy edildi.

### 1.14 Demo Yükleme Butonu Admin İzolasyonu ve Kök Yönetici Yetkilendirmesi (25 Ekim 2026)
- **Demo Sıfırlama Butonu İzolasyonu:** `ProjectSidebar.tsx` ve `App.tsx` bileşenlerinde `onSeedDemoProjects` prop'u ve görünürlüğü yalnızca `isAdmin === true` şartına bağlandı; normal kullanıcıların kenar çubuğunda "Örnekleri Sıfırla & Yükle" butonunu görmesi tamamen engellendi.
- **Firestore Kurallarında Kök Admin Fonksiyonu:** `firestore.rules` içerisindeki `isAdmin()` yardımcı fonksiyonu, `isPlatformAdminEmail()` e-postalarını doğrudan kapsayacak şekilde güncellendi. Böylece kullanıcı belgesindeki rol alanı gecikse bile adminler ayarlar, kullanıcılar, loglar ve modeller üzerinde kesintisiz yetkilendirildi.
- **Sistem Ayarları Halka Açık Okuma:** `settings/{settingId}` için `allow read: if true;` tanımlanarak bakım modu (`maintenanceMode`), modeller ve genel parametrelerin giriş yapmamış ziyaretçiler dahil tüm sekmelerde hatasız okunması sağlandı.
- **Canlı Dağıtım (Production):** Yapılan değişiklikler derlenip `https://sentience-ai-free-2026.web.app` adresine deploy edildi.

---
*Rapor Sonu — Sentience AI Yönetim ve Geliştirme Dokümantasyonu*
