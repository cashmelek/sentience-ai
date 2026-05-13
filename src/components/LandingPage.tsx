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
  Twitter,
  Menu,
  X,
  Gauge
} from 'lucide-react';
import { cn } from '../lib/utils';
import { detectAI } from '../services/geminiService';
import toast from 'react-hot-toast';
import { InfoTooltip } from './InfoTooltip';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

const AGENTS = [
  {
    id: "auditor",
    name: "YZ Denetçisi",
    role: "Tespit Uzmanı",
    description: "Metindeki yapay zeka parmak izlerini ve sentetik yapıları saniyeler içinde analiz eder.",
    icon: Search,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10"
  },
  {
    id: "ghostwriter",
    name: "Hayalet Yazar",
    role: "Üslup Mimarı",
    description: "Metni sizin sesinizden çıkmış gibi doğal, akıcı ve YZ dedektörlerini aşacak şekilde yeniden kurgular.",
    icon: Sparkles,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10"
  },
  {
    id: "sentinel",
    name: "Gözcü",
    role: "Doğruluk Muhafızı",
    description: "İntihal denetimi yapar ve kaynakları 2026 canlı verisiyle doğrular. Asla uydurma bağlantı vermez.",
    icon: ShieldCheck,
    color: "text-red-500",
    bgColor: "bg-red-500/10"
  },
  {
    id: "stylemaster",
    name: "Stil Ustası",
    role: "Hafıza Merkezi",
    description: "Özel tonlarınızı ve marka dilinizi öğrenerek her yazıda aynı yüksek kaliteyi korur.",
    icon: Layers,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10"
  }
];

const PLANS = [
  {
    name: "Ücretsiz",
    price: "0",
    features: ["Günlük 10 İşlem", "Standart İnsanlaştırma", "Temel YZ Tespiti", "Topluluk Desteği"],
    recommended: false,
    button: "Ücretsiz Başla"
  },
  {
    name: "Pro",
    price: "29",
    features: ["Günlük 50 İşlem", "Gelişmiş Hayalet Yazar Modu", "Gözcü Canlı Kaynak", "7/24 Öncelikli Destek"],
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
  const [demoSensitivity, setDemoSensitivity] = useState(50);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [demoResult, setDemoResult] = useState<{ score: number, sentenceScores: any[], reasoning: string } | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleDemoAnalyze = async () => {
    if (!demoText.trim() || demoText.length < 50) {
      toast.error("Analiz için en az 50 karakter giriniz.");
      return;
    }
    setIsAnalyzing(true);
    try {
      const res = await detectAI(demoText, demoSensitivity);
      setDemoResult({
        score: res.score,
        sentenceScores: res.sentenceScores,
        reasoning: res.reasoning
      });
      toast.success("Denetçi Ajan analizi tamamladı!");
    } catch (err) {
      toast.error("Bağlantı hatası.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-mesh text-white font-sans overflow-x-hidden selection:bg-emerald-500/30">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-[100] border-b border-white/5 bg-black/40 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Fingerprint className="w-8 h-8 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]" />
            <span className="text-2xl font-black tracking-tighter">SENTIENCE</span>
          </div>
          
          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">
            <a href="#features" className="hover:text-white transition-colors">Ajanlar</a>
            <a href="#demo" className="hover:text-white transition-colors">Demo</a>
            <a href="#pricing" className="hover:text-white transition-colors">Fiyatlandırma</a>
          </div>
          
          <div className="hidden lg:flex items-center gap-4">
            <button onClick={onLogin} className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 hover:text-white transition-all mr-2">Giriş Yap</button>
            <button onClick={onGetStarted} className="px-6 py-3 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-emerald-400 transition-all active:scale-95 shadow-xl shadow-white/5">Hemen Başla</button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 text-gray-400 hover:text-white transition-colors"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Nav Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            className="fixed inset-0 z-[90] bg-brand-bg flex flex-col p-8 pt-24 lg:hidden"
          >
            <div className="flex flex-col gap-6 text-xl font-black uppercase tracking-widest mb-12">
              <a href="#features" onClick={() => setIsMenuOpen(false)} className="text-gray-400 hover:text-emerald-500">Ajanlar</a>
              <a href="#demo" onClick={() => setIsMenuOpen(false)} className="text-gray-400 hover:text-emerald-500">Demo</a>
              <a href="#pricing" onClick={() => setIsMenuOpen(false)} className="text-gray-400 hover:text-emerald-500">Fiyatlandırma</a>
            </div>
            <div className="mt-auto space-y-4">
              <button onClick={onLogin} className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl font-black text-xs uppercase tracking-widest">Giriş Yap</button>
              <button onClick={onGetStarted} className="w-full py-4 bg-emerald-500 text-black rounded-2xl font-black text-xs uppercase tracking-widest">Hemen Başla</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <header className="relative pt-32 lg:pt-48 pb-20 lg:pb-24 px-6 overflow-hidden text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full">
          <div className="absolute top-20 left-0 w-[300px] lg:w-[500px] h-[300px] lg:h-[500px] bg-emerald-500/10 blur-[100px] lg:blur-[150px] rounded-full animate-pulse-soft" />
          <div className="absolute bottom-20 right-0 w-[300px] lg:w-[500px] h-[300px] lg:h-[500px] bg-blue-500/10 blur-[100px] lg:blur-[150px] rounded-full animate-pulse-soft" />
        </div>

        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-emerald-500 text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em] mb-8 lg:mb-10"
          >
            <Zap className="w-3 h-3 fill-emerald-500" />
            2026 Model Sentience Protokolü
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.1] lg:leading-[1] mb-8 lg:mb-10"
          >
            Yapay Zeka Yazdı,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500 text-shadow-glow">Sentience İnsanlaştırdı.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-base lg:text-xl text-gray-400 mb-10 lg:mb-14 max-w-2xl mx-auto leading-relaxed font-medium"
          >
            Yapay zeka dedektörlerini aşan, formatı milimetrik koruyan ve kaynakları 2026 canlı verisiyle doğrulayan dünyanın ilk ajan tabanlı insanlaştırma ağı.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6 lg:gap-8"
          >
            <button onClick={onGetStarted} className="w-full sm:w-auto group flex items-center justify-center gap-4 px-10 lg:px-12 py-5 lg:py-6 bg-emerald-500 text-black rounded-[24px] lg:rounded-[32px] font-black text-sm uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-2xl shadow-emerald-500/30 active:scale-95">
              Ajanları Görevlendir
              <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </button>
            <a href="#demo" className="text-[10px] font-black uppercase tracking-[0.3em] text-white hover:text-emerald-400 transition-all underline underline-offset-8 decoration-emerald-500/30">Ücretsiz Demo Dene</a>
          </motion.div>
        </div>
      </header>

      {/* Agents Section */}
      <section id="features" className="py-24 lg:py-40 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 lg:mb-24">
            <h2 className="text-3xl lg:text-5xl font-black tracking-tight mb-4 lg:mb-6 uppercase">Sizi Kim Koruyor?</h2>
            <p className="text-gray-500 font-bold uppercase tracking-[0.3em] text-[9px] lg:text-[10px]">Dört Uzman Ajan, Tek Bir Amaç: Doğallık.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-10">
            {AGENTS.map((agent, i) => {
              const Icon = agent.icon;
              return (
                <motion.div 
                  key={i}
                  whileHover={{ y: -15 }}
                  className="group p-8 lg:p-10 rounded-[32px] lg:rounded-[48px] bg-white/[0.02] border border-white/5 hover:border-emerald-500/20 transition-all premium-card"
                >
                  <div className={cn("w-14 lg:w-16 h-14 lg:h-16 rounded-2xl flex items-center justify-center mb-6 lg:mb-8 transition-all group-hover:scale-110", agent.bgColor)}>
                    <Icon className={cn("w-7 lg:w-8 h-7 lg:h-8", agent.color)} />
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl lg:text-2xl font-bold text-white">{agent.name}</h3>
                    <InfoTooltip text={agent.description} position="bottom" />
                  </div>
                  <div className="text-[9px] lg:text-[10px] font-black uppercase text-emerald-500 mb-4 lg:mb-6 tracking-[0.2em]">{agent.role}</div>
                  <p className="text-xs lg:text-sm text-gray-500 leading-relaxed font-medium">{agent.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="py-24 lg:py-40 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <div className="glass-morphism rounded-[32px] lg:rounded-[64px] overflow-hidden border border-white/10 shadow-3xl flex flex-col lg:flex-row">
            <div className="lg:w-1/2 p-8 lg:p-20 border-b lg:border-b-0 lg:border-r border-white/5 bg-black/30">
              <div className="flex items-center gap-4 mb-8 lg:mb-10">
                <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                  <Search className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-xl lg:text-2xl font-bold">YZ Denetçisi</h3>
                  <p className="text-[9px] lg:text-[10px] text-gray-500 uppercase font-black tracking-[0.2em] mt-1 text-blue-400">Ücretsiz Risk Analizi</p>
                </div>
              </div>
              <textarea 
                value={demoText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full h-56 lg:h-72 bg-white/5 outline-none resize-none text-gray-300 leading-relaxed text-sm p-6 lg:p-8 rounded-[24px] lg:rounded-[32px] border border-white/5 focus:border-blue-500/40 transition-all custom-scrollbar placeholder:text-gray-700"
                placeholder="Analiz edilecek metni buraya yapıştırın (En az 50 karakter)..."
              />

              <div className="mt-6 p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-blue-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Analiz Hassasiyeti</span>
                  </div>
                  <span className="text-[10px] font-black text-blue-400">%{demoSensitivity}</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={demoSensitivity}
                  onChange={(e) => setDemoSensitivity(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between mt-2 text-[8px] font-bold text-gray-600 uppercase">
                  <span>Hoşgörülü</span>
                  <span>Dengeli</span>
                  <span>Çok Hassas</span>
                </div>
              </div>
              <button 
                onClick={handleDemoAnalyze}
                disabled={isAnalyzing}
                className="w-full mt-6 lg:mt-8 py-4 lg:py-5 bg-blue-600 text-white rounded-2xl font-black text-[9px] lg:text-[10px] uppercase tracking-[0.2em] hover:bg-blue-500 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50 shadow-xl shadow-blue-500/20"
              >
                {isAnalyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-5 h-5" />}
                Risk Analizini Başlat
              </button>
            </div>
            
            <div className="lg:w-1/2 p-8 lg:p-20 flex flex-col items-center justify-center text-center bg-emerald-500/[0.01]">
              <AnimatePresence mode="wait">
                {demoResult !== null ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-8 lg:space-y-10"
                  >
                    <div className="relative flex items-center justify-center">
                      <svg className="w-48 lg:w-64 h-48 lg:h-64" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-white/5" />
                        <motion.circle 
                          cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="6" fill="transparent"
                          className={cn(demoResult.score > 0.5 ? "text-red-500" : "text-emerald-500")}
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: demoResult.score }}
                          style={{ rotate: -90, transformOrigin: '50% 50%' }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl lg:text-6xl font-black tracking-tighter">%{Math.round(demoResult.score * 100)}</span>
                        <span className="text-[8px] lg:text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mt-2">YZ OLASILIĞI</span>
                      </div>
                    </div>
                    <div className="max-w-sm mx-auto">
                      <h4 className="text-lg lg:text-xl font-bold mb-3">Denetçi Raporu</h4>
                      <p className="text-xs lg:text-sm text-gray-400 leading-relaxed font-medium mb-4">
                        {demoResult.reasoning || (demoResult.score > 0.5 
                          ? "Yüksek YZ izine rastlandı. Hayalet Yazar ajanını kullanarak bu metni insanlaştırmanız önerilir."
                          : "Düşük YZ riski. Metin doğal bir yapı sergiliyor.")}
                      </p>

                      {/* Demo Heatmap Preview */}
                      <div className="p-4 rounded-2xl bg-black/40 border border-white/5 text-left text-[11px] leading-relaxed max-h-40 overflow-y-auto custom-scrollbar">
                        {demoResult.sentenceScores.map((s, idx) => (
                          <span 
                            key={idx} 
                            className={cn(
                              "px-0.5 rounded",
                              s.score > 0.7 ? "bg-red-500/20 border-b border-red-500/40" : 
                              s.score > 0.3 ? "bg-amber-500/20 border-b border-amber-500/40" : 
                              "bg-emerald-500/10 border-b border-emerald-500/20"
                            )}
                          >
                            {s.sentence}{" "}
                          </span>
                        ))}
                      </div>
                    </div>

                    {demoResult.sentenceScores.filter(s => s.score > 0.6).length > 0 && (
                      <div className="w-full space-y-3 text-left max-h-48 overflow-y-auto custom-scrollbar pr-2">
                        <div className="text-[9px] font-black uppercase text-gray-500 tracking-widest mb-2">Kritik YZ Bulguları:</div>
                        {demoResult.sentenceScores.filter(s => s.score > 0.6).slice(0, 3).map((s, idx) => (
                          <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
                            <div className="text-[10px] text-gray-300 font-medium italic">"{s.sentence}"</div>
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] text-red-500 font-bold uppercase">Risk: %{Math.round(s.score * 100)}</span>
                              <span className="text-[8px] text-gray-600 font-medium">{s.reason || "Tekdüze yapı tespit edildi."}</span>
                            </div>
                          </div>
                        ))}
                        {demoResult.sentenceScores.filter(s => s.score > 0.6).length > 3 && (
                          <div className="text-[9px] text-center text-gray-600 font-bold uppercase">+ {demoResult.sentenceScores.filter(s => s.score > 0.6).length - 3} Daha Fazla Bulgu</div>
                        )}
                      </div>
                    )}

                    <button onClick={onGetStarted} className="px-8 lg:px-10 py-3 lg:py-4 bg-white text-black rounded-2xl font-black text-[9px] lg:text-[10px] uppercase tracking-[0.2em] hover:bg-emerald-400 transition-all flex items-center gap-3 mx-auto shadow-xl shadow-white/5">
                      Tamamen İnsanlaştır <ArrowRight className="w-4 h-4" />
                    </button>
                  </motion.div>
                ) : (
                  <div className="space-y-6 lg:space-y-8 grayscale opacity-20">
                    <MousePointer2 className="w-16 lg:w-20 h-16 lg:h-20 text-gray-600 mx-auto" />
                    <p className="text-[9px] lg:text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Analiz sonucu burada görünecek</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Humanize Demo Preview */}
          <div className="mt-12 glass-panel p-8 lg:p-12 rounded-[32px] border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[8px] font-black uppercase tracking-widest">
                <Lock className="w-3 h-3" />
                Hayalet Yazar Premium
              </div>
            </div>
            <div className="flex flex-col lg:flex-row items-center gap-10">
              <div className="lg:w-1/3">
                <h3 className="text-2xl font-black mb-4 uppercase tracking-tighter">Hayalet Yazar</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-6 font-medium">Metninizi sadece insanlaştırmakla kalmaz, istediğiniz tonda ve duyguda yeniden inşa eder. YZ izlerini %100'e kadar temizler.</p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Duygu Analizi ve Ekleme</li>
                  <li className="flex items-center gap-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Doğal Sentaks Varyasyonları</li>
                  <li className="flex items-center gap-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Format ve Liste Koruması</li>
                </ul>
                <button onClick={onGetStarted} className="w-full py-4 bg-emerald-500 text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/20">Tam Erişimi Aç</button>
              </div>
              <div className="lg:w-2/3 w-full">
                <div className="relative rounded-[24px] overflow-hidden bg-black/40 border border-white/5 aspect-video flex items-center justify-center group">
                  <div className="absolute inset-0 bg-mesh opacity-20 blur-3xl" />
                  <div className="relative z-10 text-center space-y-6 px-10">
                    <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                      <Sparkles className="w-10 h-10 text-emerald-500" />
                    </div>
                    <p className="text-gray-600 text-[10px] font-black uppercase tracking-[0.4em]">İnsanlaştırma Önizlemesi İçin Kayıt Olun</p>
                    <div className="flex gap-2 justify-center">
                      <div className="h-1.5 w-12 bg-white/5 rounded-full animate-pulse" />
                      <div className="h-1.5 w-24 bg-white/5 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                      <div className="h-1.5 w-16 bg-white/5 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 lg:py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 lg:mb-20">
            <h2 className="text-3xl lg:text-4xl font-black tracking-tight mb-4 uppercase">Adil Fiyatlandırma</h2>
            <p className="text-gray-500 font-bold uppercase tracking-[0.3em] text-[9px] lg:text-xs">Yapay Zekayı Gömecek Gücü Seçin.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-center">
            {PLANS.map((plan, i) => (
              <div 
                key={i} 
                className={cn(
                  "p-8 lg:p-10 rounded-[32px] lg:rounded-[48px] border transition-all relative flex flex-col",
                  plan.recommended 
                    ? "bg-white/[0.04] border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.1)] md:scale-105 z-10 py-12 lg:py-14" 
                    : "bg-white/[0.02] border-white/5 hover:border-white/10"
                )}
              >
                {plan.recommended && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-emerald-500 text-black text-[9px] lg:text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-emerald-500/20">En Popüler</div>
                )}
                <div className="text-xl lg:text-2xl font-bold mb-1 uppercase tracking-tighter">{plan.name}</div>
                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-4xl lg:text-5xl font-black">${plan.price}</span>
                  <span className="text-xs lg:text-sm text-gray-500 font-bold uppercase">/aylık</span>
                </div>
                <div className="space-y-4 mb-10 flex-1">
                  {plan.features.map((feature, j) => (
                    <div key={j} className="flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="text-xs font-bold text-gray-400">{feature}</span>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={onGetStarted}
                  className={cn(
                    "w-full py-4 lg:py-5 rounded-[20px] font-black text-xs uppercase tracking-widest transition-all active:scale-95",
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
      <footer className="py-12 lg:py-20 border-t border-white/5 bg-black/20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-2">
              <Fingerprint className="w-6 h-6 text-emerald-500" />
              <span className="text-xl font-black tracking-tighter">SENTIENCE</span>
            </div>
            <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest text-center md:text-left">© 2026 Tüm Hakları Saklıdır.</p>
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
