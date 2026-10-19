import { ArrowLeft, ClipboardList, FileCheck2, GraduationCap, UploadCloud } from 'lucide-react';
import type { ClassRoom, Assignment, Submission } from '../../types/classroom';
import { fmtDate, fmtDateTime, scoreColor, pct } from './format';

interface StudentClassViewProps {
  cls: ClassRoom;
  assignments: Assignment[];
  mySubmissions: Record<string, Submission | undefined>;
  onBack: () => void;
  onSubmit: (a: Assignment) => void;
  onViewReport: (a: Assignment, s: Submission) => void;
}

export function StudentClassView({
  cls,
  assignments,
  mySubmissions,
  onBack,
  onSubmit,
  onViewReport,
}: StudentClassViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2.5 bg-white/5 border border-white/5 rounded-xl text-gray-400 hover:text-white transition-all">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-black text-white uppercase tracking-tight truncate">{cls.name}</h3>
          <p className="text-xs text-gray-500">
            Eğitmen: <span className="text-gray-300 font-bold">{cls.instructorName}</span>
            {cls.subject && ` · ${cls.subject}`}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-400/80 flex items-center gap-2">
          <ClipboardList className="w-3.5 h-3.5" /> Ödevlerim ({assignments.length})
        </h4>
        {assignments.length === 0 ? (
          <div className="py-16 border border-dashed border-white/10 rounded-3xl text-center">
            <GraduationCap className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-500 font-bold">Bu sınıfta henüz ödev yayınlanmadı.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {assignments.map((a) => {
              const mine = mySubmissions[a.id];
              const due = a.dueDate ? new Date(a.dueDate) : null;
              const overdue = due ? due.getTime() < Date.now() : false;
              return (
                <div key={a.id} className="p-5 bg-white/[0.03] border border-white/5 rounded-3xl space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-white">{a.title}</span>
                        {overdue && !mine && (
                          <span className="text-[8px] font-black uppercase tracking-widest text-red-500 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded">Süresi Geçti</span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 mt-1">
                        Son teslim: <span className="text-amber-500 font-bold">{fmtDate(a.dueDate)}</span>
                      </p>
                      {a.instructions && (
                        <p className="text-xs text-gray-400 mt-2 whitespace-pre-wrap bg-black/20 rounded-xl p-3 border border-white/5">{a.instructions}</p>
                      )}
                    </div>
                  </div>

                  {mine ? (
                    <div className="flex items-center gap-4 flex-wrap">
                      <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-500">
                        <FileCheck2 className="w-3.5 h-3.5" /> Teslim Edildi
                      </span>
                      {mine.status === 'scored' ? (
                        <>
                          <span className={`text-xs font-black ${scoreColor(mine.similarityScore)}`}>Benzerlik: {pct(mine.similarityScore)}</span>
                          <span className={`text-xs font-black ${scoreColor(mine.aiScore)}`}>YZ: {pct(mine.aiScore)}</span>
                        </>
                      ) : (
                        <span className="text-[10px] text-gray-500 uppercase font-black">{mine.status === 'failed' ? 'Skorlama hatası' : 'Skorlanıyor...'}</span>
                      )}
                      <span className="text-[10px] text-gray-600">{fmtDateTime(mine.createdAt)}</span>
                      <div className="flex-1" />
                      <button
                        onClick={() => mine.status === 'scored' && onViewReport(a, mine)}
                        disabled={mine.status !== 'scored'}
                        className="px-4 py-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-all disabled:opacity-40"
                      >
                        Raporu Gör
                      </button>
                      <button
                        onClick={() => onSubmit(a)}
                        className="px-4 py-2 bg-white/5 text-gray-300 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all"
                      >
                        Yeniden Teslim Et
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => onSubmit(a)}
                        disabled={overdue}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <UploadCloud className="w-4 h-4" /> Teslim Et
                      </button>
                      {overdue && <span className="text-[10px] text-gray-600 font-bold">Teslim süresi geçmiş.</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
