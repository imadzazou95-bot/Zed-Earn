import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { KEYS, Storage } from './storage';
import { Lang, TRANSLATIONS } from './data';

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  isRTL: boolean;
  ready: boolean;
};

const I18nCtx = createContext<Ctx>({
  lang: 'ar',
  setLang: () => {},
  t: (k) => k,
  isRTL: true,
  ready: false,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('ar');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const saved = await Storage.get<Lang | null>(KEYS.lang, null);
      if (saved) setLangState(saved);
      setReady(true);
    })();
  }, []);

  const value = useMemo<Ctx>(() => {
    const dict = TRANSLATIONS[lang];
    return {
      lang,
      ready,
      isRTL: lang === 'ar',
      setLang: (l: Lang) => {
        setLangState(l);
        Storage.set(KEYS.lang, l);
      },
      t: (key, params) => {
        let s = dict[key] ?? TRANSLATIONS.en[key] ?? key;
        if (params) {
          Object.keys(params).forEach((p) => {
            s = s.replace(new RegExp(`\\{${p}\\}`, 'g'), String(params[p]));
          });
        }
        return s;
      },
    };
  }, [lang, ready]);

  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export const useI18n = () => useContext(I18nCtx);

/** Format a number as Algerian dinar, e.g. 12 500,00 DZD */
export function formatDZD(amount: number, lang: Lang = 'en'): string {
  const n = (Math.round(amount * 100) / 100).toFixed(2);
  const [int, dec] = n.split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const unit = lang === 'ar' ? 'دج' : 'DZD';
  return `${grouped}.${dec} ${unit}`;
}

export const ALGERIAN_PHONE = /^0[5-7][0-9]{8}$/;
