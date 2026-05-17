# Sentience AI - Geliştirme Protokolü ve Mimari Prensipler

## 0. GÜVENLİK VE DOSYA BÜTÜNLÜĞÜ (KRİTİK)
- **Dosya Güncelleme:** Mevcut dosyalar üzerinde işlem yaparken `write_file` yerine daima `replace` aracını tercih et. `write_file` kullanımı sadece yeni dosya oluştururken veya dosyanın TAMAMI (tüm importlar, componentler ve logic) yeniden yazıldığında tercih edilmelidir.
- **Kısmi Kod Gönderme Yasağı:** Hata düzeltme (fix) yaparken dosyanın sadece bir kısmını gönderip geri kalanını silme. Eğer `write_file` kullanılacaksa, dosyanın orijinal içeriğinin %100 korunduğundan ve sadece hedeflenen değişikliğin eklendiğinden emin ol.
- **Build Öncesi Kontrol:** Her deploy öncesinde `npm run build` komutu ile dosya bütünlüğünü ve referans hatalarını (ReferenceError vb.) kontrol et.

## 1. Mimari Ayrım: Çekirdek (Core) ve Vitrin (Showcase)
... (rest of the content)

Sentience AI, iki ana katmandan oluşur. Bu katmanlar arasındaki sınır asla ihlal edilmemelidir:

- **Çekirdek Motor (Core Engine):** `src/services/`, `src/genkit/`, `src/ml/` altındaki mevcut analiz, insanlaştırma ve YZ tespit algoritmaları. Bu bölüm "Tamamlanmış Yazılım" olarak kabul edilir. İç mantığı bozulmamalı, sadece dışarıdan çağrılmalıdır.
- **Vitrin Katmanı (Showcase Layer):** `src/components/LandingPage.tsx` gibi satış, pazarlama, üyelik ve kullanıcı karşılama arayüzleri. Tüm yeni görsel ve satış odaklı özellikler bu katmanda yaşar.

## 2. Ajan Tabanlı Sunum (Agent-Native Presentation)

Platformun teknik yetenekleri kullanıcıya "Karakter Sahibi Ajanlar" olarak pazarlanır. Kod bazında fonksiyonlar aynı kalsa da, arayüzde şu ajanlar görev yapar:

- **Denetçi** YZ Tespiti ve Risk Analizi.
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
- **Yapay Zeka Tespiti Aşımı (İnsanlaştırma):** Metinlerin *Perplexity* (karmaşıklık) ve *Burstiness* (cümle uzunluğu/yapısı değişkenliği) değerleri, AI algılayıcılara (Turnitin vb.) yakalanmayacak şekilde insan standartlarında (doğal akış) ayarlanmalıdır. Hile/Siyah şapka taktikler kullanılamaz.
- **Güvenilir Çapraz Doğrulama Havuzu:** Sentinel, canlı kaynak doğrulamasında `Crossref`, `Semantic Scholar`, `CORE (core.ac.uk)`, `archive.org` ve `PubMed/arXiv` gibi otoriter veri kaynaklarını baz alarak sıfır halüsinasyon kuralını işletir.

### 5.2. Yazım, Atıf ve Sentez Kuralları (Üretim Aşaması)

- **Derin Özümseme (Deep Paraphrasing):** Yalnızca eş anlamlı kelime değişimi (basit paraphrasing) yasaktır. Kavramsal analiz yapılıp, bilgi sentezlenerek yepyeni bir cümle yapısıyla sunulmalıdır.
- **Çoklu Sentez:** Konuyla ilgili 3-4 farklı kaynağın verileri, ortak ve çelişen yönleri birleştirilerek özgün analizler oluşturulmalıdır.
- **Doğrudan Alıntı ve Tanımlar:** Kanun maddeleri, değişmez teknik tanımlar ve yazarın kritik ifadeleri kesinlikle değiştirilmez; daima tırnak içinde ("...") veya 40 kelimeden uzunsa blok alıntı şeklinde verilir.
- **Genel Geçer Bilgi Filtresi:** Herkesçe bilinmeyen tüm spesifik veriler ve fikirler için mutlak suretle atıf (kaynak) eklenmelidir.

### 5.3. Kesin Yasaklar (Risk ve Ceza Protokolü)

- **Hile / Blackhat:** İntihal yazılımlarını atlatmak için görünmez karakterler (beyaz boşluk), harf değiştirmek veya anlamsız bağlaçlar eklemek kesinlikle yasaktır ("Hata yap ama hile yapma").
- **Atıf İçinde Atıf (Kör Kopyalama):** Sentinel, orijinal kaynağın varlığını ve içeriğini doğrulamadan bir kaynaktaki başka bir kaynağın atıfını kopyalayamaz.
- **Çeviri İntihali:** Yabancı makaleleri doğrudan çevirip özgün gibi sunmak yasaktır. Çevrilen fikirler kaynak gösterilerek sentezlenmelidir.

### 5.4. Teknik Format ve Filtreler

- **Filtreleme Uyumluluğu:** İntihal raporlamalarında "Kaynakça" ve "Alıntılar" kısımlarının filtreye takılmaması için standart ve net formatlar kullanılmalıdır.
- **Stil Rehberi Uyumu:** Kurumun talep ettiği atıf stili (APA 7, MLA, Chicago, IEEE vb.) eksiksiz uygulanmalıdır.
