import React, { useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Undo2,
  Redo2,
  Save,
  Highlighter,
  ShieldCheck,
  RefreshCw,
  Search,
  ExternalLink,
  Trash2,
  Upload,
  Clock,
  Zap
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { findGrammarMatch } from '../../lib/grammarMatch';
import type { GrammarSuggestion } from '../../services/geminiService';
import type { CombinedAnalysisResult, AuditorResult } from '../../types';

/**
 * B20 Adım 5 (Core Refactor): giriş editörü + toolbar + istatistik çubuğu App.tsx'ten ayrıştırıldı.
 * Isı haritası overlay mimarisi (B16/B18) olduğu gibi korunmuştur: gramer vurgusu,
 * okunabilirlik vurgusu ve YZ/intihal ısı katmanı öncelik sırasıyla aynı memo içinde üretilir.
 */

interface EditorPanelProps {
  className?: string;
  inputText: string;
  onTextChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onCtrlEnter: () => void;
  isProcessing: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  backdropRef: React.RefObject<HTMLDivElement | null>;
  onScroll: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onSaveDraft: () => void;
  isDrafting: boolean;
  showInputHeatmap: boolean;
  onToggleHeatmap: () => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  isAdmin: boolean;
  isOverLimit: boolean;
  realtimeScore: number | null;
  // Overlay girdileri (B16/B18)
  grammarSuggestions: GrammarSuggestion[];
  hoveredGrammar: GrammarSuggestion | null;
  hoveredReadability: { start: number; end: number; text: string } | null;
  auditorResult: AuditorResult | null;
  analysis: CombinedAnalysisResult | null;
  hoveredInsight: string | null;
  hoveredSourceUrl: string | null;
  onHoverSourceUrl: (url: string | null) => void;
  sentinelSourcesRef: React.RefObject<HTMLDivElement | null>;
  // İstatistik çubuğu
  remainingChars: number;
  currentLimit: number;
  currentUsage: number;
  onClearText?: () => void;
  onUploadFile?: (text: string) => void;
}

export function EditorPanel(props: EditorPanelProps) {
  const {
    className,
    inputText,
    onTextChange,
    onCtrlEnter,
    isProcessing,
    textareaRef,
    backdropRef,
    onScroll,
    canUndo,
    canRedo,
    onUndo,
    onRedo,
    onSaveDraft,
    isDrafting,
    showInputHeatmap,
    onToggleHeatmap,
    onAnalyze,
    isAnalyzing,
    isAdmin,
    isOverLimit,
    realtimeScore,
    grammarSuggestions,
    hoveredGrammar,
    hoveredReadability,
    auditorResult,
    analysis,
    hoveredInsight,
    hoveredSourceUrl,
    onHoverSourceUrl,
    sentinelSourcesRef,
    remainingChars,
    currentLimit,
    currentUsage,
    onClearText,
    onUploadFile
  } = props;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isFileLoading, setIsFileLoading] = useState(false);
  const [autoDetect, setAutoDetect] = useState(() => {
    try {
      return localStorage.getItem('sentience_auto_detect') === 'true';
    } catch {
      return false;
    }
  });

  const processUploadedFile = async (file: File) => {
    setIsFileLoading(true);
    try {
      const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
      let extractedText = '';

      if (ext === '.pdf' || ext === '.docx') {
        const { parseDocumentFile } = await import('../../services/fileParseService');
        const parsed = await parseDocumentFile(file);
        extractedText = parsed.text;
      } else {
        extractedText = await file.text();
      }

      if (extractedText.trim()) {
        if (onUploadFile) {
          onUploadFile(extractedText);
        } else {
          onTextChange({ target: { value: extractedText } } as any);
        }
        toast.success(`${file.name} başarıyla aktarıldı (${extractedText.length} karakter).`);
        if (autoDetect && !isAnalyzing && (!isOverLimit || isAdmin)) {
          setTimeout(() => {
            onAnalyze();
          }, 350);
        }
      } else {
        toast.error('Dosyada okunabilir metin bulunamadı.');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Dosya okunamadı.');
    } finally {
      setIsFileLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processUploadedFile(file);
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processUploadedFile(file);
    }
  };

  // Highlighted Text Logic (Grammar + Heatmap + Plagiarism + Readability)
  const inputOverlay = useMemo(() => {
    const buildGrammarOverlay = (active: GrammarSuggestion | null) => {
      if (!grammarSuggestions.length) return null;

      const ordered = grammarSuggestions
        .map(s => ({ suggestion: s, match: findGrammarMatch(inputText, s.original) }))
        .filter(item => item.match !== null)
        .sort((a, b) => (a.match as { index: number }).index - (b.match as { index: number }).index);

      if (!ordered.length) return null;

      const nodes: React.ReactNode[] = [];
      let lastIndex = 0;

      ordered.forEach(({ suggestion, match }, idx) => {
        const { index, length } = match as { index: number; length: number };
        if (index < lastIndex) return;

        if (index > lastIndex) {
          nodes.push(<span key={`text-${idx}`}>{inputText.slice(lastIndex, index)}</span>);
        }

        const isActive = !!active && active.original === suggestion.original;

        nodes.push(
          isActive ? (
            <motion.span
              id="hovered-grammar-span"
              key={`sug-active-${idx}`}
              className="inline rounded-sm text-red-200 border-b border-red-400"
              animate={{
                backgroundColor: ['rgba(239, 68, 68, 0.25)', 'rgba(239, 68, 68, 0.65)', 'rgba(239, 68, 68, 0.25)'],
                boxShadow: ['0 0 0 rgba(239, 68, 68, 0)', '0 0 16px rgba(239, 68, 68, 0.85)', '0 0 0 rgba(239, 68, 68, 0)']
              }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            >
              {inputText.slice(index, index + length)}
            </motion.span>
          ) : (
            <span
              key={`sug-${idx}`}
              className={active ? "bg-red-500/10 border-b border-red-500/40" : "bg-red-500/30 border-b border-red-500"}
            >
              {inputText.slice(index, index + length)}
            </span>
          )
        );

        lastIndex = index + length;
      });

      if (lastIndex < inputText.length) {
        nodes.push(<span key="text-end">{inputText.slice(lastIndex)}</span>);
      }

      return nodes.length > 0 ? <>{nodes}</> : null;
    };

    if (hoveredGrammar) {
      const hoveredGrammarOverlay = buildGrammarOverlay(hoveredGrammar);
      if (hoveredGrammarOverlay) return hoveredGrammarOverlay;
    }

    // Okunabilirlik önerileri overlay
    if (hoveredReadability) {
      const nodes = [];
      const { start, end } = hoveredReadability;

      // Önce normal metin
      if (start > 0) {
        nodes.push(<span key="before-readability">{inputText.slice(0, start)}</span>);
      }

      // Vurgulanmış bölüm
      nodes.push(
        <motion.span
          id="hovered-readability-span"
          key="readability-highlight"
          className="inline rounded-sm text-purple-200 border-b-2 border-purple-400"
          animate={{
            backgroundColor: ['rgba(168, 85, 247, 0.25)', 'rgba(168, 85, 247, 0.65)', 'rgba(168, 85, 247, 0.25)'],
            boxShadow: ['0 0 0 rgba(168, 85, 247, 0)', '0 0 16px rgba(168, 85, 247, 0.85)', '0 0 0 rgba(168, 85, 247, 0)']
          }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          {inputText.slice(start, end)}
        </motion.span>
      );

      // Sonra normal metin
      if (end < inputText.length) {
        nodes.push(<span key="after-readability">{inputText.slice(end)}</span>);
      }

      return <>{nodes}</>;
    }

    if (hoveredInsight || (showInputHeatmap && (auditorResult?.sentenceScores || analysis?.matchedPhrases))) {
      let lastIndex = 0;
      const nodes = [];

      const allMatches: { text: string, score: number, type: 'ai' | 'plagiarism', reason?: string }[] = [];

      if (showInputHeatmap && auditorResult?.sentenceScores) {
        auditorResult.sentenceScores.forEach(s => allMatches.push({ text: s.sentence, score: s.score, type: 'ai', reason: s.reason }));
      }
      if (showInputHeatmap && analysis?.matchedPhrases) {
        analysis.matchedPhrases.forEach(m => allMatches.push({ text: m.text, score: m.score, type: 'plagiarism', reason: 'İnternet kaynağı ile eşleşme bulundu.', source: m.source } as any));
      }

      if (allMatches.length > 0) {
        const sortedMatches = allMatches
          .map(m => ({ ...m, index: inputText.indexOf(m.text) }))
          .filter(m => m.index !== -1)
          .sort((a, b) => a.index - b.index);

        sortedMatches.forEach((item, idx) => {
          const searchStr = item.text;
          const index = item.index;

          if (index >= lastIndex) {
            if (index > lastIndex) {
              nodes.push(<span key={`text-before-${idx}`}>{inputText.slice(lastIndex, index)}</span>);
            }

            let color = 'transparent';
            const opacity = 0.25;

            if (item.type === 'ai') {
              if (item.score > 0.7) color = `rgba(239, 68, 68, ${opacity})`;
              else if (item.score > 0.3) color = `rgba(245, 158, 11, ${opacity})`;
              else color = `rgba(16, 185, 129, ${opacity})`;
            } else {
              color = `rgba(249, 115, 22, ${opacity})`;
            }

            const isHovered = hoveredInsight && searchStr === hoveredInsight.trim();
            const isPlagiarismActiveFromCard = item.type === 'plagiarism' && !!hoveredSourceUrl && (item as any).source === hoveredSourceUrl;

            const mSource = analysis?.sources?.find((src: any) => src.url === (item as any).source) || analysis?.sources?.[0];
            const matchedSourceUrl = (item as any).source || mSource?.url;

            nodes.push(
              <span
                id={isHovered || isPlagiarismActiveFromCard ? "hovered-insight-span" : undefined}
                key={`heat-${idx}`}
                className={cn(
                  "rounded-sm inline transition-colors duration-150 text-transparent",
                  item.type === 'plagiarism' ? "border-b-2 border-orange-500" : ""
                )}
                style={{
                  backgroundColor: isPlagiarismActiveFromCard ? 'rgba(245, 158, 11, 0.45)' : isHovered ? 'rgba(16, 185, 129, 0.25)' : color,
                  outline: isPlagiarismActiveFromCard ? '2px solid rgba(245,158,11,0.6)' : undefined,
                  borderRadius: isPlagiarismActiveFromCard ? '4px' : undefined,
                }}
                onMouseEnter={() => {
                  if (item.type === 'plagiarism' && matchedSourceUrl) {
                    onHoverSourceUrl(matchedSourceUrl);
                    setTimeout(() => {
                      const cardEl = document.getElementById(`sentinel-card-${encodeURIComponent(matchedSourceUrl)}`);
                      if (cardEl && sentinelSourcesRef.current) sentinelSourcesRef.current.scrollTo({ top: cardEl.offsetTop - 8, behavior: 'smooth' });
                    }, 50);
                  }
                }}
                onMouseLeave={() => { if (item.type === 'plagiarism') onHoverSourceUrl(null); }}
              >
                {inputText.slice(index, index + searchStr.length)}
                {!isHovered && !isPlagiarismActiveFromCard && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-2xl text-xs opacity-0 group-hover:opacity-100 transition-all pointer-events-auto z-[100] shadow-2xl w-72 backdrop-blur-xl">
                    <div className="flex justify-between items-center mb-2 border-b border-white/5 pb-2">
                      <span className="font-black uppercase tracking-widest text-[9px] text-gray-400 flex items-center gap-1.5">
                        {item.type === 'ai' ? 'YZ Analizi' : <><Search className="w-3 h-3 text-orange-400" /> İntihal Tespiti</>}
                      </span>
                      <span className={cn("font-black", item.type === 'ai' && item.score > 0.7 ? "text-red-500" : "text-orange-400")}>
                        {item.type === 'ai' ? `%${Math.round(item.score * 100)}` : 'EŞLEŞME'}
                      </span>
                    </div>
                    <p className="text-gray-300 font-medium leading-relaxed italic text-[11px] mb-2">"{item.reason || 'Analiz edildi.'}"</p>
                    {item.type === 'plagiarism' && matchedSourceUrl && (
                      <a
                        href={matchedSourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-mono truncate border-t border-white/5 pt-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-3 h-3 shrink-0" />
                        <span className="truncate">{matchedSourceUrl}</span>
                      </a>
                    )}
                  </div>
                )}
              </span>
            );
            lastIndex = index + searchStr.length;
          }
        });
      } else if (hoveredInsight) {
        const searchStr = hoveredInsight.trim();
        const index = inputText.indexOf(searchStr);
        if (index !== -1) {
          if (index > 0) {
            nodes.push(<span key="text-before">{inputText.slice(0, index)}</span>);
          }
          nodes.push(
            <span
              id="hovered-insight-span"
              key="hovered"
              className="transition-colors duration-150 rounded-sm inline text-transparent"
              style={{ backgroundColor: 'rgba(16, 185, 129, 0.25)' }}
            >
              {inputText.slice(index, index + searchStr.length)}
            </span>
          );
          lastIndex = index + searchStr.length;
        }
      }

      if (lastIndex < inputText.length) {
        nodes.push(<span key="text-end">{inputText.slice(lastIndex)}</span>);
      }

      return nodes.length > 0 ? <>{nodes}</> : inputText;
    }

    if (!grammarSuggestions.length) return inputText;

    return buildGrammarOverlay(null) || inputText;
  }, [inputText, grammarSuggestions, showInputHeatmap, auditorResult, hoveredInsight, hoveredSourceUrl, analysis, sentinelSourcesRef, hoveredGrammar, hoveredReadability, onHoverSourceUrl]);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn("glass-panel rounded-[24px] flex flex-col relative transition-all", isDragging && "ring-2 ring-emerald-500/50 bg-emerald-500/[0.02]", className)}
    >
      {/* Sürükle-Bırak Karşılama Katmanı */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-brand-bg/90 backdrop-blur-md border-2 border-dashed border-emerald-500 rounded-[24px] flex flex-col items-center justify-center pointer-events-none animate-in fade-in duration-150">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-2 animate-bounce">
            <Upload className="w-7 h-7" />
          </div>
          <p className="text-sm font-bold text-white tracking-tight">Belgeyi Buraya Bırakın</p>
          <p className="text-[11px] text-gray-400 mt-1">.pdf, .docx, .txt, .md dosyaları desteklenir</p>
        </div>
      )}

      {/* Dosya Ayrıştırma Yükleniyor Katmanı */}
      {isFileLoading && (
        <div className="absolute inset-0 z-50 bg-brand-bg/85 backdrop-blur-sm rounded-[24px] flex flex-col items-center justify-center pointer-events-none">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
          <p className="text-xs font-bold text-white">Belge Metni Ayrıştırılıyor...</p>
        </div>
      )}

      <div className="px-4 py-3 border-b border-brand-border bg-black/20 flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Giriş metni</span>
            {realtimeScore !== null && (
              <div className="flex items-center gap-1.5">
                <div className="w-10 lg:w-16 h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500" style={{ width: `${realtimeScore * 100}%` }} />
                </div>
                <span className="text-[8px] text-gray-500">%{Math.round(realtimeScore * 100)} YZ</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".txt,.md,.pdf,.docx,.json,.csv"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Belge Yükle (.pdf, .docx, .txt, .md)"
              className="p-1.5 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 transition-colors"
            >
              <Upload className="w-3 h-3" />
            </button>
            {inputText.trim() && (
              <button
                onClick={() => {
                  if (onClearText) {
                    onClearText();
                  } else {
                    onTextChange({ target: { value: '' } } as any);
                  }
                }}
                title="Metni Temizle"
                className="p-1.5 text-gray-400 hover:text-red-400 bg-white/5 hover:bg-red-500/10 rounded-lg border border-white/5 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
            <div className="flex items-center gap-1 border-r border-white/10 pr-2 mr-1">
              <button onClick={onUndo} disabled={!canUndo} title="Geri Al" className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400 transition-colors"><Undo2 className="w-3 h-3" /></button>
              <button onClick={onRedo} disabled={!canRedo} title="İleri Al" className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400 transition-colors"><Redo2 className="w-3 h-3" /></button>
            </div>
            <button
              onClick={() => {
                const next = !autoDetect;
                setAutoDetect(next);
                try {
                  localStorage.setItem('sentience_auto_detect', String(next));
                } catch {}
                toast.success(next ? "Otomatik analiz açık (yapıştırmada devreye girer)" : "Otomatik analiz kapatıldı");
              }}
              title="Metin yapıştırıldığında veya dosya yüklendiğinde otomatik YZ tespiti başlat"
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold transition-all border",
                autoDetect
                  ? "bg-purple-500/15 border-purple-500/30 text-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.15)]"
                  : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
              )}
            >
              <Zap className={cn("w-2.5 h-2.5", autoDetect && "fill-purple-400")} />
              <span className="hidden sm:inline">Oto Tespit</span>
            </button>
            <button onClick={onSaveDraft} disabled={isDrafting || !inputText.trim()} className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-bold text-gray-400 hover:bg-white/10 transition-all disabled:opacity-50"><Save className="w-2.5 h-2.5" /> <span className="hidden sm:inline">Taslak</span></button>
            <button onClick={onToggleHeatmap} className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold transition-all", showInputHeatmap ? "bg-emerald-500 text-black" : "bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10")}><Highlighter className="w-2.5 h-2.5" /> Isı haritası</button>
            <button onClick={onAnalyze} disabled={isAnalyzing || !inputText.trim() || (!isAdmin && isOverLimit)} className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[9px] font-bold text-emerald-500 hover:bg-emerald-500/20 transition-all shadow-[0_0_15px_rgba(16,185,129,0.1)]">{isAnalyzing ? <RefreshCw className="w-2.5 h-2.5 animate-spin" /> : <ShieldCheck className="w-2.5 h-2.5" />} Denetçi Analizi</button>
          </div>
        </div>
      </div>
      <div className="relative flex-1 overflow-hidden min-h-[220px] lg:min-h-0">
        <textarea
          ref={textareaRef}
          value={inputText}
          onScroll={onScroll}
          onChange={onTextChange}
          onPaste={(e) => {
            if (!autoDetect || isAnalyzing || (isOverLimit && !isAdmin)) return;
            const pastedText = e.clipboardData?.getData('text') || '';
            if (pastedText.trim().length >= 30) {
              setTimeout(() => {
                onAnalyze();
              }, 300);
            }
          }}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
              e.preventDefault();
              onCtrlEnter();
            }
          }}
          className="absolute inset-0 w-full h-full p-4 lg:p-6 bg-transparent outline-none resize-none text-gray-300 leading-relaxed text-sm z-10 custom-scrollbar"
          placeholder="Metninizi buraya yapıştırın... (Ctrl+Enter ile İnsanlaştır)"
        />
        <div
          ref={backdropRef}
          className="absolute inset-0 w-full h-full p-4 lg:p-6 text-sm leading-relaxed pointer-events-none whitespace-pre-wrap break-words text-transparent z-0 overflow-y-auto custom-scrollbar"
        >
          {inputOverlay}
        </div>
      </div>
      {inputText && (() => {
        const wc = inputText.trim().split(/\s+/).filter(Boolean).length;
        const isShort = wc < 80;
        const sentences = inputText.match(/[^.!?]+[.!?]+/g) || [];
        const sentLengths = sentences.map(s => s.trim().split(/\s+/).length);
        const mean = sentLengths.length > 0 ? sentLengths.reduce((a, b) => a + b, 0) / sentLengths.length : 0;
        const variance = sentLengths.length > 1 ? sentLengths.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / sentLengths.length : 0;
        const burstiness = Math.min(1, Math.sqrt(variance) / Math.max(mean, 1));
        const burstColor = burstiness > 0.5 ? 'text-emerald-400' : burstiness > 0.28 ? 'text-amber-400' : 'text-red-400';
        const burstLabel = burstiness > 0.5 ? 'Dogal' : burstiness > 0.28 ? 'Orta' : 'Tekduze';
        return (
          <>
            {isShort && (
              <div className="px-4 py-1.5 bg-amber-500/[0.08] border-t border-amber-500/20 flex items-center gap-2 shrink-0">
                <span className="text-[9px] text-amber-400 font-bold">&#9888; {wc} kelime - Doğru analiz için en az 80 kelime önerilir.</span>
              </div>
            )}
            {(isOverLimit || (!isAdmin && remainingChars < inputText.length)) && (
              <div className="px-4 py-1.5 bg-rose-500/[0.12] border-t border-rose-500/30 flex items-center justify-between shrink-0 animate-shake">
                <span className="text-[9px] text-rose-400 font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping inline-block" />
                  Günlük kota sınırı aşıldı ({currentUsage.toLocaleString()} / {currentLimit.toLocaleString()} karakter).
                </span>
              </div>
            )}
            <div className="px-4 py-2 border-t border-white/5 bg-black/20 flex items-center gap-4 text-[9px] text-gray-600 font-mono shrink-0 rounded-b-[24px]">
              <span><span className={isShort ? 'text-amber-400 font-bold' : ''}>{wc}</span> <span className="text-gray-700">kelime</span></span>
              <span className="text-white/10">|</span>
              <span className={cn((isOverLimit || (!isAdmin && remainingChars < inputText.length)) && "text-rose-400 font-bold")}>
                {inputText.length} <span className="text-gray-700">karakter</span>
              </span>
              <span className="text-white/10">|</span>
              <span className="flex items-center gap-1">
                <Clock className="w-2.5 h-2.5 text-gray-500" />
                <span>{Math.max(1, Math.ceil(wc / 200))} dk okuma</span>
              </span>
              <span className="text-white/10">|</span>
              <span className="flex items-center gap-1">
                <span className={cn('w-1.5 h-1.5 rounded-full inline-block', burstiness > 0.5 ? 'bg-emerald-400' : burstiness > 0.28 ? 'bg-amber-400' : 'bg-red-400')} />
                <span className={burstColor}>Burstiness: {burstLabel}</span>
              </span>
              <span className="text-white/10">|</span>
              {isAdmin ? (
                <span className="text-emerald-600">∞ Admin</span>
              ) : (
                <span className={cn(
                  remainingChars < inputText.length ? 'text-red-500 font-bold animate-shake' : remainingChars < currentLimit * 0.2 ? 'text-amber-500' : 'text-emerald-600'
                )}>
                  {remainingChars === Infinity ? '∞' : remainingChars.toLocaleString()} <span className="text-gray-700">kalan</span>
                </span>
              )}
              {!isAdmin && (
                <div className={cn("flex-1 h-1 bg-white/5 rounded-full overflow-hidden max-w-24", (isOverLimit || remainingChars < inputText.length) && "ring-1 ring-rose-500 animate-shake")}>
                  <div
                    className={cn("h-full rounded-full transition-all", (isOverLimit || currentUsage / currentLimit > 0.8) ? "bg-red-500" : currentUsage / currentLimit > 0.5 ? "bg-amber-500" : "bg-emerald-500")}
                    style={{ width: `${Math.min(100, (currentUsage / currentLimit) * 100)}%` }}
                  />
                </div>
              )}
            </div>
          </>
        );
      })()}
    </div>
  );
}
