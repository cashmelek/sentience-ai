import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface LandingCmsConfig {
  announcement: {
    enabled: boolean;
    text: string;
    linkText: string;
  };
  hero: {
    badge: string;
    title: string;
    subtitle: string;
    ctaPrimary: string;
    ctaSecondary: string;
  };
  stats: Array<{
    id: string;
    value: string;
    label: string;
    description: string;
  }>;
  footer: {
    description: string;
    email: string;
    phone: string;
    address: string;
    workingHours: string;
    copyright: string;
    twitterUrl: string;
    githubUrl: string;
    linkedinUrl: string;
    showTrustBadges?: boolean;
    showSocialLinks?: boolean;
    showModulesCol?: boolean;
    showGuidesCol?: boolean;
    showContactCol?: boolean;
    showAddress?: boolean;
    showEmail?: boolean;
    showPhone?: boolean;
    showWorkingHours?: boolean;
    showPrivacy?: boolean;
    showKvkk?: boolean;
    showTerms?: boolean;
    showCookies?: boolean;
    showBottomBar?: boolean;
  };
}

export const DEFAULT_LANDING_CONFIG: LandingCmsConfig = {
  announcement: {
    enabled: true,
    text: '2026 Lisansüstü Tez Teslim Dönemi: YÖK ve Enstitü intihal barajlarına tam uyumlu Denetçi & Sentinel devrede!',
    linkText: 'Kılavuza Git'
  },
  hero: {
    badge: 'Türkiye nin Öncü Akademik Doğrulama Ekosistemi',
    title: 'Yapay Zeka Tespiti ve İntihal Denetiminde Kesin Çözüm',
    subtitle: 'Cornell Tech ve bağımsız araştırmalarla kanıtlanmış %99.6 doğruluk. Denetçi, İnsanlaştırma ve Sentinel ile akademik çalışmalarınızı enstitü onayına hazırlayın.',
    ctaPrimary: 'Ücretsiz Deneyin',
    ctaSecondary: 'Kullanım Kılavuzu'
  },
  stats: [
    { id: '1', value: '%99.6', label: 'Tespit Doğruluğu', description: 'Cornell Tech arXiv & Bağımsız Testler' },
    { id: '2', value: '150.000+', label: 'İncelenen Tez & Makale', description: 'Türkiye Üniversiteleri ve Enstitüler' },
    { id: '3', value: '< %0.2', label: 'Yanlış Pozitif Toleransı', description: 'YÖK Standartlarında Sıfır Mağduriyet' },
    { id: '4', value: '0-Data', label: 'Gizlilik ve Sıfır-Veri', description: 'Admin Read-Only & Veri Saklamama' }
  ],
  footer: {
    description: 'Türkiye nin YÖK ve ÜAK standartlarına tam uyumlu yapay zeka tespiti, doğal insanlaştırma ve canlı intihal denetim ekosistemi.',
    email: 'destek@sentience.ai',
    phone: '+90 (850) 308 00 00',
    address: 'Bilkent Cyberpark, Tepe Binası No:418, Çankaya / Ankara',
    workingHours: 'Hafta içi 09:00 - 18:00',
    copyright: '© 2026 Sentience AI Inc. Tüm hakları saklıdır.',
    twitterUrl: 'https://twitter.com/sentience_ai',
    githubUrl: 'https://github.com/sentience-ai',
    linkedinUrl: 'https://linkedin.com/company/sentience-ai',
    showTrustBadges: true,
    showSocialLinks: true,
    showModulesCol: true,
    showGuidesCol: true,
    showContactCol: true,
    showAddress: true,
    showEmail: true,
    showPhone: true,
    showWorkingHours: true,
    showPrivacy: true,
    showKvkk: true,
    showTerms: true,
    showCookies: true,
    showBottomBar: true
  }
};

const DOC_PATH = 'settings/landingPage';
const STORAGE_KEY = 'sentience_landing_cms_cache';
let memoryConfigCache: LandingCmsConfig | null = null;

function getStoredLocalConfig(): LandingCmsConfig | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LandingCmsConfig;
  } catch {
    return null;
  }
}

function storeLocalConfig(cfg: LandingCmsConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  } catch {}
}

export const landingCmsService = {
  async fetchConfig(forceRefresh: boolean = false): Promise<LandingCmsConfig> {
    if (!forceRefresh && memoryConfigCache) {
      return memoryConfigCache;
    }

    const localSaved = getStoredLocalConfig();
    if (!forceRefresh && localSaved) {
      memoryConfigCache = localSaved;
    }

    try {
      const ref = doc(db, DOC_PATH);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data() as Partial<LandingCmsConfig>;
        const merged: LandingCmsConfig = {
          announcement: { ...DEFAULT_LANDING_CONFIG.announcement, ...(data.announcement || {}) },
          hero: { ...DEFAULT_LANDING_CONFIG.hero, ...(data.hero || {}) },
          stats: Array.isArray(data.stats) && data.stats.length > 0 ? data.stats : DEFAULT_LANDING_CONFIG.stats,
          footer: { ...DEFAULT_LANDING_CONFIG.footer, ...(data.footer || {}) }
        };
        memoryConfigCache = merged;
        storeLocalConfig(merged);
        return merged;
      }
      return localSaved || DEFAULT_LANDING_CONFIG;
    } catch (err) {
      console.warn('Landing CMS fetch fallback triggered:', err);
      return localSaved || DEFAULT_LANDING_CONFIG;
    }
  },

  async updateConfig(newConfig: Partial<LandingCmsConfig>): Promise<void> {
    const ref = doc(db, DOC_PATH);
    await setDoc(
      ref,
      {
        ...newConfig,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );

    const current = memoryConfigCache || getStoredLocalConfig() || DEFAULT_LANDING_CONFIG;
    const merged: LandingCmsConfig = {
      announcement: { ...current.announcement, ...(newConfig.announcement || {}) },
      hero: { ...current.hero, ...(newConfig.hero || {}) },
      stats: Array.isArray(newConfig.stats) && newConfig.stats.length > 0 ? newConfig.stats : current.stats,
      footer: { ...current.footer, ...(newConfig.footer || {}) }
    };

    memoryConfigCache = merged;
    storeLocalConfig(merged);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sentience_cms_updated', { detail: merged }));
    }
  }
};
