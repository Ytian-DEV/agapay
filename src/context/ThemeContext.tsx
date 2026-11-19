import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  mode: ThemeMode;
  resolved: 'light' | 'dark';
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
const STORAGE_KEY = 'agapay_theme_mode';

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
      if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
    } catch {
      // ignore storage failure
    }
    return 'light';
  });

  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(getSystemTheme);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemTheme(e.matches ? 'dark' : 'light');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const resolved: 'light' | 'dark' = mode === 'system' ? systemTheme : mode;

  useEffect(() => {
    const root = document.documentElement;
    if (resolved === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [resolved]);

  const setMode = (next: ThemeMode) => {
    setModeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore storage failure
    }
  };

  const toggle = () => {
    setMode(resolved === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ mode, resolved, setMode, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
