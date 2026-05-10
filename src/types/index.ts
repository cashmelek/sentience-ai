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
  dailyUsage: number;
  lastResetDate: string;
  onboarding?: OnboardingState;
}

export const PLAN_LIMITS: Record<SubscriptionPlan, number> = {
  free: 10,
  pro: 50,
  premium: 500
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
}
