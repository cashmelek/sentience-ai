# Sentience AI — Firebase Manuel Dağıtım (Deployment) Kılavuzu

Bu kılavuz, Sentience AI uygulamasının ve Firebase kaynaklarının (Hosting, Firestore kuralları/indeksleri) yerel ortamdan Firebase'e manuel olarak nasıl dağıtılacağını (deploy edileceğini) açıklar.

---

## 1. Ön Gereksinimler

Dağıtım işlemine başlamadan önce aşağıdaki araçların bilgisayarınızda kurulu ve yapılandırılmış olması gerekir:

1. **Node.js (v18+)**
2. **Firebase CLI:** Bilgisayarınızda Firebase CLI yüklü değilse terminalden yükleyin:
   ```bash
   npm install -g firebase-tools
   ```
3. **Firebase Oturumu:** Firebase hesabınızla giriş yapın:
   ```bash
   npx firebase login
   ```

---

## 2. Dağıtım Adımları

### 1. Adım: Projeyi Derleyin (Build)
Uygulamanın en güncel kodlarını derleyip tarayıcının çalıştırabileceği statik dosyaları `dist` klasörüne çıkarmak için terminalde şu komutu çalıştırın:
```bash
npm run build
```
> [!IMPORTANT]
> Derleme (build) işlemi tamamlanmadan yapılan deploy işlemleri, Firebase üzerindeki web sitesinin eski kalmasına sebep olur.

### 2. Adım: Firebase Projesini Seçin
Birden fazla Firebase projeniz varsa, doğru projeye deploy ettiğinizden emin olmak için aktif projeyi seçin:
```bash
npx firebase use sentience-ai-free-2026
```

### 3. Adım: Dağıtımı Başlatın (Deploy)
Projede Firebase Storage henüz etkinleştirilmediği için tam deploy (`firebase deploy`) hata verecektir. Bu yüzden dağıtımı **Hosting** ve **Firestore** kurallarını kapsayacak şekilde sınırlandırarak çalıştırmalısınız:
```bash
npx firebase deploy --only hosting,firestore
```

**Komut Parametreleri Detayları:**
* `--only hosting`: Yalnızca `dist` klasöründeki web sitesini dağıtır.
* `--only firestore`: Yalnızca Firestore güvenlik kurallarını (`firestore.rules`) ve indekslerini (`firestore.indexes.json`) dağıtır.

---

## 3. Dağıtım Sonrası Doğrulama

Dağıtım tamamlandıktan sonra terminal çıktısında şu bilgiler görünecektir:
* **Hosting URL:** Uygulamanın canlıya alındığı web adresi (Örn: `https://sentience-ai-free-2026.web.app`).
* **Project Console:** Firebase yönetim paneli bağlantısı.

Web tarayıcınızdan **Hosting URL** adresine giderek sitenizin güncel olduğunu doğrulayın.
