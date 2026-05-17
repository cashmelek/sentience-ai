import React, { useState, useEffect, useRef, useLayoutEffect, lazy, Suspense, useCallback } from 'react';
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
  ExternalLink,
  GraduationCap
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
  getDoc,
  writeBatch
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
import { db, auth, isQuotaError, setQuotaExhausted, isQuotaExhausted, resetQuotaStatus } from './lib/firebase';
import {
  analyzeAndHumanize,
  HumanizeOptions,
  AnalysisResult,
  checkGrammar,
  GrammarSuggestion,
  detectAI,
  translateError
} from './services/geminiService';
import {
  performDeepMLAnalysis,
  MLAnalysisResult,
  sendAnonymousFeedback,
  calculateQualityScore
} from './services/mlService';
import { cn } from './lib/utils';
import ReactMarkdown from 'react-markdown';
import { saveAs } from 'file-saver';
const PlansModal = lazy(() => import('./components/PlansModal').then(m => ({ default: m.PlansModal })));
const AdminPanel = lazy(() => import('./components/AdminPanel').then(m => ({ default: m.AdminPanel })));
const CustomToneModal = lazy(() => import('./components/CustomToneModal').then(m => ({ default: m.CustomToneModal })));
const GuideModal = lazy(() => import('./components/GuideModal').then(m => ({ default: m.GuideModal })));
const AccountSettingsModal = lazy(() => import('./components/AccountSettingsModal').then(m => ({ default: m.AccountSettingsModal })));
import toast, { Toaster } from 'react-hot-toast';
import { OnboardingChecklist } from './components/OnboardingChecklist';
import { LandingPage } from './components/LandingPage';
import { verifyPlagiarism, verifyFactCheck, FactCheckReport } from './services/sentinelService';
import { InfoTooltip } from './components/InfoTooltip';

import { AppUser, PLAN_LIMITS, Project } from './types';

export type CombinedAnalysisResult = AnalysisResult & {
  similarityScore?: number;
  sources?: any[];
  isPlagiarized?: boolean;
  matchedPhrases?: { text: string, source: string, score: number }[];
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

const ScoreCircle = ({ score, label, size = 160, color: customColor, inverse = false, type = 'ai' }: { score: number, label: string, size?: number, color?: string, inverse?: boolean, type?: 'ai' | 'plagiarism' }) => {
  const displayScore = inverse ? 1 - score : score;
  const percentage = Math.round(displayScore * 100);
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (displayScore * circumference);

  const isHighRisk = type === 'ai' ? displayScore > 0.7 : displayScore < 0.5;
  const isSafe = type === 'ai' ? displayScore < 0.3 : displayScore > 0.85;
  
  const color = customColor || (isHighRisk ? "#ef4444" : isSafe ? "#10b981" : "#f59e0b");
  const glowColor = isHighRisk ? "rgba(239, 68, 68, 0.3)" : isSafe ? "rgba(16, 185, 129, 0.3)" : "rgba(245, 158, 11, 0.3)";

  const getBadgeText = () => {
    if (type === 'ai') {
      if (displayScore > 0.7) return 'YÜKSEK YZ OLASILIĞI';
      if (displayScore < 0.3) return 'İNSAN YAZIMI DOĞRULANDI';
      return 'KARMA İÇERİK YAPISI';
    } else {
      if (displayScore > 0.85) return 'TAMAMEN ÖZGÜN';
      if (displayScore > 0.5) return 'KISMI BENZERLİK TESPİTİ';
      return 'KRİTİK İNTİHAL RİSKİ';
    }
  };

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
      <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: color }} />
        <span className="text-[10px] font-black uppercase tracking-[0.1em] text-gray-400">
          {getBadgeText()}
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

const HeatmapText = ({ text, sentenceScores }: { text: string, sentenceScores: { sentence: string, score: number, type?: 'ai' | 'human' | 'mixed' | 'plagiarism', reason?: string, source?: string }[] }) => {
  if (!sentenceScores || sentenceScores.length === 0) return <>{text}</>;

  let lastIndex = 0;
  const nodes = [];

  sentenceScores.forEach((item, idx) => {
    const searchStr = item.sentence.trim();
    if (!searchStr) return;

    let index = text.indexOf(searchStr, lastIndex);
    if (index === -1) index = text.indexOf(searchStr);

    if (index !== -1) {
      if (index > lastIndex) {
        nodes.push(<span key={`text-before-${idx}`}>{text.slice(lastIndex, index)}</span>);
      }

      const isPlagiarism = item.type === 'plagiarism';
      const score = item.score;
      let color = 'transparent';
      let borderColor = 'transparent';
      const opacity = isPlagiarism ? 0.25 : 0.4;

      if (isPlagiarism) {
        color = `rgba(249, 115, 22, ${opacity})`; // Orange for plagiarism
        borderColor = `rgba(249, 115, 22, 0.8)`;
      } else if (item.type === 'ai' || score > 0.7) {
        color = `rgba(239, 68, 68, ${opacity})`;
        borderColor = `rgba(239, 68, 68, 0.8)`;
      } else if (item.type === 'mixed' || (score > 0.3 && score <= 0.7)) {
        color = `rgba(245, 158, 11, ${opacity})`;
        borderColor = `rgba(245, 158, 11, 0.8)`;
      } else {
        color = `rgba(16, 185, 129, ${opacity})`;
        borderColor = `rgba(16, 185, 129, 0.8)`;
      }

      nodes.push(
        <span
          key={idx}
          className="transition-all duration-300 px-1 rounded-sm cursor-help group relative inline border-b-2"
          style={{
            backgroundColor: color,
            borderBottomColor: borderColor,
          }}
        >
          {text.slice(index, index + searchStr.length)}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-4 py-3 bg-black border border-white/20 rounded-2xl text-xs opacity-0 group-hover:opacity-100 transition-all pointer-events-auto z-[100] shadow-2xl w-64 backdrop-blur-2xl">
            <div className="flex justify-between items-center mb-2 border-b border-white/10 pb-2">
              <span className="font-black uppercase tracking-widest text-[9px] text-gray-400">
                {isPlagiarism ? 'İntihal Tespiti' : item.type === 'ai' ? 'Yapay Zeka' : 'İnsan Yazımı'}
              </span>
              <span className={cn("font-black", isPlagiarism ? "text-orange-500" : (item.type === 'ai' || score > 0.7) ? "text-red-500" : "text-emerald-500")}>
                %{Math.round(score * 100)}
              </span>
            </div>
            <p className="text-gray-300 font-medium leading-relaxed italic text-[11px] mb-2">
              "{item.reason || (isPlagiarism ? 'Bu ifade internetteki bir kaynakla eşleşiyor.' : 'Cümle yapısı analiz edildi.')}"
            </p>
            {isPlagiarism && item.source && (
              <div className="pt-2 border-t border-white/5">
                <a 
                  href={item.source} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="w-3 h-3" />
                  <span className="text-[10px] font-bold truncate">Kaynağa Git</span>
                </a>
              </div>
            )}
          </div>
        </span>
      );
      lastIndex = index + searchStr.length;
    }
  });

  if (lastIndex < text.length) {
    nodes.push(<span key="text-end">{text.slice(lastIndex)}</span>);
  }

  return (
    <div className="text-gray-300">
      {nodes.length > 0 ? nodes : text}
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
  const [showAccountSettingsModal, setShowAccountSettingsModal] = useState(false);
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
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
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
    maintenanceMessage: 'Size daha iyi bir deneyim sunmak için sistemimizi güncelliyoruz. Lütfen kısa bir süre sonra tekrar deneyin.',
    auditorSensitivity: 70,
    auditorModel: 'gemini-2.0-flash',
    ghostWriterModel: 'gemini-2.0-flash'
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
    highlights?: {
      text: string;
      type: string;
      score: number;
      source?: string;
    }[];
  } | null>(null);
  const [showInputHeatmap, setShowInputHeatmap] = useState(false);
  const [hoveredInsight, setHoveredInsight] = useState<string | null>(null);
  const [factCheckResult, setFactCheckResult] = useState<FactCheckReport | null>(null);

  const ADMIN_EMAILS = ['ismail.kaleci@gmail.com', 'tonguc.urunler@gmail.com', 'yasindemir111@gmail.com'];
  const isAdmin = (user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase())) || appUser?.role === 'admin';

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const hasResetToday = useRef<string | null>(null);

  // Highlighted Text Logic (Grammar + Heatmap + Plagiarism)
  const inputOverlay = React.useMemo(() => {
    if (hoveredInsight || (showInputHeatmap && (auditorResult?.sentenceScores || analysis?.matchedPhrases))) {
      let lastIndex = 0;
      const nodes = [];

      const allMatches: { text: string, score: number, type: 'ai' | 'plagiarism', reason?: string }[] = [];
      
      if (showInputHeatmap && auditorResult?.sentenceScores) {
        auditorResult.sentenceScores.forEach(s => allMatches.push({ text: s.sentence, score: s.score, type: 'ai', reason: s.reason }));
      }
      if (showInputHeatmap && analysis?.matchedPhrases) {
        analysis.matchedPhrases.forEach(m => allMatches.push({ text: m.text, score: m.score, type: 'plagiarism', reason: 'İnternet kaynağı ile eşleşme bulundu.' }));
      }

      if (allMatches.length > 0) {
        const sortedMatches = allMatches
          .map(m => ({ ...m, index: inputText.indexOf(m.text) }))
          .filter(m => m.index !== -1)
          .sort((a, b) => a.index - b.index);

        sortedMatches.forEach((item, idx) => {
          const searchStr = item.text;
          const index = item.index;

          if (index >= lastIndex) {
            if (index > lastIndex) {
              nodes.push(<span key={`text-before-${idx}`}>{inputText.slice(lastIndex, index)}</span>);
            }

            let color = 'transparent';
            const opacity = 0.25;
            
            if (item.type === 'ai') {
              if (item.score > 0.7) color = `rgba(239, 68, 68, ${opacity})`;
              else if (item.score > 0.3) color = `rgba(245, 158, 11, ${opacity})`;
              else color = `rgba(16, 185, 129, ${opacity})`;
            } else {
              color = `rgba(249, 115, 22, ${opacity})`; 
            }

            const isHovered = hoveredInsight && searchStr === hoveredInsight.trim();

            nodes.push(
              <span
                id={isHovered ? "hovered-insight-span" : undefined}
                key={`heat-${idx}`}
                className={cn(
                  "transition-all duration-300 rounded-sm inline",
                  isHovered ? "font-black text-emerald-400" : "cursor-help group relative",
                  item.type === 'plagiarism' ? "border-b-2 border-orange-500/50" : ""
                )}
                style={{
                  backgroundColor: isHovered ? 'rgba(16, 185, 129, 0.2)' : color,
                }}
              >
                {inputText.slice(index, index + searchStr.length)}
                {!isHovered && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-2xl text-xs opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-[100] shadow-2xl w-64 backdrop-blur-xl">
                    <div className="flex justify-between items-center mb-2 border-b border-white/5 pb-2">
                      <span className="font-black uppercase tracking-widest text-[9px] text-gray-500">
                        {item.type === 'ai' ? 'YZ Analizi' : 'İntihal Tespiti'}
                      </span>
                      <span className={cn("font-black", item.type === 'ai' && item.score > 0.7 ? "text-red-500" : "text-orange-500")}>
                        {item.type === 'ai' ? `%${Math.round(item.score * 100)}` : 'EŞLEŞME'}
                      </span>
                    </div>
                    <p className="text-gray-300 font-medium leading-relaxed italic text-[11px]">"{item.reason || 'Analiz edildi.'}"</p>
                  </div>
                )}
              </span>
            );
            lastIndex = index + searchStr.length;
          }
        });
      } else if (hoveredInsight) {
        const searchStr = hoveredInsight.trim();
        const index = inputText.indexOf(searchStr);
        if (index !== -1) {
          if (index > 0) {
            nodes.push(<span key="text-before">{inputText.slice(0, index)}</span>);
          }
          nodes.push(
            <span
              id="hovered-insight-span"
              key="hovered"
              className="transition-all duration-300 rounded-sm inline font-black text-emerald-400"
              style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)' }}
            >
              {inputText.slice(index, index + searchStr.length)}
            </span>
          );
          lastIndex = index + searchStr.length;
        }
      }

      if (lastIndex < inputText.length) {
        nodes.push(<span key="text-end">{inputText.slice(lastIndex)}</span>);
      }

      return nodes.length > 0 ? <>{nodes}</> : inputText;
    }

    if (!grammarSuggestions.length) return inputText;
    
    const sortedSuggestions = [...grammarSuggestions].sort((a, b) => inputText.indexOf(a.original) - inputText.indexOf(b.original));
    
    const nodes = [];
    let lastIndex = 0;
    
    sortedSuggestions.forEach((s, idx) => {
      const index = inputText.indexOf(s.original, lastIndex);
      if (index !== -1) {
        if (index > lastIndex) {
          nodes.push(<span key={`text-${idx}`}>{inputText.slice(lastIndex, index)}</span>);
        }
        nodes.push(
          <span key={`sug-${idx}`} className="bg-red-500/30 border-b border-red-500">
            {inputText.slice(index, index + s.original.length)}
          </span>
        );
        lastIndex = index + s.original.length;
      }
    });
    
    if (lastIndex < inputText.length) {
      nodes.push(<span key="text-end">{inputText.slice(lastIndex)}</span>);
    }
    
    return nodes.length > 0 ? <>{nodes}</> : inputText;
  }, [inputText, grammarSuggestions, showInputHeatmap, auditorResult]);

  const handleScroll = () => {
    if (textareaRef.current && backdropRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop;
      backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const handleInsightHover = (sentence: string) => {
    setHoveredInsight(sentence);
    setTimeout(() => {
      const el = document.getElementById("hovered-insight-span");
      if (el && textareaRef.current) {
        textareaRef.current.scrollTo({
          top: el.offsetTop - 50,
          behavior: 'smooth'
        });
      }
    }, 50);
  };

  useLayoutEffect(() => {
    handleScroll();
  }, [inputText, showInputHeatmap, auditorResult, grammarSuggestions, hoveredInsight]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
      if (u) resetQuotaStatus();
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setAppUser(null);
      hasResetToday.current = null;
      return;
    }

    const fetchAppUser = async () => {
      const userRef = doc(db, 'users', user.uid);
      const today = new Date().toISOString().split('T')[0];

      try {
        const docSnap = await getDoc(userRef);
        if (!docSnap.exists()) {
          const newUser: AppUser = {
            uid: user.uid,
            email: user.email,
            role: isAdmin ? 'admin' : 'user',
            plan: 'free',
            dailyUsage: 0,
            lastResetDate: today,
            createdAt: new Date().toISOString(),
            onboarding: {
              profileComplete: true,
              firstHumanize: false,
              firstAnalysis: false,
              firstDraft: false,
              dismissed: false
            }
          };
          await setDoc(userRef, newUser).catch(err => {
            if (isQuotaError(err)) { setQuotaExhausted(true); }
          });
          setAppUser(newUser);
        } else {
          const data = docSnap.data() as any;
          const userCreatedAt = data.createdAt || new Date().toISOString();
          
          const isHardcodedAdmin = user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase());
          if (isHardcodedAdmin && data.role !== 'admin') {
            await updateDoc(userRef, { role: 'admin' }).catch(console.error);
          }

          if (data.lastResetDate !== today && hasResetToday.current !== today) {
            hasResetToday.current = today;
            await updateDoc(userRef, { dailyUsage: 0, lastResetDate: today, createdAt: userCreatedAt }).catch(err => {
              if (isQuotaError(err)) { setQuotaExhausted(true); }
            });
            setAppUser({ ...data, dailyUsage: 0, lastResetDate: today, createdAt: userCreatedAt } as AppUser);
          } else {
            setAppUser({
              ...data,
              createdAt: userCreatedAt,
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
      } catch (error) {
        if (isQuotaError(error)) {
          setQuotaExhausted(true);
        }
      }
    };

    fetchAppUser();
  }, [user, isAdmin]);

  const fetchProjects = useCallback(async () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, 'projects'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      setProjects(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Project)));
    } catch (error) {
      if (isQuotaError(error)) {
        setQuotaExhausted(true);
      }
    }
  }, [user]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'settings', 'system'));
        if (docSnap.exists()) {
          const data = docSnap.data();
          const normalizedData = {
            ...data,
            auditorModel: (data.auditorModel && data.auditorModel.includes('1.5')) ? 'gemini-2.0-flash' : (data.auditorModel || 'gemini-2.0-flash'),
            ghostWriterModel: (data.ghostWriterModel && data.ghostWriterModel.includes('1.5')) ? 'gemini-2.0-flash' : (data.ghostWriterModel || 'gemini-2.0-flash')
          };
          setSystemSettings(prev => ({ ...prev, ...normalizedData }));
          setLocalAuditorSensitivity((normalizedData as any).auditorSensitivity || 70);
        }
      } catch (error: any) {
        if (isQuotaError(error)) {
          setQuotaExhausted(true);
        }
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (!inputText.trim() || inputText.length < 50) {
      setRealtimeScore(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        if (activeTab === 'editor' && inputText.length > 50) {
          const res = await detectAI(inputText, localAuditorSensitivity, systemSettings.auditorModel);
          setRealtimeScore(res.score);
        }
      } catch (err) { console.error(err); }
    }, 10000); 
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
      toast.error(translateError(error, isAdmin));
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
      toast.error(translateError(error, isAdmin));
    }
  };

  const getCurrentLimit = () => {
    if (!appUser) return PLAN_LIMITS.free.promoChars;
    const planLimits = PLAN_LIMITS[appUser.plan] || PLAN_LIMITS.free;
    const createdDate = new Date(appUser.createdAt || new Date().toISOString());
    const daysSinceCreation = (Date.now() - createdDate.getTime()) / (1000 * 3600 * 24);

    if (daysSinceCreation <= planLimits.promoDays) {
      return planLimits.promoChars;
    }
    return planLimits.dailyChars;
  };

  const currentLimit = getCurrentLimit();
  const currentUsage = appUser?.dailyUsage || 0;
  const remainingChars = isAdmin ? Infinity : Math.max(0, currentLimit - currentUsage);
  const isOverLimit = !isAdmin && inputText.length > (typeof remainingChars === 'number' ? remainingChars : Infinity);

  const handleHumanize = async () => {
    if (!inputText.trim() || !user || !appUser) {
      toast.error("Lütfen bir metin girin.");
      return;
    }

    if (!isAdmin && (appUser.dailyUsage + inputText.length) > currentLimit) {
      setShowPlansModal(true);
      toast.error(`Günlük karakter sınırınızı aştınız. Kalan: ${remainingChars} karakter.`);
      return;
    }

    setIsProcessing(true);
    setProcessingStatus(systemSettings.sentinelEnabled ? 'Canlı Kaynak Taraması Yapılıyor...' : 'Yapay Zeka analizi yapılıyor...');
    try {
      const processWithTimeout = async () => {
        const plagiarismReport = await verifyPlagiarism(inputText, systemSettings.sentinelEnabled);
        if (systemSettings.sentinelEnabled) {
          setProcessingStatus('Yapay Zeka analizi ve insanlaştırma yapılıyor...');
        }
        const result = await analyzeAndHumanize(inputText, options, systemSettings.ghostWriterModel);
        return { plagiarismReport, result };
      };

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("İşlem zaman aşımına uğradı.")), 60000)
      );

      const { plagiarismReport, result } = await Promise.race([processWithTimeout(), timeoutPromise]) as any;

      const combinedResult: CombinedAnalysisResult = {
        ...result,
        similarityScore: plagiarismReport.similarityScore,
        sources: plagiarismReport.sources,
        matchedPhrases: (plagiarismReport as any).matchedPhrases || [],
        isPlagiarized: plagiarismReport.similarityScore > 20
      };

      setHumanizedText(combinedResult.humanizedText);
      setAnalysis(combinedResult);

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        dailyUsage: (appUser.dailyUsage || 0) + inputText.length,
        'onboarding.firstHumanize': true
      });

      await sendAnonymousFeedback(inputText.length, combinedResult.humanizedText.length, combinedResult.aiScore, options.tone);

      const qualityScore = calculateQualityScore(combinedResult.humanizedText, combinedResult.aiScore);

      await addDoc(collection(db, 'projects'), {
        userId: user.uid,
        title: inputText.slice(0, 30) + '...',
        originalText: inputText,
        humanizedText: combinedResult.humanizedText,
        tone: options.tone,
        intensity: options.intensity,
        aiScore: combinedResult.aiScore,
        plagiarismScore: combinedResult.similarityScore,
        qualityScore,
        isTrainingReady: qualityScore >= 70,
        isDraft: false,
        insights: combinedResult.insights,
        sentenceScores: combinedResult.sentenceScores,
        metrics: combinedResult.metrics,
        createdAt: serverTimestamp(),
        sources: combinedResult.sources || []
      });
      fetchProjects();
      
      if (combinedResult.aiScore <= 0.1) {
        toast.custom((t) => (
          <div className={cn("bg-[#1a1f1c] border border-emerald-500/30 p-4 rounded-2xl shadow-2xl flex items-start gap-4 transition-all duration-300 max-w-md", t.visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95')}>
            <div className="bg-emerald-500/20 p-2 rounded-xl"><Sparkles className="w-6 h-6 text-emerald-400" /></div>
            <div className="flex-1">
              <h3 className="text-emerald-400 font-bold text-sm mb-1">Mükemmel Sonuç!</h3>
              <p className="text-gray-300 text-xs leading-relaxed">Metninizdeki tüm yapay zeka izleri temizlendi.</p>
            </div>
            <button onClick={() => toast.dismiss(t.id)} className="text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
        ), { duration: 6000, position: 'top-center' });
      } else {
        toast.success("Analiz tamamlandı!");
      }

    } catch (error: any) {
      toast.error(translateError(error, isAdmin));
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  const handleAnalyze = async () => {
    if (!inputText.trim() || !user || !appUser) {
      toast.error("Lütfen analiz için bir metin girin.");
      return;
    }

    if (!isAdmin && (appUser.dailyUsage + inputText.length) > currentLimit) {
      setShowPlansModal(true);
      toast.error(`Günlük karakter sınırınızı aştınız.`);
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

      if (audit && deepML) {
        (audit.metrics as any).atesman = deepML.metrics.atesman;
        (audit.metrics as any).cetinkayaUzun = deepML.metrics.cetinkayaUzun;
      }

      setAuditorResult(audit);
      setShowInputHeatmap(true);

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        dailyUsage: (appUser.dailyUsage || 0) + inputText.length,
        'onboarding.firstAnalysis': true
      });

      toast.success("Derin analiz tamamlandı.");
    } catch (error: any) {
      toast.error(translateError(error));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const downloadTrainingData = async (onlyTrainingReady: boolean = true) => {
    if (!isAdmin) return;
    try {
      let q;
      if (onlyTrainingReady) {
        q = query(collection(db, 'projects'), where('isTrainingReady', '==', true));
      } else {
        q = query(collection(db, 'projects'));
      }

      const snapshot = await getDocs(q);
      let docs = snapshot.docs;
      
      if (onlyTrainingReady) {
        docs = docs.filter(d => d.data().isTrained !== true);
      }
      
      if (docs.length === 0) {
        toast.error("İndirilecek yeni/uygun veri bulunamadı.");
        return;
      }

      const jsonlData = docs.map(d => {
        const data = d.data();
        return JSON.stringify({
          contents: [
            { role: "user", parts: [{ text: data.originalText }] },
            { role: "model", parts: [{ text: data.humanizedText }] }
          ]
        });
      }).join('\n');

      saveAs(new Blob([jsonlData], { type: 'application/x-jsonlines' }), `tuning_data_${docs.length}.jsonl`);
      toast.success("JSONL indirildi.");

      setTimeout(async () => {
        if (window.confirm(`${docs.length} veriyi 'Eğitildi' olarak işaretle?`)) {
          const batch = writeBatch(db);
          docs.forEach(docSnap => batch.update(docSnap.ref, { isTrained: true, trainedAt: serverTimestamp() }));
          await batch.commit();
          toast.success("İşaretlendi.");
          fetchProjects();
        }
      }, 500);
      
    } catch {
      toast.error("Hata.");
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

      fetchProjects();
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

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;
    if (!window.confirm(`Seçili ${selectedItems.length} kaydı silmek istiyor musunuz?`)) return;

    try {
      await Promise.all(selectedItems.map(id => deleteDoc(doc(db, 'projects', id))));
      setSelectedItems([]);
      fetchProjects();
      toast.success(`${selectedItems.length} kayıt silindi`);
    } catch { toast.error("Toplu silme başarısız"); }
  };

  const handleDeleteProject = async (id: string, title: string) => {
    if (!window.confirm(`"${title}" kaydını silmek istiyor musunuz?`)) return;
    try {
      await deleteDoc(doc(db, 'projects', id));
      fetchProjects();
      toast.success("Silindi");
    } catch { toast.error("Hata"); }
  };

  if (authLoading) return <div className="min-h-screen bg-brand-bg flex items-center justify-center"><RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" /></div>;

  if (systemSettings.maintenanceMode && !isAdmin) {
    return (
      <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center p-6 text-center">
        <Settings2 className="w-16 h-16 text-amber-500 mb-8 animate-pulse" />
        <h1 className="text-3xl font-black text-white mb-4">SİSTEM BAKIMDA</h1>
        <p className="text-gray-400 max-w-md">{systemSettings.maintenanceMessage}</p>
      </div>
    );
  }

  if (!user) return <LandingPage onGetStarted={() => setView('login')} onLogin={() => setView('login')} />;

  const drafts = projects.filter(p => p.isDraft);
  const historyItems = projects.filter(p => !p.isDraft);

  return (
    <div className="flex h-screen bg-brand-bg text-white font-sans overflow-hidden relative">
      <Toaster position="bottom-right" />
      
      <AnimatePresence>
        {isSidebarOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden" />}
      </AnimatePresence>

      <aside className={cn("fixed inset-y-0 left-0 w-80 border-r border-brand-border bg-brand-card flex flex-col z-[70] transition-transform duration-300 lg:relative lg:translate-x-0", isSidebarOpen ? "translate-x-0" : "-translate-x-full")}>
        <div className="p-6 border-b border-brand-border flex items-center justify-between">
          <div className="flex items-center gap-2 font-black tracking-tighter text-xl text-emerald-500"><Fingerprint className="w-6 h-6" /> SENTIENCE</div>
          <div className="flex items-center">
            <button onClick={() => setShowGuideModal(true)} className="p-1.5 hover:bg-white/5 rounded-lg mr-2"><HelpCircle className="w-4 h-4" /></button>
            <button onClick={() => { setInputText(''); setHumanizedText(''); setAnalysis(null); setActiveTab('editor'); }} className="p-1.5 hover:bg-white/5 rounded-lg"><Plus className="w-4 h-4" /></button>
          </div>
        </div>

        {appUser && <OnboardingChecklist user={appUser} />}

        <div className="px-4 py-3 flex gap-2 border-b border-brand-border bg-black/10">
          <button onClick={() => setSidebarTab('history')} className={cn("flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all", sidebarTab === 'history' ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "text-gray-600")}>GEÇMİŞ</button>
          <button onClick={() => setSidebarTab('drafts')} className={cn("flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all", sidebarTab === 'drafts' ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "text-gray-600")}>TASLAKLAR ({drafts.length})</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
          {(sidebarTab === 'history' ? historyItems : drafts).map(p => (
            <div key={p.id} onClick={() => { setInputText(p.originalText); setHumanizedText(p.humanizedText); setActiveTab('editor'); if (window.innerWidth < 1024) setIsSidebarOpen(false); }} className="p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-all flex justify-between items-center group">
              <div className="flex items-center gap-3"><FileText className="w-4 h-4 text-gray-500" /><span className="text-sm text-gray-400 truncate w-32">{p.title}</span></div>
              <button onClick={(e) => { e.stopPropagation(); handleDeleteProject(p.id, p.title); }} className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-brand-border space-y-3 bg-black/20">
          {isAdmin && (
            <>
              <button onClick={() => setActiveTab('admin')} className="w-full py-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-500/20 transition-all">Admin Paneli</button>
              <button onClick={() => downloadTrainingData(true)} className="w-full py-2.5 bg-blue-500/10 text-blue-400 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-500/20 transition-all flex items-center justify-center gap-2"><Database className="w-3 h-3" /> Veri İndir (JSONL)</button>
            </>
          )}
          <div className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-2xl border border-white/5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 flex-shrink-0"><UserIcon className="w-4 h-4 text-emerald-500" /></div>
            <div className="flex-1 truncate"><div className="text-[10px] font-bold truncate opacity-80">{user?.email}</div><div className="text-[9px] text-gray-600 font-black uppercase tracking-tighter">{appUser?.plan || 'Free'} Planı</div></div>
            <div className="flex items-center gap-1">
              <button onClick={() => setShowAccountSettingsModal(true)} className="p-1.5 hover:text-emerald-500 text-gray-600"><Settings2 className="w-4 h-4" /></button>
              <button onClick={() => signOut(auth)} className="p-1.5 hover:text-white text-gray-600"><LogOut className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative overflow-hidden h-full">
        {activeTab === 'admin' && isAdmin ? (
          <div className="flex-1 overflow-y-auto custom-scrollbar relative z-30 bg-brand-bg">
            <header className="h-16 border-b border-brand-border px-4 lg:px-8 flex items-center justify-between bg-brand-card/50 backdrop-blur-xl sticky top-0 z-40">
              <div className="flex items-center gap-3"><button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 lg:hidden text-gray-400"><Menu className="w-6 h-6" /></button><ShieldCheck className="w-5 h-5 text-emerald-500" /><h2 className="text-lg lg:text-xl font-black text-white tracking-tighter uppercase">Yönetim</h2></div>
              <button onClick={() => setActiveTab('editor')} className="p-2 hover:bg-white/5 rounded-xl text-gray-500"><X className="w-5 h-5" /></button>
            </header>
            <div className="p-4 lg:p-8"><Suspense fallback={<div className="flex items-center justify-center p-12"><RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" /></div>}><AdminPanel /></Suspense></div>
          </div>
        ) : (
          <>
            <header className="h-auto min-h-[5rem] lg:h-20 border-b border-brand-border px-4 lg:px-8 py-3 flex flex-col lg:flex-row items-start lg:items-center justify-between bg-brand-card/50 backdrop-blur-xl relative z-40 gap-4">
              <div className="flex items-center gap-4 lg:gap-10 w-full lg:w-auto">
                <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 lg:hidden text-gray-400 shrink-0"><Menu className="w-6 h-6" /></button>
                <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-10 flex-1 lg:flex-none">
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-2"><Settings2 className="w-3.5 h-3.5 text-gray-500" /><span className="text-[10px] font-black text-gray-500 uppercase tracking-widest text-emerald-500/80">STYLEMASTER KONTROLÜ</span></div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setIsToneDropdownOpen(!isToneDropdownOpen)} className="flex items-center gap-2 text-base lg:text-xl font-black text-white hover:text-gray-300 transition-colors uppercase tracking-tight">{options.tone}<ChevronDown className="w-4 h-4 text-gray-500" /></button>
                      <button onClick={() => setShowCustomToneModal(true)} className="p-1.5 text-gray-400 hover:text-white bg-white/5 rounded-lg border border-white/10"><MessageSquarePlus className="w-4 h-4" /></button>
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
                  <div className="flex-1"><div className="flex items-center gap-2 mb-2"><Zap className="w-3.5 h-3.5 text-emerald-500" /><span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">YOĞUNLUK ({options.intensity}%)</span></div><input type="range" min="0" max="100" value={options.intensity} onChange={(e) => setOptions({ ...options, intensity: parseInt(e.target.value) })} className="w-full lg:w-48 h-1.5 accent-emerald-500 bg-white/10 rounded-full cursor-pointer" /></div>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
                <button onClick={() => setShowPlansModal(true)} className="flex items-center gap-2 px-4 py-2 bg-white/5 text-gray-300 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all">Yükselt</button>
                <button onClick={handleHumanize} disabled={isProcessing || !inputText.trim() || (!isAdmin && isOverLimit)} className="flex-1 lg:flex-none px-6 py-2.5 bg-emerald-500 text-black rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50 transition-all flex items-center justify-center gap-2">{isProcessing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} İNSANLAŞTIR</button>
              </div>
            </header>

            <div className="flex-1 p-4 lg:p-6 flex flex-col lg:flex-row gap-4 lg:gap-6 relative z-10 overflow-visible">
              <div className="flex-1 flex flex-col gap-4 lg:gap-6 min-w-0 h-full overflow-y-auto custom-scrollbar pb-20 lg:pb-0">
                <div className="min-h-[300px] lg:flex-1 glass-panel rounded-[24px] flex flex-col">
                  <div className="px-4 py-3 border-b border-brand-border bg-black/20 flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4"><span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Giriş metni</span>{realtimeScore !== null && <div className="flex items-center gap-1.5"><div className="w-10 lg:w-16 h-1 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-red-500" style={{ width: `${realtimeScore * 100}%` }} /></div><span className="text-[8px] text-gray-500">%{Math.round(realtimeScore * 100)} YZ</span></div>}</div>
                      <div className="flex items-center gap-2">
                        <button onClick={saveDraft} disabled={isDrafting || !inputText.trim()} className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-bold text-gray-400 hover:bg-white/10 transition-all disabled:opacity-50"><Save className="w-2.5 h-2.5" /> <span className="hidden sm:inline">Taslak</span></button>
                        <button onClick={() => setShowInputHeatmap(!showInputHeatmap)} className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold transition-all", showInputHeatmap ? "bg-emerald-500 text-black" : "bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10")}><Highlighter className="w-2.5 h-2.5" /> Isı haritası</button>
                        <button onClick={handleAnalyze} disabled={isAnalyzing || !inputText.trim() || (!isAdmin && isOverLimit)} className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[9px] font-bold text-emerald-500 hover:bg-emerald-500/20 transition-all shadow-[0_0_15px_rgba(16,185,129,0.1)]">{isAnalyzing ? <RefreshCw className="w-2.5 h-2.5 animate-spin" /> : <ShieldCheck className="w-2.5 h-2.5" />} Denetçi Analizi</button>
                      </div>
                    </div>
                  </div>
                  <div className="relative flex-1 overflow-hidden">
                    <textarea ref={textareaRef} value={inputText} onScroll={handleScroll} onChange={(e) => setInputText(e.target.value)} className="absolute inset-0 w-full h-full p-4 lg:p-6 bg-transparent outline-none resize-none text-gray-300 leading-relaxed text-sm z-10 custom-scrollbar" placeholder="Metninizi buraya yapıştırın..." />
                    <div ref={backdropRef} className="absolute inset-0 w-full h-full p-4 lg:p-6 text-sm leading-relaxed pointer-events-none whitespace-pre-wrap break-words text-transparent z-0 overflow-y-auto custom-scrollbar">{inputOverlay}</div>
                  </div>
                </div>

                <div className="min-h-[300px] lg:flex-1 glass-panel rounded-[24px] flex flex-col relative z-10">
                  <div className="px-4 py-3 border-b border-brand-border flex justify-between items-center bg-white/[0.02]">
                    <div className="flex items-center gap-4"><span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Sonuç</span>{analysis && <div className="flex items-center gap-3 border-l border-white/10 pl-4 ml-2"><button onClick={() => setShowHeatmap(false)} className={cn("px-3 py-1.5 rounded-xl transition-all border text-[10px] font-bold uppercase", !showHeatmap ? "bg-emerald-500 text-black border-emerald-500 shadow-lg" : "bg-white/5 border-white/10 text-gray-500")}>Metin</button><button onClick={() => setShowHeatmap(true)} className={cn("px-3 py-1.5 rounded-xl transition-all border text-[10px] font-bold uppercase", showHeatmap ? "bg-emerald-500 text-black border-emerald-500 shadow-lg" : "bg-white/5 border-white/10 text-gray-500")}>Isı Haritası</button></div>}</div>
                    <button onClick={() => copyToClipboard(humanizedText)} className="p-1.5 text-gray-500 hover:text-emerald-500 transition-colors"><Copy className="w-3.5 h-3.5" /></button>
                  </div>
                  <div className="flex-1 p-4 lg:p-6 overflow-y-auto text-gray-300 leading-relaxed text-sm custom-scrollbar bg-emerald-500/[0.01] rounded-b-[24px]">{isProcessing ? (<div className="flex flex-col items-center justify-center h-full space-y-4"><RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" /><span className="text-gray-400 font-medium">{processingStatus}</span></div>) : (<div className="prose prose-invert max-w-none prose-sm lg:prose-base">{showHeatmap && analysis?.sentenceScores ? (<HeatmapText text={humanizedText} sentenceScores={analysis.sentenceScores as any} />) : (<ReactMarkdown>{humanizedText || "_Sonuç burada görünecek..._"}</ReactMarkdown>)}</div>)}</div>
                </div>
              </div>

              {/* Desktop Analytics Panel */}
              <div className="hidden lg:flex w-80 flex-col gap-6 shrink-0 overflow-y-auto custom-scrollbar pb-8 relative z-20">
                <div className="p-6 glass-panel rounded-[24px] space-y-6 overflow-visible">
                  <div className="flex items-center justify-between"><h3 className="text-[12px] font-bold text-gray-400 flex items-center gap-2"><Gauge className="w-4 h-4 text-emerald-500/70" /> Denetçi Analiz</h3><div className="flex flex-col items-end gap-1"><div className="flex items-center gap-2"><span className="text-[7px] font-black text-gray-600 uppercase tracking-wider">Hassasiyet</span><span className="text-[10px] font-mono text-emerald-500 font-bold">%{localAuditorSensitivity}</span></div><input type="range" min="0" max="100" value={localAuditorSensitivity} onChange={(e) => setLocalAuditorSensitivity(parseInt(e.target.value))} className="w-24 h-1 accent-emerald-500 bg-white/10 rounded-full cursor-pointer" /></div></div>
                  {auditorResult ? (
                    <div className="space-y-4">
                      <div className="flex flex-col items-center gap-8 mb-6"><ScoreCircle score={auditorResult.score} label="YZ Olasılığı" size={140} type="ai" />{ (analysis?.similarityScore !== undefined || auditorResult.metrics.plagiarism !== undefined) && (<ScoreCircle score={(analysis?.similarityScore !== undefined ? analysis.similarityScore / 100 : auditorResult.metrics.plagiarism)} label="Orijinallik" size={140} color={(analysis?.similarityScore || auditorResult.metrics.plagiarism * 100) > 20 ? '#ef4444' : '#10b981'} inverse type="plagiarism" />) }</div>
                      <div className="grid grid-cols-1 gap-4">
                        <AuditMetricCard title="YZ TESPİTİ" value={`%${Math.round(auditorResult.score * 100)}`} percentage={auditorResult.score} icon={ShieldCheck} color="text-red-500" detail={auditorResult.score > 0.7 ? "Yüksek ihtimalle YZ" : "Doğal içerik yapısı"} />
                        <AuditMetricCard title="İNTİHAL" value={`%${Math.round(auditorResult.metrics.plagiarism * 100)}`} percentage={auditorResult.metrics.plagiarism} icon={Search} color="text-amber-500" detail="Canlı kaynak eşleşmesi" />
                        <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl"><div className="text-[12px] font-bold text-gray-400 mb-4 flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500/70" /> Analiz Muhakemesi</div><div className="text-[15px] text-gray-300 leading-relaxed italic border-l-3 border-emerald-500/40 pl-4 py-1">"{auditorResult.reasoning}"</div></div>
                      </div>
                    </div>
                  ) : <div className="text-[10px] text-gray-600 italic text-center py-10">Analiz başlatmak için metin girin...</div>}
                </div>

                {mlAnalysis && (
                  <div className="p-6 glass-panel rounded-[24px] space-y-5 overflow-visible">
                    <h3 className="text-[16px] font-bold text-gray-400 flex items-center"><BarChart3 className="w-4 h-4 text-emerald-500/70 mr-2" /> Derin Metrikler</h3>
                    <div className="space-y-4">
                      <MetricProgress icon={Highlighter} label="OKUNABİLİRLİK" value={`%${Math.round(mlAnalysis.readabilityScore * 100)}`} percentage={mlAnalysis.readabilityScore} />
                      <div className="pt-2"><div className="text-[10px] text-gray-600 font-bold uppercase mb-2 tracking-widest">ÖNERİLER</div><div className="space-y-2">{mlAnalysis.recommendations.map((rec, i) => (<div key={i} className="text-[11px] text-gray-400 flex gap-2 leading-relaxed"><span className="text-emerald-500">•</span><span>{rec}</span></div>))}</div></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>

      <AnimatePresence>
        {showPlansModal && (<Suspense fallback={null}><PlansModal user={appUser || { uid: '', email: user?.email || '', role: 'user', plan: 'free', dailyUsage: 0, lastResetDate: '', createdAt: new Date().toISOString() } as any} onClose={() => setShowPlansModal(false)} /></Suspense>)}
        {showGuideModal && (<Suspense fallback={null}><GuideModal onClose={() => setShowGuideModal(false)} /></Suspense>)}
        {showCustomToneModal && (<Suspense fallback={null}><CustomToneModal onClose={() => setShowCustomToneModal(false)} onApply={(name, description) => { setOptions({ ...options, tone: name || 'Özel', customToneName: name, customToneDescription: description }); setShowCustomToneModal(false); }} /></Suspense>)}
        {showAccountSettingsModal && (<Suspense fallback={null}><AccountSettingsModal user={appUser || { uid: '', email: user?.email || '', role: 'user', plan: 'free', dailyUsage: 0, lastResetDate: '', createdAt: new Date().toISOString() } as any} onClose={() => setShowAccountSettingsModal(false)} /></Suspense>)}
      </AnimatePresence>
    </div>
  );
}
