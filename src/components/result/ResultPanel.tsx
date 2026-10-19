import React, { lazy, Suspense } from 'react';
import { RefreshCw, FileDown, Printer, Download, Copy, Layers } from 'lucide-react';
import { cn } from '../../lib/utils';
import { DiffView } from '../DiffView';
import { HeatmapText } from '../HeatmapView';
import type { CombinedAnalysisResult } from '../../types';

const ReactMarkdown = lazy(() => import('react-markdown').then(m => ({ default: m.default })));

/**
 * B20 Adım 5 (Core Refactor): sonuç paneli (Metin / Isı Haritası / Karşılaştır sekmeleri
 * ve DOCX/PDF/TXT/Kopyala aksiyonları) App.tsx'ten ayrıştırıldı. Davranış birebir korunmuştur.
 */

export type ResultViewMode = 'text' | 'heatmap' | 'diff';

interface ResultPanelProps {
  className?: string;
  isProcessing: boolean;
  processingStatus: string;
  inputText: string;
  humanizedText: string;
  analysis: CombinedAnalysisResult | null;
  showHeatmap: boolean;
  showDiff: boolean;
  onSetView: (view: ResultViewMode) => void;
  onExportDocx: () => void;
  onExportPdf: () => void;
  onExportTxt: () => void;
  onCopy: () => void;
}

export function ResultPanel(props: ResultPanelProps) {
  const {
    className,
    isProcessing,
    processingStatus,
    inputText,
    humanizedText,
    analysis,
    showHeatmap,
    showDiff,
    onSetView,
    onExportDocx,
    onExportPdf,
    onExportTxt,
    onCopy
  } = props;

  return (
    <div className={cn("glass-panel rounded-[24px] flex flex-col relative z-10", className)}>
      <div className="px-4 py-3 border-b border-brand-border flex justify-between items-center bg-white/[0.02]">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Sonuç</span>
          {analysis && humanizedText && (
            <div className="flex items-center gap-3 border-l border-white/10 pl-3 ml-1">
              <div className="flex items-center gap-1.5">
                <button onClick={() => onSetView('text')} className={cn("px-2.5 py-1 rounded-lg transition-all border text-[9px] font-bold uppercase", !showHeatmap && !showDiff ? "bg-emerald-500 text-black border-emerald-500" : "bg-white/5 border-white/10 text-gray-500 hover:text-gray-300")}>Metin</button>
                <button onClick={() => onSetView('heatmap')} className={cn("px-2.5 py-1 rounded-lg transition-all border text-[9px] font-bold uppercase", showHeatmap && !showDiff ? "bg-emerald-500 text-black border-emerald-500" : "bg-white/5 border-white/10 text-gray-500 hover:text-gray-300")}>Isı Haritası</button>
                <button onClick={() => onSetView('diff')} className={cn("px-2.5 py-1 rounded-lg transition-all border text-[9px] font-bold uppercase flex items-center gap-1", showDiff ? "bg-blue-500 text-white border-blue-500" : "bg-white/5 border-white/10 text-gray-500 hover:text-gray-300")}><Layers className="w-2.5 h-2.5" /> Karşılaştır</button>
              </div>
              {showHeatmap && (
                <div className="hidden sm:flex items-center gap-2 border-l border-white/10 pl-3">
                  <span className="flex items-center gap-1 text-[8px] uppercase tracking-widest text-emerald-400 font-black"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>İnsan</span>
                  <span className="flex items-center gap-1 text-[8px] uppercase tracking-widest text-amber-500 font-black"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>Karma</span>
                  <span className="flex items-center gap-1 text-[8px] uppercase tracking-widest text-red-500 font-black"><span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>YZ</span>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onExportDocx} disabled={!humanizedText} title="Word (.docx) İndir" className="p-1.5 text-gray-500 hover:text-emerald-500 disabled:opacity-30 disabled:hover:text-gray-500 transition-colors"><FileDown className="w-3.5 h-3.5" /></button>
          <button onClick={onExportPdf} disabled={!humanizedText} title="PDF Olarak Yazdır / Kaydet" className="p-1.5 text-gray-500 hover:text-emerald-500 disabled:opacity-30 disabled:hover:text-gray-500 transition-colors"><Printer className="w-3.5 h-3.5" /></button>
          <button onClick={onExportTxt} disabled={!humanizedText} title="Düz Metin (.txt) İndir" className="p-1.5 text-gray-500 hover:text-emerald-500 disabled:opacity-30 disabled:hover:text-gray-500 transition-colors"><Download className="w-3.5 h-3.5" /></button>
          <button onClick={onCopy} disabled={!humanizedText} title="Kopyala" className="p-1.5 text-gray-500 hover:text-emerald-500 disabled:opacity-30 disabled:hover:text-gray-500 transition-colors"><Copy className="w-3.5 h-3.5" /></button>
        </div>
      </div>
      <div className="flex-1 p-4 lg:p-6 overflow-y-auto text-gray-300 leading-relaxed text-sm custom-scrollbar bg-emerald-500/[0.01] rounded-b-[24px]">
        {isProcessing ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4"><RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" /><span className="text-gray-400 font-medium">{processingStatus}</span></div>
        ) : showDiff && inputText && humanizedText ? (
          <DiffView original={inputText} humanized={humanizedText} />
        ) : (
          <div className="prose prose-invert max-w-none prose-sm lg:prose-base">
            {showHeatmap && analysis?.sentenceScores ? (<HeatmapText text={humanizedText} sentenceScores={analysis.sentenceScores as any} />) : (
              <Suspense fallback={<div className="text-gray-500 text-sm">Yükleniyor...</div>}>
                <ReactMarkdown>{humanizedText || "_Sonuç burada görünecek..._"}</ReactMarkdown>
              </Suspense>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
