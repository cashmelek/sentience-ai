import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Fingerprint, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  Search, 
  MousePointer2, 
  ArrowRight, 
  CheckCircle2, 
  Globe, 
  Lock,
  Cpu,
  RefreshCw,
  BarChart3,
  Layers,
  Github,
  Twitter
} from 'lucide-react';
import { cn } from '../lib/utils';
import { detectAI } from '../services/geminiService';
import toast from 'react-hot-toast';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

const AGENTS = [
  {
    id: "auditor",
    name: "Auditor-2.5",
    role: "Tespit Uzmanı",
    description: "Metindeki yapay zeka parmak izlerini ve sentetik yapıları saniyeler içinde analiz eder.",
    icon: Search,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10"
  },
  {
    id: "ghostwriter",
    name: "GhostWriter",
    role: "Üslup Mimarı",
    description: "Metni sizin sesinizden çıkmış gibi doğal, akıcı ve YZ dedektörlerini aşacak şekilde yeniden kurgular.",
    icon: Sparkles,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10"
  },
  {
    id: "sentinel",
    name: "Sentinel",
    role: "Doğruluk Muhafızı",
    description: "İntihal denetimi yapar ve kaynakları 2026 canlı verisiyle doğrular. Asla uydurma link vermez.",
    icon: ShieldCheck,
    color: "text-red-500",
    bgColor: "bg-red-500/10"
  },
  {
    id: "stylemaster",
    name: "StyleMaster",
    role: "Hafıza Merkezi",
    description: "Özel tonlarınızı ve marka dilinizi öğrenerek her yazıda aynı yüksek kaliteyi korur.",
    icon: Layers,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10"
  }
];

const PLANS = [
  {
    name: "Free",
    price: "0",
    features: ["Günlük 10 İşlem", "Standart İnsanlaştırma", "Temel YZ Tespiti", "Topluluk Desteği"],
    recommended: false,
    button: "Ücretsiz Başla"
  },
  {
    name: "Pro",
    price: "29",
    features: ["Günlük 50 İşlem", "GhostWriter Gelişmiş Mod", "Sentinel Canlı Kaynak", "7/24 Öncelikli Destek"],
    recommended: true,
    button: "Pro'ya Geç"
  },
  {
    name: "Premium",
    price: "99",
    features: ["Sınırsız İşlem", "Tüm Ajanlara Tam Erişim", "API Anahtarı Desteği", "Özel Marka Sesi Eğitimi"],
    recommended: false,
    button: "İşletme İçin"
  }
];

export function LandingPage({ onGetStarted, onLogin }: LandingPageProps) {
  const [demoText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [demoResult, setDemoResult] = useState<number | null>(null);

  const handleDemoAnalyze = async () => {
    if (!demoText.trim() || demoText.length < 50) {
      toast.error("Analiz için en az 50 karakter giriniz.");
      return;
    }
    setIsAnalyzing(true);
    try {
      const res = await detectAI(demoText);
      setDemoResult(res.score);
      toast.success("Auditor Agent analizi tamamladı!");
    } catch (err) {
      toast.error("Bağlantı hatası.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg text-white font-sans overflow-x-hidden selection:bg-emerald-500/30">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-[100] border-b border-white/5 bg-brand-bg/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Fingerprint className="w-8 h-8 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]" />
            <span className="text-2xl font-black tracking-tighter">SENTIENCE</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-bold uppercase tracking-widest text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">Ajanlar</a>
            <a href="#demo" className="hover:text-white transition-colors">Demo</a>
            <a href="#pricing" className="hover:text-white transition-colors">Fiyatlandırma</a>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={onLogin} className="text-sm font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-all">Giriş Yap</button>
            <button onClick={onGetStarted} className="px-6 py-2.5 bg-white text-black rounded-full font-black text-xs uppercase tracking-widest hover:bg-emerald-400 transition-all active:scale-95 shadow-lg shadow-white/5">Hemen Başla</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-40 pb-20 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full">
          <div className="absolute top-20 left-0 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-20 right-0 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-emerald-500 text-[10px] font-black uppercase tracking-[0.2em] mb-8"
          >
            <Zap className="w-3 h-3 fill-emerald-500" />
            2026 Model Sentience Protokolü
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1] mb-8"
          >
            Yapay Zeka Yazdı,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500">Sentience İnsanlaştırdı.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed font-medium"
          >
            Yapay zeka dedektörlerini aşan, formatı milimetrik koruyan ve kaynakları 2026 canlı verisiyle doğrulayan dünyanın ilk agent-native insanlaştırma ağı.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col md:flex-row items-center justify-center gap-6"
          >
            <button onClick={onGetStarted} className="group flex items-center gap-3 px-10 py-5 bg-emerald-500 text-black rounded-[24px] font-black text-sm uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/20 active:scale-95">
              Ajanları Görevlendir
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <a href="#demo" className="text-sm font-bold uppercase tracking-widest text-white hover:text-emerald-400 transition-all underline underline-offset-8 decoration-emerald-500/30">Ücretsiz Demo Dene</a>
          </motion.div>
        </div>
      </header>

      {/* Agents Section */}
      <section id="features" className="py-32 px-6 bg-brand-bg relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-black tracking-tight mb-4 uppercase">Sizi Kim Koruyor?</h2>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Dört Uzman Ajan, Tek Bir Amaç: Doğallık.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {AGENTS.map((agent, i) => {
              const Icon = agent.icon;
              return (
                <motion.div 
                  key={i}
                  whileHover={{ y: -10 }}
                  className="group p-8 rounded-[40px] bg-white/[0.02] border border-white/5 hover:border-emerald-500/20 transition-all"
                >
                  <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all group-hover:scale-110", agent.bgColor)}>
                    <Icon className={cn("w-7 h-7", agent.color)} />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-white">{agent.name}</h3>
                  <div className="text-[10px] font-black uppercase text-emerald-500 mb-4 tracking-widest">{agent.role}</div>
                  <p className="text-sm text-gray-500 leading-relaxed font-medium">{agent.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="py-32 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <div className="glass-panel rounded-[48px] overflow-hidden border border-white/10 shadow-2xl flex flex-col lg:flex-row">
            <div className="lg:w-1/2 p-12 lg:p-16 border-b lg:border-b-0 lg:border-r border-white/5 bg-black/20">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20">
                  <Search className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Auditor Agent</h3>
                  <p className="text-xs text-gray-500 uppercase font-black tracking-widest mt-0.5 text-blue-400">Ücretsiz Risk Analizi</p>
                </div>
              </div>
              <textarea 
                value={demoText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full h-64 bg-transparent outline-none resize-none text-gray-300 leading-relaxed text-sm p-6 rounded-3xl border border-white/5 focus:border-blue-500/30 transition-all custom-scrollbar"
                placeholder="Analiz edilecek metni buraya yapıştırın (Min 50 karakter)..."
              />
              <button 
                onClick={handleDemoAnalyze}
                disabled={isAnalyzing}
                className="w-full mt-6 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-500 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
              >
                {isAnalyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
                Risk Analizini Başlat
              </button>
            </div>
            
            <div className="lg:w-1/2 p-12 lg:p-16 flex flex-col items-center justify-center text-center bg-emerald-500/[0.02]">
              <AnimatePresence mode="wait">
                {demoResult !== null ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-8"
                  >
                    <div className="relative">
                      <svg className="w-48 h-48">
                        <circle cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                        <motion.circle 
                          cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="8" fill="transparent"
                          strokeDasharray={2 * Math.PI * 80}
                          initial={{ strokeDashoffset: 2 * Math.PI * 80 }}
                          animate={{ strokeDashoffset: 2 * Math.PI * 80 * (1 - demoResult) }}
                          className={cn(demoResult > 0.5 ? "text-red-500" : "text-emerald-500")}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl font-black">%{Math.round(demoResult * 100)}</span>
                        <span className="text-[10px] font-bold text-gray-500 uppercase">YZ OLASILIĞI</span>
                      </div>
                    </div>
                    <div className="max-w-xs">
                      <h4 className="text-lg font-bold mb-2">Auditor Raporu</h4>
                      <p className="text-sm text-gray-400 leading-relaxed">
                        {demoResult > 0.5 
                          ? "Yüksek YZ izine rastlandı. GhostWriter ajanını kullanarak bu metni insanlaştırmanız önerilir."
                          : "Düşük YZ riski. Metin doğal bir yapı sergiliyor."}
                      </p>
                    </div>
                    <button onClick={onGetStarted} className="px-8 py-3 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-400 transition-all flex items-center gap-2 mx-auto">
                      Tamamen İnsanlaştır <ArrowRight className="w-4 h-4" />
                    </button>
                  </motion.div>
                ) : (
                  <div className="space-y-6 grayscale opacity-30">
                    <MousePointer2 className="w-16 h-16 text-gray-600 mx-auto" />
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-[0.2em]">Analiz sonucu burada görünecek</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-black tracking-tight mb-4 uppercase">Adil Fiyatlandırma</h2>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Yapay Zekayı Gömecek Gücü Seçin.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {PLANS.map((plan, i) => (
              <div 
                key={i} 
                className={cn(
                  "p-10 rounded-[48px] border transition-all relative flex flex-col",
                  plan.recommended 
                    ? "bg-white/[0.04] border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.1)] scale-105 z-10" 
                    : "bg-white/[0.02] border-white/5 hover:border-white/10"
                )}
              >
                {plan.recommended && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-emerald-500 text-black text-[10px] font-black uppercase tracking-widest rounded-full">En Popüler</div>
                )}
                <div className="text-xl font-bold mb-1 uppercase tracking-tighter">{plan.name}</div>
                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-4xl font-black">${plan.price}</span>
                  <span className="text-sm text-gray-500 font-bold uppercase">/aylık</span>
                </div>
                <div className="space-y-4 mb-10 flex-1">
                  {plan.features.map((feature, j) => (
                    <div key={j} className="flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs font-bold text-gray-400">{feature}</span>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={onGetStarted}
                  className={cn(
                    "w-full py-4 rounded-[20px] font-black text-xs uppercase tracking-widest transition-all active:scale-95",
                    plan.recommended ? "bg-emerald-500 text-black hover:bg-emerald-400 shadow-xl shadow-emerald-500/20" : "bg-white/5 text-white hover:bg-white/10 border border-white/10"
                  )}
                >
                  {plan.button}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-white/5 bg-black/20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-2">
              <Fingerprint className="w-6 h-6 text-emerald-500" />
              <span className="text-xl font-black">SENTIENCE</span>
            </div>
            <p className="text-xs text-gray-600 font-bold uppercase tracking-widest">© 2026 Tüm Hakları Saklıdır.</p>
          </div>
          <div className="flex items-center gap-8">
            <Globe className="w-5 h-5 text-gray-600 hover:text-white transition-colors cursor-pointer" />
            <Github className="w-5 h-5 text-gray-600 hover:text-white transition-colors cursor-pointer" />
            <Twitter className="w-5 h-5 text-gray-600 hover:text-white transition-colors cursor-pointer" />
          </div>
        </div>
      </footer>
    </div>
  );
}
