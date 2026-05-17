import React, { useState, useEffect, useRef, useLayoutEffect, lazy, Suspense } from 'react';
import {
  Plus, Zap, ShieldCheck, Gauge, Trash2, Copy, Check, Sparkles, Search,
  Settings2, AlertCircle, Clock, ChevronRight, LogOut, Fingerprint, Save,
  Download, Layers, Highlighter, X, Mail, Lock, Github, Twitter, ArrowRight,
  BarChart3, FileText, User as UserIcon, Crown, Database, RefreshCw, History,
  ChevronDown, MessageSquarePlus, HelpCircle, Menu, Info, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  collection, query, where, orderBy, addDoc, deleteDoc, doc,
  serverTimestamp, updateDoc, setDoc, getDocs, getDoc, writeBatch
} from 'firebase/firestore';
import { onAuthStateChanged, signOut, User, GoogleAuthProvider, GithubAuthProvider, TwitterAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth, isQuotaError, setQuotaExhausted, isQuotaExhausted, resetQuotaStatus } from './lib/firebase';
import { analyzeAndHumanize, HumanizeOptions, AnalysisResult, checkGrammar, GrammarSuggestion, detectAI, translateError } from './services/geminiService';
import { performDeepMLAnalysis, MLAnalysisResult, sendAnonymousFeedback } from './services/mlService';
import { cn } from './lib/utils';
import ReactMarkdown from 'react-markdown';
import { saveAs } from 'file-saver';
import toast, { Toaster } from 'react-hot-toast';
import { OnboardingChecklist } from './components/OnboardingChecklist';
import { LandingPage } from './components/LandingPage';
import { verifyPlagiarism, verifyFactCheck, FactCheckReport } from './services/sentinelService';
import { InfoTooltip } from './components/InfoTooltip';
import { AppUser, PLAN_LIMITS, Project } from './types';

const PlansModal = lazy(() => import('./components/PlansModal').then(m => ({ default: m.PlansModal })));
const AdminPanel = lazy(() => import('./components/AdminPanel').then(m => ({ default: m.AdminPanel })));
const CustomToneModal = lazy(() => import('./components/CustomToneModal').then(m => ({ default: m.CustomToneModal })));
const GuideModal = lazy(() => import('./components/GuideModal').then(m => ({ default: m.GuideModal })));
const AccountSettingsModal = lazy(() => import('./components/AccountSettingsModal').then(m => ({ default: m.AccountSettingsModal })));

export type CombinedAnalysisResult = AnalysisResult & {
  similarityScore?: number;
  sources?: any[];
  isPlagiarized?: boolean;
  matchedPhrases?: { text: string, source: string, score: number }[];
};

const STANDARD_TONES = ['Profesyonel', 'Sohbet Vari', 'Resmi', 'Samimi', 'Akademik', 'Yaratıcı', 'Heyecanlı'];

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [view, setView] = useState<'landing' | 'login'>('landing');
  const [activeTab, setActiveTab] = useState<'editor' | 'drafts' | 'history' | 'admin' | 'plans'>('editor');
  const [sidebarTab, setSidebarTab] = useState<'history' | 'drafts'>('history');
  const [showPlansModal, setShowPlansModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showCustomToneModal, setShowCustomToneModal] = useState(false);
  const [showAccountSettingsModal, setShowAccountSettingsModal] = useState(false);
  const [isToneDropdownOpen, setIsToneDropdownOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [humanizedText, setHumanizedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [options, setOptions] = useState<HumanizeOptions>({ tone: 'Profesyonel', intensity: 80 });
  const [analysis, setAnalysis] = useState<CombinedAnalysisResult | null>(null);
  const [mlAnalysis, setMlAnalysis] = useState<MLAnalysisResult | null>(null);
  const [grammarSuggestions, setGrammarSuggestions] = useState<GrammarSuggestion[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [realtimeScore, setRealtimeScore] = useState<number | null>(null);
  const [systemSettings, setSystemSettings] = useState({ sentinelEnabled: true, maintenanceMode: false, maintenanceMessage: '', auditorSensitivity: 70, auditorModel: 'gemini-2.0-flash', ghostWriterModel: 'gemini-2.0-flash' });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [detailsFontSize, setDetailsFontSize] = useState(14);
  const [auditorResult, setAuditorResult] = useState<any>(null);
  const [showInputHeatmap, setShowInputHeatmap] = useState(false);
  const [factCheckResult, setFactCheckResult] = useState<FactCheckReport | null>(null);
  const [hoveredInsight, setHoveredInsight] = useState<string | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(true);

  const ADMIN_EMAILS = ['ismail.kaleci@gmail.com', 'tonguc.urunler@gmail.com', 'yasindemir111@gmail.com'];
  const isAdmin = (user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase())) || appUser?.role === 'admin';

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => { setUser(u); setAuthLoading(false); if (u) resetQuotaStatus(); });
    return () => unsub();
  }, []);

  const fetchProjects = useCallback(async () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'projects'), where('userId', '==', user.uid));
      const snap = await getDocs(q);
      setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() } as Project)));
    } catch { }
  }, [user]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const handleHumanize = async () => {
    if (!inputText.trim() || !user || !appUser) return toast.error("Lütfen metin girin.");
    setIsProcessing(true);
    setProcessingStatus('İşlem yapılıyor...');
    try {
      const plagiarismReport = await verifyPlagiarism(inputText, systemSettings.sentinelEnabled);
      const result = await analyzeAndHumanize(inputText, options, systemSettings.ghostWriterModel);
      const combinedResult: CombinedAnalysisResult = { ...result, similarityScore: plagiarismReport.similarityScore, sources: plagiarismReport.sources, isPlagiarized: plagiarismReport.similarityScore > 20 };
      setHumanizedText(combinedResult.humanizedText);
      setAnalysis(combinedResult);
      await addDoc(collection(db, 'projects'), { userId: user.uid, title: inputText.slice(0, 30), originalText: inputText, humanizedText: combinedResult.humanizedText, tone: options.tone, intensity: options.intensity, aiScore: combinedResult.aiScore, plagiarismScore: combinedResult.similarityScore, createdAt: serverTimestamp() });
      fetchProjects();
      toast.success("Tamamlandı.");
    } catch (e: any) { toast.error(translateError(e, isAdmin)); }
    finally { setIsProcessing(false); setProcessingStatus(''); }
  };

  const downloadTrainingData = async (onlyTrainingReady: boolean = true) => {
    if (!isAdmin) return;
    try {
      let q = query(collection(db, 'projects'));
      if (onlyTrainingReady) q = query(collection(db, 'projects'), where('isTrainingReady', '==', true));
      const snap = await getDocs(q);
      let docs = snap.docs;
      if (onlyTrainingReady) docs = docs.filter(d => d.data().isTrained !== true);
      if (docs.length === 0) return toast.error("Yeni veri bulunamadı.");
      const jsonl = docs.map(d => JSON.stringify({ contents: [{ role: "user", parts: [{ text: d.data().originalText }] }, { role: "model", parts: [{ text: d.data().humanizedText }] }] })).join('\n');
      saveAs(new Blob([jsonl], { type: 'application/x-jsonlines' }), `tuning_data_${docs.length}.jsonl`);
      toast.success("JSONL indirildi.");
      setTimeout(async () => {
        if (window.confirm(`${docs.length} veriyi 'Eğitildi' olarak işaretle?`)) {
          const batch = writeBatch(db);
          docs.forEach(d => batch.update(d.ref, { isTrained: true, trainedAt: serverTimestamp() }));
          await batch.commit();
          toast.success("İşaretlendi.");
          fetchProjects();
        }
      }, 500);
    } catch { toast.error("Hata."); }
  };

  if (authLoading) return <div className="min-h-screen bg-brand-bg flex items-center justify-center"><RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" /></div>;

  if (!user) return <LandingPage onGetStarted={() => setView('login')} onLogin={() => setView('login')} />;

  return (
    <div className="flex h-screen bg-brand-bg text-white overflow-hidden">
      <Toaster position="bottom-right" />
      <aside className="w-80 border-r border-brand-border bg-brand-card flex flex-col">
        <div className="p-6 border-b border-brand-border font-black text-emerald-500">SENTIENCE</div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
           {projects.map(p => <div key={p.id} className="p-2 hover:bg-white/5 rounded cursor-pointer truncate text-sm text-gray-400">{p.title}</div>)}
        </div>
        <div className="p-4 border-t border-brand-border space-y-2">
          {isAdmin && (
            <>
              <button onClick={() => setActiveTab('admin')} className="w-full py-2 bg-emerald-500/10 text-emerald-500 rounded-xl text-xs font-bold">Admin</button>
              <button onClick={() => downloadTrainingData(true)} className="w-full py-2 bg-blue-500/10 text-blue-400 rounded-xl text-xs font-bold">Veri İndir (JSONL)</button>
            </>
          )}
          <button onClick={() => signOut(auth)} className="w-full py-2 text-gray-500 text-xs">Çıkış</button>
        </div>
      </aside>
      <main className="flex-1 flex flex-col">
        {activeTab === 'admin' ? <AdminPanel /> : (
          <div className="p-8 space-y-8 flex-1 overflow-y-auto">
             <textarea value={inputText} onChange={e => setInputText(e.target.value)} className="w-full h-64 bg-white/5 border border-white/10 rounded-3xl p-6 outline-none" placeholder="Metin girin..." />
             <button onClick={handleHumanize} disabled={isProcessing} className="px-8 py-3 bg-emerald-500 text-black rounded-full font-bold">İNSANLAŞTIR</button>
             {humanizedText && <div className="p-6 bg-white/5 border border-white/10 rounded-3xl prose prose-invert max-w-none">{humanizedText}</div>}
          </div>
        )}
      </main>
    </div>
  );
}
