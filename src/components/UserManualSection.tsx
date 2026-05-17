import React from 'react';
import { motion } from 'framer-motion';
import { 
  UserPlus, 
  FileEdit, 
  Search, 
  Zap, 
  ArrowRight,
  Monitor,
  Database,
  Shield
} from 'lucide-react';

const STEPS = [
  {
    icon: UserPlus,
    title: "Kayıt ve Profil",
    description: "Google veya kurumsal e-postanızla saniyeler içinde hesap oluşturun. Profilinizden günlük limitlerinizi takip edin.",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10"
  },
  {
    icon: FileEdit,
    title: "Metin Girişi",
    description: "Analiz etmek istediğiniz metni editöre yapıştırın veya dosya olarak yükleyin. Sistemimiz tüm formatları destekler.",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10"
  },
  {
    icon: Search,
    title: "Ajan Seçimi",
    description: "İhtiyacınıza göre Denetçi (Analiz), İnsanlaştırma (Yeniden İnşa) veya Sentinel (İntihal) ajanlarını görevlendirin.",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10"
  },
  {
    icon: Zap,
    title: "Raporlama",
    description: "Yapay zeka skoru, intihal raporu ve canlı kaynak doğrulamalarını içeren kapsamlı raporunuzu saniyeler içinde alın.",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10"
  }
];

export function UserManualSection() {
  return (
    <section id="guide" className="py-24 lg:py-40 px-6 bg-black/40 relative">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20 lg:mb-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-gray-400 text-[10px] font-black uppercase tracking-widest mb-6"
          >
            <Monitor className="w-3 h-3" />
            Platform Kullanım Klavuzu
          </motion.div>
          <h2 className="text-4xl lg:text-6xl font-black tracking-tight mb-8 uppercase">
            Sentience Nasıl Kullanılır?
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto font-medium text-lg">
            Karmaşık akademik süreçleri dört basit adımda yönetin. İşte profesyonel dürüstlük yolculuğunuz.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="relative group"
              >
                {idx < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-full w-full h-[1px] bg-gradient-to-r from-emerald-500/20 to-transparent z-0 translate-x-4" />
                )}
                <div className="relative z-10 p-8 rounded-[32px] bg-white/[0.02] border border-white/5 group-hover:border-emerald-500/30 transition-all">
                  <div className={`w-16 h-16 rounded-2xl ${step.bgColor} flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-8 h-8 ${step.color}`} />
                  </div>
                  <h3 className="text-xl font-bold mb-4 uppercase tracking-tight">{step.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed font-medium">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-20 lg:mt-32 p-8 lg:p-16 rounded-[48px] bg-gradient-to-br from-emerald-500/5 to-blue-500/5 border border-white/5 flex flex-col lg:flex-row items-center justify-between gap-12">
          <div className="max-w-xl">
            <h4 className="text-2xl lg:text-3xl font-black mb-6 uppercase tracking-tighter">Detaylı Rapor Ekranı</h4>
            <p className="text-gray-400 text-sm lg:text-base leading-relaxed mb-8 font-medium">
              Rapor ekranımızda metninizin her cümlesi için ayrı ayrı YZ olasılığı hesaplanır. Isı haritası (Heatmap) sayesinde metindeki "kritik" bölgeleri anında görebilir ve İnsanlaştırma ajanını bu bölgelere odaklayabilirsiniz.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-500 tracking-widest px-4 py-2 bg-white/5 rounded-full">
                <Database className="w-3 h-3" /> Veri Güvenliği
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-500 tracking-widest px-4 py-2 bg-white/5 rounded-full">
                <Shield className="w-3 h-3" /> Etik Protokolü
              </div>
            </div>
          </div>
          <div className="w-full lg:w-1/3 aspect-square relative">
            <div className="absolute inset-0 bg-emerald-500/20 blur-[100px] rounded-full animate-pulse-soft" />
            <div className="relative h-full w-full glass-panel border border-white/10 rounded-[32px] overflow-hidden flex flex-col">
              <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
                <div className="text-[8px] font-black uppercase tracking-widest text-gray-500">Live Report</div>
              </div>
              <div className="flex-1 p-6 space-y-4">
                <div className="h-4 bg-red-500/20 rounded-full w-full" />
                <div className="h-4 bg-emerald-500/10 rounded-full w-3/4" />
                <div className="h-4 bg-amber-500/20 rounded-full w-5/6" />
                <div className="h-4 bg-emerald-500/10 rounded-full w-full" />
                <div className="h-4 bg-emerald-500/10 rounded-full w-4/6" />
                <div className="mt-8 pt-6 border-t border-white/5">
                  <div className="flex justify-between items-end">
                    <div>
                      <div className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Risk Skoru</div>
                      <div className="text-2xl font-black text-red-500">%78</div>
                    </div>
                    <button className="px-4 py-2 bg-emerald-500 text-black rounded-lg text-[8px] font-black uppercase tracking-widest">Düzelt</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
