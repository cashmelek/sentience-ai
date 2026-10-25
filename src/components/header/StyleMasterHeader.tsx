import type { Dispatch, SetStateAction } from 'react';
import {
  Zap,
  Settings2,
  Sparkles,
  RefreshCw,
  ChevronDown,
  MessageSquarePlus,
  Menu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { PresetSelector } from '../PresetSelector';
import type { HumanizeOptions } from '../../services/geminiService';

const STANDARD_TONES = [
  'Profesyonel',
  'Sohbet Vari',
  'Resmi',
  'Samimi',
  'Akademik',
  'Yaratıcı',
  'Heyecanlı'
];

interface StyleMasterHeaderProps {
  options: HumanizeOptions;
  setOptions: Dispatch<SetStateAction<HumanizeOptions>>;
  isToneDropdownOpen: boolean;
  setIsToneDropdownOpen: Dispatch<SetStateAction<boolean>>;
  onOpenSidebar: () => void;
  onOpenCustomTone: () => void;
  onOpenPlans: () => void;
  onHumanize: () => void;
  isProcessing: boolean;
  inputText: string;
  isAdmin: boolean;
  isOverLimit: boolean;
  userPlan?: string;
}

export function StyleMasterHeader({
  options,
  setOptions,
  isToneDropdownOpen,
  setIsToneDropdownOpen,
  onOpenSidebar,
  onOpenCustomTone,
  onOpenPlans,
  onHumanize,
  isProcessing,
  inputText,
  isAdmin,
  isOverLimit,
  userPlan
}: StyleMasterHeaderProps) {
  const isPremiumOrPro = userPlan === 'premium' || userPlan === 'pro' || isAdmin;
  return (
    <header className="h-auto min-h-[4.5rem] lg:h-20 border-b border-brand-border px-3 lg:px-8 py-3 flex flex-col lg:flex-row items-start lg:items-center justify-between bg-brand-card/50 backdrop-blur-xl relative z-40 gap-3 lg:gap-4">
      <div className="flex items-center gap-3 lg:gap-10 w-full lg:w-auto">
        <button onClick={onOpenSidebar} className="p-2 -ml-1 lg:hidden text-gray-400 shrink-0"><Menu className="w-6 h-6" /></button>
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-10 flex-1 lg:flex-none">
          <div className="relative">
            <div className="flex items-center gap-2 mb-1.5"><Settings2 className="w-3.5 h-3.5 text-gray-500" /><span className="text-[10px] font-black uppercase tracking-widest text-emerald-500/80">STYLEMASTER KONTROLÜ</span></div>
            <div className="flex items-center gap-3">
              <button onClick={() => setIsToneDropdownOpen(!isToneDropdownOpen)} className="flex items-center gap-2 text-base lg:text-xl font-black text-white hover:text-gray-300 transition-colors uppercase tracking-tight">{options.tone}<ChevronDown className="w-4 h-4 text-gray-500" /></button>
              <button onClick={onOpenCustomTone} className="p-1.5 text-gray-400 hover:text-white bg-white/5 rounded-lg border border-white/10"><MessageSquarePlus className="w-4 h-4" /></button>
            </div>
            <AnimatePresence>
              {isToneDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsToneDropdownOpen(false)} />
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-full left-0 mt-4 w-56 bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
                    <div className="px-4 py-3 bg-white/5 border-b border-white/10"><span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">STANDART TONLAR</span></div>
                    <div className="max-h-60 overflow-y-auto custom-scrollbar p-2 space-y-1">
                      {STANDARD_TONES.map(tone => (<button key={tone} onClick={() => { setOptions({ ...options, tone, customToneDescription: undefined }); setIsToneDropdownOpen(false); }} className={cn("w-full text-left px-3 py-2 rounded-xl text-sm font-bold uppercase transition-all", options.tone === tone ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-white/5 hover:text-gray-200")}>{tone}</button>))}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
          <div className="hidden lg:block w-px h-10 bg-white/10 mx-2" />
          <PresetSelector
            currentTone={options.tone}
            currentIntensity={options.intensity}
            onApplyPreset={(tone, intensity) => {
              setOptions(prev => ({ ...prev, tone, intensity, customToneDescription: undefined }));
            }}
          />
          <div className="hidden lg:block w-px h-10 bg-white/10 mx-2" />
          <div className="flex-1"><div className="flex items-center gap-2 mb-1.5"><Zap className="w-3.5 h-3.5 text-emerald-500" /><span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">YOĞUNLUK ({options.intensity}%)</span></div><input type="range" min="0" max="100" value={options.intensity} onChange={(e) => setOptions({ ...options, intensity: parseInt(e.target.value) })} className="w-full lg:w-48 h-1.5 accent-emerald-500 bg-white/10 rounded-full cursor-pointer" /></div>

        </div>
      </div>
      <div className="flex items-center gap-2.5 w-full lg:w-auto justify-end">
        {isPremiumOrPro ? (
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold uppercase tracking-widest">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            {isAdmin ? 'ADMIN' : (userPlan?.toUpperCase() || 'PRO')}
          </span>
        ) : (
          <button onClick={onOpenPlans} className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-500/20 to-sky-500/20 hover:from-emerald-500/30 hover:to-sky-500/30 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_12px_rgba(16,185,129,0.15)]">
            <Zap className="w-3 h-3 text-emerald-400" />
            YÜKSELT
          </button>
        )}
        <button onClick={onHumanize} disabled={isProcessing || !inputText.trim() || (!isAdmin && isOverLimit)} className="flex-1 lg:flex-none px-5 lg:px-6 py-2.5 bg-emerald-500 text-black rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50 transition-all flex items-center justify-center gap-2">{isProcessing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} İNSANLAŞTIR</button>
      </div>
    </header>
  );
}
