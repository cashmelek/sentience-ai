import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Sparkles, Check } from 'lucide-react';

interface CustomToneModalProps {
  onClose: () => void;
  onApply: (tone: string) => void;
}

export function CustomToneModal({ onClose, onApply }: CustomToneModalProps) {
  const [customTone, setCustomTone] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customTone.trim()) {
      onApply(customTone.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 shadow-2xl"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-gray-500 hover:text-white bg-white/5 rounded-full hover:bg-white/10 transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 mb-4">
            <Sparkles className="w-6 h-6 text-emerald-500" />
          </div>
          <h2 className="text-xl font-black text-white mb-2">Özel Ton Oluştur</h2>
          <p className="text-sm text-gray-400">
            YZ'nin metninizi nasıl bir tarzda yeniden yazmasını istediğinizi belirleyin.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">
              Ton Açıklaması veya İsmi
            </label>
            <input
              type="text"
              value={customTone}
              onChange={(e) => setCustomTone(e.target.value)}
              placeholder="Örn: Steve Jobs tarzı, alaycı, çok resmi..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={!customTone.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500 text-black font-black rounded-xl hover:bg-emerald-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="w-4 h-4" />
            Uygula ve Seç
          </button>
        </form>
      </motion.div>
    </div>
  );
}
