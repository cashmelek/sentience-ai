# Sentience AI - Geliştirme Protokolü ve Mimari Prensipler

## 0. GÜVENLİK VE DOSYA BÜTÜNLÜĞÜ (KRİTİK)

- **Dosya Güncelleme:** Mevcut dosyalar üzerinde işlem yaparken `write_file` yerine daima `replace` aracını tercih et. `write_file` kullanımı sadece yeni dosya oluştururken veya dosyanın TAMAMI (tüm importlar, componentler ve logic) yeniden yazıldığında tercih edilmelidir.
- **Kısmi Kod Gönderme Yasağı:** Hata düzeltme (fix) yaparken dosyanın sadece bir kısmını gönderip geri kalanını silme. Eğer `write_file` kullanılacaksa, dosyanın orijinal içeriğinin %100 korunduğundan ve sadece hedeflenen değişikliğin eklendiğinden emin ol.
- **Build Öncesi Kontrol:** Her deploy öncesinde `npm run build` komutu ile dosya bütünlüğünü ve referans hatalarını (ReferenceError vb.) kontrol et.
- **Regresyon ve Geri Alma (Rollback) Yasağı:** Hata düzeltme veya dosya senkronizasyonu sırasında dosyalar önceki commit veya yedeklerden körü körüne geri yüklenemez (`git checkout` veya eski dosyanın üzerine kopyalanması yasaktır). Oturum boyunca tamamlanmış ve kararlaştırılmış mimariler (örneğin Admin Paneli API Havuzu yapısı, kullanıcı rolleri, entegrasyonlar) korunmalı; değişiklikler daima cerrahi (`edit_file`) olarak uygulanmalıdır.

## 1. Mimari Ayrım: Çekirdek (Core) ve Vitrin (Showcase)

Sentience AI, iki ana katmandan oluşur. Bu katmanlar arasındaki sınır asla ihlal edilmemelidir:

- **Çekirdek Motor (Core Engine):** `src/services/`, `src/genkit/`, `src/ml/` altındaki mevcut analiz, insanlaştırma ve YZ tespit algoritmaları. Bu bölüm "Tamamlanmış Yazılım" olarak kabul edilir. İç mantığı bozulmamalı, sadece dışarıdan çağrılmalıdır.
- **Vitrin Katmanı (Showcase Layer):** `src/components/LandingPage.tsx` gibi satış, pazarlama, üyelik ve kullanıcı karşılama arayüzleri. Tüm yeni görsel ve satış odaklı özellikler bu katmanda yaşar.

## 2. Ajan Tabanlı Sunum (Agent-Native Presentation)

Platformun teknik yetenekleri kullanıcıya "Karakter Sahibi Ajanlar" olarak pazarlanır. Kod bazında fonksiyonlar aynı kalsa da, arayüzde şu ajanlar görev yapar:

- **Denetçi:** YZ Tespiti ve Risk Analizi.
- **İnsanlaştırma:** İnsanlaştırma ve Ton Ayarlaması.
- **Sentinel:** Canlı Kaynak Doğrulama ve İntihal Denetimi.
- **StyleMaster:** Özel Tonlar ve Marka Sesi Hafızası.

## 3. Kullanıcı Deneyimi ve Satış Akışı

- **Giriş (Entry):** Kimliği doğrulanmamış kullanıcılar doğrudan Login ekranı yerine profesyonel **Landing Page**'i görmelidir.
- **Kanca (Demo):** Landing Page üzerinde kayıt gerektirmeyen sınırlı bir "Ücretsiz Deneme" kutusu bulunmalı ve bu kutu Çekirdek Motor'u (read-only) kullanmalıdır.
- **Dönüşüm (Conversion):** Demo sonrasında tam erişim için kullanıcı "Ajanları Görevlendir" (Üye Ol) butonlarına yönlendirilmelidir.

## 4. Güvenlik ve Gizlilik Mandatları

- **Admin Read-Only:** Yöneticiler asla kullanıcıların ham metinlerini (`projects` koleksiyonu) okuyamaz.
- **Zero-Hallucination:** İntihal denetiminde asla uydurma kaynak/link üretilemez. Sadece geçmiş ve en son hangi tarihi Gün, Ay, Yıl içerisinde ise ismi bilinen ve erişilebilir kaynaklar sunar.

## 5. Akademik İntihal ve Etik Protokolü

Sentinel ve İnsanlaştırma ajanları, metin üretimi ve analizi sırasında aşağıdaki kesin kurallara uyar:

### 5.1. Temel Hedefler ve Metrikler

- **Maksimum İntihal Sınırı:** Üretilen veya düzenlenen makalelerde genel intihal oranı %15'i geçmemelidir.
- **Kaynak Başına Limit:** Tek bir kaynaktan gelen benzerlik oranı %1 - %3 bandında tutulmalıdır.
- **Yapay Zeka Tespiti Aşımı (İnsanlaştırma):** Metinlerin Perplexity ve Burstiness değerleri, AI algılayıcılara yakalanmayacak şekilde insan standartlarında ayarlanmalıdır. Hile yasaktır.
- **Güvenilir Çapraz Doğrulama Havuzu:** Sentinel; Crossref, Semantic Scholar, CORE, archive.org ve PubMed/arXiv gibi otoriter veri kaynaklarını baz alır.

### 5.2. Yazım, Atıf ve Sentez Kuralları

- **Derin Özümseme:** Yalnızca eş anlamlı kelime değişimi yasaktır. Kavramsal analiz yapılıp bilgi sentezlenerek özgün bir cümle yapısıyla sunulmalıdır.
- **Çoklu Sentez:** 3-4 farklı kaynağın verileri birleştirilerek özgün analizler oluşturulmalıdır.
- **Doğrudan Alıntı:** Kanun maddeleri ve teknik tanımlar değiştirilmez; daima tırnak içinde ("...") verilir.

### 5.3. Kesin Yasaklar

- **Hile / Blackhat:** Görünmez karakterler veya harf değiştirmek kesinlikle yasaktır ("Hata yap ama hile yapma").
- **Atıf İçinde Atıf:** Orijinal kaynak doğrulanmadan atıf kopyalanamaz.
- **Çeviri İntihali:** Doğrudan çeviri yapıp özgün gibi sunmak yasaktır.

## 6. ETKİLEŞİM PROTOKOLLERİ (MAKSİMUM TOKEN TASARRUFU)

### 6.1. Genel Davranış ve Yanıt Biçimi

- **Sadece İsteneni Ver:** Asla giriş, gelişme, sonuç cümleleri yazma. Nezaket veya dolgu ifadeleri (örn: "Tabii ki", "İşte kodunuz") kullanma.
- **Doğrudan Koda Geç:** Sorulan soruya doğrudan kaynak kod, terminal komutu veya ilgili dokümantasyon satırı ile yanıt ver.
- **Kısa ve Net Ol:** Açıklamalar gerekli olduğunda sadece teknik detayları içermeli ve maksimum 2-3 cümleyle yapılmalıdır.

### 6.2. Kod Üretimi ve Çıktı Sınırlandırma

- **Sadece Değişen Kısmı Yaz:** Düzenleme istendiğinde tüm dosyayı tekrar yazma. Sadece değişen veya eklenen fonksiyonu/satırları ver.
- **Kod İçi Yorum Kullanma:** Kod bloklarının içerisine açıklama satırları (`//`, `#`) ekleme.
- **Özet Format:** Değişiklikleri gösterirken mümkünse sadece güncellenen bloğu veya `diff` formatını kullan.

### 6.3. Analiz ve Hata Ayıklama (Debugging)

- **Doğruluk Kontrolü:** Kod doğruluğu sorulduğunda sadece "Doğru" veya "Hatalı: [Kısa Nedeni]" şeklinde yanıt dön.
- **Algoritma Onayı (Dry Run):** Karmaşık taleplerde kodu yazmadan önce yapacağın işi tek bir cümleyle onaya sun.

### 6.4. Bağlam (Context) Yönetimi

- **Güncel Odak:** Eski konuşmaları referans alarak gereksiz token tüketimi yapma. Her zaman en son gönderilen mesaja ve ekli güncel kod parçasına odaklan.

### 6.5. Ajan Yönetimi

- **Alt Ajan (Subagent) Yasaktır:** Kesinlikle dinamik alt ajanlar (dynamic subagents) oluşturma. Oluşturulması gerekiyor ise mutlaka yeni bir plan oluştur ve işlem bittiğinde `Altajan_planlar.md` dosyasında oluşturulan planları proje bittikten sonra alternatif olarak hazırla. Tüm görevleri tek başına ve minimum işlem gücüyle çöz.

### 6.6. Raporlama Protokolü

- **Sürekli Rapor Güncelleme:** Bundan sonra bitirilen tüm işlemler, geliştirmeler ve hata düzeltmeleri Raporlamalar/GUNCEL_PROJE_VE_GELISTIRME_RAPORU.md dosyasına raporlanmalıdır.
