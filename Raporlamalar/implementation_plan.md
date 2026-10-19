# Sentience AI - LM Studio & Yerel Model Entegrasyonu Planı

Bu plan, lokalde kurulan LM Studio çıkarım sunucusunu projeye entegre etmek, toplanan ML verilerini yerel eğitim için dışa aktarmak, admin panelinde kontrol mekanizmaları oluşturmak ve akıllı hibrit/yedek plan (fallback) mimarisini kurmak amacıyla hazırlanmıştır.

## User Review Required

> [!IMPORTANT]
> Yerel LM Studio bağlantısının kurulabilmesi için uygulamanın tarayıcı üzerinden yerel `http://localhost:1234` adresine istek atması gerekecektir. LM Studio ayarlarında **CORS (Cross-Origin Resource Sharing)** desteğinin açık olduğundan emin olunmalıdır.

> [!WARNING]
> Yerel modeller (örn. gemma-2-9b), bulut tabanlı Gemini modellerine göre JSON formatına uyumda daha hassastır. Bu nedenle sistem promptları yerel model algıladığında daha katı ve sade kurallarla beslenecektir.

## Proposed Changes

---

### Component 1: Yerel Çıkarım Servisi (Local Inference)

#### [NEW] [localModelService.ts](file:///C:/Users/OEM/.gemini/antigravity/playground/sentience-ai/src/services/localModelService.ts)
* LM Studio'nun OpenAI uyumlu API'sine (`http://localhost:1234/v1`) istek atacak temel servis.
* Sunucu durumunu test etmek (`ping`) ve lokalde yüklü modelleri dinamik çekmek (`/v1/models`) için gerekli fonksiyonlar.
* İnsanlaştırma ve YZ tespiti için yerel modele OpenAI formatında istek gönderme mantığı.

---

### Component 2: Akıllı Yönlendirme ve Fallback Yönetimi

#### [MODIFY] [geminiService.ts](file:///C:/Users/OEM/.gemini/antigravity/playground/sentience-ai/src/services/geminiService.ts)
* `detectAI` ve `checkGrammar` gibi servislerin girişinde, Admin Panelinden seçilen aktif mod kontrol edilecek:
  - **Sadece Bulut:** Doğrudan Gemini API havuzuna gider.
  - **Sadece Yerel:** Doğrudan LM Studio servisine gider.
  - **Hibrit Mod:** Analiz tipi veya metin uzunluğuna göre yerel/bulut rotasyonu yapar.
  - **Otomatik Fallback:** Gemini kotaları dolduğunda hata fırlatmak yerine otomatik olarak yerel modele yönlenir.

---

### Component 3: Fine-Tuning Veri Dışa Aktarıcı (ML Export)

#### [NEW] [export_ml_data.ts](file:///C:/Users/OEM/.gemini/antigravity/playground/sentience-ai/scripts/export_ml_data.ts)
* Firestore'da `isTrainingReady: true` olan veya kalite skoru yüksek (orijinal metin -> insanlaştırılmış metin) verileri çeken bağımsız TypeScript scripti.
* Çekilen verileri Unsloth/Hugging Face formatına uygun ChatML/Alpaca JSONL formatına dönüştürüp proje dizininde çıktı veren yapı.

---

### Component 4: Admin Paneli Arayüzü & Durum Kontrolü

#### [MODIFY] [AdminPanel.tsx](file:///C:/Users/OEM/.gemini/antigravity/playground/sentience-ai/src/components/AdminPanel.tsx)
* API Havuzu kartının yanına estetik ve modern bir **"Yerel Model Ayarları (LM Studio)"** kartı eklenmesi.
* Kart içeriği:
  - Sunucu adresi ayarı (`http://localhost:1234`).
  - Bağlantı durumu göstergesi (Online/Offline) ve Ping butonu.
  - LM Studio'dan dinamik çekilen model seçim dropdown'ı.
  - Sistem Çalışma Modu seçici (`Gemini Only`, `LM Studio Only`, `Smart Hybrid`).

---

## Verification Plan

### Automated Tests
- `npm run build` ile TypeScript derleme ve referans doğruluğu kontrolü.
- LM Studio yerel endpoint'ine istek atılarak mock verilerle analiz testi.

### Manual Verification
- LM Studio lokalde başlatılarak Admin Panelinden "Ping" butonuna basılması ve bağlantı durumunun "Aktif" olduğunun doğrulanması.
- Akıllı Yönlendirici hibrit moda alınarak dilbilgisi denetimlerinin local modele, derin analizlerin Gemini bulutuna düştüğünün console logları ile teyit edilmesi.
- `npm run db:export-tuning` komutu çalıştırılarak `sentience_tuning_data.jsonl` dosyasının başarıyla üretildiğinin kontrolü.
