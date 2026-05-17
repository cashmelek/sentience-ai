# Sentience AI: Vektör Veritabanı ve Semantik Analiz Yol Haritası

Bu belge, Sentience AI platformunun gelecekteki "Ajan Hafızası" ve "Semantik İntihal Denetimi" altyapısı için teknik tasarım ve hiyerarşiyi tanımlar.

## 1. Vizyon

Platformun mevcut "Arama" tabanlı denetim mekanizmasını, Turnitin benzeri bir **Semantik Analiz** ve **Kalıcı Hafıza** sistemine dönüştürmek. Bu altyapı hem StyleMaster (Marka Sesi) hem de Sentinel (İntihal Denetimi) ajanları tarafından ortak kullanılacaktır.

## 2. Teknik Altyapı (Tech Stack)

* **Model:** Google Vertex AI `text-embedding-004` (En güncel ve düşük maliyetli vektör modeli).
* **Veritabanı:** Firestore Vector Search (Firestore üzerine inşa edilmiş NoSQL Vektör indeksi).
* **Orkestrasyon:** Firebase Cloud Functions (Metinleri otomatik parçalara ayırıp vektörleştirmek için).

## 3. Çalışma Hiyerarşisi (Logic Flow)

### A. Veri Giriş Süreci (Ingestion)

1. **Metin Parçalama (Chunking):** Uzun makaleler 500-1000 karakterlik anlamlı bloklara bölünür.
2. **Vektörleştirme (Embedding):** Her blok Vertex AI'ya gönderilir ve 768 boyutlu bir sayı dizisine (vektör) dönüştürülür.
3. **İndeksleme:** Vektör, orijinal metin referansı ve meta verilerle (yazar, tarih, kaynak) birlikte Firestore'a kaydedilir.

### B. Denetim Süreci (Querying)

1. **Kullanıcı Girdisi:** Kullanıcı yeni bir metin yükler.
2. **Anlık Vektör:** Yüklenen metin anlık olarak vektöre dönüştürülür.
3. **Kosinüs Benzerliği (Cosine Similarity):** Firestore içindeki milyonlarca kayıt arasından, kullanıcı metnine en yakın (anlamsal olarak benzer) ilk 10-20 kayıt milisaniyeler içinde bulunur.
4. **Hibrit Raporlama:**
    * **İç Havuz:** Kendi veritabanımızdaki eşleşmeler.
    * **Dış Havuz:** Sentinel'in mevcut Google Search API sonuçları.

## 4. Ajan Entegrasyonları

### Sentinel (Denetçi)

* **Görevi:** Semantik intihal tespiti. Kelimeler değiştirilse bile fikir takibini yapar.
* **Fayda:** Google'da bulunamayan, daha önce sisteme yüklenmiş gizli dokümanlar arasında çapraz kontrol sağlar.

### StyleMaster (Marka Sesi)

* **Görevi:** Kullanıcının geçmiş yazım tarzını hatırlamak.
* **Fayda:** Kullanıcı "Benim tarzımda yaz" dediğinde, Vektör DB'den kullanıcının en iyi eski yazılarını çeker ve Gemini'ye "Örnek (Few-shot)" olarak sunar.

## 5. Maliyet ve Performans Projeksiyonu

* **Hız:** Mevcut sistemden (API beklemeleri dahil) 10-20 kat daha hızlı sonuç.
* **Maliyet:**
  * 1 Milyon karakter vektörleştirme: **0.025$**
  * 1 Milyon makale saklama: **~1$/Ay**
  * Sorgu maliyeti: Standart Firestore okuma ücreti (neredeyse bedava).

## 6. Uygulama Adımları (Gelecek İçin)

1. GCP Console üzerinden **Vertex AI API**'yi etkinleştir.
2. Firestore'da `vector_embeddings` koleksiyonu oluştur.
3. `gcloud` CLI ile vektör indeksini tanımla.
4. `src/services/vectorService.ts` dosyasını oluşturarak API entegrasyonunu tamamla.

------------------------------------------------------------------------------------------

Evet, kesinlikle! Turnitin gibi profesyonel sistemlerin günümüzde kullandığı en gelişmiş yöntem zaten **Vektör Veritabanı (Vector DB)** ve **Semantik Benzerlik** (Semantic Similarity) teknolojisidir.

Daha önceki konuşmamızda "StyleMaster" için konuştuğumuz **Firestore Vector Search** altyapısını, **Sentinel** ajanının "Hafızası" olarak kullanarak bir "İntihal Veritabanı" oluşturabiliriz.

İşte bunu nasıl yapabileceğimiz ve neden Turnitin seviyesinde bir sonuç vereceğiyle ilgili teknik yol haritası:

### 1. Vektör DB ile İntihal Denetimi Nasıl Çalışır?

Mevcut sistemimiz (Sentinel), Google üzerinden "tam metin eşleşmesi" arıyor. Vektör DB ise metnin **anlamını** arar:

1. **Vektörleştirme (Embedding):** Bir makale sisteme yüklendiğinde, `text-embedding-004` modeliyle sayısal bir vektöre dönüştürülür.
2. **İndeksleme:** Bu vektör Firestore'daki "Hafıza" koleksiyonuna kaydedilir.
3. **Semantik Arama:** Yeni bir metin geldiğinde, sistem "Bu metinle aynı kelimeleri kullanan var mı?" diye değil, **"Bu metinle aynı düşünceyi/yapıyı savunan başka bir metin var mı?"** diye sorar.
    * *Sonuç:* Kelimeler değiştirilse bile (paraphrasing), vektörler birbirine çok yakın çıkacağı için intihali yakalarsınız.

### 2. Turnitin Tarzı Bir Yapı İçin Gerekenler

Turnitin'in en büyük gücü devasa veritabanıdır. Siz de kendi sisteminizde şunu yapabilirsiniz:

* **Kendi Havuzunuzu Oluşturun:** Sisteminize yüklenen her ödevi/makaleyi vektör db'de saklayarak, kullanıcılarınızın birbirlerinden (veya eski ödevlerinden) kopya çekmesini %100 engelleyebilirsiniz.
* **Açık Kaynak Akademik Veriler:** Arxiv, PubMed gibi platformlardan çektiğimiz kritik özetleri vektör db'ye önceden yükleyerek (pre-indexing), anlık arama yapmadan çok hızlı sonuç alabiliriz.

### 3. Avantajları ve Dezavantajları

| Özellik | Google Search (Mevcut Sentinel) | Vector DB (Önerilen) |
| :--- | :--- | :--- |
| **Hız** | Yavaş (API istekleri bekler) | Çok Hızlı (Milisaniyeler) |
| **Kapsam** | Tüm Web | Sizin Veritabanınız |
| **Yetenek** | Tam kelime eşleşmesi | **Anlam ve Fikir eşleşmesi** |
| **Maliyet** | Sorgu başına API ücreti | Depolama ve Embedding ücreti |

### 4. Uygulama Önerisi (StyleMaster + Sentinel Hibrit)

300 dolarlık Google Cloud kredinizi şu şekilde kullanarak **"Sentience Özel İntihal Havuzu"** oluşturabiliriz:

1. **Firestore Vector Search**'ü aktif ederiz.
2. Her analiz edilen metni anonimleştirerek bu db'ye gömeriz.
3. **Sentinel** ajanı bir metni incelerken önce kendi "Vektör Hafızasına" bakar (Turnitin'in kendi deposuna bakması gibi), sonra Google Search ile webi tarar.

**Şu an bu altyapıyı kurmaya başlamamı ister misiniz?** İlk adım olarak `StyleMaster` için konuştuğumuz Firestore altyapısını "İntihal Tespiti"ne de cevap verecek şekilde genişletebiliriz.

-----------------------------------------------------------------------------------

Vektör tabanlı bir intihal sistemi, mevcut Google Search tabanlı sisteme göre **inanılmaz derecede daha ucuzdur.** Aslında, bir kez veritabanını kurduğunuzda, arama maliyeti neredeyse "sıfıra" iner.

İşte 300 dolarlık kredinizi ve Blaze planınızı baz alarak hazırladığım tahmini maliyet tablosu:

### 1. Metinleri Vektöre Dönüştürme (Vertex AI - `text-embedding-004`)

Metni sisteme yüklediğinizde yapılan işlemdir.

* **Birim Fiyat:** 1 Milyon karakter başına yaklaşık **0.025$** (2.5 cent).
* **Senaryo:** 10.000 karakterlik (yaklaşık 10-15 sayfa) bir makale için maliyet: **0.00025$**.
* *Sonuç:* Bu işlem neredeyse bedavadır.

### 2. Saklama ve Arama (Firestore Vector Search)

Vektörleri veritabanında tutma ve sorgulama maliyetidir.

* **Depolama:** 1 GB veri için ayda **0.18$**.
  * *Not:* 1 milyon adet makale vektörü yaklaşık 3-4 GB yer kaplar. Yani 1 milyon makalelik bir arşivi ayda **1$**'dan daha ucuza saklayabilirsiniz.
* **Arama (Sorgu):** Firestore'da bir vektör araması yapmak, sadece birkaç belge okuması (read) olarak ücretlendirilir.
  * 100.000 okuma = **0.03$**.
* *Sonuç:* Sorgulama maliyeti fark edilemeyecek kadar düşüktür.

### 3. Mevcut Sistem (Sentinel - Google Search API) ile Karşılaştırma

Şu an kullandığınız Google Search API maliyeti:

* **1.000 sorgu = 5$**.
* Bir makaleyi tam denetlemek için Sentinel ortalama 10 sorgu yapar.
* **1 makale denetimi = 0.05$ (5 cent).**

### Özet Karşılaştırma (100 Makale İçin)

| İşlem | Google Search (Sentinel) | Vektör Veritabanı |
| :--- | :--- | :--- |
| **100 Makale Denetimi** | **5.00$** | **~0.01$** |
| **Hız** | 30-60 saniye | < 1 saniye |
| **300$ Kredi ile Kapasite** | ~6.000 Makale | **Milyonlarca Makale** |

### Stratejik Tavsiyem

300 dolarlık kredinizle bu sistemi kurduğunuzda, **ömür boyu yetecek** bir altyapıya sahip olursunuz.

    * **Dış kaynaklı (Web) intihal** için yine Sentinel (Google) kullanmalıyız (çünkü web çok büyük).
    * **İç kaynaklı (Kendi havuzunuz) ve Semantik (Anlam bazlı)** intihal için Vektör DB kullanmalıyız.

**Şöyle yapalım mı?**
Önce `StyleMaster` için gerekli olan Vektör DB altyapısını kuralım. Bu altyapı hazır olduğunda, Sentinel ajanına *"Önce kendi havuzumuzda vektör araması yap, sonra Google'a çık"* komutunu ekleyebiliriz. Bu, projenizin profesyonellik seviyesini bir üst lige taşır.

---

## 7. Mevcut ML Altyapısı ve Çalışma Şablonu (Current State)

Vektör DB'ye geçmeden önce, sistemde halihazırda çalışan ve verileri kayıt altına alan altyapı şu şekildedir:

### A. Dilbilimsel Analiz Motoru (Core ML)
Sistem, `src/ml/textFeatures.ts` üzerinden metinlerin sayısal parmak izini çıkarır:
* **Türkçe Optimizasyonu:** Hece tabanlı analiz ile **Ateşman** ve **Çetinkaya-Uzun** endekslerini hesaplar.
* **İstatistiksel Metrikler:** Cümle uzunluğu değişkenliği (**Burstiness**) ve kelime çeşitliliği (**Perplexity**) ile YZ tespiti için veri sağlar.
* **TensorFlow Hazırlığı:** Metinler `tf.Tensor2D` formatına dönüştürülerek derin öğrenme modellerine girdi olmaya hazır tutulur.

### B. Analiz ve Kayıt İş Akışı (Workflow Template)
Platform her işlemde şu şablonu izler:
1. **Analyze:** Gemini ve yerel ML motoru metni tarar.
2. **Transform:** İnsanlaştırma veya düzenleme işlemi yapılır.
3. **Record:** `mlService.ts` -> `sendAnonymousFeedback` fonksiyonu ile şu veriler Firestore (`feedback_summaries`) koleksiyonuna kaydedilir:
   - `improvementRatio`: İşlem sonrası YZ skorundaki düşüş oranı.
   - `lengthDiff`: Metin uzunluğundaki değişim.
   - `toneUsed`: Tercih edilen marka sesi/tonu.

### C. Yapılandırma Mandatları
* **Gizlilik:** Kayıtlar asla kullanıcı metninin ham halini içermez, sadece meta verileri (sayısal başarı oranlarını) tutar.
* **Hibrit Yapı:** Ağır işlemler (Gemini) bulutta, hafif analizler (Okunabilirlik/Heceleme) yerel JavaScript motorunda (`@tensorflow/tfjs`) koşturulur.

---
**Hazırlayan:** Sentience AI Geliştirme Asistanı
**Son Güncelleme:** Mayıs 2026 (v2.6 - ML Altyapısı ve Kayıt Sistemi Dökümantasyonu)
ve "Google Kredileri" ile en verimli şekilde ölçeklenmesi için bir rehberdir.*
