import React from 'react';
import { motion } from 'framer-motion';
import { X, Check, Zap, Crown, Shield } from 'lucide-react';
import { AppUser, SubscriptionPlan, PLAN_LIMITS } from '../types';
import { cn } from '../lib/utils';

interface PlansModalProps {
  user: AppUser;
  onClose: () => void;
}

const PLANS = [
  {
    id: 'free' as SubscriptionPlan,
    name: 'Başlangıç',
    icon: Zap,
    color: 'text-gray-400',
    bgColor: 'bg-gray-400/10',
    borderColor: 'border-gray-400/20',
    features: ['Temel İnsanlaştırma', 'Günlük 10 İşlem', 'Standart Hız', 'Sınırlı Özel Tonlar'],
    price: 'Ücretsiz'
  },
  {
    id: 'pro' as SubscriptionPlan,
    name: 'Profesyonel',
    icon: Shield,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/50',
    features: ['Gelişmiş İnsanlaştırma', 'Günlük 50 İşlem', 'Öncelikli Hız', 'Sınırsız Özel Tonlar', 'Word/Txt Çıktı'],
    price: '₺199/ay',
    popular: true
  },
  {
    id: 'premium' as SubscriptionPlan,
    name: 'Premium',
    icon: Crown,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/50',
    features: ['Radikal İnsanlaştırma', 'Günlük 500 İşlem', 'Maksimum Hız', 'Sınırsız Özel Tonlar', 'API Erişimi', '7/24 Destek'],
    price: '₺499/ay'
  }
];

export function PlansModal({ user, onClose }: PlansModalProps) {
  const handleUpgradeRequest = (planId: SubscriptionPlan) => {
    // Burada ödeme veya talep altyapısı (Stripe, Iyzico vs.) tetiklenebilir
    alert(`${planId} planına geçiş talebiniz alındı. Ödeme altyapısı entegre edildikten sonra aktifleşecektir.`);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative w-full max-w-5xl bg-brand-card border border-brand-border rounded-3xl p-8 shadow-2xl overflow-hidden">
        
        {/* Dekoratif Arka Plan */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-64 bg-emerald-500/10 blur-[100px] pointer-events-none" />

        <div className="relative flex items-center justify-between mb-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-white tracking-tighter">Abonelik Planları</h2>
            <p className="text-sm text-gray-400">İhtiyaçlarınıza uygun planı seçin ve limitleri kaldırın.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-gray-500 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const isCurrentPlan = user.plan === plan.id;
            const Icon = plan.icon;

            return (
              <div key={plan.id} className={cn("relative flex flex-col p-6 rounded-2xl border transition-all duration-300", plan.borderColor, isCurrentPlan ? "bg-white/5" : "bg-brand-bg hover:bg-white/5", plan.popular ? "scale-105 shadow-[0_0_40px_rgba(16,185,129,0.1)] z-10" : "")}>
                
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-500 text-black text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">
                    En Çok Tercih Edilen
                  </div>
                )}

                <div className="flex items-center gap-4 mb-6">
                  <div className={cn("p-3 rounded-xl", plan.bgColor)}>
                    <Icon className={cn("w-6 h-6", plan.color)} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                    <p className="text-[11px] font-mono text-gray-500 uppercase">Günde {PLAN_LIMITS[plan.id]} İşlem</p>
                  </div>
                </div>

                <div className="mb-6">
                  <span className="text-3xl font-black text-white tracking-tighter">{plan.price}</span>
                </div>

                <div className="flex-1 space-y-4 mb-8">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Check className={cn("w-4 h-4 shrink-0 mt-0.5", plan.color)} />
                      <span className="text-sm text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleUpgradeRequest(plan.id)}
                  disabled={isCurrentPlan || (user.role === 'admin' && plan.id !== 'premium')}
                  className={cn(
                    "w-full py-3 rounded-xl font-bold text-sm tracking-wider uppercase transition-all duration-300",
                    isCurrentPlan 
                      ? "bg-white/10 text-gray-400 cursor-not-allowed" 
                      : cn("hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]", plan.id === 'pro' ? "bg-emerald-500 text-black hover:bg-emerald-400" : "bg-white/10 text-white hover:bg-white/20")
                  )}
                >
                  {isCurrentPlan ? 'Mevcut Planınız' : 'Bu Plana Geç'}
                </button>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
