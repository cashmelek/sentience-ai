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
  HelpCircle,
  Menu,
  Info,
  ExternalLink
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
  getDocs,
  getDoc
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
import { db, auth, isQuotaError, setQuotaExhausted, isQuotaExhausted } from './lib/firebase';
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
import { verifyPlagiarism, verifyFactCheck, FactCheckReport } from './services/sentinelService';
import { InfoTooltip } from './components/InfoTooltip';

import { AppUser, PLAN_LIMITS, Project } from './types';

export type CombinedAnalysisResult = AnalysisResult & {
  similarityScore?: number;
  sources?: any[];
  isPlagiarized?: boolean;
};

const STANDARD_TONES = [
  'Profesyonel',
  'Sohbet Vari',
  'Resmi',
  'Samimi',
  'Akademik',
  'Yaratıcı',
  'Heyecanlı'
];

const MetricCard = ({ icon: Icon, label, value, subValue, colorClass = "text-emerald-500" }: any) => (
  <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-5 flex flex-col gap-1 hover:bg-white/[0.06] transition-all group shadow-lg">
    <div className="flex items-center gap-2 mb-2">
      <div className={cn("p-2 rounded-xl bg-white/5 group-hover:scale-110 transition-transform", colorClass)}>
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-xs font-black uppercase tracking-widest text-gray-500">{label}</span>
    </div>
    <div className="text-3xl font-black text-white">{value}</div>
    {subValue && <div className="text-[10px] text-gray-500 font-bold mt-1">{subValue}</div>}
  </div>
);

const ScoreCircle = ({ score, label, size = 160 }: { score: number, label: string, size?: number }) => {
  const percentage = Math.round(score * 100);
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score * circumference);
  
  const isAI = score > 0.7;
  const isHuman = score < 0.3;
  const color = isAI ? "#ef4444" : isHuman ? "#10b981" : "#f59e0b";
  const glowColor = isAI ? "rgba(239, 68, 68, 0.3)" : isHuman ? "rgba(16, 185, 129, 0.3)" : "rgba(245, 158, 11, 0.3)";

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90 w-full h-full">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-white/5"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 10px ${glowColor})` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-black text-white tracking-tighter">%{percentage}</span>
          <span className="text-sm font-black text-gray-500 uppercase tracking-widest mt-1">{label}</span>
        </div>
      </div>
      <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: color }} />
        <span className="text-sm font-black uppercase tracking-[0.1em] text-gray-400">
          {isAI ? 'Yapay Zeka Tespit Edildi' : isHuman ? 'İnsan Yazımı Doğrulandı' : 'Karma Yapı Tespit Edildi'}
        </span>
      </div>
    </div>
  );
};

const AuditMetricCard = ({ title, value, percentage, icon: Icon, color, detail, trend, tooltip }: any) => (
  <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 hover:bg-white/[0.06] transition-all group relative">
    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
      <Icon className={cn("w-12 h-12", color)} />
    </div>
    <div className="relative z-10">
      <div className="flex justify-between items-start mb-3">
        <div className={cn("p-2 rounded-xl bg-white/5 group-hover:scale-110 transition-transform flex items-center gap-2", color)}>
          <Icon className="w-4 h-4" />
          {tooltip && <InfoTooltip text={tooltip} position="bottom" />}
        </div>
        <div className="text-left">
          <div className="text-[11px] font-black uppercase tracking-[0.15em] text-gray-500 mb-1">
            {title}
          </div>
          <div className="text-2xl font-black text-white">{value}</div>
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(1, Math.max(0, percentage)) * 100}%` }}
            className={cn("h-full shadow-[0_0_10px_rgba(255,255,255,0.1)] transition-all duration-1000", 
              percentage > 0.7 ? "bg-red-500" : percentage > 0.3 ? "bg-amber-500" : "bg-emerald-500")}
          />
        </div>
        <div className="flex justify-between items-center">
          {detail && <div className="text-[11px] text-gray-400 font-bold truncate max-w-[160px]">{detail}</div>}
          {trend && (
            <div className={cn("text-[10px] font-black px-2 py-0.5 rounded flex items-center gap-1", 
              trend === 'up' ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500")}>
              {trend === 'up' ? <Zap className="w-2.5 h-2.5" /> : <AlertCircle className="w-2.5 h-2.5" />}
              {trend === 'up' ? 'OPTİMAL' : 'DÜŞÜK'}
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);

const HeatmapText = ({ text, sentenceScores }: { text: string, sentenceScores: { sentence: string, score: number, type?: 'ai' | 'human' | 'mixed', reason?: string }[] }) => {
  if (!sentenceScores || sentenceScores.length === 0) return <div className="whitespace-pre-wrap">{text}</div>;

  return (
    <div className="whitespace-pre-wrap leading-relaxed text-gray-300">
      {sentenceScores.map((item, idx) => {
        let color = 'transparent';
        let borderColor = 'transparent';
        const opacity = 0.4; // Belirginlik artırıldı

        if (item.type === 'ai' || item.score > 0.7) {
          color = `rgba(239, 68, 68, ${opacity})`;
          borderColor = `rgba(239, 68, 68, 0.8)`;
        } else if (item.type === 'mixed' || (item.score > 0.3 && item.score <= 0.7)) {
          color = `rgba(245, 158, 11, ${opacity})`;
          borderColor = `rgba(245, 158, 11, 0.8)`;
        } else {
          color = `rgba(16, 185, 129, ${opacity})`;
          borderColor = `rgba(16, 185, 129, 0.8)`;
        }
        
        return (
          <span 
            key={idx} 
            className="transition-all duration-300 px-1 rounded-sm cursor-help group relative inline border-b-2"
            style={{ 
              backgroundColor: color, 
              borderBottomColor: borderColor,
            }}
          >
            {item.sentence}{" "}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-4 py-3 bg-black border border-white/20 rounded-2xl text-xs opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-[100] shadow-2xl w-64 backdrop-blur-2xl">
              <div className="flex justify-between items-center mb-2 border-b border-white/10 pb-2">
                <span className="font-black uppercase tracking-widest text-[9px] text-gray-400">
                  {item.type === 'ai' ? 'Yapay Zeka' : item.type === 'human' ? 'İnsan Yazımı' : 'Karma'}
                </span>
                <span className={cn("font-black", item.score > 0.7 ? "text-red-500" : "text-emerald-500")}>
                  %{Math.round(item.score * 100)}
                </span>
              </div>
              <p className="text-white font-medium leading-relaxed italic text-[11px]">"{item.reason || 'Cümle yapısı analiz edildi.'}"</p>
            </div>
          </span>
        );
      })}
    </div>
  );
};

const MetricProgress = ({ label, value, percentage, icon: Icon }: any) => (
  <div className="space-y-1.5">
    <div className="flex justify-between items-center px-1">
      <div className="flex items-center gap-1.5">
        <Icon className="w-3 h-3 text-emerald-500/70" />
        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tight">{label}</span>
      </div>
      <span className="text-[10px] font-black text-white">{value}</span>
    </div>
    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${percentage * 100}%` }}
        className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
      />
    </div>
  </div>
);

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // App Logic State
  const [inputText, setInputText] = useState('');
  const [humanizedText, setHumanizedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [options, setOptions] = useState<HumanizeOptions>({ tone: 'Profesyonel', intensity: 80 });
  const [analysis, setAnalysis] = useState<CombinedAnalysisResult | null>(null);
  const [mlAnalysis, setMlAnalysis] = useState<MLAnalysisResult | null>(null);
  const [grammarSuggestions, setGrammarSuggestions] = useState<GrammarSuggestion[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [copied, setCopied] = useState(false);
  const [realtimeScore, setRealtimeScore] = useState<number | null>(null);
  const [detailsFontSize, setDetailsFontSize] = useState(14);
  const [systemSettings, setSystemSettings] = useState({
    sentinelEnabled: true,
    maintenanceMode: false,
    auditorSensitivity: 70,
    auditorModel: 'gemini-2.5-flash-lite',
    ghostWriterModel: 'gemini-2.5-flash'
  });
  const [localAuditorSensitivity, setLocalAuditorSensitivity] = useState(70);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [auditorResult, setAuditorResult] = useState<{
    score: number;
    reasoning: string;
    sentenceScores: { sentence: string; score: number; type?: 'ai' | 'human' | 'mixed'; reason?: string }[];
    metrics: { 
      plagiarism: number; 
      readability: number; 
      atesman?: number;
      cetinkayaUzun?: number;
      complexity: string; 
      burstiness: number;
      perplexity: number;
      structureScore: number;
    };
  } | null>(null);
  const [showInputHeatmap, setShowInputHeatmap] = useState(false);
  const [factCheckResult, setFactCheckResult] = useState<FactCheckReport | null>(null);

  const ADMIN_EMAILS = ['ismail.kaleci@gmail.com', 'tonguc.urunler@gmail.com'];
  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase());

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Highlighted Text Logic (Grammar + Heatmap)
  const inputOverlay = React.useMemo(() => {
    if (showInputHeatmap && auditorResult?.sentenceScores) {
      return (
        <div className="whitespace-pre-wrap leading-relaxed">
          {auditorResult.sentenceScores.map((item, idx) => {
            let color = 'transparent';
            const opacity = 0.25;
            if (item.score > 0.7) color = `rgba(239, 68, 68, ${opacity})`;
            else if (item.score > 0.3) color = `rgba(245, 158, 11, ${opacity})`;
            else color = `rgba(16, 185, 129, ${opacity})`;
            
            return (
              <span 
                key={idx} 
                className="transition-all duration-300 rounded-sm cursor-help group relative inline"
                style={{ 
                  backgroundColor: color,
                  borderBottom: item.score > 0.7 ? '1px solid rgba(239, 68, 68, 0.5)' : 'none'
                }}
              >
                {item.sentence}{" "}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-2xl text-xs opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-[100] shadow-2xl w-64 backdrop-blur-xl">
                  <div className="flex justify-between items-center mb-2 border-b border-white/5 pb-2">
                    <span className="font-black uppercase tracking-widest text-[9px] text-gray-500">
                      YZ Analizi
                    </span>
                    <span className={cn("font-black", item.score > 0.7 ? "text-red-500" : "text-emerald-500")}>
                      %{Math.round(item.score * 100)}
                    </span>
                  </div>
                  <p className="text-gray-300 font-medium leading-relaxed italic text-[11px]">"{item.reason || 'Cümle yapısı analiz edildi.'}"</p>
                </div>
              </span>
            );
          })}
        </div>
      );
    }

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
      <span key={i} className={highlights[i] ? "bg-red-500/30 border-b border-red-500" : ""} >
        {char}
      </span>
    ));
  }, [inputText, grammarSuggestions, showInputHeatmap, auditorResult]);

  // Scroll Sync
  const handleScroll = () => {
    if (textareaRef.current && backdropRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop;
      backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // AppUser Firestore Sync
  useEffect(() => {
    if (!user) {
      setAppUser(null);
      return;
    }

    // Kota aşımında dinleyici açma
    if (isQuotaExhausted()) return;

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
        await setDoc(userRef, newUser).catch(err => {
          if (isQuotaError(err)) { setQuotaExhausted(true); console.warn('⚠️ Firestore kota aşımı — offline mod aktif'); }
        });
      } else {
        const data = docSnap.data() as any;
        if (data.lastResetDate !== today) {
          await updateDoc(userRef, { dailyUsage: 0, lastResetDate: today }).catch(err => {
            if (isQuotaError(err)) { setQuotaExhausted(true); }
          });
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
    }, (error) => {
      if (isQuotaError(error)) {
        setQuotaExhausted(true);
        console.warn('⚠️ Firestore kota aşımı — kullanıcı dinleyicisi durduruldu');
        unsubscribe();
      } else {
        console.error('Firestore kullanıcı hatası:', error);
      }
    });

    return () => unsubscribe();
  }, [user, isAdmin]);

  // Load Projects (tek seferlik okuma — kota dostu)
  useEffect(() => {
    if (!user || isQuotaExhausted()) return;
    const fetchProjects = async () => {
      try {
        const q = query(
          collection(db, 'projects'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        setProjects(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Project)));
      } catch (error: any) {
        if (isQuotaError(error)) {
          setQuotaExhausted(true);
          console.warn('⚠️ Firestore kota aşımı — projeler yüklenemedi');
        } else {
          console.error('Proje yükleme hatası:', error);
        }
      }
    };
    fetchProjects();
  }, [user]);

  // Load System Settings (tek seferlik okuma — kota dostu)
  useEffect(() => {
    if (isQuotaExhausted()) return;
    const fetchSettings = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'settings', 'system'));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSystemSettings(prev => ({ ...prev, ...data }));
          setLocalAuditorSensitivity(data.auditorSensitivity || 70);
        }
      } catch (error: any) {
        if (isQuotaError(error)) {
          setQuotaExhausted(true);
          console.warn('⚠️ Firestore kota aşımı — ayarlar yüklenemedi');
        } else {
          console.error('Ayar yükleme hatası:', error);
        }
      }
    };
    fetchSettings();
  }, []);

  // Real-time AI Score
  useEffect(() => {
    if (!inputText.trim() || inputText.length < 50) {
      setRealtimeScore(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        if (activeTab === 'editor') {
          const res = await detectAI(inputText, localAuditorSensitivity, systemSettings.auditorModel);
          setRealtimeScore(res.score);
        }
      } catch (err) { console.error(err); }
    }, 5000);
    return () => clearTimeout(timer);
  }, [inputText, activeTab]);

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
    console.log("handleHumanize tetiklendi", { hasInput: !!inputText.trim(), hasUser: !!user, hasAppUser: !!appUser });
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
    setProcessingStatus(systemSettings.sentinelEnabled ? 'Canlı Kaynak Taraması Yapılıyor...' : 'Yapay Zeka analizi yapılıyor...');
    try {
      // 1. Sentinel İntihal Kontrolü
      const plagiarismReport = await verifyPlagiarism(inputText, systemSettings.sentinelEnabled);
      
      if (systemSettings.sentinelEnabled) {
        setProcessingStatus('Yapay Zeka analizi ve insanlaştırma yapılıyor...');
      }

      // 2. Gemini İnsanlaştırma
      console.log("Gemini işlemi başlatılıyor...", { model: systemSettings.ghostWriterModel });
      const result = await analyzeAndHumanize(inputText, options, systemSettings.ghostWriterModel);
      console.log("Gemini işlemi tamamlandı:", result);
      
      const combinedResult: CombinedAnalysisResult = {
        ...result,
        similarityScore: plagiarismReport.similarityScore,
        sources: plagiarismReport.sources,
        isPlagiarized: plagiarismReport.similarityScore > 20
      };

      setHumanizedText(combinedResult.humanizedText);
      setAnalysis(combinedResult);

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { 
        dailyUsage: (appUser.dailyUsage || 0) + 1,
        'onboarding.firstHumanize': true
      });

      await sendAnonymousFeedback(inputText.length, combinedResult.humanizedText.length, combinedResult.aiScore, options.tone);

      await addDoc(collection(db, 'projects'), {
        userId: user.uid,
        title: inputText.slice(0, 30) + '...',
        originalText: inputText,
        humanizedText: combinedResult.humanizedText,
        tone: options.tone,
        intensity: options.intensity,
        aiScore: combinedResult.aiScore,
        plagiarismScore: combinedResult.similarityScore,
        isDraft: false,
        insights: combinedResult.insights,
        sentenceScores: combinedResult.sentenceScores,
        metrics: combinedResult.metrics,
        createdAt: serverTimestamp(),
        sources: combinedResult.sources || []
      });

      toast.success("Metin dönüştürüldü");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  const handleAnalyze = async () => {
    if (!inputText.trim() || !user) {
      toast.error("Lütfen analiz için bir metin girin.");
      return;
    }

    setIsAnalyzing(true);
    try {
      const [suggestions, deepML, audit, factCheck] = await Promise.all([
        checkGrammar(inputText),
        performDeepMLAnalysis(inputText),
        detectAI(inputText, localAuditorSensitivity, systemSettings.auditorModel),
        verifyFactCheck(inputText)
      ]);

      setGrammarSuggestions(suggestions);
      setMlAnalysis(deepML);
      setFactCheckResult(factCheck);
      
      // Audit sonuçlarına yerel ML metriklerini enjekte et (Daha isabetli Türkçe endeksleri için)
      if (audit && deepML) {
        (audit.metrics as any).atesman = deepML.metrics.atesman;
        (audit.metrics as any).cetinkayaUzun = deepML.metrics.cetinkayaUzun;
      }
      
      setAuditorResult(audit);
      setShowInputHeatmap(true);

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { 'onboarding.firstAnalysis': true });

      toast.success("Derin analiz tamamlandı.");
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

  const handleDeleteProject = async (id: string, title: string) => {
    if (!window.confirm(`"${title}" kaydını silmek istediğinizden emin misiniz?`)) return;
    
    try {
      await deleteDoc(doc(db, 'projects', id));
      toast.success("Kayıt silindi");
      // Listeyi güncelle (onSnapshot yoksa manuel, ama onSnapshot var sanıyordum)
      setProjects(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error(err);
      toast.error("Silme işlemi başarısız");
    }
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
    <div className="flex h-screen bg-brand-bg text-white font-sans overflow-hidden relative">
      <Toaster position="bottom-right" />

      {/* Sidebar Mobile Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-80 border-r border-brand-border bg-brand-card flex flex-col z-[70] transition-transform duration-300 lg:relative lg:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
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
            <button 
              onClick={() => { 
                setInputText(''); 
                setHumanizedText(''); 
                setAnalysis(null); 
                setGrammarSuggestions([]); 
                setActiveTab('editor');
                if (window.innerWidth < 1024) setIsSidebarOpen(false);
              }} 
              className="p-1.5 hover:bg-white/5 rounded-lg border border-white/5"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden ml-2 p-1.5 hover:bg-white/5 rounded-lg border border-white/5 text-gray-400"
            >
              <X className="w-4 h-4" />
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
                      similarityScore: p.plagiarismScore || 0,
                      sentenceScores: p.sentenceScores || [],
                      metrics: p.metrics || {
                        readability: 0,
                        complexity: 'Bilinmiyor',
                        toneStrength: 0,
                        grammarScore: 0,
                        wordCount: 0,
                        readingTime: '0 dk'
                      }
                    });
                  } else {
                    setAnalysis(null);
                  }
                  setActiveTab('editor');
                  if (window.innerWidth < 1024) setIsSidebarOpen(false);
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
              <button 
                onClick={() => {
                  setActiveTab('admin');
                  if (window.innerWidth < 1024) setIsSidebarOpen(false);
                }} 
                className="w-full py-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-500/20 transition-all"
              >
                Admin Paneli
              </button>
              <button onClick={downloadTrainingData} className="w-full py-2.5 bg-blue-500/10 text-blue-400 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-500/20 transition-all flex items-center justify-center gap-2"><Database className="w-3 h-3" /> Veri İndir</button>
            </>
          )}
          <div className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-2xl border border-white/5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 flex-shrink-0"><UserIcon className="w-4 h-4 text-emerald-500" /></div>
            <div className="flex-1 truncate"><div className="text-[10px] font-bold truncate opacity-80">{user?.email}</div><div className="text-[9px] text-gray-600 font-black uppercase tracking-tighter">{appUser?.plan || 'Free'} Planı</div></div>
            <button onClick={() => signOut(auth)} className="p-1.5 hover:text-white text-gray-600 flex-shrink-0"><LogOut className="w-4 h-4" /></button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden h-full">
        {activeTab === 'admin' && isAdmin ? (
          <div className="flex-1 overflow-y-auto custom-scrollbar relative z-30 bg-brand-bg">
            <header className="h-16 border-b border-brand-border px-4 lg:px-8 flex items-center justify-between bg-brand-card/50 backdrop-blur-xl sticky top-0 z-40">
              <div className="flex items-center gap-3">
                <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 lg:hidden text-gray-400 hover:text-white transition-colors">
                  <Menu className="w-6 h-6" />
                </button>
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <h2 className="text-lg lg:text-xl font-black text-white tracking-tighter uppercase">Yönetim</h2>
              </div>
              <button 
                onClick={() => setActiveTab('editor')}
                className="p-2 hover:bg-white/5 rounded-xl text-gray-500 hover:text-white transition-all border border-white/5 flex items-center gap-2"
              >
                <X className="w-5 h-5" />
              </button>
            </header>
            <div className="p-4 lg:p-8">
              <AdminPanel />
            </div>
          </div>
        ) : (
          <>
            <header className="h-auto min-h-[5rem] lg:h-20 border-b border-brand-border px-4 lg:px-8 py-3 flex flex-col lg:flex-row items-start lg:items-center justify-between bg-brand-card/50 backdrop-blur-xl relative z-40 gap-4">
              <div className="flex items-center gap-4 lg:gap-10 w-full lg:w-auto">
                <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 lg:hidden text-gray-400 hover:text-white transition-colors shrink-0">
                  <Menu className="w-6 h-6" />
                </button>
                
                <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-10 flex-1 lg:flex-none">
                  {/* Tone Selection */}
                  <div className="relative">
                      <div className="flex items-center gap-2 mb-2">
                        <Settings2 className="w-3.5 h-3.5 text-gray-500" />
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">ÜST TON SEÇİMİ</span>
                        <InfoTooltip text="Yazının hedef kitlesine göre stilini belirler. Akademik, samimi veya profesyonel gibi farklı tonlar arasından seçim yapabilirsiniz." position="bottom" />
                      </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setIsToneDropdownOpen(!isToneDropdownOpen)}
                        className="flex items-center gap-2 text-base lg:text-xl font-black text-white hover:text-gray-300 transition-colors uppercase tracking-tight"
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

                  <div className="hidden lg:block w-px h-10 bg-white/10 mx-2" />

                  {/* Intensity Selection */}
                  <div className="w-full lg:w-72">
                    <div className="flex items-center justify-between lg:justify-start gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">RADİKAL İNSANLAŞTIRMA ({options.intensity}%)</span>
                        <InfoTooltip text="YZ izlerini silme derinliği. Yüksek oranlar daha fazla yapısal değişiklik yapar ancak metnin anlamını korur." position="bottom" />
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={options.intensity}
                      onChange={(e) => setOptions({ ...options, intensity: parseInt(e.target.value) })}
                      className="w-full h-1.5 accent-emerald-500 bg-white/10 rounded-full cursor-pointer"
                    />
                    <div className="mt-1.5 text-[9px] text-gray-500 uppercase font-bold leading-tight hidden lg:block">
                      DERİN YAPISAL DEĞİŞİKLİKLER VE YOĞUN DİLBİLGSEL NÜANS.
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
                <button onClick={() => setShowPlansModal(true)} className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full text-[10px] font-bold uppercase tracking-widest"><Crown className="w-3 h-3" /> <span className="hidden sm:inline">Yükselt</span></button>
                <button onClick={handleHumanize} disabled={isProcessing || !inputText.trim()} className="flex-1 lg:flex-none px-6 py-2.5 bg-emerald-500 text-black rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-emerald-400 shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2">{isProcessing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} İnsanlaştır</button>
              </div>
            </header>

            <div className="flex-1 p-4 lg:p-6 flex flex-col lg:flex-row gap-4 lg:gap-6 overflow-hidden relative z-10">
              <div className="flex-1 flex flex-col gap-4 lg:gap-6 min-w-0 h-full overflow-y-auto lg:overflow-hidden custom-scrollbar pb-20 lg:pb-0">
                <div className="min-h-[300px] lg:flex-1 glass-panel rounded-[24px] flex flex-col overflow-hidden">
                  <div className="px-4 py-2 border-b border-brand-border flex justify-between items-center bg-black/10">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-gray-500 flex items-center">Giriş metni <InfoTooltip text="Metninizi buraya yapıştırarak analiz ve insanlaştırma sürecini başlatabilirsiniz." position="bottom" /></span>
                      {realtimeScore !== null && <div className="flex items-center gap-1.5"><div className="w-10 lg:w-16 h-1 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-red-500" style={{ width: `${realtimeScore * 100}%` }} /></div><span className="text-[8px] text-gray-500">%{Math.round(realtimeScore * 100)} YZ</span></div>}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={saveDraft} disabled={isDrafting || !inputText.trim()} className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-bold text-gray-400 hover:bg-white/10 transition-all disabled:opacity-50">
                        <Save className="w-2.5 h-2.5" /> <span className="hidden sm:inline">Taslak</span> <InfoTooltip text="Çalışmanızı daha sonra devam etmek üzere yerel veritabanına kaydeder." position="bottom" />
                      </button>
                      <button 
                        onClick={() => setShowInputHeatmap(!showInputHeatmap)} 
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold transition-all",
                          showInputHeatmap ? "bg-emerald-500 text-black" : "bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10"
                        )}
                      >
                        <Highlighter className="w-2.5 h-2.5" /> Isı haritası <InfoTooltip text="Metindeki her bir cümlenin YZ olasılığını görsel olarak renklendirir. Kırmızı bölgeler en yüksek riskli kısımları gösterir." position="bottom" />
                      </button>
                      <button onClick={handleAnalyze} disabled={isAnalyzing || !inputText.trim()} className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[9px] font-bold text-emerald-500 hover:bg-emerald-500/20 transition-all disabled:opacity-50">
                        {isAnalyzing ? <RefreshCw className="w-2.5 h-2.5 animate-spin" /> : <ShieldCheck className="w-2.5 h-2.5" />} DENETÇİ
                      </button>
                    </div>
                  </div>
                  <div className="relative flex-1">
                    <textarea ref={textareaRef} value={inputText} onScroll={handleScroll} onChange={(e) => setInputText(e.target.value)} className="absolute inset-0 w-full h-full p-4 lg:p-6 bg-transparent outline-none resize-none text-gray-300 leading-relaxed text-sm z-10 custom-scrollbar" placeholder="Metninizi buraya yapıştırın..." />
                    <div ref={backdropRef} className="absolute inset-0 w-full h-full p-4 lg:p-6 text-sm leading-relaxed pointer-events-none whitespace-pre-wrap break-words text-transparent z-0 overflow-y-auto custom-scrollbar">
                      {inputOverlay}
                    </div>
                  </div>
                </div>

                <div className="min-h-[300px] lg:flex-1 glass-panel rounded-[24px] flex flex-col overflow-hidden">
                  <div className="px-4 py-2 border-b border-brand-border flex justify-between items-center bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-gray-500 flex items-center">Sonuç <InfoTooltip text="İşlenmiş, insanileştirilmiş ve YZ izlerinden arındırılmış metnin nihai hali." position="bottom" /></span>
                      {analysis && (
                        <div className="flex bg-white/5 p-0.5 rounded-lg border border-white/10">
                          <button 
                            onClick={() => setShowHeatmap(false)}
                            className={cn("px-2 py-1 text-[8px] font-bold rounded-md transition-all", !showHeatmap ? "bg-emerald-500 text-black" : "text-gray-500")}
                          >METİN</button>
                          <button 
                            onClick={() => setShowHeatmap(true)}
                            className={cn("px-2 py-1 text-[8px] font-bold rounded-md transition-all", showHeatmap ? "bg-emerald-500 text-black" : "text-gray-500")}
                          >ISI HARİTASI</button>
                        </div>
                      )}
                    </div>
                    <button onClick={() => copyToClipboard(humanizedText)} className="p-1.5 text-gray-500 hover:text-emerald-500 transition-colors"><Copy className="w-3.5 h-3.5" /></button>
                  </div>
                  <div className="flex-1 p-4 lg:p-6 overflow-y-auto text-gray-300 leading-relaxed text-sm custom-scrollbar bg-emerald-500/[0.01]">
                    {isProcessing ? (
                      <div className="flex flex-col items-center justify-center h-full space-y-4">
                        <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
                        <span className="text-gray-400 font-medium">{processingStatus || "Dönüştürülüyor..."}</span>
                      </div>
                    ) : (
                      <div className="prose prose-invert max-w-none prose-sm lg:prose-base">
                        {showHeatmap && analysis?.sentenceScores ? (
                          <HeatmapText text={humanizedText} sentenceScores={analysis.sentenceScores} />
                        ) : (
                          <ReactMarkdown>{humanizedText || "_Sonuç burada görünecek..._"}</ReactMarkdown>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Mobile Analytics Toggle (Only visible on mobile) */}
                <div className="lg:hidden space-y-4">
                  <div className="p-6 glass-panel rounded-[24px] space-y-6">
                    <h3 className="text-[12px] font-bold text-gray-400 flex items-center gap-2"><Gauge className="w-4 h-4 text-emerald-500" /> Analitik rapor</h3>
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
                  
                  {/* Other Analytics cards also shown here on mobile if they have content */}
                  {((analysis?.insights && analysis.insights.length > 0) || grammarSuggestions.length > 0) && (
                    <div className="glass-panel rounded-[24px] p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-gray-200 flex items-center gap-2"><Search className="w-4 h-4 text-emerald-500" /> Detaylar</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-[8px] text-gray-500 font-bold">A</span>
                          <input type="range" min="12" max="24" value={detailsFontSize} onChange={(e) => setDetailsFontSize(Number(e.target.value))} className="w-24 h-1 accent-emerald-500 bg-white/10 rounded-full cursor-pointer" title="Yazı boyutunu ayarla" />
                          <span className="text-[12px] text-gray-500 font-bold">A</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {grammarSuggestions.map((s, i) => (
                          <div key={`gram-${i}`} className="p-3 bg-red-500/5 rounded-xl border border-red-500/10 space-y-1" style={{ fontSize: `${detailsFontSize}px` }}>
                            <div className="font-bold text-emerald-400 cursor-pointer hover:underline" onClick={() => applyGrammarCorrection(s)}>➜ {s.suggestion}</div>
                            <div className="text-gray-500 text-[0.9em] italic">{s.explanation}</div>
                            <div className="text-gray-600 line-through truncate opacity-30 text-[0.8em]">{s.original}</div>
                          </div>
                        ))}
                        {analysis?.insights?.map((ins, i) => (
                          <div key={`ins-${i}`} className="p-3 bg-white/[0.02] rounded-xl border-l-2 border-emerald-500/30 leading-relaxed transition-all" style={{ fontSize: `${detailsFontSize}px` }}>
                            <div className="text-emerald-500/60 mb-1">"{ins.sentence}"</div>
                            <div className="text-gray-500 italic">{ins.detail}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mobile Fact Check */}
                  {factCheckResult && (
                    <div className="glass-panel rounded-[24px] p-6 space-y-4">
                      <h3 className="text-sm font-bold text-gray-200 flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-500" /> Doğruluk kontrolü
                      </h3>
                      <div className="text-center py-2">
                        <div className="text-3xl font-black text-white">%{Math.round(factCheckResult.confidenceScore * 100)}</div>
                        <div className="text-[9px] font-bold text-gray-500 uppercase">Güven skoru</div>
                      </div>
                      <div className="space-y-2">
                        {factCheckResult.claims.map((claim, idx) => (
                          <div key={idx} className="p-3 bg-white/[0.02] rounded-xl border border-white/5 space-y-2">
                            <div className="flex justify-between items-start gap-2">
                              <div className="text-[10px] text-gray-300 leading-relaxed">"{claim.claim}"</div>
                              <span className={cn(
                                "text-[7px] font-black uppercase px-1.5 py-0.5 rounded-full shrink-0",
                                claim.status === 'Verified' ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                                claim.status === 'Disputed' ? "bg-red-500/10 text-red-500 border border-red-500/20" :
                                "bg-gray-500/10 text-gray-500 border border-gray-500/20"
                              )}>
                                {claim.status === 'Verified' ? 'DOĞRULANDI' : claim.status === 'Disputed' ? 'TARTIŞMALI' : 'BELİRSİZ'}
                              </span>
                            </div>
                            {claim.source && (
                              <a href={claim.source} target="_blank" rel="noopener noreferrer" className="text-[8px] text-blue-400 truncate block">
                                {claim.source}
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Desktop Analytics Panel */}
              <div className="hidden lg:flex w-80 flex-col gap-6 shrink-0 overflow-y-auto custom-scrollbar pb-8 relative z-20">
                <div className="p-6 glass-panel rounded-[24px] space-y-6 overflow-visible">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[12px] font-bold text-gray-400 flex items-center gap-2">
                      <Gauge className="w-4 h-4 text-emerald-500/70" /> 
                      <InfoTooltip text="Metnin genel yapısını, YZ olasılığını ve kaynak benzerliğini kapsayan detaylı analiz raporu." position="bottom" />
                      Denetçi raporu 
                    </h3>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-gray-600 uppercase tracking-wider">Hassasiyet</span>
                        <InfoTooltip text="Analiz derinliğini ve katılık oranını belirler. Yüksek değerler daha ince yapısal benzerlikleri yakalar." position="bottom" />
                        <span className="text-[10px] font-mono text-emerald-500 font-bold">%{localAuditorSensitivity}</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" max="100" 
                        value={localAuditorSensitivity}
                        onChange={(e) => setLocalAuditorSensitivity(parseInt(e.target.value))}
                        className="w-24 h-1 accent-emerald-500 bg-white/10 rounded-full cursor-pointer"
                      />
                    </div>
                  </div>
                  {auditorResult ? (
                    <div className="space-y-4">
                      <div className="flex flex-col items-center mb-6">
                        <ScoreCircle score={auditorResult.score} label="YZ Olasılığı" size={140} />
                      </div>
                      
                      <div className="grid grid-cols-1 gap-4">
                        <div className="relative">
                          <AuditMetricCard 
                            title={
                              <div className="flex items-center gap-1.5">
                                <InfoTooltip text="Gelişmiş ML modelleri ile metnin yazım stilini inceleyerek yapay zeka olasılığını hesaplar." position="bottom" />
                                YZ tespiti
                              </div>
                            }
                            value={`%${Math.round(auditorResult.score * 100)}`}
                            percentage={auditorResult.score}
                            icon={ShieldCheck}
                            color="text-red-500"
                            detail={auditorResult.score > 0.7 ? "Yüksek ihtimalle YZ" : "Doğal içerik yapısı"}
                          />
                        </div>
                        
                        <div className="relative">
                          <AuditMetricCard 
                            title={
                              <div className="flex items-center gap-1.5">
                                <InfoTooltip text="Metnin internet üzerindeki kaynaklarla olan benzerlik oranını ölçer." position="bottom" />
                                İntihal
                              </div>
                            }
                            value={`%${Math.round(auditorResult.metrics.plagiarism * 100)}`}
                            percentage={auditorResult.metrics.plagiarism}
                            icon={Search}
                            color="text-amber-500"
                            detail="Canlı kaynak eşleşmesi"
                          />
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                          <div className="relative">
                            <AuditMetricCard 
                              title={
                                <div className="flex items-center gap-1.5">
                                  <InfoTooltip text="Metnin Türkçe hece ve cümle yapısına göre okunabilirlik düzeyini ölçer." position="bottom" />
                                  Ateşman
                                </div>
                              }
                              value={auditorResult.metrics.atesman.toString()}
                              percentage={Math.min(1, auditorResult.metrics.atesman / 100)}
                              icon={Gauge}
                              color="text-blue-500"
                              detail="Akıcılık Skoru"
                              trend={auditorResult.metrics.atesman > 60 ? 'up' : 'down'}
                            />
                          </div>
                          <div className="relative">
                            <AuditMetricCard 
                              title={
                                <div className="flex items-center gap-1.5">
                                  <InfoTooltip text="Cümle uzunluğu ve sözcük karmaşıklığına dayalı yapısal zorluk endeksi." position="bottom" />
                                  Çetinkaya
                                </div>
                              }
                              value={auditorResult.metrics.cetinkayaUzun.toString()}
                              percentage={Math.min(1, auditorResult.metrics.cetinkayaUzun / 100)}
                              icon={Layers}
                              color="text-purple-500"
                              detail="Yapısal Zorluk"
                              trend={auditorResult.metrics.cetinkayaUzun < 50 ? 'up' : 'down'}
                            />
                          </div>
                        </div>

                        {/* Fact Check Section */}
                        {factCheckResult ? (
                          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-4 space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-emerald-500/10 rounded-xl"><Check className="w-5 h-5 text-emerald-500" /></div>
                                <div>
                                  <div className="text-[12px] font-bold text-gray-400">Doğruluk kontrolü</div>
                                  <div className="text-[11px] font-bold text-white/80">Güven Skoru: %{Math.round(factCheckResult.confidenceScore * 100)}</div>
                                </div>
                              </div>
                              <InfoTooltip text="Metindeki iddiaların güvenilir kaynaklarla karşılaştırılarak doğruluk oranının tespiti." position="bottom" />
                            </div>
                            
                            <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                              {factCheckResult.claims.map((claim, idx) => (
                                <div key={idx} className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-2 group hover:bg-white/10 transition-all">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="text-[11px] text-gray-200 leading-relaxed font-semibold">"{claim.claim}"</div>
                                    <span className={cn(
                                      "text-[8px] font-black uppercase px-2 py-0.5 rounded-full shrink-0",
                                      claim.status === 'Verified' ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                                      claim.status === 'Disputed' ? "bg-red-500/10 text-red-500 border border-red-500/20" :
                                      "bg-gray-500/10 text-gray-500 border border-gray-500/20"
                                    )}>
                                      {claim.status === 'Verified' ? 'DOĞRULANDI' : claim.status === 'Disputed' ? 'TARTIŞMALI' : 'BELİRSİZ'}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-gray-400 italic mb-1">{claim.explanation}</div>
                                  {claim.source && (
                                    <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                                      <ExternalLink className="w-3 h-3 text-emerald-400" />
                                      <a href={claim.source} target="_blank" rel="noopener noreferrer" className="text-[10px] text-emerald-400 hover:text-emerald-300 hover:underline truncate block flex-1 font-bold">
                                        Kaynağı Görüntüle
                                      </a>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="bg-white/[0.02] border border-dashed border-white/10 rounded-2xl p-4 flex items-center justify-between opacity-50 grayscale hover:grayscale-0 transition-all">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-white/5 rounded-xl"><Check className="w-4 h-4 text-gray-500" /></div>
                              <div>
                                <div className="text-[9px] font-black uppercase text-gray-500">Doğruluk Kontrolü</div>
                                <div className="text-[10px] font-bold text-gray-600">{isAnalyzing ? 'İddialar Taranıyor...' : 'Analiz Bekleniyor'}</div>
                              </div>
                            </div>
                            {isAnalyzing ? <RefreshCw className="w-3 h-3 text-emerald-500 animate-spin" /> : <ShieldCheck className="w-3 h-3 text-gray-700" />}
                          </div>
                        )}

                        <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                          <div className="text-[12px] font-bold text-gray-400 mb-4 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-amber-500/70" /> Denetçi mantığı (Muhakeme)
                          </div>
                          <div className="text-[15px] text-gray-300 leading-relaxed italic border-l-3 border-emerald-500/40 pl-4 py-1">
                            "{auditorResult.reasoning}"
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : analysis ? (
                    <div className="space-y-6">
                      <div className="text-center"><div className="text-4xl font-black text-emerald-500">%{Math.round((1 - (analysis.aiScore || 0)) * 100)}</div><div className="text-[10px] font-bold text-gray-500 uppercase mt-1">İnsan Benzerliği</div></div>
                      <div className="grid grid-cols-2 gap-3">
                        <AuditMetricCard 
                          title="İNTİHAL"
                          value={`%${analysis.similarityScore || 0}`}
                          percentage={(analysis.similarityScore || 0) / 100}
                          icon={Search}
                          color="text-red-400"
                        />
                        <AuditMetricCard 
                          title="YZ SKORU"
                          value={(analysis.aiScore || 0).toFixed(2)}
                          percentage={analysis.aiScore || 0}
                          icon={ShieldCheck}
                          color="text-gray-400"
                        />
                      </div>
                    </div>
                  ) : <div className="text-[10px] text-gray-600 italic text-center py-10">Analiz başlatmak için metin girin...</div>}
                </div>

                {/* Deep Metrics Card */}
                {mlAnalysis && (
                  <div className="p-6 glass-panel rounded-[24px] space-y-5 overflow-visible">
                    <h3 className="text-[12px] font-bold text-gray-400 flex items-center">
                      <BarChart3 className="w-4 h-4 text-emerald-500/70 mr-2" /> 
                      <InfoTooltip text="Metnin dilbilgisel yapısı ve okunabilirlik endeksleri hakkında teknik döküm." position="bottom" />
                      Derin metrikler 
                    </h3>
                    <div className="space-y-4">
                      <MetricProgress 
                        icon={Highlighter} 
                        label="Okunabilirlik (TR)" 
                        value={`%${Math.round(mlAnalysis.readabilityScore * 100)}`} 
                        percentage={mlAnalysis.readabilityScore} 
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl">
                          <div className="text-[8px] text-gray-600 font-bold uppercase mb-1">Hece Yoğunluğu</div>
                          <div className="text-xs font-black text-emerald-400">{(mlAnalysis.metrics.syllableCount / (mlAnalysis.metrics.wordCount || 1)).toFixed(2)}</div>
                        </div>
                        <div className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl">
                          <div className="text-[8px] text-gray-600 font-bold uppercase mb-1">Kelime/Cümle</div>
                          <div className="text-xs font-black text-gray-300">{(mlAnalysis.metrics.wordCount / (mlAnalysis.metrics.sentenceCount || 1)).toFixed(1)}</div>
                        </div>
                      </div>
                      <div className="pt-2">
                        <div className="text-[8px] text-gray-600 font-bold uppercase mb-2">Tavsiyeler</div>
                        <div className="space-y-2">
                          {mlAnalysis.recommendations.map((rec, i) => (
                            <div key={i} className="text-[10px] text-gray-400 flex gap-2">
                              <span className="text-emerald-500">•</span>
                              <span>{rec}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sources Card */}
                {analysis?.sources && analysis.sources.length > 0 && (
                  <div className="p-6 glass-panel rounded-[24px] space-y-4 border border-red-500/10 overflow-visible">
                    <h3 className="text-[11px] font-black text-red-500/70 uppercase tracking-[0.2em] flex items-center">
                      <AlertCircle className="w-4 h-4 mr-2" /> 
                      <InfoTooltip text="İnternet üzerindeki milyarlarca kaynak taranarak bulunan benzerliklerin detaylı dökümü." position="bottom" />
                      İNTİHAL TESPİTİ 
                    </h3>
                    <div className="space-y-3">
                      {analysis.sources.map((src, i) => (
                        <div key={i} className="bg-red-500/5 p-4 rounded-xl border border-red-500/10 group hover:bg-red-500/10 transition-all">
                          <div className="flex justify-between items-start gap-2 mb-2">
                            <div className="text-[11px] font-bold text-gray-200 leading-tight flex-1">{src.title}</div>
                            <div className="text-[11px] font-black text-red-400 shrink-0 bg-red-500/10 px-2 py-0.5 rounded-lg">%{src.similarity || 0}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <ExternalLink className="w-3 h-3 text-blue-400" />
                            <a href={src.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-400 hover:text-blue-300 hover:underline block truncate font-bold">
                              Kanıtı İncele (Link)
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex-1 glass-panel rounded-[24px] p-6 flex flex-col gap-4 overflow-visible min-h-[300px]">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center">
                      <Search className="w-3 h-3 text-emerald-500 mr-2" /> 
                      <InfoTooltip text="Dilbilgisi hataları, öneriler ve Hayalet Yazar'ın yaptığı yapısal değişikliklerin dökümü." position="bottom" />
                      Detaylar 
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] text-gray-500 font-bold">A</span>
                      <input type="range" min="12" max="24" value={detailsFontSize} onChange={(e) => setDetailsFontSize(Number(e.target.value))} className="w-24 h-1 accent-emerald-500 bg-white/10 rounded-full cursor-pointer" title="Yazı boyutunu ayarla" />
                      <span className="text-[12px] text-gray-500 font-bold">A</span>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
                    {grammarSuggestions.map((s, i) => (
                      <div key={`gram-dt-${i}`} className="p-3 bg-red-500/5 rounded-xl border border-red-500/10 space-y-1" style={{ fontSize: `${detailsFontSize}px` }}>
                        <div className="font-bold text-emerald-400 cursor-pointer hover:underline" onClick={() => applyGrammarCorrection(s)}>➜ {s.suggestion}</div>
                        <div className="text-gray-500 text-[0.9em] italic">{s.explanation}</div>
                        <div className="text-gray-600 line-through truncate opacity-30 text-[0.8em]">{s.original}</div>
                      </div>
                    ))}
                    {analysis?.insights && analysis.insights.length > 0 ? (
                      analysis.insights.map((ins, i) => (
                        <div key={`ins-dt-${i}`} className="p-3 bg-white/[0.02] rounded-xl border-l-2 border-emerald-500/30 leading-relaxed transition-all" style={{ fontSize: `${detailsFontSize}px` }}>
                          <div className="text-emerald-500/60 mb-1">"{ins.sentence}"</div>
                          <div className="text-gray-500 italic">{ins.detail}</div>
                        </div>
                      ))
                    ) : grammarSuggestions.length === 0 && (
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
            onApply={(name, description) => {
              setOptions({ 
                ...options, 
                tone: name || 'Özel', 
                customToneName: name,
                customToneDescription: description 
              });
              setShowCustomToneModal(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
