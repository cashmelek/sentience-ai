import { ArrowLeft, ClipboardList, Download, FileClock, RefreshCw, UserPlus, FileText, FileUp, Files, Users } from 'lucide-react';
import { toast } from 'sonner';
import { getSubmissionFileUrl } from '../../services/classroomService';
import type { ClassRoom, Assignment, Submission } from '../../types/classroom';
import { fmtDate, fmtDateTime, scoreColor, pct } from './format';

interface AssignmentDetailViewProps {
  cls: ClassRoom;
  assignment: Assignment;
  submissions: Submission[];
  busyId?: string | null;
  onBack: () => void;
  onOpenReport: (s: Submission) => void;
  onRerun: (s: Submission) => void;
  onDownloadCsv: () => void;
  onDownloadExcel: () => void;
  // B21 Faz 2: öğrenci adına teslim (kayıtlı öğrenci varsa etkin)
  canSubmitOnBehalf: boolean;
  onOpenBehalf: () => void;
  onOpenBatch?: () => void;
  onOpenPeerMatrix?: () => void;
}

const statusChip: Record<string, { label: string; cls: string }> = {
  received: { label: 'Alındı', cls: 'text-gray-400 bg-white/5 border-white/10' },
  processing: { label: 'İşleniyor', cls: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
  scored: { label: 'Skorlandı', cls: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
  failed: { label: 'Hata', cls: 'text-red-500 bg-red-500/10 border-red-500/20' },
};

export function AssignmentDetailView({
  cls,
  assignment,
  submissions,
  busyId,
  onBack,
  onOpenReport,
  onRerun,
  onDownloadCsv,
  onDownloadExcel,
  canSubmitOnBehalf,
  onOpenBehalf,
  onOpenBatch,
  onOpenPeerMatrix,
}: AssignmentDetailViewProps) {
  const scored = submissions.filter((s) => s.status === 'scored');

  const handleDownloadOriginal = async (s: Submission) => {
    if (!s.storagePath) return;
    try {
      const url = await getSubmissionFileUrl(s.storagePath);
      window.open(url, '_blank');
    } catch (err: any) {
      toast.error(err?.message || 'Orijinal dosya indirilemedi');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2.5 bg-white/5 border border-white/5 rounded-xl text-gray-400 hover:text-white transition-all">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{cls.name}</p>
          <h3 className="text-xl font-black text-white uppercase tracking-tight truncate">{assignment.title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Son teslim: <span className="text-amber-500 font-bold">{fmtDate(assignment.dueDate)}</span>
            {' · '}Teslim: {submissions.length}
            {scored.length > 0 && ` · Ort. benzerlik: %${Math.round((scored.reduce((t, s) => t + (s.similarityScore || 0), 0) / scored.length) * 100)}`}
          </p>
        </div>
        <button
          onClick={onOpenBehalf}
          disabled={!canSubmitOnBehalf}
          title={canSubmitOnBehalf ? 'Kayıtlı bir öğrenci adına teslim açın' : 'Öğrenci adına teslim için önce sınıfa öğrenci ekleyin'}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <UserPlus className="w-4 h-4" /> Adına Teslim
        </button>
        {onOpenBatch && (
          <button
            onClick={onOpenBatch}
            disabled={!canSubmitOnBehalf}
            title={canSubmitOnBehalf ? 'Toplu ödev dosyası yükleyin ve sırayla taratın' : 'Toplu yükleme için önce sınıfa öğrenci ekleyin'}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-500/15 border border-purple-500/30 text-purple-300 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Files className="w-4 h-4 text-purple-400" /> Toplu Yükleme
          </button>
        )}
        {onOpenPeerMatrix && (
          <button
            onClick={onOpenPeerMatrix}
            disabled={submissions.length < 2}
            title={submissions.length >= 2 ? 'Öğrencilerin teslimleri arasındaki iç benzerlikleri karşılaştırın' : 'Eş-düzey analizi için en az 2 teslim gereklidir'}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/15 border border-amber-500/30 text-amber-300 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Users className="w-4 h-4 text-amber-400" /> Eş-Düzey Matrisi
          </button>
        )}
        <button
          onClick={onDownloadCsv}
          disabled={submissions.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-300 hover:text-white hover:bg-white/10 transition-all disabled:opacity-40"
        >
          <Download className="w-4 h-4" /> CSV
        </button>
        <button
          onClick={onDownloadExcel}
          disabled={submissions.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-emerald-400 hover:text-white hover:bg-emerald-500/20 transition-all disabled:opacity-40"
        >
          <Download className="w-4 h-4" /> Excel
        </button>
      </div>

      {assignment.instructions && (
        <div className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl text-sm text-gray-400 whitespace-pre-wrap">
          {assignment.instructions}
        </div>
      )}

      {submissions.length === 0 ? (
        <div className="py-16 border border-dashed border-white/10 rounded-3xl text-center">
          <FileClock className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-sm text-gray-500 font-bold">Henüz teslim yok.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Mobile Card List (Visible on < 768px) */}
          <div className="md:hidden space-y-3">
            {submissions.map((s) => {
              const chip = statusChip[s.status] || statusChip.received;
              return (
                <div key={s.id} className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-white text-sm truncate">{s.studentName}</p>
                      <p className="text-[11px] text-gray-500 truncate">{s.studentEmail}</p>
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border shrink-0 ${chip.cls}`}>
                      {chip.label}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-gray-300 font-medium truncate">{s.title}</p>
                    {s.fileName && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-blue-400 font-mono">
                        <FileUp className="w-3 h-3 shrink-0" />
                        <span className="truncate">{s.fileName}</span>
                      </span>
                    )}
                  </div>

                  {/* Metrics Row */}
                  <div className="grid grid-cols-3 gap-2 py-2 border-y border-white/5 text-center">
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-gray-500 block">Benzerlik</span>
                      <span className={`text-xs font-black ${scoreColor(s.similarityScore)}`}>
                        {pct(s.similarityScore)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-gray-500 block">YZ Skoru</span>
                      <span className={`text-xs font-black ${scoreColor(s.aiScore)}`}>
                        {pct(s.aiScore)}
                      </span>
                      {s.hasInternalGeneratorMatch && (
                        <span className="block mt-0.5 text-[8px] font-bold text-red-400">
                          ⚠️ Havuz İzi
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-gray-500 block">Not</span>
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        {typeof s.grade === 'number' ? s.grade : '—'}
                      </span>
                    </div>
                  </div>

                  {/* Actions & Timestamp */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="text-[10px] text-gray-500">
                      {fmtDateTime(s.createdAt)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {s.storagePath && (
                        <button
                          onClick={() => handleDownloadOriginal(s)}
                          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-blue-400 min-h-[38px] min-w-[38px] flex items-center justify-center transition-all cursor-pointer"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => onRerun(s)}
                        disabled={busyId === s.id}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-amber-400 min-h-[38px] min-w-[38px] flex items-center justify-center transition-all disabled:opacity-40 cursor-pointer"
                      >
                        <RefreshCw className={`w-4 h-4 ${busyId === s.id ? 'animate-spin' : ''}`} />
                      </button>
                      <button
                        onClick={() => onOpenReport(s)}
                        className="px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5 min-h-[38px] transition-all cursor-pointer"
                      >
                        <ClipboardList className="w-4 h-4" />
                        <span>Rapor</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table (Hidden on < 768px) */}
          <div className="hidden md:block bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[9px] font-black uppercase tracking-widest text-gray-500 border-b border-white/5">
                  <th className="px-4 py-3">Öğrenci</th>
                  <th className="px-4 py-3">Başlık</th>
                  <th className="px-4 py-3">Durum</th>
                  <th className="px-4 py-3 text-center">Not</th>
                  <th className="px-4 py-3">Benzerlik</th>
                  <th className="px-4 py-3">YZ Skoru</th>
                  <th className="px-4 py-3">Teslim Tarihi</th>
                  <th className="px-4 py-3 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {submissions.map((s) => {
                  const chip = statusChip[s.status] || statusChip.received;
                  return (
                    <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-bold text-white">{s.studentName}</p>
                        <p className="text-[10px] text-gray-500">{s.studentEmail}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-300 max-w-[200px]">
                        <p className="truncate font-medium">{s.title}</p>
                        {s.fileName && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-blue-400 font-mono mt-0.5">
                            <FileUp className="w-3 h-3 shrink-0" />
                            <span className="truncate max-w-[150px]">{s.fileName}</span>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border ${chip.cls}`}>{chip.label}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {typeof s.grade === 'number' ? (
                          <span className="inline-block font-mono font-black text-xs px-2 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                            {s.grade}
                          </span>
                        ) : (
                          <span className="text-gray-600 font-mono text-xs">—</span>
                        )}
                      </td>
                      <td className={`px-4 py-3 font-black ${scoreColor(s.similarityScore)}`}>{pct(s.similarityScore)}</td>
                      <td className={`px-4 py-3 font-black ${scoreColor(s.aiScore)}`}>
                        <div className="flex items-center gap-1.5">
                          <span>{pct(s.aiScore)}</span>
                          {s.hasInternalGeneratorMatch && (
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-red-500/20 text-red-400 border border-red-500/30" title="Sentetik Üretim İzi: Platform içi insanlaştırma havuzuyla eşleşti!">
                              HAVUZ İZİ
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <span className="text-gray-400 block">{fmtDateTime(s.createdAt)}</span>
                        {s.isLate && (
                          <span className="inline-block mt-0.5 text-[8px] font-black uppercase tracking-wider text-rose-400 bg-rose-500/15 border border-rose-500/30 px-1.5 py-0.5 rounded">
                            Gecikmiş {s.lateDurationMinutes ? `(${Math.round(s.lateDurationMinutes / 60)} sa)` : ''}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {s.storagePath && (
                            <button
                              onClick={() => handleDownloadOriginal(s)}
                              title={`Orijinal Dosyayı İndir (${s.fileName || 'Dosya'})`}
                              className="p-2 text-gray-500 hover:text-blue-400 transition-all"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => onOpenReport(s)}
                            title="Raporu aç"
                            className="p-2 text-gray-500 hover:text-emerald-400 transition-all"
                          >
                            <ClipboardList className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onRerun(s)}
                            disabled={busyId === s.id}
                            title="Skoru yeniden hesapla"
                            className="p-2 text-gray-500 hover:text-amber-400 transition-all disabled:opacity-40"
                          >
                            <RefreshCw className={`w-4 h-4 ${busyId === s.id ? 'animate-spin' : ''}`} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      )}
    </div>
  );
}
