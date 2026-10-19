export type SubscriptionPlan = 'free' | 'pro' | 'premium';

// B22: Admin'in kullanıcı bazında açtığı özellik yetkileri (promoSite / classroom / trainingData)
export type GatedFeature = 'promoSite' | 'classroom' | 'trainingData';
export type FeatureGrants = Partial<Record<GatedFeature, boolean>>;

export interface OnboardingState {
  profileComplete: boolean;
  firstHumanize: boolean;
  firstAnalysis: boolean;
  firstDraft: boolean;
  dismissed: boolean;
}

export interface AppUser {
  uid: string;
  email: string | null;
  role: 'admin' | 'user';
  plan: SubscriptionPlan;
  dailyUsage: number; // Represents daily character usage
  lastResetDate: string;
  createdAt: string; // ISO date string of account creation
  lastActiveAt?: string | null;
  isActive?: boolean;
  onboarding?: OnboardingState;
  // B21 — sınıf/ödev altyapısı: teslim bazlı günlük kota (D3) ve KVKK aydınlatma onayı (D2)
  submissionUsage?: number;
  submissionResetDate?: string;
  kvkkAcceptedAt?: string;
  // B22: admin tarafından tanınan özellik erişimleri (kullanıcı kendi yazamaz — firestore.rules)
  featureGrants?: FeatureGrants;
}

export const PLAN_LIMITS: Record<SubscriptionPlan, { dailyRequests: number; promoRequests: number; promoDays: number; dailyChars: number; promoChars: number }> = {
  free: { dailyRequests: 5, promoRequests: 20, promoDays: 7, dailyChars: 10000, promoChars: 25000 },
  pro: { dailyRequests: 50, promoRequests: 100, promoDays: 30, dailyChars: 100000, promoChars: 250000 },
  premium: { dailyRequests: 200, promoRequests: 500, promoDays: 30, dailyChars: 500000, promoChars: 1000000 }
};

export interface CustomTone {
  id: string;
  name: string;
  description: string;
  userId: string;
}

export type CitationStyle = 'apa' | 'mla' | 'ieee';

export interface Citation {
  sourceUrl: string;
  style: CitationStyle;
  formatted: string;
}

import type { PlagiarismSource } from '../services/sentinelService';
import type { AnalysisResult } from '../services/geminiService';
import type { IntegrityReport } from '../ml/textFeatures';

export type CombinedAnalysisResult = AnalysisResult & {
  similarityScore?: number;
  sources?: any[];
  isPlagiarized?: boolean;
  matchedPhrases?: { text: string, source: string, score: number }[];
  // B22: Sentinel taramasının gerçek durumu — 'ok' değilse kaynak/skor verisi YOKTUR, UI bunu söylemek zorunda
  scanStatus?: 'ok' | 'disabled' | 'offline' | 'not_configured' | 'failed';
  queriesRun?: number;
  queriesFailed?: number;
};

export interface AuditorResult {
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
  integrityReport?: IntegrityReport;
}

export interface SystemSettings {
  sentinelEnabled: boolean;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  auditorSensitivity: number;
  auditorModel: string;
  ghostWriterModel: string;
  // İntihal tespiti ayarları
  sentinelSearchPhrasesCount: number;
  sentinelMinWordCount: number;
  sentinelUseDynamicSimilarity: boolean;
  sentinelTrustFilter: boolean;
  sentinelRegionFilter: boolean;
  // B22: özelliklerin herkese açık olup olmadığı (false = yalnız admin + yetki verilen kullanıcılar)
  featureAccess?: Record<GatedFeature, boolean>;
}

export interface Project {
  id: string;
  title: string;
  originalText: string;
  humanizedText: string;
  tone: string;
  intensity: number;
  aiScore: number;
  plagiarismScore: number;
  sources: PlagiarismSource[];
  grammarSuggestions: any[]; // Changed from GrammarSuggestion to any to avoid circular import with geminiService if needed
  isDraft: boolean;
  createdAt: any;
  insights: any[];
  sentenceScores?: any[];
  metrics?: any;
  auditorResult?: any;
  mlAnalysis?: any;
  analysis?: any;
}
