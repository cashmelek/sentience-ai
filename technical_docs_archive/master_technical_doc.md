# Sentience AI - Teknik Dökümantasyon ve Mimari Rehber

Bu döküman, Sentience AI platformunun teknik işleyişini, kullanıcı süreçlerini ve akademik bütünlük standartlarını detaylandırır. `intihal.net` mimarisi referans alınarak Sentience AI'nın özgün ajan tabanlı yapısına uyarlanmıştır.

## 1. Sistem Mimarisi ve Ajanlar
Sentience AI, monolitik bir yapı yerine "Ajan Tabanlı" bir mikro-servis mantığıyla çalışır. Her ajan belirli bir akademik risk alanından sorumludur.

### 1.1. Denetçi (AI Detector)
- **Teknoloji:** Gemini 1.5 Flash tabanlı sentaks analizi ve istatistiksel modelleme.
- **Parametreler:** Perplexity (metin karmaşıklığı) ve Burstiness (cümle yapısı değişkenliği).
- **Çıktı:** %0-100 arası YZ skoru ve cümle bazlı ısı haritası.

### 1.2. Hayalet Yazar (Humanizer)
- **Teknoloji:** Derin özümseme (Deep Paraphrasing) algoritmaları.
- **Kural:** Anlam kaybı yaşatmadan, YZ dedektörlerinin (Turnitin, iThenticate vb.) imza modellerini bozacak doğal varyasyonlar üretir.
- **Etik Sınır:** Harf değişikliği veya görünmez karakter gibi hileli yöntemler kullanılmaz.

### 1.3. Sentinel (Verification)
- **Veri Kaynakları:** Crossref, Semantic Scholar, Archive.org.
- **İşlem:** Metindeki iddiaları canlı veritabanlarıyla eşleştirir ve kaynak doğruluğunu kontrol eder.
- **Sıfır Halüsinasyon:** Bilgi uydurulmaz, sadece doğrulanabilir kaynaklar sunulur.

## 2. Kullanıcı İş Akışları (User Workflows)

### 2.1. Kayıt ve Kimlik Doğrulama
Platform; Firebase Auth üzerinden Google, GitHub ve Twitter entegrasyonuna sahiptir. Kurumsal kullanıcılar için e-posta doğrulaması zorunludur.

### 2.2. Proje ve Dosya Yönetimi
- **CRUD İşlemleri:** Kullanıcılar projelerini oluşturabilir, düzenleyebilir ve silebilir.
- **Toplu Silme:** Kullanıcı ayarlarından tüm geçmiş veriler tek seferde temizlenebilir (GDPR uyumu).

### 2.3. Raporlama Süreci
1. **Analiz Başlatma:** Metin editöre girilir ve ajan seçilir.
2. **Gerçek Zamanlı İşleme:** Firestore üzerinden durum takibi yapılır.
3. **Detaylı Rapor:** Isı haritası, dilbilgisi önerileri ve kaynak listesi sunulur.

## 3. Akademik Etik ve Sınırlar
- **İntihal Sınırı:** Üretilen içeriklerde %15'in altında benzerlik hedeflenir.
- **Kaynak Gösterimi:** Her alıntı için otomatik APA/MLA/IEEE formatında atıf önerilir.

---
*Not: Bu döküman teknik arşivleme ve geriye dönük düzeltmeler için `technical_docs_archive` klasöründeki ekran görüntüleri ile desteklenmiştir.*
