import { useState } from 'react';
import { ArrowLeft, ClipboardList, Plus, Trash2, UploadCloud, Users } from 'lucide-react';
import type { ClassRoom, Assignment, Enrollment } from '../../types/classroom';
import { parseBulkRoster } from '../../services/classroomService';
import { fmtDate } from './format';

interface InstructorClassDetailProps {
  cls: ClassRoom;
  assignments: Assignment[];
  enrollments: Enrollment[];
  onBack: () => void;
  onCreateAssignment: () => void;
  onEditAssignment: (a: Assignment) => void;
  onDeleteAssignment: (a: Assignment) => void;
  onOpenAssignment: (a: Assignment) => void;
  onRemoveEnrollment: (studentId: string, name: string) => void;
  // B21 Faz 2: toplu öğrenci listesi içe aktarma
  onBulkEnroll: (entries: Array<{ name: string; email: string }>) => void;
}

export function InstructorClassDetail({
  cls,
  assignments,
  enrollments,
  onBack,
  onCreateAssignment,
  onEditAssignment,
  onDeleteAssignment,
  onOpenAssignment,
  onRemoveEnrollment,
  onBulkEnroll,
}: InstructorClassDetailProps) {
  const [showBulk, setShowBulk] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const parsedRoster = parseBulkRoster(bulkText);
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2.5 bg-white/5 border border-white/5 rounded-xl text-gray-400 hover:text-white transition-all">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-black text-white uppercase tracking-tight truncate">{cls.name}</h3>
          <p className="text-xs text-gray-500">
            Kod: <span className="text-emerald-400 font-black tracking-widest">{cls.classCode}</span>
            {' · '}Anahtar: <span className="text-blue-400 font-black tracking-widest">{cls.enrollmentKey}</span>
          </p>
        </div>
        <button
          onClick={onCreateAssignment}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all"
        >
          <Plus className="w-4 h-4" /> Yeni Ödev
        </button>
      </div>

      <div className="space-y-3">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-500/80 flex items-center gap-2">
          <ClipboardList className="w-3.5 h-3.5" /> Ödevler ({assignments.length})
        </h4>
        {assignments.length === 0 ? (
          <div className="py-10 border border-dashed border-white/10 rounded-3xl text-center">
            <p className="text-sm text-gray-500 font-bold">Henüz ödev yok.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {assignments.map((a) => (
              <div
                key={a.id}
                onClick={() => onOpenAssignment(a)}
                className="flex items-center gap-4 p-4 bg-white/[0.03] border border-white/5 rounded-2xl hover:border-emerald-500/30 transition-all cursor-pointer group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white truncate">{a.title}</span>
                    {a.noRepository && (
                      <span className="text-[8px] font-black uppercase tracking-widest text-gray-500 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded">Depo Kapalı</span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 truncate mt-0.5">
                    {a.instructions ? a.instructions.slice(0, 80) : 'Talimat yok'}
                  </p>
                  <p className="text-[10px] text-gray-600 mt-1">
                    Son teslim: <span className={a.dueDate ? 'text-amber-500 font-bold' : ''}>{fmtDate(a.dueDate)}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => onEditAssignment(a)} title="Düzenle" className="p-2 text-gray-500 hover:text-white transition-all">
                    <ClipboardList className="w-4 h-4" />
                  </button>
                  <button onClick={() => onDeleteAssignment(a)} title="Sil" className="p-2 text-gray-500 hover:text-red-500 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-400/80 flex items-center gap-2">
            <Users className="w-3.5 h-3.5" /> Kayıtlı Öğrenciler ({enrollments.length})
          </h4>
          <button
            onClick={() => setShowBulk((v) => !v)}
            className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-300 hover:text-white hover:bg-white/10 transition-all"
          >
            <UploadCloud className="w-3.5 h-3.5" /> Liste Yükle
          </button>
        </div>

        {showBulk && (
          <div className="p-4 bg-white/[0.03] border border-white/10 rounded-2xl space-y-3">
            <p className="text-[11px] text-gray-500">
              Her satıra bir öğrenci: <span className="text-gray-300 font-bold">Ad Soyad, eposta</span> (yalnız eposta da olur).
              Hesabı olmayan öğrenciler <span className="text-amber-500 font-bold">Beklemede</span> işaretlenir; sınıf koduyla ilk katıldıklarında kayıtları devralınır.
            </p>
            <textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              rows={6}
              placeholder={'Ayşe Yılmaz, ayse@ornek.edu\nmehmet@ornek.edu'}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-all resize-y custom-scrollbar"
            />
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] font-bold text-gray-600">{parsedRoster.length} öğrenci algılandı</span>
              <button
                onClick={() => {
                  onBulkEnroll(parsedRoster);
                  setBulkText('');
                  setShowBulk(false);
                }}
                disabled={parsedRoster.length === 0}
                className="px-4 py-2.5 bg-blue-500 text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Listeyi İçe Aktar
              </button>
            </div>
          </div>
        )}
        {enrollments.length === 0 ? (
          <div className="py-8 border border-dashed border-white/10 rounded-3xl text-center">
            <p className="text-sm text-gray-500 font-bold">Henüz öğrenci kaydı yok.</p>
            <p className="text-xs text-gray-600 mt-1">Kodu ve anahtarı öğrencilerinizle paylaşın.</p>
          </div>
        ) : (
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl divide-y divide-white/5">
            {enrollments.map((e) => (
              <div key={e.id} className="flex items-center gap-4 px-4 py-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shrink-0">
                  <Users className="w-4 h-4 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-white truncate">{e.studentName}</p>
                    {e.pending && (
                      <span className="text-[8px] font-black uppercase tracking-widest text-amber-500 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded shrink-0">Beklemede</span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 truncate">{e.studentEmail}</p>
                </div>
                <span className="text-[10px] text-gray-600">{fmtDate(e.joinedAt)}</span>
                <button
                  onClick={() => onRemoveEnrollment(e.studentId, e.studentName)}
                  title="Sınıftan çıkar"
                  className="p-2 text-gray-600 hover:text-red-500 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
