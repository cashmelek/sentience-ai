import { ArrowLeft, ClipboardList, Download, FileClock, RefreshCw, UserPlus } from 'lucide-react';
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
}: AssignmentDetailViewProps) {
  const scored = submissions.filter((s) => s.status === 'scored');

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
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[9px] font-black uppercase tracking-widest text-gray-500 border-b border-white/5">
                  <th className="px-4 py-3">Öğrenci</th>
                  <th className="px-4 py-3">Başlık</th>
                  <th className="px-4 py-3">Durum</th>
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
                      <td className="px-4 py-3 text-gray-300 max-w-[180px] truncate">{s.title}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border ${chip.cls}`}>{chip.label}</span>
                      </td>
                      <td className={`px-4 py-3 font-black ${scoreColor(s.similarityScore)}`}>{pct(s.similarityScore)}</td>
                      <td className={`px-4 py-3 font-black ${scoreColor(s.aiScore)}`}>{pct(s.aiScore)}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{fmtDateTime(s.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
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
      )}
    </div>
  );
}
