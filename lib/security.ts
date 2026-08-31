/**
 * security.ts — SHA-256, tamper-evident ledger chain, rate limiting,
 * session guard helpers and form validators.
 */
import { KEYS, Storage } from './storage';

/* ─────────────────────────────────────────────────────
 * SHA-256 (pure TS, no deps)
 * ───────────────────────────────────────────────────── */
const K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98,
  0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
  0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8,
  0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819,
  0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
  0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7,
  0xc67178f2,
];

function utf8Bytes(str: string): number[] {
  const out: number[] = [];
  for (let i = 0; i < str.length; i++) {
    let code = str.charCodeAt(i);
    if (code < 0x80) out.push(code);
    else if (code < 0x800) out.push(0xc0 | (code >> 6), 0x80 | (code & 63));
    else if (code < 0xd800 || code >= 0xe000) out.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 63), 0x80 | (code & 63));
    else {
      i++;
      code = 0x10000 + (((code & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
      out.push(0xf0 | (code >> 18), 0x80 | ((code >> 12) & 63), 0x80 | ((code >> 6) & 63), 0x80 | (code & 63));
    }
  }
  return out;
}

export function sha256(message: string): string {
  const bytes = utf8Bytes(message);
  const bitLen = bytes.length * 8;
  bytes.push(0x80);
  while (bytes.length % 64 !== 56) bytes.push(0);
  const hi = Math.floor(bitLen / 0x100000000);
  const lo = bitLen >>> 0;
  bytes.push((hi >>> 24) & 255, (hi >>> 16) & 255, (hi >>> 8) & 255, hi & 255);
  bytes.push((lo >>> 24) & 255, (lo >>> 16) & 255, (lo >>> 8) & 255, lo & 255);

  let h0 = 0x6a09e667,
    h1 = 0xbb67ae85,
    h2 = 0x3c6ef372,
    h3 = 0xa54ff53a,
    h4 = 0x510e527f,
    h5 = 0x9b05688c,
    h6 = 0x1f83d9ab,
    h7 = 0x5be0cd19;

  const w = new Array<number>(64);
  const rotr = (x: number, n: number) => ((x >>> n) | (x << (32 - n))) >>> 0;

  for (let i = 0; i < bytes.length; i += 64) {
    for (let t = 0; t < 16; t++) {
      w[t] = ((bytes[i + t * 4] << 24) | (bytes[i + t * 4 + 1] << 16) | (bytes[i + t * 4 + 2] << 8) | bytes[i + t * 4 + 3]) >>> 0;
    }
    for (let t = 16; t < 64; t++) {
      const s0 = (rotr(w[t - 15], 7) ^ rotr(w[t - 15], 18) ^ (w[t - 15] >>> 3)) >>> 0;
      const s1 = (rotr(w[t - 2], 17) ^ rotr(w[t - 2], 19) ^ (w[t - 2] >>> 10)) >>> 0;
      w[t] = (w[t - 16] + s0 + w[t - 7] + s1) >>> 0;
    }
    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
    for (let t = 0; t < 64; t++) {
      const S1 = (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) >>> 0;
      const ch = ((e & f) ^ (~e & g)) >>> 0;
      const temp1 = (h + S1 + ch + K[t] + w[t]) >>> 0;
      const S0 = (rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) >>> 0;
      const maj = ((a & b) ^ (a & c) ^ (b & c)) >>> 0;
      const temp2 = (S0 + maj) >>> 0;
      h = g; g = f; f = e;
      e = (d + temp1) >>> 0;
      d = c; c = b; b = a;
      a = (temp1 + temp2) >>> 0;
    }
    h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0; h5 = (h5 + f) >>> 0; h6 = (h6 + g) >>> 0; h7 = (h7 + h) >>> 0;
  }
  return [h0, h1, h2, h3, h4, h5, h6, h7].map((x) => x.toString(16).padStart(8, '0')).join('');
}

/* ─────────────────────────────────────────────────────
 * Tamper-evident ledger chain
 * ───────────────────────────────────────────────────── */
export const GENESIS_HASH = '0'.repeat(64);

export type ChainInput = {
  seq: number;
  kind: string;
  type: string;
  amount: number;
  ref: string;
  date: string;
  prevHash: string;
};

export function hashEntry(e: ChainInput): string {
  return sha256(`${e.seq}|${e.kind}|${e.type}|${e.amount.toFixed(2)}|${e.ref}|${e.date}|${e.prevHash}`);
}

/** Entries are stored newest-first; verification walks them chronologically. */
export function verifyChain(entriesNewestFirst: (ChainInput & { hash: string })[]): {
  valid: boolean;
  brokenAt: number | null;
  length: number;
  head: string;
} {
  const chrono = [...entriesNewestFirst].reverse();
  let prev = GENESIS_HASH;
  for (let i = 0; i < chrono.length; i++) {
    const e = chrono[i];
    if (e.prevHash !== prev || hashEntry({ ...e, prevHash: e.prevHash }) !== e.hash) {
      return { valid: false, brokenAt: i + 1, length: chrono.length, head: prev };
    }
    prev = e.hash;
  }
  return { valid: true, brokenAt: null, length: chrono.length, head: prev };
}

/* ─────────────────────────────────────────────────────
 * Rate limiter (sliding window + lockout), persisted
 * ───────────────────────────────────────────────────── */
export type LimitRule = { limit: number; windowMs: number; lockMs: number };

export const LIMITS: Record<string, LimitRule> = {
  otp_send: { limit: 3, windowMs: 10 * 60_000, lockMs: 10 * 60_000 },
  otp_verify: { limit: 5, windowMs: 10 * 60_000, lockMs: 5 * 60_000 },
  auth_submit: { limit: 6, windowMs: 15 * 60_000, lockMs: 10 * 60_000 },
  withdraw_request: { limit: 3, windowMs: 60 * 60_000, lockMs: 30 * 60_000 },
  kyc_submit: { limit: 3, windowMs: 60 * 60_000, lockMs: 30 * 60_000 },
  chat_send: { limit: 12, windowMs: 60_000, lockMs: 60_000 },
  admin_pin: { limit: 5, windowMs: 15 * 60_000, lockMs: 15 * 60_000 },
  campaign_create: { limit: 5, windowMs: 60 * 60_000, lockMs: 30 * 60_000 },
  deposit_demo: { limit: 2, windowMs: 60 * 60_000, lockMs: 60 * 60_000 },
};

type Bucket = { hits: number[]; lockedUntil: number };
type SecurityState = Record<string, Bucket>;

export type LimitResult = { ok: boolean; remaining: number; retryInMs: number };

class RateLimiterImpl {
  private state: SecurityState = {};
  private loaded = false;

  async load() {
    if (this.loaded) return;
    this.state = await Storage.get<SecurityState>(KEYS.security, {});
    this.loaded = true;
  }

  private persist() {
    Storage.set(KEYS.security, this.state);
  }

  /** Records a hit and tells whether the action is allowed. */
  hit(key: keyof typeof LIMITS | string): LimitResult {
    const rule = LIMITS[key] ?? { limit: 10, windowMs: 60_000, lockMs: 60_000 };
    const now = Date.now();
    const bucket = this.state[key] ?? { hits: [], lockedUntil: 0 };

    if (bucket.lockedUntil > now) {
      this.state[key] = bucket;
      return { ok: false, remaining: 0, retryInMs: bucket.lockedUntil - now };
    }

    bucket.hits = bucket.hits.filter((h) => now - h < rule.windowMs);
    if (bucket.hits.length >= rule.limit) {
      bucket.lockedUntil = now + rule.lockMs;
      bucket.hits = [];
      this.state[key] = bucket;
      this.persist();
      return { ok: false, remaining: 0, retryInMs: rule.lockMs };
    }

    bucket.hits.push(now);
    bucket.lockedUntil = 0;
    this.state[key] = bucket;
    this.persist();
    return { ok: true, remaining: rule.limit - bucket.hits.length, retryInMs: 0 };
  }

  /** Read-only peek — does not consume an attempt. */
  peek(key: string): LimitResult {
    const rule = LIMITS[key] ?? { limit: 10, windowMs: 60_000, lockMs: 60_000 };
    const now = Date.now();
    const bucket = this.state[key] ?? { hits: [], lockedUntil: 0 };
    if (bucket.lockedUntil > now) return { ok: false, remaining: 0, retryInMs: bucket.lockedUntil - now };
    const hits = bucket.hits.filter((h) => now - h < rule.windowMs);
    return { ok: hits.length < rule.limit, remaining: Math.max(0, rule.limit - hits.length), retryInMs: 0 };
  }

  reset(key: string) {
    delete this.state[key];
    this.persist();
  }

  resetAll() {
    this.state = {};
    this.persist();
  }
}

export const RateLimiter = new RateLimiterImpl();

export function formatRetry(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}s`;
}

/* ─────────────────────────────────────────────────────
 * Session guard
 * ───────────────────────────────────────────────────── */
export const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // sliding 24h

export type Session = {
  token: string;
  role: 'user' | 'merchant' | 'admin';
  issuedAt: number;
  expiresAt: number;
  device: string;
};

export function createSession(role: Session['role'] = 'user'): Session {
  const now = Date.now();
  const seed = `${now}|${Math.random()}|${role}`;
  return {
    token: sha256(seed).slice(0, 40),
    role,
    issuedAt: now,
    expiresAt: now + SESSION_TTL_MS,
    device: sha256(seed + 'device').slice(0, 12),
  };
}

export function isSessionValid(s: Session | null): boolean {
  return !!s && typeof s.token === 'string' && s.token.length > 0 && s.expiresAt > Date.now();
}

export function touchSession(s: Session): Session {
  return { ...s, expiresAt: Date.now() + SESSION_TTL_MS };
}

/* ─────────────────────────────────────────────────────
 * Form validation
 * ───────────────────────────────────────────────────── */
export const ALGERIAN_PHONE_RE = /^0[5-7][0-9]{8}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

/** All validators return a translation key on error, or null when valid. */
export const V = {
  phone(v: string): string | null {
    const clean = v.replace(/\s/g, '');
    if (!clean) return 'required';
    return ALGERIAN_PHONE_RE.test(clean) ? null : 'invalidPhone';
  },
  emailOptional(v: string): string | null {
    if (!v.trim()) return null;
    return EMAIL_RE.test(v.trim()) ? null : 'invalidEmail';
  },
  name(v: string): string | null {
    const s = v.trim();
    if (!s) return 'required';
    if (s.length < 3 || s.length > 40) return 'invalidName';
    return /^[\p{L}\s'’-]+$/u.test(s) ? null : 'invalidName';
  },
  birthdate(v: string): string | null {
    if (!v.trim()) return 'required';
    const m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) return 'invalidDate';
    const d = Number(m[1]);
    const mo = Number(m[2]);
    const y = Number(m[3]);
    const date = new Date(y, mo - 1, d);
    if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) return 'invalidDate';
    const age = (Date.now() - date.getTime()) / (365.25 * 24 * 3600 * 1000);
    if (age < 18) return 'minAge';
    if (age > 100) return 'invalidDate';
    return null;
  },
  ccp(v: string): string | null {
    const s = v.replace(/\D/g, '');
    if (!s) return 'required';
    return s.length >= 10 && s.length <= 12 ? null : 'invalidCcp';
  },
  amount(v: string, min: number, max: number): string | null {
    const n = Number(v);
    if (!v.trim()) return 'required';
    if (!Number.isFinite(n) || n <= 0) return 'invalidAmount';
    if (n < min) return 'belowMin';
    if (n > max) return 'aboveMax';
    return null;
  },
  text(v: string, min: number, max: number): string | null {
    const s = v.trim();
    if (!s) return 'required';
    if (s.length < min || s.length > max) return 'invalidLength';
    return null;
  },
  positiveInt(v: string): string | null {
    if (!v.trim()) return 'required';
    const n = Number(v);
    return Number.isInteger(n) && n > 0 ? null : 'invalidAmount';
  },
};

/** Strips control characters / trims — defends the local store from junk input. */
export function sanitize(v: string, max = 500): string {
  // eslint-disable-next-line no-control-regex
  return v.replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, max);
}
