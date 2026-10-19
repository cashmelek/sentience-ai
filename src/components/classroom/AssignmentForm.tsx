import { useState } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, X } from 'lucide-react';
import type { Assignment } from '../../types/classroom';

interface AssignmentFormProps {
  initial?: Assignment | null;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    instructions: string;
    startDate: string;
    dueDate: string;
    noRepository: boolean;
  }) => void;
}

export function AssignmentForm({ initial, onClose, onSubmit }: AssignmentFormProps) {
  const [title, setTitle] = useState(initial?.title || '');
  const [instructions, setInstructions] = useState(initial?.instructions || '');
  const [startDate, setStartDate] = useState(initial?.startDate || '');
  const [dueDate, setDueDate] = useState(initial?.dueDate || '');
  const [noRepository, setNoRepository] = useState(initial?.noRepository ?? false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({ title: title.trim(), instructions: instructions.trim(), startDate, dueDate, noRepository });
    onClose();
  };

  const inputCls = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 transition-all [color-scheme:dark]';

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar"
      >
        <button onClick={onClose} className="absolute right-4 top-4 p-2 text-gray-500 hover:text-white bg-white/5 rounded-full hover:bg-white/10 transition-all">
          <X className="w-4 h-4" />
        </button>

        <div className="mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 mb-4">
            <ClipboardList className="w-6 h-6 text-emerald-500" />
          </div>
          <h2 className="text-xl font-black text-white mb-2">{initial ? 'Ödevi Düzenle' : 'Yeni Ödev'}</h2>
          <p className="text-sm text-gray-400">Öğrenciler teslimlerini bu ödev altında yapar; skorlar otomatik hesaplanır.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Ödev Başlığı *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Örn: Makale Özeti Teslimi" className={inputCls} autoFocus required />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Talimatlar</label>
            <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={4} placeholder="Örn: 500-800 kelime, APA kaynakça..." className={inputCls + ' resize-none'} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Başlangıç</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Son Teslim</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputCls} />
            </div>
          </div>

          <label className="flex items-start gap-3 p-4 bg-white/[0.03] border border-white/5 rounded-2xl cursor-pointer hover:bg-white/[0.05] transition-all">
            <input
              type="checkbox"
              checked={noRepository}
              onChange={(e) => setNoRepository(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-emerald-500"
            />
            <span className="text-sm text-gray-300">
              <span className="font-bold text-white block">Teslimleri depoya alma</span>
              İşaretliyse teslimler bu sınıfın karşılaştırma deposunda saklanmaz (öğrenci beyanı gerektiren durumlar için).
            </span>
          </label>

          <button type="submit" disabled={!title.trim()} className="w-full py-4 bg-emerald-500 text-black font-black rounded-xl hover:bg-emerald-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs uppercase tracking-widest">
            {initial ? 'Kaydet' : 'Ödevi Oluştur'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
