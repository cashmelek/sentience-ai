import { useState, type ChangeEvent } from 'react';
import { motion } from 'framer-motion';
import { Files, Loader2, X, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { AppUser } from '../../types';
import type { Assignment, ClassRoom, Enrollment, Submission } from '../../types/classroom';
import {
  submitOnBehalf, scoreSubmission, markSubmissionFailed, uploadSubmissionFile
} from '../../services/classroomService';
import { parseDocumentFile } from '../../services/fileParseService';

interface BatchSubmitModalProps {
  cls: ClassRoom;
  assignment: Assignment;
  enrollments: Enrollment[];
  instructor: AppUser;
  scoringConfig: { sentinelEnabled: boolean; auditorModel: string; sensitivity: number };
  onClose: () => void;
  onDone: () => void;
}

interface BatchQueueItem {
  id: string;
  file: File;
  studentId: string;
  studentName: string;
  studentEmail: string;
  title: string;
  text?: string;
  status: 'pending' | 'parsing' | 'submitting' | 'scored' | 'error';
  errorMessage?: string;
}

export function BatchSubmitModal({
  cls,
  assignment,
  enrollments,
  instructor,
  scoringConfig,
  onClose,
  onDone,
}: BatchSubmitModalProps) {
  const [queue, setQueue] = useState<BatchQueueItem[]>([]);
  const [processing, setProcessing] = useState(false);

  // Dosya adından öğrenciyi tahmin etmeye çalış (örn: "Ahmet_Yilmaz_Odev.docx")
  const matchStudentByFileName = (fileName: string): Enrollment | undefined => {
    const cleanName = fileName.toLowerCase().replace(/[^a-z0-9ğüşıöç]/g, '');
    return enrollments.find((e) => {
      const sName = (e.studentName || '').toLowerCase().replace(/[^a-z0-9ğüşıöç]/g, '');
      const sEmail = (e.studentEmail || '').toLowerCase();
      return cleanName.includes(sName) || cleanName.includes(sEmail.split('@')[0]);
    });
  };

  const handleFilesSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;

    const newItems: BatchQueueItem[] = files.map((file) => {
      const guessed = matchStudentByFileName(file.name);
      return {
        id: 'bq_' + Math.random().toString(36).substring(2, 9),
        file,
        studentId: guessed ? guessed.studentId : '',
        studentName: guessed ? guessed.studentName : '',
        studentEmail: guessed ? guessed.studentEmail : '',
        title: file.name.replace(/\.[^/.]+$/, ''),
        status: 'pending',
      };
    });

    setQueue((prev) => [...prev, ...newItems]);
  };

  const handleRemoveItem = (id: string) => {
    if (processing) return;
    setQueue((prev) => prev.filter((i) => i.id !== id));
  };

  const handleStudentSelect = (itemId: string, studentId: string) => {
    const enrollment = enrollments.find((e) => e.studentId === studentId);
    if (!enrollment) return;
    setQueue((prev) =>
      prev.map((i) =>
        i.id === itemId
          ? {
              ...i,
              studentId: enrollment.studentId,
              studentName: enrollment.studentName,
              studentEmail: enrollment.studentEmail,
            }
          : i
      )
    );
  };

  const handleStartBatch = async () => {
    const unassigned = queue.find((i) => !i.studentId);
    if (unassigned) {
      toast.error('Lütfen tüm dosyalar için ilgili öğrenciyi seçin.');
      return;
    }
    setProcessing(true);

    let successCount = 0;
    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      if (item.status === 'scored') continue;

      // 1. Ayrıştır (Parsing)
      setQueue((prev) => prev.map((q, idx) => (idx === i ? { ...q, status: 'parsing' } : q)));
      let text = item.text;
      try {
        if (!text) {
          const parsed = await parseDocumentFile(item.file);
          text = parsed.text;
        }

        // 2. Yükle ve Teslim Aç
        setQueue((prev) => prev.map((q, idx) => (idx === i ? { ...q, status: 'submitting', text } : q)));
        const enrollment = enrollments.find((e) => e.studentId === item.studentId)!;
        const fileMeta = await uploadSubmissionFile(enrollment.studentId, cls.id, assignment.id, item.file);
        const sub = await submitOnBehalf(instructor, cls.id, assignment.id, enrollment, {
          title: item.title,
          text: text.trim(),
          file: fileMeta,
        });

        // 3. Skorla
        const scores = await scoreSubmission(
          { text: text.trim(), ...scoringConfig },
          { classId: cls.id, assignmentId: assignment.id, studentId: enrollment.studentId }
        );

        setQueue((prev) => prev.map((q, idx) => (idx === i ? { ...q, status: 'scored' } : q)));
        successCount++;
      } catch (err: any) {
        await markSubmissionFailed(cls.id, assignment.id, item.studentId).catch(() => {});
        setQueue((prev) =>
          prev.map((q, idx) =>
            idx === i ? { ...q, status: 'error', errorMessage: err?.message || 'İşlem başarısız' } : q
          )
        );
      }
    }

    setProcessing(false);
    toast.success(`Toplu işlem tamamlandı: ${successCount} ödev başarıyla skorlandı.`);
    onDone();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={processing ? undefined : onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 shadow-2xl max-h-[90vh] flex flex-col"
      >
        <button
          onClick={onClose}
          disabled={processing}
          className="absolute right-4 top-4 p-2 text-gray-500 hover:text-white bg-white/5 rounded-full hover:bg-white/10 transition-all disabled:opacity-40"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 mb-3">
            <Files className="w-6 h-6 text-purple-400" />
          </div>
          <h2 className="text-xl font-black text-white mb-1">Toplu Doküman İnceleme &amp; Yükleme</h2>
          <p className="text-xs text-gray-400">
            {assignment.title} için birden fazla öğrenci ödevini (.docx, .pdf) toplu olarak yükleyip sırayla taratabilirsiniz.
          </p>
        </div>

        {/* Dosya Seçim Alanı */}
        <div className="mb-4">
          <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-white/10 hover:border-purple-500/40 rounded-2xl cursor-pointer bg-white/[0.02] hover:bg-white/[0.04] transition-all">
            <Files className="w-8 h-8 text-gray-500 mb-2" />
            <span className="text-xs font-bold text-gray-300">Ödev Dosyalarını Seçin veya Sürükleyin</span>
            <span className="text-[10px] text-gray-500 mt-0.5">Çoklu PDF ve DOCX desteklenir</span>
            <input
              type="file"
              multiple
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFilesSelect}
              disabled={processing}
              className="hidden"
            />
          </label>
        </div>

        {/* Dosya Kuyruğu Listesi */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar mb-4 min-h-[160px] max-h-[300px]">
          {queue.length === 0 ? (
            <div className="py-10 text-center text-xs text-gray-600 font-mono">
              Henüz kuyruğa dosya eklenmedi.
            </div>
          ) : (
            queue.map((item) => (
              <div
                key={item.id}
                className="p-3 bg-white/[0.03] border border-white/5 rounded-xl flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-white truncate">{item.file.name}</p>
                  <p className="text-[10px] text-gray-500 font-mono">
                    {(item.file.size / 1024).toFixed(1)} KB
                  </p>
                </div>

                {/* Öğrenci Eşleme */}
                <div className="w-48 shrink-0">
                  <select
                    value={item.studentId}
                    onChange={(e) => handleStudentSelect(item.id, e.target.value)}
                    disabled={processing || item.status === 'scored'}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[11px] text-white focus:outline-none focus:border-purple-500/50"
                  >
                    <option value="" className="bg-[#111] text-gray-400">
                      Öğrenci Seçin...
                    </option>
                    {enrollments.map((enr) => (
                      <option key={enr.studentId} value={enr.studentId} className="bg-[#111]">
                        {enr.studentName || enr.studentEmail}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Durum Rozeti */}
                <div className="w-24 shrink-0 text-right">
                  {item.status === 'pending' && (
                    <span className="text-[10px] font-mono text-gray-500">Bekliyor</span>
                  )}
                  {item.status === 'parsing' && (
                    <span className="text-[10px] font-mono text-amber-400 flex items-center justify-end gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Okunuyor
                    </span>
                  )}
                  {item.status === 'submitting' && (
                    <span className="text-[10px] font-mono text-blue-400 flex items-center justify-end gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Taranıyor
                    </span>
                  )}
                  {item.status === 'scored' && (
                    <span className="text-[10px] font-mono text-emerald-400 flex items-center justify-end gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Hazır
                    </span>
                  )}
                  {item.status === 'error' && (
                    <span className="text-[10px] font-mono text-red-400 flex items-center justify-end gap-1" title={item.errorMessage}>
                      <AlertCircle className="w-3 h-3" /> Hata
                    </span>
                  )}
                </div>

                {!processing && item.status !== 'scored' && (
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.id)}
                    className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Aksiyon Butonları */}
        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          <span className="text-[11px] text-gray-500 font-mono">
            Toplam: {queue.length} dosya
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={processing}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-bold transition-all disabled:opacity-40"
            >
              Kapat
            </button>
            <button
              type="button"
              onClick={handleStartBatch}
              disabled={processing || queue.length === 0}
              className="px-5 py-2 bg-purple-500 hover:bg-purple-400 text-black rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-40 flex items-center gap-2"
            >
              {processing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Kuyruk İşleniyor...
                </>
              ) : (
                'Kuyruğu Başlat'
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
