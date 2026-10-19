# Sentience AI - Teknik Mimari Dokümantasyonu (ARCHITECTURE)

Bu doküman, Sentience AI projesinin teknik yapısını, veri akışını ve modüler bileşenlerini detaylandırmaktadır.

## 1. Teknolojik Yığın (Tech Stack)

*   **Frontend:** React (TypeScript), Vite, Tailwind CSS (Vanilla CSS temelli özelleştirilmiş tasarım), Framer Motion (Animasyonlar), Lucide-React (İkonlar).
*   **Backend & Veritabanı:** Firebase Suite
    *   **Authentication:** Google ile giriş.
    *   **Firestore:** NoSQL veritabanı (Kullanıcılar, Projeler, Özel Tonlar).
*   **Yapay Zeka (AI):** 
    *   **Google Generative AI SDK (Gemini):** Metin insanileştirme, özetleme ve dilbilgisi kontrolü.
    *   **ML Service:** Derin analizler için özel mantıksal katman.

## 2. Klasör Yapısı

```text
sentience-ai/
├── src/
│   ├── components/       # UI Bileşenleri (AdminPanel, PlansModal vb.)
│   ├── lib/              # Konfigürasyonlar (firebase.ts, utils.ts)
│   ├── services/         # İş mantığı ve API çağrıları
│   │   ├── geminiService.ts  # Gemini SDK entegrasyonu
│   │   └── mlService.ts      # ML analiz mantığı
│   ├── App.tsx           # Ana uygulama ve state yönetimi
│   └── index.css         # Tasarım sistemi ve global stiller
├── scripts/              # Devops ve Tuning scriptleri (tune_model.ts)
├── public/               # Statik varlıklar
└── ARCHITECTURE.md       # Bu doküman
```

## 3. Veri Modeli (Firestore)

### `users` Koleksiyonu
Kullanıcıların yetki ve kullanım bilgilerini tutar.
*   `uid`: Kullanıcı ID.
*   `role`: `admin` | `user`.
*   `plan`: `free` | `pro` | `premium`.
*   `dailyUsage`: Günlük kullanılan işlem sayısı.
*   `lastResetDate`: Kotanın sıfırlandığı son tarih.

### `projects` Koleksiyonu
Kullanıcıların yaptığı işlemleri ve taslakları tutar.
*   `userId`: İşlemi yapan kullanıcı.
*   `originalText`: Kaynak metin.
*   `humanizedText`: İşlenmiş sonuç metni.
*   `isDraft`: Taslak olup olmadığı.
*   `aiScore`: Yapay zeka tespit skoru.
*   `tone`: Seçilen ton.

## 4. İş Akışı (Data Flow)

1.  **Giriş:** Kullanıcı Google ile giriş yapar, Firebase Auth üzerinden `users` dokümanı oluşturulur/senkronize edilir.
2.  **Girdi:** Kullanıcı sol panele metin girer. 
3.  **Canlı Analiz:** Metin girilirken `detectAI` ve `checkGrammar` fonksiyonları (debounce ile) arka planda çalışarak canlı skorlar üretir.
4.  **İnsanileştirme/Özetleme:** Kullanıcı butona bastığında:
    *   `App.tsx` üzerindeki handler fonksiyonu tetiklenir.
    *   `geminiService.ts` üzerinden Google Gemini modeline özel promptlar ile istek atılır.
    *   Sonuç sağ panele yansıtılır ve Firestore'a kaydedilir.
5.  **Admin Yönetimi:** Admin yetkisine sahip kullanıcılar `AdminPanel` üzerinden sistem ayarlarını ve kullanıcı kotalarını yönetebilir.

## 5. Model Eğitimi (Tuning)

Sistem, `scripts/tune_model.ts` aracılığıyla veritabanındaki başarılı "İnsanileştirme" örneklerini JSONL formatına getirip Google Cloud Vertex AI üzerinden modelin eğitilmesine olanak tanır. Bu, çıktı kalitesinin zamanla iyileşmesini sağlar.

---
*Hazırlayan: Sentience AI Geliştirme Ekibi*
