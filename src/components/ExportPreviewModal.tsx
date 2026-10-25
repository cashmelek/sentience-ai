import React from 'react';
import { X, FileDown, Printer, Download, Eye, ShieldCheck, Search, BookOpen } from 'lucide-react';
import type { ExportContext } from '../lib/exporters';

interface ExportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  ctx: ExportContext | null;
  onExportDocx: () => void;
  onExportPdf: () => void;
  onExportTxt: () => void;
}

export const ExportPreviewModal: React.FC<ExportPreviewModalProps> = ({
  isOpen,
  onClose,
  ctx,
  onExportDocx,
  onExportPdf,
  onExportTxt
}) => {
  if (!isOpen || !ctx || !ctx.humanizedText) return null;

  const { humanizedText, options, auditorResult, analysis, mlAnalysis } = ctx;
  const rawAi = auditorResult?.score ?? analysis?.aiScore ?? 0;
  const aiPct = Math.round((rawAi > 1 ? rawAi / 100 : rawAi) * 100);
  const rawPlg = auditorResult?.metrics?.plagiarism ?? analysis?.similarityScore ?? 0;
  const plgPct = Math.round((rawPlg > 1 ? rawPlg / 100 : rawPlg) * 100);
  const readabilityPct = Math.round((mlAnalysis?.readabilityScore ?? auditorResult?.metrics?.readability ?? 0.7) * 100);
  const sources = analysis?.sources || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-brand-card border border-brand-border rounded-[24px] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-brand-border flex items-center justify-between bg-black/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white tracking-tight uppercase">Belge Önizleme</h3>
              <p className="text-[10px] text-gray-500">Dışa aktarım öncesi nihai rapor ve metin düzeni</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Document Page Preview */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-brand-bg/50">
          <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 shadow-inner space-y-6 text-gray-200">
            {/* Document Header */}
            <div className="text-center pb-6 border-b border-white/10 space-y-2">
              <h1 className="text-lg font-black tracking-tight text-white uppercase">
                SENTIENCE AI — METİN VE DENETİM RAPORU
              </h1>
              <div className="flex flex-wrap items-center justify-center gap-3 text-[10px] text-gray-400 font-mono">
                <span>Tarih: {new Date().toLocaleDateString('tr-TR')}</span>
                <span>•</span>
                <span>Stil Tonu: <strong className="text-emerald-400 font-sans capitalize">{options.tone}</strong></span>
                <span>•</span>
                <span>Yoğunluk: <strong className="text-white font-sans">%{options.intensity}</strong></span>
              </div>
            </div>

            {/* Score Strip */}
            <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-black/40 border border-white/5 text-center">
              <div className="flex flex-col items-center">
                <span className="text-[9px] font-black uppercase text-gray-500 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-red-400" /> YZ Tespiti
                </span>
                <span className="text-sm font-black text-white mt-0.5">%{aiPct}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[9px] font-black uppercase text-gray-500 flex items-center gap-1">
                  <Search className="w-3 h-3 text-amber-400" /> İntihal Oranı
                </span>
                <span className="text-sm font-black text-white mt-0.5">%{plgPct}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[9px] font-black uppercase text-gray-500 flex items-center gap-1">
                  <BookOpen className="w-3 h-3 text-emerald-400" /> Okunabilirlik
                </span>
                <span className="text-sm font-black text-white mt-0.5">%{readabilityPct}</span>
              </div>
            </div>

            {/* Document Body */}
            <div className="space-y-4 text-sm leading-relaxed text-gray-300 font-serif">
              {humanizedText.split('\n\n').map((para, i) => (
                <p key={i} className="text-justify indent-6">
                  {para}
                </p>
              ))}
            </div>

            {/* Bibliography / Sources */}
            {sources.length > 0 && (
              <div className="pt-6 border-t border-white/10 space-y-2">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Kaynakça ve Taranan Kaynaklar</h4>
                <ul className="space-y-1.5 text-[11px] text-gray-400 list-disc list-inside">
                  {sources.slice(0, 5).map((s, idx) => (
                    <li key={idx} className="truncate">
                      <span className="text-gray-300">{s.title || s.url}</span> — <span className="font-mono text-gray-500 text-[10px]">{s.url}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-brand-border bg-black/30 flex flex-wrap items-center justify-between gap-3">
          <div className="text-[11px] text-gray-500">
            Toplam: <strong className="text-gray-300">{humanizedText.length}</strong> karakter
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onExportDocx();
                onClose();
              }}
              className="px-3.5 py-2 bg-emerald-500 text-black rounded-xl text-xs font-bold hover:bg-emerald-400 transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
            >
              <FileDown className="w-3.5 h-3.5" /> Word (.docx)
            </button>
            <button
              onClick={() => {
                onExportPdf();
                onClose();
              }}
              className="px-3.5 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold border border-white/10 transition-all flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" /> PDF / Yazdır
            </button>
            <button
              onClick={() => {
                onExportTxt();
                onClose();
              }}
              className="px-3 py-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl text-xs font-medium border border-white/5 transition-all flex items-center gap-1.5"
            >
              <Download className="w-3 h-3" /> Metin (.txt)
            </button>
            <button
              onClick={onClose}
              className="px-3 py-2 text-gray-500 hover:text-gray-300 rounded-xl text-xs transition-colors"
            >
              Vazgeç
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
