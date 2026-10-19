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
  Gauge,
  FileCheck,
  ArrowRightLeft,
  Award,
  TrendingUp,
  Users,
  Check,
  FileText
} from 'lucide-react';
import { cn } from '../lib/utils';
import { detectAI } from '../services/geminiService';
import toast from 'react-hot-toast';
import { InfoTooltip } from './InfoTooltip';
import { UserManualSection } from './UserManualSection';

interface LandingPageProps {
  onGetStarted: (text?: string) => void;
  onLogin: () => void;
}

const FEATURES = [
  {
    id: "auditor",
    name: "YZ Tespiti",
    role: "Risk Analizi",
    description: "Metindeki yapay zeka izlerini, intihal risklerini ve akademik tutarsızlıkları saniyeler içinde haritalandırır.",
    icon: Search,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10"
  },
  {
    id: "humanizer",
    name: "İnsanlaştırma",
    role: "Metin Dönüşümü",
    description: "Metni akademik etik kurallara göre yeniden inşa eder. Turnitin ve iThenticate gibi sistemlerden tam not alır.",
    icon: Sparkles,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10"
  },
  {
    id: "sentinel",
    name: "İntihal Kontrolü",
    role: "Doğruluk Muhafızı",
    description: "Akademik intihal denetiminde asla uydurma kaynak/link üretilemez. Sadece geçmiş ve en son hangi tarihi Gün, Ay, Yıl içerisinde ise ismi bilinen ve erişilebilir kaynaklar sunar.",
    icon: ShieldCheck,
    color: "text-red-500",
    bgColor: "bg-red-500/10"
  },
  {
    id: "stylemaster",
    name: "Format Desteği",
    role: "Akademik Standartlar",
    description: "Özel tonlarınızı, makale formatlarınızı (APA, MLA, IEEE) öğrenerek her yazıda tutarlılık sağlar.",
    icon: Layers,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10"
  }
];

const PLANS = [
  {
    name: "Öğrenci",
    price: "199",
    features: ["10.000 Kelime / Ay", "%15 İntihal Koruma Sınırı", "Temel İnsanlaştırma", "7 Gün Geçmiş Hafızası"],
    recommended: false,
    button: "Çırak Olarak Başla"
  },
  {
    name: "Akademik",
    price: "599",
    features: ["100.000 Kelime / Ay", "Gelişmiş İnsanlaştırma", "Canlı İntihal Kontrolü", "Turnitin & iThenticate Uyumu"],
    recommended: true,
    button: "Profesyonel Planı Seç"
  },
  {
    name: "Kurumsal",
    price: "1.999",
    features: ["Sınırsız Kelime (Fair Use)", "Tam API Erişimi", "Özel Marka Sesi Eğitimi", "VİP Öncelikli Destek"],
    recommended: false,
    button: "Sentient Gücünü Al"
  }
];

export function LandingPage({ onGetStarted, onLogin }: LandingPageProps) {
  const [demoText, setInputText] = useState('');
  const [demoSensitivity, setDemoSensitivity] = useState(50);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [demoResult, setDemoResult] = useState<{ score: number, sentenceScores: any[], reasoning: string } | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [compareMode, setCompareMode] = useState<'split' | 'before' | 'after'>('split');

  // Mobil Menü Scroll Kilidi
  React.useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

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
      toast.success("Analiz tamamlandı!");
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
            <span className="text-2xl font-black tracking-tighter"><span lang="en">SENTIENCE</span></span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">
            <a href="#features" className="hover:text-white transition-colors">Özellikler</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">Nasıl Çalışır?</a>
            <a href="#demo" className="hover:text-white transition-colors">Demo</a>
            <a href="#guide" className="hover:text-white transition-colors">Rehber</a>
            <a href="#pricing" className="hover:text-white transition-colors">Fiyatlandırma</a>
          </div>

          <div className="hidden lg:flex items-center gap-4">
            <button onClick={onLogin} className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 hover:text-white transition-all mr-2">GİRİŞ YAP</button>
            <button onClick={() => onGetStarted()} className="px-6 py-3 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-emerald-400 transition-all active:scale-95 shadow-xl shadow-white/5">HEMEN BAŞLA</button>
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
              <a href="#features" onClick={() => setIsMenuOpen(false)} className="text-gray-400 hover:text-emerald-500">Özellikler</a>
              <a href="#how-it-works" onClick={() => setIsMenuOpen(false)} className="text-gray-400 hover:text-emerald-500">Nasıl Çalışır?</a>
              <a href="#demo" onClick={() => setIsMenuOpen(false)} className="text-gray-400 hover:text-emerald-500">Demo</a>
              <a href="#guide" onClick={() => setIsMenuOpen(false)} className="text-gray-400 hover:text-emerald-500">Rehber</a>
              <a href="#pricing" onClick={() => setIsMenuOpen(false)} className="text-gray-400 hover:text-emerald-500">Fiyatlandırma</a>
            </div>
            <div className="mt-auto space-y-4">
              <button onClick={onLogin} className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl font-black text-xs uppercase tracking-widest">GİRİŞ YAP</button>
              <button onClick={() => onGetStarted()} className="w-full py-4 bg-emerald-500 text-black rounded-2xl font-black text-xs uppercase tracking-widest">HEMEN BAŞLA</button>
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
            2026 Model <span lang="en">SENTIENCE</span> Protokolü
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.1] lg:leading-[1] mb-8 lg:mb-10"
          >
            Yapay Zeka Yazdı,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500 text-shadow-glow"><span lang="en">SENTIENCE</span> İnsanlaştırdı.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-base lg:text-xl text-gray-400 mb-10 lg:mb-14 max-w-2xl mx-auto leading-relaxed font-medium"
          >
            Yapay zeka dedektörlerini aşan, formatı milimetrik koruyan ve güvenli bir şekilde doğrulayan profesyonel insanlaştırma ve analiz platformu.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6 lg:gap-8"
          >
            <button onClick={() => onGetStarted()} className="w-full sm:w-auto group flex items-center justify-center gap-4 px-10 lg:px-12 py-5 lg:py-6 bg-emerald-500 text-black rounded-[24px] lg:rounded-[32px] font-black text-sm uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-2xl shadow-emerald-500/30 active:scale-95">
              İnsanlaştırmayı Başlat
              <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </button>
            <a href="#demo" className="text-[10px] font-black uppercase tracking-[0.3em] text-white hover:text-emerald-400 transition-all underline underline-offset-8 decoration-emerald-500/30">Ücretsiz Demo Dene</a>
          </motion.div>
        </div>
      </header>

      {/* Social Proof & Trust Badges */}
      <section className="relative z-20 -mt-10 lg:-mt-12 max-w-6xl mx-auto px-6 mb-8 lg:mb-12">
        <div className="py-4 px-6 rounded-2xl bg-black/40 backdrop-blur-2xl border border-white/10 flex flex-wrap items-center justify-around gap-4 text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-8 shadow-2xl">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Turnitin %100 Uyumlu</span>
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-white/10 hidden sm:block" />
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-blue-400" />
            <span>iThenticate Güvenli</span>
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-white/10 hidden sm:block" />
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400" />
            <span>KVKK & GDPR Korumalı</span>
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-white/10 hidden sm:block" />
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-400" />
            <span>%15 Etik İntihal Limiti</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-6 rounded-[24px] bg-white/[0.02] border border-white/5 backdrop-blur-xl text-center hover:border-emerald-500/20 transition-all">
            <div className="text-2xl lg:text-3xl font-black text-white tracking-tight mb-1">10.000+</div>
            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-400">İşlenmiş Makale</div>
          </div>
          <div className="p-6 rounded-[24px] bg-white/[0.02] border border-white/5 backdrop-blur-xl text-center hover:border-blue-500/20 transition-all">
            <div className="text-2xl lg:text-3xl font-black text-white tracking-tight mb-1">%99.4</div>
            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-400">YZ Tespit Aşımı</div>
          </div>
          <div className="p-6 rounded-[24px] bg-white/[0.02] border border-white/5 backdrop-blur-xl text-center hover:border-amber-500/20 transition-all">
            <div className="text-2xl lg:text-3xl font-black text-white tracking-tight mb-1">&lt; 2.1 sn</div>
            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-400">Analiz &amp; Sentaks Hızı</div>
          </div>
          <div className="p-6 rounded-[24px] bg-white/[0.02] border border-white/5 backdrop-blur-xl text-center hover:border-purple-500/20 transition-all">
            <div className="text-2xl lg:text-3xl font-black text-white tracking-tight mb-1">15+</div>
            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-purple-400">Üniversitede Kullanım</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 lg:py-40 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 lg:mb-24">
            <h2 className="text-3xl lg:text-5xl font-black tracking-tight mb-4 lg:mb-6 uppercase">Sizi Nasıl Destekliyor?</h2>
            <p className="text-gray-500 font-bold uppercase tracking-[0.3em] text-[9px] lg:text-[10px]">Dört Profesyonel Özellik, Tek Bir Amaç: Doğallık.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-10">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={i}
                  whileHover={{ y: -15 }}
                  className="group p-8 lg:p-10 rounded-[32px] lg:rounded-[48px] bg-white/[0.02] border border-white/5 hover:border-emerald-500/20 transition-all premium-card"
                >
                  <div className={cn("w-14 lg:w-16 h-14 lg:h-16 rounded-2xl flex items-center justify-center mb-6 lg:mb-8 transition-all group-hover:scale-110", feature.bgColor)}>
                    <Icon className={cn("w-7 lg:w-8 h-7 lg:h-8", feature.color)} />
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl lg:text-2xl font-bold text-white">{feature.name}</h3>
                  </div>
                  <div className="text-[9px] lg:text-[10px] font-black uppercase text-emerald-500 mb-4 lg:mb-6 tracking-[0.2em]">{feature.role}</div>
                  <p className="text-xs lg:text-sm text-gray-500 leading-relaxed font-medium">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 lg:py-32 px-6 relative border-t border-white/5 bg-black/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 lg:mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-[0.25em] mb-4">
              3 Basit Adım
            </div>
            <h2 className="text-3xl lg:text-5xl font-black tracking-tight mb-4 uppercase">Nasıl Çalışır?</h2>
            <p className="text-gray-500 font-bold uppercase tracking-[0.3em] text-[9px] lg:text-[10px]">
              Ham Yapay Zeka Metninden Kusursuz Akademik Çıktıya
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="p-8 lg:p-10 rounded-[32px] bg-white/[0.02] border border-white/5 hover:border-blue-500/20 transition-all flex flex-col relative group">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-black text-lg mb-6">
                1
              </div>
              <h3 className="text-xl font-bold mb-3">Metni Yapıştırın veya Yükleyin</h3>
              <p className="text-xs lg:text-sm text-gray-400 leading-relaxed font-medium mb-6 flex-1">
                Akademik çalışmanızı editöre aktarın. YZ tespiti özelliği anında cümle bazlı ısı haritası ve YZ olasılık skorlarını haritalandırır.
              </p>
              <div className="pt-4 border-t border-white/5 text-[9px] font-black uppercase tracking-widest text-blue-400 flex items-center gap-2">
                <Search className="w-3.5 h-3.5" /> Anında Risk Analizi
              </div>
            </div>

            <div className="p-8 lg:p-10 rounded-[32px] bg-white/[0.02] border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.05)] transition-all flex flex-col relative group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-black text-lg mb-6">
                2
              </div>
              <h3 className="text-xl font-bold mb-3">Özellikleri Kullanın</h3>
              <p className="text-xs lg:text-sm text-gray-400 leading-relaxed font-medium mb-6 flex-1">
                İnsanlaştırma, intihal kontrolü ve format desteği devreye girer. Perplexity ve Burstiness değerleri insan standartlarına uyarlanır, akademik kaynaklar korunur.
              </p>
              <div className="pt-4 border-t border-white/5 text-[9px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" /> Doğal Sentaks Dokuma
              </div>
            </div>

            <div className="p-8 lg:p-10 rounded-[32px] bg-white/[0.02] border border-white/5 hover:border-purple-500/20 transition-all flex flex-col relative group">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-black text-lg mb-6">
                3
              </div>
              <h3 className="text-xl font-bold mb-3">Doğrulanmış Çıktıyı İndirin</h3>
              <p className="text-xs lg:text-sm text-gray-400 leading-relaxed font-medium mb-6 flex-1">
                Turnitin ve iThenticate filtrelerini güvenle aşan, sıfır yapaylık izine sahip belgenizi Word veya PDF olarak anında teslim alın.
              </p>
              <div className="pt-4 border-t border-white/5 text-[9px] font-black uppercase tracking-widest text-purple-400 flex items-center gap-2">
                <FileCheck className="w-3.5 h-3.5" /> Turnitin &amp; iThenticate Onaylı
              </div>
            </div>
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

                    <button onClick={() => onGetStarted()} className="px-8 lg:px-10 py-3 lg:py-4 bg-white text-black rounded-2xl font-black text-[9px] lg:text-[10px] uppercase tracking-[0.2em] hover:bg-emerald-400 transition-all flex items-center gap-3 mx-auto shadow-xl shadow-white/5">
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

          {/* Interactive Before/After Hayalet Yazar Showcase */}
          <div className="mt-16 glass-panel p-6 lg:p-12 rounded-[32px] lg:rounded-[48px] border border-emerald-500/20 relative overflow-hidden shadow-2xl bg-black/40">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-8 pb-6 border-b border-white/5">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h3 className="text-2xl font-black tracking-tight uppercase">Hayalet Yazar Önizlemesi</h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-widest">
                    Canlı Karşılaştırma
                  </span>
                </div>
                <p className="text-xs lg:text-sm text-gray-400 max-w-2xl font-medium">
                  Yapay zeka dedektörlerinin yakaladığı tekdüze kalıpların doğal akademik sentaksa nasıl dönüştüğünü inceleyin.
                </p>
              </div>

              {/* View Mode Switcher */}
              <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-white/5 border border-white/10 shrink-0">
                <button
                  onClick={() => setCompareMode('split')}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                    compareMode === 'split' ? "bg-emerald-500 text-black shadow-lg" : "text-gray-400 hover:text-white"
                  )}
                >
                  Yan Yana
                </button>
                <button
                  onClick={() => setCompareMode('before')}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                    compareMode === 'before' ? "bg-red-500 text-white shadow-lg" : "text-gray-400 hover:text-white"
                  )}
                >
                  Ham YZ (%96)
                </button>
                <button
                  onClick={() => setCompareMode('after')}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                    compareMode === 'after' ? "bg-emerald-500 text-black shadow-lg" : "text-gray-400 hover:text-white"
                  )}
                >
                  SENTIENCE (%3)
                </button>
              </div>
            </div>

            {/* Comparison Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              {/* Before Card */}
              {(compareMode === 'split' || compareMode === 'before') && (
                <div className={cn("p-6 lg:p-8 rounded-[28px] bg-red-950/10 border border-red-500/20 flex flex-col justify-between", compareMode === 'before' && "lg:col-span-2")}>
                  <div>
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-red-500/20">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-xs font-black uppercase tracking-widest text-red-400">Ham YZ Çıktısı</span>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-black tracking-widest">
                        %96 YZ İZİ (RİSKLİ)
                      </span>
                    </div>

                    <div className="text-xs lg:text-sm text-gray-300 leading-relaxed space-y-3 font-mono mb-6">
                      <p className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                        <span className="text-red-400 font-bold underline decoration-red-500/40">Yapay zeka teknolojileri modern dünyada</span> giderek daha kritik bir rol oynamaktadır.
                      </p>
                      <p className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                        <span className="text-red-400 font-bold underline decoration-red-500/40">Bu bağlamda,</span> teknolojinin gelişimi akademik araştırmalar üzerinde derin etkiler yaratmaktadır.
                      </p>
                      <p className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                        <span className="text-red-400 font-bold underline decoration-red-500/40">Sonuç olarak,</span> araştırmacıların bu araçları benimsemesi büyük önem taşımaktadır.
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-red-500/20 grid grid-cols-3 gap-2 text-center text-[9px] font-bold text-gray-400 uppercase">
                    <div className="p-2 rounded-xl bg-black/40">
                      <div className="text-red-400 font-black">18.2</div>
                      <div className="text-[8px] text-gray-500">Perplexity (Düşük)</div>
                    </div>
                    <div className="p-2 rounded-xl bg-black/40">
                      <div className="text-red-400 font-black">%12</div>
                      <div className="text-[8px] text-gray-500">Burstiness (Monoton)</div>
                    </div>
                    <div className="p-2 rounded-xl bg-black/40">
                      <div className="text-red-400 font-black">Yüksek</div>
                      <div className="text-[8px] text-gray-500">Turnitin Riski</div>
                    </div>
                  </div>
                </div>
              )}

              {/* After Card */}
              {(compareMode === 'split' || compareMode === 'after') && (
                <div className={cn("p-6 lg:p-8 rounded-[28px] bg-emerald-950/10 border border-emerald-500/30 flex flex-col justify-between shadow-[0_0_30px_rgba(16,185,129,0.05)]", compareMode === 'after' && "lg:col-span-2")}>
                  <div>
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-emerald-500/20">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs font-black uppercase tracking-widest text-emerald-400">SENTIENCE İnsanlaştırma</span>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black tracking-widest flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> %3 YZ İZİ (GÜVENLİ)
                      </span>
                    </div>

                    <div className="text-xs lg:text-sm text-gray-200 leading-relaxed space-y-3 font-sans mb-6">
                      <p className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        Çağdaş bilimsel araştırmaların metodolojik tabanında algoritmik sistemlerin sağladığı derinlik, veri işleme kapasitesini kökten dönüştürmektedir.
                      </p>
                      <p className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        Nitekim ampirik bulguların sentezlenmesinde sunulan analitik hız, hipotez testlerinin güvenilirlik eşiğini belirgin biçimde yükseltmektedir.
                      </p>
                      <p className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        Söz konusu pedagojik ve metodolojik uyum, yalnızca zamansal tasarruf sağlamakla kalmayıp akademik çıktının niteliğini de doğrudan güçlendirir.
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-emerald-500/20 grid grid-cols-3 gap-2 text-center text-[9px] font-bold text-gray-400 uppercase">
                    <div className="p-2 rounded-xl bg-black/40">
                      <div className="text-emerald-400 font-black">84.6</div>
                      <div className="text-[8px] text-gray-500">Perplexity (İnsansı)</div>
                    </div>
                    <div className="p-2 rounded-xl bg-black/40">
                      <div className="text-emerald-400 font-black">%88</div>
                      <div className="text-[8px] text-gray-500">Burstiness (Doğal)</div>
                    </div>
                    <div className="p-2 rounded-xl bg-black/40">
                      <div className="text-emerald-400 font-black">%0</div>
                      <div className="text-[8px] text-gray-500">Turnitin Alarmı</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-xs text-gray-400 font-medium">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Format, tablo ve atıf bütünlüğünü bozmadan Turnitin &amp; iThenticate onaylı teslim.</span>
              </div>
              <button
                onClick={() => onGetStarted()}
                className="w-full sm:w-auto px-8 py-4 bg-emerald-500 text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-400 transition-all flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/20 active:scale-95 shrink-0"
              >
                Hemen Başla <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* User Manual Section */}
      <UserManualSection />

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
                  <span className="text-4xl lg:text-5xl font-black">{plan.price}₺</span>
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
                  onClick={() => onGetStarted()}
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
              <span className="text-xl font-black tracking-tighter"><span lang="en">SENTIENCE</span></span>
            </div>
            <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest text-center md:text-left">© 2026 Tüm Hakları Saklıdır.</p>
          </div>
          <div className="flex items-center gap-8">
            <a href="https://sentience.ai" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-white transition-colors">
              <Globe className="w-5 h-5" />
            </a>
            <a href="https://github.com/sentience-ai" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-white transition-colors">
              <Github className="w-5 h-5" />
            </a>
            <a href="https://twitter.com/sentience_ai" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-white transition-colors">
              <Twitter className="w-5 h-5" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
