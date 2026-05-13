# Sentience AI - Altyapı ve API Taşıma Kılavuzu

Bu belge, Sentience AI projesinin altyapısının (Firebase, Google Cloud ve API ayarları) yeni bir Google hesabına taşınması veya baştan kurulması gerektiğinde izlenmesi gereken adımları referans olması amacıyla hazırlanmıştır.

## 1. Firebase Proje Sahipliği Devri (Ownership Transfer)

Mevcut bir Firebase projesini başka bir Google hesabına devretmek için:

1. [Firebase Console](https://console.firebase.google.com/)'a eski (mevcut) hesap ile giriş yapın.
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

## 3. Sentinel (İntihal Tarayıcı) İçin Google Search API Kurulumu

Sentinel ajanının internetteki kopya içerikleri bulabilmesi için bir Özel Arama Motoruna (Programmable Search Engine) ve API Anahtarına ihtiyacı vardır.

### 3.1. Arama Motoru Kimliği (Search Engine ID) Alma
1. [Google Programmable Search Engine](https://programmablesearchengine.google.com/) sayfasına gidin.
2. **"Ekle" (Add)** diyerek yeni bir arama motoru oluşturun.
3. *Önemli Not:* Arama motoru oluştururken "Aranacak Siteler" kısmına en az bir site girmenizi zorunlu kılabilir. Oraya geçici olarak `wikipedia.org` veya `www.google.com` yazıp devam edin.
4. Oluşturduktan sonra ayarlar panelinden **"Arama Motoru Kimliği" (Search Engine ID)** değerini kopyalayın.
5. Ayarlardan mümkünse **"Tüm web'de arama yap" (Search the entire web)** seçeneğini **AÇIK (ON)** konuma getirin. (Eğer Google tarafından bu buton kilitlenmiş/gri yapılmışsa, geçici olarak eklediğiniz site üzerinden aramaya devam eder.)

### 3.2. Google Cloud API Key (API Anahtarı) Alma
1. [Google Cloud Console](https://console.cloud.google.com/) adresine gidin.
2. Sol üstten doğru Firebase/Google Cloud projesinde olduğunuzdan emin olun.
3. Sol menüden **"API'ler ve Hizmetler" (APIs & Services) -> "Kitaplık" (Library)** sekmesine gidin.
4. Arama kutusuna **`Custom Search API`** yazın, çıkan sonuca tıklayıp **"Etkinleştir" (Enable)** butonuna basın. (Kullanıyorsanız `Vector Search API`'yi de aynı şekilde etkinleştirin).
5. Yine sol menüden **"Kimlik Bilgileri" (Credentials)** sekmesine geçin.
6. Üstten **"+ KİMLİK BİLGİSİ OLUŞTUR" (+ CREATE CREDENTIALS) -> "API Anahtarı" (API Key)** seçeneğine tıklayın.
7. Eğer sistem size API'yi kısıtlamanızı (API Restrictions) söylerse, listeden "Custom Search API"yi seçip "Create" (Oluştur) deyin.
8. Ekranda beliren uzun API Anahtarını (API Key) kopyalayın.

## 4. Ortam Değişkenlerinin (.env.local) Güncellenmesi

Elde ettiğiniz yeni bilgileri projedeki `.env.local` dosyasına entegre etmelisiniz.

1. Projenizin ana dizinindeki `.env.local` dosyasını açın.
2. Gerekli kısımları aşağıdaki gibi güncelleyin:

```env
# Google Custom Search API for Sentinel Agent
VITE_GOOGLE_SEARCH_API_KEY="Google_Cloud_Panelinden_Aldığınız_Uzun_API_Key"
VITE_GOOGLE_SEARCH_ENGINE_ID="Programmable_Search_Panelinden_Aldığınız_Engine_ID"
```

3. Herhangi bir `.env` değişikliğinden sonra geliştirme sunucusunun bu yeni şifreleri algılaması için terminalde çalışan projeyi durdurup (`CTRL + C`) yeniden başlatın (`npm run dev`).

---
**Hazırlayan:** Sentience AI Geliştirme Asistanı
**Son Güncelleme:** Mayıs 2026
