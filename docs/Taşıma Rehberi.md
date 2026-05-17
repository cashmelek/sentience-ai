# Sentience AI - Altyapı ve API Taşıma Kılavuzu

Bu belge, Sentience AI projesinin altyapısının (Firebase, Google Cloud ve API ayarları) yeni bir Google hesabına taşınması veya baştan kurulması gerektiğinde izlenmesi gereken adımları referans olması amacıyla hazırlanmıştır.

## 1. Firebase Proje Sahipliği Devri (Ownership Transfer)

Mevcut bir Firebase projesini başka bir Google hesabına devretmek için:

1. [Firebase Console](https://console.firebase.com/)'a eski (mevcut) hesap ile giriş yapın.
2. İlgili projeyi (örneğin: `sentience-ai-free-2026`) seçin.
3. Sol üstteki dişli (ayarlar) simgesine tıklayıp **"Project settings" (Proje Ayarları)** sayfasına gidin.
4. **"Users and permissions" (Kullanıcılar ve İzinler)** sekmesine geçin.
5. **"Add member" (Üye Ekle)** butonuna basarak projenin devredileceği yeni e-posta adresini yazın.
6. Rol (Role) olarak **"Owner" (Sahip)** seçin ve daveti gönderin.
7. Yeni e-posta adresinize gelen davet mailindeki bağlantıya tıklayarak sahipliği kabul edin.
*(İsteğe bağlı: Taşıma tamamlandıktan sonra, yeni hesapla Firebase'e girip eski hesabı projeden çıkarabilirsiniz.)*

## 2. Bilgisayar / Terminal Ortamının Yeni Hesaba Bağlanması

Kodu geliştirdiğiniz bilgisayarda Firebase CLI'ın yeni hesabı tanıması için:

1. Proje klasöründe terminali açın.
2. Eski hesaptan çıkış yapmak için şu komutu çalıştırın:
   ```bash
   firebase logout
   ```
3. Yeni hesaba giriş yapmak için şu komutu çalıştırın:
   ```bash
   firebase login
   ```
4. Tarayıcı açılacak ve yeni Google hesabınızı seçerek izin vermeniz istenecektir. İşlem tamamlandığında terminaliniz artık yeni hesaba bağlıdır.

## 3. Gemini API (YZ Motoru) Kurulumu

Projenin ana zekasını oluşturan Gemini API anahtarlarını almak için iki yol mevcuttur. **Ücretsiz ve yüksek kotalı kullanım için 3.1 (AI Studio) yöntemi önerilir.**

### 3.1. Google AI Studio (Önerilen)
1. **[aistudio.google.com](https://aistudio.google.com/)** adresine gidin.
2. Sol menüden **"Get API key"** butonuna basın.
3. Yeni bir proje oluşturun veya mevcut bir projeyi seçerek **"Create API key"** deyin.
4. Buradan aldığınız anahtar doğrudan `gemini-1.5-flash` modelleriyle çalışacaktır.

### 3.2. Google Cloud Console (Alternatif)
1. [Google Cloud Console](https://console.cloud.google.com/) adresine gidin.
2. Kütüphane (Library) kısmında **"Gemini API"** veya **"Generative Language API"** aratıp etkinleştirin.
3. Kimlik Bilgileri (Credentials) kısmından yeni bir API Anahtarı oluşturun.

## 4. Sentinel (İntihal Tarayıcı) İçin Google Search API Kurulumu

Sentinel ajanının internetteki kopya içerikleri bulabilmesi için bir Özel Arama Motoruna (Programmable Search Engine) ve API Anahtarına ihtiyacı vardır.

### 4.1. Arama Motoru Kimliği (Search Engine ID) Alma
1. [Google Programmable Search Engine](https://programmablesearchengine.google.com/) sayfasına gidin.
2. **"Ekle" (Add)** diyerek yeni bir arama motoru oluşturun.
3. *Önemli Not:* Arama motoru oluştururken "Aranacak Siteler" kısmına en az bir site girmenizi zorunlu kılabilir. Oraya geçici olarak `wikipedia.org` veya `www.google.com` yazıp devam edin.
4. Oluşturduktan sonra ayarlar panelinden **"Arama Motoru Kimliği" (Search Engine ID)** değerini kopyalayın.
5. Ayarlardan **"Tüm web'de arama yap" (Search the entire web)** seçeneğini **AÇIK (ON)** konuma getirin.

### 4.2. Custom Search API Key Alma
1. Google Cloud Console'da **"Custom Search API"** kütüphanesini etkinleştirin.
2. Kimlik Bilgileri kısmından bu API için bir anahtar oluşturun.

## 5. Ortam Değişkenlerinin (.env.local) Güncellenmesi

Sentience AI, kota sorunlarını aşmak için **Çoklu Anahtar Rotasyonu (Key Rotation)** sistemini destekler.

1. `.env.local` dosyasını açın.
2. `VITE_GEMINI_API_KEY` kısmına elinizdeki tüm anahtarları virgülle ayırarak ekleyin:

```env
# Gemini AI Keys (Virgülle ayrılmış çoklu anahtar desteği)
VITE_GEMINI_API_KEY=anahtar1, anahtar2, anahtar3

# Google Custom Search API for Sentinel Agent
VITE_GOOGLE_SEARCH_API_KEY=arama_api_anahtarı
VITE_GOOGLE_SEARCH_ENGINE_ID=arama_motoru_id
```

3. Herhangi bir `.env` değişikliğinden sonra projeyi yeniden başlatın (`npm run dev`).

---
**Hazırlayan:** Sentience AI Geliştirme Asistanı
**Son Güncelleme:** Mayıs 2026 (v2.5 - Çoklu Anahtar ve AI Studio Güncellemesi)
