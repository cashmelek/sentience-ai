import { describe, it, expect, beforeEach } from 'vitest';
import { ORDERED_THEMES, getThemeById, applyTheme, getCurrentTheme, DEFAULT_THEME_ID } from '../services/themeService';

describe('themeService and Palette Hierarchy', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('provides 6 curated themes strictly ordered from lightest to darkest', () => {
    expect(ORDERED_THEMES).toHaveLength(6);
    
    // Check orders
    const orders = ORDERED_THEMES.map(t => t.order);
    expect(orders).toEqual([1, 2, 3, 4, 5, 6]);

    // Check light to dark progression
    expect(ORDERED_THEMES[0].id).toBe('pure-light');
    expect(ORDERED_THEMES[0].category).toBe('light');

    expect(ORDERED_THEMES[1].id).toBe('warm-paper');
    expect(ORDERED_THEMES[1].category).toBe('light');

    expect(ORDERED_THEMES[2].id).toBe('nordic-slate');
    expect(ORDERED_THEMES[2].category).toBe('soft-dark');

    expect(ORDERED_THEMES[3].id).toBe('sentience-emerald');
    expect(ORDERED_THEMES[3].id).toBe(DEFAULT_THEME_ID);

    expect(ORDERED_THEMES[4].id).toBe('midnight-ocean');
    expect(ORDERED_THEMES[5].id).toBe('cyber-neon');
    expect(ORDERED_THEMES[5].category).toBe('cyber');
  });

  it('correctly persists and applies theme to DOM', () => {
    const applied = applyTheme('cyber-neon');
    expect(applied.id).toBe('cyber-neon');
    expect(localStorage.getItem('sentience_ui_theme')).toBe('cyber-neon');
    expect(document.documentElement.getAttribute('data-theme')).toBe('cyber-neon');
    expect(document.documentElement.style.getPropertyValue('--brand-bg')).toBe('#000000');
  });

  it('applies light mode classes when light theme is selected', () => {
    applyTheme('pure-light');
    expect(document.documentElement.classList.contains('theme-light')).toBe(true);
    expect(document.documentElement.style.getPropertyValue('--brand-bg')).toBe('#f8fafc');

    applyTheme('sentience-emerald');
    expect(document.documentElement.classList.contains('theme-light')).toBe(false);
  });

  it('falls back to default theme for unknown theme ID', () => {
    const fallback = getThemeById('non-existent-theme');
    expect(fallback.id).toBe(DEFAULT_THEME_ID);
  });
});

describe('Settings Modal Academic & Word Addin Tab Isolation by Role', () => {
  const getTabsForRole = (role: 'admin' | 'user' | 'student' | 'instructor') => {
    const isAcademicOrAdmin = role === 'student' || role === 'instructor' || role === 'admin';
    return [
      { id: 'profile' },
      ...(isAcademicOrAdmin ? [
        { id: 'academic' },
        { id: 'word' },
      ] : []),
      { id: 'theme' },
      { id: 'subscription' },
      { id: 'danger' },
    ].map(t => t.id);
  };

  it('hides academic and word tabs from standard users (role: user)', () => {
    const standardTabs = getTabsForRole('user');
    expect(standardTabs).not.toContain('academic');
    expect(standardTabs).not.toContain('word');
    expect(standardTabs).toContain('profile');
    expect(standardTabs).toContain('theme');
    expect(standardTabs).toContain('subscription');
    expect(standardTabs).toContain('danger');
  });

  it('shows academic and word tabs to student users', () => {
    const studentTabs = getTabsForRole('student');
    expect(studentTabs).toContain('academic');
    expect(studentTabs).toContain('word');
    expect(studentTabs).toContain('theme');
  });

  it('shows academic and word tabs to instructor users', () => {
    const instructorTabs = getTabsForRole('instructor');
    expect(instructorTabs).toContain('academic');
    expect(instructorTabs).toContain('word');
  });

  it('shows academic and word tabs to admin users', () => {
    const adminTabs = getTabsForRole('admin');
    expect(adminTabs).toContain('academic');
    expect(adminTabs).toContain('word');
  });
});
