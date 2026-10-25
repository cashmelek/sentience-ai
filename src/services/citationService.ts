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

export interface CitationChainNode {
  author: string;
  year?: string;
  pages?: string;
  role: 'root' | 'intermediate' | 'user';
  snippet?: string;
  description: string;
}

export interface CitationGenealogy {
  hasChain: boolean;
  nodes: CitationChainNode[];
  summary: string;
  recommendation: string;
}

export const parseCitationGenealogy = (
  userSentence: string,
  sourceSnippet: string
): CitationGenealogy | null => {
  const combined = `${userSentence} ${sourceSnippet}`;
  const citationRegex = /([A-ZÇĞİÖŞÜ][a-zçğıöşü]+(?:\s+ve\s+[A-ZÇĞİÖŞÜ][a-zçğıöşü]+)?)\s*\((\d{4})(?::\s*([\d\-\–]+))?\)/g;
  
  const matches: { author: string; year: string; pages?: string; inSnippet: boolean }[] = [];
  let m;

  while ((m = citationRegex.exec(sourceSnippet)) !== null) {
    matches.push({ author: m[1], year: m[2], pages: m[3], inSnippet: true });
  }

  const userMatches: { author: string; year: string; pages?: string }[] = [];
  while ((m = citationRegex.exec(userSentence)) !== null) {
    userMatches.push({ author: m[1], year: m[2], pages: m[3] });
  }

  // Filozof / anahtar düşünür tespiti (Foucault, Marx, Weber vb.)
  const thinkersRegex = /\b(Foucault|Marx|Weber|Habermas|Bourdieu|Kant|Hegel|Durkheim|Gramsci|Althusser|Heywood)\b/gi;
  const thinkerMatch = combined.match(thinkersRegex);
  const primaryThinker = thinkerMatch ? Array.from(new Set(thinkerMatch))[0] : null;

  if (matches.length === 0 && !primaryThinker) {
    return null;
  }

  const nodes: CitationChainNode[] = [];

  if (primaryThinker) {
    nodes.push({
      author: primaryThinker,
      role: 'root',
      description: 'Birincil Fikir / Teori Sahibi'
    });
  }

  // Snippet'taki alıntı (kök kaynak)
  matches.forEach(match => {
    if (!nodes.some(n => n.author.toLowerCase() === match.author.toLowerCase())) {
      nodes.push({
        author: match.author,
        year: match.year,
        pages: match.pages,
        role: nodes.length === 0 ? 'root' : 'intermediate',
        snippet: sourceSnippet.slice(0, 150),
        description: 'Kök Makale / Eser (Orijinal Alıntı)'
      });
    }
  });

  // Kullanıcının atfı (ikincil aktaran)
  userMatches.forEach(um => {
    if (!nodes.some(n => n.author.toLowerCase() === um.author.toLowerCase())) {
      nodes.push({
        author: um.author,
        year: um.year,
        pages: um.pages,
        role: 'intermediate',
        description: 'Aktaran Kaynak (Metninizdeki Atıf)'
      });
    }
  });

  nodes.push({
    author: 'Metniniz',
    role: 'user',
    description: 'Çalışmanızdaki İfade'
  });

  const rootNode = nodes.find(n => n.role === 'root') || nodes[0];
  const intermediateNode = nodes.find(n => n.role === 'intermediate');

  return {
    hasChain: nodes.length >= 2,
    nodes,
    summary: intermediateNode 
      ? `${intermediateNode.author} (${intermediateNode.year ?? ''}), bu iddiayı doğrudan ${rootNode.author}'den aktarmıştır.`
      : `${rootNode.author} kök kaynağına dayanan atıf zinciri tespit edildi.`,
    recommendation: intermediateNode
      ? `Akademik etik gereği ikincil atıf ('Aktaran: ${intermediateNode.author}') yerine doğrudan kök kaynağa ('${rootNode.author}') atıf yapılması önerilir.`
      : 'Atıf yapısı doğrulanmıştır.'
  };
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
