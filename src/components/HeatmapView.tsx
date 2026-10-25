import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../lib/utils';

export interface SentenceScoreItem {
  sentence: string;
  score: number;
  type?: 'ai' | 'human' | 'mixed' | 'plagiarism';
  reason?: string;
  source?: string;
}

interface HeatmapTextProps {
  text: string;
  sentenceScores: SentenceScoreItem[];
}

export const HeatmapText: React.FC<HeatmapTextProps> = ({ text, sentenceScores }) => {
  const [activeTooltip, setActiveTooltip] = useState<{
    item: SentenceScoreItem;
    x: number;
    y: number;
  } | null>(null);

  if (!sentenceScores || sentenceScores.length === 0) return <>{text}</>;

  let lastIndex = 0;
  const nodes: React.ReactNode[] = [];

  const handleMouseEnter = (e: React.MouseEvent, item: SentenceScoreItem) => {
    const tooltipWidth = 280;
    const tooltipHeight = 150;
    let x = e.clientX + 14;
    let y = e.clientY + 14;

    if (x + tooltipWidth > window.innerWidth - 16) {
      x = Math.max(12, e.clientX - tooltipWidth - 14);
    }
    if (y + tooltipHeight > window.innerHeight - 16) {
      y = Math.max(12, e.clientY - tooltipHeight - 14);
    }

    setActiveTooltip({ item, x, y });
  };

  sentenceScores.forEach((item, idx) => {
    const searchStr = item.sentence.trim();
    if (!searchStr) return;

    let index = text.indexOf(searchStr, lastIndex);
    if (index === -1) index = text.indexOf(searchStr);

    if (index !== -1) {
      if (index > lastIndex) {
        nodes.push(<span key={`text-before-${idx}`}>{text.slice(lastIndex, index)}</span>);
      }

      const isPlagiarism = item.type === 'plagiarism';
      const score = item.score > 1 ? item.score / 100 : item.score;
      let color = 'transparent';
      let borderColor = 'transparent';
      const opacity = isPlagiarism ? 0.25 : 0.4;

      if (isPlagiarism) {
        color = `rgba(249, 115, 22, ${opacity})`;
        borderColor = `rgba(249, 115, 22, 0.8)`;
      } else if (item.type === 'ai' || score > 0.7) {
        color = `rgba(239, 68, 68, ${opacity})`;
        borderColor = `rgba(239, 68, 68, 0.8)`;
      } else if (item.type === 'mixed' || (score > 0.3 && score <= 0.7)) {
        color = `rgba(245, 158, 11, ${opacity})`;
        borderColor = `rgba(245, 158, 11, 0.8)`;
      } else {
        color = `rgba(16, 185, 129, ${opacity})`;
        borderColor = `rgba(16, 185, 129, 0.8)`;
      }

      nodes.push(
        <span
          key={idx}
          className="px-1 rounded-sm cursor-help inline border-b-2"
          style={{
            backgroundColor: color,
            borderBottomColor: borderColor,
          }}
          onMouseEnter={(e) => handleMouseEnter(e, item)}
          onMouseLeave={() => setActiveTooltip(null)}
        >
          {text.slice(index, index + searchStr.length)}
        </span>
      );
      lastIndex = index + searchStr.length;
    }
  });

  return (
    <>
      {nodes}
      {lastIndex < text.length && <span>{text.slice(lastIndex)}</span>}
      {activeTooltip && createPortal(
        <div
          className="fixed z-[99999] pointer-events-none p-3.5 bg-[#0a0a0a]/95 border border-white/20 rounded-2xl text-xs shadow-2xl w-72 backdrop-blur-2xl"
          style={{ left: `${activeTooltip.x}px`, top: `${activeTooltip.y}px` }}
        >
          <div className="flex justify-between items-center mb-2 border-b border-white/10 pb-2">
            <span className="font-black uppercase tracking-widest text-[9px] text-gray-400">
              {activeTooltip.item.type === 'plagiarism' ? 'İntihal Tespiti' : activeTooltip.item.type === 'ai' ? 'Yapay Zeka' : 'İnsan Yazımı'}
            </span>
            <span className={cn("font-black", activeTooltip.item.type === 'plagiarism' ? "text-orange-500" : (activeTooltip.item.type === 'ai' || (activeTooltip.item.score > 1 ? activeTooltip.item.score / 100 : activeTooltip.item.score) > 0.7) ? "text-red-500" : "text-emerald-500")}>
              %{Math.round((activeTooltip.item.score > 1 ? activeTooltip.item.score / 100 : activeTooltip.item.score) * 100)}
            </span>
          </div>
          <p className="text-gray-300 font-medium leading-relaxed italic text-[11px] mb-1">
            "{activeTooltip.item.reason || (activeTooltip.item.type === 'plagiarism' ? 'Bu ifade internetteki bir kaynakla eşleşiyor.' : 'Cümle yapısı analiz edildi.')}"
          </p>
          {activeTooltip.item.type === 'plagiarism' && activeTooltip.item.source && (
            <div className="pt-2 border-t border-white/5">
              <span className="text-[10px] text-blue-400 font-bold truncate block">
                Kaynak: {activeTooltip.item.source}
              </span>
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  );
};
