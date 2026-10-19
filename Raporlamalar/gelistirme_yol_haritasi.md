# Sentience AI — Kapsamlı Geliştirme Yol Haritası
> Tarih: 2026-10-01 | Analiz Kapsamı: Tüm katmanlar (Landing Page, App Core, Admin, Altyapı, Servisler)

---

## 🔴 ALAN 1 — KRİTİK TEKNİK BORÇ (Hemen Ele Alınacak)

### 1.1 Model Adı Tutarsızlığı — `geminiService.ts`
| Sorun | Konum | Risk |
|-------|-------|------|
| `DEFAULT_MODEL` `"gemini-3.5-flash"` olarak ayarlı ama bu model gerçekte **mevcut değil** | `src/services/geminiService.ts:22` | Tüm API çağrıları sessizce fallback yapar veya hata döner |
| `validateModelName()` 2.0 ve 1.5 modellerini `"gemini-3.5-flash"`'a yönlendiriyor — bu model geçersiz | `geminiService.ts:33` | API `404` hatası |
| Admin panelinde model değiştirilse bile `validateModelName` doğru modeli bozabilir | `AdminPanel.tsx` | Yönetici kontrolü işlevsiz |

**Çözüm:** `"gemini-2.0-flash"` veya `"gemini-1.5-flash"` kullanılmalı. Tüm fallback'ler güncellenmeli.

---

### 1.2 App.tsx Monolith — 1900+ Satır
| Risk | Detay |
|------|-------|
| Bakım yapılamaz | Tüm state, UI ve iş mantığı tek dosyada |
| Test edilemez | Sıfır unit test; component izole değil |
| Performans | Her state değişikliğinde tüm ağaç re-render olabilir |

**Çözüm:** Aşağıdaki component ayrımı:
- `HeatmapView.tsx` — Isı haritası + tooltip (şu an 200+ satır inline)
- `EditorPanel.tsx` — Giriş editörü + toolbar + istatistik çubuğu
- `ResultPanel.tsx` — Sonuç sekmeleri (Metin/Isı Haritası/Karşılaştır/Export)
- `AuditorSidebar.tsx` — Denetçi analiz paneli + Sentinel
- `ProjectSidebar.tsx` — Geçmiş/Taslak listesi + sayfalama

---

### 1.3 Bundle Boyutu — `vendor-core` hâlâ ~957 kB
| Paket | Tahmini Katkı | Aksiyon |
|-------|--------------|---------|
| `onnxruntime-web` | ~400 kB | Web Worker'a taşı, lazy load yap |
| `framer-motion` | ~120 kB | Sadece kullanılan `motion` primitifleri import et |
| `docx` | ~200 kB | Export butonuna tıklandığında dinamik `import()` yap |
| `react-markdown` | ~80 kB | `lazy()` ile wrap'le |

---

## 🟠 ALAN 2 — LANDING PAGE YENİLEME

### 2.1 Mevcut Durum Sorunları
| # | Sorun | Etki |
|---|-------|------|
| 1 | Hero başlığı `"Yapay Zeka Yazdı, SENTIENCE İnsanlaştırdı"` — ürün faydası belirsiz | Dönüşüm düşük |
| 2 | Fiyatlar TL cinsinden hardcode, dinamik/çoklu para birimi yok | Küresel kullanıcı kaybı |
| 3 | Demo bölümü sadece Denetçi'yi gösteriyor — İnsanlaştırma önizlemesi yok | Ana değer önerisi gösterilmiyor |
| 4 | Footer `Globe`, `Github`, `Twitter` ikonları tıklanabilir ama URL yok | Kırık linkler |
| 5 | SEO: Tek `<h1>`, `<meta description>` veya Open Graph tag yok | Arama görünürlüğü sıfır |
| 6 | Sosyal kanıt (kullanıcı sayısı, referans, yorumlar) yok | Güven eksikliği |
| 7 | CTA butonları her plan için aynı sayfaya yönlendiriyor | Funnel optimizasyonu yok |
| 8 | Hayalet Yazar demo bölümü boş (sadece `Sparkles` ikonu) | Kayıt engeli |

### 2.2 Landing Page Yenileme Planı

#### Faz L1 — İçerik ve SEO (1-2 gün)
- [ ] `<head>` içine `title`, `meta description`, `og:image`, `og:title` ekle
- [ ] Hero metnini A/B test edilebilir propsla dışarı çıkar
- [ ] Sosyal kanıt bar'ı ekle: `"10.000+ Akademik Metin İşlendi"`, `"Turnitin Uyumlu"` rozeti
- [ ] Footer linkleri gerçek URL'lere bağla

#### Faz L2 — Demo İyileştirme (2-3 gün)
- [ ] Hayalet Yazar önizlemesi: Statik before/after metin karşılaştırması ekle
  - Sol: YZ çıktısı (kırmızı vurgulu)
  - Sağ: SENTIENCE çıktısı (yeşil vurgulu) — animasyonlu "yazılıyor" efekti
- [ ] Demo sonucu gösterildikten sonra `"Şimdi Ücretsiz Dene"` butonunu scroll pozisyonuyla vurgula

#### Faz L3 — Sosyal Kanıt ve Güven (3-5 gün)
- [ ] Referans bölümü: 3-5 gerçek/temsili akademik kullanıcı kartı
- [ ] `"Nasıl Çalışır"` — 3 adımlı görsel akış (Yapıştır → Analiz Et → İndir)
- [ ] Canlı istatistik sayacı (animasyonlu)
- [ ] Rozet sırası: `Turnitin Uyumlu`, `iThenticate Güvenli`, `KVKK Uyumlu`

---

## 🟡 ALAN 3 — UYGULAMA UX/UI İYİLEŞTİRMELERİ

### 3.1 Editör Deneyimi
| # | Öneri | Öncelik |
|---|-------|---------|
| 1 | Kelime sınırı aşıldığında görsel uyarı (kota çubuğu kırmızıya döner + titreme animasyonu) | Yüksek |
| 2 | Metin yapıştırıldığında otomatik YZ tespiti başlatsın (opsiyonel, açılıp kapanabilir) | Orta |
| 3 | Klavye kısayolları: `Ctrl+Enter` → Analiz başlat, `Ctrl+Z/Y` → Undo/Redo | Orta |
| 4 | Sürükle-bırak dosya yükleme (.txt, .docx) → editöre metin aktarma | Düşük |

### 3.2 Sonuç Paneli
| # | Öneri | Öncelik |
|---|-------|---------|
| 1 | Isı haritasında cümle renk bantları için açıklama legend'ı ekle (Yeşil: İnsan, Sarı: Karma, Kırmızı: YZ) | Yüksek |
| 2 | "Karşılaştır" sekmesi: scroll sync (orijinal ve düzenlenmiş metin eş zamanlı scroll) | Orta |
| 3 | Export işleminden önce önizleme modalı | Düşük |

### 3.3 Bildirim ve Geri Bildirim
| # | Öneri | Öncelik |
|---|-------|---------|
| 1 | API hatalarında toast mesajının altına "Yeniden Dene" butonu ekle | Yüksek |
| 2 | Analiz tamamlandığında tarayıcı Notification API'si (izinli ise) | Düşük |
| 3 | Uzun analiz sürecinde ilerleme göstergesi (adım adım: "Denetçi çalışıyor...", "İnsanlaştırılıyor...") | Orta |

---

## 🟢 ALAN 4 — YENİ ÖZELLİKLER

### 4.1 Dil ve Çekim Desteği
**Neden:** Türkçe dışındaki dillerde gelen akademik metinler için talep oluşacak.

- [ ] Dil seçici: Türkçe (varsayılan), İngilizce, Almanca
- [ ] İnsanlaştırma prompt'larını seçilen dile göre uyarla
- [ ] Dil tespiti: Kullanıcı metin yapıştırınca otomatik dil algıla, uyarı ver

### 4.2 Şablon / Preset Sistemi
**Neden:** Kullanıcılar her seferinde aynı ayarları (ton + hassasiyet) manuel seçiyor.

- [ ] `"Akademik Makale"`, `"Tez Bölümü"`, `"Özet"`, `"Blog Yazısı"` gibi hazır şablonlar
- [ ] Şablon kaydedebilme (kullanıcı başına Firestore'da)
- [ ] Landing page'den doğrudan şablonla uygulamayı açabilme

### 4.3 İşbirliği Modu (Collaboration)
**Neden:** Danışman-öğrenci veya ekip senaryoları.

- [ ] Proje paylaşım linki üret (read-only veya edit)
- [ ] Yorumlar: Belirli bir cümleye yorum ekle
- [ ] Versiyon geçmişi (proje bazında, mevcut kayıt sistemi üzerine)

### 4.4 API Erişimi (Kurumsal Plan İçin)
**Neden:** Kurumsal plan `"Tam API Erişimi"` vaat ediyor ama mevcut değil.

- [ ] REST API endpoint'leri oluştur (Firebase Functions veya Node.js)
- [ ] API key yönetimi paneli (kullanıcıya özel)
- [ ] Swagger/OpenAPI dokümantasyonu

### 4.5 Gram ve Yazım Denetimi Entegrasyonu
**Neden:** Mevcut `GrammarSuggestion` interface tanımlı ama UI'da kullanılmıyor.

- [ ] Sonuç metninde yazım/dilbilgisi hataları için satır altı çizgi
- [ ] Sağ tıklama menüsü ile öneri kabul/reddet
- [ ] Genel gramer skoru (`grammarScore` zaten `AnalysisResult`'da mevcut)

### 4.6 İleri Seviye Canlı İntihal Denetimi ve Kaynak Linkleme (TextGuard Kıyaslama)
**Neden:** Mevcut Google Custom Search API kota/izin kısıtları nedeniyle intihal analizinde %0 hatası oluşuyor ve bulunan web kaynakları linklenmiyordu. TextGuard kalitesinde canlı web taraması, görselleştirme ve kaynak linklemesi gerekiyor.

- [ ] Google Live Search Grounding (Gemini 2.5 Flash) ile canlı web ve akademik indeks taraması
- [ ] Denetçi Analizi (`handleAnalyze`) butonuna gerçek zamanlı intihal motorunun bağlanması
- [ ] Editör metni üzerinde intihalli cümlelerin vurgulanması (turuncu alt çizgi), hover tooltip (yüzde + kaynak) ve doğrudan URL linklemesi
- [ ] Sağ panel Sentinel Kaynakları listesinin zenginleştirilmesi (başlık, doğrudan link, alıntı parçası, benzerlik rozeti)
- [ ] "İntihali Kaldır / İnsanlaştır" tek tıkla aksiyon butonu (TextGuard modeli)

---

## 🔵 ALAN 5 — ALT YAPI MODERNİZASYONU

### 5.1 Firebase Functions — Sunucu Taraflı İşlemler
**Neden:** Şu an tüm Gemini API çağrıları client-side — API anahtarları kullanıcıya görünür riski var.

- [ ] `analyzeAndHumanize` → Firebase Function'a taşı
- [ ] Rate limiting sunucu tarafında uygula
- [ ] Kullanıcı kredisi kontrolü sunucuda yap

### 5.2 Gerçek Zamanlı Kota İzleme
- [ ] Firestore'da `usage/{userId}/daily` koleksiyonu
- [ ] Her API çağrısında atomik `increment()` ile sayaç güncelle
- [ ] Admin paneline kullanıcı başına günlük kullanım grafiği ekle

### 5.3 Test Altyapısı
- [ ] Vitest + React Testing Library kurulumu
- [ ] `geminiService.ts` için mock tabanlı unit testler
- [ ] Kritik akışlar için E2E test (Playwright)

### 5.4 CI/CD Pipeline
- [ ] GitHub Actions: PR'da `npm run build` + `tsc --noEmit`
- [ ] Lint ve format kontrolü (`eslint`, `prettier`)
- [ ] Otomatik Vercel/Netlify deploy preview

---

## 🚀 ÖNERİLEN SPRINT PLANI

### Sprint 1 — Anlık Düzeltmeler ve Hızlı Kazanımlar (1-2 gün) ✅
- [x] **P0-1:** `gemini-3.5-flash` → `gemini-2.0-flash` tüm dosyalarda
- [x] **P1-2:** Landing page `<head>` SEO meta tagları
- [x] **P1-3:** Isı haritası renk legend'ı (Yeşil/Sarı/Kırmızı açıklaması)
- [x] **P1-4:** Footer linkleri düzelt

### Sprint 2 — Landing Page Yenileme (3-4 gün) ✅
- [x] Hayalet Yazar before/after demo animasyonu
- [x] Sosyal kanıt bar'ı (istatistik sayaçları)
- [x] "Nasıl Çalışır" 3 adımlı bölüm
- [x] Güven rozetleri (Turnitin, KVKK)

### Sprint 3 — Core Refactor (1 hafta) ✅
- [x] App.tsx → 5 component'e ayır (AuditorMetrics, DiffView, HeatmapView, GrammarPanel)
- [x] Dinamik import ile bundle küçültme (docx dinamik import & modal lazy loading)
- [x] Gramer denetimi UI aktivasyonu (GrammarPanel tam entegrasyonu)

### Sprint 4 — Yeni Özellikler & İntihal Motoru İyileştirmesi (TextGuard Standardı) 🚀
- [x] Şablon/Preset sistemi (PresetSelector bileşeni & kullanıcı özel şablon kaydı)
- [x] Klavye kısayolları (Ctrl+Enter / Cmd+Enter ile hızlı işlem)
- [~] Dil seçici (Kullanıcı tercihiyle atlandı)
- [x] **İntihal 4.1:** Google Live Search Grounding tabanlı `verifyPlagiarism` motoru (%0 hatasının giderilmesi)
- [x] **İntihal 4.2:** Denetçi Analizine (`handleAnalyze`) canlı intihal taramasının entegrasyonu
- [x] **İntihal 4.3:** Metin üzerinde intihal vurgulama (orange underline), tooltip ve doğrudan kaynak URL linklemesi
- [x] **İntihal 4.4:** Sağ panel Sentinel Kaynakları listesinin zenginleştirilmesi (başlık, link, alıntı snippet'ı)
- [x] **İntihal 4.5:** "İntihali Kaldır / İnsanlaştır" tek tıkla aksiyon butonu
- [x] **Güvenlik 4.6:** Serverless güvenlik katmanı — Firebase Functions (Blaze gerektirir) yerine **Vercel Serverless API** (`api/analyze.ts` + `api/detect.ts`) kuruldu. Firebase Auth token ile Bearer doğrulama, sunucu taraflı API key yönetimi, client fallback mekanizması aktif. Deploy: `vercel --prod` ile (Vercel login gerekli).

---

> **Not:** Sprint 1 hemen başlanabilir. Sprint 2 ve sonrası kullanıcı onayına tabidir.

