# Sentience AI - Geliştirme Protokolü ve Mimari Prensipler

Bu dosya, Sentience AI projesindeki çalışma şeklini, mimari sınırları ve stratejik hedefleri belirler.

## 1. Mimari Ayrım: Çekirdek (Core) ve Vitrin (Showcase)

Sentience AI, iki ana katmandan oluşur. Bu katmanlar arasındaki sınır asla ihlal edilmemelidir:

- **Çekirdek Motor (Core Engine):** `src/services/`, `src/genkit/`, `src/ml/` altındaki mevcut analiz, insanlaştırma ve YZ tespit algoritmaları. Bu bölüm "Tamamlanmış Yazılım" olarak kabul edilir. İç mantığı bozulmamalı, sadece dışarıdan çağrılmalıdır.
- **Vitrin Katmanı (Showcase Layer):** `src/components/LandingPage.tsx` gibi satış, pazarlama, üyelik ve kullanıcı karşılama arayüzleri. Tüm yeni görsel ve satış odaklı özellikler bu katmanda yaşar.

## 2. Ajan Tabanlı Sunum (Agent-Native Presentation)

Platformun teknik yetenekleri kullanıcıya "Karakter Sahibi Ajanlar" olarak pazarlanır. Kod bazında fonksiyonlar aynı kalsa da, arayüzde şu ajanlar görev yapar:

- **Auditor:** YZ Tespiti ve Risk Analizi.
- **GhostWriter:** İnsanlaştırma ve Ton Ayarlaması.
- **Sentinel:** Canlı Kaynak Doğrulama ve İntihal Denetimi.
- **StyleMaster:** Özel Tonlar ve Marka Sesi Hafızası.

## 3. Kullanıcı Deneyimi ve Satış Akışı

- **Giriş (Entry):** Kimliği doğrulanmamış kullanıcılar doğrudan Login ekranı yerine profesyonel **Landing Page**'i görmelidir.
- **Kanca (Demo):** Landing Page üzerinde kayıt gerektirmeyen sınırlı bir "Ücretsiz Deneme" kutusu bulunmalı ve bu kutu Çekirdek Motor'u (read-only) kullanmalıdır.
- **Dönüşüm (Conversion):** Demo sonrasında tam erişim için kullanıcı "Ajanları Görevlendir" (Üye Ol) butonlarına yönlendirilmelidir.

## 4. Güvenlik ve Gizlilik Mandatları

- **Admin Read-Only:** Yöneticiler asla kullanıcıların ham metinlerini (`projects` koleksiyonu) okuyamaz.
- **Zero-Hallucination:** İntihal denetiminde asla uydurma kaynak/link üretilemez. Sadece geçmiş ve en son hangi tarihi Gün, Ay, Yıl içerisinde ise ismi bilinen ve erişilebilir kaynaklar sunar.
