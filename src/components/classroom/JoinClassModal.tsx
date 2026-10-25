import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, X, CheckCircle2, AlertCircle, GraduationCap, BookOpen, Loader2 } from 'lucide-react';
import { lookupClassByCode, type ClassPreview } from '../../services/classroomService';

interface JoinClassModalProps {
  onClose: () => void;
  onSubmit: (classCode: string, enrollmentKey: string) => Promise<void>;
}

export function JoinClassModal({ onClose, onSubmit }: JoinClassModalProps) {
  const [classCode, setClassCode] = useState('');
  const [enrollmentKey, setEnrollmentKey] = useState('');
  const [preview, setPreview] = useState<ClassPreview | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const clean = classCode.trim();
    if (clean.length < 4) {
      setPreview(null);
      setLookupError(null);
      return;
    }

    let active = true;
    const timer = setTimeout(async () => {
      setLookupLoading(true);
      setLookupError(null);
      try {
        const res = await lookupClassByCode(clean);
        if (!active) return;
        if (res) {
          setPreview(res);
          setLookupError(null);
        } else {
          setPreview(null);
          if (clean.length >= 6) {
            setLookupError('Bu kodla eşleşen aktif sınıf bulunamadı.');
          }
        }
      } catch {
        if (active) setLookupError('Sınıf sorgulanamadı.');
      } finally {
        if (active) setLookupLoading(false);
      }
    }, 350);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [classCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      await onSubmit(classCode, enrollmentKey);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 shadow-2xl"
      >
        <button onClick={onClose} className="absolute right-4 top-4 p-2 text-gray-500 hover:text-white bg-white/5 rounded-full hover:bg-white/10 transition-all">
          <X className="w-4 h-4" />
        </button>

        <div className="mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 mb-4">
            <UserPlus className="w-6 h-6 text-blue-400" />
          </div>
          <h2 className="text-xl font-black text-white mb-2">Sınıfa Katıl</h2>
          <p className="text-sm text-gray-400">Eğitmeninizden aldığınız sınıf kodu ve kayıt anahtarını girin.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest">Sınıf Kodu</label>
              {lookupLoading && (
                <span className="text-[10px] text-blue-400 flex items-center gap-1 font-mono">
                  <Loader2 className="w-3 h-3 animate-spin" /> Doğrulanıyor...
                </span>
              )}
            </div>
            <input
              type="text"
              value={classCode}
              onChange={(e) => setClassCode(e.target.value.toUpperCase())}
              placeholder="Örn: K7Q2XM"
              maxLength={12}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-all uppercase tracking-widest font-black"
              autoFocus
              required
            />
          </div>

          {preview && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Sınıf Doğrulandı</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div>
                  <span className="text-gray-500 block text-[9px] uppercase font-mono">Sınıf Adı</span>
                  <span className="text-white font-semibold truncate block flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-emerald-400 shrink-0" /> {preview.name}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[9px] uppercase font-mono">Eğitmen / Akademisyen</span>
                  <span className="text-white font-semibold truncate block flex items-center gap-1">
                    <GraduationCap className="w-3 h-3 text-emerald-400 shrink-0" /> {preview.instructorName}
                  </span>
                </div>
              </div>
              {(preview.subject || preview.term) && (
                <div className="text-[10px] text-gray-400 pt-1 border-t border-emerald-500/10 font-mono">
                  {preview.subject && <span>{preview.subject}</span>}
                  {preview.subject && preview.term && <span> • </span>}
                  {preview.term && <span>{preview.term}</span>}
                </div>
              )}
            </div>
          )}

          {lookupError && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 text-amber-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{lookupError}</span>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Kayıt Anahtarı</label>
            <input
              type="text"
              value={enrollmentKey}
              onChange={(e) => setEnrollmentKey(e.target.value.toUpperCase())}
              placeholder="Örn: AB3CD9EFGH"
              maxLength={16}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-all uppercase tracking-widest font-black"
              required
            />
          </div>

          <button
            type="submit"
            disabled={busy || !classCode.trim() || !enrollmentKey.trim()}
            className="w-full py-4 bg-blue-500 text-black font-black rounded-xl hover:bg-blue-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs uppercase tracking-widest"
          >
            {busy ? 'Katılınıyor...' : 'Sınıfa Katıl'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
