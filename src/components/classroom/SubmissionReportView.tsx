import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Database, Download, FileDown, FileText, RefreshCw, ShieldCheck, X, Zap, Filter } from 'lucide-react';
import { toast } from 'sonner';
import type { ClassRoom, Assignment, Submission } from '../../types/classroom';
import { fmtDateTime, scoreColor, scoreBarClass, pct } from './format';
import { exportSubmissionReportPDF, matchGroupLabel, trustLabel } from './submissionExport';

const matchGroupBadge: Record<string, { label: string; cls: string; icon: string }> = {
  not_cited_or_quoted: { label: 'Atıf & Tırnak Yok', cls: 'bg-rose-500/15 text-rose-400 border-rose-500/30', icon: '🔴' },
  missing_quotations: { label: 'Tırnak Eksik', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30', icon: '🟠' },
  missing_citation: { label: 'Kaynakça Eksik', cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30', icon: '🟡' },
  cited_and_quoted: { label: 'Doğru Atıf', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', icon: '🟢' },
  peer_match: { label: 'Eş-Öğrenci Eşleşmesi', cls: 'bg-purple-500/15 text-purple-400 border-purple-500/30', icon: '👥' },
  self_plagiarism: { label: 'Öz-İntihal', cls: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30', icon: '🔄' },
};

interface SubmissionReportViewProps {
  cls: ClassRoom;
  assignment: Assignment;
  submission: Submission;
  canExclude: boolean;
  busy?: boolean;
  onToggleExclude: (url: string, excluded: boolean) => void;
  onRerun: () => void;
  onClose: () => void;
}

export function SubmissionReportView({
  cls,
  assignment,
  submission,
  canExclude,
  busy,
  onToggleExclude,
  onRerun,
  onClose,
}: SubmissionReportViewProps) {
  const [matchFilter, setMatchFilter] = useState<string>('all');
  const excluded = new Set(submission.excludedSourceUrls || []);
  const sources = submission.sources || [];

  const downloadText = () => {
    const blob = new Blob([submission.text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${submission.title.replace(/[^\wçÇğĞıİöÖşŞüÜ -]/g, '').slice(0, 60) || 'teslim'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyHash = async () => {
    if (!submission.digitalReceipt) return;
    try {
      await navigator.clipboard.writeText(submission.digitalReceipt.sha256);
      toast.success('SHA-256 özeti kopyalandı');
    } catch {
      toast.error('Kopyalama başarısız');
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-3xl bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar"
      >
        <div className="sticky top-0 z-10 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">{cls.name} · {assignment.title}</p>
            <h2 className="text-lg font-black text-white truncate">{submission.title}</h2>
            <p className="text-[11px] text-gray-500">{submission.studentName} · {submission.studentEmail}</p>
          </div>
          {canExclude && (
            <button
              onClick={onRerun}
              disabled={busy}
              title="Skoru yeniden hesapla"
              className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-300 hover:text-white hover:bg-white/10 transition-all disabled:opacity-40"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} /> Yeniden Hesapla
            </button>
          )}
          <button
            onClick={() => exportSubmissionReportPDF(cls, assignment, submission)}
            title="PDF rapor indir (dijital makbuz dahil)"
            className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-emerald-400 hover:bg-emerald-500/20 transition-all"
          >
            <FileDown className="w-3.5 h-3.5" /> PDF
          </button>
          <button
            onClick={downloadText}
            title="Özgün metni indir"
            className="p-2 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all"
          >
            <Download className="w-4 h-4" />
          </button>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-white bg-white/5 rounded-xl hover:bg-white/10 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Benzerlik Skoru', value: submission.similarityScore },
              { label: 'YZ Olasılığı', value: submission.aiScore },
            ].map((m) => (
              <div key={m.label} className="p-5 bg-white/[0.03] border border-white/5 rounded-2xl">
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">{m.label}</p>
                <p className={`text-4xl font-black ${scoreColor(m.value)}`}>{pct(m.value)}</p>
                <div className="mt-3 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className={`h-full ${scoreBarClass(m.value)} rounded-full transition-all`} style={{ width: `${Math.round((m.value ?? 0) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>

          {submission.digitalReceipt && (
            <div className="p-4 bg-emerald-500/[0.05] border border-emerald-500/15 rounded-2xl flex items-center gap-4 flex-wrap">
              <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
              <div className="flex-1 min-w-[200px]">
                <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500/80">Dijital Makbuz (SHA-256)</p>
                <button onClick={copyHash} className="group flex items-center gap-2 mt-1" title="Kopyala">
                  <span className="text-xs font-mono text-gray-300 break-all">{submission.digitalReceipt.sha256.slice(0, 32)}...</span>
                  <Copy className="w-3.5 h-3.5 text-gray-600 group-hover:text-emerald-400 transition-colors shrink-0" />
                </button>
                <p className="text-[10px] text-gray-600 mt-1">
                  {fmtDateTime(submission.digitalReceipt.submittedAt)} · {submission.digitalReceipt.textLength} karakter
                </p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                <FileText className="w-3.5 h-3.5" /> Eşleşen Kaynaklar ({sources.length})
              </h4>
              {canExclude && sources.length > 0 && (
                <span className="text-[9px] text-gray-600 font-bold">Dışlanan kaynaklar benzerlik raporundan çıkarılır.</span>
              )}
            </div>

            {sources.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 py-1">
                <button
                  onClick={() => setMatchFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${matchFilter === 'all' ? 'bg-white/10 text-white font-black' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  Tümü ({sources.length})
                </button>
                {['not_cited_or_quoted', 'missing_quotations', 'missing_citation', 'cited_and_quoted'].map((mg) => {
                  const count = sources.filter(s => s.matchGroup === mg).length;
                  if (count === 0) return null;
                  const conf = matchGroupBadge[mg];
                  return (
                    <button
                      key={mg}
                      onClick={() => setMatchFilter(mg)}
                      className={`px-2 py-1 rounded-lg text-[9px] font-bold border transition-all flex items-center gap-1 ${matchFilter === mg ? `${conf.cls} font-black` : 'bg-white/5 border-white/5 text-gray-400 hover:text-gray-200'}`}
                    >
                      <span>{conf.icon}</span>
                      <span>{conf.label}</span>
                      <span className="opacity-60 font-mono">({count})</span>
                    </button>
                  );
                })}
                {sources.some(s => s.url.startsWith('internal://')) && (
                  <button
                    onClick={() => setMatchFilter('repository')}
                    className={`px-2 py-1 rounded-lg text-[9px] font-bold border transition-all flex items-center gap-1 ${matchFilter === 'repository' ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30 font-black' : 'bg-white/5 border-white/5 text-gray-400 hover:text-gray-200'}`}
                  >
                    <span>🏛️</span>
                    <span>Depo / Semantik</span>
                    <span className="opacity-60 font-mono">({sources.filter(s => s.url.startsWith('internal://')).length})</span>
                  </button>
                )}
              </div>
            )}

            {sources.length === 0 ? (
              <div className="py-10 border border-dashed border-white/10 rounded-2xl text-center">
                <p className="text-sm text-gray-500 font-bold">Eşleşen kaynak bulunamadı.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {sources
                  .filter((s) => {
                    if (matchFilter === 'all') return true;
                    if (matchFilter === 'repository') return s.url.startsWith('internal://');
                    return s.matchGroup === matchFilter;
                  })
                  .map((s, i) => {
                    const isExcluded = excluded.has(s.url);
                    const isInternal = s.url.startsWith('internal://repository/');
                    const isVector = s.url.startsWith('internal://vector/');
                    const mg = matchGroupBadge[s.matchGroup] || { label: s.matchGroup, cls: 'bg-white/5 text-gray-400 border-white/10', icon: '📄' };
                    return (
                      <div
                        key={`${s.url}-${i}`}
                        className={`p-4 bg-white/[0.03] border rounded-2xl transition-all ${isExcluded ? 'border-white/5 opacity-50' : 'border-white/5'}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              {isVector ? (
                                <span className="text-sm font-bold text-purple-400 flex items-center gap-1.5 truncate max-w-[420px]">
                                  <Zap className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                                  {s.title || 'Semantik Vektör Eşleşmesi'}
                                </span>
                              ) : isInternal ? (
                                <span className="text-sm font-bold text-indigo-400 flex items-center gap-1.5 truncate max-w-[420px]">
                                  <Database className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                  {s.title || 'Sınıf İçi Teslim Deposu'}
                                </span>
                              ) : (
                                <a href={s.url} target="_blank" rel="noreferrer" className="text-sm font-bold text-blue-400 hover:text-blue-300 truncate max-w-[420px]">
                                  {s.title || s.url}
                                </a>
                              )}
                              {s.similarity !== undefined && (
                                <span className="text-[8px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                                  %{Math.round(s.similarity * 100)} Benzerlik
                                </span>
                              )}
                              {s.trust && (
                                <span className="text-[8px] font-black uppercase tracking-widest text-gray-500 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded">
                                  Güven: {trustLabel[s.trust] || s.trust}
                                </span>
                              )}
                              {s.matchGroup && (
                                <span className={`text-[8px] font-black uppercase tracking-wider border px-1.5 py-0.5 rounded flex items-center gap-1 ${mg.cls}`}>
                                  <span>{mg.icon}</span>
                                  <span>{mg.label}</span>
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{s.snippet || s.matchedText || ''}</p>
                            <p className="text-[10px] text-gray-600 mt-1 truncate">
                              {isVector ? 'Geçmiş Proje Vektör Benzerliği' : isInternal ? 'Sınıf Deposu Parmak İzi Karşılaştırması' : s.url}
                            </p>
                          </div>
                          {canExclude && (
                            <label className="flex items-center gap-2 shrink-0 cursor-pointer" title={isExcluded ? 'Dahil et' : 'Dışla'}>
                              <input
                                type="checkbox"
                                checked={isExcluded}
                                onChange={(e) => onToggleExclude(s.url, e.target.checked)}
                                className="w-4 h-4 accent-amber-500"
                              />
                              <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">{isExcluded ? 'Dışlandı' : 'Dışla'}</span>
                            </label>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
