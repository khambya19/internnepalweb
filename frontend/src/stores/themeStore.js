import { create } from 'zustand';

/**
 * Theme store that automatically follows system theme preference
 * Detects and responds to OS dark/light mode changes
 */

const THEME_STORAGE_KEY = 'internnepal-theme';

// Detect system theme preference
const getSystemTheme = () => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

const clearLegacyStoredTheme = () => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(THEME_STORAGE_KEY);
  } catch {
    // Ignore storage errors in restricted environments
  }
};

export const useThemeStore = create((set) => ({
  theme: getSystemTheme(),
  syncWithSystem: () => {
    clearLegacyStoredTheme();
    set({ theme: getSystemTheme() });
  },
}));

clearLegacyStoredTheme();

// Listen for system theme changes
if (typeof window !== 'undefined' && window.matchMedia) {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', (e) => {
    useThemeStore.setState({ theme: e.matches ? 'dark' : 'light' });
  });
}
