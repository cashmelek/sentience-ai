import { describe, it, expect } from 'vitest';
import { formatCitation, parseCitationGenealogy, buildBibliography } from '../services/citationService';
import type { PlagiarismSource } from '../services/sentinelService';

describe('citationService', () => {
  describe('formatCitation', () => {
    it('should format correctly as APA style (default)', () => {
      const source: PlagiarismSource = {
        title: 'Akademik Dürüstlük',
        url: 'https://example.com/akademik',
        snippet: '',
        matchedText: '',
        matchGroup: 'exact' as any,
      };
      const result = formatCitation(source);
      const year = new Date().getFullYear();
      expect(result).toBe(`Akademik Dürüstlük. (${year}). Erişim adresi: https://example.com/akademik`);
    });

    it('should format correctly as MLA style', () => {
      const source: PlagiarismSource = {
        title: 'Akademik Dürüstlük',
        url: 'https://example.com/akademik',
        snippet: '',
        matchedText: '',
        matchGroup: 'exact' as any,
      };
      const result = formatCitation(source, 'mla');
      const now = new Date();
      const dateStr = `${now.getDate()}.${now.getMonth() + 1}.${now.getFullYear()}`;
      expect(result).toBe(`"Akademik Dürüstlük." Web. ${dateStr}. <https://example.com/akademik>.`);
    });

    it('should format correctly as IEEE style', () => {
      const source: PlagiarismSource = {
        title: 'Akademik Dürüstlük',
        url: 'https://example.com/akademik',
        snippet: '',
        matchedText: '',
        matchGroup: 'exact' as any,
      };
      const result = formatCitation(source, 'ieee');
      const now = new Date();
      const dateStr = `${now.getDate()}.${now.getMonth() + 1}.${now.getFullYear()}`;
      expect(result).toBe(`[Online]. Kullanılabilir: https://example.com/akademik. [Erişim: ${dateStr}].`);
    });

    it('should fallback to default title if title is missing', () => {
      const source: PlagiarismSource = {
        title: '',
        url: 'https://example.com/akademik',
        snippet: '',
        matchedText: '',
        matchGroup: 'exact' as any,
      };
      const result = formatCitation(source);
      const year = new Date().getFullYear();
      expect(result).toBe(`İnternet Kaynağı. (${year}). Erişim adresi: https://example.com/akademik`);
    });
  });

  describe('parseCitationGenealogy', () => {
    it('should detect valid citation chain', () => {
      const userSentence = 'Bu bağlamda Yılmaz (2020) önemli bulgular sunmuştur.';
      const sourceSnippet = 'Kaya (2018) tarafından belirtildiği gibi temel prensipler tartışılmıştır.';

      const result = parseCitationGenealogy(userSentence, sourceSnippet);

      expect(result).not.toBeNull();
      expect(result?.hasChain).toBe(true);
      expect(result?.nodes.length).toBeGreaterThanOrEqual(2);
      expect(result?.nodes.some(n => n.author === 'Kaya' && n.year === '2018')).toBe(true);
      expect(result?.nodes.some(n => n.author === 'Yılmaz' && n.year === '2020')).toBe(true);
      expect(result?.nodes.some(n => n.role === 'user')).toBe(true);
    });

    it('should return null when no citations or primary thinkers are found', () => {
      const userSentence = 'Bu sadece normal bir cümledir.';
      const sourceSnippet = 'Herhangi bir atıf içermeyen kaynak metin.';

      const result = parseCitationGenealogy(userSentence, sourceSnippet);
      expect(result).toBeNull();
    });

    it('should detect primary thinkers without formal year citation', () => {
      const userSentence = 'Marksist teoriye göre...';
      const sourceSnippet = 'Marx kapitalizmi eleştirmiştir.';

      const result = parseCitationGenealogy(userSentence, sourceSnippet);

      expect(result).not.toBeNull();
      expect(result?.nodes.some(n => n.author === 'Marx' && n.role === 'root')).toBe(true);
    });
  });

  describe('buildBibliography', () => {
    it('should return empty string for empty sources array', () => {
      const result = buildBibliography([]);
      expect(result).toBe('');
    });

    it('should format multiple unique sources', () => {
      const sources: PlagiarismSource[] = [
        { title: 'Kaynak 1', url: 'https://example.com/1', snippet: '', matchedText: '', matchGroup: 'exact' as any },
        { title: 'Kaynak 2', url: 'https://example.com/2', snippet: '', matchedText: '', matchGroup: 'exact' as any },
      ];

      const result = buildBibliography(sources, 'apa');

      expect(result).toContain('1. Kaynak 1.');
      expect(result).toContain('2. Kaynak 2.');
    });

    it('should filter duplicate urls', () => {
      const sources: PlagiarismSource[] = [
        { title: 'Kaynak 1', url: 'https://example.com/1', snippet: '', matchedText: '', matchGroup: 'exact' as any },
        { title: 'Kaynak 1 Tekrar', url: 'https://example.com/1', snippet: '', matchedText: '', matchGroup: 'exact' as any },
        { title: 'Kaynak 2', url: 'https://example.com/2', snippet: '', matchedText: '', matchGroup: 'exact' as any },
      ];

      const result = buildBibliography(sources, 'apa');

      expect(result).toContain('1. Kaynak 1.');
      expect(result).not.toContain('Kaynak 1 Tekrar');
      expect(result).toContain('2. Kaynak 2.');

      // Should have 2 lines
      expect(result.split('\n').length).toBe(2);
    });

    it('should format as IEEE with brackets numbering', () => {
      const sources: PlagiarismSource[] = [
        { title: 'Kaynak 1', url: 'https://example.com/1', snippet: '', matchedText: '', matchGroup: 'exact' as any },
        { title: 'Kaynak 2', url: 'https://example.com/2', snippet: '', matchedText: '', matchGroup: 'exact' as any },
      ];

      const result = buildBibliography(sources, 'ieee');

      expect(result).toContain('[1]');
      expect(result).toContain('[2]');
    });
  });
});
