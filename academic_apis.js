/**
 * Akademik Veri ve Makale API Listesi
 * Açık kaynaklı ve ücretsiz hizmet veren alternatif platformlar
 */

const academicApis = [
  {
    name: "OpenAlex API",
    purpose: "Geniş kapsamlı yazar, kurum ve makale analizi",
    coverage: "250 milyondan fazla akademik çalışma, yazar, kurum ve dergi verisi",
    apiKeyRequired: false,
    isOpenData: true,
    documentationUrl: "https://docs.openalex.org"
  },
  {
    name: "Crossref REST API",
    purpose: "DOI tabanlı resmi meta veri sorgulama",
    coverage: "150 milyondan fazla hakemli makale, kitap ve bildiri meta verisi",
    apiKeyRequired: false,
    isOpenData: true,
    documentationUrl: "https://api.crossref.org"
  },
  {
    name: "OpenCitations Index API",
    purpose: "Makaleler arası atıf ağlarını haritalandırma (Citation Networks)",
    coverage: "Milyonlarca makalenin birbirine yaptığı açık atıf verileri (CC0)",
    apiKeyRequired: false,
    isOpenData: true,
    documentationUrl: "https://api.opencitations.net/index"
  },
  {
    name: "CORE API",
    purpose: "Makalelerin tam metnine (Full-text) ve PDF bağlantılarına erişim",
    coverage: "450 milyondan fazla makale özeti ve 57 milyondan fazla tam metin doküman",
    apiKeyRequired: true, // Ücretsiz plan için API Key zorunlu
    isOpenData: true,
    documentationUrl: "https://core.ac.uk/services/api"
  },
  {
    name: "arXiv API",
    purpose: "Teknik ve fen bilimleri (Bilgisayar, Fizik, Yapay Zeka vb.) ön baskı makaleleri",
    coverage: "Milyonlarca güncel bilimsel makale ve ön baskı (preprint)",
    apiKeyRequired: false,
    isOpenData: true,
    documentationUrl: "https://info.arxiv.org/help/api"
  },
  {
    name: "ORCID Public API",
    purpose: "Akademisyen, araştırmacı kimliği ve yayın kayıtlarının doğrulanması",
    coverage: "18 milyondan fazla araştırmacı kaydı, bağlı makaleler ve eserler",
    apiKeyRequired: false,
    isOpenData: true,
    documentationUrl: "https://pub.orcid.org/v3.0"
  },
  {
    name: "Google Scholar / SerpAPI / Academic CSE",
    purpose: "Google Akademik indeksinde alıntı, atıf ve tam metin araması",
    coverage: "Dünyanın en kapsamlı akademik arama motoru indeksi",
    apiKeyRequired: true,
    isOpenData: false,
    documentationUrl: "https://scholar.google.com"
  }
];

// Listeyi dışa aktar (Node.js veya ES Modules ile kullanılabilir)
if (typeof module !== "undefined" && module.exports) {
  module.exports = academicApis;
} else {
  console.log("Akademik API'ler başarıyla yüklendi:", academicApis);
}
