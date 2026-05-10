import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Sparkles, 
  Search, 
  History, 
  ShieldCheck, 
  Zap, 
  BookOpen,
  MousePointer2,
  Settings2,
  FileText,
  Lock,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  Save
} from 'lucide-react';
import { cn } from '../lib/utils';

interface GuideModalProps {
  onClose: () => void;
}

const GUIDE_SECTIONS = [
  {
    id: "welcome",
    title: "Sentience AI'a Hoş Geldiniz",
    subtitle: "Yapay Zeka Metinlerini İnsanlaştırma ve Analiz Master Rehberi",
    icon: Sparkles,
    content: (
      <div className="space-y-4">
        <p className="text-gray-400 leading-relaxed">
          Sentience AI, metinlerinizi yapay zeka tespitinden (AI Detection) arındıran, 
          akışını doğallaştıran ve derinlemesine teknik analiz sunan profesyonel bir araçtır. 
          Bu rehber, platformun her bir özelliğini en verimli şekilde kullanmanıza yardımcı olacaktır.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
            <h4 className="text-emerald-500 text-xs font-bold mb-1">Hızlı Dönüşüm</h4>
            <p className="text-[10px] text-gray-500">Metinlerinizi saniyeler içinde doğal bir dile kavuşturun.</p>
          </div>
          <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
            <h4 className="text-blue-500 text-xs font-bold mb-1">Derin Analiz</h4>
            <p className="text-[10px] text-gray-500">Cümle bazlı YZ olasılığını ve dilbilgisi hatalarını görün.</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: "editor",
    title: "Gelişmiş Editör Kullanımı",
    subtitle: "Giriş Paneli ve Akıllı Ayarlar",
    icon: Settings2,
    content: (
      <div className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-white/5 rounded-lg mt-1"><Cpu className="w-4 h-4 text-emerald-400" /></div>
            <div>
              <h4 className="text-sm font-bold text-white">Yazım Tonları</h4>
              <p className="text-xs text-gray-500"><b>Profesyonel:</b> İş yazışmaları için. <b>Akademik:</b> Tez ve makaleler için. <b>Samimi:</b> Sosyal medya ve günlük metinler için.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-white/5 rounded-lg mt-1"><Zap className="w-4 h-4 text-amber-400" /></div>
            <div>
              <h4 className="text-sm font-bold text-white">Yoğunluk Ayarı (%0 - %100)</h4>
              <p className="text-xs text-gray-500">Düşük değerlerde sadece akıcılık artırılır. Yüksek değerlerde metnin yapısı tamamen insan benzeri şekilde yeniden kurulur.</p>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: "analysis",
    title: "Analiz ve İntihal Denetimi",
    subtitle: "Güvenilir Veri ve Halüsinasyon Koruması",
    icon: ShieldCheck,
    content: (
      <div className="space-y-4">
        <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl">
          <div className="flex items-center gap-2 mb-2 text-red-400">
            <AlertTriangle className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider">Halüsinasyon Koruması</h4>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            Sistemimiz, uydurma internet linkleri (404 hatası veren sahte kaynaklar) üretmez. 
            İntihal bölümünde gördüğünüz tüm kaynaklar 2026 canlı verisi ile doğrulanmış gerçek kaynaklardır. 
            YZ kaynak bulamazsa listeyi boş bırakır.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <h4 className="text-[11px] font-bold text-emerald-500">İnsan Skoru</h4>
            <p className="text-[10px] text-gray-500">Metnin YZ dedektörlerinden geçme olasılığını gösterir.</p>
          </div>
          <div className="space-y-1">
            <h4 className="text-[11px] font-bold text-blue-500">Cümle Analizi</h4>
            <p className="text-[10px] text-gray-500">Cümlelerin neden "yapay" göründüğüne dair teknik detaylar verir.</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: "management",
    title: "Proje ve Taslak Yönetimi",
    subtitle: "Çalışmalarınızı Güvende Tutun",
    icon: History,
    content: (
      <div className="space-y-4">
        <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold">Geçmiş:</span>
              <span className="text-[10px] text-gray-500">Tamamlanan işlemler buraya gelir.</span>
            </div>
            <div className="flex items-center gap-2">
              <Save className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold">Taslaklar:</span>
              <span className="text-[10px] text-gray-500">Yarım kalan işlerinizi buradan devam ettirin.</span>
            </div>
          </div>
        </div>
        <div className="p-4 bg-emerald-500/5 rounded-2xl">
          <h4 className="text-xs font-bold text-emerald-500 mb-1">Veri Gizliliği</h4>
          <p className="text-[10px] text-gray-500">Metinleriniz sadece sizin hesabınıza özeldir. Admin paneli dahil hiç kimse ham metinlerinizi okuyamaz.</p>
        </div>
      </div>
    )
  }
];

export function GuideModal({ onClose }: GuideModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const step = GUIDE_SECTIONS[currentStep];
  const Icon = step.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        className="absolute inset-0 bg-black/95 backdrop-blur-xl" 
        onClick={onClose} 
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 30 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }} 
        exit={{ scale: 0.9, opacity: 0, y: 30 }} 
        className="relative w-full max-w-3xl bg-brand-card border border-brand-border rounded-[48px] shadow-2xl overflow-hidden flex flex-col min-h-[600px]"
      >
        {/* Dekoratif Işıklar */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-emerald-500/10 blur-[120px] pointer-events-none rounded-full" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-500/10 blur-[120px] pointer-events-none rounded-full" />

        {/* Header */}
        <div className="p-10 pb-6 flex items-start justify-between relative z-10">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-white/[0.03] border border-white/5 rounded-3xl flex items-center justify-center">
              <Icon className="w-8 h-8 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white tracking-tighter leading-tight">{step.title}</h2>
              <p className="text-emerald-500/80 font-bold text-xs uppercase tracking-[0.2em] mt-1">{step.subtitle}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-3 hover:bg-white/5 rounded-2xl text-gray-500 transition-all border border-white/5"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Area */}
        <div className="px-10 flex-1 relative z-10 overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="py-6"
            >
              {step.content}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer / Navigation */}
        <div className="p-10 pt-6 border-t border-brand-border bg-black/20 relative z-10 flex items-center justify-between">
          <div className="flex gap-2">
            {GUIDE_SECTIONS.map((_, i) => (
              <div 
                key={i} 
                className={cn(
                  "h-1 rounded-full transition-all duration-500",
                  i === currentStep ? "w-8 bg-emerald-500" : "w-2 bg-white/10"
                )}
              />
            ))}
          </div>
          
          <div className="flex items-center gap-4">
            {currentStep > 0 && (
              <button 
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="p-3 border border-white/5 rounded-2xl text-gray-500 hover:text-white transition-all"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            
            <button 
              onClick={() => {
                if (currentStep < GUIDE_SECTIONS.length - 1) {
                  setCurrentStep(prev => prev + 1);
                } else {
                  onClose();
                }
              }}
              className="px-8 py-3 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-400 hover:text-black transition-all flex items-center gap-2"
            >
              {currentStep === GUIDE_SECTIONS.length - 1 ? 'Başlayalım' : 'Sonraki'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
