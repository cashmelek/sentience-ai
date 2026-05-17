export type SubscriptionPlan = 'free' | 'pro' | 'premium';

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
  onboarding?: OnboardingState;
}

export const PLAN_LIMITS: Record<SubscriptionPlan, { dailyChars: number; promoChars: number; promoDays: number }> = {
  free: { dailyChars: 1500, promoChars: 5000, promoDays: 7 },
  pro: { dailyChars: 5000, promoChars: 7500, promoDays: 30 },
  premium: { dailyChars: 10000, promoChars: 20000, promoDays: 30 }
};

export interface CustomTone {
  id: string;
  name: string;
  description: string;
  userId: string;
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
  sources: { title: string; url: string; similarity: number; matchedSnippet: string }[];
  grammarSuggestions: any[]; // Changed from GrammarSuggestion to any to avoid circular import with geminiService if needed
  isDraft: boolean;
  createdAt: any;
  insights: any[];
  sentenceScores?: any[];
  metrics?: any;
}
