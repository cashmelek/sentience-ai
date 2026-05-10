import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { AppUser } from '../types';
import { cn } from '../lib/utils';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface OnboardingChecklistProps {
  user: AppUser;
}

export function OnboardingChecklist({ user }: OnboardingChecklistProps) {
  const [isOpen, setIsOpen] = useState(true);
  const onboarding = user.onboarding || {
    profileComplete: true,
    firstHumanize: false,
    firstAnalysis: false,
    firstDraft: false,
    dismissed: false
  };

  if (onboarding.dismissed) return null;

  const steps = [
    { id: 'firstHumanize', label: 'İlk Metnini İnsanileştir', completed: onboarding.firstHumanize },
    { id: 'firstAnalysis', label: 'Derin Analiz Aracını Kullan', completed: onboarding.firstAnalysis },
    { id: 'firstDraft', label: 'Bir Taslak Kaydet', completed: onboarding.firstDraft }
  ];

  const completedCount = steps.filter(s => s.completed).length;
  const progress = (completedCount / steps.length) * 100;

  const handleDismiss = async () => {
    const userRef = doc(db, 'users', user.uid);
    try {
      await updateDoc(userRef, { 'onboarding.dismissed': true });
    } catch (err) {
      console.error("Error dismissing onboarding:", err);
    }
  };

  return (
    <div className="mx-4 my-2 overflow-hidden bg-white/[0.03] border border-white/5 rounded-2xl transition-all hover:bg-white/[0.05]">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between text-left group"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center border border-emerald-500/20">
            <Zap className="w-4 h-4 text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
          </div>
          <div>
            <h4 className="text-[11px] font-bold text-gray-200 uppercase tracking-tight">Başlangıç Görevleri</h4>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-emerald-500"
                />
              </div>
              <span className="text-[9px] text-gray-500 font-bold">%{Math.round(progress)}</span>
            </div>
          </div>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-gray-600" /> : <ChevronDown className="w-4 h-4 text-gray-600" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 pb-4 space-y-1"
          >
            {steps.map((step, i) => (
              <div key={i} className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-white/[0.02] transition-colors group/item">
                {step.completed ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                ) : (
                  <Circle className="w-3.5 h-3.5 text-gray-700 shrink-0 group-hover/item:text-gray-500 transition-colors" />
                )}
                <span className={cn(
                  "text-[10px] font-semibold transition-colors",
                  step.completed ? "text-gray-500 line-through" : "text-gray-400 group-hover/item:text-gray-300"
                )}>
                  {step.label}
                </span>
              </div>
            ))}
            
            {progress === 100 && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={handleDismiss}
                className="w-full mt-4 py-2.5 bg-emerald-500 text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
              >
                Tebrikler! Kapat
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
