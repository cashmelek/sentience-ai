import React from 'react';

interface DiffViewProps {
  original: string;
  humanized: string;
}

export const DiffView: React.FC<DiffViewProps> = ({ original, humanized }) => {
  const originalWords = original.split(/(\s+)/);
  const humanizedWords = humanized.split(/(\s+)/);

  const lcs = (a: string[], b: string[]) => {
    const m = a.length, n = b.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 1; i <= m; i++)
      for (let j = 1; j <= n; j++)
        dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    const result: { word: string; type: 'same' | 'add' | 'remove' }[] = [];
    let i = m, j = n;
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
        result.unshift({ word: a[i - 1], type: 'same' });
        i--;
        j--;
      } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
        result.unshift({ word: b[j - 1], type: 'add' });
        j--;
      } else {
        result.unshift({ word: a[i - 1], type: 'remove' });
        i--;
      }
    }
    return result;
  };

  const limitedOrig = originalWords.slice(0, 400);
  const limitedHum = humanizedWords.slice(0, 400);
  const diff = lcs(limitedOrig, limitedHum);
  const added = diff.filter(d => d.type === 'add' && d.word.trim()).length;
  const removed = diff.filter(d => d.type === 'remove' && d.word.trim()).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 text-[9px] font-bold uppercase tracking-widest pb-2 border-b border-white/5">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-emerald-500/50 border border-emerald-500/30" />
          +{added} eklenen
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-red-500/50 border border-red-500/30" />
          -{removed} silinen
        </span>
        {original.split(/\s+/).length > 400 && (
          <span className="text-gray-600 normal-case">(ilk 400 kelime gösteriliyor)</span>
        )}
      </div>
      <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
        {diff.map((d, i) =>
          d.type === 'same' ? (
            <span key={i}>{d.word}</span>
          ) : d.type === 'add' ? (
            <span key={i} className="bg-emerald-500/20 text-emerald-300 rounded px-0.5">
              {d.word}
            </span>
          ) : (
            <span key={i} className="bg-red-500/20 text-red-400 line-through rounded px-0.5 opacity-70">
              {d.word}
            </span>
          )
        )}
      </div>
    </div>
  );
};
