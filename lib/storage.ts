/**
 * storage.ts — LocalStorage (AsyncStorage) manager for Zed Earn.
 * Namespaced keys, JSON safe get/set, session-aware clearing.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export const KEYS = {
  /* identity & session */
  user: 'zed_user',
  auth: 'zed_auth',
  session: 'zed_session',
  legal: 'zed_legal',
  security: 'zed_security',
  /* flow flags */
  onboarding: 'zed_onboarding',
  guide: 'zed_guide',
  theme: 'zed_theme',
  lang: 'zed_lang',
  /* business data */
  tasks: 'zed_tasks',
  transactions: 'zed_transactions',
  withdrawals: 'zed_withdrawals',
  notifications: 'zed_notifications',
  kyc: 'zed_kyc',
  chat: 'zed_chat',
  referral: 'zed_referral',
  merchant: 'zed_merchant',
  campaigns: 'zed_campaigns',
  admin: 'zed_admin',
  audit: 'zed_audit',
  stats: 'zed_stats',
} as const;

export type StorageKey = (typeof KEYS)[keyof typeof KEYS];

export const Storage = {
  async get<T>(key: StorageKey, fallback: T): Promise<T> {
    try {
      const raw = await AsyncStorage.getItem(key);
      if (raw == null) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  },
  async set<T>(key: StorageKey, value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* quota / unavailable — ignore */
    }
  },
  async remove(key: StorageKey): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
  /** Clears the user session but keeps device preferences (theme, lang, onboarding). */
  async clearSession(): Promise<void> {
    const keep: StorageKey[] = [KEYS.theme, KEYS.lang, KEYS.onboarding, KEYS.security];
    const all = Object.values(KEYS) as StorageKey[];
    await Promise.all(all.filter((k) => !keep.includes(k)).map((k) => Storage.remove(k)));
  },
};
