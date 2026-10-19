import React from 'react';
import { Check, X, Sparkles, CheckCheck, BookOpen, MapPin } from 'lucide-react';
import { GrammarSuggestion } from '../services/geminiService';

interface GrammarPanelProps {
  suggestions: GrammarSuggestion[];
  grammarScore?: number;
  onApply: (suggestion: GrammarSuggestion) => void;
  onDismiss?: (suggestion: GrammarSuggestion) => void;
  onDismissAll?: () => void;
  onApplyAll?: () => void;
  onHover?: (suggestion: GrammarSuggestion | null) => void;
  hoveredSuggestion?: GrammarSuggestion | null;
  hoverFound?: boolean;
}

export const GrammarPanel: React.FC<GrammarPanelProps> = ({
  suggestions,
  grammarScore,
  onApply,
  onDismiss,
  onDismissAll,
  onApplyAll,
  onHover,
  hoveredSuggestion,
  hoverFound
}) => {
  if (suggestions.length === 0 && grammarScore === undefined) return null;

  return (
    <div className="p-4 rounded-2xl bg-[#0e1615]/90 border border-emerald-500/20 backdrop-blur-xl shadow-xl space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
            Gramer &amp; Yazım Denetimi
          </span>
          {suggestions.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-bold">
              {suggestions.length} Öneri
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {grammarScore !== undefined && (
            <div className="flex items-center gap-1.5 text-[9px] font-mono text-gray-400">
              <span>Gramer Skoru:</span>
              <span className="text-emerald-400 font-bold">%{Math.round(grammarScore * 100)}</span>
            </div>
          )}
          {suggestions.length > 1 && onApplyAll && (
            <button
              onClick={onApplyAll}
              className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-all"
            >
              <CheckCheck className="w-3 h-3" /> Hepsini Uygula
            </button>
          )}
        </div>
      </div>

      {suggestions.length > 0 ? (
        <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
          {suggestions.map((s, idx) => {
            const isHovered = !!hoveredSuggestion && hoveredSuggestion.original === s.original;
            return (
            <div
              key={idx}
              onMouseEnter={() => onHover ? onHover(s) : undefined}
              onMouseLeave={() => onHover ? onHover(null) : undefined}
              className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-3 text-xs ${
                isHovered
                  ? 'bg-red-500/[0.08] border-red-500/50 shadow-[0_0_18px_-6px_rgba(239,68,68,0.6)]'
                  : 'bg-white/[0.02] border-white/5 hover:border-emerald-500/20'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 font-mono text-[11px] mb-1">
                  <span className="text-red-400 line-through truncate max-w-[140px]">{s.original}</span>
                  <span className="text-gray-600">→</span>
                  <span className="text-emerald-400 font-bold truncate max-w-[140px]">{s.suggestion}</span>
                </div>
                {s.explanation && (
                  <p className="text-[10px] text-gray-400 leading-snug truncate">{s.explanation}</p>
                )}
                {isHovered && (
                  <div
                    className={`mt-1.5 flex items-center gap-1 text-[9px] font-black uppercase tracking-widest ${
                      hoverFound === false ? 'text-amber-400' : 'text-red-400'
                    }`}
                  >
                    <MapPin className={`w-2.5 h-2.5 ${hoverFound === false ? '' : 'animate-bounce'}`} />
                    {hoverFound === false ? 'Metinde bulunamadı' : 'Metinde vurgulanıyor'}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => onApply(s)}
                  title="Düzeltmeyi Uygula"
                  className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-black transition-all"
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  onClick={() => onDismiss ? onDismiss(s) : undefined}
                  title="Yoksay"
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-500 hover:text-gray-300 transition-all"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
            );
          })}
        </div>
      ) : (
        <div className="text-[10px] text-emerald-400 font-medium py-1 flex items-center gap-2">
          <Check className="w-3.5 h-3.5" /> Metninizde herhangi bir yazım veya gramer hatası bulunamadı.
        </div>
      )}
    </div>
  );
};
