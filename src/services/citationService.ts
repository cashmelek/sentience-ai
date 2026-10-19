import { PlagiarismSource } from './sentinelService';
import { CitationStyle } from '../types';

export const formatCitation = (source: PlagiarismSource, style: CitationStyle = 'apa'): string => {
  const title = source.title ? source.title.trim() : 'İnternet Kaynağı';
  const url = source.url || '';
  const now = new Date();
  const dateStr = `${now.getDate()}.${now.getMonth() + 1}.${now.getFullYear()}`;

  switch (style) {
    case 'apa':
      return `${title}. (${now.getFullYear()}). Erişim adresi: ${url}`;
    case 'mla':
      return `"${title}." Web. ${dateStr}. <${url}>.`;
    case 'ieee':
      return `[Online]. Kullanılabilir: ${url}. [Erişim: ${dateStr}].`;
    default:
      return `${title} - ${url}`;
  }
};

export const buildBibliography = (sources: PlagiarismSource[], style: CitationStyle = 'apa'): string => {
  if (!sources || sources.length === 0) return '';
  
  const uniqueSources = sources.filter((s, idx, arr) => 
    s.url && arr.findIndex(item => item.url === s.url) === idx
  );

  return uniqueSources
    .map((s, idx) => {
      const formatted = formatCitation(s, style);
      return style === 'ieee' ? `[${idx + 1}] ${formatted}` : `${idx + 1}. ${formatted}`;
    })
    .join('\n');
};
