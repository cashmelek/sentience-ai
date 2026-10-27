import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { formatCitation, parseCitationGenealogy, buildBibliography } from '../services/citationService';
import { PlagiarismSource } from '../services/sentinelService';

describe('citationService', () => {
  beforeAll(() => {
    // Sabit bir tarih döndürmesi için Date mocklanıyor
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2023-10-27T09:00:00.000Z'));
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  describe('formatCitation', () => {
    const mockSource: PlagiarismSource = {
      url: 'https://example.com/article',
      title: 'Example Academic Article',
      snippet: 'This is a snippet.',
      matchedText: 'This is a snippet.',
      matchGroup: 'web'
    };

    it('should format citation in APA style correctly', () => {
      const result = formatCitation(mockSource, 'apa');
      expect(result).toBe('Example Academic Article. (2023). Erişim adresi: https://example.com/article');
    });

    it('should format citation in MLA style correctly', () => {
      const result = formatCitation(mockSource, 'mla');
      expect(result).toBe('"Example Academic Article." Web. 27.10.2023. <https://example.com/article>.');
    });

    it('should format citation in IEEE style correctly', () => {
      const result = formatCitation(mockSource, 'ieee');
      expect(result).toBe('[Online]. Kullanılabilir: https://example.com/article. [Erişim: 27.10.2023].');
    });

    it('should handle missing title gracefully', () => {
      const sourceWithoutTitle: PlagiarismSource = {
        url: 'https://example.com/no-title',
        title: '',
        snippet: 'Snippet without title.',
        matchedText: 'Snippet without title.',
        matchGroup: 'web'
      };
      const result = formatCitation(sourceWithoutTitle, 'apa');
      expect(result).toBe('İnternet Kaynağı. (2023). Erişim adresi: https://example.com/no-title');
    });
  });

  describe('parseCitationGenealogy', () => {
    it('should parse citation genealogy correctly when there is a valid citation chain', () => {
      const userSentence = 'Bu durum toplumun yapısını etkiler Yılmaz (2021).';
      const sourceSnippet = 'Toplumsal yapılar zamanla değişir Foucault (1978: 45). Bu durum toplumun yapısını etkiler.';

      const result = parseCitationGenealogy(userSentence, sourceSnippet);

      expect(result).not.toBeNull();
      expect(result?.hasChain).toBe(true);
      expect(result?.nodes.length).toBeGreaterThanOrEqual(3);
      expect(result?.nodes.some(n => n.author === 'Foucault')).toBe(true);
      expect(result?.nodes.some(n => n.author === 'Yılmaz')).toBe(true);
    });

    it('should return null when no citation or primary thinker is found', () => {
      const userSentence = 'Bu sadece normal bir cümledir.';
      const sourceSnippet = 'Burada herhangi bir atıf veya filozof yok.';

      const result = parseCitationGenealogy(userSentence, sourceSnippet);

      expect(result).toBeNull();
    });
  });

  describe('buildBibliography', () => {
    it('should build bibliography and remove duplicates', () => {
      const sources: PlagiarismSource[] = [
        {
          url: 'https://example.com/a',
          title: 'Article A',
          snippet: 'Snippet A',
          matchedText: 'Matched A',
          matchGroup: 'web'
        },
        {
          url: 'https://example.com/a', // Duplicate URL
          title: 'Article A Duplicate',
          snippet: 'Snippet A2',
          matchedText: 'Matched A2',
          matchGroup: 'web'
        },
        {
          url: 'https://example.com/b',
          title: 'Article B',
          snippet: 'Snippet B',
          matchedText: 'Matched B',
          matchGroup: 'web'
        }
      ];

      const result = buildBibliography(sources, 'apa');
      const lines = result.split('\n');

      expect(lines.length).toBe(2);
      expect(lines[0]).toContain('Article A');
      expect(lines[1]).toContain('Article B');
      expect(result).not.toContain('Article A Duplicate');
    });

    it('should return empty string if sources are empty', () => {
      const result = buildBibliography([], 'apa');
      expect(result).toBe('');
    });
  });
});
