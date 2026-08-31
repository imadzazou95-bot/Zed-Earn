import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { KEYS, Storage } from './storage';
import {
  DEMO_NOTIFICATIONS,
  Difficulty,
  Lang,
  NotifType,
  SUPPORT_REPLIES,
  TASKS,
  TaskDef,
} from './data';
import {
  ChainInput,
  GENESIS_HASH,
  RateLimiter,
  Session,
  createSession,
  hashEntry,
  isSessionValid,
  sanitize,
  sha256,
  touchSession,
  verifyChain,
} from './security';
import { LEGAL_VERSION } from './legal';
import {
  CommissionBreakdown,
  LevelKey,
  MethodKey,
  POLICY,
  campaignCost,
  computeCommission,
  levelForCompleted,
  withdrawalFee,
} from './policy';

/* ── Types ─────────────────────────────────────────── */
export type Role = 'user' | 'merchant' | 'admin';

export type User = {
  phone: string;
  email: string;
  name: string;
  birthdate: string;
  wilaya: string;
  ccp: string;
  avatar: string | null;
  joined: string;
  role: Role;
  merchantEnabled: boolean;
};

export type TaskStatus = 'available' | 'accepted' | 'review' | 'completed' | 'rejected';
export type TaskState = {
  status: TaskStatus;
  proof?: string | null;
  ts: number;
  attempts: number;
  reason?: string;
  reviewedBy?: 'admin' | 'auto';
};

export type TxType = 'task' | 'withdraw' | 'deposit' | 'referral' | 'bonus' | 'campaign';
export type Tx = ChainInput & {
  id: string;
  kind: 'in' | 'out';
  type: TxType;
  status: 'done';
  hash: string;
  note?: string;
};

export type WithdrawStatus = 'pending' | 'approved' | 'rejected';
export type Withdrawal = {
  id: string;
  amount: number;
  fee: number;
  net: number;
  method: MethodKey;
  status: WithdrawStatus;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: 'admin' | 'auto';
  reason?: string;
};

export type KycStatus = 'none' | 'pending' | 'approved' | 'rejected';
export type Kyc = {
  status: KycStatus;
  front: string | null;
  back: string | null;
  selfie: string | null;
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: 'admin' | 'auto';
  reason?: string;
};

export type CampaignStatus = 'pending' | 'approved' | 'rejected';
export type Campaign = {
  id: string;
  title: string;
  desc: string;
  reward: number;
  fee: number;
  difficulty: Difficulty;
  requirements: string[];
  steps: string[];
  status: CampaignStatus;
  reason?: string;
  createdAt: string;
  owner: string;
  sales: number;
};

export type Notif = {
  id: string;
  type: NotifType;
  read: boolean;
  ts: number;
  title?: Record<Lang, string>;
  body?: Record<Lang, string>;
  time?: Record<Lang, string>;
  titleKey?: string;
  bodyKey?: string;
  params?: Record<string, string>;
};

export type ChatMsg = { id: string; from: 'user' | 'support'; text: string; time: string };

export type AuditEntry = {
  id: string;
  ts: number;
  actor: 'user' | 'admin' | 'auto' | 'system';
  action: string;
  target: string;
  meta?: string;
};

export type LegalAcceptance = { version: string; acceptedAt: string } | null;

const uid = () => Math.random().toString(36).slice(2, 10);
const nowISO = () => new Date().toISOString();
const clock = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export const ADMIN_PIN = '2468';

const emptyUser: User = {
  phone: '',
  email: '',
  name: '',
  birthdate: '',
  wilaya: '',
  ccp: '',
  avatar: null,
  joined: '',
  role: 'user',
  merchantEnabled: false,
};

const emptyKyc: Kyc = { status: 'none', front: null, back: null, selfie: null };

/* Demo review delays (production: real reviewers) */
const AUTO_PROOF_MS = 20000;
const AUTO_KYC_MS = 18000;
const AUTO_WD_MS = 25000;

type Ctx = {
  ready: boolean;
  onboarded: boolean;
  authed: boolean;
  guided: boolean;
  session: Session | null;
  role: Role;
  isAdmin: boolean;
  isMerchant: boolean;
  user: User;
  legal: LegalAcceptance;
  taskStates: Record<string, TaskState>;
  txs: Tx[];
  withdrawals: Withdrawal[];
  notifs: Notif[];
  kyc: Kyc;
  chat: ChatMsg[];
  campaigns: Campaign[];
  audit: AuditEntry[];
  disabledTasks: string[];
  referralCode: string;
  referralCount: number;
  referralEarnings: number;
  /* money */
  ledgerBalance: number;
  lockedBalance: number;
  availableBalance: number;
  totalIn: number;
  totalOut: number;
  withdrawnToday: number;
  ledgerCheck: { valid: boolean; brokenAt: number | null; length: number; head: string };
  /* progress */
  completedCount: number;
  activeCount: number;
  level: LevelKey;
  levelProgress: { next: LevelKey | null; pct: number; current: number; target: number };
  unreadCount: number;
  vipUnlocked: boolean;
  pendingReviewCount: number;
  allTasks: TaskDef[];
  commissionFor: (base: number) => CommissionBreakdown;
  /* actions */
  finishOnboarding: () => void;
  signIn: (phone: string, email: string) => void;
  signOut: (reason?: string) => void;
  touch: () => void;
  finishGuide: () => void;
  saveProfile: (patch: Partial<User>) => void;
  acceptLegal: () => void;
  grantAdmin: (pin: string) => boolean;
  revokeAdmin: () => void;
  enableMerchant: () => boolean;
  acceptTask: (id: string) => void;
  cancelTask: (id: string) => void;
  submitProof: (id: string, proof: string) => void;
  reviewProof: (id: string, decision: 'approve' | 'reject', reason?: string, by?: 'admin' | 'auto') => void;
  submitKyc: () => void;
  setKycImage: (slot: 'front' | 'back' | 'selfie', uri: string) => void;
  reviewKyc: (decision: 'approve' | 'reject', reason?: string, by?: 'admin' | 'auto') => void;
  requestWithdraw: (amount: number, method: MethodKey) => { ok: boolean; errorKey?: string };
  reviewWithdraw: (id: string, decision: 'approve' | 'reject', reason?: string, by?: 'admin' | 'auto') => void;
  addDeposit: (amount: number) => void;
  createCampaign: (c: { title: string; desc: string; reward: number; difficulty: Difficulty; requirements: string[]; steps: string[] }) => void;
  reviewCampaign: (id: string, decision: 'approve' | 'reject', reason?: string) => void;
  toggleTaskEnabled: (id: string) => boolean;
  markAllRead: () => void;
  markRead: (id: string) => void;
  sendChat: (text: string, lang: Lang) => void;
  pushNotif: (n: { type: NotifType; titleKey: string; bodyKey: string; params?: Record<string, string> }) => void;
  sessionNotice: string | null;
  clearSessionNotice: () => void;
};

const AppCtx = createContext<Ctx>({} as Ctx);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [onboarded, setOnboarded] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [guided, setGuided] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User>(emptyUser);
  const [legal, setLegal] = useState<LegalAcceptance>(null);
  const [taskStates, setTaskStates] = useState<Record<string, TaskState>>({});
  const [txs, setTxs] = useState<Tx[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [kyc, setKyc] = useState<Kyc>(emptyKyc);
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [disabledTasks, setDisabledTasks] = useState<string[]>([]);
  const [referral, setReferral] = useState({ code: '', count: 0, earnings: 0 });
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);

  const timers = useRef<Record<string, any>>({});
  const txsRef = useRef<Tx[]>([]);
  txsRef.current = txs;
  const wdRef = useRef<Withdrawal[]>([]);
  wdRef.current = withdrawals;
  const taskStatesRef = useRef<Record<string, TaskState>>({});
  taskStatesRef.current = taskStates;

  /* ── Load ──────────────────────────────────────── */
  useEffect(() => {
    (async () => {
      await RateLimiter.load();
      const [ob, sess, guide, u, lg, ts, tx, wd, nt, ky, ch, rf, cp, ad, adm] = await Promise.all([
        Storage.get<boolean>(KEYS.onboarding, false),
        Storage.get<Session | null>(KEYS.session, null),
        Storage.get<boolean>(KEYS.guide, false),
        Storage.get<User>(KEYS.user, emptyUser),
        Storage.get<LegalAcceptance>(KEYS.legal, null),
        Storage.get<Record<string, TaskState>>(KEYS.tasks, {}),
        Storage.get<Tx[]>(KEYS.transactions, []),
        Storage.get<Withdrawal[]>(KEYS.withdrawals, []),
        Storage.get<Notif[] | null>(KEYS.notifications, null),
        Storage.get<Kyc>(KEYS.kyc, emptyKyc),
        Storage.get<ChatMsg[]>(KEYS.chat, []),
        Storage.get<{ code: string; count: number; earnings: number }>(KEYS.referral, { code: '', count: 0, earnings: 0 }),
        Storage.get<Campaign[]>(KEYS.campaigns, []),
        Storage.get<AuditEntry[]>(KEYS.audit, []),
        Storage.get<{ disabledTasks: string[] }>(KEYS.admin, { disabledTasks: [] }),
      ]);

      setOnboarded(ob);
      setGuided(guide);
      setUser(u);
      setLegal(lg);
      setTaskStates(ts);
      setTxs(tx);
      setWithdrawals(wd);
      setNotifs(
        nt ??
          DEMO_NOTIFICATIONS.map((d, i) => ({
            id: d.id,
            type: d.type,
            read: d.read,
            ts: Date.now() - i * 3600_000,
            title: d.title,
            body: d.body,
            time: d.time,
          }))
      );
      setKyc(ky);
      setChat(ch);
      setReferral(rf);
      setCampaigns(cp);
      setAudit(ad);
      setDisabledTasks(adm.disabledTasks ?? []);

      /* session guard */
      if (isSessionValid(sess)) {
        const refreshed = touchSession(sess as Session);
        setSession(refreshed);
        Storage.set(KEYS.session, refreshed);
        setAuthed(true);
      } else if (sess) {
        await Storage.remove(KEYS.session);
        await Storage.set(KEYS.auth, false);
        setSessionNotice('sessionExpired');
        setAuthed(false);
      }
      setReady(true);
    })();
  }, []);

  /* ── Persist helpers ───────────────────────────── */
  const persistTasks = (v: Record<string, TaskState>) => Storage.set(KEYS.tasks, v);
  const persistTxs = (v: Tx[]) => Storage.set(KEYS.transactions, v);
  const persistWd = (v: Withdrawal[]) => Storage.set(KEYS.withdrawals, v);
  const persistNotifs = (v: Notif[]) => Storage.set(KEYS.notifications, v);
  const persistCampaigns = (v: Campaign[]) => Storage.set(KEYS.campaigns, v);

  const logAudit = useCallback((actor: AuditEntry['actor'], action: string, target: string, meta?: string) => {
    setAudit((prev) => {
      const next = [{ id: uid(), ts: Date.now(), actor, action, target, meta }, ...prev].slice(0, 200);
      Storage.set(KEYS.audit, next);
      return next;
    });
  }, []);

  const pushNotif: Ctx['pushNotif'] = useCallback((n) => {
    setNotifs((prev) => {
      const next: Notif[] = [
        { id: uid(), type: n.type, read: false, ts: Date.now(), titleKey: n.titleKey, bodyKey: n.bodyKey, params: n.params },
        ...prev,
      ];
      persistNotifs(next);
      return next;
    });
  }, []);

  /* ── Ledger (hash-chained, append-only) ────────── */
  const appendTx = useCallback(
    (entry: { kind: 'in' | 'out'; type: TxType; amount: number; ref: string; note?: string }) => {
      setTxs((prev) => {
        const prevHash = prev.length ? prev[0].hash : GENESIS_HASH;
        const seq = prev.length + 1;
        const date = nowISO();
        const base: ChainInput = { seq, kind: entry.kind, type: entry.type, amount: entry.amount, ref: entry.ref, date, prevHash };
        const tx: Tx = {
          ...base,
          kind: entry.kind,
          type: entry.type,
          id: uid(),
          status: 'done',
          hash: hashEntry(base),
          note: entry.note,
        };
        const next = [tx, ...prev];
        persistTxs(next);
        return next;
      });
    },
    []
  );

  const ledgerCheck = useMemo(() => verifyChain(txs), [txs]);

  /* ── Derived money ─────────────────────────────── */
  const totalIn = useMemo(() => txs.filter((t) => t.kind === 'in').reduce((s, t) => s + t.amount, 0), [txs]);
  const totalOut = useMemo(() => txs.filter((t) => t.kind === 'out').reduce((s, t) => s + t.amount, 0), [txs]);
  const ledgerBalance = totalIn - totalOut;
  const lockedBalance = useMemo(
    () => withdrawals.filter((w) => w.status === 'pending').reduce((s, w) => s + w.amount, 0),
    [withdrawals]
  );
  const availableBalance = Math.max(0, ledgerBalance - lockedBalance);
  const withdrawnToday = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return withdrawals
      .filter((w) => w.status !== 'rejected' && new Date(w.createdAt).getTime() >= start.getTime())
      .reduce((s, w) => s + w.amount, 0);
  }, [withdrawals]);

  /* ── Derived progress ──────────────────────────── */
  const completedCount = useMemo(
    () => Object.values(taskStates).filter((t) => t.status === 'completed').length,
    [taskStates]
  );
  const activeCount = useMemo(
    () => Object.values(taskStates).filter((t) => t.status === 'accepted' || t.status === 'review' || t.status === 'rejected').length,
    [taskStates]
  );
  const pendingReviewCount = useMemo(
    () =>
      Object.values(taskStates).filter((t) => t.status === 'review').length +
      (kyc.status === 'pending' ? 1 : 0) +
      withdrawals.filter((w) => w.status === 'pending').length +
      campaigns.filter((c) => c.status === 'pending').length,
    [taskStates, kyc.status, withdrawals, campaigns]
  );
  const vipUnlocked = completedCount >= POLICY.vipUnlockTasks;
  const level = levelForCompleted(completedCount);

  const levelProgress = useMemo(() => {
    const tiers: { key: LevelKey; min: number }[] = [
      { key: 'lvlBeginner', min: POLICY.levelThresholds.lvlBeginner },
      { key: 'lvlActive', min: POLICY.levelThresholds.lvlActive },
      { key: 'lvlPro', min: POLICY.levelThresholds.lvlPro },
      { key: 'lvlVip', min: POLICY.levelThresholds.lvlVip },
    ];
    const idx = tiers.findIndex((t) => t.key === level);
    const next = idx < tiers.length - 1 ? tiers[idx + 1] : null;
    if (!next) return { next: null, pct: 1, current: completedCount, target: completedCount };
    const base = tiers[idx].min;
    return { next: next.key, pct: Math.min(1, (completedCount - base) / (next.min - base)), current: completedCount, target: next.min };
  }, [level, completedCount]);

  const unreadCount = notifs.filter((n) => !n.read).length;
  const role: Role = user.role ?? 'user';
  const isAdmin = role === 'admin';
  const isMerchant = role === 'merchant' || user.merchantEnabled || isAdmin;

  const commissionFor = useCallback((base: number) => computeCommission(base, level), [level]);

  /* ── Tasks (built-in + approved campaigns) ─────── */
  const allTasks = useMemo(() => {
    const tri = (s: string) => ({ ar: s, fr: s, en: s });
    const triA = (a: string[]) => ({ ar: a, fr: a, en: a });
    const custom: TaskDef[] = campaigns
      .filter((c) => c.status === 'approved')
      .map((c) => ({
        id: c.id,
        icon: 'megaphone',
        color: '#7C3AED',
        difficulty: c.difficulty,
        reward: c.reward,
        title: tri(c.title),
        desc: tri(c.desc),
        requirements: triA(c.requirements.length ? c.requirements : ['—']),
        steps: triA(c.steps.length ? c.steps : ['—']),
      }));
    const merged = [...custom, ...TASKS];
    return isAdmin ? merged : merged.filter((t) => !disabledTasks.includes(t.id));
  }, [campaigns, disabledTasks, isAdmin]);

  /* ── Session ───────────────────────────────────── */
  const touch = useCallback(() => {
    setSession((prev) => {
      if (!prev) return prev;
      if (prev.expiresAt - Date.now() > 23 * 60 * 60 * 1000) return prev; // throttle writes
      const next = touchSession(prev);
      Storage.set(KEYS.session, next);
      return next;
    });
  }, []);

  const signOut = useCallback(
    async (reason?: string) => {
      Object.values(timers.current).forEach((t) => clearTimeout(t));
      timers.current = {};
      await Storage.clearSession();
      setSession(null);
      setAuthed(false);
      setGuided(false);
      setUser(emptyUser);
      setLegal(null);
      setTaskStates({});
      setTxs([]);
      setWithdrawals([]);
      setKyc(emptyKyc);
      setChat([]);
      setCampaigns([]);
      setAudit([]);
      setDisabledTasks([]);
      setReferral({ code: '', count: 0, earnings: 0 });
      setNotifs(
        DEMO_NOTIFICATIONS.map((d, i) => ({
          id: d.id,
          type: d.type,
          read: d.read,
          ts: Date.now() - i * 3600_000,
          title: d.title,
          body: d.body,
          time: d.time,
        }))
      );
      if (reason) setSessionNotice(reason);
    },
    []
  );

  /* session watchdog */
  useEffect(() => {
    if (!authed || !session) return;
    const id = setInterval(() => {
      if (!isSessionValid(session)) signOut('sessionExpired');
    }, 30000);
    return () => clearInterval(id);
  }, [authed, session, signOut]);

  /* ── Auth ──────────────────────────────────────── */
  const makeCode = (name: string, phone: string) => {
    const base = (name || 'ZED').replace(/[^a-zA-Z\u0600-\u06FF]/g, '').slice(0, 5).toUpperCase() || 'USER';
    const digits = phone.slice(-4) || String(Math.floor(1000 + Math.random() * 9000));
    return `ZED-${base}-${digits}`;
  };

  const finishOnboarding = useCallback(() => {
    setOnboarded(true);
    Storage.set(KEYS.onboarding, true);
  }, []);

  const signIn: Ctx['signIn'] = useCallback(
    (phone, email) => {
      const finalEmail = sanitize(email, 80) || `user${Math.floor(100000 + Math.random() * 899999)}@zedearn.dz`;
      const u: User = { ...emptyUser, phone: sanitize(phone, 10), email: finalEmail, joined: nowISO() };
      const s = createSession('user');
      setUser(u);
      Storage.set(KEYS.user, u);
      setSession(s);
      Storage.set(KEYS.session, s);
      Storage.set(KEYS.auth, true);
      setAuthed(true);
      setSessionNotice(null);

      const ref = { code: makeCode('', phone), count: 3, earnings: POLICY.referralBonus * 3 };
      setReferral(ref);
      Storage.set(KEYS.referral, ref);
      setChat([]);
      Storage.set(KEYS.chat, []);

      const acceptance = { version: LEGAL_VERSION, acceptedAt: nowISO() };
      setLegal(acceptance);
      Storage.set(KEYS.legal, acceptance);

      RateLimiter.reset('otp_verify');
      logAudit('system', 'session.created', s.device, `role=user`);
    },
    [logAudit]
  );

  const finishGuide = useCallback(() => {
    setGuided(true);
    Storage.set(KEYS.guide, true);
  }, []);

  const acceptLegal = useCallback(() => {
    const acceptance = { version: LEGAL_VERSION, acceptedAt: nowISO() };
    setLegal(acceptance);
    Storage.set(KEYS.legal, acceptance);
  }, []);

  const saveProfile: Ctx['saveProfile'] = useCallback((patch) => {
    setUser((prev) => {
      const next: User = { ...prev, ...patch };
      Storage.set(KEYS.user, next);
      setReferral((r) => {
        const code = makeCode(next.name, next.phone);
        if (r.code === code) return r;
        const nr = { ...r, code };
        Storage.set(KEYS.referral, nr);
        return nr;
      });
      return next;
    });
  }, []);

  /* ── Roles ─────────────────────────────────────── */
  const grantAdmin = useCallback(
    (pin: string) => {
      if (sha256(pin) !== sha256(ADMIN_PIN)) return false;
      setUser((prev) => {
        const next = { ...prev, role: 'admin' as Role };
        Storage.set(KEYS.user, next);
        return next;
      });
      setSession((prev) => {
        if (!prev) return prev;
        const next = { ...prev, role: 'admin' as Role };
        Storage.set(KEYS.session, next);
        return next;
      });
      logAudit('admin', 'role.granted', 'admin');
      return true;
    },
    [logAudit]
  );

  const revokeAdmin = useCallback(() => {
    setUser((prev) => {
      const next = { ...prev, role: (prev.merchantEnabled ? 'merchant' : 'user') as Role };
      Storage.set(KEYS.user, next);
      return next;
    });
    setSession((prev) => {
      if (!prev) return prev;
      const next = { ...prev, role: 'user' as Role };
      Storage.set(KEYS.session, next);
      return next;
    });
    logAudit('admin', 'role.revoked', 'admin');
  }, [logAudit]);

  const enableMerchant = useCallback(() => {
    if (kyc.status !== 'approved') return false;
    setUser((prev) => {
      const next: User = { ...prev, merchantEnabled: true, role: prev.role === 'admin' ? 'admin' : 'merchant' };
      Storage.set(KEYS.user, next);
      return next;
    });
    logAudit('user', 'role.merchant.enabled', 'merchant');
    return true;
  }, [kyc.status, logAudit]);

  /* ── Tasks ─────────────────────────────────────── */
  const acceptTask = useCallback(
    (id: string) => {
      setTaskStates((prev) => {
        const next = { ...prev, [id]: { status: 'accepted' as TaskStatus, proof: null, ts: Date.now(), attempts: prev[id]?.attempts ?? 0 } };
        persistTasks(next);
        return next;
      });
      logAudit('user', 'task.accepted', id);
    },
    [logAudit]
  );

  const cancelTask = useCallback(
    (id: string) => {
      setTaskStates((prev) => {
        const next = { ...prev };
        delete next[id];
        persistTasks(next);
        return next;
      });
      logAudit('user', 'task.cancelled', id);
    },
    [logAudit]
  );

  const reviewProof = useCallback(
    (id: string, decision: 'approve' | 'reject', reason?: string, by: 'admin' | 'auto' = 'admin') => {
      if (timers.current[`proof_${id}`]) {
        clearTimeout(timers.current[`proof_${id}`]);
        delete timers.current[`proof_${id}`];
      }
      const def = allTasks.find((t) => t.id === id) ?? TASKS.find((t) => t.id === id);
      if (!def) return;

      if (decision === 'approve') {
        if (taskStatesRef.current[id]?.status !== 'review') return;
        if (txsRef.current.some((t) => t.type === 'task' && t.ref === id)) return;
        setTaskStates((prev) => {
          if (prev[id]?.status !== 'review') return prev;
          const next = { ...prev, [id]: { ...prev[id], status: 'completed' as TaskStatus, ts: Date.now(), reviewedBy: by } };
          persistTasks(next);
          return next;
        });
        const breakdown = computeCommission(def.reward, level);
        appendTx({ kind: 'in', type: 'task', amount: breakdown.total, ref: id, note: `base=${breakdown.base};bonus=${breakdown.bonus}` });
        pushNotif({ type: 'success', titleKey: 'statusDone', bodyKey: 'doneMsg', params: { amount: `${breakdown.total} DZD` } });
        logAudit(by === 'auto' ? 'auto' : 'admin', 'proof.approved', id, `+${breakdown.total} DZD`);
      } else {
        const why = sanitize(reason || '—', 120);
        if (!taskStatesRef.current[id]) return;
        setTaskStates((prev) => {
          if (!prev[id]) return prev;
          const next = {
            ...prev,
            [id]: { ...prev[id], status: 'rejected' as TaskStatus, ts: Date.now(), reason: why, reviewedBy: by },
          };
          persistTasks(next);
          return next;
        });
        pushNotif({ type: 'warning', titleKey: 'proofRejected', bodyKey: 'proofRejected', params: { reason: why } });
        logAudit(by === 'auto' ? 'auto' : 'admin', 'proof.rejected', id, why);
      }
    },
    [allTasks, appendTx, level, logAudit, pushNotif]
  );

  const scheduleProofReview = useCallback(
    (id: string, delay: number) => {
      if (timers.current[`proof_${id}`]) clearTimeout(timers.current[`proof_${id}`]);
      timers.current[`proof_${id}`] = setTimeout(() => reviewProof(id, 'approve', undefined, 'auto'), Math.max(1500, delay));
    },
    [reviewProof]
  );

  const submitProof = useCallback(
    (id: string, proof: string) => {
      setTaskStates((prev) => {
        const attempts = (prev[id]?.attempts ?? 0) + 1;
        const next = { ...prev, [id]: { status: 'review' as TaskStatus, proof, ts: Date.now(), attempts } };
        persistTasks(next);
        return next;
      });
      scheduleProofReview(id, AUTO_PROOF_MS);
      pushNotif({ type: 'info', titleKey: 'statusReview', bodyKey: 'reviewMsg' });
      logAudit('user', 'proof.submitted', id);
    },
    [scheduleProofReview, pushNotif, logAudit]
  );

  /* ── KYC ───────────────────────────────────────── */
  const setKycImage = useCallback((slot: 'front' | 'back' | 'selfie', uri: string) => {
    setKyc((prev) => {
      const next = { ...prev, [slot]: uri };
      Storage.set(KEYS.kyc, next);
      return next;
    });
  }, []);

  const reviewKyc = useCallback(
    (decision: 'approve' | 'reject', reason?: string, by: 'admin' | 'auto' = 'admin') => {
      if (timers.current.kyc) {
        clearTimeout(timers.current.kyc);
        delete timers.current.kyc;
      }
      setKyc((prev) => {
        if (prev.status !== 'pending') return prev;
        const next: Kyc = {
          ...prev,
          status: decision === 'approve' ? 'approved' : 'rejected',
          reviewedAt: nowISO(),
          reviewedBy: by,
          reason: decision === 'reject' ? sanitize(reason || '—', 120) : undefined,
        };
        Storage.set(KEYS.kyc, next);
        return next;
      });
      if (decision === 'approve') {
        pushNotif({ type: 'success', titleKey: 'kycTitle', bodyKey: 'kycApprovedMsg' });
        logAudit(by === 'auto' ? 'auto' : 'admin', 'kyc.approved', 'kyc');
      } else {
        pushNotif({ type: 'warning', titleKey: 'kycTitle', bodyKey: 'kycRejectedMsg', params: { reason: sanitize(reason || '—', 120) } });
        logAudit(by === 'auto' ? 'auto' : 'admin', 'kyc.rejected', 'kyc', reason);
      }
    },
    [logAudit, pushNotif]
  );

  const submitKyc = useCallback(() => {
    setKyc((prev) => {
      const next: Kyc = { ...prev, status: 'pending', submittedAt: nowISO(), reason: undefined };
      Storage.set(KEYS.kyc, next);
      return next;
    });
    pushNotif({ type: 'info', titleKey: 'kycTitle', bodyKey: 'kycSent' });
    logAudit('user', 'kyc.submitted', 'kyc');
    if (timers.current.kyc) clearTimeout(timers.current.kyc);
    timers.current.kyc = setTimeout(() => reviewKyc('approve', undefined, 'auto'), AUTO_KYC_MS);
  }, [logAudit, pushNotif, reviewKyc]);

  /* ── Withdrawals ───────────────────────────────── */
  const reviewWithdraw = useCallback(
    (id: string, decision: 'approve' | 'reject', reason?: string, by: 'admin' | 'auto' = 'admin') => {
      if (timers.current[`wd_${id}`]) {
        clearTimeout(timers.current[`wd_${id}`]);
        delete timers.current[`wd_${id}`];
      }
      const target = wdRef.current.find((w) => w.id === id);
      if (!target || target.status !== 'pending') return;
      setWithdrawals((prev) => {
        const found = prev.find((w) => w.id === id);
        if (!found || found.status !== 'pending') return prev;
        const next = prev.map((w) =>
          w.id === id
            ? {
                ...w,
                status: (decision === 'approve' ? 'approved' : 'rejected') as WithdrawStatus,
                reviewedAt: nowISO(),
                reviewedBy: by,
                reason: decision === 'reject' ? sanitize(reason || '—', 120) : undefined,
              }
            : w
        );
        persistWd(next);
        return next;
      });

      if (decision === 'approve') {
        appendTx({ kind: 'out', type: 'withdraw', amount: target.amount, ref: target.method, note: `fee=${target.fee};net=${target.net}` });
        pushNotif({ type: 'success', titleKey: 'withdrawals', bodyKey: 'wdApprovedMsg', params: { amount: `${target.net} DZD` } });
        logAudit(by === 'auto' ? 'auto' : 'admin', 'withdraw.approved', id, `${target.amount} DZD`);
      } else {
        pushNotif({ type: 'warning', titleKey: 'withdrawals', bodyKey: 'wdRejectedMsg', params: { reason: sanitize(reason || '—', 120) } });
        logAudit(by === 'auto' ? 'auto' : 'admin', 'withdraw.rejected', id, reason);
      }
    },
    [appendTx, logAudit, pushNotif]
  );

  const requestWithdraw = useCallback(
    (amount: number, method: MethodKey): { ok: boolean; errorKey?: string } => {
      if (POLICY.kycRequiredForWithdraw && kyc.status !== 'approved') return { ok: false, errorKey: 'kycRequired' };
      if (!Number.isFinite(amount) || amount <= 0) return { ok: false, errorKey: 'invalidAmount' };
      if (amount < POLICY.minWithdraw) return { ok: false, errorKey: 'belowMin' };
      if (amount > POLICY.maxWithdrawPerRequest) return { ok: false, errorKey: 'aboveMax' };
      if (amount > availableBalance) return { ok: false, errorKey: 'insufficient' };
      if (withdrawnToday + amount > POLICY.maxWithdrawPerDay) return { ok: false, errorKey: 'dailyLimitReached' };

      const { fee, net } = withdrawalFee(method, amount);
      const id = uid();
      const w: Withdrawal = { id, amount, fee, net, method, status: 'pending', createdAt: nowISO() };
      setWithdrawals((prev) => {
        const next = [w, ...prev];
        persistWd(next);
        return next;
      });
      pushNotif({ type: 'info', titleKey: 'withdrawals', bodyKey: 'wdRequested' });
      logAudit('user', 'withdraw.requested', id, `${amount} DZD via ${method}`);
      timers.current[`wd_${id}`] = setTimeout(() => reviewWithdraw(id, 'approve', undefined, 'auto'), AUTO_WD_MS);
      return { ok: true };
    },
    [availableBalance, kyc.status, logAudit, pushNotif, reviewWithdraw, withdrawnToday]
  );

  const addDeposit = useCallback(
    (amount: number) => {
      appendTx({ kind: 'in', type: 'deposit', amount, ref: 'depositTitle' });
      logAudit('user', 'deposit.demo', 'wallet', `${amount} DZD`);
    },
    [appendTx, logAudit]
  );

  /* ── Campaigns ─────────────────────────────────── */
  const createCampaign: Ctx['createCampaign'] = useCallback(
    (c) => {
      const { fee } = campaignCost(c.reward);
      const campaign: Campaign = {
        id: `cmp_${uid()}`,
        title: sanitize(c.title, 60),
        desc: sanitize(c.desc, 160),
        reward: c.reward,
        fee,
        difficulty: c.difficulty,
        requirements: c.requirements.map((r) => sanitize(r, 120)).filter(Boolean),
        steps: c.steps.map((s) => sanitize(s, 120)).filter(Boolean),
        status: 'pending',
        createdAt: nowISO(),
        owner: user.name || user.phone || 'merchant',
        sales: 0,
      };
      setCampaigns((prev) => {
        const next = [campaign, ...prev];
        persistCampaigns(next);
        return next;
      });
      pushNotif({ type: 'info', titleKey: 'merchantTitle', bodyKey: 'campaignSubmitted' });
      logAudit('user', 'campaign.created', campaign.id, `${c.reward} DZD`);
    },
    [logAudit, pushNotif, user.name, user.phone]
  );

  const reviewCampaign = useCallback(
    (id: string, decision: 'approve' | 'reject', reason?: string) => {
      setCampaigns((prev) => {
        const next = prev.map((c) =>
          c.id === id
            ? { ...c, status: (decision === 'approve' ? 'approved' : 'rejected') as CampaignStatus, reason: decision === 'reject' ? sanitize(reason || '—', 120) : undefined }
            : c
        );
        persistCampaigns(next);
        return next;
      });
      pushNotif({
        type: decision === 'approve' ? 'success' : 'warning',
        titleKey: 'merchantTitle',
        bodyKey: decision === 'approve' ? 'campaignApproved' : 'campaignRejected',
      });
      logAudit('admin', decision === 'approve' ? 'campaign.approved' : 'campaign.rejected', id, reason);
    },
    [logAudit, pushNotif]
  );

  const toggleTaskEnabled = useCallback(
    (id: string) => {
      let enabled = true;
      setDisabledTasks((prev) => {
        const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
        enabled = !next.includes(id);
        Storage.set(KEYS.admin, { disabledTasks: next });
        return next;
      });
      logAudit('admin', 'task.toggled', id);
      return enabled;
    },
    [logAudit]
  );

  /* ── Notifications & chat ──────────────────────── */
  const markAllRead = useCallback(() => {
    setNotifs((prev) => {
      const next = prev.map((n) => ({ ...n, read: true }));
      persistNotifs(next);
      return next;
    });
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifs((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      persistNotifs(next);
      return next;
    });
  }, []);

  const sendChat = useCallback((text: string, lang: Lang) => {
    const clean = sanitize(text, 400);
    setChat((prev) => {
      const next: ChatMsg[] = [...prev, { id: uid(), from: 'user', text: clean, time: clock() }];
      Storage.set(KEYS.chat, next);
      return next;
    });
    setTimeout(() => {
      const pool = SUPPORT_REPLIES[lang];
      const reply = pool[Math.floor(Math.random() * pool.length)];
      setChat((prev) => {
        const next: ChatMsg[] = [...prev, { id: uid(), from: 'support', text: reply, time: clock() }];
        Storage.set(KEYS.chat, next);
        return next;
      });
    }, 1500);
  }, []);

  /* ── Resume pending reviews after reload ───────── */
  useEffect(() => {
    if (!ready || !authed) return;
    Object.entries(taskStates).forEach(([id, st]) => {
      if (st.status === 'review') scheduleProofReview(id, AUTO_PROOF_MS - (Date.now() - st.ts));
    });
    if (kyc.status === 'pending' && !timers.current.kyc) {
      const elapsed = kyc.submittedAt ? Date.now() - new Date(kyc.submittedAt).getTime() : 0;
      timers.current.kyc = setTimeout(() => reviewKyc('approve', undefined, 'auto'), Math.max(1500, AUTO_KYC_MS - elapsed));
    }
    withdrawals
      .filter((w) => w.status === 'pending')
      .forEach((w) => {
        if (timers.current[`wd_${w.id}`]) return;
        const elapsed = Date.now() - new Date(w.createdAt).getTime();
        timers.current[`wd_${w.id}`] = setTimeout(
          () => reviewWithdraw(w.id, 'approve', undefined, 'auto'),
          Math.max(1500, AUTO_WD_MS - elapsed)
        );
      });
    return () => {
      Object.values(timers.current).forEach((t) => clearTimeout(t));
      timers.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, authed]);

  const value: Ctx = {
    ready,
    onboarded,
    authed,
    guided,
    session,
    role,
    isAdmin,
    isMerchant,
    user,
    legal,
    taskStates,
    txs,
    withdrawals,
    notifs,
    kyc,
    chat,
    campaigns,
    audit,
    disabledTasks,
    referralCode: referral.code,
    referralCount: referral.count,
    referralEarnings: referral.earnings,
    ledgerBalance,
    lockedBalance,
    availableBalance,
    totalIn,
    totalOut,
    withdrawnToday,
    ledgerCheck,
    completedCount,
    activeCount,
    level,
    levelProgress,
    unreadCount,
    vipUnlocked,
    pendingReviewCount,
    allTasks,
    commissionFor,
    finishOnboarding,
    signIn,
    signOut,
    touch,
    finishGuide,
    saveProfile,
    acceptLegal,
    grantAdmin,
    revokeAdmin,
    enableMerchant,
    acceptTask,
    cancelTask,
    submitProof,
    reviewProof,
    submitKyc,
    setKycImage,
    reviewKyc,
    requestWithdraw,
    reviewWithdraw,
    addDeposit,
    createCampaign,
    reviewCampaign,
    toggleTaskEnabled,
    markAllRead,
    markRead,
    sendChat,
    pushNotif,
    sessionNotice,
    clearSessionNotice: () => setSessionNotice(null),
  };

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export const useApp = () => useContext(AppCtx);
export { POLICY };
