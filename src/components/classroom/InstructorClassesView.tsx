import { Copy, GraduationCap, KeyRound, Archive, ArchiveRestore, Pencil, ArrowRight, Plus, Users } from 'lucide-react';
import { toast } from 'sonner';
import type { ClassRoom } from '../../types/classroom';
import { fmtDate } from './format';

interface InstructorClassesViewProps {
  classes: ClassRoom[];
  onCreate: () => void;
  onOpen: (cls: ClassRoom) => void;
  onEdit: (cls: ClassRoom) => void;
  onArchiveToggle: (cls: ClassRoom) => void;
  onRegenerateKey: (cls: ClassRoom) => void;
}

const copy = async (value: string, label: string) => {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} kopyalandı`);
  } catch {
    toast.error('Kopyalama başarısız');
  }
};

export function InstructorClassesView({
  classes,
  onCreate,
  onOpen,
  onEdit,
  onArchiveToggle,
  onRegenerateKey,
}: InstructorClassesViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black text-white uppercase tracking-tight">Verdiğim Sınıflar</h3>
          <p className="text-xs text-gray-500 mt-1">Öğrenciler kod ve anahtar ile kendi kendine kayıt olur.</p>
        </div>
        <button
          onClick={onCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all"
        >
          <Plus className="w-4 h-4" /> Yeni Sınıf
        </button>
      </div>

      {classes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-white/10 rounded-3xl">
          <GraduationCap className="w-12 h-12 text-gray-700 mb-4" />
          <p className="text-sm text-gray-500 font-bold">Henüz sınıf oluşturmadınız.</p>
          <p className="text-xs text-gray-600 mt-1">"Yeni Sınıf" ile ilk sınıfınızı açın.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {classes.map((cls) => (
            <div
              key={cls.id}
              className={`bg-white/[0.03] border border-white/5 rounded-3xl p-5 hover:border-emerald-500/30 transition-all ${cls.archived ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <h4 className="font-black text-white truncate">{cls.name}</h4>
                  <p className="text-[11px] text-gray-500 truncate">
                    {[cls.subject, cls.term].filter(Boolean).join(' · ') || '—'}
                  </p>
                </div>
                {cls.archived && (
                  <span className="text-[9px] font-black uppercase tracking-widest text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg shrink-0">Arşiv</span>
                )}
              </div>

              <div className="space-y-2 mb-4">
                <button
                  onClick={() => copy(cls.classCode, 'Sınıf kodu')}
                  className="w-full flex items-center justify-between px-3 py-2 bg-black/30 border border-white/5 rounded-xl hover:border-emerald-500/30 transition-all group"
                >
                  <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Sınıf Kodu</span>
                  <span className="flex items-center gap-2 text-sm font-black text-emerald-400 tracking-widest">
                    {cls.classCode} <Copy className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </span>
                </button>
                <button
                  onClick={() => copy(cls.enrollmentKey, 'Kayıt anahtarı')}
                  className="w-full flex items-center justify-between px-3 py-2 bg-black/30 border border-white/5 rounded-xl hover:border-emerald-500/30 transition-all group"
                >
                  <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Kayıt Anahtarı</span>
                  <span className="flex items-center gap-2 text-sm font-black text-blue-400 tracking-widest">
                    {cls.enrollmentKey} <Copy className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </span>
                </button>
              </div>

              <div className="flex items-center gap-4 text-[10px] font-bold text-gray-500 mb-4">
                <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {cls.studentCount ?? 0} öğrenci</span>
                <span>{fmtDate(cls.createdAt)}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpen(cls)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-all"
                >
                  Yönet <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => onEdit(cls)} title="Düzenle" className="p-2.5 bg-white/5 border border-white/5 rounded-xl text-gray-400 hover:text-white transition-all">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => onRegenerateKey(cls)} title="Kayıt anahtarını yenile" className="p-2.5 bg-white/5 border border-white/5 rounded-xl text-gray-400 hover:text-amber-400 transition-all">
                  <KeyRound className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onArchiveToggle(cls)}
                  title={cls.archived ? 'Arşivden çıkar' : 'Arşivle'}
                  className="p-2.5 bg-white/5 border border-white/5 rounded-xl text-gray-400 hover:text-blue-400 transition-all"
                >
                  {cls.archived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
