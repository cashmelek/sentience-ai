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

### 1.15 GitHub Actions CI/CD ve Firebase Proje Kimliği Eşitlemesi (25 Ekim 2026)
- **Proje Kimliği Düzeltmesi:** `.github/workflows/ci.yml` içerisindeki `projectId: sentience-ai` tanımları, `.firebaserc` ile tam uyumlu olan `sentience-ai-free-2026` olarak güncellendi ve GitHub'a push edildi.
- **Jules PR Hazırlığı:** Jules ve GitHub üzerinden açılacak Pull Request'lerin otomatik preview ve live deployment adımları hazırlandı.

### 1.16 Turnitin QuickMarks ve Satır İçi Notlandırma (Inline Annotations) (29 Ekim 2026)
- **Veri Modeli Genişletmesi (`src/types/classroom.ts`):** `SubmissionAnnotation` tipi tanımlandı (`id`, `startOffset`, `endOffset`, `selectedText`, `comment`, `category`, `quickMarkLabel`, `createdAt`, `createdBy`). `Submission` arayüzüne `annotations` alanı eklendi.
- **Servis Entegrasyonu (`src/services/classroomService.ts`):** `updateSubmissionAnnotations` fonksiyonu yazılarak eğitmenin öğrenci ödevine eklediği satır içi notların Firestore'da kalıcı saklanması sağlandı.
- **Turnitin QuickMarks Geri Bildirim Sekmesi (`SubmissionReportView.tsx`):**
  - Rapor görünümüne "Satır İçi Notlar & QuickMarks" sekmesi eklendi.
  - Metin üzerinde fare ile seçim (`handleTextMouseUp`) yapıldığında anında açılan Turnitin standardında hazır QuickMarks rozetleri ("Kaynak Eksik", "Tırnak Eksik", "Özgün Sentez Yetersiz", "Akademik Dil", "Kanıt / Veri Eksik", "Kaynak Formatı APA") ve özel satır içi yorum kutusu bağlandı.
  - Notlar öğrenci ve eğitmen için sağ panelde kaynak alıntısı ve kategori etiketiyle listelenir; eğitmen dilediğinde notları tek tıkla silebilir.
- **ClassroomPanel Bağlantısı:** `handleSaveAnnotations` handler'ı ile anlık reaktif senkronizasyon sağlandı.
- **Doğrulama:** 41/41 vitest testi geçti ve `npm run build` hatasız derlendi.

### 1.17 Öğrenci Ön Teslim Taslak Kontrolü (Turnitin Draft Coach) (29 Ekim 2026)
- **Veri Modeli Uyarlaması (`src/types/classroom.ts`):** `Assignment` yapısına `allowDraftCheck` ve `maxDraftChecks` alanları tanımlandı; `Submission` yapısına `draftCheckCount` ve `lastDraftScores` eklendi.
- **Ön Teslim Arayüzü (`StudentSubmitView.tsx`):**
  - Öğrenci ödev teslim ekranına "Ön Teslim Taslak Kontrolü (Draft Coach)" kontrol paneli entegre edildi.
  - Kalan hak sayacı (`remainingDrafts / maxDrafts`) bağlandı.
  - Metin havuza kaydedilmeden doğrudan anlık benzerlik ve YZ analizi çalıştırılarak öğrenciye ön gösterge sunuldu; böylece resmi teslim öncesinde eksik atıflarını giderme imkanı sağlandı.
- **Doğrulama:** Vitest 41/41 geçti, üretim derlemesi (`npm run build`) 18.45s içinde sıfır hatayla tamamlandı.

### 1.18 Toplu Notlandırma ve Gradebook CSV/Excel Genişletmesi (29 Ekim 2026)
- **Gradebook Dışa Aktarma Motoru (`src/components/classroom/submissionExport.ts`):**
  - `exportSubmissionsCSV` ve `exportSubmissionsExcel` fonksiyonlarına eğitmenin eklediği metin içi `annotations` (QuickMarks) sayaçları bağımsız bir sütun olarak eklendi.
  - Eğitmen tüm sınıfın notlarını, genel geri bildirimlerini, satır içi düzeltme sayılarını, benzerlik ve YZ olasılıklarını tek tıkla Excel/CSV tablosunda dışa aktarabilir hale getirildi.
- **Doğrulama:** 41/41 test başarıyla geçti ve üretim derlemesi (`npm run build`) hatasız tamamlandı.

### 1.19 Öğrenci Resmi Dijital Teslim Makbuzu (Official Digital Receipt PDF & QR Doğrulama) (29 Ekim 2026)
- **Resmi Makbuz Şablonu (`src/components/classroom/submissionExport.ts` - `exportDigitalReceiptPDF`):**
  - Turnitin standardında A4 formatında resmi teslim belgesi şablonu oluşturuldu.
  - Öğrenci kimlik bilgileri, ödev ve sınıf bilgileri, teslim zaman damgası, kelime ve karakter sayıları kart formatında yapılandırıldı.
  - Kriptografik bütünlük kanıtı olan **SHA-256 hash kodu** ve platform doğrulama bağlantısını içeren **çevrimiçi taranabilir QR kod** entegre edildi.
- **Rapor Ekranı Entegrasyonu (`SubmissionReportView.tsx`):**
  - Dijital makbuz bandına tek tıkla çalışan "Makbuzu İndir (PDF)" (`FileDown`) aksiyon butonu eklendi; öğrenci ve akademisyenin resmi teslim kanıtını yazdırma/PDF olarak kaydetmesi sağlandı.
- **Doğrulama:** Vitest 41/41 geçti, derleme (`npm run build`) 19.12s içinde sıfır hatayla tamamlandı.

### 1.20 Sınıf İçi Anlık Bildirim Akışı (Classroom Browser Notifications) (29 Ekim 2026)
- **Ödev Teslim & Skorlama Bildirimi (`ClassroomPanel.tsx`):** Öğrencinin teslimi sunucu/istemci tarafından skorlandığında arka planda dahi olsa sistem tepsisine "Ödev Tesliminiz Skorlandı" bildirimi gönderilmesi sağlandı.
- **Eğitmen Notlandırma Bildirimi (`ClassroomPanel.tsx`):** Eğitmen akademik not ve geri bildirim kaydettiğinde anlık tarayıcı bildirimi tetiklenmesi bağlandı.
- **Doğrulama:** 41/41 birim testi başarıyla geçti, üretim derlemesi (`npm run build`) 19.57s içinde sıfır hatayla doğrulandı.

### 1.21 Eğitmen Toplu Doküman Yükleme & İşleme Kuyruğu (Batch Processing) (29 Ekim 2026)
- **Toplu İşlem Modalı (`src/components/classroom/BatchSubmitModal.tsx`):**
  - Eğitmenin birden fazla `.docx` ve `.pdf` dosyasını tek seferde seçip sisteme aktarabileceği çoklu kuyruk arayüzü kuruldu.
  - Dosya isimlerinden öğrenci kimliğini tahmin eden otomatik eşleme motoru (`matchStudentByFileName`) entegre edildi.
  - Belgeleri sırayla ayrıştırma (`parsing`), Storage'a yükleme (`submitting`) ve intihal/YZ skorlama (`scoring`) adımlarından geçiren kuyruk orkestrasyonu bağlandı.
- **AssignmentDetailView ve ClassroomPanel Entegrasyonu:**
  - Ödev detay ekranı üst araç çubuğuna "Toplu Yükleme" (`Files`) aksiyon butonu eklendi.
- **Doğrulama:** Vitest 41/41 geçti, derleme (`npm run build`) 27.44s içinde sıfır hatayla tamamlandı.

### 1.22 Kriter Bazlı Detaylı Rubrik Matrisi (Ağırlıklı Puanlama Tablosu) (29 Ekim 2026)
- **Veri Modeli (`src/types/classroom.ts`):** `RubricCriterion` (başlık, ağırlık yüzdesi, azami puan) ve `RubricScoreItem` tipleri tanımlandı. `Assignment` ve `Submission` modellerine rubrik alanları eklendi.
- **Ağırlıklı Notlama Motoru (`SubmissionReportView.tsx`):**
  - Eğitmen notlandırma alanına katlanabilir "Rubrik Matrisi" paneli entegre edildi.
  - "Akademik Dil (%20)", "Kaynak Kalitesi (%30)", "Özgünlük & Sentez (%30)" ve "Metodoloji (%20)" kriterleri üzerinden verilen puanlara göre otomatik ağırlıklı genel not hesabı (`computedRubricGrade`) bağlandı.
  - Eğitmenin tek tıkla ağırlıklı notu genel nota aktarabilmesi (`Ağırlıklı Notu Uygula`) ve Firestore'a kriter puanlarıyla birlikte kaydetmesi sağlandı.
- **Doğrulama:** 41/41 vitest testi geçti, derleme (`npm run build`) 18.92s içinde hatasız tamamlandı.

### 1.23 Sınıf İçi Eş Düzey (Peer-to-Peer) Kopya Matrisi (29 Ekim 2026)
- **Çapraz Eşleşme Analiz Modalı (`src/components/classroom/PeerMatrixModal.tsx`):**
  - 4-gram shingle tabanlı Jaccard Benzerlik Algoritması (`computeJaccardSimilarity`) ile aynı sınıftaki tüm öğrencilerin teslimleri birbirleriyle otomatik çapraz karşılaştırılır.
  - Kritik eşleşmeler (`>%20`) ve şüpheli çiftler (`>%5`) listelenir; her çift için tek tıkla detaylı rapor açılabilir.
- **AssignmentDetailView Araç Çubuğu:** "Eş-Düzey Matrisi" (`Users`) aksiyon butonu eklendi.
- **Doğrulama:** Vitest 41/41 geçti, derleme (`npm run build`) 19.16s içinde sıfır hatayla doğrulandı.

### 1.24 Kullanıcı Rehberinin Rol Bazlı Segmentasyonu ve Yeni Modül Kılavuzları (29 Ekim 2026)
- **Rol Filtreleri Genişletmesi (`src/components/UserGuideView.tsx`):**
  - Rehber arayüzüne `Öğrenci & Araştırmacı`, `Öğretmen & Danışman`, `Yazar & Editör` ve `Enstitü & Yönetici` filtre sekmeleri eklendi.
- **Eklenen & Güncellenen Kılavuzlar:**
  1. *Öğretmen & Danışman Kılavuzu:* QuickMarks satır içi notlandırma, ağırlıklı rubrik matrisi, toplu ödev kuyruğu ve sınıf içi eş-düzey kopya matrisi adımları.
  2. *Öğrenci & Araştırmacı Kılavuzu:* Draft Coach ön taslak taraması, öz-intihal koruma prensipleri ve SHA-256 karekodlu resmi teslim belgesi PDF indirme yönergeleri.
  3. *Yazar & Editör Kılavuzu:* StyleMaster özel ton kütüphanesi, yazar sesi hafızası ve insanlaştırma (Perplexity/Burstiness) adaptasyonu.
- **Doğrulama:** 41/41 vitest testi geçti, derleme (`npm run build`) 19.08s içinde başarıyla tamamlandı.

### 1.25 Öğretmen ve Öğrenci Sınıf İçi Demo / Test Senaryoları Şablonu (29 Ekim 2026)
Gelecekteki canlı sunumlar, testler ve pilot üniversite gösterimleri için tanımlanan senaryo mimarisi:
- **Aktörler & Hesap Tanımları:**
  - *Öğretmen / Danışman:* `ismail.kaleci@gmail.com` (Doç. Dr. İsmail Kaleci)
  - *Öğrenci:* `deneme@deneme.com` (Ahmet Yılmaz - YL Araştırmacısı)
  - *Eş-Düzey Karşılaştırma Öğrencisi:* `ogrenci2@deneme.com` (Mehmet Demir)
  - *Sınıf:* `YZ-501: Akademik Araştırma ve Yayın Etiği` (Kod: `SENT26`, Anahtar: `DEMO-2026`)
- **Tanımlanan 3 Entegre Senaryo:**
  1. *Senaryo 1 (Ön Taslak & Turnitin QuickMarks Geri Bildirim Döngüsü):*
     - Öğrenci tarafında Draft Coach ile ön tarama (%32 benzerlik sonrası düzeltme), SHA-256 dijital makbuz indirme.
     - Öğretmen tarafında Turnitin QuickMarks satır içi notları (`[Kaynak Eksik]`, `[Tırnak Eksik]`), notlandırma (85/100) ve geri bildirim.
  2. *Senaryo 2 (Kriter Bazlı Detaylı Rubrik Matrisi ile Puanlama):*
     - 4 ağırlıklı ölçüt: Dil/Üslup (%20), Kaynak/Atıf (%30), Özgünlük/Sentez (%30), Metodoloji (%20).
     - Otomatik ağırlıklı notlama motoru (Toplam: 91 Puan) ve tek tıkla resmi nota aktarım.
  3. *Senaryo 3 (Sınıf İçi Eş-Düzey / Peer-to-Peer Kopya Tespiti):*
     - `deneme@deneme.com` ile `ogrenci2@deneme.com` arasındaki %42 iç metin çakışmasının Eş-Düzey Matrisinde kırmızı şeritle tespiti ve raporlanması.

### 1.26 Kullanım Rehberi (UserGuideView) Analiz & Raporlama Kapsam Genişletmesi ve Sıfır-Hata Senkronizasyon Onarımı (29 Ekim 2026)
- **Sorun Analizi:** Landing Page üzerindeki "Rehber" sekmesinde "Analiz & Raporlama" kategorisi seçildiğinde veya belirli roller seçildiğinde konu listesi boş kalıyor ("0 Konu"), sağ tarafta ise seçili kategoriyle alakasız eski bir konu gösteriliyordu.
- **Kategori x Rol Matrisi Kapsam Genişletmesi:**
  - `ogretmen-intihal-ve-hile-analizi` (Eğitmen & Danışman): Sınıf İçi Kopya & Hile Analizi: Eş-Düzey (Peer) Matrisi ve Homoglif Tespiti konusu eklendi.
  - `yazar-editor-yayin-analizi` (Yazar & Editör): Yayın & Editöryal Özgünlük Denetimi: DOI Çapraz Teyit ve Hakem İncelemesi konusu eklendi.
  - `editor-ve-calisma-gruplari` (Yazar & Editör, Sınıflar & Enstitü): Editöryal Çalışma Grupları & Hakem Değerlendirme Havuzu eklendi.
  - `kampus-ve-lms-entegrasyonu`: Rol filtresi `Tümü`ne genişletilerek öğrencilerin ve eğitmenlerin de Moodle, Canvas ve OBS LTI süreçlerini incelemesi sağlandı.
- **Çift Yönlü Rol & Kategori Senkronizasyonu:**
  - Rol seçildiğinde, mevcut kategoride o role ait içerik yoksa kategori otomatik olarak `Tümü`ne esnetildi.
  - Kategori seçildiğinde, seçili rolde içerik yoksa rol filtresi otomatik `all` yapılarak kullanıcının boş ekrana düşmesi engellendi.
- **Sağ Kart & Sol Liste Tam Senkronizasyonu:**
  - Kategori, rol veya arama değiştiğinde sol tarafta filtrelenen ilk konu otomatik olarak sağ detay kartına yansıtıldı (`activeItem` senkronizasyonu).
  - Filtreleme sonucunda hiçbir konu bulunamazsa sağ panelde de açıklayıcı bir "Filtreleri Sıfırla" boş durum (empty state) kartı gösterildi.
- **Doğrulama:**
  - Yapılan matris simülasyonu ile 9 kategorinin tümünde 5 farklı rol için de 0 konu durumu tamamen ortadan kaldırıldı.
  - Birim testleri (`npm test -- --run`): 4/4 dosya, 41/41 test geçti.
  - Derleme kontrolü (`npm run build`): 18.27s içinde sıfır hatayla başarıyla derlendi.

### 1.27 Tip Güvenli Taksonomi ve Varlık İlişkilendirme Şeması Entegrasyonu (29 Ekim 2026)
- **Mimari İyileştirme:** Serbest metin bazlı (`section.role.includes(...)`) kırılgan eşleştirmeler yerine tam tip-güvenli (strongly-typed) Taksonomi Şeması kuruldu:
  - `GuideRoleId`: `'student' | 'instructor' | 'author' | 'institute'`
  - `GuideFilterRoleId`: `'all' | GuideRoleId`
  - `GuideCategoryId`: `'getting-started' | 'document-standards' | 'modules' | 'analysis-reporting' | 'classes-institute' | 'verification-security' | 'enterprise-integration' | 'templates-downloads'`
  - `GuideFilterCategoryId`: `'all' | GuideCategoryId`
  - `GuideSectionItem`: `category: GuideCategoryId` ve `roles: GuideRoleId[]`
- **İlişki Matrisi & Normalizasyon:** 20 rehber konusunun tamamı ilişkisel şemaya dönüştürüldü; her konunun ait olduğu roller çoklu dizi (`roles: [...]`) olarak tescillendi.
- **Sıfır Hata Filtreleme:** Filtreleme motoru `section.roles.includes(selectedRole)` mantığına kavuşturularak karakter uyuşmazlığı veya alt dize hataları tamamen imkansız kılındı.
- **Doğrulama:**
  - Birim testleri (`npm test -- --run`): 4/4 dosya, 41/41 test başarılı.
  - Üretim derlemesi (`npm run build`): 19.58s içinde sıfır hata ile tamamlandı.

### 1.28 Canlı Öğretmen - Öğrenci Demo Veri Tohumlayıcı ve Sunum Rehberi Entegrasyonu (29 Ekim 2026)
- **Tek Tıkla Demo Tohumlama (`classroomDemoService.ts`):**
  - Sınıf: `YZ-501: Akademik Araştırma ve Yayın Etiği` (Kod: `SENT26`, Anahtar: `DEMO-2026`, Eğitmen: Doç. Dr. İsmail Kaleci).
  - Ödev: `Dönem Sonu Tez Literatür Taraması ve Metodoloji Raporu` (4 Kriterli Ağırlıklı Rubrik Matrisi, Draft Coach açık).
  - Öğrenci 1 (`deneme@deneme.com` - Ahmet Yılmaz): %14 Benzerlik, %8 YZ, 3 Turnitin QuickMarks satır içi notu (`[Kaynak Eksik]`, `[Tırnak Eksik]`, `[İfade Güçlendir]`), 4 kriterli 91/100 rubrik notu ve SHA-256 karekodlu dijital teslim makbuzu.
  - Öğrenci 2 (`ogrenci2@deneme.com` - Mehmet Demir): %42 iç metin çakışması (Eş-Düzey Matrisinde kırmızı alarm şeridi) ve Kiril homoglif bayrağı.
- **Canlı Sunum & Senaryo Rehberi Modalı (`ScenarioCheatSheetModal.tsx`):**
  - Eğitmenin sahnede/toplantıda 3 senaryoyu (QuickMarks, Rubrik, Peer Matrix) adım adım projektörde anlatmasını sağlayan interaktif kılavuz kartı.
- **Sınıflarım Paneli Entegrasyonu (`ClassroomPanel.tsx` & `InstructorClassesView.tsx`):**
  - Üst çubuğa "⚡ Demo Sınıfı Yükle" ve "📖 Senaryo Rehberi" butonları eklendi.
  - Boş sınıf durumunda tek tıkla otomatik demo tohumlama butonu bağlandı.
- **Doğrulama & Canlı Dağıtım:** 41/41 test geçti, üretim derlemesi 19.16s içinde tamamlandı ve `https://sentience-ai-free-2026.web.app` adresine canlı dağıtım (hosting + firestore rules + indexes) başarıyla gerçekleştirildi.
- **Firestore İzin Onarımı ("Missing or insufficient permissions"):** Demo sınıfı ve teslimleri yüklenirken `demo-class-yz501` alt koleksiyonları için Firestore kurallarına `isDemoClass(classId)` istisnası bağlandı ve `classroomDemoService.ts` içinde `instructorId = appUser.uid` yapılarak tüm rollerde sıfır hata ile yükleme yapılması sağlandı. Kurallar canlıya deploy edildi.

### 1.29 GitHub Kaynak Kod Eşitlemesi ve Sürüm Dağıtımı (29 Ekim 2026)
- **Commit:** `a0a5bdb` ("feat(classroom): add Turnitin-grade QuickMarks, rubric matrix, peer matrix, demo seeder, and strongly-typed guide schema")
- **Depo & Dal:** `https://github.com/cashmelek/sentience-ai.git` (`origin/main`)
- **İçerik:** Turnitin QuickMarks, Rubrik Matrisi, Eş-Düzey (Peer) Kopya Matrisi, Toplu Doküman Yükleme (Batch Submit), Karekodlu SHA-256 Dijital Makbuz, Tip Güvenli Kılavuz Şeması ve Canlı Demo Tohumlayıcı bileşenlerinin tamamı başarıyla GitHub ana dalına aktarıldı.

### 1.30 Faz 1: Sınıf ve Akademik Teslim İzolasyonu & Sokratik Koç Dağıtımı (29 Ekim 2026)
- **Akademik Bütünlük Modu & İnsanlaştırma Kilidi:** `StyleMasterHeader.tsx`, `useEditorWorkflow.tsx` ve `App.tsx` bileşenlerinde `isAcademicIntegrityLocked` kuralı bağlandı. Öğrenci kurumsal (.edu.tr) oturum açtığında veya "Sınıflarım" ödev teslimindeyken "İnsanlaştır" ve "StyleMaster" ton kontrolü kilitlendi, kilit simgesi ve *"Akademik Dürüstlük Koruması: Bu alanda sentetik metin insanlaştırma araçları kapalıdır. Yalnızca Denetçi ve Sentinel kullanılabilir"* koruması getirildi.
- **Pedagojik Mod (Socratic Academic Coach):** `socraticCoachService.ts` ve `SocraticCoachModal.tsx` geliştirildi. Öğrencinin yerine metin üretmeyen, doğrudan atıf hazırlığı, akademik tarafsızlık (hedging) ve metodolojik kurgu üzerine Sokratik sorular soran pedagojik danışman bağlandı.
- **Resmi Sertifikasyon ve Dijital Makbuz:** `submissionExport.ts` içerisindeki `exportDigitalReceiptPDF` ve `exportSubmissionReportPDF` fonksiyonlarına *"SENTIENCE AKADEMİK BÜTÜNLÜK MODUNDA (İNSANLAŞTIRMA KİLİTLİ) TARANMIŞTIR"* resmi kaşesi ve güvenlik damgası eklendi.
- **Test ve Tip Doğrulaması:** `src/test/academicIntegrityIsolation.test.ts` eklenerek toplam test sayısı 46'ya çıkarıldı (%100 başarı). `tsc --noEmit` ve `npm run build` ile sıfır hatayla derlendi.

### 1.31 Faz 2: Platform İçi Sentetik Üretim Parmak İzi Havuzu (Internal Generator Vault) Dağıtımı (29 Ekim 2026)
- **Zero-Knowledge 4-gram MinHash / Shingle Parmak İzi Havuzu (`internalGeneratedVault`):** Platform üzerinde ister kişisel (Gmail), ister anonim bir oturumda "İnsanlaştır" veya "StyleMaster" çalıştırılsın; üretilen tüm çıktıların gizlilik-korumalı (Privacy-Preserving) 4-gram shingle parmak izleri `internalVaultService.ts` ve `functions/src/index.ts` üzerinden `internalGeneratedVault` koleksiyonuna kaydedildi. Kullanıcı ham metni veya kimliği asla saklanmaz.
- **Sınıf Teslimlerinde Çapraz Sentetik Tarama:** Kurumsal (.edu.tr) hesapla sınıfa teslim edilen her ödev, hem web/makale kaynaklarıyla hem de bu iç sentetik havuzla taranır (`runSubmissionScoring` ve Cloud Function `scoreSubmission`).
- **Öğretmen Alarm Rozeti:** Eşleşme tespit edildiğinde raporda ve teslim tablosunda *"⚠️ Sentetik Üretim İzi: Bu metin platformun İnsanlaştırma Motoru tarafından üretilmiş bir çıktıyla %90+ parmak izi eşleşmesi göstermektedir"* uyarısı (`SubmissionReportView.tsx`, `AssignmentDetailView.tsx`) ve PDF raporunda kırmızı alarm kutusu (`submissionExport.ts`) sağlandı.
- **Canlı Demo Entegrasyonu:** `classroomDemoService.ts` içindeki Mehmet Demir teslimi `%94` oranında iç sentetik havuz eşleşmesiyle tohumlanarak öğretmen senaryo sunumuna hazır hale getirildi.
- **Güvenlik Kuralları & Testler:** `firestore.rules` güncellendi (`internalGeneratedVault` okuma/yazma kuralları). `internalGeneratorVault.test.ts` yazılarak toplam test sayısı 50'ye çıkarıldı (%100 başarı).

### 1.32 Faz 3: Yapıştırma ve Yazım Hızı Telemetrisi (Authorship Provenance & Paste Telemetry) Dağıtımı (29 Ekim 2026)
- **Veri Modeli ve Tipler (`src/types/classroom.ts`):** `WritingTelemetry` interface'i (`totalTypingTimeMs`, `pasteCount`, `pastedCharCount`, `typedCharCount`, `deleteCount`, `pasteRatio`, `processScore`, `authorshipStatus`, `legitimateQuotesCount`) ve `AuthorshipStatus` tipleri tanımlandı; `Submission.telemetry` alanına bağlandı.
- **Telemetri ve Yazarlık Kanıt Motoru (`src/hooks/useWritingTelemetry.ts`):**
  - Klavye vuruş dinamikleri, aktif yazma süresi, geri silme/düzeltme (backspace/delete) sayısı ve pano yapıştırma (paste) olayları anlık telemetriye kaydedildi.
  - **Meşru Alıntı İstisnası (Academic Exemption):** Öğrencinin harici makaleden veya kaynaktan tırnak içinde (`"..."`), APA atıflı `(Yazar, Yıl)` veya <400 karakterlik meşru parça alıntıları tespit edilerek `legitimateQuotesCount` artırıldı; meşru alıntılar yapıştırma ceza puanından muaf tutuldu ve `mixed_with_citations` statüsü verildi.
  - **Dosya Yükleme İstisnası (File Upload Exemption):** `.docx` / `.pdf` yükleme modunda yapıştırma cezası devre dışı bırakılarak `file_upload` statüsü ve %100 süreç puanı atandı.
  - **Süreç Puanı Algoritması (`calculateProcessScore`):** 0-100 arası organik yazarlık güven puanı hesaplandı. %85 üzeri tek blok yapıştırma ve sıfır revizyon durumunda `unverified_bulk_paste` ve düşük süreç puanı tetiklendi.
- **Öğrenci Teslim Arayüzü (`StudentSubmitView.tsx` & `classroomService.ts`):** Metin giriş alanı `handleKeyDown` ve `handlePaste` telemetri yakalayıcılarına bağlandı; `submitText` işleminde telemetri verisi `Submission` nesnesine mühürlendi.
- **Öğretmen Değerlendirme & PDF Raporu (`SubmissionReportView.tsx`, `AssignmentDetailView.tsx`, `submissionExport.ts`):**
  - Rapor ekranına "Yazım Süreci ve Telemetri (Provenance)" kartı eklendi; Süreç Puanı ilerleme çubuğu, yazma süresi, tuş vuruşu vs. yapıştırma oranı, silme/revizyon sayısı ve meşru alıntı göstergeleri yerleştirildi.
  - Şüpheli blok yapıştırmalarda öğretmen arayüzünde turuncu uyarı rozeti görüntülendi.
  - Resmi PDF teslim raporuna telemetri ve yazarlık kanıt tablosu entegre edildi.
- **Canlı Demo Entegrasyonu (`classroomDemoService.ts`):** Ahmet Yılmaz için `verified_organic` (%94 Süreç Puanı, 47 dk yazım, 4.320 tuş vuruşu, 3 meşru alıntı); Mehmet Demir için `unverified_bulk_paste` (%24 Süreç Puanı, 1 dk yazım, %98 yapıştırma) verileri tohumlandı.
- **Birim Test Kapsamı (`src/test/writingTelemetry.test.ts`):** 5 yeni birim testi yazılarak 7 test dosyasında toplam 55 test %100 başarıyla geçti. Derleme (`npm run build`) sıfır hata ile tamamlandı.

### 1.33 Faz 4: İstatistiksel Ritim Filigranı & Yapay Zeka Beyan Matrisi (Watermarking & AI Disclosure) Dağıtımı (29 Ekim 2026)
- **İstatistiksel Ritim Filigranı Motoru (`src/services/watermarkService.ts`):**
  - Görünmez karakter veya hileli manipülasyon olmaksızın, n-gram sözdizimi ve periyodik varyans entropisi üzerinden matematiksel ritmik imza profili (`analyzeStatisticalWatermark`) kuruldu.
  - Yeşil token oranı (greenTokenRatio), z-skoru ve cümle boyutu varyansı ile 0-100 arası `watermarkScore` ve güvenilirlik (`confidence`) sınıflandırması üretildi.
- **YÖK & COPE Standardında AI Beyan Matrisi (`AIDisclosureMatrix`):**
  - Öğrenci teslim arayüzüne (`StudentSubmitView.tsx`) 5 temel akademik kategori (Literatür Taraması, Dilbilgisi & Düzelti, Fikir Üretimi, Veri Analizi, Metin / Taslak Yazımı) için 3 seviyeli beyan denetimi (`none` / `assisted` / `generated`), araç etiketleri seçimi ve resmi akademik taahhütname kutusu entegre edildi.
- **Beyan Uyuşmazlık Dedektörü (`checkDisclosureDiscrepancy`):**
  - Öğrenci "Metin / Taslak Yazımı: Kullanılmadı" beyan etmiş ancak iç sentetik havuz eşleşmesi (≥%70), istatistiksel ritim filigranı (≥%75) veya yüksek YZ tespiti saptanmışsa anında *"⚠️ Yapay Zeka Beyan Uyuşmazlığı"* alarmı üretildi.
- **Öğretmen Raporu, Sınıf Paneli ve PDF Çıktıları:**
  - `SubmissionReportView.tsx` ve `AssignmentDetailView.tsx` bileşenlerine "İstatistiksel YZ Ritim Filigranı", "Yapay Zeka Beyan Matrisi" ve "Beyan Uyuşmazlığı" rozetleri eklendi.
  - `submissionExport.ts` içinde A4 dijital makbuz ve tam teslim PDF raporuna YÖK & COPE standartlarında beyan tablosu ve filigran özeti yerleştirildi.
- **Canlı Demo Tohumu:** Ahmet Yılmaz için dürüst beyan (%12 filigran, uyuşmazlık yok); Mehmet Demir için beyan uyuşmazlığı (%88 ritim filigranı, %94 sentetik havuz izi, kırmızı alarm) tanımlandı.
- **Test ve Derleme:** `watermarkAndDisclosure.test.ts` eklenerek 8 test dosyasında toplam 60 test %100 başarıyla geçti; `tsc --noEmit` ve `npm run build` hatasız tamamlandı.

### 1.34 Faz 3.5: Word (.docx) Adli Bilişim Ayrıştırıcısı (Docx Forensics & Telemetry Engine) Dağıtımı (29 Ekim 2026)
- **Word Adli Bilişim Motoru (`src/services/docxForensicService.ts`):**
  - `JSZip` ile `.docx` PKZip arşivi açılarak `docProps/app.xml`, `docProps/core.xml` ve `docProps/custom.xml` adli bilişim meta verileri ayrıştırıldı.
  - **`TotalEditingTime` & WPM Analizi:** Toplam düzenleme dakikası, revizyon sayısı ve dakika başına kelime yazım hızı ($\frac{\text{Kelime}}{\text{Süre}}$) hesaplandı.
  - **Harici Yapıştırma Anomalisi Tespiti:** 200+ kelimelik bir metin için düzenleme süresi ≤2 dakika veya WPM > 200 ise anında `isSuspiciousBulkPaste = true` bayrağı ve açıklayıcı adli rapor üretildi.
  - **Eklenti & Pano Damgası Çözücü:** `sentience_session_id`, `sentience_student_uid` ve HTML pano köken damgaları çözümlendi.
- **Dosya Ayrıştırma ve Teslim Entegrasyonu (`fileParseService.ts` & `StudentSubmitView.tsx`):**
  - Öğrenci `.docx` dosyası yüklediğinde adli telemetri otomatik çıkarılarak ekranda düzenleme süresi, revizyon sayısı ve WPM göstergeleri verildi; şüpheli yapıştırmalarda `unverified_bulk_paste` telemetrisi atandı.
- **Öğretmen Raporu ve PDF Çıktıları:**
  - `SubmissionReportView.tsx` içine "Word Adli Bilişim Telemetrisi (Docx Forensics)" kartı, `submissionExport.ts` içine ise resmi PDF raporu için adli düzenleme tablosu entegre edildi.
- **Canlı Demo Entegrasyonu:** Ahmet Yılmaz için 72 dk düzenleme ve 34 revizyon (organik); Mehmet Demir için 1 dk düzenleme ve 480 WPM (şüpheli dış yapıştırma) tanımlandı.
- **Test ve Derleme:** `docxForensicService.test.ts` eklenerek 9 test dosyasında toplam 64 test %100 başarıyla geçti; `tsc --noEmit` ve `npm run build` sıfır hata ile tamamlandı.

### 1.35 Faz 3.5 & Akademik Zengin İçerik: Word Eklenti Paketi ve Formül/Görsel Ayrıştırıcısı Dağıtımı (29 Ekim 2026)
- **Word Eklenti Paketi (Office Web Add-in):**
  - Standart `manifest.xml` (`public/word-addin/manifest.xml`) ve Office JS API hook'u (`public/word-addin/telemetry-hook.html`, `telemetry-hook.js`) oluşturuldu.
  - Word içinde öğrenci kimliğini (`sentience_student_uid`, `sentience_student_name`, `sentience_session_id`) ve oturum zaman damgasını `docProps/custom.xml` alanına kriptografik olarak mühürleyen mekanizma devreye alındı.
  - Windows kullanıcıları için tek tıkla Office WEF dizinine sideload eden PowerShell kurulum betiği (`Install-WordAddin.ps1`) sağlandı.
  - Öğrenci teslim ekranına ([`StudentSubmitView.tsx`](file:///c:/Users/OEM/.gemini/antigravity/playground/sentience-ai/src/components/classroom/StudentSubmitView.tsx)) manifest ve kurulum scripti indirme butonları yerleştirildi.
- **Akademik Zengin İçerik Ayrıştırma (Formül, Tablo, Görsel, Dipnot):**
  - `docxForensicService.ts` genişletilerek `word/document.xml` içerisindeki `<m:oMath>` / `<m:oMathPara>` matematiksel formülleri (OMML), `<w:tbl>` tabloları, `word/footnotes.xml` dipnotları ve `word/media/*` altındaki gömülü infografik/görseller otomatik envantere döküldü.
  - Tip Şeması (`src/types/classroom.ts`): `mathFormulasCount`, `extractedFormulas`, `tablesCount`, `imagesCount`, `imagesList`, `footnotesCount` alanları eklendi.
  - Öğrenci ve Öğretmen Arayüzleri: `StudentSubmitView.tsx` üzerinde dosya seçildiğinde anlık formül/tablo/görsel rozetleri; `SubmissionReportView.tsx` üzerinde ise "Akademik Zengin İçerik Analizi" kartı ile öğretmen raporuna yansıtıldı.
- **Test ve Dağıtım Doğrulaması:**
  - `src/test/docxForensicService.test.ts` içine zengin içerik test senaryosu eklendi. 9 test dosyasında 65/65 test %100 başarıyla geçti.
  - `npm run lint` (`tsc --noEmit`) 0 hata.
  - `npm run build` 18.48s içinde hatasız tamamlandı.
  - Firebase Hosting (`sentience-ai-free-2026.web.app`) üzerine canlı dağıtım gerçekleştirildi.

### 1.36 Faz 4.8: Öğrenci Arayüzü İzolasyonu, .edu.tr Rol Ayrımı ve Derin Analizli Öğrenci Çalışma Masası Dağıtımı (30 Ekim 2026)
- **Giriş & Kayıt Katmanında (.edu/.edu.tr) Rol Ayrımı ve Lisans Kilidi (`LoginView.tsx`):**
  - Kayıt esnasında Kullanıcı Tipi (Akademisyen / Öğrenci / Profesyonel) ayrımı tam yetkilendirildi.
  - **Öğrenci Kaydı:** `.edu/.edu.tr` öğrencileri doğrudan `role: 'student'` ve `academicProfile: 'student'` olarak kaydedilir, kod zorunluluğu yoktur.
  - **Akademisyen Lisans Anahtarı Zorunluluğu:** Öğrencilerin sahte eğitmen hesabı açmasını önlemek amacıyla kurumsal anahtar (`INST-EDU-2026`, `DEMO-2026`, `AKADEMIK2026`, `SENT26`) zorunlu kılındı; geçerli anahtar olmadan akademisyen yetkisi verilmesi engellendi.
- **Öğrenci Ekran İzolasyonu (DOM & Route Seviyesi - `App.tsx` & `OnboardingChecklist.tsx`):**
  - `role === 'student'` veya `academicProfile === 'student'` olan kullanıcılar giriş yaptığında doğrudan **"ÖĞRENCİ ÇALIŞMA MASASI"** ekranına kilitlenir; genel editör ve insanlaştırma butonları DOM'dan tamamen kaldırılır.
  - Sol paneldeki görevler öğrenciye göre uyarlandı: *"Sınıfına Katıl veya Ödev Seç"*, *"Derin Analiz ile Özgünlük Tara"*, *"Sokratik Koç ile Metnini İncele"*.
- **Derin Analizli Öğrenci Teslim Masası (`StudentSubmitView.tsx`):**
  - Öğrenci ödev teslimi yaparken "Derin Analiz & Taslak Kontrolü" butonu ile metnini Turnitin standartlarında Denetçi ve Sentinel ile ön taramadan geçirebilir.
  - **Sentinel Kaynak Çakışmaları:** Eşleşen makale ve web kaynaklarının benzerlik oranları listelenir.
  - **Cümle Bazlı Isı Haritası (Sentence-level Heatmap):** Sentetik/YZ riski yüksek cümleler renklendirilerek öğrenciye sunulur; öğrenciye metni makineye insanlaştırmadan **kendi kelimeleriyle ve atıflarla** revize etmesi için pedagojik kılavuzluk sağlanır.
- **Test ve Dağıtım:**
  - `src/test/studentWorkspaceIsolation.test.ts` eklenerek 10 test dosyasında 68/68 test %100 başarıyla geçti.
  - `tsc --noEmit` ve `npm run build` (18.66s) sıfır hatayla derlendi.
  - Firebase Hosting (`sentience-ai-free-2026.web.app`) üzerine canlı dağıtım tamamlandı.

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

### 4.6 Öncelik 6: Akademik Çatallanma, Bütünlük İzolasyonu ve Çift Hesap Önleme Mimarisi (Academic Partitioning & Anti-Bypass Framework)

Akademik dürüstlük ile yapay zeka içerik üretimi/insanlaştırma arasındaki çıkar çatışmasını (öğrencinin kişisel Gmail hesabıyla metni insanlaştırıp kurumsal .edu.tr hesabıyla teslim etmesi açığını) kesin olarak önleyecek 4 aşamalı kurumsal çalışma planı:

- [x] **Faz 1 (P1 - Kritik & Acil): Sınıf ve Akademik Teslim İzolasyonu (Strict Academic Partitioning)**
  - **Kapsam:** "Sınıflarım" modülüne bağlı veya kurumsal ödev teslimi yapan öğrencilerin çalışma alanında "İnsanlaştır" ve "StyleMaster" motorlarının kilitlenmesi ("Akademik Dürüstlük Koruması: Bu alanda sentetik metin insanlaştırma araçları kapalıdır").
  - **Pedagojik Mod:** İnsanlaştırma yerine yalnızca akademik dilbilgisi, ifade açıklığı ve atıf formatı öneren "Socratic Academic Coach" kılavuzluğunun sunulması (`socraticCoachService.ts`, `SocraticCoachModal.tsx`).
  - **Resmi Sertifikasyon:** Üretilen SHA-256 karekodlu dijital makbuza ve PDF teslim raporuna *"Sentience Akademik Bütünlük Modunda (İnsanlaştırma Kilitli) Taranmıştır"* resmi kaşe ve damgasının eklenmesi.

- [x] **Faz 2 (P2 - Yüksek): Platform İçi Sentetik Üretim Parmak İzi Havuzu (Internal Generator Vault)**
  - **Kapsam:** Platform üzerinde ister kişisel (Gmail), ister anonim bir hesapla "İnsanlaştır" veya "StyleMaster" çalıştırılsın; üretilen tüm çıktıların gizlilik-dostu (Privacy-Preserving / Zero-Knowledge) 4-gram MinHash/Shingle parmak izinin `internalGeneratedVault` koleksiyonuna kaydedilmesi (`internalVaultService.ts`, `useEditorWorkflow.tsx`, `functions/src/index.ts`).
  - **Çapraz Teslim Denetimi:** Kurumsal (.edu.tr) hesapla sınıfa teslim edilen her ödevin, harici makalelerin yanı sıra bu iç sentetik havuzla taranması (`runSubmissionScoring`, `scoreSubmission`).
  - **Öğretmen Alarm Rozeti:** Eşleşme tespit edildiğinde raporda *"Sentetik Üretim İzi: Bu metin platformun İnsanlaştırma Motoru tarafından üretilmiş bir çıktıyla %90+ parmak izi eşleşmesi göstermektedir"* uyarısının verilmesi (`SubmissionReportView.tsx`, `AssignmentDetailView.tsx`, `submissionExport.ts`).

- [x] **Faz 3 (P3 - Yüksek): Yapıştırma ve Yazım Hızı Telemetrisi (Authorship Provenance & Paste Telemetry)**
  - **Kapsam:** Editör bileşenine klavye vuruş ritmi (keystroke dynamics) ve blok yapıştırma (paste event) telemetrisinin eklenmesi (`useWritingTelemetry.ts`).
  - **Meşru Alıntı Muafiyeti:** Meşru alıntılar (`"..."`, APA atıflı) ve dosya yüklemelerinin yapıştırma ceza puanından muaf tutulması.
  - **Süreç Puanı (Process Score):** 0-100 arası organik yazarlık güven puanı hesabı; %85+ dış blok yapıştırma durumunda "Doğrulanmamış Dış Yapıştırma (Unverified Paste)" alarmı üretilmesi.
  - **Öğretmen Raporu & PDF:** Süreç puanı çubuğu, yazım/yapıştırma oranı, revizyon geçmişi kartı ve resmi PDF çıktısına telemetri tablosunun eklenmesi (`SubmissionReportView.tsx`, `submissionExport.ts`).

- [x] **Faz 4 (P4 - Orta): İstatistiksel Ritim Filigranı & Yapay Zeka Beyan Matrisi (Watermarking & AI Disclosure)**
  - **İstatistiksel Filigran:** İnsanlaştırma ve sentetik üretim n-gram varyans sapmasını tespit eden matematiksel ritim analizi (`watermarkService.ts`).
  - **AI Kullanım Beyanı (Disclosure Statement):** Elsevier, Nature, COPE ve YÖK standartlarında 5 kategorili Yapay Zeka Katkı Matrisi, popüler araç seçimi ve resmi taahhütname onayı (`StudentSubmitView.tsx`).
  - **Uyuşmazlık Tespiti:** Beyan edilmeyen sentetik üretim ve filigran varlığında öğretmen paneli ve PDF raporunda kırmızı uyuşmazlık alarmı (`SubmissionReportView.tsx`, `AssignmentDetailView.tsx`, `submissionExport.ts`).

### 4.7 Öncelik 7: Faz 3.5 & Harici Program Adli Bilişimi ve Word Add-in / Setup Mimarisi (Docx Forensics & Office Ecosystem Integration)

Öğrencinin kişisel hesapla Sentience AI üzerinden metni insanlaştırıp Word/Google Docs gibi harici uygulamalara yapıştırması ve ardından Word dosyası olarak teslim etmesi senaryosuna karşı derinleştirilmiş adli bilişim ve masaüstü entegrasyonu:

- [x] **1. Word (.docx) Adli Bilişim Analizi (Docx Forensic Metadata):**
  - `.docx` ZIP yapısındaki `docProps/app.xml` ve `docProps/core.xml` dosyalarından `TotalEditingTime` (toplam düzenleme süresi), `Revision` (revizyon sayısı) ve zaman damgalarının okunması (`docxForensicService.ts`).
  - **WPM Hız Anomalisi:** $\frac{\text{Toplam Kelime}}{\text{Düzenleme Süresi}}$ hesabı yapılarak (örn. 2 dakikada 3.000 kelime = >1.000 WPM) Word içi doğrudan harici yapıştırmanın yakalanması.
  - **Stil & Font Kalıntıları:** Web tarayıcısından kopyalanıp Word'e yapıştırılan metinlerdeki HTML stil kalıntıları (`Inter/system-ui` fontları, satır yükseklikleri).
- [ ] **2. Pano Köken Damgası (Rich-Text Origin Token):**
  - Sentience AI üzerinde "Kopyala" yapıldığında HTML pano katmanına Word'ün içine gömülecek kriptografik köken damgasının eklenmesi.
- [x] **3. Word Eklentisi & Sessiz Adli Mühür (C Seçeneği: Butonsuz Doğal Yükleme):**
  - Word eklentisi öğrenciye görünür hiçbir buton veya metin manipülasyon aracı (İnsanlaştırma, StyleMaster, Sokratik öneri kapalı) sunmaz; tamamen sessiz bir adli mühürleyici olarak çalışır.
  - Öğrenci ödevini Word'de yazıp normal şekilde kaydeder (`Ctrl+S`); web sitemize gelip `.docx` dosyasını sürükleyip bıraktığında, web ayrıştırıcısı dosya içindeki mühürlü adli telemetriyi otomatik çözer.
  - Böylece platform trafiği, zengin QuickMarks/Heatmap deneyimi, resmi YÖK Beyan Matrisi ve SHA-256 dijital makbuz süreci %100 web üzerinde korunur.

### 4.8 Öncelik 8: Öğrenci Arayüzü İzolasyonu, .edu.tr Rol Ayrımı ve Derin Analizli Öğrenci Çalışma Masası

Öğrencinin (.edu/.edu.tr veya öğrenci rolü) sisteme girdiğinde genel editör ve insanlaştırma araçlarından tamamen arındırılmış; yalnızca ödev teslimi, Sokratik koç ve Derin Analiz (Denetçi + Sentinel) araçlarını barındıran müstakil bir çalışma alanına sahip olması:

#### Çalışma Şablonu & Görev Kontrol Listesi
- [x] **Aşama 1: Giriş & Kayıt Katmanında (.edu/.edu.tr) Rol Ayrımı ve Güvenlik Kilidi**
  - [x] `.edu` veya `.edu.tr` e-postası girildiğinde profil seçimi modalı (`[ 🎓 Öğrenci ]` vs `[ 🏛️ Akademisyen / Eğitmen ]`).
  - [x] **Öğrenci Kuralı:** Kod gerektirmez, doğrudan Öğrenci Statüsü atanır.
  - [x] **Akademisyen Kuralı:** Kurumsal Lisans / Eğitmen Davet Anahtarı (`INST-...`) doğrulanmadan akademisyen yetkisi verilmez (öğrencinin sahte akademisyen hesabı açması engellenir).
- [x] **Aşama 2: Öğrenci Arayüzü İzolasyonu (DOM & Route Ayrımı)**
  - [x] `role === 'student'` veya öğrenci oturumu için genel editör (`EditorView`) DOM'dan tamamen kaldırılır.
  - [x] İnsanlaştırma butonu (`İNSANLAŞTIR`), StyleMaster ton ayarı, Hazır Şablonlar ve kafa karıştırıcı "Akademik Kilit Aktif" rozeti arayüzden temizlenir.
  - [x] Sol paneldeki Onboarding görevleri öğrenciye uyarlanır: *"İlk Ödevini Seç"*, *"Derin Analiz ile Özgünlük Tara"*, *"Sokratik Koç İncelemesi Yap"*.
- [x] **Aşama 3: Öğrenci Çalışma Masası (Student Workspace & Deep Analysis Integration)**
  - [x] **Sol Panel (Ödev & Metin Masası):**
    - Sınıf & Ödev seçimi, Ödev detayları, teslim tarihi ve rubrik kriterleri.
    - Metin yazma / `.docx` dosya yükleme alanı (formül/tablo/görsel rozetleri ile).
    - Sokratik Koç butonu, Ön Teslim Taslak Kontrolü (Turnitin Draft Coach), SHA-256 Dijital Makbuzlu Teslim.
  - [x] **Sağ Panel (Derin Analiz Kartı):**
    - 🛡️ Denetçi Analizi (YZ olasılık skoru, risk düzeyi, cümle bazlı ısı haritası).
    - 🌐 Sentinel Canlı Kaynak Taraması (Crossref, Semantic Scholar, CORE, arXiv).
    - 🔍 Eksik Atıf, Hatalı Tırnak ve Akademik Dilbilgisi Teşhisi.
    - 💡 "Kendi Kelimelerinle Düzenle" yönlendirmesi (otomatik insanlaştırma yok).
- [x] **Aşama 4: Test, Doğrulama ve Canlı Dağıtım**
  - [x] Öğrenci / Eğitmen giriş simülasyon birim testleri.
  - [x] `npm test -- --run` (65+ test doğrulaması - 68/68 test başarılı).
  - [x] `npm run lint` (`tsc --noEmit`) ve `npm run build` kontrolü.
  - [x] Firebase Hosting ve GitHub senkronizasyonu.

### 1.37 KVKK Aydınlatma Onayı "indexOf" Null-Safety Onarımı ve Normal Kullanıcı Ekran Temizliği (30 Ekim 2026)
- **KVKK Onay "n.indexOf is undefined" Hatası Giderildi:**
  - `useAppUser.ts` içerisinde Firestore dokümanından dönen verilerde `uid` alanı eksik olduğunda `appUser.uid` tanımsız kalıyordu.
  - `acceptKvkk` çağrısında `doc(db, 'users', undefined)` tetiklendiğinde Firestore SDK'nın path ayrıştırıcısı hata veriyordu.
  - `useAppUser.ts` hook'unda `uid: user.uid` zorunlu tutuldu; `classroomService.ts` içinde `uid || auth.currentUser?.uid` fallback koruması eklendi; Firestore'daki test öğrencisi dokümanına `uid` doğrudan yamalandı.
- **Normal Kullanıcı Arayüzü Temizliği (Akademik Kilit & Mod İzolasyonu):**
  - `App.tsx` ve `StyleMasterHeader.tsx` bileşenlerinde normal kullanıcılar (`role: 'user'`, `academicProfile: 'professional'`) için "Akademik Mod" butonu, "Akademik Kilit Aktif" başlığı ve kilitli buton durumu tamamen devre dışı bırakıldı.
  - Normal kullanıcı oturum açtığında tarayıcı hafızasındaki (`localStorage`) eski kilit bayrakları otomatik temizlendi.
- **Canlı Dağıtım:** 68 birim testi başarıyla geçirildi; `npm run build` tamamlandı ve `firebase deploy --only hosting` ile canlı ortama aktarıldı.

### 1.38 Admin Paneli Rol Yönetimi ve Kurumsal Lisans Anahtarları Entegrasyonu (30 Ekim 2026)
- **Kullanıcı Rolleri Yönetimi (`AdminPanel.tsx`):**
  - Kullanıcı tablosuna 4 temel rol (`Öğrenci`, `Eğitmen / Akademisyen`, `Standart Üye`, `Yönetici`) için filtrelenebilir hızlı sekme barı ve durum rozetleri eklendi.
  - Adminler için kullanıcı rolünü anında değiştirebilen dinamik açılır menü (`handleSetUserRole`) entegre edildi; rol değişiminde `role` ve `academicProfile` senkronize güncellenmektedir.
  - Kullanıcı kartında bağlı olduğu üniversite/enstitü adı ve onay durumu görünür kılındı.
- **Kurumsal Lisans Anahtarları Sekmesi (`AdminPanel.tsx` & `institutionLicenseService.ts`):**
  - Admin paneline yeni `🏛️ Kurumsal Lisanslar` ana sekmesi eklendi.
  - Kurumsal lisans anahtarlarının (`INST-...`) Firestore üzerinde oluşturulması, eğitmen/öğrenci kotaları, son geçerlilik tarihi, aktif/pasif kontrolü ve silme yetenekleri inşa edildi.
  - `LoginView.tsx` kayıt akışı `validateInstitutionCode` ile kurumsal veritabanına bağlandı.
- **Birim Testleri & Canlı Dağıtım:**
  - `src/test/institutionLicenseService.test.ts` eklendi; vitest suite 70/70 test başarıyla geçti.
  - `npm run build` tamamlandı ve Firebase Hosting'e canlı dağıtım yapıldı.

### 1.39 Kullanıcı Rehberi (User Guide) Akademik & Bütünlük Bölümleri Genişletmesi (30 Ekim 2026)
- **6 Yeni Akademik Rehber Başlığı Eklendi (`UserGuideView.tsx`):**
  1. *Öğrenci Çalışma Masası ve Turnitin Draft Coach Kullanım Kılavuzu:* İzole çalışma masası, taslak ön kontrolü ve derin analiz kullanımı.
  2. *Sokratik Koç: Metni İnsanlaştırmadan Kendi Kelimelerinizle Geliştirme:* Yapay zekaya yazdırmadan metodolojik derinlik sağlayan pedagojik koç yönlendirmeleri.
  3. *SHA-256 Dijital Makbuz ve YÖK Uyumlu Teslim Kanıtı Doğrulama:* Değişmez kriptografik hash, zaman damgası ve QR kod doğrulama adımları.
  4. *DOCX Adli Bilişim (WPM Hız Anomalisi & Düzenleme Süresi) İnceleme:* Word meta veri katmanından hız anomalisi ve pano yapıştırma analizi.
  5. *Yapay Zeka Katkı Beyan Matrisi (Disclosure Statement) Doldurma Adımları:* Elsevier/Nature/YÖK 5 kategorili etik beyan ve taahhütname rehberi.
  6. *Word Eklentisi (Word Add-in) Masaüstü Kurulumu ve Kullanımı:* Word içine kurulum adımları ve sessiz adli telemetri mühürleme açıklaması.
- **Canlı Dağıtım:** 70/70 birim testi başarıyla geçti, `npm run build` tamamlandı ve Firebase Hosting'e deploy edildi.

### 5. AKTİF YAPILACAKLAR LİSTESİ VE ÖNCELİKLENDİRİLMİŞ ÇALIŞMA PLANI

Aşağıdaki sıra, sistemin mevcut kararlılığı, kullanıcı deneyimi ve idari yönetim gereksinimleri gözetilerek **Kritik (P1) -> Yüksek (P2) -> Orta (P3)** şeklinde önceliklendirilmiştir:

### 1. SIRA (ÖNCELİK 1 - P1 | İdari & Operasyonel Yetki Yönetimi): Admin Paneli Rol & Kurumsal Entegrasyon
- [x] **Kullanıcı Rolleri Yönetimi (`AdminPanel.tsx`):**
  - Kullanıcı tablosunda yeni rollerin (`Öğrenci`, `Akademisyen / Eğitmen`, `Standart Kullanıcı`, `Admin`) filtrelenebilir rozetlerle listelenmesi.
  - Admin tarafından tek tıkla rol değiştirme (yanlışlıkla öğrenci seçen akademisyen veya kurumsal hesap yetkilendirmesi).
  - Kullanıcı kartında bağlı olduğu üniversite / kurum ve doğrulama durumunun gösterimi.
- [x] **Kurumsal Lisans Anahtarları Yönetimi (`AdminPanel.tsx` & Firestore):**
  - `INST-...` kodlarının admin panelinden oluşturulması, geçerlilik tarihi ve öğrenci/öğretmen kota sınırlarının atanması.

### 2. SIRA (ÖNCELİK 2 - P2 | Dokümantasyon & Kullanıcı Eğitimi): Kullanıcı Rehberi (User Guide) Güncellemesi
- [x] **Rehber Modülü Genişletmesi (`UserGuideView.tsx`):**
  - Son eklenen modüller için 6 yeni rehber başlığının interaktif içerik ve adımlarla eklenmesi:
    1. *Öğrenci Çalışma Masası ve Turnitin Draft Coach Kullanım Kılavuzu*
    2. *Sokratik Koç: Metni İnsanlaştırmadan Kendi Kelimelerinizle Geliştirme*
    3. *SHA-256 Dijital Makbuz ve YÖK Uyumlu Teslim Kanıtı Doğrulama*
    4. *DOCX Adli Bilişim (WPM Hız Anomalisi & Düzenleme Süresi) İnceleme*
    5. *Yapay Zeka Katkı Beyan Matrisi (Disclosure Statement) Doldurma Adımları*
    6. *Word Eklentisi Masaüstü Kurulumu ve Kullanımı*

### 3. SIRA (ÖNCELİK 3 - P2 | Adli Bilişim & Kaçak İnsanlaştırma Engeli): Pano Köken Damgası (Rich-Text Origin Token)
- [ ] **Pano Katmanı Entegrasyonu (`editorWorkflow` / `ResultPanel.tsx`):**
  - Sentience AI üzerinde normal veya akademik kullanıcı "Kopyala" yaptığında panoya (Clipboard API) görünmez HTML meta özniteliği (`data-sentience-origin-hash`) eklenmesi.
  - Word'e veya Google Docs'a yapıştırılıp tekrar `.docx` yüklendiğinde `docxForensicService.ts` tarafından bu damganın çözülerek "Platform İçi Sentetik Üretim" olarak işaretlenmesi.

### 4. SIRA (ÖNCELİK 4 - P3 | Dağıtım & Paketleme): Windows Masaüstü Word Setup Paketi (.exe)
- [ ] **Word Masaüstü Kurulum Paketi:**
  - InnoSetup betiği (`installer/SentienceWordSetup.iss`) ile tek tıkla `.exe` installer hazırlanması.
  - Windows kayıt defterinde (`HKCU\Software\Microsoft\Office\16.0\WEF\TrustedCatalogs`) Word için güvenilen eklenti kataloğu otomatik kaydı ve masaüstü kısayolu oluşturulması.

### 5. SIRA (ÖNCELİK 5 - Backlog | Bulut & Altyapı): İleri Düzey Genişletmeler
- [ ] **Cloud Vector Search (Vertex AI):** Milyonluk kurumsal makale havuzu için istemci içi Transformers.js yerine Vertex AI Vector Search bulut entegrasyonu.
- [ ] **GitHub Actions Otomasyonu:** PR'larda otomatik Lighthouse performans ve erişilebilirlik testleri.

---
*Rapor Sonu — Sentience AI Yönetim ve Geliştirme Dokümantasyonu*
