import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  History,
  Zap,
  ShieldCheck,
  Gauge,
  Trash2,
  Copy,
  Check,
  MoreVertical,
  Sparkles,
  Search,
  Settings2,
  AlertCircle,
  Clock,
  ChevronRight,
  LogOut,
  User as UserIcon,
  Fingerprint,
  Save,
  BookOpen,
  FileSearch,
  Highlighter,
  Download,
  Terminal,
  Layers,
  ExternalLink,
  MessageSquarePlus,
  X,
  Mail,
  Lock,
  Github,
  Twitter
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
  getDocs,
  updateDoc,
  getDoc,
  setDoc
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
import { analyzeAndHumanize, detectAI, HumanizeOptions, AnalysisResult, checkGrammar, GrammarSuggestion, GrammarOptions } from './services/geminiService';
import { performDeepMLAnalysis, MLAnalysisResult } from './services/mlService';
import { cn } from './lib/utils';
import ReactMarkdown from 'react-markdown';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';
import { PlansModal } from './components/PlansModal';
import { AdminPanel } from './components/AdminPanel';
import toast, { Toaster } from 'react-hot-toast';

import { SubscriptionPlan, AppUser, PLAN_LIMITS, CustomTone, Project } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [customTones, setCustomTones] = useState<CustomTone[]>([]);
  const [inputText, setInputText] = useState('');
  const [humanizedText, setHumanizedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCheckingRT, setIsCheckingRT] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<'editor' | 'drafts' | 'history' | 'admin' | 'plans'>('editor');
  const [options, setOptions] = useState<HumanizeOptions>({ tone: 'Profesyonel', intensity: 80 });
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [mlAnalysis, setMlAnalysis] = useState<MLAnalysisResult | null>(null);
  const [grammarSuggestions, setGrammarSuggestions] = useState<GrammarSuggestion[]>([]);
  const [realtimeScore, setRealtimeScore] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState('');
  const [showCustomToneModal, setShowCustomToneModal] = useState(false);
  const [showGrammarPrefsModal, setShowGrammarPrefsModal] = useState(false);
  const [grammarPrefs, setGrammarPrefs] = useState<GrammarOptions>({ prioritize: [], ignore: [] });
  const [appliedCorrections, setAppliedCorrections] = useState<{ newText: string; oldText: string }[]>([]);
  const [newTone, setNewTone] = useState({ name: '', description: '' });
  const [activeSuggestion, setActiveSuggestion] = useState<GrammarSuggestion | null>(null);
  const [suggestionPos, setSuggestionPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [aiSettings, setAiSettings] = useState({ sensitivity: 0.1, enabled: true });
  const [showAiSettingsModal, setShowAiSettingsModal] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState<{ type: 'Dilbilgisi' | 'YZ' | 'Hepsi'; active: boolean }>({ type: 'Hepsi', active: false });
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [showPlansModal, setShowPlansModal] = useState(false);
  const [isShowingSummary, setIsShowingSummary] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginView, setIsLoginView] = useState(true);
  const [rememberMe, setRememberMe] = useState(false);
  const [systemSettings, setSystemSettings] = useState({ 
    maintenanceMode: false, 
    maintenanceMessage: '',
    defaultIntensity: 80 
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // --- Kaydırma Senkronizasyonu ---
  const handleScroll = () => {
    if (textareaRef.current && backdropRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop;
      backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  // --- Kimlik Doğrulama & Senkronizasyon ---
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  // --- Sistem Ayarları Senkronizasyonu ---
  useEffect(() => {
    const unsubSettings = onSnapshot(doc(db, 'settings', 'system'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSystemSettings({
          maintenanceMode: data.maintenanceMode || false,
          maintenanceMessage: data.maintenanceMessage || '',
          defaultIntensity: data.defaultIntensity || 80
        });
      }
    });
    return () => unsubSettings();
  }, []);

  // --- Kullanıcı Bilgisi (AppUser) Senkronizasyonu ---
  useEffect(() => {
    if (!user) {
      setAppUser(null);
      return;
    }

    const userRef = doc(db, 'users', user.uid);
    const today = new Date().toISOString().split('T')[0];

    const unsubscribe = onSnapshot(userRef, async (docSnap) => {
      const isEmailAdmin = user.email?.toLowerCase() === 'ismail.kaleci@gmail.com';
      
      if (!docSnap.exists()) {
        const newUser: AppUser = {
          uid: user.uid,
          email: user.email,
          role: isEmailAdmin ? 'admin' : 'user',
          plan: 'free',
          dailyUsage: 0,
          lastResetDate: today
        };
        await setDoc(userRef, newUser);
      } else {
        const data = docSnap.data() as AppUser;
        
        // Admin yetkisi e-postaya göre zorunlu tutuluyor
        if (isEmailAdmin && data.role !== 'admin') {
          await updateDoc(userRef, { role: 'admin' });
          setAppUser({ ...data, role: 'admin', lastResetDate: data.lastResetDate === today ? today : data.lastResetDate });
        } else if (data.lastResetDate !== today) {
          const resetData = {
            dailyUsage: 0,
            lastResetDate: today,
            role: isEmailAdmin ? 'admin' : data.role
          };
          await updateDoc(userRef, resetData);
        } else {
          setAppUser(data);
        }
      }
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const qProjects = query(
      collection(db, 'projects'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubProjects = onSnapshot(qProjects, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
      setProjects(data);
    });

    const qTones = query(
      collection(db, 'customTones'),
      where('userId', '==', user.uid)
    );
    const unsubTones = onSnapshot(qTones, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CustomTone));
      setCustomTones(data);
    });

    return () => {
      unsubProjects();
      unsubTones();
    };
  }, [user]);

  // --- Gerçek Zamanlı YZ & Dilbilgisi Tespiti (Geciktirilmiş) ---
  useEffect(() => {
    if (!inputText.trim() || inputText.length < 50) {
      setRealtimeScore(null);
      setGrammarSuggestions([]);
      setLastCheckTime(null);
      setQuotaExceeded(false);
      return;
    }

    setCheckingStatus({ type: 'Hepsi', active: true });
    const timer = setTimeout(async () => {
      try {
        const promises: Promise<any>[] = [];
        if (aiSettings.enabled) promises.push(detectAI(inputText));
        promises.push(checkGrammar(inputText, grammarPrefs));

        const results = await Promise.all(promises);

        let detection;
        let grammar;
        if (aiSettings.enabled) {
          detection = results[0];
          grammar = results[1];
          setRealtimeScore(detection.score > aiSettings.sensitivity ? detection.score : 0);
          setGrammarSuggestions(grammar);
        } else {
          grammar = results[0];
          setGrammarSuggestions(grammar);
        }

        setLastCheckTime(new Date());
        setQuotaExceeded(false);
      } catch (err: any) {
        if (err?.message?.includes('429') || err?.message?.includes('RESOURCE_EXHAUSTED')) {
          setQuotaExceeded(true);
        }
        console.error("Gerçek zamanlı izleme hatası", err);
      } finally {
        setCheckingStatus({ type: 'Hepsi', active: false });
      }
    }, 2000); // Gecikme süresi optimize edildi

    return () => {
      clearTimeout(timer);
    };
  }, [inputText, aiSettings.enabled, aiSettings.sensitivity]);

  const handleSocialLogin = async (providerName: 'google' | 'github' | 'twitter') => {
    let provider;
    if (providerName === 'google') provider = new GoogleAuthProvider();
    else if (providerName === 'github') provider = new GithubAuthProvider();
    else provider = new TwitterAuthProvider();

    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error(`${providerName} girişi başarısız`, error);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    try {
      if (isLoginView) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (error: any) {
      console.error('Kimlik doğrulama hatası', error);
      alert(`Hata: ${error.message}`);
    }
  };

  const handleLogout = () => signOut(auth);

  const handleHumanize = async () => {
    if (!inputText.trim() || !user || !appUser) return;
    
    const limit = PLAN_LIMITS[appUser.plan] || 10;
    if (appUser.role !== 'admin' && appUser.dailyUsage >= limit) {
      alert("Günlük kullanım kotanızı doldurdunuz. Lütfen planınızı yükseltin veya yarın tekrar deneyin.");
      setShowPlansModal(true);
      return;
    }

    setIsProcessing(true);
    setIsShowingSummary(false);
    try {
      const customToneData = customTones.find(t => t.name === options.tone);
      const opt = { ...options, customToneDescription: customToneData?.description };

      const result = await analyzeAndHumanize(inputText, opt);

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { dailyUsage: appUser.dailyUsage + 1 });
      setAppUser({...appUser, dailyUsage: appUser.dailyUsage + 1});

      setHumanizedText(result.humanizedText);
      setAnalysis(result);

      await addDoc(collection(db, 'projects'), {
        userId: user.uid,
        title: inputText.slice(0, 30) + '...',
        originalText: inputText,
        humanizedText: result.humanizedText,
        tone: options.tone,
        intensity: options.intensity,
        aiScore: result.aiScore,
        plagiarismScore: result.similarityScore,
        sources: result.sources || [],
        isDraft: false,
        insights: result.insights,
        createdAt: serverTimestamp()
      });
    } catch (error: any) {
      console.error('İnsanileştirme başarısız', error);
      alert(`İnsanileştirme başarısız: ${error.message || 'Hata oluştu'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const createCustomTone = async () => {
    if (!user || !newTone.name || !newTone.description) return;
    try {
      await addDoc(collection(db, 'customTones'), {
        userId: user.uid,
        ...newTone
      });
      setOptions({ ...options, tone: newTone.name });
      setShowCustomToneModal(false);
      setNewTone({ name: '', description: '' });
    } catch (err) {
      console.error(err);
    }
  };

  const exportTxt = () => {
    const blob = new Blob([humanizedText], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, 'sentience-cikti.txt');
  };

  const exportDocx = async () => {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: "Sentience AI - İnsanileştirilmiş Sonuç", bold: true, size: 32 }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: humanizedText, size: 24 }),
            ],
          }),
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, 'sentience-cikti.docx');
  };

  const getIntensityFeedback = (val: number) => {
    if (val < 30) return { label: 'Doğal İyileştirme', desc: 'Minimal değişiklik, akıcılık odaklı.' };
    if (val < 70) return { label: 'Dengeli Dönüşüm', desc: 'Sentaks varyasyonu ve orta düzey yeniden yazım.' };
    return { label: 'Radikal İnsanlaştırma', desc: 'Derin yapısal değişiklikler ve yoğun dilbilgsel nüans.' };
  };

  const handleGrammarCheck = async () => {
    if (!inputText.trim()) return;
    setCheckingStatus({ type: 'Dilbilgisi', active: true });
    try {
      const suggestions = await checkGrammar(inputText, grammarPrefs);
      setGrammarSuggestions(suggestions);
      setLastCheckTime(new Date());
    } catch (err: any) {
      console.error(err);
      alert("Yazım denetimi başarısız oldu.");
    } finally {
      setCheckingStatus({ type: 'Dilbilgisi', active: false });
    }
  };

  const saveDraft = async () => {
    if (!inputText.trim() || !user) {
      alert("Lütfen önce bir metin girin.");
      return;
    }
    setIsDrafting(true);
    try {
      await addDoc(collection(db, 'projects'), {
        userId: user.uid,
        title: `[TASLAK] ${inputText.slice(0, 20)}...`,
        originalText: inputText,
        humanizedText: '',
        tone: options.tone,
        intensity: options.intensity,
        aiScore: 0,
        plagiarismScore: 0,
        sources: [],
        isDraft: true,
        insights: [],
        createdAt: serverTimestamp()
      });
      alert("Taslak başarıyla kaydedildi.");
    } catch (err: any) {
      console.error(err);
      alert(`Taslak kaydedilemedi: ${err.message}`);
    } finally {
      setIsDrafting(false);
    }
  };

  const applySuggestion = (suggestion: GrammarSuggestion) => {
    const newText = inputText.replace(suggestion.original, suggestion.suggestion);
    setAppliedCorrections(prev => [...prev, { newText: suggestion.suggestion, oldText: suggestion.original }]);
    setInputText(newText);
    setGrammarSuggestions(prev => prev.filter(s => s.original !== suggestion.original));
    setActiveSuggestion(null);
  };

  const handleSummarize = async () => {
    if (!inputText.trim()) return;
    setIsSummarizing(true);
    setIsShowingSummary(true);
    try {
      // Not: Normalde Genkit flow'u bir API üzerinden çağrılır. 
      // Burada altyapının hazır olduğunu simüle ediyoruz.
      const res = await analyzeAndHumanize(inputText, { tone: 'Özet', intensity: 50 });
      setHumanizedText(res.humanizedText);
      setSummary(res.humanizedText.slice(0, 200) + '...');
    } catch (err) {
      console.error(err);
      setIsShowingSummary(false);
    } finally {
      setIsSummarizing(false);
    }
  };

  const deleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, 'projects', id));
    } catch (error) {
      console.error('Silme başarısız', error);
    }
  };

  const clearAllData = async () => {
    if (!user || !window.confirm('Verilerinizi kalıcı olarak silmek istediğinizden emin misiniz?')) return;
    const q = query(collection(db, 'projects'), where('userId', '==', user.uid));
    const snapshot = await getDocs(q);
    snapshot.docs.forEach(async (d) => await deleteDoc(d.ref));
  };

  const exportTuningData = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'projects'), where('userId', '==', user.uid), where('isDraft', '==', false));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        alert("Eğitim için yeterli veri bulunamadı. Lütfen önce metinleri insanileştirip geçmiş oluşturun.");
        return;
      }

      let jsonlContent = '';
      snapshot.forEach((doc) => {
        const data = doc.data() as Project;
        // Google AI Studio (Gemini) tuning format:
        const entry = {
          messages: [
            { role: "user", content: `Metni insanlaştır (Ton: ${data.tone}, Yoğunluk: ${data.intensity}):\n\n${data.originalText}` },
            { role: "model", content: data.humanizedText }
          ]
        };
        jsonlContent += JSON.stringify(entry) + '\n';
      });

      const blob = new Blob([jsonlContent], { type: 'application/jsonl' });
      saveAs(blob, 'sentience_tuning_data.jsonl');
      alert("Eğitim verisi (JSONL) başarıyla indirildi. Bunu Google AI Studio'da model eğitmek (Tuned Model) için kullanabilirsiniz.");
    } catch (error) {
      console.error("Veri dışa aktarılırken hata oluştu", error);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(humanizedText);
    toast.success("Metin panoya kopyalandı!");
    setCopied(true);
  };
  const isAdmin = user?.email?.toLowerCase() === 'ismail.kaleci@gmail.com';


  if (!user) {
    return (
      <div className="min-h-screen grid place-items-center bg-mesh relative overflow-hidden p-4 font-sans selection:bg-emerald-500/30">
        {/* Dinamik Arkaplan Efektleri */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/20 rounded-full blur-[120px] animate-pulse-soft" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse-soft" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-[480px] w-full login-card rounded-[40px] p-10 md:p-12 relative z-10 border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)]"
        >
          {/* Üst Işıltı Efekti */}
          <div className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-[60%] h-[2px] bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
          
          {/* Logo Bölümü */}
          <div className="text-center space-y-6 mb-12">
            <div className="flex justify-center">
              <motion.div 
                whileHover={{ scale: 1.05, rotate: 5 }}
                className="w-24 h-24 bg-gradient-to-br from-emerald-500/20 to-blue-500/10 rounded-[32px] flex items-center justify-center border border-white/10 backdrop-blur-2xl shadow-[0_20px_40px_rgba(0,0,0,0.3)] group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <Fingerprint className="w-12 h-12 text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]" />
              </motion.div>
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl font-black tracking-tighter text-white">
                {isLoginView ? 'Tekrar Hoş Geldiniz' : 'Hesabınızı Oluşturun'}
              </h1>
              <p className="text-gray-400 text-base font-medium leading-relaxed max-w-[280px] mx-auto">
                {isLoginView 
                  ? 'Sentience AI ile metinlerinize hayat verin.' 
                  : 'Yapay zekayı insan yaratıcılığıyla buluşturun.'}
              </p>
            </div>
          </div>

          {/* Sosyal Girişler */}
          <div className="space-y-4 mb-10">
            <button
              onClick={() => handleSocialLogin('google')}
              className="w-full flex items-center justify-center gap-4 px-6 py-4 bg-white text-black font-bold rounded-2xl hover:bg-gray-100 transition-all duration-300 active:scale-[0.98] shadow-[0_10px_20px_rgba(255,255,255,0.1)] group"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="text-[15px]">Google ile {isLoginView ? 'Giriş Yap' : 'Devam Et'}</span>
            </button>
            
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleSocialLogin('github')}
                className="flex items-center justify-center gap-3 px-4 py-4 bg-white/[0.03] hover:bg-white/[0.08] text-white font-bold rounded-2xl border border-white/10 transition-all duration-300 active:scale-[0.98] group"
              >
                <Github className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                <span className="text-sm">GitHub</span>
              </button>
              <button
                onClick={() => handleSocialLogin('twitter')}
                className="flex items-center justify-center gap-3 px-4 py-4 bg-white/[0.03] hover:bg-white/[0.08] text-white font-bold rounded-2xl border border-white/10 transition-all duration-300 active:scale-[0.98] group"
              >
                <Twitter className="w-5 h-5 text-gray-400 group-hover:text-[#1DA1F2] transition-colors" />
                <span className="text-sm">X / Twitter</span>
              </button>
            </div>
          </div>

          {/* Ayırıcı */}
          <div className="relative mb-10">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[#0a0a0a]/80 backdrop-blur-md px-6 text-[10px] uppercase tracking-[0.4em] font-black text-gray-600">
                veya e-posta
              </span>
            </div>
          </div>

          {/* Form Bölümü */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-500 group-focus-within:text-emerald-500 transition-colors" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-posta Adresi"
                className="input-premium pl-14"
                required
              />
            </div>
            
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-500 group-focus-within:text-emerald-500 transition-colors" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Şifre"
                className="input-premium pl-14"
                required
              />
            </div>

            <div className="flex items-center justify-between px-2 pt-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className={cn(
                  "w-5 h-5 rounded-md border border-white/10 flex items-center justify-center transition-all",
                  rememberMe ? "bg-emerald-500 border-emerald-500" : "bg-white/5"
                )} onClick={() => setRememberMe(!rememberMe)}>
                  {rememberMe && <Check className="w-3 h-3 text-black font-bold" />}
                </div>
                <span className="text-xs text-gray-500 group-hover:text-gray-300 transition-colors">Beni Hatırla</span>
              </label>
              <button type="button" className="text-xs font-bold text-emerald-500/80 hover:text-emerald-400 transition-colors">
                Şifremi Unuttum
              </button>
            </div>

            <button
              type="submit"
              className="w-full btn-premium bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_20px_40px_rgba(16,185,129,0.25)] mt-4 group"
            >
              <span className="relative z-10">{isLoginView ? 'Giriş Yap' : 'Kayıt Ol'}</span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </button>
          </form>

          {/* Alt Link */}
          <div className="mt-10 text-center">
            <p className="text-gray-500 text-sm">
              {isLoginView ? 'Henüz hesabınız yok mu?' : 'Zaten bir hesabınız var mı?'}
              <button
                onClick={() => setIsLoginView(!isLoginView)}
                className="ml-2 text-white font-bold hover:text-emerald-400 transition-colors underline underline-offset-4 decoration-emerald-500/30"
              >
                {isLoginView ? 'Hemen Kayıt Ol' : 'Giriş Yapın'}
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  const drafts = projects.filter(p => p.isDraft);
  const history = projects.filter(p => !p.isDraft);

  // Bakım Modu Ekranı
  if (systemSettings.maintenanceMode && !isAdmin) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4 text-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-md space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-amber-500/10 rounded-3xl flex items-center justify-center border border-amber-500/20 animate-pulse">
              <Settings2 className="w-10 h-10 text-amber-500" />
            </div>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter">SİSTEM BAKIMDA</h1>
          <p className="text-gray-400">{systemSettings.maintenanceMessage || 'Size daha iyi bir deneyim sunmak için sistemimizi güncelliyoruz. Lütfen kısa bir süre sonra tekrar deneyin.'}</p>
          <div className="pt-4">
            <button onClick={handleLogout} className="text-xs font-bold text-gray-500 hover:text-white transition-colors uppercase tracking-widest">Çıkış Yap</button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-brand-bg overflow-hidden font-sans">
      {/* --- Yan Menü --- */}
      <aside className="w-80 border-r border-brand-border bg-brand-card flex flex-col shrink-0">
        <div className="p-6 border-b border-brand-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Fingerprint className="w-6 h-6 text-emerald-500" />
            <span className="font-bold tracking-tighter text-lg">SENTIENCE</span>
          </div>
          <button onClick={() => { setActiveTab('editor'); setInputText(''); setHumanizedText(''); setAnalysis(null); setGrammarSuggestions([]); }} className="p-1 hover:bg-emerald-500/10 rounded-md transition-colors text-emerald-500">
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 flex gap-2 border-b border-brand-border flex-wrap">
          <button onClick={() => setActiveTab('history')} className={cn("flex-1 py-1.5 rounded-md text-xs font-bold tracking-wider uppercase transition-all", activeTab === 'history' ? "bg-emerald-500/10 text-emerald-500" : "text-gray-500")}>Geçmiş</button>
          <button onClick={() => setActiveTab('drafts')} className={cn("flex-1 py-1.5 rounded-md text-xs font-bold tracking-wider uppercase transition-all", activeTab === 'drafts' ? "bg-emerald-500/10 text-emerald-500" : "text-gray-500")}>Taslaklar ({drafts.length})</button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-4 space-y-1">
            {(activeTab === 'history' ? history : drafts).length === 0 ? (
              <div className="p-4 text-center text-gray-600 text-sm italic">Henüz içerik yok</div>
            ) : (
              (activeTab === 'history' ? history : drafts).map(p => (
                <div
                  key={p.id}
                  onClick={() => {
                    setInputText(p.originalText);
                    setHumanizedText(p.humanizedText);
                    setOptions({ tone: p.tone, intensity: p.intensity });
                    if (!p.isDraft) setAnalysis({
                      humanizedText: p.humanizedText,
                      aiScore: p.aiScore,
                      isPlagiarized: p.plagiarismScore > 30,
                      similarityScore: p.plagiarismScore,
                      sources: p.sources,
                      insights: p.insights
                    });
                    setActiveTab('editor');
                  }}
                  className="group flex flex-col p-3 rounded-lg hover:bg-emerald-500/5 cursor-pointer transition-all border border-transparent hover:border-emerald-500/10"
                >
                  <div className="flex items-center justify-between min-w-0">
                    <span className="text-sm font-medium text-gray-300 truncate">{p.title}</span>
                    <button onClick={(e) => deleteProject(p.id, e)} className="opacity-0 group-hover:opacity-100 p-1.5 hover:text-red-400 text-gray-500 transition-all">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-gray-500 font-mono uppercase">
                    <span className="text-emerald-500/70">{p.tone}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(p.createdAt?.toDate?.() || Date.now()).toLocaleDateString('tr-TR')}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="p-4 border-t border-brand-border space-y-4">
          <button
            onClick={exportTuningData}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-emerald-500/70 hover:text-emerald-500 hover:bg-emerald-500/5 rounded-md transition-all font-medium"
          >
            <Download className="w-4 h-4" /> Eğitim Verisi İndir
          </button>
          <button
            onClick={clearAllData}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-500/70 hover:text-red-500 hover:bg-red-500/5 rounded-md transition-all font-medium"
          >
            <AlertCircle className="w-4 h-4" /> Tüm Verileri Sil
          </button>

          {isAdmin && (
             <motion.button 
              initial={{ opacity: 0.8 }}
              animate={{ opacity: 1 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => {
                if (isAdmin) setActiveTab('admin');
                else setActiveTab('editor');
              }} 
              className={cn(
                "w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black tracking-[0.2em] uppercase transition-all border relative overflow-hidden group", 
                activeTab === 'admin' 
                  ? "bg-emerald-500 border-emerald-500 text-black shadow-[0_0_30px_rgba(16,185,129,0.4)]" 
                  : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/40"
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
              <ShieldCheck className={cn("w-4 h-4", activeTab === 'admin' ? "animate-pulse" : "")} /> 
              Yönetim Paneli
            </motion.button>
          )}

          {appUser && (
            <div className="bg-brand-bg p-3 rounded-lg border border-brand-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Günlük Kota</span>
                <span className="text-xs font-mono text-emerald-500">{appUser.role === 'admin' ? 'Sınırsız' : `${appUser.dailyUsage} / ${PLAN_LIMITS[appUser.plan]}`}</span>
              </div>
              <div className="h-1.5 w-full bg-brand-border rounded-full overflow-hidden">
                <div 
                  className={cn("h-full rounded-full transition-all duration-500", appUser.role === 'admin' ? "bg-emerald-500 w-full" : (appUser.dailyUsage >= PLAN_LIMITS[appUser.plan] ? "bg-red-500" : "bg-emerald-500"))} 
                  style={{ width: appUser.role === 'admin' ? '100%' : `${Math.min(100, (appUser.dailyUsage / PLAN_LIMITS[appUser.plan]) * 100)}%` }}
                />
              </div>
              {appUser.role !== 'admin' && (
                <button onClick={() => setShowPlansModal(true)} className="w-full mt-3 text-[10px] uppercase font-bold text-gray-500 hover:text-emerald-500 transition-colors">Planı Yükselt</button>
              )}
            </div>
          )}
          <div className="flex items-center justify-between gap-2 p-2 bg-brand-bg rounded-lg">
            <div className="flex items-center gap-2 overflow-hidden">
              <img src={user.photoURL || ''} alt="" className="w-8 h-8 rounded-full border border-emerald-500/20" />
              <div className="flex flex-col truncate">
                <span className="text-xs font-semibold text-gray-300 truncate">{user.displayName}</span>
                <span className="text-[10px] text-gray-500 font-mono truncate uppercase">{appUser?.role === 'admin' ? 'YÖNETİCİ' : `${appUser?.plan === 'premium' ? 'PREMIUM' : appUser?.plan === 'pro' ? 'PRO' : 'ÜCRETSİZ'} PLAN`}</span>
              </div>
            </div>
            <button onClick={handleLogout} className="p-2 hover:bg-white/5 rounded-md transition-colors">
              <LogOut className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      </aside>

      {/* --- Ana İçerik --- */}
      <main className="flex-1 flex flex-col bg-brand-bg relative">
        {activeTab === 'admin' && isAdmin ? (
          <AdminPanel />
        ) : (
          <>
            <header className="h-20 border-b border-brand-border flex items-center justify-between px-8 bg-brand-card/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-8">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase tracking-widest text-gray-600 font-bold flex items-center gap-1"><Settings2 className="w-3 h-3" /> Üst Ton Seçimi</label>
              <div className="flex items-center gap-2">
                <select
                  value={options.tone}
                  onChange={(e) => setOptions({ ...options, tone: e.target.value })}
                  className="bg-transparent border-none text-sm font-bold outline-none focus:ring-0 text-gray-300 hover:text-emerald-500 transition-colors uppercase tracking-widest p-0 cursor-pointer"
                >
                  <optgroup label="Standart Tonlar">
                    <option value="Profesyonel">Profesyonel</option>
                    <option value="Sohbet Vari">Sohbet Vari</option>
                    <option value="Resmi">Resmi</option>
                    <option value="Samimi">Samimi</option>
                    <option value="Akademik">Akademik</option>
                    <option value="Yaratıcı">Yaratıcı</option>
                    <option value="Heyecanlı">Heyecanlı</option>
                  </optgroup>
                  {customTones.length > 0 && (
                    <optgroup label="Özel Tonlarınız">
                      {customTones.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                    </optgroup>
                  )}
                </select>
                <button onClick={() => setShowCustomToneModal(true)} title="Özel Ton Ekle" className="p-1 hover:text-emerald-500 text-gray-600 transition-colors">
                  <MessageSquarePlus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="h-8 w-[1px] bg-brand-border" />
            <div className="flex flex-col gap-1 w-48">
              <label className="text-[9px] uppercase tracking-widest text-gray-600 font-bold flex items-center gap-1"><Zap className="w-3 h-3" /> {getIntensityFeedback(options.intensity).label} ({options.intensity}%)</label>
              <div className="flex flex-col">
                <input
                  type="range"
                  min="0" max="100"
                  value={options.intensity}
                  onChange={(e) => setOptions({ ...options, intensity: parseInt(e.target.value) })}
                  className="w-full h-1 bg-brand-border rounded-lg appearance-none cursor-pointer accent-emerald-500 shadow-xl"
                />
                <span className="text-[8px] text-gray-500 uppercase mt-1 leading-none">{getIntensityFeedback(options.intensity).desc}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleSummarize}
              disabled={isSummarizing || !inputText.trim()}
              className={cn(
                "flex items-center gap-2 px-5 py-2 rounded-full border text-xs font-bold transition-all",
                isShowingSummary 
                  ? "bg-emerald-500/20 border-emerald-500 text-emerald-500" 
                  : "border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/5"
              )}
            >
              {isSummarizing ? 'ÖZETLENİYOR...' : 'METNİ ÖZETLE'}
            </button>
            <button
              onClick={saveDraft}
              disabled={isDrafting || !inputText.trim()}
              className="flex items-center gap-2 px-5 py-2 rounded-full border border-brand-border text-xs font-bold hover:bg-white/5 transition-all text-gray-400 disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> TASLAK KAYDET
            </button>
            <button
              onClick={handleHumanize}
              disabled={isProcessing || !inputText.trim()}
              className={cn(
                "flex items-center gap-2 px-8 py-2 rounded-full font-black text-xs uppercase tracking-widest transition-all",
                isProcessing ? "bg-emerald-500/20 text-emerald-500 animate-pulse" : "bg-emerald-500 text-black hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
              )}
            >
              {isProcessing ? 'İŞLENİYOR...' : 'İNSANİLEŞTİR'}
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
        </header>

        <div className="flex-1 p-8 flex gap-8 overflow-hidden">
          <div className="flex-1 grid grid-rows-2 gap-8 min-w-0 h-full">
            <div className="relative group flex flex-col bg-brand-card rounded-2xl border border-brand-border hover:border-emerald-500/20 transition-all overflow-hidden shadow-2xl">
              <div className="px-6 py-3 border-b border-brand-border flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-6">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2">
                    <ChevronRight className="w-3 h-3 text-emerald-500" /> Kaynak Metin
                  </span>

                  {realtimeScore !== null && aiSettings.enabled && (
                    <button onClick={() => setShowAiSettingsModal(true)} className="flex items-center gap-2 group/score">
                      <span className="text-[9px] text-gray-500 uppercase font-black">Canlı YZ Tespiti:</span>
                      <div className="w-16 h-1 bg-brand-border rounded-full overflow-hidden">
                        <motion.div animate={{ width: `${realtimeScore * 100}%` }} className={cn("h-full", realtimeScore > 0.5 ? "bg-red-500" : "bg-emerald-500")} />
                      </div>
                      <span className="text-[10px] font-mono text-gray-400">{Math.round(realtimeScore * 100)}%</span>
                    </button>
                  )}

                  {checkingStatus.active && (
                    <div className="flex items-center gap-1.5 ml-4">
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-1.5 h-1.5 border border-emerald-500 border-t-transparent rounded-full" />
                      <span className="text-[9px] text-emerald-500 font-black uppercase tracking-widest leading-none">
                        {checkingStatus.type === 'Hepsi' ? 'YZ ve Dilbilgisi Taranıyor...' : `${checkingStatus.type} Denetleniyor...`}
                      </span>
                    </div>
                  )}

                  {quotaExceeded && (
                    <div className="flex items-center gap-1.5 ml-4 px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
                      <AlertCircle className="w-3 h-3 text-yellow-500" />
                      <span className="text-[9px] text-yellow-500 font-bold uppercase tracking-widest leading-none">Kota Sınırı - Bekleniyor</span>
                    </div>
                  )}

                  {lastCheckTime && !checkingStatus.active && !quotaExceeded && (
                    <div className="flex items-center gap-1.5 ml-4">
                      <Check className="w-3 h-3 text-emerald-500/40" />
                      <span className="text-[9px] text-gray-600 font-bold uppercase tracking-widest leading-none">Son Denetim: {lastCheckTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={handleGrammarCheck} disabled={checkingStatus.active} className="group relative flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/5 hover:border-emerald-500/30 rounded-full transition-all">
                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500/60 group-hover:text-emerald-500">Analiz Et</span>
                    <Highlighter className="w-3 h-3 text-emerald-500" />
                  </button>
                  <button onClick={() => setShowGrammarPrefsModal(true)} className="p-1.5 hover:bg-emerald-500/10 rounded-md transition-colors text-gray-500 hover:text-emerald-500" title="Denetim Ayarları">
                    <Settings2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="relative flex-1 group">
                <textarea
                  ref={textareaRef}
                  value={inputText}
                  onScroll={handleScroll}
                  onChange={(e) => {
                    setInputText(e.target.value);
                    setAppliedCorrections(prev => prev.filter(c => e.target.value.includes(c.newText)));
                    handleScroll();
                  }}
                  placeholder="Metninizi buraya yapıştırın. Yapay zeka tespiti canlı gerçekleşir..."
                  className="absolute inset-0 w-full h-full p-6 bg-transparent outline-none resize-none text-gray-300 placeholder:text-gray-700 leading-relaxed custom-scrollbar text-sm z-10"
                />
                <div ref={backdropRef} className="absolute inset-0 w-full h-full p-6 text-sm leading-relaxed pointer-events-none whitespace-pre-wrap break-words overflow-y-auto custom-scrollbar text-transparent z-0 selection:bg-transparent">
                  <div className="relative">
                    {(() => {
                      if (!inputText) return null;
                      const allSpans: { start: number; end: number; type: 'suggestion' | 'correction'; data: any }[] = [];
                      grammarSuggestions.forEach(s => {
                        let idx = inputText.indexOf(s.original);
                        while (idx !== -1) {
                          allSpans.push({ start: idx, end: idx + s.original.length, type: 'suggestion', data: s });
                          idx = inputText.indexOf(s.original, idx + 1);
                        }
                      });
                      appliedCorrections.forEach(c => {
                        let idx = inputText.indexOf(c.newText);
                        while (idx !== -1) {
                          allSpans.push({ start: idx, end: idx + c.newText.length, type: 'correction', data: c });
                          idx = inputText.indexOf(c.newText, idx + 1);
                        }
                      });
                      allSpans.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));
                      const filteredSpans: typeof allSpans = [];
                      let lastEnd = 0;
                      allSpans.forEach(span => { if (span.start >= lastEnd) { filteredSpans.push(span); lastEnd = span.end; } });
                      const renderedParts: (string | React.ReactNode)[] = [];
                      let currentIndex = 0;
                      filteredSpans.forEach((span, i) => {
                        if (span.start > currentIndex) renderedParts.push(inputText.substring(currentIndex, span.start));
                        const content = inputText.substring(span.start, span.end);
                        if (span.type === 'suggestion') {
                          renderedParts.push(
                            <span key={`sug-${i}`} onClick={(e) => {
                              const rect = (e.target as HTMLElement).getBoundingClientRect();
                              const containerRect = textareaRef.current?.parentElement?.getBoundingClientRect();
                              if (containerRect) {
                                setSuggestionPos({ top: rect.top - containerRect.top + (textareaRef.current?.scrollTop || 0), left: rect.left - containerRect.left });
                                setActiveSuggestion(span.data);
                              }
                            }} className="bg-yellow-500/30 border-b-2 border-yellow-500 rounded-sm pointer-events-auto cursor-pointer hover:bg-yellow-500/50 transition-colors">{content}</span>
                          );
                        } else {
                          renderedParts.push(
                            <span key={`app-${i}`} className="bg-emerald-500/20 border-b-2 border-emerald-500 rounded-sm relative group/app-tip pointer-events-auto cursor-help">
                              {content}
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-gray-900 border border-brand-border rounded text-[10px] text-gray-400 opacity-0 group-hover/app-tip:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">Düzeltildi: <span className="text-red-400 line-through">"{span.data.oldText}"</span></div>
                            </span>
                          );
                        }
                        currentIndex = span.end;
                      });
                      if (currentIndex < inputText.length) renderedParts.push(inputText.substring(currentIndex));
                      return renderedParts;
                    })()}
                    <AnimatePresence mode="wait">
                      {activeSuggestion && (
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 5 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 5 }} transition={{ duration: 0.15 }} style={{ top: suggestionPos.top - 150, left: Math.max(0, Math.min(suggestionPos.left, 450)), position: 'absolute' }} className="z-[60] w-80 bg-gray-950 border border-emerald-500/30 rounded-2xl p-5 shadow-[0_25px_60px_rgba(0,0,0,0.6)] pointer-events-auto backdrop-blur-2xl ring-1 ring-white/10">
                          <div className="flex justify-between items-start mb-4">
                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-red-400 rounded-full" /> Orijinal Metin</label>
                              <div className="text-sm text-red-100 font-medium line-through decoration-red-500/40 opacity-80">"{activeSuggestion.original}"</div>
                            </div>
                            <button onClick={() => setActiveSuggestion(null)} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-500 transition-colors"><X className="w-4 h-4" /></button>
                          </div>
                          <div className="space-y-1 mb-5">
                            <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> Önerilen İyileştirme</label>
                            <div className="text-sm text-white font-bold bg-emerald-500/10 px-3 py-2 rounded-lg border border-emerald-500/20">"{activeSuggestion.suggestion}"</div>
                            <div className="mt-3 p-3 bg-white/[0.03] rounded-xl border border-white/5"><p className="text-[11px] text-gray-400 leading-relaxed italic">{activeSuggestion.explanation}</p></div>
                          </div>
                          <button onClick={() => applySuggestion(activeSuggestion)} className="w-full py-2.5 bg-yellow-500 text-black text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-yellow-400 transition-all shadow-[0_0_20px_rgba(234,179,8,0.4)] active:scale-[0.98]">Düzeltmeyi Uygula</button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative group flex flex-col bg-brand-card rounded-2xl border border-brand-border hover:border-emerald-500/20 transition-all overflow-hidden shadow-2xl">
              <div className="px-6 py-3 border-b border-brand-border flex items-center justify-between">
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2",
                  isShowingSummary ? "text-emerald-400" : "text-emerald-500"
                )}>
                  {isShowingSummary ? <BookOpen className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                  {isShowingSummary ? 'Yapay Zeka Özet Sonucu' : 'İnsanlaştırılmış Metin'}
                </span>
                <div className="flex items-center gap-2">
                  <div className="flex bg-brand-bg rounded-lg border border-brand-border p-0.5">
                    <button onClick={exportTxt} disabled={!humanizedText} className="p-1.5 hover:bg-emerald-500/10 rounded-md transition-colors text-gray-400 hover:text-emerald-500 disabled:opacity-50" title="Metin Olarak Dışa Aktar"><Download className="w-3.5 h-3.5" /></button>
                    <button onClick={exportDocx} disabled={!humanizedText} className="p-1.5 hover:bg-emerald-500/10 rounded-md transition-colors text-gray-400 hover:text-emerald-500 disabled:opacity-50" title="Word Olarak Dışa Aktar"><Layers className="w-3.5 h-3.5" /></button>
                  </div>
                  <button onClick={copyToClipboard} title="Kopyala" className="p-1.5 hover:bg-emerald-500/10 rounded-md transition-colors text-gray-400 hover:text-emerald-500">{copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}</button>
                </div>
              </div>
              <div className="flex-1 p-6 overflow-y-auto custom-scrollbar text-gray-300 leading-relaxed markdown-container">
                {isProcessing ? (<div className="h-full flex items-center justify-center gap-2 text-emerald-500/30"><History className="w-6 h-6 animate-spin" /><span className="font-mono text-sm">DÖNÜŞTÜRÜLÜYOR...</span></div>) : (<ReactMarkdown>{humanizedText || '_İnsanlaştırılmış metin burada görünecek._'}</ReactMarkdown>)}
              </div>
            </div>
          </div>

          <div className="w-96 flex flex-col gap-6 shrink-0 h-full overflow-y-auto custom-scrollbar pr-2 pb-12">
            <div className="p-6 bg-brand-card rounded-2xl border border-brand-border space-y-6 shadow-xl">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2"><Gauge className="w-4 h-4 text-emerald-500" /> Analitik Rapor</h3>

              {mlAnalysis && (
                <div className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/10 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">ML Okunabilirlik</span>
                    <span className="text-xs font-mono text-white">{Math.round(mlAnalysis.readabilityScore * 100)}%</span>
                  </div>
                  <div className="text-[10px] text-gray-400 italic">Karmaşıklık: <span className="text-emerald-400">{mlAnalysis.complexity}</span></div>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-end"><span className="text-xs text-gray-400">İnsan Benzerliği</span><span className={cn("text-xl font-mono font-bold", (analysis?.aiScore || 0) < 0.2 ? "text-emerald-500" : "text-amber-500")}>{analysis ? Math.round((1 - analysis.aiScore) * 100) : '--'}%</span></div>
                  <div className="h-1.5 bg-brand-border rounded-full overflow-hidden"><motion.div key={analysis?.aiScore} initial={{ width: 0 }} animate={{ width: analysis ? `${(1 - analysis.aiScore) * 100}%` : '0%' }} className={cn("h-full transition-all duration-1000", (analysis?.aiScore || 0) < 0.2 ? "bg-emerald-500" : "bg-amber-500")} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-brand-bg rounded-xl border border-brand-border"><div className="text-[9px] text-gray-600 font-black mb-1 uppercase tracking-widest flex items-center gap-1"><FileSearch className="w-3 h-3" /> Benzerlik</div><div className={cn("text-xs font-mono font-bold", (analysis?.similarityScore || 0) > 30 ? "text-red-500" : "text-emerald-500")}>{analysis ? `${analysis.similarityScore}%` : '--'}</div></div>
                  <div className="p-3 bg-brand-bg rounded-xl border border-brand-border"><div className="text-[9px] text-gray-600 font-black mb-1 uppercase tracking-widest flex items-center gap-1"><Clock className="w-3 h-3" /> Durum</div><div className="text-[10px] font-mono font-bold text-white uppercase">{isProcessing ? 'İŞLENİYOR' : 'HAZIR'}</div></div>
                </div>
                {analysis?.sources && analysis.sources.length > 0 ? (
                  <div className="p-4 bg-red-500/5 rounded-2xl border border-red-500/20 space-y-4 shadow-[0_10px_30px_rgba(239,68,68,0.05)]">
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-3"><div className="p-2 bg-red-500/10 rounded-lg"><ShieldCheck className="w-5 h-5 text-red-500" /></div><div><h4 className="text-[11px] font-black text-red-500 uppercase tracking-tighter">İntihal Kanıt Merkezi</h4><p className="text-[9px] text-gray-500 font-medium">Tespit edilen eşleşmeler</p></div></div>
                      <div className="text-right"><span className="text-[14px] font-mono font-bold text-red-500">%{analysis.similarityScore}</span><p className="text-[8px] text-gray-500 uppercase tracking-widest font-black">Genel Risk</p></div>
                    </div>
                    <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                      {analysis.sources.map((s, i) => (
                        <div key={i} className="group relative bg-brand-bg/40 rounded-2xl border border-brand-border/40 hover:border-red-500/40 hover:bg-brand-bg/60 transition-all duration-300 p-4">
                          <div className="flex items-start justify-between gap-4 mb-4">
                            <div className="flex-1 min-w-0"><h5 className="text-[12px] font-bold text-gray-100 truncate mb-1">{s.title}</h5><div className="flex items-center gap-2"><ExternalLink className="w-3 h-3 text-red-500/50" /><a href={s.url} target="_blank" rel="noopener noreferrer" className="text-[9px] text-gray-500 hover:text-red-400 transition-colors truncate block">{s.url}</a></div></div>
                            <div className="flex flex-col items-end"><div className="px-2 py-1 bg-red-500/10 rounded-md border border-red-500/20"><span className="text-[10px] font-mono font-black text-red-500">%{s.similarity}</span></div></div>
                          </div>
                          <div className="relative"><div className="absolute -left-3 top-0 bottom-0 w-1 bg-red-500/20 rounded-full group-hover:bg-red-500/40 transition-colors" /><div className="bg-black/40 rounded-xl p-3 border border-white/5"><div className="flex items-center gap-2 mb-2"><Fingerprint className="w-3 h-3 text-red-500/50" /><span className="text-[8px] font-black text-red-400/80 uppercase tracking-widest">Eşleşen Metin Bloğu</span></div><p className="text-[11px] text-gray-400 italic leading-relaxed">"...{s.matchedSnippet}..."</p></div></div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {analysis?.similarityScore !== undefined && (<div className="p-6 bg-emerald-500/5 rounded-2xl border border-emerald-500/20 text-center flex flex-col items-center gap-3"><div className="p-3 bg-emerald-500/10 rounded-full"><ShieldCheck className="w-6 h-6 text-emerald-500" /></div><div><p className="text-[11px] text-emerald-500 font-black uppercase tracking-widest mb-1">Metniniz Güvende</p><p className="text-[10px] text-gray-500">İntihal saptanmadı.</p></div></div>)}
                    {!analysis && (<div className="p-12 border-2 border-dashed border-brand-border rounded-2xl flex flex-col items-center justify-center text-center opacity-50"><Search className="w-8 h-8 text-gray-700 mb-4" /><p className="text-[10px] text-gray-600 uppercase font-black tracking-widest">Analiz Bekleniyor</p><p className="text-[9px] text-gray-700 mt-2">Metni insanileştirdiğinizde sonuçlar burada görünecektir.</p></div>)}
                  </div>
                )}
              </div>
            </div>
            {grammarSuggestions.length > 0 && (
              <div className="p-6 bg-brand-card rounded-2xl border border-emerald-500/20 shadow-xl space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2"><BookOpen className="w-4 h-4" /> Yazım Denetimi</h3>
                <div className="space-y-3">
                  {grammarSuggestions.map((s, i) => (
                    <div key={i} className="p-3 bg-brand-bg rounded-lg border border-brand-border group space-y-2">
                      <div className="text-red-500/70 text-[10px] line-through font-mono">"{s.original}"</div>
                      <div className="text-emerald-500 text-[11px] font-bold">Öneri: {s.suggestion}</div>
                      <p className="text-[10px] text-gray-500 leading-relaxed italic">{s.explanation}</p>
                      <button onClick={() => applySuggestion(s)} className="w-full py-1 bg-emerald-500/10 text-emerald-500 rounded text-[9px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all hover:bg-emerald-500 hover:text-black">Düzeltmeyi Uygula</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex-1 p-6 bg-brand-card rounded-2xl border border-brand-border flex flex-col gap-6 shadow-xl min-h-0">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2"><Search className="w-4 h-4 text-emerald-500" /> Cümle İncelemesi</h3>
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 font-mono text-[11px]">
                {!analysis ? (<div className="text-gray-600 italic">Analiz bekleniyor...</div>) : (analysis.insights.map((insight, i) => (<div key={i} className="p-3 bg-brand-bg/50 rounded-lg border-l-2 border-emerald-500/30 group hover:border-emerald-500 transition-all"><div className="text-emerald-500/70 mb-1 leading-relaxed">"{insight.sentence}"</div><div className="text-gray-400 group-hover:text-gray-300 transition-colors">{insight.detail}</div></div>)))}
              </div>
            </div>
          </div>
        </div>
          </>
        )}
      </main>

      <AnimatePresence>
        {showPlansModal && appUser && (
          <PlansModal user={appUser} onClose={() => setShowPlansModal(false)} />
        )}
        {showGrammarPrefsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowGrammarPrefsModal(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-md bg-brand-card border border-brand-border rounded-3xl p-8 shadow-2xl space-y-6">
              <div className="flex items-center justify-between"><div className="space-y-1"><h2 className="text-xl font-bold text-white">Denetim Ayarları</h2><p className="text-xs text-gray-500">Dilbilgisi kontrolünü özelleştirin.</p></div><button onClick={() => setShowGrammarPrefsModal(false)} className="p-2 hover:bg-white/5 rounded-full text-gray-500"><X className="w-5 h-5" /></button></div>
              <div className="space-y-6">
                <div className="space-y-3"><label className="text-[10px] uppercase font-bold text-gray-600 tracking-widest">Öncelik Ver</label><div className="flex flex-wrap gap-2">{['Yazım Hataları', 'Noktalama', 'Stil', 'Akıcılık', 'Kelime Dağarcığı'].map(type => (<button key={type} onClick={() => { const isPrioritized = grammarPrefs.prioritize.includes(type); setGrammarPrefs({ ...grammarPrefs, prioritize: isPrioritized ? grammarPrefs.prioritize.filter(t => t !== type) : [...grammarPrefs.prioritize, type] }); }} className={cn("px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border", grammarPrefs.prioritize.includes(type) ? "bg-emerald-500 border-emerald-500 text-black shadow-[0_0_10px_rgba(16,185,129,0.3)]" : "bg-brand-bg border-brand-border text-gray-500 hover:border-gray-400")}>{type}</button>))}</div></div>
                <div className="space-y-3"><label className="text-[10px] uppercase font-bold text-gray-600 tracking-widest">Yoksay</label><div className="flex flex-wrap gap-2">{['Argo', 'Edilgen Çatı', 'Uzun Cümleler'].map(type => (<button key={type} onClick={() => { const isIgnored = grammarPrefs.ignore.includes(type); setGrammarPrefs({ ...grammarPrefs, ignore: isIgnored ? grammarPrefs.ignore.filter(t => t !== type) : [...grammarPrefs.ignore, type] }); }} className={cn("px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border", grammarPrefs.ignore.includes(type) ? "bg-red-500 border-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.3)]" : "bg-brand-bg border-brand-border text-gray-500 hover:border-gray-400")}>{type}</button>))}</div></div>
              </div>
              <button onClick={() => setShowGrammarPrefsModal(false)} className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-100 transition-all">AYARLARI UYGULA</button>
            </motion.div>
          </div>
        )}
        {showAiSettingsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAiSettingsModal(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-sm bg-brand-card border border-brand-border rounded-3xl p-8 shadow-2xl space-y-6">
              <div className="flex items-center justify-between"><div className="space-y-1"><h2 className="text-xl font-bold text-white">YZ Tespit Ayarları</h2><p className="text-xs text-gray-500">Canlı analiz hassasiyetini yönetin.</p></div><button onClick={() => setShowAiSettingsModal(false)} className="p-2 hover:bg-white/5 rounded-full text-gray-500"><X className="w-5 h-5" /></button></div>
              <div className="space-y-6">
                <div className="flex items-center justify-between"><label className="text-xs font-bold text-gray-300">Canlı Analiz</label><button onClick={() => setAiSettings({ ...aiSettings, enabled: !aiSettings.enabled })} className={cn("w-10 h-5 rounded-full transition-all relative", aiSettings.enabled ? "bg-emerald-500" : "bg-gray-700")}><div className={cn("absolute top-1 w-3 h-3 bg-white rounded-full transition-all", aiSettings.enabled ? "left-6" : "left-1")} /></button></div>
                <div className="space-y-3"><div className="flex justify-between items-center text-[10px] uppercase font-bold text-gray-600 tracking-widest"><span>Hassasiyet Eşiği</span><span className="text-emerald-500">%{Math.round(aiSettings.sensitivity * 100)}</span></div><input type="range" min="0" max="1" step="0.1" value={aiSettings.sensitivity} onChange={(e) => setAiSettings({ ...aiSettings, sensitivity: parseFloat(e.target.value) })} className="w-full h-1 bg-brand-border rounded-lg appearance-none cursor-pointer accent-emerald-500 mb-2" /><p className="text-[10px] text-gray-500 italic leading-relaxed">Bu eşiğin altındaki YZ skorları "Sıfır Risk" olarak gösterilecek ve göz ardı edilecektir.</p></div>
              </div>
              <button onClick={() => setShowAiSettingsModal(false)} className="w-full py-3 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 transition-all">KAPAT</button>
            </motion.div>
          </div>
        )}
        {showCustomToneModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCustomToneModal(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-md bg-brand-card border border-brand-border rounded-3xl p-8 shadow-2xl space-y-6">
              <div className="flex items-center justify-between"><div className="space-y-1"><h2 className="text-xl font-bold text-white">Özel Ton Oluştur</h2><p className="text-xs text-gray-500">AI'ya nasıl bir tarzda yazması gerektiğini öğretin.</p></div><button onClick={() => setShowCustomToneModal(false)} className="p-2 hover:bg-white/5 rounded-full text-gray-500"><X className="w-5 h-5" /></button></div>
              <div className="space-y-4">
                <div className="space-y-2"><label className="text-[10px] uppercase font-bold text-gray-600 tracking-widest">Ton Adı</label><input type="text" value={newTone.name} onChange={(e) => setNewTone({ ...newTone, name: e.target.value })} placeholder="Örn: Modern Mimari Eleştirmeni" className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-colors text-sm" /></div>
                <div className="space-y-2"><label className="text-[10px] uppercase font-bold text-gray-600 tracking-widest">Tarz Açıklaması</label><textarea value={newTone.description} onChange={(e) => setNewTone({ ...newTone, description: e.target.value })} placeholder="Örn: Sofistike bir dil kullan, sıkça metaforlara yer ver ve cümle yapılarını karmaşık tut ancak akıcılığı bozma." className="w-full h-32 bg-brand-bg border border-brand-border rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-colors text-sm resize-none" /></div>
              </div>
              <button onClick={createCustomTone} className="w-full py-3 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]">KAYDET VE KULLAN</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
