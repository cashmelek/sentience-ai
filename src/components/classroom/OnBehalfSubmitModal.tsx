// B21 Faz 2 — Eğitmen, kayıtlı (veya beklemedeki) öğrenci adına teslim açar.
// Akış: öğrenci seç → başlık + metin/dosya → submitOnBehalf → skorlama → onDone
import { useMemo, useState, type ChangeEvent } from 'react';
import { motion } from 'framer-motion';
import { FileUp, Loader2, UserPlus, X } from 'lucide-react';
import { toast } from 'sonner';
import type { AppUser } from '../../types';
import type { Assignment, ClassRoom, Enrollment, Submission } from '../../types/classroom';
import {
  submitOnBehalf, scoreSubmission, markSubmissionFailed, uploadSubmissionFile
} from '../../services/classroomService';
import { parseDocumentFile } from '../../services/fileParseService';

interface OnBehalfSubmitModalProps {
  cls: ClassRoom;
  assignment: Assignment;
  enrollments: Enrollment[];
  instructor: AppUser;
  scoringConfig: { sentinelEnabled: boolean; auditorModel: string; sensitivity: number };
  onClose: () => void;
  onDone: (submission: Submission) => void;
}

type Phase = 'edit' | 'submitting' | 'scoring';

export function OnBehalfSubmitModal({
  cls,
  assignment,
  enrollments,
  instructor,
  scoringConfig,
  onClose,
  onDone,
}: OnBehalfSubmitModalProps) {
  const sorted = useMemo(
    () => [...enrollments].sort((a, b) => (a.studentName || '').localeCompare(b.studentName || '', 'tr')),
    [enrollments]
  );
  const [studentId, setStudentId] = useState('');
  const [title, setTitle] = useState(`${assignment.title} - Teslim`);
  const [mode, setMode] = useState<'text' | 'file'>('text');
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [phase, setPhase] = useState<Phase>('edit');

  const enrollment = sorted.find((e) => e.studentId === studentId) || null;

  const canSubmit =
    !!enrollment &&
    title.trim().length > 0 &&
    text.trim().length >= 50 &&
    phase === 'edit' &&
    !parsing &&
    (mode === 'text' || (mode === 'file' && !!file));

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    e.target.value = '';
    if (!selected) return;
    setParsing(true);
    try {
      const parsed = await parseDocumentFile(selected);
      setFile(selected);
      setText(parsed.text);
      toast.success(`${parsed.fileName} okundu (${parsed.pageCount ? `${parsed.pageCount} sayfa, ` : ''}${parsed.text.length} karakter)`);
    } catch (err: any) {
      setFile(null);
      toast.error(err?.message || 'Dosya okunamadı');
    } finally {
      setParsing(false);
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit || !enrollment) return;
    setPhase('submitting');
    try {
      let fileMeta: { fileName: string; storagePath: string } | undefined;
      if (mode === 'file' && file) {
        fileMeta = await uploadSubmissionFile(enrollment.studentId, cls.id, assignment.id, file);
      }
      const submission = await submitOnBehalf(instructor, cls.id, assignment.id, enrollment, {
        title,
        text: text.trim(),
        file: fileMeta
      });
      setPhase('scoring');
      toast.success(`${enrollment.studentName} adına teslim alındı, skorlar hesaplanıyor...`);
      try {
        // B21 Faz 2: skor sunucuda hesaplanır (scoreSubmission CF); CF yoksa istemci yedeği devreye girer
        const scores = await scoreSubmission(
          { text: text.trim(), ...scoringConfig },
          { classId: cls.id, assignmentId: assignment.id, studentId: enrollment.studentId }
        );
        onDone({ ...submission, ...scores, status: 'scored' });
      } catch (err) {
        console.error(err);
        await markSubmissionFailed(cls.id, assignment.id, enrollment.studentId).catch(() => {});
        toast.warning('Teslim alındı ancak skorlama sırasında hata oluştu; daha sonra yeniden hesaplayabilirsiniz.');
        onDone(submission);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Teslim başarısız');
      setPhase('edit');
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={phase === 'edit' ? onClose : undefined} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar"
      >
        <button
          onClick={onClose}
          disabled={phase !== 'edit'}
          className="absolute right-4 top-4 p-2 text-gray-500 hover:text-white bg-white/5 rounded-full hover:bg-white/10 transition-all disabled:opacity-40"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 mb-4">
            <UserPlus className="w-6 h-6 text-blue-500" />
          </div>
          <h2 className="text-xl font-black text-white mb-2">Öğrenci Adına Teslim</h2>
          <p className="text-sm text-gray-400">
            {assignment.title} ödevi için öğrenci seçin; teslim öğrenci kimliğiyle, sizin onayınızla açılır.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Öğrenci *</label>
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              disabled={phase !== 'edit'}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all disabled:opacity-60 [&>option]:bg-[#0a0a0a]"
            >
              <option value="">Seçin...</option>
              {sorted.map((e) => (
                <option key={e.studentId} value={e.studentId}>
                  {e.studentName} ({e.studentEmail}){e.pending ? ' — Beklemede' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Teslim Başlığı</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={phase !== 'edit'}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-all disabled:opacity-60"
            />
          </div>

          <div className="flex gap-1 p-1 bg-white/5 border border-white/10 rounded-xl w-fit">
            <button
              type="button"
              onClick={() => setMode('text')}
              disabled={phase !== 'edit'}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 ${mode === 'text' ? 'bg-blue-500 text-black' : 'text-gray-400 hover:text-white'}`}
            >
              Metin Yapıştır
            </button>
            <button
              type="button"
              onClick={() => setMode('file')}
              disabled={phase !== 'edit'}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 ${mode === 'file' ? 'bg-blue-500 text-black' : 'text-gray-400 hover:text-white'}`}
            >
              Dosya Yükle (PDF/DOCX)
            </button>
          </div>

          {mode === 'file' && (
            <div className="flex items-center gap-3 p-4 bg-white/5 border border-dashed border-white/15 rounded-xl">
              <FileUp className="w-5 h-5 text-blue-400 shrink-0" />
              {file ? (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">{file.name}</p>
                    <p className="text-[10px] text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB • {text.trim().length} karakter çıkarıldı
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    disabled={phase !== 'edit'}
                    className="p-2 rounded-lg text-gray-500 hover:text-red-400 transition-all disabled:opacity-40"
                    title="Dosyayı kaldır"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <label className="flex-1 cursor-pointer">
                  <span className="text-xs text-gray-400">
                    {parsing ? 'Dosya okunuyor...' : 'PDF veya DOCX seçin (en fazla 20 MB)'}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleFileChange}
                    disabled={parsing || phase !== 'edit'}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                {mode === 'file' ? 'Dosyadan Çıkarılan Metin' : 'Metin'}
              </label>
              <span className="text-[10px] font-bold text-gray-600">{text.trim().length} karakter (min. 50)</span>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={phase !== 'edit'}
              rows={8}
              placeholder={mode === 'file' ? 'Dosya seçildiğinde çıkarılan metin burada görünür...' : 'Öğrenci adına teslim edilecek metni yapıştırın...'}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-all resize-y disabled:opacity-60 custom-scrollbar"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full flex items-center justify-center gap-2 py-4 bg-blue-500 text-black font-black rounded-xl hover:bg-blue-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs uppercase tracking-widest"
          >
            {phase === 'edit' && 'Teslimi Aç ve Skorla'}
            {phase === 'submitting' && (<><Loader2 className="w-4 h-4 animate-spin" /> Teslim Alınıyor...</>)}
            {phase === 'scoring' && (<><Loader2 className="w-4 h-4 animate-spin" /> Benzerlik + YZ Skoru Hesaplanıyor...</>)}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
