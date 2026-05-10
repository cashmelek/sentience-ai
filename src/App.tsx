import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Zap,
  ShieldCheck,
  Gauge,
  Trash2,
  Copy,
  Check,
  Sparkles,
  Search,
  Settings2,
  AlertCircle,
  Clock,
  ChevronRight,
  LogOut,
  Fingerprint,
  Save,
  Download,
  Layers,
  Highlighter,
  X,
  Mail,
  Lock,
  Github,
  Twitter,
  ArrowRight,
  BarChart3,
  FileText,
  User as UserIcon,
  Crown,
  Database,
  RefreshCw,
  History,
  ChevronDown,
  MessageSquarePlus,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
  setDoc,
  getDocs
} from 'firebase/firestore';
import {
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  TwitterAuthProvider,
  onAuthStateChanged,
  signOut,
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { db, auth } from './lib/firebase';
import {
  analyzeAndHumanize,
  HumanizeOptions,
  AnalysisResult,
  checkGrammar,
  GrammarSuggestion,
  detectAI
} from './services/geminiService';
import {
  performDeepMLAnalysis,
  MLAnalysisResult,
  sendAnonymousFeedback
} from './services/mlService';
import { cn } from './lib/utils';
import ReactMarkdown from 'react-markdown';
import { saveAs } from 'file-saver';
import { PlansModal } from './components/PlansModal';
import { AdminPanel } from './components/AdminPanel';
import toast, { Toaster } from 'react-hot-toast';
import { CustomToneModal } from './components/CustomToneModal';
import { GuideModal } from './components/GuideModal';
import { OnboardingChecklist } from './components/OnboardingChecklist';
import { LandingPage } from './components/LandingPage';

import { AppUser, PLAN_LIMITS, Project } from './types';

const STANDARD_TONES = [
  'Profesyonel',
  'Sohbet Vari',
  'Resmi',
  'Samimi',
  'Akademik',
  'Yaratıcı',
  'Heyecanlı'
];

export default function App() {
  // Auth & User State
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // UI State
  const [view, setView] = useState<'landing' | 'login'>('landing');
  const [activeTab, setActiveTab] = useState<'editor' | 'drafts' | 'history' | 'admin' | 'plans'>('editor');
  const [sidebarTab, setSidebarTab] = useState<'history' | 'drafts'>('history');
  const [showPlansModal, setShowPlansModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showCustomToneModal, setShowCustomToneModal] = useState(false);
  const [isToneDropdownOpen, setIsToneDropdownOpen] = useState(false);
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // App Logic State
  const [inputText, setInputText] = useState('');
  const [humanizedText, setHumanizedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [options, setOptions] = useState<HumanizeOptions>({ tone: 'Profesyonel', intensity: 80 });
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [mlAnalysis, setMlAnalysis] = useState<MLAnalysisResult | null>(null);
  const [grammarSuggestions, setGrammarSuggestions] = useState<GrammarSuggestion[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [copied, setCopied] = useState(false);
  const [realtimeScore, setRealtimeScore] = useState<number | null>(null);

  const isAdmin = user?.email?.toLowerCase() === 'ismail.kaleci@gmail.com';

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Highlighted Text Logic (Must be above early returns to respect Hook rules)
  const highlightedText = React.useMemo(() => {
    if (!grammarSuggestions.length) return inputText;
    const highlights = new Array(inputText.length).fill(false);
    grammarSuggestions.forEach(s => {
      const escaped = s.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'g');
      let match;
      while ((match = regex.exec(inputText)) !== null) {
        for (let j = match.index; j < match.index + s.original.length; j++) {
          highlights[j] = true;
        }
      }
    });
    return inputText.split('').map((char, i) => (
      <span key={i} className={highlights[i] ? "bg-yellow-500/30 border-b border-yellow-500" : ""} >
        {char}
      </span>
    ));
  }, [inputText, grammarSuggestions]);

  // --- Scroll Synchronization ---
  const handleScroll = () => {
    if (textareaRef.current && backdropRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop;
      backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  // Authentication Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Sync AppUser with Firestore
  useEffect(() => {
    if (!user) {
      setAppUser(null);
      return;
    }

    const userRef = doc(db, 'users', user.uid);
    const today = new Date().toISOString().split('T')[0];

    const unsubscribe = onSnapshot(userRef, async (docSnap) => {
      if (!docSnap.exists()) {
        const newUser: AppUser = {
          uid: user.uid,
          email: user.email,
          role: isAdmin ? 'admin' : 'user',
          plan: 'free',
          dailyUsage: 0,
          lastResetDate: today,
          onboarding: {
            profileComplete: true,
            firstHumanize: false,
            firstAnalysis: false,
            firstDraft: false,
            dismissed: false
          }
        };
        await setDoc(userRef, newUser);
      } else {
        const data = docSnap.data() as any;
        if (data.lastResetDate !== today) {
          await updateDoc(userRef, { dailyUsage: 0, lastResetDate: today });
        } else {
          setAppUser({
            ...data,
            onboarding: data.onboarding || {
              profileComplete: true,
              firstHumanize: false,
              firstAnalysis: false,
              firstDraft: false,
              dismissed: false
            }
          } as AppUser);
        }
      }
    });

    return () => unsubscribe();
  }, [user, isAdmin]);

  // Load Projects
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'projects'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project)));
    });
    return () => unsubscribe();
  }, [user]);

  // Real-time AI Score (Simplified)
  useEffect(() => {
    if (!inputText.trim() || inputText.length < 50) {
      setRealtimeScore(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        if (activeTab === 'editor') {
          const res = await detectAI(inputText);
          setRealtimeScore(res.score);
        }
      } catch (err) { console.error(err); }
    }, 5000);
    return () => clearTimeout(timer);
  }, [inputText, activeTab]);

  // Actions
  const handleSocialLogin = async (providerName: 'google' | 'github' | 'twitter') => {
    let provider;
    if (providerName === 'google') provider = new GoogleAuthProvider();
    else if (providerName === 'github') provider = new GithubAuthProvider();
    else provider = new TwitterAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast.success("Giriş yapıldı");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isLoginView) {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success("Giriş yapıldı");
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        toast.success("Kayıt başarılı");
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleHumanize = async () => {
    if (!inputText.trim() || !user || !appUser) {
      toast.error("Lütfen bir metin girin.");
      return;
    }

    const limitCount = PLAN_LIMITS[appUser.plan] || 10;
    if (!isAdmin && appUser.dailyUsage >= limitCount) {
      setShowPlansModal(true);
      return;
    }

    setIsProcessing(true);
    try {
      const result = await analyzeAndHumanize(inputText, options);
      setHumanizedText(result.humanizedText);
      setAnalysis(result);

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { 
        dailyUsage: (appUser.dailyUsage || 0) + 1,
        'onboarding.firstHumanize': true
      });

      await sendAnonymousFeedback(inputText.length, result.humanizedText.length, result.aiScore, options.tone);

      await addDoc(collection(db, 'projects'), {
        userId: user.uid,
        title: inputText.slice(0, 30) + '...',
        originalText: inputText,
        humanizedText: result.humanizedText,
        tone: options.tone,
        intensity: options.intensity,
        aiScore: result.aiScore,
        plagiarismScore: result.similarityScore,
        isDraft: false,
        insights: result.insights,
        createdAt: serverTimestamp(),
        sources: result.sources || []
      });

      toast.success("Metin dönüştürüldü");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAnalyze = async () => {
    if (!inputText.trim() || !user) {
      toast.error("Lütfen analiz için bir metin girin.");
      return;
    }

    setIsAnalyzing(true);
    try {
      const [suggestions, deepML] = await Promise.all([
        checkGrammar(inputText),
        performDeepMLAnalysis(inputText)
      ]);

      setGrammarSuggestions(suggestions);
      setMlAnalysis(deepML);

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { 'onboarding.firstAnalysis': true });

      toast.success(suggestions.length === 0 ? "Dilbilgisi hatası bulunamadı." : `${suggestions.length} öneri bulundu.`);
    } catch (error: any) {
      toast.error("Analiz hatası.");
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const downloadTrainingData = async () => {
    if (!isAdmin) return;
    try {
      const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      saveAs(blob, `training_data.json`);
      toast.success("Eğitim verisi indirildi");
    } catch (error) {
      toast.error("İndirme hatası");
    }
  };

  const saveDraft = async () => {
    if (!inputText.trim() || !user) return;
    setIsDrafting(true);
    try {
      await addDoc(collection(db, 'projects'), {
        userId: user.uid,
        title: `[TASLAK] ${inputText.slice(0, 20)}...`,
        originalText: inputText,
        humanizedText: '',
        isDraft: true,
        createdAt: serverTimestamp()
      });
      
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { 'onboarding.firstDraft': true });
      
      toast.success("Taslak kaydedildi.");
    } catch (err) { console.error(err); }
    finally { setIsDrafting(false); }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Panoya kopyalandı");
    setTimeout(() => setCopied(false), 2000);
  };

  const applyGrammarCorrection = (suggestion: GrammarSuggestion) => {
    const newText = inputText.replace(suggestion.original, suggestion.suggestion);
    setInputText(newText);
    setGrammarSuggestions(prev => prev.filter(s => s.original !== suggestion.original));
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <AnimatePresence mode="wait">
        {view === 'landing' ? (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <LandingPage 
              onGetStarted={() => setView('login')} 
              onLogin={() => setView('login')} 
            />
          </motion.div>
        ) : (
          <motion.div 
            key="login"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="min-h-screen grid place-items-center bg-mesh p-4 font-sans relative"
          >
            <div className="max-w-[420px] w-full login-card p-10 rounded-[32px] border border-white/10 shadow-2xl relative z-10">
              <div className="flex justify-between items-start mb-6">
                <Fingerprint className="w-12 h-12 text-emerald-500" />
                <button 
                  onClick={() => setView('landing')}
                  className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-gray-400 hover:bg-white/10 transition-all"
                >
                  <ArrowRight className="w-3 h-3 rotate-180" /> Ana Sayfaya Dön
                </button>
              </div>
              <h1 className="text-2xl font-black text-white text-center mb-8">Sentience AI</h1>
              <button onClick={() => handleSocialLogin('google')} className="w-full flex items-center justify-center gap-4 px-6 py-3 bg-white text-black font-bold rounded-2xl hover:bg-gray-100 transition-all mb-6">
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                Google ile Giriş Yap
              </button>
              <form onSubmit={handleEmailAuth} className="space-y-4">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-posta" className="input-premium w-full" required />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Şifre" className="input-premium w-full" required />
                <button type="submit" className="w-full btn-premium bg-emerald-500 text-black py-4 rounded-2xl font-bold">{isLoginView ? 'Giriş Yap' : 'Kayıt Ol'}</button>
              </form>
              <p className="text-center mt-6 text-gray-500 text-sm">
                {isLoginView ? 'Hesabınız yok mu?' : 'Zaten bir hesabınız var mı?'}
                <button onClick={() => setIsLoginView(!isLoginView)} className="ml-2 text-white font-bold underline">Hemen {isLoginView ? 'Kayıt Ol' : 'Giriş Yap'}</button>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  const drafts = (projects || []).filter(p => p.isDraft);
  const historyItems = (projects || []).filter(p => !p.isDraft);

  return (
    <div className="flex h-screen bg-brand-bg text-white font-sans overflow-hidden">
      <Toaster position="bottom-right" />

      {/* Sidebar */}
      <aside className="w-80 border-r border-brand-border bg-brand-card flex flex-col z-20">
        <div className="p-6 border-b border-brand-border flex items-center justify-between">
          <div className="flex items-center gap-2 font-black tracking-tighter text-xl text-emerald-500">
            <Fingerprint className="w-6 h-6" /> SENTIENCE
          </div>
          <div className="flex items-center">
            <button
              onClick={() => setShowGuideModal(true)}
              className="p-1.5 hover:bg-white/5 rounded-lg border border-white/5 text-gray-500 hover:text-emerald-500 transition-colors mr-2"
              title="Kullanım Kılavuzu"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            <button onClick={() => { setInputText(''); setHumanizedText(''); setAnalysis(null); setGrammarSuggestions([]); setActiveTab('editor'); }} className="p-1.5 hover:bg-white/5 rounded-lg border border-white/5">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {appUser && <OnboardingChecklist user={appUser} />}

        {/* Sidebar Tabs */}
        <div className="px-4 py-3 flex gap-2 border-b border-brand-border bg-black/10">
          <button
            onClick={() => setSidebarTab('history')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              sidebarTab === 'history' ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "text-gray-600 hover:text-gray-400"
            )}
          >
            <History className="w-3 h-3" />
            Geçmiş
          </button>
          <button
            onClick={() => setSidebarTab('drafts')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              sidebarTab === 'drafts' ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "text-gray-600 hover:text-gray-400"
            )}
          >
            <Save className="w-3 h-3" />
            Taslaklar ({drafts.length})
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
          {(sidebarTab === 'history' ? historyItems : drafts).length === 0 ? (
            <div className="p-4 text-center text-xs text-gray-600 italic">Henüz kayıt yok.</div>
          ) : (
            (sidebarTab === 'history' ? historyItems : drafts).map(p => (
              <motion.div
                layout
                key={p.id}
                onClick={() => {
                  setInputText(p.originalText);
                  setHumanizedText(p.humanizedText);
                  if (!p.isDraft) {
                    setAnalysis({
                      humanizedText: p.humanizedText,
                      aiScore: p.aiScore,
                      insights: p.insights || [],
                      isPlagiarized: (p.plagiarismScore || 0) > 20,
                      sources: p.sources || [],
                      similarityScore: p.plagiarismScore || 0
                    });
                  } else {
                    setAnalysis(null);
                  }
                  setActiveTab('editor');
                }}
                className="p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-all flex justify-between items-center group"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-400 truncate w-40">{p.title}</span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteDoc(doc(db, 'projects', p.id)); }}
                  className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-500 transition-all p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-brand-border space-y-3 bg-black/20">
          {isAdmin && (
            <>
              <button onClick={() => setActiveTab('admin')} className="w-full py-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-500/20 transition-all">Admin Paneli</button>
              <button onClick={downloadTrainingData} className="w-full py-2.5 bg-blue-500/10 text-blue-400 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-500/20 transition-all flex items-center justify-center gap-2"><Database className="w-3 h-3" /> Veri İndir</button>
            </>
          )}
          <div className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-2xl border border-white/5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 flex-shrink-0"><UserIcon className="w-4 h-4 text-emerald-500" /></div>
            <div className="flex-1 truncate"><div className="text-[10px] font-bold truncate opacity-80">{user?.email}</div><div className="text-[9px] text-gray-600 font-black uppercase tracking-tighter">{appUser?.plan || 'Free'} Plan</div></div>
            <button onClick={() => signOut(auth)} className="p-1.5 hover:text-white text-gray-600 flex-shrink-0"><LogOut className="w-4 h-4" /></button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {activeTab === 'admin' && isAdmin ? (
          <div className="flex-1 overflow-y-auto custom-scrollbar relative z-30 bg-brand-bg">
            <header className="h-16 border-b border-brand-border px-8 flex items-center justify-between bg-brand-card/50 backdrop-blur-xl sticky top-0 z-40">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <h2 className="text-xl font-black text-white tracking-tighter uppercase">Yönetim Paneli</h2>
              </div>
              <button 
                onClick={() => setActiveTab('editor')}
                className="p-2.5 hover:bg-white/5 rounded-xl text-gray-500 hover:text-white transition-all border border-white/5 flex items-center gap-2 group"
              >
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Editöre Dön</span>
                <X className="w-5 h-5" />
              </button>
            </header>
            <div className="p-8">
              <AdminPanel />
            </div>
          </div>
        ) : (
          <>
            <header className="h-20 border-b border-brand-border px-8 flex items-center justify-between bg-brand-card/50 backdrop-blur-xl relative z-40">
              <div className="flex items-center gap-10">
                {/* Tone Selection */}
                <div className="relative">
                  <div className="flex items-center gap-2 mb-1">
                    <Settings2 className="w-3.5 h-3.5 text-gray-500" />
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">ÜST TON SEÇİMİ</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsToneDropdownOpen(!isToneDropdownOpen)}
                      className="flex items-center gap-2 text-xl font-black text-white hover:text-gray-300 transition-colors uppercase tracking-tight"
                    >
                      {options.tone}
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    </button>
                    <button
                      onClick={() => setShowCustomToneModal(true)}
                      className="p-1.5 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all"
                      title="Özel Ton Oluştur"
                    >
                      <MessageSquarePlus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Dropdown Menu */}
                  <AnimatePresence>
                    {isToneDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsToneDropdownOpen(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute top-full left-0 mt-4 w-56 bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
                        >
                          <div className="px-4 py-3 bg-white/5 border-b border-white/10">
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">STANDART TONLAR</span>
                          </div>
                          <div className="max-h-60 overflow-y-auto custom-scrollbar p-2 space-y-1">
                            {STANDARD_TONES.map(tone => (
                              <button
                                key={tone}
                                onClick={() => {
                                  setOptions({ ...options, tone, customToneDescription: undefined });
                                  setIsToneDropdownOpen(false);
                                }}
                                className={cn(
                                  "w-full text-left px-3 py-2 rounded-xl text-sm font-bold uppercase transition-all",
                                  options.tone === tone
                                    ? "bg-blue-600 text-white"
                                    : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                                )}
                              >
                                {tone}
                              </button>
                            ))}
                            {!STANDARD_TONES.includes(options.tone) && (
                              <button
                                onClick={() => setIsToneDropdownOpen(false)}
                                className="w-full text-left px-3 py-2 rounded-xl text-sm font-bold uppercase bg-blue-600 text-white transition-all"
                              >
                                {options.tone}
                              </button>
                            )}
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                <div className="w-px h-10 bg-white/10 mx-2" />

                {/* Intensity Selection */}
                <div className="w-72">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">RADİKAL İNSANLAŞTIRMA ({options.intensity}%)</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={options.intensity}
                    onChange={(e) => setOptions({ ...options, intensity: parseInt(e.target.value) })}
                    className="w-full h-1.5 accent-emerald-500 bg-white/10 rounded-full cursor-pointer"
                  />
                  <div className="mt-2 text-[9px] text-gray-500 uppercase font-bold leading-tight">
                    DERİN YAPISAL DEĞİŞİKLİKLER VE YOĞUN DİLBİLGSEL NÜANS.
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button onClick={() => setShowPlansModal(true)} className="flex items-center gap-2 px-4 py-1.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full text-[10px] font-bold uppercase tracking-widest"><Crown className="w-3 h-3" /> Yükselt</button>
                <button onClick={handleHumanize} disabled={isProcessing || !inputText.trim()} className="px-6 py-2 bg-emerald-500 text-black rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-emerald-400 shadow-lg disabled:opacity-50 transition-all flex items-center gap-2">{isProcessing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} İnsanileştir</button>
              </div>
            </header>

            <div className="flex-1 p-6 flex gap-6 overflow-hidden relative z-10">
              <div className="flex-1 flex flex-col gap-6 min-w-0 h-full">
                <div className="flex-1 glass-panel rounded-[24px] flex flex-col overflow-hidden">
                  <div className="px-4 py-2 border-b border-brand-border flex justify-between items-center bg-black/10">
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Giriş Metni</span>
                      {realtimeScore !== null && <div className="flex items-center gap-1.5"><div className="w-10 h-1 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-red-500" style={{ width: `${realtimeScore * 100}%` }} /></div><span className="text-[8px] text-gray-500">%{Math.round(realtimeScore * 100)} YZ</span></div>}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={saveDraft} disabled={isDrafting || !inputText.trim()} className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-bold text-gray-400 hover:bg-white/10 transition-all disabled:opacity-50">
                        {isDrafting ? <RefreshCw className="w-2.5 h-2.5 animate-spin" /> : <Save className="w-2.5 h-2.5" />} Taslak
                      </button>
                      <button onClick={handleAnalyze} disabled={isAnalyzing || !inputText.trim()} className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[9px] font-bold text-emerald-500 hover:bg-emerald-500/20 transition-all disabled:opacity-50">{isAnalyzing ? '...' : 'Analiz Et'}</button>
                    </div>
                  </div>
                  <div className="relative flex-1">
                    <textarea ref={textareaRef} value={inputText} onScroll={handleScroll} onChange={(e) => setInputText(e.target.value)} className="absolute inset-0 w-full h-full p-6 bg-transparent outline-none resize-none text-gray-300 leading-relaxed text-sm z-10 custom-scrollbar" placeholder="Metninizi buraya yapıştırın..." />
                    <div ref={backdropRef} className="absolute inset-0 w-full h-full p-6 text-sm leading-relaxed pointer-events-none whitespace-pre-wrap break-words text-transparent z-0 overflow-y-auto custom-scrollbar">
                      {highlightedText}
                    </div>
                  </div>
                </div>

                <div className="flex-1 glass-panel rounded-[24px] flex flex-col overflow-hidden">
                  <div className="px-4 py-2 border-b border-brand-border flex justify-between items-center bg-white/[0.02]">
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Sonuç</span>
                    <button onClick={() => copyToClipboard(humanizedText)} className="p-1.5 text-gray-500 hover:text-emerald-500 transition-colors"><Copy className="w-3.5 h-3.5" /></button>
                  </div>
                  <div className="flex-1 p-6 overflow-y-auto text-gray-300 leading-relaxed text-sm custom-scrollbar bg-emerald-500/[0.01]">
                    {isProcessing ? "Dönüştürülüyor..." : (
                      <div className="prose prose-invert max-w-none">
                        <ReactMarkdown>{humanizedText || "_Sonuç burada görünecek..._"}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="w-80 flex flex-col gap-6 shrink-0 overflow-y-auto custom-scrollbar pb-8">
                <div className="p-6 glass-panel rounded-[24px] space-y-6">
                  <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2"><Gauge className="w-4 h-4 text-emerald-500" /> Analitik Rapor</h3>
                  {analysis ? (
                    <div className="space-y-6">
                      <div className="text-center"><div className="text-4xl font-black text-emerald-500">%{Math.round((1 - (analysis.aiScore || 0)) * 100)}</div><div className="text-[10px] font-bold text-gray-500 uppercase mt-1">İnsan Benzerliği</div></div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl text-center"><div className="text-[8px] text-gray-600 font-bold uppercase mb-1">İntihal</div><div className="text-sm font-black text-red-400">%{analysis.similarityScore || 0}</div></div>
                        <div className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl text-center"><div className="text-[8px] text-gray-600 font-bold uppercase mb-1">YZ Skor</div><div className="text-sm font-black text-gray-400">{(analysis.aiScore || 0).toFixed(2)}</div></div>
                      </div>
                    </div>
                  ) : <div className="text-[10px] text-gray-600 italic text-center py-10">Veri bekleniyor...</div>}
                </div>

                {/* Sources Card (Plagiarism Details) */}
                {analysis?.sources && analysis.sources.length > 0 && (
                  <div className="p-6 glass-panel rounded-[24px] space-y-4 border border-red-500/10">
                    <h3 className="text-[10px] font-black text-red-400 uppercase tracking-widest flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" /> İntihal Tespiti
                    </h3>
                    <div className="space-y-3">
                      {analysis.sources.map((src, i) => (
                        <div key={i} className="bg-red-500/5 p-3 rounded-xl border border-red-500/10">
                          <div className="flex justify-between items-start gap-2 mb-1">
                            <div className="text-[10px] font-bold text-gray-300 truncate flex-1">{src.title}</div>
                            <div className="text-[10px] font-black text-red-400 shrink-0">%{src.similarity || 0}</div>
                          </div>
                          <a href={src.url} target="_blank" rel="noopener noreferrer" className="text-[9px] text-blue-400 hover:text-blue-300 hover:underline block mb-2 truncate">{src.url}</a>
                          <div className="text-[9px] text-gray-400 italic bg-black/20 p-2 rounded-lg border border-white/5">
                            "{src.matchedSnippet}"
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex-1 glass-panel rounded-[24px] p-6 flex flex-col gap-4 overflow-hidden min-h-[300px]">
                  <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2"><Search className="w-3 h-3 text-emerald-500" /> Detaylar</h3>
                  <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
                    {grammarSuggestions.length > 0 ? grammarSuggestions.map((s, i) => (
                      <div key={i} className="p-3 bg-red-500/5 rounded-xl border border-red-500/10 space-y-1">
                        <div className="text-[10px] font-bold text-emerald-400 cursor-pointer hover:underline" onClick={() => applyGrammarCorrection(s)}>➜ {s.suggestion}</div>
                        <div className="text-[9px] text-gray-600 line-through truncate">{s.original}</div>
                        <div className="text-[8px] text-gray-500 italic mt-1">{s.explanation}</div>
                      </div>
                    )) : analysis?.insights && analysis.insights.length > 0 ? (
                      analysis.insights.map((ins, i) => (
                        <div key={i} className="p-3 bg-white/[0.02] rounded-xl border-l-2 border-emerald-500/30 text-[10px] leading-relaxed">
                          <div className="text-emerald-500/60 mb-1">"{ins.sentence}"</div>
                          <div className="text-gray-500 italic">{ins.detail}</div>
                        </div>
                      ))
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center opacity-50 grayscale">
                        <Layers className="w-12 h-12 mb-4 text-emerald-500/20" />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Veri Bekleniyor</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      <AnimatePresence>
        {showPlansModal && appUser && <PlansModal user={appUser} onClose={() => setShowPlansModal(false)} />}
        {showGuideModal && <GuideModal onClose={() => setShowGuideModal(false)} />}
        {showCustomToneModal && (
          <CustomToneModal
            onClose={() => setShowCustomToneModal(false)}
            onApply={(tone) => {
              setOptions({ ...options, tone, customToneDescription: tone });
              setShowCustomToneModal(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
