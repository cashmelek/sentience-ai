import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, CheckCircle2, ChevronRight, UserCheck, ShieldAlert, Award, FileText } from 'lucide-react';

interface ScenarioCheatSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerSeed?: () => void;
  isSeeding?: boolean;
}

export function ScenarioCheatSheetModal({ isOpen, onClose, onTriggerSeed, isSeeding }: ScenarioCheatSheetModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Öğretmen - Öğrenci Canlı Sunum & Senaryo Rehberi
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                    Canlı Demo
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Doç. Dr. İsmail Kaleci (Öğretmen) & Ahmet Yılmaz (Öğrenci) Akışı
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar text-xs">
            {/* Seed button notice */}
            {onTriggerSeed && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-sky-950/40 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    Turnitin Demo Verilerini Yükle
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Sınıfı, ödevi ve 2 öğrenci teslimini tek tıkla veritabanına ekler.
                  </p>
                </div>
                <button
                  onClick={onTriggerSeed}
                  disabled={isSeeding}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold text-xs transition-all shadow-md active:scale-95 shrink-0"
                >
                  {isSeeding ? 'Yükleniyor...' : 'Verileri Otomatik Yükle'}
                </button>
              </div>
            )}

            {/* Scenario 1 */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-400 font-bold flex items-center justify-center font-mono">
                    1
                  </div>
                  <h4 className="font-bold text-white text-sm">
                    Senaryo 1: Ön Taslak (Draft Coach) & Turnitin QuickMarks Notlandırma
                  </h4>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
                  Öğretmen & Öğrenci
                </span>
              </div>
              <ul className="space-y-2 text-slate-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Öğrenci Deneyimi:</strong> Ahmet Yılmaz teslim etmeden önce "Ön Teslim Taslak Kontrolü" butonuna basarak ilk taslağını (%32 benzerlik) denetlemiş ve revize etmiştir.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Turnitin QuickMarks:</strong> "Raporu Aç" butonuna basıldığında metin üzerinde <code className="text-emerald-300 bg-slate-800 px-1 py-0.5 rounded">[Kaynak Eksik]</code> ve <code className="text-emerald-300 bg-slate-800 px-1 py-0.5 rounded">[Tırnak Eksik]</code> satır içi notları görünür.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Dijital Makbuz:</strong> Rapor ekranından "Makbuzu İndir (PDF)" butonuna tıklanarak SHA-256 karekodlu resmi teslim makbuzu indirilebilir.</span>
                </li>
              </ul>
            </div>

            {/* Scenario 2 */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold flex items-center justify-center font-mono">
                    2
                  </div>
                  <h4 className="font-bold text-white text-sm">
                    Senaryo 2: 4 Kriterli Ağırlıklı Rubrik Matrisi ile Notlandırma
                  </h4>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                  Öğretmen
                </span>
              </div>
              <ul className="space-y-2 text-slate-300">
                <li className="flex items-start gap-2">
                  <Award className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Rapor sayfasının sağ panelindeki <strong>"Rubrik Puanlama"</strong> sekmesine geçin.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Award className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Dil (%20: 90 puan), Kaynak (%30: 85 puan), Özgünlük (%30: 95 puan) ve Metodoloji (%20: 95 puan) hesaplanarak toplam <strong>91.0 / 100</strong> resmi nota aktarılmıştır.</span>
                </li>
              </ul>
            </div>

            {/* Scenario 3 */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-rose-500/10 text-rose-400 font-bold flex items-center justify-center font-mono">
                    3
                  </div>
                  <h4 className="font-bold text-white text-sm">
                    Senaryo 3: Sınıf İçi Eş-Düzey (Peer-to-Peer) Kopya Matrisi
                  </h4>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold">
                  İç Denetim
                </span>
              </div>
              <ul className="space-y-2 text-slate-300">
                <li className="flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>Ödev detay ekranındaki <strong>"Eş-Düzey Kopya Matrisi"</strong> butonuna tıklayın.</span>
                </li>
                <li className="flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>Ahmet Yılmaz ile Mehmet Demir arasındaki <strong>%42'lik ortak shingle çakışması</strong> kırmızı uyarı şeridiyle anında tespit edilir.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-800 flex items-center justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
            >
              Kapat
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
