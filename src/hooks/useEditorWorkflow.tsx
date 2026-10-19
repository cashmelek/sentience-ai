import { useState, useEffect, useCallback } from 'react';
import type { ChangeEvent, Dispatch, SetStateAction } from 'react';
import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import toast from 'react-hot-toast';
import { X, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { db } from '../lib/firebase';
import {
  analyzeAndHumanize,
  checkGrammar,
  detectAI,
  translateError
} from '../services/geminiService';
import type { HumanizeOptions, GrammarSuggestion } from '../services/geminiService';
import { performDeepMLAnalysis, sendAnonymousFeedback, calculateQualityScore } from '../services/mlService';
import type { MLAnalysisResult } from '../services/mlService';
import { verifyPlagiarism, verifyFactCheck } from '../services/sentinelService';
import type { FactCheckReport } from '../services/sentinelService';
import type { AppUser, Project, SystemSettings, CombinedAnalysisResult, AuditorResult } from '../types';

/**
 * B20 Adım 5 (Core Refactor): insanlaştırma/analiz/taslak/geçmiş iş akışı App.tsx'ten
 * ayrıştırıldı. Gövde mantığı birebir korunmuştur; App orkestrasyon ve yerleşim görevini sürdürür.
 */

export type MainTab = 'editor' | 'drafts' | 'history' | 'admin' | 'plans' | 'classroom';
export type MobileTab = 'editor' | 'result' | 'analysis';

interface EditorWorkflowDeps {
  user: User | null;
  appUser: AppUser | null;
  isAdmin: boolean;
  activeTab: MainTab;
  inputText: string;
  options: HumanizeOptions;
  setOptions: Dispatch<SetStateAction<HumanizeOptions>>;
  systemSettings: SystemSettings;
  localAuditorSensitivity: number;
  auditorResult: AuditorResult | null;
  mlAnalysis: MLAnalysisResult | null;
  analysis: CombinedAnalysisResult | null;
  currentLimit: number;
  remainingChars: number;
  setInputText: Dispatch<SetStateAction<string>>;
  humanizedText: string;
  setHumanizedText: Dispatch<SetStateAction<string>>;
  setAnalysis: Dispatch<SetStateAction<CombinedAnalysisResult | null>>;
  setAuditorResult: Dispatch<SetStateAction<AuditorResult | null>>;
  setMlAnalysis: Dispatch<SetStateAction<MLAnalysisResult | null>>;
  setGrammarSuggestions: Dispatch<SetStateAction<GrammarSuggestion[]>>;
  setFactCheckResult: Dispatch<SetStateAction<FactCheckReport | null>>;
  setShowInputHeatmap: Dispatch<SetStateAction<boolean>>;
  setShowHeatmap: Dispatch<SetStateAction<boolean>>;
  setShowPlansModal: Dispatch<SetStateAction<boolean>>;
  setMobileTab: Dispatch<SetStateAction<MobileTab>>;
  setIsSidebarOpen: Dispatch<SetStateAction<boolean>>;
  setActiveTab: Dispatch<SetStateAction<MainTab>>;
  fetchProjects: (limitCount?: number) => Promise<void>;
}

export function useEditorWorkflow(deps: EditorWorkflowDeps) {
  const {
    user,
    appUser,
    isAdmin,
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
    fetchProjects
  } = deps;

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [realtimeScore, setRealtimeScore] = useState<number | null>(null);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);

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
  }, [inputText, activeTab, localAuditorSensitivity, systemSettings.auditorModel]);

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
      if (user?.uid) {
        updateDoc(doc(db, 'users', user.uid), {
          lastActiveAt: new Date().toISOString()
        }).catch(() => {});
      }

      const processWithTimeout = async () => {
        const plagiarismReport = await verifyPlagiarism(
          inputText,
          systemSettings.sentinelEnabled,
          0,
          {
            searchPhrasesCount: systemSettings.sentinelSearchPhrasesCount,
            minWordCount: systemSettings.sentinelMinWordCount,
            useDynamicSimilarity: systemSettings.sentinelUseDynamicSimilarity,
            trustFilter: systemSettings.sentinelTrustFilter,
            regionFilter: systemSettings.sentinelRegionFilter
          }
        );
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
        isPlagiarized: plagiarismReport.similarityScore > 20,
        // B22: tarama gerçek durumu — 'ok' değilse %0 intihal "temiz" anlamına GELMEZ
        scanStatus: plagiarismReport.scanStatus,
        queriesRun: plagiarismReport.queriesRun,
        queriesFailed: plagiarismReport.queriesFailed
      };

      setHumanizedText(combinedResult.humanizedText);
      setAnalysis(combinedResult);

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        dailyUsage: (appUser.dailyUsage || 0) + inputText.length,
        'onboarding.firstHumanize': true
      });

      await sendAnonymousFeedback(inputText.length, combinedResult.humanizedText.length, combinedResult.aiScore, options.tone);

      const qualityResult = calculateQualityScore(
        inputText,
        combinedResult.humanizedText,
        combinedResult.aiScore,
        combinedResult.metrics
      );

      await addDoc(collection(db, 'projects'), {
        userId: user.uid,
        title: inputText.slice(0, 30) + '...',
        originalText: inputText,
        humanizedText: combinedResult.humanizedText,
        tone: options.tone,
        intensity: options.intensity,
        aiScore: combinedResult.aiScore,
        plagiarismScore: combinedResult.similarityScore,
        qualityScore: qualityResult.score,
        isTrainingReady: qualityResult.score >= 70,
        isDraft: false,
        insights: combinedResult.insights,
        sentenceScores: combinedResult.sentenceScores,
        metrics: combinedResult.metrics,
        auditorResult: auditorResult || null,
        mlAnalysis: mlAnalysis || null,
        analysis: combinedResult,
        createdAt: serverTimestamp(),
        sources: combinedResult.sources || []
      });

      if (qualityResult.score >= 70) {
        addDoc(collection(db, 'training_pairs'), {
          userId: user.uid,
          input: inputText,
          output: combinedResult.humanizedText,
          tone: options.tone,
          intensity: options.intensity,
          aiScore: combinedResult.aiScore,
          plagiarismScore: combinedResult.similarityScore,
          qualityScore: qualityResult.score,
          source: 'humanize_accept',
          createdAt: serverTimestamp()
        }).catch(console.error);
      }

      import('../services/vectorService').then(m => {
        m.saveToVectorStore(combinedResult.humanizedText, user.uid);
      }).catch(console.error);

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
      if (window.innerWidth < 1024) setMobileTab('result');

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
      const [suggestions, deepML, audit, factCheck, plagiarismReport] = await Promise.all([
        checkGrammar(inputText),
        performDeepMLAnalysis(inputText),
        detectAI(inputText, localAuditorSensitivity, systemSettings.auditorModel),
        verifyFactCheck(inputText),
        verifyPlagiarism(
          inputText,
          systemSettings.sentinelEnabled,
          0,
          {
            searchPhrasesCount: systemSettings.sentinelSearchPhrasesCount,
            minWordCount: systemSettings.sentinelMinWordCount,
            useDynamicSimilarity: systemSettings.sentinelUseDynamicSimilarity,
            trustFilter: systemSettings.sentinelTrustFilter,
            regionFilter: systemSettings.sentinelRegionFilter
          }
        )
      ]);

      setGrammarSuggestions(suggestions);
      setMlAnalysis(deepML);
      setFactCheckResult(factCheck);

      if (audit) {
        if (deepML) {
          (audit.metrics as any).atesman = deepML.metrics.atesman;
          (audit.metrics as any).cetinkayaUzun = deepML.metrics.cetinkayaUzun;
        }
        if (plagiarismReport && typeof plagiarismReport.similarityScore === 'number') {
          audit.metrics.plagiarism = plagiarismReport.similarityScore / 100;
        }
      }

      setAuditorResult(audit);

      setAnalysis(prev => ({
        humanizedText: prev?.humanizedText || '',
        aiScore: audit?.score ?? prev?.aiScore ?? 0,
        metrics: prev?.metrics || {
          readability: audit?.metrics?.readability ?? 0.5,
          complexity: audit?.metrics?.complexity ?? 'Orta',
          toneStrength: 0.5,
          grammarScore: 0.5,
          wordCount: inputText.split(/\s+/).length,
          readingTime: '1 dk'
        },
        insights: prev?.insights || [],
        sentenceScores: audit?.sentenceScores || prev?.sentenceScores || [],
        similarityScore: plagiarismReport?.similarityScore ?? 0,
        sources: plagiarismReport?.sources ?? [],
        matchedPhrases: (plagiarismReport as any)?.matchedPhrases ?? [],
        isPlagiarized: (plagiarismReport?.similarityScore ?? 0) > 20,
        scanStatus: plagiarismReport?.scanStatus,
        queriesRun: plagiarismReport?.queriesRun,
        queriesFailed: plagiarismReport?.queriesFailed
      }));

      setShowInputHeatmap(true);

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        dailyUsage: (appUser.dailyUsage || 0) + inputText.length,
        'onboarding.firstAnalysis': true
      });

      toast.success("Derin analiz tamamlandı.");
      if (window.innerWidth < 1024) setMobileTab('analysis');
    } catch (error: any) {
      toast.error(translateError(error));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    setUndoStack(prev => [...prev.slice(-30), inputText]);
    setRedoStack([]);
    setInputText(newVal);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const last = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    setRedoStack(prev => [inputText, ...prev]);
    setInputText(last);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[0];
    setRedoStack(prev => prev.slice(1));
    setUndoStack(prev => [...prev, inputText]);
    setInputText(next);
  };

  const saveDraft = async () => {
    if (!inputText.trim() || !user) return;
    setIsDrafting(true);
    try {
      await addDoc(collection(db, 'projects'), {
        userId: user.uid,
        title: `[TASLAK] ${inputText.slice(0, 20)}...`,
        originalText: inputText,
        humanizedText: humanizedText || '',
        tone: options.tone,
        intensity: options.intensity,
        aiScore: auditorResult?.score ?? (analysis?.aiScore ?? 0),
        plagiarismScore: analysis?.similarityScore ?? (auditorResult?.metrics?.plagiarism ? auditorResult.metrics.plagiarism * 100 : 0),
        auditorResult: auditorResult || null,
        mlAnalysis: mlAnalysis || null,
        analysis: analysis || null,
        sentenceScores: analysis?.sentenceScores || auditorResult?.sentenceScores || [],
        metrics: auditorResult?.metrics || analysis?.metrics || null,
        sources: analysis?.sources || [],
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

  const loadProjectFromHistory = useCallback((p: Project) => {
    setInputText(p.originalText || '');
    setHumanizedText(p.humanizedText || '');
    if (p.tone) {
      setOptions((prev) => ({ ...prev, tone: p.tone, intensity: p.intensity ?? prev.intensity }));
    }
    if (p.analysis) {
      setAnalysis(p.analysis);
    } else if (p.sentenceScores || p.aiScore !== undefined) {
      setAnalysis({
        humanizedText: p.humanizedText || '',
        aiScore: p.aiScore || 0,
        similarityScore: p.plagiarismScore || 0,
        sentenceScores: p.sentenceScores || [],
        insights: p.insights || [],
        sources: p.sources || [],
        metrics: p.metrics || { perplexity: 0, burstiness: 0, vocabularyRichness: 0, readability: 0, consistency: 0 },
      });
    } else {
      setAnalysis(null);
    }
    if (p.auditorResult) {
      setAuditorResult(p.auditorResult);
    } else if (p.aiScore !== undefined && p.aiScore > 0) {
      setAuditorResult({
        score: p.aiScore,
        reasoning: p.analysis?.reasoning || 'Kayıtlı analiz verisi.',
        sentenceScores: p.sentenceScores || [],
        metrics: p.metrics || {
          plagiarism: p.plagiarismScore ? p.plagiarismScore / 100 : 0,
          readability: 0.85,
          complexity: 'Standart',
          burstiness: 0.5,
          perplexity: 0.5,
          structureScore: 0.8,
        },
      });
    }
    if (p.mlAnalysis) {
      setMlAnalysis(p.mlAnalysis);
    }
    setShowHeatmap(true);
    setActiveTab('editor');
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
      setMobileTab(p.humanizedText ? 'result' : 'editor');
    }
  }, [setInputText, setHumanizedText, setOptions, setAnalysis, setAuditorResult, setMlAnalysis, setShowHeatmap, setActiveTab, setIsSidebarOpen, setMobileTab]);

  return {
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
  };
}
