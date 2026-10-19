import { motion } from 'framer-motion';
import { ShieldCheck, X } from 'lucide-react';

interface KvkkConsentModalProps {
  onAccept: () => void;
  onDecline: () => void;
}

export function KvkkConsentModal({ onAccept, onDecline }: KvkkConsentModalProps) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 shadow-2xl"
      >
        <div className="mb-5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 mb-4">
            <ShieldCheck className="w-6 h-6 text-emerald-500" />
          </div>
          <h2 className="text-xl font-black text-white mb-2">KVKK Aydınlatma ve Onay</h2>
          <p className="text-sm text-gray-400">
            Sınıf/ödev özelliğini kullanmadan önce aşağıdaki bilgilendirmeyi onaylamanız gerekir.
          </p>
        </div>

        <div className="space-y-3 text-sm text-gray-300 bg-white/[0.03] border border-white/5 rounded-2xl p-4 max-h-56 overflow-y-auto custom-scrollbar">
          <p>
            <span className="font-bold text-white">1) Veri sorumlusu:</span> Sınıf eğitmeniniz, öğrenci
            teslimlerini değerlendirmek amacıyla veri sorumlusu sıfatıyla hareket eder.
          </p>
          <p>
            <span className="font-bold text-white">2) İşlenen veriler:</span> Teslim ettiğiniz metin,
            teslim anındaki SHA-256 bütünlük özeti (dijital makbuz) ve benzerlik/YZ skor sonuçları.
          </p>
          <p>
            <span className="font-bold text-white">3) Depolama:</span> Eğitmen, ödev başına "depoya
            alma" seçeneğini kapatabilir. Depo açıksa teslimler sınıfın karşılaştırma deposunda
            saklanır ve sonraki teslimlerle karşılaştırılır.
          </p>
          <p>
            <span className="font-bold text-white">4) Silme:</span> Sınıftan ayrıldığınızda kayıt
            kaydınız silinir; teslim içerikleri eğitmen sınıfı sonlandırana dek saklanır.
          </p>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onAccept}
            className="flex-1 py-3.5 bg-emerald-500 text-black font-black rounded-xl hover:bg-emerald-400 transition-all text-xs uppercase tracking-widest"
          >
            Onaylıyorum
          </button>
          <button
            onClick={onDecline}
            className="flex-1 py-3.5 bg-white/5 border border-white/10 text-gray-400 font-black rounded-xl hover:bg-white/10 hover:text-white transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" /> Vazgeç
          </button>
        </div>
      </motion.div>
    </div>
  );
}
