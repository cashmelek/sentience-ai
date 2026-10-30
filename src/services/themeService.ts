export interface AppTheme {
  id: string;
  name: string;
  order: number;
  category: 'light' | 'soft-dark' | 'deep-dark' | 'cyber';
  toneLabel: string;
  badge: string;
  description: string;
  colors: {
    bg: string;
    card: string;
    border: string;
    accent: string;
    accentRgb: string;
    text: string;
    textMuted: string;
    glow: string;
  };
}

export const ORDERED_THEMES: AppTheme[] = [
  {
    id: 'pure-light',
    name: '21st Minimal Beyaz',
    order: 1,
    category: 'light',
    toneLabel: '1. En Açık (Light)',
    badge: 'Açık Mod',
    description: '21st.dev saf beyaz kanvas, net siyah tipografi ve zümrüt aksan çizgileri.',
    colors: {
      bg: '#f8fafc',
      card: '#ffffff',
      border: 'rgba(15, 23, 42, 0.08)',
      accent: '#059669',
      accentRgb: '5, 150, 105',
      text: '#0f172a',
      textMuted: '#64748b',
      glow: 'rgba(5, 150, 105, 0.15)'
    }
  },
  {
    id: 'warm-paper',
    name: '21st Parşömen & Kağıt',
    order: 2,
    category: 'light',
    toneLabel: '2. Sıcak Açık (Warm)',
    badge: 'Akademik Kağıt',
    description: 'Göz yormayan doğal sıcak krem doku; editoryal okuma ve uzun tez yazımları için.',
    colors: {
      bg: '#fbf8f3',
      card: '#ffffff',
      border: 'rgba(180, 160, 140, 0.25)',
      accent: '#d97706',
      accentRgb: '217, 119, 6',
      text: '#292524',
      textMuted: '#78716c',
      glow: 'rgba(217, 119, 6, 0.18)'
    }
  },
  {
    id: 'nordic-slate',
    name: '21st Nordik Arduvaz',
    order: 3,
    category: 'soft-dark',
    toneLabel: '3. Yumuşak Koyu (Slate)',
    badge: 'Düşük Kontrast',
    description: 'Düşük parlaklıkta dengeli kurumsal mavi-gri zemin ve gök mavisi vurgular.',
    colors: {
      bg: '#1e293b',
      card: '#0f172a',
      border: 'rgba(255, 255, 255, 0.1)',
      accent: '#38bdf8',
      accentRgb: '56, 189, 248',
      text: '#f8fafc',
      textMuted: '#94a3b8',
      glow: 'rgba(56, 189, 248, 0.22)'
    }
  },
  {
    id: 'sentience-emerald',
    name: 'Sentience Zümrüt (Klasik)',
    order: 4,
    category: 'deep-dark',
    toneLabel: '4. Derin Koyu (Varsayılan)',
    badge: 'Varsayılan',
    description: 'Orijinal Sentience AI koyu arayüzü; karbon siyahı zemin ve neon zümrüt ışığı.',
    colors: {
      bg: '#050505',
      card: '#0a0a0a',
      border: 'rgba(255, 255, 255, 0.06)',
      accent: '#10b981',
      accentRgb: '16, 185, 129',
      text: '#ffffff',
      textMuted: '#9ca3af',
      glow: 'rgba(16, 185, 129, 0.25)'
    }
  },
  {
    id: 'midnight-ocean',
    name: '21st Gece Okyanusu',
    order: 5,
    category: 'deep-dark',
    toneLabel: '5. Gece Mavisi (Navy)',
    badge: 'Siber Mavi',
    description: '21st.dev siber gece teması; lacivert derinlik ve elektrik mavisi vurgular.',
    colors: {
      bg: '#030712',
      card: '#081026',
      border: 'rgba(59, 130, 246, 0.18)',
      accent: '#3b82f6',
      accentRgb: '59, 130, 246',
      text: '#f1f5f9',
      textMuted: '#94a3b8',
      glow: 'rgba(59, 130, 246, 0.28)'
    }
  },
  {
    id: 'cyber-neon',
    name: '21st Obsidyen Ametist',
    order: 6,
    category: 'cyber',
    toneLabel: '6. En Koyu (OLED Black)',
    badge: 'Ametist Neon',
    description: 'Tam zifiri OLED siyah zemin ve canlı ametist moru neon konturlar.',
    colors: {
      bg: '#000000',
      card: '#07050d',
      border: 'rgba(168, 85, 247, 0.22)',
      accent: '#a855f7',
      accentRgb: '168, 85, 247',
      text: '#fafafa',
      textMuted: '#a1a1aa',
      glow: 'rgba(168, 85, 247, 0.32)'
    }
  }
];

export const DEFAULT_THEME_ID = 'sentience-emerald';
const STORAGE_KEY = 'sentience_ui_theme';

export function getThemeById(themeId?: string | null): AppTheme {
  const found = ORDERED_THEMES.find(t => t.id === themeId);
  return found || ORDERED_THEMES.find(t => t.id === DEFAULT_THEME_ID)!;
}

export function getCurrentTheme(): AppTheme {
  if (typeof window === 'undefined') return getThemeById(DEFAULT_THEME_ID);
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return getThemeById(saved);
  } catch {
    return getThemeById(DEFAULT_THEME_ID);
  }
}

export function applyTheme(themeId: string): AppTheme {
  const theme = getThemeById(themeId);
  if (typeof window === 'undefined') return theme;

  try {
    localStorage.setItem(STORAGE_KEY, theme.id);
  } catch {}

  const root = document.documentElement;
  root.setAttribute('data-theme', theme.id);

  if (theme.category === 'light') {
    root.classList.add('theme-light');
  } else {
    root.classList.remove('theme-light');
  }

  root.style.setProperty('--brand-bg', theme.colors.bg);
  root.style.setProperty('--brand-card', theme.colors.card);
  root.style.setProperty('--brand-border', theme.colors.border);
  root.style.setProperty('--brand-accent', theme.colors.accent);
  root.style.setProperty('--brand-accent-rgb', theme.colors.accentRgb);
  root.style.setProperty('--brand-text', theme.colors.text);
  root.style.setProperty('--brand-muted', theme.colors.textMuted);
  root.style.setProperty('--brand-glow', theme.colors.glow);

  root.style.setProperty('--color-brand-bg', theme.colors.bg);
  root.style.setProperty('--color-brand-card', theme.colors.card);
  root.style.setProperty('--color-brand-border', theme.colors.border);

  window.dispatchEvent(new CustomEvent('sentience_theme_changed', { detail: theme }));
  return theme;
}

export function initTheme(): AppTheme {
  const current = getCurrentTheme();
  return applyTheme(current.id);
}
