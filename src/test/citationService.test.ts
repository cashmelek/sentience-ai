import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatCitation,
  parseCitationGenealogy,
  buildBibliography
} from '../services/citationService';
import { PlagiarismSource } from '../services/sentinelService';

describe('citationService', () => {
  beforeEach(() => {
    // Mock the current date to ensure consistent date strings in citations
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2023-10-31T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('formatCitation', () => {
    it('should format citation correctly using APA style (default)', () => {
      const source: PlagiarismSource = {
        title: ' Example Academic Paper ',
        url: 'https://example.com/paper',
        snippet: '',
        matchedText: '',
        matchGroup: 'direct'
      };

      const result = formatCitation(source);
      expect(result).toBe('Example Academic Paper. (2023). Erişim adresi: https://example.com/paper');
    });

    it('should format citation correctly using MLA style', () => {
      const source: PlagiarismSource = {
        title: 'Example Academic Paper',
        url: 'https://example.com/paper',
        snippet: '',
        matchedText: '',
        matchGroup: 'direct'
      };

      const result = formatCitation(source, 'mla');
      expect(result).toBe('"Example Academic Paper." Web. 31.10.2023. <https://example.com/paper>.');
    });

    it('should format citation correctly using IEEE style', () => {
      const source: PlagiarismSource = {
        title: 'Example Academic Paper',
        url: 'https://example.com/paper',
        snippet: '',
        matchedText: '',
        matchGroup: 'direct'
      };

      const result = formatCitation(source, 'ieee');
      expect(result).toBe('[Online]. Kullanılabilir: https://example.com/paper. [Erişim: 31.10.2023].');
    });

    it('should handle missing title by defaulting to "İnternet Kaynağı"', () => {
      const source: PlagiarismSource = {
        title: '',
        url: 'https://example.com',
        snippet: '',
        matchedText: '',
        matchGroup: 'direct'
      };

      const result = formatCitation(source);
      expect(result).toBe('İnternet Kaynağı. (2023). Erişim adresi: https://example.com');
    });

    it('should handle missing url', () => {
      const source: PlagiarismSource = {
        title: 'No URL Paper',
        url: '',
        snippet: '',
        matchedText: '',
        matchGroup: 'direct'
      };

      const result = formatCitation(source);
      expect(result).toBe('No URL Paper. (2023). Erişim adresi: ');
    });
  });

  describe('parseCitationGenealogy', () => {
    it('should detect primary thinkers from text', () => {
      const result = parseCitationGenealogy('Bu teori Foucault tarafından ele alınmıştır.', '');
      expect(result).not.toBeNull();
      expect(result?.nodes.length).toBeGreaterThan(0);
      expect(result?.nodes[0].author).toBe('Foucault');
      expect(result?.nodes[0].role).toBe('root');
    });

    it('should return null if no citations or thinkers are found', () => {
      const result = parseCitationGenealogy('Bu sıradan bir cümledir.', 'Bu da sıradan bir kaynaktır.');
      expect(result).toBeNull();
    });

    it('should build citation chain correctly for intermediate citations', () => {
      const userSentence = 'Yılmaz (2023) bu durumu açıklamıştır.';
      const sourceSnippet = 'Kaya (2010) çalışmasında bahsetmiştir. Yılmaz (2023) bunu aktarır.';

      const result = parseCitationGenealogy(userSentence, sourceSnippet);

      expect(result).not.toBeNull();
      expect(result?.hasChain).toBe(true);
      expect(result?.nodes.some(n => n.author === 'Kaya' && n.role === 'root')).toBe(true);
      expect(result?.nodes.some(n => n.author === 'Yılmaz' && n.role === 'intermediate')).toBe(true);
      expect(result?.nodes.some(n => n.role === 'user')).toBe(true);
      expect(result?.recommendation).toContain('doğrudan kök kaynağa');
    });

    it('should correctly parse citation with pages', () => {
      const sourceSnippet = 'Demir (2020: 15-20) bu konuyu tartışmıştır.';
      const result = parseCitationGenealogy('', sourceSnippet);

      expect(result).not.toBeNull();
      expect(result?.nodes.find(n => n.author === 'Demir')?.pages).toBe('15-20');
    });

    it('should handle multiple authors correctly', () => {
      const sourceSnippet = 'Yılmaz ve Kaya (2015) bu çalışmayı yapmıştır.';
      const result = parseCitationGenealogy('', sourceSnippet);

      expect(result).not.toBeNull();
      expect(result?.nodes.find(n => n.author === 'Yılmaz ve Kaya')?.year).toBe('2015');
    });
  });

  describe('buildBibliography', () => {
    it('should return empty string for empty sources', () => {
      expect(buildBibliography([])).toBe('');
    });

    it('should filter out duplicate URLs and build bibliography', () => {
      const sources: PlagiarismSource[] = [
        { title: 'Source 1', url: 'https://example.com/1', snippet: '', matchedText: '', matchGroup: 'direct' },
        { title: 'Source 1 Dup', url: 'https://example.com/1', snippet: '', matchedText: '', matchGroup: 'direct' },
        { title: 'Source 2', url: 'https://example.com/2', snippet: '', matchedText: '', matchGroup: 'direct' },
      ];

      const result = buildBibliography(sources, 'apa');
      const lines = result.split('\n');

      expect(lines.length).toBe(2);
      expect(lines[0]).toMatch(/^1\.\sSource 1/);
      expect(lines[1]).toMatch(/^2\.\sSource 2/);
    });

    it('should format IEEE style with bracketed numbers', () => {
      const sources: PlagiarismSource[] = [
        { title: 'Source', url: 'https://example.com', snippet: '', matchedText: '', matchGroup: 'direct' },
      ];

      const result = buildBibliography(sources, 'ieee');
      expect(result).toMatch(/^\[1\]\s\[Online\]/);
    });
  });
});
