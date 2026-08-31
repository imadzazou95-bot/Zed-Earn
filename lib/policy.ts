/**
 * policy.ts — the single source of truth for money rules:
 * commissions, level bonuses, referral rewards, withdrawal fees and limits.
 */
export type LevelKey = 'lvlBeginner' | 'lvlActive' | 'lvlPro' | 'lvlVip';
export type MethodKey = 'mCcp' | 'mWallet' | 'mCard';

export const POLICY = {
  version: '1.2.0',
  effective: '2025-01-01',
  currency: 'DZD',

  /** Task commissions */
  levelBonus: { lvlBeginner: 0, lvlActive: 0.03, lvlPro: 0.07, lvlVip: 0.12 } as Record<LevelKey, number>,
  levelThresholds: { lvlBeginner: 0, lvlActive: 5, lvlPro: 10, lvlVip: 20 } as Record<LevelKey, number>,
  vipUnlockTasks: 10,
  proofReviewHours: 24,
  proofMaxResubmits: 3,

  /** Referral */
  referralBonus: 500,
  referralShare: 0.05,

  /** Withdrawals */
  minWithdraw: 1000,
  maxWithdrawPerRequest: 100000,
  maxWithdrawPerDay: 100000,
  fees: {
    mCcp: { pct: 0.01, min: 30, max: 300, etaKey: 'mCcpDesc' },
    mWallet: { pct: 0.015, min: 20, max: 250, etaKey: 'mWalletDesc' },
    mCard: { pct: 0.02, min: 50, max: 400, etaKey: 'mCardDesc' },
  } as Record<MethodKey, { pct: number; min: number; max: number; etaKey: string }>,

  /** Merchant */
  merchantFeePct: 0.1,
  merchantMinReward: 100,
  merchantMaxReward: 20000,

  /** Compliance */
  kycRequiredForWithdraw: true,
  minAge: 18,
} as const;

export function levelForCompleted(completed: number): LevelKey {
  if (completed >= POLICY.levelThresholds.lvlVip) return 'lvlVip';
  if (completed >= POLICY.levelThresholds.lvlPro) return 'lvlPro';
  if (completed >= POLICY.levelThresholds.lvlActive) return 'lvlActive';
  return 'lvlBeginner';
}

export type CommissionBreakdown = { base: number; bonusPct: number; bonus: number; total: number };

/** Commission actually credited for a task, including the level bonus. */
export function computeCommission(base: number, level: LevelKey): CommissionBreakdown {
  const bonusPct = POLICY.levelBonus[level] ?? 0;
  const bonus = Math.round(base * bonusPct);
  return { base, bonusPct, bonus, total: base + bonus };
}

export type FeeBreakdown = { gross: number; fee: number; net: number; pct: number };

/** Withdrawal fee for a method (percentage, clamped between min and max). */
export function withdrawalFee(method: MethodKey, gross: number): FeeBreakdown {
  const rule = POLICY.fees[method] ?? POLICY.fees.mCcp;
  const raw = gross * rule.pct;
  const fee = Math.round(Math.min(Math.max(raw, rule.min), rule.max));
  return { gross, fee, net: Math.max(0, gross - fee), pct: rule.pct };
}

/** Merchant pays the reward + platform fee when creating a campaign. */
export function campaignCost(reward: number): { reward: number; fee: number; total: number } {
  const fee = Math.round(reward * POLICY.merchantFeePct);
  return { reward, fee, total: reward + fee };
}
