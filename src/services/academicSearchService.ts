/**
 * Sentience AI - Akademik Veri ve Makale Arama Servisi
 *
 * OpenAlex, Crossref, ORCID, arXiv ve Google Scholar (CSE) açık API entegrasyonları.
 * Sıfır Halüsinasyon (Zero-Hallucination) prensibine göre doğrulanmış akademik meta verileri çeker.
 */

import { apiKeyManager } from './apiKeyManager';

export interface AcademicSearchResult {
  title: string;
  url: string;
  snippet: string;
  author?: string;
  year?: number | string;
  doi?: string;
  source: 'openalex' | 'crossref' | 'orcid' | 'arxiv' | 'scholar' | 'dergipark' | 'core' | 'opencitations' | 'europepmc' | 'semanticscholar';
  citationCount?: number;
}

export class AcademicSearchService {
  /**
   * OpenAlex REST API: 250M+ makale, anahtarsız ve ücretsiz.
   */
  public static async searchOpenAlex(query: string, limit: number = 3): Promise<AcademicSearchResult[]> {
    try {
      const alexKey = apiKeyManager.getOpenAlexKey();
      const clean = encodeURIComponent(query.trim().slice(0, 100));
      const keyParam = alexKey ? `&api_key=${encodeURIComponent(alexKey)}` : '';
      const res = await fetch(`https://api.openalex.org/works?search=${clean}&per-page=${limit}${keyParam}`, {
        headers: { 'User-Agent': 'SentienceAI-AcademicVerifier/1.0 (mailto:admin@sentience.ai)' }
      });
      if (!res.ok) return [];
      const data = await res.json();
      const results: AcademicSearchResult[] = [];

      for (const item of (data.results || [])) {
        const title = item.display_name || item.title || '';
        const url = item.doi ? item.doi : (item.primary_location?.landing_page_url || item.id || '');
        if (!url || !title) continue;

        let snippet = '';
        if (item.abstract_inverted_index) {
          snippet = this.reconstructInvertedIndex(item.abstract_inverted_index).slice(0, 300);
        } else {
          snippet = `${title}. Yıl: ${item.publication_year || 'Bilinmiyor'}, Atıf: ${item.cited_by_count || 0}`;
        }

        const author = item.authorships?.[0]?.author?.display_name || undefined;

        results.push({
          title,
          url,
          snippet,
          author,
          year: item.publication_year,
          doi: item.doi,
          source: 'openalex',
          citationCount: item.cited_by_count
        });
      }
      return results;
    } catch (err) {
      console.warn('[AcademicSearch] OpenAlex hatası:', err);
      return [];
    }
  }

  /**
   * Crossref REST API: 150M+ resmi DOI meta verisi.
   */
  public static async searchCrossref(query: string, limit: number = 3): Promise<AcademicSearchResult[]> {
    try {
      const clean = encodeURIComponent(query.trim().slice(0, 100));
      const res = await fetch(`https://api.crossref.org/works?query=${clean}&rows=${limit}`, {
        headers: { 'User-Agent': 'SentienceAI-AcademicVerifier/1.0 (mailto:admin@sentience.ai)' }
      });
      if (!res.ok) return [];
      const data = await res.json();
      const items = data.message?.items || [];
      const results: AcademicSearchResult[] = [];

      for (const item of items) {
        const title = item.title?.[0] || '';
        const url = item.URL || (item.DOI ? `https://doi.org/${item.DOI}` : '');
        if (!url || !title) continue;

        const author = item.author?.[0] ? `${item.author[0].family || ''} ${item.author[0].given || ''}`.trim() : undefined;
        const year = item.issued?.['date-parts']?.[0]?.[0];
        const snippet = item.abstract ? item.abstract.replace(/<[^>]+>/g, '').slice(0, 300) : `${title}. DOI: ${item.DOI || ''}`;

        results.push({
          title,
          url,
          snippet,
          author,
          year,
          doi: item.DOI,
          source: 'crossref',
          citationCount: item['is-referenced-by-count']
        });
      }
      return results;
    } catch (err) {
      console.warn('[AcademicSearch] Crossref hatası:', err);
      return [];
    }
  }

  /**
   * ORCID Public API: Yazar ve araştırmacı doğrulaması.
   */
  public static async searchOrcid(authorName: string): Promise<AcademicSearchResult[]> {
    try {
      const clean = encodeURIComponent(authorName.trim());
      const res = await fetch(`https://pub.orcid.org/v3.0/expanded-search/?q=${clean}&rows=2`, {
        headers: { 'Accept': 'application/json' }
      });
      if (!res.ok) return [];
      const data = await res.json();
      const expanded = data['expanded-result'] || [];
      return expanded.map((item: any) => ({
        title: `ORCID Araştırmacı Profili: ${item['given-names'] || ''} ${item['family-names'] || ''}`.trim(),
        url: `https://orcid.org/${item['orcid-id']}`,
        snippet: `Kurum: ${item['institution-name']?.[0] || 'Belirtilmemiş'}, ORCID iD: ${item['orcid-id']}`,
        author: `${item['given-names'] || ''} ${item['family-names'] || ''}`.trim(),
        source: 'orcid'
      }));
    } catch (err) {
      console.warn('[AcademicSearch] ORCID hatası:', err);
      return [];
    }
  }

  /**
   * Google Scholar uyumlu Academic CSE / Custom Search araması
   */
  public static async searchScholarCSE(query: string, limit: number = 3): Promise<AcademicSearchResult[]> {
    const key = apiKeyManager.getSearchKey();
    const engineId = import.meta.env.VITE_GOOGLE_SEARCH_ENGINE_ID;
    if (!key || !engineId) return [];

    try {
      const clean = encodeURIComponent(`site:scholar.google.com OR site:dergipark.org.tr "${query.slice(0, 80)}"`);
      const res = await fetch(`https://www.googleapis.com/customsearch/v1?key=${key}&cx=${engineId}&q=${clean}&num=${limit}`);
      if (!res.ok) return [];
      const data = await res.json();
      return (data.items || []).map((item: any) => ({
        title: item.title || 'Google Scholar Kaynağı',
        url: item.link || '',
        snippet: item.snippet || '',
        source: 'scholar'
      }));
    } catch (err) {
      console.warn('[AcademicSearch] Scholar CSE hatası:', err);
      return [];
    }
  }

  /**
   * DergiPark & YÖK Tez Yerel Akademik Taraması (Türkiye odaklı hakemli dergiler)
   */
  public static async searchDergiPark(query: string, limit: number = 3): Promise<AcademicSearchResult[]> {
    const key = apiKeyManager.getSearchKey();
    const engineId = import.meta.env.VITE_GOOGLE_SEARCH_ENGINE_ID;
    if (!key || !engineId) return [];

    try {
      const clean = encodeURIComponent(`site:dergipark.org.tr OR site:tez.yok.gov.tr "${query.slice(0, 80)}"`);
      const res = await fetch(`https://www.googleapis.com/customsearch/v1?key=${key}&cx=${engineId}&q=${clean}&num=${limit}&lr=lang_tr`);
      if (!res.ok) return [];
      const data = await res.json();
      return (data.items || []).map((item: any) => ({
        title: item.title || 'DergiPark Akademik Makalesi',
        url: item.link || '',
        snippet: item.snippet || '',
        source: 'dergipark'
      }));
    } catch (err) {
      console.warn('[AcademicSearch] DergiPark araması hatası:', err);
      return [];
    }
  }

  /**
   * CORE API: Açık Erişim Tam Metin Makaleler (Opsiyonel API Anahtarlı veya Kamu Erişimi)
   */
  public static async searchCore(query: string, apiKey?: string, limit: number = 3): Promise<AcademicSearchResult[]> {
    try {
      const clean = encodeURIComponent(query.slice(0, 100));
      const headers: Record<string, string> = { 'Accept': 'application/json' };
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

      const res = await fetch(`https://api.core.ac.uk/v3/search/works?q=${clean}&limit=${limit}`, { headers });
      if (!res.ok) return [];
      const data = await res.json();
      const results: AcademicSearchResult[] = [];

      for (const item of (data.results || [])) {
        results.push({
          title: item.title || 'CORE Açık Erişim Makalesi',
          url: item.downloadUrl || item.sourceFulltextUrls?.[0] || `https://core.ac.uk/works/${item.id}`,
          snippet: item.abstract || `${item.title}. CORE İndeksi.`,
          author: item.authors?.[0]?.name,
          year: item.yearPublished,
          doi: item.doi,
          source: 'core'
        });
      }
      return results;
    } catch (err) {
      console.warn('[AcademicSearch] CORE araması hatası:', err);
      return [];
    }
  }

  /**
   * Europe PMC & PubMed REST API: Biyomedikal ve sağlık bilimleri arşivi.
   */
  public static async searchEuropePMC(query: string, limit: number = 3): Promise<AcademicSearchResult[]> {
    try {
      const clean = encodeURIComponent(query.trim().slice(0, 100));
      const res = await fetch(`https://europepmc.org/RestAPI/v1/search?query=${clean}&format=json&pageSize=${limit}`, {
        headers: { 'Accept': 'application/json' }
      });
      if (!res.ok) return [];
      const data = await res.json();
      const results: AcademicSearchResult[] = [];

      for (const item of (data.resultList?.result || [])) {
        const title = item.title ? item.title.replace(/\.$/, '').trim() : '';
        const url = item.doi ? `https://doi.org/${item.doi}` : (item.pmid ? `https://europepmc.org/article/MED/${item.pmid}` : '');
        if (!url || !title) continue;

        const snippet = item.abstractText
          ? item.abstractText.slice(0, 300)
          : `${title}. Kaynak: ${item.journalTitle || 'Europe PMC'}, Yıl: ${item.pubYear || 'Bilinmiyor'}`;

        results.push({
          title,
          url,
          snippet,
          author: item.authorString,
          year: item.pubYear,
          doi: item.doi,
          source: 'europepmc',
          citationCount: item.citedByCount
        });
      }
      return results;
    } catch (err) {
      console.warn('[AcademicSearch] Europe PMC hatası:', err);
      return [];
    }
  }

  /**
   * Semantic Scholar REST API: Yapay zeka ve bilgisayar bilimleri atıf grafiği.
   */
  public static async searchSemanticScholar(query: string, limit: number = 3): Promise<AcademicSearchResult[]> {
    try {
      const clean = encodeURIComponent(query.trim().slice(0, 100));
      const res = await fetch(`https://api.semanticscholar.org/graph/v1/paper/search?query=${clean}&limit=${limit}&fields=title,url,abstract,year,authors,citationCount,externalIds`, {
        headers: { 'Accept': 'application/json' }
      });
      if (!res.ok) return [];
      const data = await res.json();
      const results: AcademicSearchResult[] = [];

      for (const item of (data.data || [])) {
        const title = item.title || '';
        const doi = item.externalIds?.DOI;
        const url = doi ? `https://doi.org/${doi}` : (item.url || '');
        if (!url || !title) continue;

        const snippet = item.abstract
          ? item.abstract.slice(0, 300)
          : `${title}. Yıl: ${item.year || 'Bilinmiyor'}, Atıf: ${item.citationCount || 0}`;

        const author = item.authors?.[0]?.name;

        results.push({
          title,
          url,
          snippet,
          author,
          year: item.year,
          doi,
          source: 'semanticscholar',
          citationCount: item.citationCount
        });
      }
      return results;
    } catch (err) {
      console.warn('[AcademicSearch] Semantic Scholar hatası:', err);
      return [];
    }
  }

  /**
   * arXiv REST API: Hakem öncesi ön baskı (preprint) makale arşivi.
   */
  public static async searchArXiv(query: string, limit: number = 3): Promise<AcademicSearchResult[]> {
    try {
      const clean = encodeURIComponent(query.trim().slice(0, 100));
      const res = await fetch(`https://export.arxiv.org/api/query?search_query=all:${clean}&max_results=${limit}`);
      if (!res.ok) return [];
      const xmlText = await res.text();
      const results: AcademicSearchResult[] = [];

      const entries = xmlText.split(/<entry[\s>]/i).slice(1);
      for (const entry of entries) {
        const titleMatch = entry.match(/<title[\s>]([\s\S]*?)<\/title>/i);
        const idMatch = entry.match(/<id[\s>]([\s\S]*?)<\/id>/i);
        const summaryMatch = entry.match(/<summary[\s>]([\s\S]*?)<\/summary>/i);
        const authorMatch = entry.match(/<author>[\s\S]*?<name[\s>]([\s\S]*?)<\/name>/i);
        const publishedMatch = entry.match(/<published[\s>]([\s\S]*?)<\/published>/i);
        const doiMatch = entry.match(/<arxiv:doi[\s>]([\s\S]*?)<\/arxiv:doi>/i);

        const title = titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : '';
        const url = idMatch ? idMatch[1].trim() : '';
        if (!title || !url) continue;

        const snippet = summaryMatch
          ? summaryMatch[1].replace(/\s+/g, ' ').trim().slice(0, 300)
          : `${title}. arXiv ön baskı kaydı.`;

        const year = publishedMatch ? publishedMatch[1].slice(0, 4) : undefined;
        const author = authorMatch ? authorMatch[1].trim() : undefined;
        const doi = doiMatch ? doiMatch[1].trim() : undefined;

        results.push({
          title,
          url,
          snippet,
          author,
          year,
          doi,
          source: 'arxiv'
        });
      }
      return results;
    } catch (err) {
      console.warn('[AcademicSearch] arXiv hatası:', err);
      return [];
    }
  }

  /**
   * Tüm akademik havuzlarda eş zamanlı tarama yapar (Yerli DergiPark öncelikli).
   */
  public static async multiAcademicSearch(query: string, coreApiKey?: string): Promise<AcademicSearchResult[]> {
    const isTurkishText = /[çğıöşüÇĞİÖŞÜ]/.test(query);

    const promises: Promise<AcademicSearchResult[]>[] = [
      this.searchOpenAlex(query, 2),
      this.searchCrossref(query, 2),
      this.searchEuropePMC(query, 2),
      this.searchSemanticScholar(query, 2),
      this.searchArXiv(query, 2),
      this.searchScholarCSE(query, 2)
    ];

    if (isTurkishText) {
      promises.unshift(this.searchDergiPark(query, 3));
    }

    const activeCoreKey = coreApiKey || apiKeyManager.getCoreKey();
    if (activeCoreKey) {
      promises.push(this.searchCore(query, activeCoreKey, 2));
    }

    const results = await Promise.all(promises);
    return results.flat();
  }

  /**
   * OpenCitations API: DOI bazlı atıf soy kütüğü (References & Citations).
   */
  public static async fetchOpenCitationsChain(doi: string): Promise<{
    references: string[];
    citations: string[];
    citationCount: number;
  }> {
    const cleanDoi = doi.replace(/^(https?:\/\/doi\.org\/|doi:)/i, '').trim();
    if (!cleanDoi) return { references: [], citations: [], citationCount: 0 };
    const formattedDoi = `doi:${cleanDoi}`;

    const token = apiKeyManager.getOpenCitationsKey();
    const headers: Record<string, string> = { 'Accept': 'application/json' };
    if (token) headers['authorization'] = token;

    try {
      const [refsRes, citsRes, countRes] = await Promise.all([
        fetch(`https://api.opencitations.net/index/v2/references/${encodeURIComponent(formattedDoi)}`, { headers }).catch(() => null),
        fetch(`https://api.opencitations.net/index/v2/citations/${encodeURIComponent(formattedDoi)}`, { headers }).catch(() => null),
        fetch(`https://api.opencitations.net/index/v2/citation-count/${encodeURIComponent(formattedDoi)}`, { headers }).catch(() => null)
      ]);

      const references: string[] = [];
      if (refsRes && refsRes.ok) {
        const refsData = await refsRes.json().catch(() => []);
        if (Array.isArray(refsData)) {
          refsData.slice(0, 10).forEach((item: any) => {
            if (item.cited) references.push(item.cited);
          });
        }
      }

      const citations: string[] = [];
      if (citsRes && citsRes.ok) {
        const citsData = await citsRes.json().catch(() => []);
        if (Array.isArray(citsData)) {
          citsData.slice(0, 10).forEach((item: any) => {
            if (item.citing) citations.push(item.citing);
          });
        }
      }

      let citationCount = 0;
      if (countRes && countRes.ok) {
        const countData = await countRes.json().catch(() => []);
        if (Array.isArray(countData) && countData[0]?.count) {
          citationCount = parseInt(countData[0].count, 10) || 0;
        }
      }

      return { references, citations, citationCount: citationCount || citations.length };
    } catch (err) {
      console.warn('[AcademicSearch] OpenCitations hatası:', err);
      return { references: [], citations: [], citationCount: 0 };
    }
  }

  /**
   * OpenCitations Meta API (v1): DOI üzerinden doğrudan başlık, yazar ve yayın yılı çeker.
   */
  public static async fetchOpenCitationsMetadata(doi: string): Promise<{
    title?: string;
    authors?: string[];
    year?: string;
    venue?: string;
  } | null> {
    const cleanDoi = doi.replace(/^(https?:\/\/doi\.org\/|doi:)/i, '').trim();
    if (!cleanDoi) return null;

    const token = apiKeyManager.getOpenCitationsKey();
    const headers: Record<string, string> = { 'Accept': 'application/json' };
    if (token) headers['authorization'] = token;

    try {
      const res = await fetch(`https://api.opencitations.net/meta/v1/metadata/doi:${encodeURIComponent(cleanDoi)}`, { headers });
      if (!res.ok) return null;
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) return null;

      const item = data[0];
      const authors = item.author ? item.author.split('__').map((a: string) => a.replace(/\[.*?\]/g, '').trim()) : [];
      return {
        title: item.title,
        authors,
        year: item.pub_date ? item.pub_date.slice(0, 4) : undefined,
        venue: item.venue ? item.venue.replace(/\[.*?\]/g, '').trim() : undefined
      };
    } catch {
      return null;
    }
  }

  private static reconstructInvertedIndex(invertedIndex: Record<string, number[]>): string {
    const wordPositions: { word: string; pos: number }[] = [];
    for (const [word, positions] of Object.entries(invertedIndex)) {
      positions.forEach(pos => wordPositions.push({ word, pos }));
    }
    wordPositions.sort((a, b) => a.pos - b.pos);
    return wordPositions.map(w => w.word).join(' ');
  }
}
