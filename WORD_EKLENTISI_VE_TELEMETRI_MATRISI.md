# Sentience AI — Word Eklentisi & Telemetri Karar Matrisi
>
> Bu belge, Word (.docx) eklentisinin platform kuralları dahilinde hangi işlevleri üstleneceğini ve nelerin engelleneceğini belirlemek için hazırlanmıştır.
> **Kullanım:** Durum sütunundaki kutuların içine onayladıklarınız için `[+]`, onaylamadıklarınız için `[-]` yazabilirsiniz.

---

## 1. Word İçinde Sessizce Çalışacak Telemetri ve Güvenlik Mekanizmaları

| No | Mekanizma | Açıklama | Durum |
| :--- | :--- | :--- | :---: |
| **1.1** | **Öğrenci & Belge Kimlik Bağı** | Belgeye gizli `CustomDocumentProperties` mühürlenerek öğrencinin üniversite (.edu.tr) ID'si ile Word belgesinin eşleştirilmesi. Başka bilgisayara gitse de oturum kaydının sürmesi. | [+] |
| **1.2** | **Düzenleme Süresi & WPM Analizi** | Word içindeki `TotalEditingTime` süresi ile kelime sayısı oranlanarak dakikada 100+ kelimelik insan-dışı yazım hızlarının (harici yapıştırmanın) adli tespiti. | [+] |
| **1.3** | **Blok Yapıştırma Sayacı** | Harici bir kaynaktan (ChatGPT, web, başka dosya) Word'e yapılan tek seferlik blok yapıştırmaların (`paste event`) ve yapıştırılan karakter sayısının loglanması. | [+] |
| **1.4** | **Pano (Clipboard) Köken Kontrolü** | Öğrencinin Sentience AI üzerindeki başka bir hesaptan (kişisel Gmail vb.) kopyalayıp Word'e yapıştırdığı metinlerin kriptografik köken damgasıyla saptanması. | [+] |
| **1.5** | **Revizyon Sayacı Takibi** | Word'ün yerel `RevisionNumber` sayacının okunması (organik yazımda 20-80, toplu yapıştırmada 1-2 revizyon tespiti). | [+] |
| **1.6** | **Stil & Font Sızıntı İncelemesi** | Web editörlerinden kopyalanıp Word'e yapıştırıldığında XML içine sızan yabancı web fontları (`Inter`, `system-ui`, `line-height`) kalıntılarının saptanması. | [+] |
| **1.7** | **Eklenti Durum Bütünlüğü** | Öğrencinin Word yazarken eklentiyi devre dışı bırakıp metni yapıştırdıktan sonra tekrar açması gibi atlatma girişimlerinin zaman damgalı tespiti. | [+] |

---

## 2. Word Eklentisine Dahil Edilecek Güvenlik Kilitleri ve İzolasyon Kuralları
>
> Bu bölümdeki maddeler Word eklentisine eklenecek güvenlik kısıtlamalarını ifade eder (`[+]` = Kuralı Onaylıyorum/Uygulansın, `[-]` = Kuralı Reddediyorum).

| No | Güvenlik Kuralı | Gerekçe | Durum |
| :--- | :--- | :--- | :---: |
| **2.1** | **İnsanlaştırma (Humanizer) Motorunun Kilitlenmesi** | Akademik dürüstlük kuralı: Word içinde sentetik metin üretimi ve AI izi silme tamamen kilitli olmalıdır. | [+] |
| **2.2** | **StyleMaster & Ton Ayarlamasının Kilitlenmesi** | Word içinde stil manipülasyonu ve ton değiştirme tamamen kilitlenir; hiçbir yapay zeka tonu kullanılamaz. | [+] |
| **2.3** | **Sokratik Koç & Metin Önerilerinin Kapatılması** | Talebiniz doğrultusunda: Word içinde hiçbir taslak/cümle önerisi sunulmayacak; eklenti yalnızca sessiz denetçi olarak çalışacaktır. | [+] |
| **2.4** | **Canlı YZ veya İntihal Skorunun Gizlenmesi** | Word içinde anlık skor gösterilmez; aksi takdirde öğrenci puanı düşürene kadar kelimeleri tek tek değiştirerek (tahmin/deneme-yanılma) sistemi yanıltabilir. | [+] |
| **2.5** | **Nihai Teslimin Web Zorunluluğu (Word İçi Teslimin Engellenmesi)** | Platform trafiğini ve web kullanımını korumak, resmi KVKK/Beyan ciddiyeti için nihai teslim Word'den yapılamaz. | [+] |

---

## 3. Word'den Sentience AI Web Platformuna Köprü & Teslim Akışı (C Seçeneği: Doğal Dosya Yükleme)

| No | Adım | Akış Detayı | Durum |
| :--- | :--- | :--- | :---: |
| **3.1** | **Arayüzsüz / Butonsuz Arka Plan İmzası** | Word arayüzünde öğrenciyi rahatsız edecek hiçbir buton veya fırlatma paneli yer almaz. Eklenti sessizce `CustomDocumentProperties` ve XML meta verilerine adli imzayı (`TotalEditingTime`, WPM, revizyon, kimlik) mühürler. | [+] |
| **3.2** | **Öğrencinin Dosyayı Kaydetmesi** | Öğrenci ödevini Word'de tamamlayıp normal biçimde kaydeder (`Ctrl+S` / `odev.docx`). | [+] |
| **3.3** | **Web Platformuna Standart Yükleme** | Öğrenci `sentience-ai.web.app` üzerindeki Sınıflarım modülüne girer, ödev teslim alanına `.docx` dosyasını sürükleyip bırakır. | [+] |
| **3.4** | **Adli Telemetrinin Otomatik Çözülmesi** | Web ayrıştırıcısı (`docxForensicService`) dosya yüklenir yüklenmez Word içindeki gizli adli telemetriyi çözer; yazım süresini, WPM hızını ve yapıştırma anomalilerini anında rapora işler. | [+] |
| **3.5** | **Resmi Beyan ve Makbuzun Web'de Tamamlanması** | Öğrenci web üzerinde Yapay Zeka Beyan Matrisini doldurur, taahhüdünü onaylar; nihai skorlama, Turnitin QuickMarks raporu ve SHA-256 Dijital Makbuzu web üzerinde üretilir. | [+] |

---

## 4. Kullanıcı Değerlendirme ve Nihai Kararlar
> Kullanıcı ile yapılan görüşme sonucunda netleşen kurallar:

- **Karar 1 (StyleMaster):** Word içinde öğrencinin StyleMaster ve ton ayarlama araçlarını kullanmasına kesinlikle izin verilmeyecektir (Madde 2.2 kilitlendi).
- **Karar 2 (Teslim Modeli - C Seçeneği):** Word içine hiçbir teslim veya fırlatma butonu konulmayacaktır. Eklenti arka planda adli verileri Word dosyasına mühürleyecek; öğrenci dosyayı kaydedip web sitemize yüklediğinde sistemimiz tüm telemetriyi otomatik çözecektir. Platform trafiği, resmi beyan matrisi ve tam rapor deneyimi %100 korunacaktır.  
