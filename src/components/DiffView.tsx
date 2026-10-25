import React, { useState, useRef, useCallback } from 'react';
import { Columns, AlignLeft, Link2, Unlink } from 'lucide-react';
import { cn } from '../lib/utils';

interface DiffViewProps {
  original: string;
  humanized: string;
}

export const DiffView: React.FC<DiffViewProps> = ({ original, humanized }) => {
  const [viewMode, setViewMode] = useState<'split' | 'inline'>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 'inline';
    }
    return 'split';
  });
  const [syncScroll, setSyncScroll] = useState(true);
  const leftColRef = useRef<HTMLDivElement>(null);
  const rightColRef = useRef<HTMLDivElement>(null);
  const activeScroller = useRef<'left' | 'right' | null>(null);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleLeftScroll = useCallback(() => {
    if (!syncScroll) return;
    if (activeScroller.current === 'right') return;
    activeScroller.current = 'left';

    const left = leftColRef.current;
    const right = rightColRef.current;
    if (left && right) {
      const maxLeft = left.scrollHeight - left.clientHeight;
      const maxRight = right.scrollHeight - right.clientHeight;
      if (maxLeft > 0 && maxRight > 0) {
        const ratio = left.scrollTop / maxLeft;
        right.scrollTop = ratio * maxRight;
      }
    }

    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      activeScroller.current = null;
    }, 100);
  }, [syncScroll]);

  const handleRightScroll = useCallback(() => {
    if (!syncScroll) return;
    if (activeScroller.current === 'left') return;
    activeScroller.current = 'right';

    const left = leftColRef.current;
    const right = rightColRef.current;
    if (left && right) {
      const maxLeft = left.scrollHeight - left.clientHeight;
      const maxRight = right.scrollHeight - right.clientHeight;
      if (maxLeft > 0 && maxRight > 0) {
        const ratio = right.scrollTop / maxRight;
        left.scrollTop = ratio * maxLeft;
      }
    }

    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      activeScroller.current = null;
    }, 100);
  }, [syncScroll]);

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

  const limitedOrig = originalWords.slice(0, 500);
  const limitedHum = humanizedWords.slice(0, 500);
  const diff = lcs(limitedOrig, limitedHum);
  const added = diff.filter(d => d.type === 'add' && d.word.trim()).length;
  const removed = diff.filter(d => d.type === 'remove' && d.word.trim()).length;

  return (
    <div className="space-y-3 h-full flex flex-col">
      <div className="flex items-center justify-between pb-2 border-b border-white/5">
        <div className="flex items-center gap-4 text-[9px] font-bold uppercase tracking-widest">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-emerald-500/50 border border-emerald-500/30" />
            +{added} eklenen
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-red-500/50 border border-red-500/30" />
            -{removed} silinen
          </span>
          {original.split(/\s+/).length > 500 && (
            <span className="text-gray-600 normal-case">(ilk 500 kelime gösteriliyor)</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {viewMode === 'split' && (
            <button
              onClick={() => setSyncScroll(!syncScroll)}
              title={syncScroll ? "Senkron kaydırmayı devre dışı bırak" : "Senkron kaydırmayı etkinleştir"}
              className={cn(
                "px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase flex items-center gap-1 border transition-all",
                syncScroll
                  ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                  : "bg-white/5 text-gray-500 border-white/5 hover:text-gray-300"
              )}
            >
              {syncScroll ? <Link2 className="w-2.5 h-2.5 text-amber-400" /> : <Unlink className="w-2.5 h-2.5 text-gray-500" />}
              {syncScroll ? 'Senkron Açık' : 'Senkron Kapalı'}
            </button>
          )}
          <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-lg border border-white/5">
            <button
              onClick={() => setViewMode('split')}
              className={cn("px-2 py-0.5 rounded text-[9px] font-bold uppercase flex items-center gap-1 transition-all", viewMode === 'split' ? "bg-emerald-500 text-black shadow" : "text-gray-400 hover:text-white")}
            >
              <Columns className="w-2.5 h-2.5" /> Yan Yana
            </button>
            <button
              onClick={() => setViewMode('inline')}
              className={cn("px-2 py-0.5 rounded text-[9px] font-bold uppercase flex items-center gap-1 transition-all", viewMode === 'inline' ? "bg-emerald-500 text-black shadow" : "text-gray-400 hover:text-white")}
            >
              <AlignLeft className="w-2.5 h-2.5" /> Satır İçi
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'split' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 min-h-[300px]">
          <div className="flex flex-col rounded-2xl bg-black/30 border border-red-500/10 overflow-hidden">
            <div className="px-3 py-1.5 bg-red-500/10 border-b border-red-500/10 text-[9px] font-bold text-red-400 uppercase tracking-wider flex items-center justify-between">
              <span>Orijinal Metin</span>
              <span className="text-[8px] opacity-70">{syncScroll ? 'Senkron Aktif' : 'Serbest'}</span>
            </div>
            <div
              ref={leftColRef}
              onScroll={handleLeftScroll}
              className="p-3 text-sm leading-relaxed whitespace-pre-wrap break-words overflow-y-auto max-h-[360px] custom-scrollbar text-gray-300 font-sans"
            >
              {diff.map((d, i) => {
                if (d.type === 'add') return null;
                if (d.type === 'remove') {
                  return (
                    <span key={i} className="bg-red-500/25 text-red-300 line-through rounded px-0.5">
                      {d.word}
                    </span>
                  );
                }
                return <span key={i}>{d.word}</span>;
              })}
            </div>
          </div>

          <div className="flex flex-col rounded-2xl bg-black/30 border border-emerald-500/10 overflow-hidden">
            <div className="px-3 py-1.5 bg-emerald-500/10 border-b border-emerald-500/10 text-[9px] font-bold text-emerald-400 uppercase tracking-wider flex items-center justify-between">
              <span>Dönüştürülmüş Metin</span>
              <span className="text-[8px] opacity-70">{syncScroll ? 'Senkron Aktif' : 'Serbest'}</span>
            </div>
            <div
              ref={rightColRef}
              onScroll={handleRightScroll}
              className="p-3 text-sm leading-relaxed whitespace-pre-wrap break-words overflow-y-auto max-h-[360px] custom-scrollbar text-gray-300 font-sans"
            >
              {diff.map((d, i) => {
                if (d.type === 'remove') return null;
                if (d.type === 'add') {
                  return (
                    <span key={i} className="bg-emerald-500/25 text-emerald-300 rounded px-0.5 font-medium">
                      {d.word}
                    </span>
                  );
                }
                return <span key={i}>{d.word}</span>;
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-sm leading-relaxed whitespace-pre-wrap break-words p-3 bg-black/20 rounded-2xl border border-white/5 max-h-[380px] overflow-y-auto custom-scrollbar">
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
      )}
    </div>
  );
};
