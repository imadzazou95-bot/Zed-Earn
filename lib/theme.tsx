import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { KEYS, Storage } from './storage';

export type Palette = {
  dark: boolean;
  bg: string;
  surface: string;
  card: string;
  text: string;
  sub: string;
  border: string;
  primary: string;
  primary2: string;
  gold: string;
  gold2: string;
  green: string;
  red: string;
  purple: string;
  blue: string;
  overlay: string;
  chip: string;
};

const light: Palette = {
  dark: false,
  bg: '#F3F5FB',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  text: '#0F172A',
  sub: '#64748B',
  border: '#E4E8F1',
  primary: '#2563EB',
  primary2: '#4F46E5',
  gold: '#F59E0B',
  gold2: '#D97706',
  green: '#10B981',
  red: '#EF4444',
  purple: '#7C3AED',
  blue: '#0EA5E9',
  overlay: 'rgba(15,23,42,0.45)',
  chip: '#F1F5F9',
};

const dark: Palette = {
  dark: true,
  bg: '#080D19',
  surface: '#0F1626',
  card: '#141C2F',
  text: '#EEF2FF',
  sub: '#94A3B8',
  border: '#25304A',
  primary: '#3B82F6',
  primary2: '#6366F1',
  gold: '#FBBF24',
  gold2: '#F59E0B',
  green: '#34D399',
  red: '#F87171',
  purple: '#A78BFA',
  blue: '#38BDF8',
  overlay: 'rgba(0,0,0,0.6)',
  chip: '#1B2438',
};

type Ctx = { c: Palette; isDark: boolean; toggle: () => void; ready: boolean };
const ThemeCtx = createContext<Ctx>({ c: light, isDark: false, toggle: () => {}, ready: false });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [isDark, setIsDark] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const saved = await Storage.get<string | null>(KEYS.theme, null);
      setIsDark(saved ? saved === 'dark' : system === 'dark');
      setReady(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      c: isDark ? dark : light,
      isDark,
      ready,
      toggle: () => {
        setIsDark((p) => {
          Storage.set(KEYS.theme, !p ? 'dark' : 'light');
          return !p;
        });
      },
    }),
    [isDark, ready]
  );

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => useContext(ThemeCtx);
