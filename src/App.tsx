import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import {
  ShieldCheck,
  Settings2,
  RefreshCw,
  Menu,
  X,
  GraduationCap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from './lib/firebase';
import type { HumanizeOptions, GrammarSuggestion } from './services/geminiService';
import type { MLAnalysisResult } from './services/mlService';
import type { FactCheckReport } from './services/sentinelService';
import { cn } from './lib/utils';
const PlansModal = lazy(() => import('./components/PlansModal').then(m => ({ default: m.PlansModal })));
const AdminPanel = lazy(() => import('./components/AdminPanel').then(m => ({ default: m.AdminPanel })));
const CustomToneModal = lazy(() => import('./components/CustomToneModal').then(m => ({ default: m.CustomToneModal })));
const GuideModal = lazy(() => import('./components/GuideModal').then(m => ({ default: m.GuideModal })));
const AccountSettingsModal = lazy(() => import('./components/AccountSettingsModal').then(m => ({ default: m.AccountSettingsModal })));
const ClassroomPanel = lazy(() => import('./components/classroom/ClassroomPanel').then(m => ({ default: m.ClassroomPanel })));
const ExportPreviewModal = lazy(() => import('./components/ExportPreviewModal').then(m => ({ default: m.ExportPreviewModal })));
const BlogIndexView = lazy(() => import('./components/BlogIndexView').then(m => ({ default: m.BlogIndexView })));
const BlogArticleView = lazy(() => import('./components/BlogArticleView').then(m => ({ default: m.BlogArticleView })));
const UserGuideView = lazy(() => import('./components/UserGuideView').then(m => ({ default: m.UserGuideView })));
import { BLOG_POSTS } from './data/blogPosts';
import { blogService } from './services/blogService';
import { BlogPost } from './types/blog';
import toast, { Toaster } from 'react-hot-toast';
// Sınıf bileşenleri `sonner` toast kullanıyor; onun <Toaster/>'ı mount edilmezse hata/başarı
// bildirimleri sessizce kaybolur (Bölüm 34 — "Sınıflarım" hatasının görünmezlik nedeni).
import { Toaster as SonnerToaster } from 'sonner';
import { ProjectSidebar } from './components/ProjectSidebar';
import { LandingPage } from './components/LandingPage';
import { LoginView } from './components/LoginView';
import { EditorPanel } from './components/editor/EditorPanel';
import { ResultPanel } from './components/result/ResultPanel';
import { AuditorSidebar, SentinelFilter } from './components/auditor/AuditorSidebar';
import { PresetSelector } from './components/PresetSelector';
import { buildBibliography } from './services/citationService';
import { resetAndSeedDemoProjects } from './services/demoProjectsService';
import { exportToDocx, exportToPDF, exportToTxt, downloadTrainingData } from './lib/exporters';
import { PLAN_LIMITS, CitationStyle, CombinedAnalysisResult, AuditorResult } from './types';
import { useAppUser } from './hooks/useAppUser';
import { useProjects } from './hooks/useProjects';
import { useEditorWorkflow } from './hooks/useEditorWorkflow';
import type { MainTab, MobileTab } from './hooks/useEditorWorkflow';
import type { ResultViewMode } from './components/result/ResultPanel';
import { useAuthListener } from './hooks/useAuthListener';
import { useSystemSettings } from './hooks/useSystemSettings';
import { useHeatmapOverlay } from './hooks/useHeatmapOverlay';
import { StyleMasterHeader } from './components/header/StyleMasterHeader';

export default function App() {
  const { user, authLoading } = useAuthListener();

  // UI State
  const [view, setView] = useState<'landing' | 'login'>('landing');
  const [currentPath, setCurrentPath] = useState(() =>
    typeof window !== 'undefined' ? window.location.pathname : '/'
  );

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const [activeArticlePost, setActiveArticlePost] = useState<BlogPost | null>(null);

  useEffect(() => {
    if (currentPath.startsWith('/blog/')) {
      const slug = currentPath.replace('/blog/', '').replace(/\/$/, '');
      blogService.fetchPostBySlug(slug).then((post) => {
        if (post) setActiveArticlePost(post);
      });
    } else {
      setActiveArticlePost(null);
    }
  }, [currentPath]);
  const [activeTab, setActiveTab] = useState<MainTab>('editor');
  const [sidebarTab, setSidebarTab] = useState<'history' | 'drafts'>('history');
  const [showPlansModal, setShowPlansModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showCustomToneModal, setShowCustomToneModal] = useState(false);
  const [showAccountSettingsModal, setShowAccountSettingsModal] = useState(false);
  const [showExportPreviewModal, setShowExportPreviewModal] = useState(false);
  const [isToneDropdownOpen, setIsToneDropdownOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAcademicIntegrityLocked, setIsAcademicIntegrityLocked] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('sentience_academic_integrity_lock');
      if (stored !== null) return stored === 'true';
    }
    return false;
  });

  const toggleAcademicIntegrity = () => {
    setIsAcademicIntegrityLocked(prev => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('sentience_academic_integrity_lock', String(next));
      }
      if (next) {
        toast.success("🛡️ Akademik Bütünlük Modu devrede: İnsanlaştırma kilitlendi.");
      } else {
        toast("Akademik Bütünlük Modu kapatıldı.", { icon: 'ℹ️' });
      }
      return next;
    });
  };

  // Mobil Sidebar Scroll Kilidi
  useEffect(() => {
    if (isSidebarOpen && window.innerWidth < 1024) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isSidebarOpen]);

  // App Logic State
  const [inputText, setInputText] = useState('');
  const [humanizedText, setHumanizedText] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [mobileTab, setMobileTab] = useState<MobileTab>('editor');
  const [options, setOptions] = useState<HumanizeOptions>({ tone: 'Profesyonel', intensity: 80 });
  const [analysis, setAnalysis] = useState<CombinedAnalysisResult | null>(null);
  const [mlAnalysis, setMlAnalysis] = useState<MLAnalysisResult | null>(null);
  const [grammarSuggestions, setGrammarSuggestions] = useState<GrammarSuggestion[]>([]);
  const [hoveredGrammar, setHoveredGrammar] = useState<GrammarSuggestion | null>(null);
  const [hoveredReadability, setHoveredReadability] = useState<{ start: number; end: number; text: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [detailsFontSize, setDetailsFontSize] = useState(14);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showDiff, setShowDiff] = useState(false);
  const [auditorResult, setAuditorResult] = useState<AuditorResult | null>(null);

  const [showInputHeatmap, setShowInputHeatmap] = useState(false);
  const [hoveredInsight, setHoveredInsight] = useState<string | null>(null);
  const [hoveredSourceUrl, setHoveredSourceUrl] = useState<string | null>(null);
  const [factCheckResult, setFactCheckResult] = useState<FactCheckReport | null>(null);
  const [sentinelFilter, setSentinelFilter] = useState<SentinelFilter>('all');

  const { appUser, setAppUser, isAdmin } = useAppUser(user);
  const { systemSettings, localAuditorSensitivity, handleSensitivityChange } = useSystemSettings(!!isAdmin);
  const { projects, fetchProjects, projectsLimit, setProjectsLimit, hasMoreProjects } = useProjects(user);

  useEffect(() => {
    if (user?.email && (user.email.includes('.edu') || appUser?.academicProfile === 'student')) {
      const stored = localStorage.getItem('sentience_academic_integrity_lock');
      if (stored === null) {
        setIsAcademicIntegrityLocked(true);
      }
    }
  }, [user?.email, appUser?.academicProfile]);

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const sentinelSourcesRef = useRef<HTMLDivElement>(null);

  const { handleScroll, handleInsightHover, handleGrammarHover, handleReadabilityHover, grammarHoverFound } = useHeatmapOverlay({
    textareaRef,
    backdropRef,
    inputText,
    showInputHeatmap,
    auditorResult,
    grammarSuggestions,
    hoveredInsight,
    hoveredGrammar,
    setHoveredInsight,
    setHoveredGrammar,
    setHoveredReadability
  });

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

  const {
    isProcessing,
    processingStatus,
    isAnalyzing,
    isDrafting,
    realtimeScore,
    undoStack,
    redoStack,
    handleHumanize,
    handleAnalyze,
    handleTextChange,
    handleUndo,
    handleRedo,
    saveDraft,
    loadProjectFromHistory
  } = useEditorWorkflow({
    user,
    appUser,
    isAdmin: !!isAdmin,
    activeTab,
    inputText,
    options,
    setOptions,
    systemSettings,
    localAuditorSensitivity,
    auditorResult,
    mlAnalysis,
    analysis,
    currentLimit,
    remainingChars,
    setInputText,
    humanizedText,
    setHumanizedText,
    setAnalysis,
    setAuditorResult,
    setMlAnalysis,
    setGrammarSuggestions,
    setFactCheckResult,
    setShowInputHeatmap,
    setShowHeatmap,
    setShowPlansModal,
    setMobileTab,
    setIsSidebarOpen,
    setActiveTab,
    fetchProjects,
    isAcademicIntegrityLocked: isAcademicIntegrityLocked || activeTab === 'classroom'
  });

  const exportCtx = { humanizedText, options, auditorResult, analysis, mlAnalysis };

  // B22: kapılı özellikler — varsayılan yalnız admin; admin panelinden kullanıcı bazında yetki
  // veya global "herkese aç" anahtarıyla genişletilir (systemSettings.featureAccess / appUser.featureGrants)
  const canUseFeature = (f: 'promoSite' | 'classroom' | 'trainingData') =>
    !!isAdmin || !!systemSettings.featureAccess?.[f] || !!appUser?.featureGrants?.[f];
  const featureVisibility = {
    promoSite: canUseFeature('promoSite'),
    classroom: canUseFeature('classroom'),
    trainingData: canUseFeature('trainingData')
  };

  const handleCopyCitations = (style: CitationStyle = 'apa') => {
    if (!analysis?.sources || analysis.sources.length === 0) {
      toast.error("Kopyalanacak intihal kaynağı bulunamadı.");
      return;
    }
    const bib = buildBibliography(analysis.sources, style);
    if (!bib) {
      toast.error("Kaynak bilgisi üretilemedi.");
      return;
    }
    navigator.clipboard.writeText(bib);
    toast.success(`Kaynakça (${style.toUpperCase()}) panoya kopyalandı!`);
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
    setHoveredGrammar(null);
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

  if (currentPath === '/blog' || currentPath === '/blog/') {
    return (
      <Suspense fallback={<div className="min-h-screen bg-mesh flex items-center justify-center text-emerald-400 font-bold">Yükleniyor...</div>}>
        <BlogIndexView
          onSelectPost={(post) => navigate(`/blog/${post.slug}`)}
          onGoHome={() => navigate('/')}
          onLogin={() => {
            navigate('/');
            setView('login');
          }}
          onGetStarted={() => {
            navigate('/');
            setView('login');
          }}
        />
      </Suspense>
    );
  }

  if (currentPath.startsWith('/blog/')) {
    const slug = currentPath.replace('/blog/', '').replace(/\/$/, '');
    const matchedPost =
      activeArticlePost && activeArticlePost.slug === slug
        ? activeArticlePost
        : BLOG_POSTS.find((p) => p.slug === slug);
    if (matchedPost) {
      return (
        <Suspense fallback={<div className="min-h-screen bg-mesh flex items-center justify-center text-emerald-400 font-bold">Yükleniyor...</div>}>
          <BlogArticleView
            post={matchedPost}
            onBack={() => navigate('/blog')}
            onGoHome={() => navigate('/')}
            onSelectPost={(p) => navigate(`/blog/${p.slug}`)}
            allPosts={BLOG_POSTS}
            onGetStarted={() => {
              navigate('/');
              setView('login');
            }}
            onLogin={() => {
              navigate('/');
              setView('login');
            }}
          />
        </Suspense>
      );
    }
  }

  if (currentPath === '/guide' || currentPath === '/guide/' || currentPath === '/rehber' || currentPath === '/rehber/') {
    return (
      <Suspense fallback={<div className="min-h-screen bg-mesh flex items-center justify-center text-emerald-400 font-bold">Yükleniyor...</div>}>
        <UserGuideView
          onBack={() => navigate('/')}
          onNavigateAuth={() => {
            navigate('/');
            setView('login');
          }}
        />
      </Suspense>
    );
  }

  const isLandingPreview = typeof window !== 'undefined' && window.location.search.includes('preview=landing');

  if ((!user || isLandingPreview) && view === 'landing') return (
    <LandingPage
      showBlog={systemSettings.showBlogOnLanding !== false}
      onGetStarted={(text) => {
        if (text) setInputText(text);
        if (isLandingPreview && user) {
          window.location.href = window.location.pathname;
        } else {
          setView('login');
        }
      }}
      onLogin={() => {
        if (isLandingPreview && user) {
          window.location.href = window.location.pathname;
        } else {
          setView('login');
        }
      }}
      onNavigate={navigate}
    />
  );

  if (!user && view === 'login') {
    return <LoginView isAdmin={!!isAdmin} onBack={() => setView('landing')} />;
  }

  return (
    <div className="flex h-screen h-[100dvh] bg-brand-bg text-white font-sans overflow-hidden relative">
      <Toaster position="bottom-right" />
      <SonnerToaster position="top-center" richColors closeButton />

      <AnimatePresence>
        {isSidebarOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden" />}
      </AnimatePresence>

      <ProjectSidebar
        isOpen={isSidebarOpen}
        appUser={appUser}
        userEmail={user?.email}
        isAdmin={!!isAdmin}
        projects={projects}
        sidebarTab={sidebarTab}
        onSidebarTabChange={setSidebarTab}
        hasMoreProjects={hasMoreProjects}
        onLoadMore={() => {
          const nextLimit = projectsLimit + 20;
          setProjectsLimit(nextLimit);
          fetchProjects(nextLimit);
        }}
        onSelectProject={loadProjectFromHistory}
        onDeleteProject={handleDeleteProject}
        onNewProject={() => {
          // B22: tam sıfırlama — sağdaki Denetçi Analiz/Sentinel kartları da temizlenmeli
          setInputText('');
          setHumanizedText('');
          setAnalysis(null);
          setAuditorResult(null);
          setMlAnalysis(null);
          setGrammarSuggestions([]);
          setFactCheckResult(null);
          setShowDiff(false);
          setShowInputHeatmap(false);
          setMobileTab('editor');
          setActiveTab('editor');
        }}
        onShowGuide={() => setShowGuideModal(true)}
        onOpenAdmin={() => setActiveTab('admin')}
        onOpenClassroom={() => setActiveTab('classroom')}
        featureVisibility={featureVisibility}
        onDownloadTrainingData={() => downloadTrainingData({ permitted: canUseFeature('trainingData'), onDone: () => fetchProjects() })}
        onOpenAccountSettings={() => setShowAccountSettingsModal(true)}
        onSeedDemoProjects={isAdmin ? async () => {
          if (!user) return;
          try {
            await resetAndSeedDemoProjects(user.uid);
            await fetchProjects(20);
            toast.success("Eski taslaklar silindi ve 4 farklı anlatımda test projesi yüklendi.");
          } catch (e: any) {
            toast.error("İşlem başarısız: " + e.message);
          }
        } : undefined}
      />

      <main className="flex-1 flex flex-col relative overflow-hidden h-full">
        {activeTab === 'classroom' && appUser && featureVisibility.classroom ? (
          <div className="flex-1 overflow-y-auto custom-scrollbar relative z-30 bg-brand-bg">
            <header className="h-16 border-b border-brand-border px-4 lg:px-8 flex items-center justify-between bg-brand-card/50 backdrop-blur-xl sticky top-0 z-40">
              <div className="flex items-center gap-3"><button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 lg:hidden text-gray-400"><Menu className="w-6 h-6" /></button><GraduationCap className="w-5 h-5 text-sky-500" /><h2 className="text-lg lg:text-xl font-black text-white tracking-tighter uppercase">SINIFLARIM</h2></div>
              <button onClick={() => setActiveTab('editor')} className="p-2 hover:bg-white/5 rounded-xl text-gray-500"><X className="w-5 h-5" /></button>
            </header>
            <div className="p-4 lg:p-8"><Suspense fallback={<div className="flex items-center justify-center p-12"><RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" /></div>}><ClassroomPanel appUser={appUser} scoringConfig={{ sentinelEnabled: systemSettings.sentinelEnabled, auditorModel: systemSettings.auditorModel, sensitivity: localAuditorSensitivity }} onClose={() => setActiveTab('editor')} /></Suspense></div>
          </div>
        ) : activeTab === 'admin' && isAdmin ? (
          <div className="flex-1 overflow-y-auto custom-scrollbar relative z-30 bg-brand-bg">
            <header className="h-16 border-b border-brand-border px-4 lg:px-8 flex items-center justify-between bg-brand-card/50 backdrop-blur-xl sticky top-0 z-40">
              <div className="flex items-center gap-3"><button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 lg:hidden text-gray-400"><Menu className="w-6 h-6" /></button><ShieldCheck className="w-5 h-5 text-emerald-500" /><h2 className="text-lg lg:text-xl font-black text-white tracking-tighter uppercase">YÖNETİM</h2></div>
              <button onClick={() => setActiveTab('editor')} className="p-2 hover:bg-white/5 rounded-xl text-gray-500"><X className="w-5 h-5" /></button>
            </header>
            <div className="p-4 lg:p-8"><Suspense fallback={<div className="flex items-center justify-center p-12"><RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" /></div>}><AdminPanel /></Suspense></div>
          </div>
        ) : (
          <>
            <StyleMasterHeader
              options={options}
              setOptions={setOptions}
              isToneDropdownOpen={isToneDropdownOpen}
              setIsToneDropdownOpen={setIsToneDropdownOpen}
              onOpenSidebar={() => setIsSidebarOpen(true)}
              onOpenCustomTone={() => setShowCustomToneModal(true)}
              onOpenPlans={() => setShowPlansModal(true)}
              onHumanize={handleHumanize}
              isProcessing={isProcessing}
              inputText={inputText}
              isAdmin={!!isAdmin}
              isOverLimit={isOverLimit}
              userPlan={appUser?.plan}
              isAcademicIntegrityLocked={isAcademicIntegrityLocked || activeTab === 'classroom'}
              onToggleAcademicIntegrity={toggleAcademicIntegrity}
            />

            {/* Mobile Navigation Tabs (Segmented Switcher) */}
            <div className="lg:hidden flex items-center bg-black/60 backdrop-blur-md border-b border-brand-border px-3 py-2 gap-2 shrink-0 z-30">
              <button
                onClick={() => setMobileTab('editor')}
                className={cn(
                  "flex-1 py-2 px-2 text-center rounded-xl text-xs font-bold uppercase tracking-wider transition-all min-h-[42px] flex items-center justify-center gap-1.5 active:scale-95 touch-manipulation cursor-pointer",
                  mobileTab === 'editor'
                    ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20 font-black"
                    : "text-gray-400 hover:text-white bg-white/5 border border-white/5"
                )}
              >
                <span>📝 Giriş</span>
              </button>
              <button
                onClick={() => setMobileTab('result')}
                className={cn(
                  "flex-1 py-2 px-2 text-center rounded-xl text-xs font-bold uppercase tracking-wider transition-all min-h-[42px] flex items-center justify-center gap-1.5 relative active:scale-95 touch-manipulation cursor-pointer",
                  mobileTab === 'result'
                    ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20 font-black"
                    : "text-gray-400 hover:text-white bg-white/5 border border-white/5"
                )}
              >
                <span>✨ Sonuç</span>
                {humanizedText && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
                )}
              </button>
              <button
                onClick={() => setMobileTab('analysis')}
                className={cn(
                  "flex-1 py-2 px-2 text-center rounded-xl text-xs font-bold uppercase tracking-wider transition-all min-h-[42px] flex items-center justify-center gap-1.5 relative active:scale-95 touch-manipulation cursor-pointer",
                  mobileTab === 'analysis'
                    ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20 font-black"
                    : "text-gray-400 hover:text-white bg-white/5 border border-white/5"
                )}
              >
                <span>🛡️ Denetçi</span>
                {auditorResult && (
                  <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse ml-0.5" />
                )}
              </button>
            </div>

            <div className="flex-1 p-3 lg:p-6 flex flex-col lg:flex-row gap-4 lg:gap-6 relative z-10 min-h-0 overflow-hidden">
              <div className={cn("flex-1 flex-col gap-4 lg:gap-6 min-w-0 h-full overflow-y-auto custom-scrollbar pb-16 lg:pb-0", mobileTab === 'analysis' ? "hidden lg:flex" : "flex")}>
                <EditorPanel
                  className={mobileTab === 'editor' ? "flex flex-1 min-h-[300px]" : "hidden lg:flex lg:flex-1 min-h-[260px]"}
                  inputText={inputText}
                  onTextChange={handleTextChange}
                  onCtrlEnter={() => { if (!isProcessing && inputText.trim() && (isAdmin || !isOverLimit)) handleHumanize(); }}
                  isProcessing={isProcessing}
                  textareaRef={textareaRef}
                  backdropRef={backdropRef}
                  onScroll={handleScroll}
                  canUndo={undoStack.length > 0}
                  canRedo={redoStack.length > 0}
                  onUndo={handleUndo}
                  onRedo={handleRedo}
                  onSaveDraft={saveDraft}
                  isDrafting={isDrafting}
                  showInputHeatmap={showInputHeatmap}
                  onToggleHeatmap={() => setShowInputHeatmap(!showInputHeatmap)}
                  onAnalyze={handleAnalyze}
                  isAnalyzing={isAnalyzing}
                  isAdmin={!!isAdmin}
                  isOverLimit={isOverLimit}
                  realtimeScore={realtimeScore}
                  grammarSuggestions={grammarSuggestions}
                  hoveredGrammar={hoveredGrammar}
                  hoveredReadability={hoveredReadability}
                  auditorResult={auditorResult}
                  analysis={analysis}
                  hoveredInsight={hoveredInsight}
                  hoveredSourceUrl={hoveredSourceUrl}
                  onHoverSourceUrl={setHoveredSourceUrl}
                  sentinelSourcesRef={sentinelSourcesRef}
                  remainingChars={remainingChars}
                  currentLimit={currentLimit}
                  currentUsage={currentUsage}
                  onClearText={() => setInputText('')}
                />

                <ResultPanel
                  className={mobileTab === 'result' ? "flex flex-1 min-h-[300px]" : "hidden lg:flex lg:flex-1 min-h-[260px]"}
                  isProcessing={isProcessing}
                  processingStatus={processingStatus}
                  inputText={inputText}
                  humanizedText={humanizedText}
                  analysis={analysis}
                  showHeatmap={showHeatmap}
                  showDiff={showDiff}
                  onSetView={(view: ResultViewMode) => { setShowHeatmap(view === 'heatmap'); setShowDiff(view === 'diff'); }}
                  onExportDocx={() => exportToDocx(exportCtx)}
                  onExportPdf={() => exportToPDF(exportCtx)}
                  onExportTxt={() => exportToTxt(humanizedText)}
                  onExportPreview={() => setShowExportPreviewModal(true)}
                  onCopy={() => copyToClipboard(humanizedText)}
                />
              </div>

              {/* Analytics Panel (Desktop & Mobile) */}
              <AuditorSidebar
                className={mobileTab === 'analysis' ? "flex" : "hidden lg:flex"}
                localAuditorSensitivity={localAuditorSensitivity}
                onSensitivityChange={handleSensitivityChange}
                auditorResult={auditorResult}
                analysis={analysis}
                mlAnalysis={mlAnalysis}
                inputText={inputText}
                onReadabilityHover={handleReadabilityHover}
                grammarSuggestions={grammarSuggestions}
                onGrammarApply={applyGrammarCorrection}
                onGrammarDismiss={(suggestion) => {
                  setHoveredGrammar(null);
                  setGrammarSuggestions(prev => prev.filter(s => s.original !== suggestion.original));
                }}
                onGrammarDismissAll={() => { setHoveredGrammar(null); setGrammarSuggestions([]); }}
                onGrammarHover={handleGrammarHover}
                hoveredGrammar={hoveredGrammar}
                grammarHoverFound={grammarHoverFound}
                sentinelFilter={sentinelFilter}
                onSentinelFilterChange={setSentinelFilter}
                hoveredSourceUrl={hoveredSourceUrl}
                onSourceHover={setHoveredSourceUrl}
                onInsightHover={handleInsightHover}
                onInsightHoverEnd={() => setHoveredInsight(null)}
                onCopyCitations={handleCopyCitations}
                onRemovePlagiarism={handleHumanize}
                canHumanize={!isProcessing && !!inputText.trim() && (!!isAdmin || !isOverLimit)}
                onApplySanitizedText={(clean) => {
                  setInputText(clean);
                  toast.success('Metin harf ikamelerinden ve gizli manipülasyonlardan arındırıldı.');
                }}
              />
            </div>
          </>
        )}
      </main>

      <AnimatePresence>
        {showPlansModal && (<Suspense fallback={null}><PlansModal user={appUser || { uid: '', email: user?.email || '', role: 'user', plan: 'free', dailyUsage: 0, lastResetDate: '', createdAt: new Date().toISOString() } as any} onClose={() => setShowPlansModal(false)} /></Suspense>)}
        {showGuideModal && (<Suspense fallback={null}><GuideModal onClose={() => setShowGuideModal(false)} /></Suspense>)}
        {showCustomToneModal && (<Suspense fallback={null}><CustomToneModal onClose={() => setShowCustomToneModal(false)} onApply={(name, description) => { setOptions({ ...options, tone: name || 'Özel', customToneName: name, customToneDescription: description }); setShowCustomToneModal(false); }} /></Suspense>)}
        {showAccountSettingsModal && (<Suspense fallback={null}><AccountSettingsModal user={appUser || { uid: '', email: user?.email || '', role: 'user', plan: 'free', dailyUsage: 0, lastResetDate: '', createdAt: new Date().toISOString() } as any} onClose={() => setShowAccountSettingsModal(false)} /></Suspense>)}
        {showExportPreviewModal && (
          <Suspense fallback={null}>
            <ExportPreviewModal
              isOpen={showExportPreviewModal}
              onClose={() => setShowExportPreviewModal(false)}
              ctx={exportCtx}
              onExportDocx={() => exportToDocx(exportCtx)}
              onExportPdf={() => exportToPDF(exportCtx)}
              onExportTxt={() => exportToTxt(humanizedText)}
            />
          </Suspense>
        )}
      </AnimatePresence>
    </div>
  );
}
