# Alternatif Alt Birim Mimari Planları (Sentience AI)

Bu belge, sistem ölçeklenirken gelecekte bağımsız veya arka plan işçisi olarak ayrılabilecek uzman birim rollerini ve veri akışlarını içerir.

---

### 1. Kılavuz ve İçerik Senkronizasyon Birimi (Guide & Content Specialist)
- **Rol & Kapsam:** Akademik intihal yönergeleri (`intihal.net/guide` ve YÖK standartları) ile sistem özelliklerini dinamik eşleştirir.
- **İşlevler:**
  - `UserGuideView.tsx` içerisindeki rehber adımlarını YÖK/ÜAK mevzuat güncellemeleriyle senkronize eder.
  - Sıkça sorulan sorular (SSS) ve video anlatım meta verilerini Firestore `system_guides` koleksiyonuna yazar.

---

### 2. Blog & Editoryal Adaptasyon Birimi (Editorial Adaptor)
- **Rol & Kapsam:** Dış kaynaklı akademik blog içeriklerini (`bireysel.intihal.net/blog`), Sentience AI'ın etik intihal politikalarına ve 4 temel modülüne (Denetçi, İnsanlaştırma, Sentinel, StyleMaster) uyumlu biçimde sentezler.
- **İşlevler:**
  - Metinlerde intihal oranını %15, tekil kaynak benzerliğini <%3 seviyesinde tutar.
  - SEO anahtar kelimelerini, okuma sürelerini ve etiketleri otomatik indeksler.

---

### 3. CMS & Arayüz Yapılandırma Birimi (Landing & Layout CMS Controller)
- **Rol & Kapsam:** Landing Page bileşenleri (Hero, İstatistikler, Özellik Kartları, Duyuru Banner'ı, Footer Link ve İletişim Bilgileri) için merkezi durum yönetimini üstlenir.
- **İşlevler:**
  - `settings/landingPage` ve `settings/footerConfig` Firestore dokümanlarını tek noktadan yönetir.
  - Admin Paneli'nde anlık önizleme (Live Preview) desteği sağlar.

---

### 4. Akademik Doğrulama & Denetim Birimi (Academic Compliance Auditor)
- **Rol & Kapsam:** Kullanıcı metinlerinin intihal eşiklerini, alıntı biçimlerini (APA, MLA, IEEE, Chicago) ve kaynak güvenilirliğini (Crossref, OpenAlex, Semantic Scholar) denetler.
- **İşlevler:**
  - Sahte/uydurma kaynak üretimini (zero-hallucination) %100 engeller.
  - Enstitü onay havuzuna gönderilen tezlerin orijinallik sertifikalarını üretir.
