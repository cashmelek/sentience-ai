# Sentience AI: Kullanım Mekanizma Planı ve Abonelik Modeli (Usage Policy)

Bu belge, Sentience AI platformunun farklı üyelik katmanlarındaki kullanım sınırlarını, özellik erişimlerini ve operasyonel kurallarını tanımlar.

## 1. Üyelik Katmanları ve Kapasiteler

| Özellik | Başlangıç (Ücretsiz) | Profesyonel (Pro) | Premium |
| :--- | :--- | :--- | :--- |
| **Günlük İşlem Limiti** | 10 Analiz / Gün | 50 Analiz / Gün | Sınırsız* |
| **Karakter Limiti** | 1,000 Karakter / İşlem | 5,000 Karakter / İşlem | 25,000+ Karakter / İşlem |
| **Ajan Erişimi** | Auditor (Temel), GhostWriter (Standart) | Tüm Ajanlar (Tam Erişim) | Tüm Ajanlar + Öncelikli Modeller |
| **Canlı Kaynak Denetimi** | Yok | Var (Sentinel) | Var + Akademik Veritabanları |
| **Özel Ton Kaydı** | 1 Adet | 10 Adet | Sınırsız |

> [!NOTE]
> *Sınırsız kullanım, Firebase Spark planı sınırları ve genel kötüye kullanım politikaları çerçevesinde "Adil Kullanım Kotası"na tabidir.

## 2. Ajan Görev Tanımları ve Limitleri

### 🛡️ Auditor (YZ Denetçisi)
- **Başlangıç:** Temel YZ olasılık skoru.
- **Pro/Premium:** Derinlemesine "Muhakeme" (Reasoning) raporu, cümle bazlı ısı haritası ve yapısal analiz.

### ✍️ GhostWriter (Hayalet Yazar)
- **Başlangıç:** Standart insanlaştırma motoru (Gemini 1.5 Flash).
- **Pro/Premium:** Gelişmiş üslup taklidi, Gemini 2.0/2.5 Flash modellerine erişim ve yüksek akıcılık.

### 👁️ Sentinel (Gözcü)
- **Sadece Pro/Premium:** İnternet üzerinde canlı kaynak taraması. Google Custom Search API entegrasyonu ile 2026 güncelliğinde veri doğrulaması.

### 🎭 StyleMaster (Stil Ustası)
- **Pro/Premium:** Kullanıcının geçmiş yazılarından veya yüklediği örneklerden "Marka Sesi" oluşturma ve bu sesi tüm ajanlara uygulama yeteneği.

## 3. Kota Sıfırlama ve Yönetim
- Tüm günlük kullanım kotaları her gün Türkiye saatiyle (UTC+3) 00:00'da otomatik olarak sıfırlanır.
- Admin Panel üzerinden yöneticiler manuel kota sıfırlama veya kullanıcı bazlı plan değişikliği yapabilir.

## 4. Gizlilik ve Güvenlik Mandatları
- **Admin Read-Only:** Yöneticiler kullanıcıların ham metin içeriklerine asla erişemez. Sadece istatistiksel kullanım verilerini görebilir.
- **Veri Silme:** "Proje Sil" komutu verildiğinde, ilgili metin ve analiz verileri Firestore'dan kalıcı olarak temizlenir.

---
*Son Güncelleme: 13 Mayıs 2026*
