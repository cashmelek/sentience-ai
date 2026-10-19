import { useState } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, X } from 'lucide-react';

interface JoinClassModalProps {
  onClose: () => void;
  onSubmit: (classCode: string, enrollmentKey: string) => Promise<void>;
}

export function JoinClassModal({ onClose, onSubmit }: JoinClassModalProps) {
  const [classCode, setClassCode] = useState('');
  const [enrollmentKey, setEnrollmentKey] = useState('');
  const [busy, setBusy] = useState(false);

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
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Sınıf Kodu</label>
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
