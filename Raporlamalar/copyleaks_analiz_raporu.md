# Copyleaks AI Tespit Metodolojisi — Araştırma Raporu
> Tarih: 2026-10-03 | Amaç: Sentience AI İnsanlaştırma Motoru Geliştirme

---

## 🔴 ACİL — Sentinel Halüsinasyon Teşhisi ve Fix (2026-10-03)

### Sorun Raporu
Kullanıcı testi sırasında `verifyPlagiarism` fonksiyonu 3 adet **uydurma (halüsinasyon) kaynak** üretti:

| # | Test Cümlesi | Üretilen URL | Gerçek Durum |
|---|--------------|-------------|--------------|
| 1 | "Bilimsel bilgi ile gündelik bilgi arasındaki temel fark..." | `academia.edu/12345678/Γ_χρηστή_...` | Yunanca, tamamen alakasız |
| 2 | "Başka bir ifadeyle bilimsel bilgi..." | `dergipark.org.tr/tr/download/article-file/987654` | **404 Sayfa Yok** |
| 3 | "Bu nedenle bilimsel araştırma sürecinde..." | `researchgate.net/246813579/...` | Bot engeli + büyük olasılıkla uydurma ID |

### Kök Neden Analizi

```
❌ YANLIŞ MİMARİ (Eski Kod):

client.models.generateContent({
  tools: [{ googleSearch: {} }],       ← Grounding açık
  config: { responseMimeType: "application/json" }  ← JSON modu açık
})

Gemini bu iki talimatı aynı anda uygulayamaz:
  → Google Search yapıyor (doğru)
  → Ama JSON üretirken ground edilmiş URL'leri değil,
     KENDİ OLUŞTURDUĞU (halüsine ettiği) URL'leri yazıyor
  → Sonuç: academia.edu/12345678, dergipark/987654 gibi
    gerçek olmayan ID'ler
```

> **GEMINI.md Kural İhlali:** "Zero-Hallucination: İntihal denetiminde asla uydurma kaynak/link üretilemez."

### Uygulanan Fix

```
✅ YENİ MİMARİ (Düzeltilmiş Kod):

Aşama 1 — Grounding sorgusu (serbest metin, JSON YOK):
  → Gemini Google Search yapar
  → groundingMetadata.groundingChunks içindeki gerçek URL'leri döner

Aşama 2 — Metadata'dan URL çekme:
  → chunk.web.uri → doğrulanmış, gerçek URL
  → url.startsWith('http') kontrolü (uydurma engeli)
  → Zaten eklendi mi? (tekrar engeli)

Sonuç: Sadece Gemini'nin gerçekten bulduğu URL'ler gösterilir
```

**Fix dosyası:** [`sentinelService.ts`](file:///c:/Users/OEM/.gemini/antigravity/playground/sentience-ai/src/services/sentinelService.ts)

### Neden ResearchGate Erişilemiyor?
ResearchGate, bot trafiği tespit edince "Erişim geçici olarak kısıtlanmıştır" sayfası gösteriyor. Bu sunucu tarafı bir bot engeli — proje hatası değil. Gemini Grounding bu URL'yi bulmadığı sürece artık gösterilmeyecek.

---



### 1.1 Tespit Katmanları

Copyleaks **tek bir metrik** yerine 6 katmanlı bir analiz sistemi kullanır:

| Katman | Ne Ölçer? | Neden Önemli? |
|--------|-----------|----------------|
| **Token Tahmin Edilebilirliği (Perplexity)** | Kelime seçimlerinin ne kadar "olası" olduğu | LLM'ler her zaman en yüksek olasılıklı kelimeyi seçer → düşük perplexity |
| **Cümle Ritmi (Burstiness)** | Cümle uzunluğu varyasyonu | YZ metni düzgün, insan metni patlamalı (kısa+uzun karışık) |
| **Frekans Oranı** | YZ'ye özgü ifade/deyim örüntüleri | "Önemle belirtmek gerekir ki", "sonuç olarak" gibi YZ kalıpları |
| **Sentaktik Analiz** | Dilbilgisi ve sözdizimi kalıpları | LLM'lerin mekanik yapı tercihleri |
| **Hece Dağılımı (Syllable Dispersion)** | Metnin ritim "parmak izi" | İnsan yazısı vs. LLM yazısının ses düzeni farkı |
| **Nöral Ağ Sınıflandırıcı** | Anlambilimsel/bağlamsal örüntüler | Milyarlarca belge ile eğitilmiş derin öğrenme |

### 1.2 Doğruluk İddiaları vs. Gerçeklik

| Kaynak | İddia |
|--------|-------|
| Copyleaks (şirket) | %99+ doğruluk, yanlış pozitif: **%0.03** |
| Bağımsız testler | Yanlış pozitif gerçekte **%5-10** (özellikle kısa/karma metin) |
| Türkçe metinler | Eğitim verisi çoğunlukla İngilizce → Türkçe'de **daha az güvenilir** |

> **Kritik bulgu:** Copyleaks 2025 sonunda "bypasser detection" modeli ekledi. Otomatik insanlaştırma araçlarından geçirilmiş metinleri **özel olarak** tespit etmek için eğitildi.

---

## 2. Copyleaks'in Bayrak Diktiği Örüntüler

### 2.1 YZ Metnini İşaret Eden Dilsel Sinyaller

```
❌ YAPMA — Copyleaks'i Tetikleyen Yapılar

Geçişler:   "Önemle belirtmek gerekir ki..."
            "Sonuç olarak..."
            "Bununla birlikte, bu önemlidir..."
            "Nitekim..."  (aşırı kullanım)
            "Dolayısıyla..." (formüle edilmiş akış)

Yapılar:    Her cümlenin benzer uzunlukta olması (~20 kelime)
            Düzgün A→B→C mantık akışı (hiç sürpriz yok)
            Aşırı hedging: "genellikle", "çoğunlukla", "muhtemelen"
            "İlk olarak... İkinci olarak... Son olarak..." kalıpları

Kelimeler:  "kapsamlı", "önemli", "kritik", "verimli" (LLM slop)
            Pasif yapı aşırı kullanımı
```

### 2.2 İnsan Yazısına Özgü Sinyaller (Yüksek Perplexity)

```
✅ YAP — İnsanlaştırma Hedefleri

Cümle ritmi:  Kısa. Ve daha kısa. Ardından, düşünce derinleştikçe uzayan, 
               yan cümlelerle zenginleşen, neredeyse nefes kesen bir cümle yapısı.

Geçişler:     "Oysa..." | "Ne var ki..." | "Peki ya..." | "Şöyle bir düşünelim:"
               Beklenmedik bağlaçlar, soru cümleleri, ünlemler

Örüntü:       Herhangi bir anda beklenmedik bir kelime seçimi
               Aynı fikierin farklı sözdizimiyle tekrarı (anafora)
               Akademik ama kişisel: "Bu sonuç bizi şaşırttı, çünkü..."
```

---

## 3. Sentience AI Mevcut Durumu — Boşluk Analizi

### 3.1 Mevcut Prompt'un Güçlü Yönleri

`geminiService.ts` içindeki mevcut insanlaştırma prompt'u şunları yapıyor:
- ✅ Perplexity/Burstiness değerlerine atıfta bulunuyor
- ✅ Ton seçeneği (Akademik, Profesyonel vs.) sunuyor
- ✅ Yoğunluk seviyesi (düşük/orta/yüksek) var
- ✅ Türkçe zorunluluğu belirtiliyor

### 3.2 Mevcut Prompt'un Kritik Eksiklikleri

| Eksiklik | Copyleaks Etkisi | Çözüm |
|----------|-----------------|-------|
| "Perplexity artır" = soyut talimat | Model hâlâ tahmin edilebilir kelimeler seçiyor | **Spesifik yapısal kurallar** verilmeli |
| Yasak kelime listesi yok | LLM slop ifadeler geçiyor | Yasaklı geçiş listesi eklenmeli |
| Hece dağılımı kontrolü yok | Ritim analizi başarısız | Kısa cümle zorunluluğu eklenmeli |
| Paragraf başı dinamiği yok | Her paragraf benzer yapıda | Açılış cümlesi çeşitliliği zorunlu kılınmalı |
| Türkçeye özgü idiom kullanımı yok | "Çeviri kokusu" var | Deyim/kalıp enjeksiyonu eklenmeli |

---

## 4. Geliştirme Önerileri — İnsanlaştırma Motoru v2

### 4.1 Yeni Prompt Mimarisi

Mevcut tek prompt yerine **3 katmanlı işlem** öneriyorum:

```
Katman 1 — Yapısal Analiz:
  LLM, mevcut metni cümle uzunluğu ve geçiş örüntüleri açısından analiz eder.
  Hangi cümleler "düz" (aynı uzunluk, aynı yapı)?

Katman 2 — Hedefli Yeniden Yazım:
  Sadece bayraklanan cümleler yeniden yazılır.
  Geri kalan metin korunur (intihal riski minimumda).

Katman 3 — Doğrulama:
  Üretilen metnin Perplexity ve Burstiness skorları hesaplanır.
  Eşik altındaysa Katman 2 tekrar çalıştırılır.
```

### 4.2 Güçlendirilmiş Prompt Değişkenleri

Aşağıdaki prompt bloklarını mevcut `geminiService.ts` prompt'una eklemek gerekiyor:

**Blok A — Yasaklı İfadeler (Copyleaks Tetikleyicileri):**
```
YASAKLI KELİMELER VE KALIPLAR (KULLANMA):
- Geçişler: "Önemle belirtmek gerekir ki", "Sonuç olarak", "Bu bağlamda",
  "Nitekim", "Dolayısıyla", "Bununla birlikte" (aşırı kullanım),
  "İlk olarak... İkinci olarak...", "Son olarak"
- Slop Kelimeler: "kapsamlı", "kritik", "verimli", "önemli", "sürdürülebilir",
  "bütünleşik", "optimize etmek", "sinerji"
- Hedging: "genellikle düşünülür ki", "yaygın kanıya göre", "muhtemelen"
```

**Blok B — Zorunlu Yapısal Kurallar (Burstiness):**
```
CÜMLE YAPISI KURALLARI (ZORUNLU):
1. Her 3 uzun cümleden sonra 1 kısa cümle (max 8 kelime) gelmelidir.
2. Paragraf başı cümleleri birbirinden farklı yapıda olmalıdır:
   - Soru ile başla: "Bu durumda ne olur?"
   - Eylemle başla: "Düşünelim: bir araştırmacı..."
   - Sonuçla başla: "Bulgular açıktır."
3. İki üst üste aynı uzunlukta cümle YASAKTIR.
4. Zincirleme yan cümle (3+ bağımlı cümle) kullanma.
```

**Blok C — Türkçe Özgün Dokunuşlar (Perplexity Artırma):**
```
TÜRKÇE ÖZGÜNLÜK KURALLARI:
1. En az 1 Türkçe deyim veya atasözü uyarlaması kullan (bağlam uygunsa)
2. Anadil konuşuruna özgü dolaylı anlatım kalıpları kullan
3. Teknik terimleri Türkçe kökenli eşdeğerleriyle değiştir (varsa)
4. "Sanki...", "Adeta...", "Tam da..." gibi kuvvetlendirici kalıplar ekle
5. Akademik metinde dahi kişisel gözlem cümlesi ekle: "Bu nokta, pratikte..."
```

### 4.3 Ton Bazlı Strateji Farklılaştırması

| Ton | Copyleaks Odağı | Prompt Stratejisi |
|-----|----------------|-------------------|
| **Akademik** | En çok bayraklanan | Dipnot tarzı parentez açıklamalar, hedging yeniden çerçeveleme |
| **Profesyonel** | Orta risk | Sektöre özgü jargon enjeksiyonu |
| **Özet** | Düşük risk | Kısa bulletlar, başlık varyasyonu |
| **Blog** | En az risk | Soru-cevap yapısı, anekdot |

---

## 5. Teknik Uygulama Planı — geminiService.ts

### 5.1 Öncelik Sırası

**P0 — Hemen Uygulanabilir (Prompt Güncellemesi, 1-2 gün):**
- Yasaklı kelime listesi prompt'a eklenmesi
- Cümle uzunluğu kuralları eklenmesi
- Türkçe idiom zorunluluğu eklenmesi

**P1 — Orta Vade (Yeni Fonksiyon, 3-5 gün):**
- Cümle bazlı Burstiness hesaplama (kelime sayısı variance analizi)
- Eşik altı cümleleri otomatik işaretleme (ısı haritasıyla entegrasyon)
- Paragraf başı çeşitlilik doğrulama

**P2 — Uzun Vade (Model/API Geliştirme, 1-2 hafta):**
- Katmanlı işlem mimarisi (Analiz → Yaz → Doğrula döngüsü)
- Copyleaks API entegrasyonu (gerçek zamanlı skor geri bildirimi)
- A/B test altyapısı (hangi prompt değişkeni en iyi skoru üretiyor?)

### 5.2 Ölçülebilir Başarı Kriterleri

| Metrik | Mevcut Hedef | İdeal Hedef |
|--------|--------------|-------------|
| Copyleaks AI Skoru | < %30 | < %15 |
| Burstiness Varyans | — | σ > 8 kelime |
| Yasaklı ifade sızması | — | 0 |
| Anlamsal tutarlılık | — | %95+ (el değerlendirmesi) |

---

## 6. Kritik Uyarılar

> [!WARNING]
> **Bypasser Detection:** Copyleaks 2025 sonunda otomatik humanizer araçlarından geçirilmiş metinleri **özel olarak tanıyan** bir model ekledi. Bu, "sadece prompt değiştir" yaklaşımının artık yeterli olmadığı anlamına gelir. Çıktının "insanlaştırma aracından geçmiş" görünmemesi gerekiyor.

> [!IMPORTANT]
> **Türkçe Avantajı:** Copyleaks'in modeli çoğunlukla İngilizce veriyle eğitilmiştir. Türkçe metinlerde doğruluk %99'dan çok daha düşüktür. Türkçe özgün yapılar (agülatif morfoji, devrik cümle, Türkçe deyimler) kullanmak bu avantajı artırır.

> [!NOTE]
> **Etik Sınır:** GEMINI.md protokolüne uygun olarak: görünmez karakter, harf değiştirme gibi kara liste teknikler kesinlikle yasak. Hedef, **gerçekten daha iyi metin** üretmek — sadece algıyı kandırmak değil.

---

## 7. Sprint 5 Önerisi

Bu araştırma bulgularına göre önümüzdeki sprint:

```
Sprint 5 — İnsanlaştırma Motoru v2 (Copyleaks Uyumlu)

[ ] P0: Prompt güçlendirme — yasaklı kelime listesi + cümle kuralları + Türkçe idiom
[ ] P0: Yoğunluk moduna göre farklı kural setleri (Akademik/Blog/Özet ayrımı)  
[ ] P1: İstemci tarafı Burstiness hesaplama (UI'da cümle varyans göstergesi)
[ ] P1: Bayraklı cümle vurgulama (ısı haritası Copyleaks mantığıyla uyumlu)
[ ] P2: Copyleaks API test entegrasyonu (skor geri bildirimi döngüsü)
```

---

## 8. Copyleaks Doğruluk ve Metodoloji Analizi (Metodoloji Belgesi Değerlendirmesi)

### 8.1 Belgedeki Formülasyon Özeti
İncelenen Copyleaks değerlendirme belgesi, modelin tespit başarısını ölçmek için standart ikili sınıflandırma (binary classification) metriklerini kullanmaktadır:
- **Doğruluk (Accuracy):** $(TP + TN) / (TP + TN + FP + FN)$
- **Yanlış Pozitif Oranı (FPR):** $FP / (FP + TN)$ (İnsan metnine yanlışlıkla YZ denme oranı — hedef: <%0.2)
- **F1-Skoru:** $2 \cdot (Precision \cdot Recall) / (Precision + Recall)$
- **Hata Analizi Bulgusu:** Metin uzunluğu azaldıkça (kısa paragraflar/token sayısı düşüklüğü) ve karma (hibrit) metinlerde modelin hata payı katlanarak artmaktadır.

### 8.2 Sentience AI Karşılaştırması
- **Mevcut Durum:** `src/ml/textFeatures.ts` içinde stilometrik ve okunabilirlik formülleri (Ateşman, Çetinkaya-Uzun, ARI, Coleman-Liau, standart sapma tabanlı Burstiness ve kelime çeşitliliği tabanlı Perplexity) mevcuttur. Ancak test/doğrulama düzeyinde bir karışıklık matrisi (Confusion Matrix / FPR / F1) formülasyonu bulunmamaktadır.
- **Uyum:** Sentience AI'ın "Denetçi" (Auditor) bileşeninin bağımsız test seti üzerinde kalibre edilmesi için bu metodoloji tam uyumludur.

### 8.3 Mimari ve Stratejik Sorular (Açık Gündem)
1. **Dahili Benchmark Havuzu:** Denetçi'nin kendi FPR ve F1 skorunu periyodik ölçmek için 500 insan / 500 YZ metninden oluşan yerel bir Türkçe test veri seti oluşturulmalı mı?
2. **Kısa Metin Eşiği Sınırı:** Copyleaks grafiğinde açıkça görülen "kısa metinlerde yüksek hata oranı" riskine karşı, Denetçi ve Sentinel için asgari kelime sınırı (örn. minimum 80-100 kelime) zorunlu kılınmalı mı?
3. **Burstiness Eşik Standartlaşması:** `textFeatures.ts` içindeki $\sigma$ (standart sapma) varyans formülü ile Copyleaks'in cümle uzunluk dalgalanma toleransı arasındaki eşik kaç piksel/oran olmalıdır?
4. **Hibrit Metin Ayrımı:** Belgede belirtilen hibrit (insan + YZ) metinlerdeki tespit zorluğu, İnsanlaştırma ajanımızın metni kısmi parafraze etme stratejisine nasıl yansıtılmalı?
5. **Akademik Metin Koruması:** Türkçe akademik makalelerin Ateşman endeksi düşük çıktığında Denetçi'nin bunu yanlışlıkla YZ olarak etiketlemesini önleyecek dinamik ağırlıklandırma katsayısı ne olmalıdır?

---

## 9. Sistem Modernizasyonu ve Turnitin Akademik Bütünlük Entegrasyonu

### 9.1 Copyleaks Analizinden Çıkarılan Sistem Modernizasyonu
1. **Metrik Tabanlı Doğrulama (Benchmark Layer):**
   - Denetçi için $TP, TN, FP, FN$ sınıflayıcı test döngüsü oluşturulacak.
   - Yanlış Pozitif Oranı (FPR) $<\%0.2$ hedefiyle model ve prompt tuning yapılacak.
2. **Kısa Metin Guardrail'ı:**
   - 80 kelime altındaki metinlerde hata payı katlandığı için UI'da "Kısa Metin Güvenilirlik Uyarısı" verilecek.
3. **Stilometrik İnsanlaştırma:**
   - Formüller LLM'e doğrudan verilmeyecek; formüllerin ölçtüğü cümle uzunluk varyansı ($\sigma > 8$), hece ritmi ve slop kelime temizliği prompt kurallarına dönüştürülecek.

### 9.2 Turnitin Yeni Benzerlik Raporu Mimarisi
Turnitin'in yeni nesil Benzerlik Raporu (Enhanced Similarity Report) incelenmiş ve Sentience AI için şu 3 temel mimari sütun çıkarılmıştır:

#### A. 4'lü Eşleşme Grupları (Match Groups)
Turnitin ham benzerlik skoru yerine eşleşmeleri 4 akademik kategoriye ayırır:
1. **Alıntı Yapılmamış ve Tırnak İçine Alınmamış (Not Cited or Quoted):** Doğrudan intihal riski olan metin blokları (Kırmızı).
2. **Eksik Tırnak İşaretleri (Missing Quotations):** Atıf verilmiş ancak metin tırnak içine alınmayacak kadar birebir kopyalanmış (Turuncu).
3. **Eksik Atıf (Missing Citation):** Tırnak içine alınmış ancak kaynak referansı verilmeyen alıntılar (Sarı).
4. **Atıf Yapılmış ve Tırnak İçine Alınmış (Cited and Quoted):** Usulüne uygun akademik alıntı (Mavi/Yeşil - İntihal sayılmaz).

#### B. Bütünlük Bayrakları (Integrity Flags — Metin Manipülasyon Tespiti)
Turnitin'in hile girişimlerini yakalamak için kullandığı iki kritik denetim:
1. **Değiştirilen Karakterler (Replaced Characters / Homoglyph Attack):**
   - Benzerlik motorunu atlatmak için Kiril (örn. "е", "а", "о") veya Yunan alfabelerinden harf kopyalama girişimlerinin tespiti.
   - Sentience AI Denetçi motoru regex/unicode analizi ile bu manipülasyonu tespit edip doğrudan bayraklamalıdır.
2. **Gizli Metin (Hidden Text):**
   - Beyaz zemin üzerine beyaz yazı, 0-1px mikro fontlar veya benzerlik motorunu şaşırtmak için eklenen görünmez tırnak/noktalama işaretleri.

#### C. Dinamik Filtreleme ve Hariç Tutma (Exclusions)
- **Alıntıları Hariç Tut (Exclude Quotes):** Tırnak içindeki doğrulanmış metinleri genel orandan düşme.
- **Kaynakçayı Hariç Tut (Exclude Bibliography):** "Kaynakça", "References", "Bibliyografya" bölümlerini analiz dışı bırakma.
- **Küçük Eşleşmeleri Hariç Tut (Exclude Minor Matches):** Belirlenen kelime sayısı (örn. <10 kelime) veya yüzde eşiğinin (örn. <%1) altındaki tesadüfi benzerlikleri temizleme.

### 9.3 Sentience AI İçin Yol Haritası Entegrasyonu
- **Sentinel Motoru:** Sadece ham link ve genel benzerlik oranı üretmek yerine, eşleşmeleri Turnitin'deki gibi 4'lü Eşleşme Grubu (`MatchGroup`) formatında etiketlemelidir.
- **Denetçi (Auditor) Motoru:** `textFeatures.ts` veya `detectAI` içerisine "Bütünlük Bayrakları" (Homoglyph & Zero-width character tespiti) eklenmelidir.
- **Arayüz (UI):** Editörde Alıntı / Kaynakça / Küçük Eşleşmeler için tek tıkla dinamik filtreleme butonları sunulmalıdır.

---

## 10. Geliştirme İş Düzeni, Uygulama Sırası ve Veri Seti / Fine-Tuning Stratejisi

### 10.1 Uygulama Sırası ve Görev Listesi
1. **Aşama 1: Bütünlük Bayrakları (Integrity Flags — Turnitin Standardı)**
   - `src/ml/textFeatures.ts` ve `detectAI`: Kiril/Yunan harf ikamesi (homoglyph attack) ve gizli/sıfır genişlikli boşluk (zero-width characters) tespiti.
   - UI (`src/App.tsx`): Bütünlük ihlali durumunda "Manipülasyon Bayrağı (Flags)" rozeti ve açıklaması.
2. **Aşama 2: İnsanlaştırma Motoru v2 (Copyleaks Sinyal Eliminasyonu)**
   - `src/services/geminiService.ts`: Yasaklı slop ifadeler listesi ("Önemle belirtmek gerekir ki", "Bu bağlamda", "Dolayısıyla" vb.).
   - Cümle ritmi kuralı (Burstiness: ardışık benzer boyutta cümle yasağı, her 3 uzun cümleye 1 kısa cümle enjeksiyonu).
   - Türkçe deyimsel zenginlik ve doğal bağlaç zorunluluğu.
3. **Aşama 3: Sentinel 4'lü Eşleşme Grupları ve Dinamik Filtreleme**
   - `src/types/index.ts` ve `src/services/sentinelService.ts`: Eşleşmeleri 4 gruba ayırma (`not_cited_or_quoted`, `missing_quotations`, `missing_citation`, `cited_and_quoted`).
   - UI: "Alıntıları Hariç Tut", "Kaynakça Hariç Tut", "Küçük Eşleşmeleri (<10 kelime) Gizle" filtreleri ve skoru anında yeniden hesaplama.
4. **Aşama 4: Kısa Metin Guardrail'ı ve Canlı Burstiness Göstergesi**
   - 80 kelime altı metinlerde model güvensizlik uyarısı.
   - Editör analiz kartında $\sigma$ standart sapma varyans göstergesi.
5. **Aşama 5: Fine-Tuning ve 200.000+ Kaynak Veri Seti Entegrasyonu**
   - SFT (Supervised Fine-Tuning) JSONL veri seti standardizasyonu.
   - Sentinel için açık erişimli akademik indeksleme (Crossref / DergiPark API / Vektör İndeksi).

### 10.2 200.000+ Kaynak Veri Seti vs. Sentience AI Fine-Tuning Altyapısı
Turnitin gibi sistemlerin bahsettiği devasa veri havuzları ile Sentience AI'ın mimarisi arasındaki teknik ayrım:
- **Temel Model Eğitimi (Pre-training):** Turnitin, sıfırdan kendi sınıflandırıcı ağlarını eğitmek için yüz binlerce kitaba ihtiyaç duyar. Sentience AI ise Google Gemini'ın trilyonlarca kelimelik küresel ön-eğitimini (Pre-trained Foundation Model) baz alır.
- **İnce Ayar (Supervised Fine-Tuning - SFT):**
  - Projemizde `scripts/tune_model.ts` ve `App.tsx` üzerinde Gemini JSONL tuning altyapısı zaten mevcuttur.
  - LLM'e insanlaştırma ve tespit öğretmek için 200.000 kitap **gerekmez**. 200.000 kitap modelin genel bilgisidir; fine-tuning için gereken ise **1.000 - 5.000 adet filtrelenmiş, yüksek kaliteli (AI Metni $\rightarrow$ İnsanlaştırılmış Başarılı Metin)** veri çiftidir.
- **Sentinel Arama Havuzu (İndeksleme / RAG):**
  - Eğer 200.000 kaynak intihal doğrulaması için kullanılacaksa, bu modelin içine fine-tuning ile gömülmez; **Vektör Veritabanı / Arama İndeksi (Crossref, DergiPark, ULAKBİM, PubMed)** üzerinden RAG mantığıyla sorgulanır.

### 10.3 Sentience AI Fine-Tuning Veri Seti Şablonu (JSONL Formatı)
Gemini SFT API (`scripts/tune_model.ts`) ile tam uyumlu veri üretim formatı:
```json
{"contents": [{"role": "user", "parts": [{"text": "Aşağıdaki metni akademik tonda insanlaştır:\n[YZ Tarafından Üretilmiş Ham Metin]"}]}, {"role": "model", "parts": [{"text": "[Copyleaks ve Turnitin testlerinden %0 YZ skoruyla geçmiş, yüksek burstiness içeren insanlaştırılmış metin]"}]}]}
```

---

## 11. Lokal Model Fine-Tuning ve Açık Kaynak Hibrit Adaptör Mimarisi

### 11.1 Neden Lokal Açık Kaynak Fine-Tuning?
Google AI Studio'nun "Apps" mimarisine geçişiyle birlikte ücretsiz Web UI ve bağımsız programmatic tuning kapatılmıştır. Bu nedenle Sentience AI sistemi; hem bulut bağımsızlığı hem de veri gizliliği sağlamak amacıyla **Lokal Eğitilebilir Açık Kaynak Mimarisi** ile güçlendirilmiştir.

### 11.2 Üretilen Evrensel Veri Formatları (`npm run export:local`)
Platformda toplanan insanlaştırma çiftleri 3 standart açık kaynak formatına tek komutla dönüştürülür:
1. **Alpaca Formatı (`datasets/alpaca_format.json`):** Unsloth, Axolotl, LLaMA-Factory ile Llama 3.1 8B, Gemma 2 9B, Qwen 2.5 7B eğitmek için.
2. **ShareGPT Formatı (`datasets/sharegpt_format.json`):** Çok turlu konuşma formatı (FastChat, vLLM).
3. **OpenAI Chat Formatı (`datasets/openai_chat_format.jsonl`):** HuggingFace TRL `SFTTrainer` ve yerel kütüphaneler için.
4. **Ollama Modelfile (`datasets/Modelfile`):** Eğitilen LoRA veya GGUF modelini Ollama'da tek komutla servis etmek için.

### 11.3 Lokal Eğitim İş Akışı (`scripts/local_train_unsloth.py`)
- **Altyapı:** Unsloth (4-bit QLoRA) ile standart tüketici GPU'larında (8GB - 12GB VRAM) 20 dakikada fine-tuning.
- **Hedef Taban Modeller:** `Meta-Llama-3.1-8B-Instruct`, `google/gemma-2-9b-it`, `Qwen/Qwen2.5-7B-Instruct`.
- **Çıktı:** LoRA ağırlıkları veya `.gguf` formatı.

### 11.4 Sentience AI Web Sistemine Bağlama Köprüsü
Web arayüzü (`src/services/localModelService.ts` ve `geminiService.ts`), lokalde koşan OpenAI uyumlu sunucularla (Ollama `http://localhost:11434/v1`, LM Studio veya vLLM) doğrudan konuşacak şekilde yapılandırılmıştır:
- `.env.local` yapılandırması:
  ```env
  VITE_USE_LOCAL_MODEL=true
  VITE_LOCAL_MODEL_URL=http://localhost:11434/v1
  VITE_LOCAL_MODEL_NAME=sentience-humanizer:latest
  ```
- Ya da model adının başına `local:` veya `ollama:` (örn: `ollama:llama3.1:8b`) yazılarak web sistemi hiçbir kod değişikliği olmadan lokal modele yönlendirilir.




