import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Sparkles,
  HelpCircle,
  ShieldCheck,
  BookOpen,
  Scale,
  Compass,
  AlertCircle,
  CheckCircle2,
  Lock,
  RefreshCw
} from 'lucide-react';
import { analyzeWithSocraticCoach, type SocraticCoachReport } from '../../services/socraticCoachService';

interface SocraticCoachModalProps {
  isOpen: boolean;
  onClose: () => void;
  text: string;
}

export function SocraticCoachModal({ isOpen, onClose, text }: SocraticCoachModalProps) {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<SocraticCoachReport | null>(null);
  const [studentNotes, setStudentNotes] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    setLoading(true);
    analyzeWithSocraticCoach(text)
      .then((res) => {
        if (isMounted) setReport(res);
      })
      .catch((err) => {
        console.error('Socratic coach error:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [isOpen, text]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 lg:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-3xl bg-[#0c121e] border border-blue-500/20 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-5 lg:p-6 border-b border-white/10 flex items-center justify-between bg-blue-950/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-white tracking-tight uppercase">Sokratik Akademik Danışman</h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> İnsanlaştırma Kilitli
                  </span>
                </div>
                <p className="text-xs text-gray-400">Özgün yazım ve akademik dürüstlük için pedagojik rehberlik</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 lg:p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
            {/* Academic Integrity Notice */}
            <div className="p-4 bg-emerald-500/[0.06] border border-emerald-500/20 rounded-2xl flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs text-gray-300 space-y-1">
                <p className="font-bold text-emerald-300">Pedagojik İzolasyon Mandatı:</p>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Sokratik Koç metninizi yeniden yazmaz veya kelimelerinizi otomatik değiştirmez.
                  Bilimsel yayın etiği uyarınca; argümanlarınızı güçlendirmeniz, iddialarınıza atıf eklemeniz ve yazar sesinizi korumanız için size rehber sorular yöneltir.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="py-16 flex flex-col items-center justify-center space-y-3">
                <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Metin Taslağınız Pedagojik Olarak İnceleniyor...</p>
              </div>
            ) : report ? (
              <>
                {/* Score Meters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3.5 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-gray-400 font-medium flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-blue-400" /> Atıf Hazırlığı
                      </span>
                      <span className="font-black text-blue-400">%{report.scoreSummary.citationReadiness}</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-blue-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${report.scoreSummary.citationReadiness}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-3.5 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-gray-400 font-medium flex items-center gap-1.5">
                        <Scale className="w-3.5 h-3.5 text-emerald-400" /> Tarafsızlık
                      </span>
                      <span className="font-black text-emerald-400">%{report.scoreSummary.academicObjectivity}</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${report.scoreSummary.academicObjectivity}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-3.5 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-gray-400 font-medium flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5 text-purple-400" /> Metodolojik Yapı
                      </span>
                      <span className="font-black text-purple-400">%{report.scoreSummary.methodologicalStructure}</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-purple-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${report.scoreSummary.methodologicalStructure}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Socratic Questions */}
                <div className="space-y-3">
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Düşünmeye Teşvik Eden Sokratik Sorular ({report.inquiries.length})
                  </h4>

                  <div className="space-y-3">
                    {report.inquiries.map((inq) => (
                      <div
                        key={inq.id}
                        className="p-4 bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 rounded-2xl transition-all space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {inq.severity === 'warning' ? (
                              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                            ) : inq.severity === 'tip' ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : (
                              <HelpCircle className="w-4 h-4 text-blue-400 shrink-0" />
                            )}
                            <span className="text-xs font-bold text-white">{inq.title}</span>
                          </div>
                          <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/5">
                            {inq.category}
                          </span>
                        </div>

                        <div className="p-3 bg-black/40 border border-blue-500/10 rounded-xl">
                          <p className="text-xs font-semibold text-blue-200 leading-relaxed">
                            "{inq.question}"
                          </p>
                        </div>

                        <p className="text-[11px] text-gray-400 leading-normal pl-1">
                          <strong className="text-gray-300">Öneri:</strong> {inq.pedagogicalTip}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Student Notes / Action Plan */}
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                    Kendi Revizyon Notlarınız & Eylem Planınız
                  </label>
                  <textarea
                    value={studentNotes}
                    onChange={(e) => setStudentNotes(e.target.value)}
                    rows={3}
                    placeholder="Sokratik Koç'un yönlendirmeleri doğrultusunda hangi kaynakları ekleyeceğinizi ve metninizde yapacağınız iyileştirmeleri buraya not edebilirsiniz..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-all resize-y custom-scrollbar"
                  />
                </div>
              </>
            ) : null}
          </div>

          {/* Footer */}
          <div className="p-4 lg:p-5 border-t border-white/10 bg-black/30 flex items-center justify-between">
            <span className="text-[10px] text-gray-500">
              YÖK ve Uluslararası Akademik Yayın Standartları Uyumlu
            </span>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all"
            >
              Anladım, Metnimi Düzenlemeye Devam Et
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
