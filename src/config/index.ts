/**
 * Central typed config — the single source of truth for every founder-adjustable
 * value (spec §3). All values marked `TUNE` in SEEK_MVP_BUILD_SPEC_V2.md live
 * here; game logic reads from this module and never hard-codes them.
 *
 * Unmarked values in the spec are locked product decisions and intentionally
 * NOT configurable here.
 */

export type InviteGate = 'off' | 'soft' | 'hard';
export type CrateTier = 'wood' | 'blue' | 'red' | 'yellow' | 'gold';
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface DropRates {
  common: number;
  rare: number;
  epic: number;
  legendary: number;
}

import { appName } from '../../app-name.json';

export const config = {
  /** App name — defined ONCE in app-name.json (app.config.ts reads it too). */
  appName,

  beta: {
    /** TUNE (FOUNDER-SET): first day of the fixed 7-day global beta (day 1). */
    startDate: '2026-07-06',
    /** Locked: global vote-window / payout clock timezone (spec §7.7). */
    timezone: 'America/New_York',
    lengthDays: 7,
  },

  flags: {
    enableMascotOpponent: true,
    /** Locked to 'soft' for this beta (spec §7.8); 'hard' is a config flip. */
    inviteGate: 'soft' as InviteGate,
  },

  economy: {
    /** Coins — spendable currency (spec §9.1). All TUNE. */
    coins: {
      startingBalance: 100,
      challengeCompletion: 50,
      h2hWin: 30,
      votePlacement: { first: 50, second: 30, third: 20 },
      weeklyPayout: { first: 300, top3: 150, top10: 75 },
      soloWeeklyPayout: 75,
      inviteSent: 50,
      dupeCosmeticRefund: 20,
    },
    /** Points — leaderboard currency, SEPARATE from coins (spec §9.2). TUNE. */
    points: {
      challengeCompletion: 10,
      h2hWin: 5,
      votePlacement: { first: 5, second: 3, third: 2 },
    },
    /** TUNE: accepted friends needed for weekly tier payout (spec §9.2). */
    weeklyPayoutMinFriends: 3,
    /** TUNE: crate shop prices in coins; gold is prize-only (spec §9.3). */
    cratePrices: { wood: 100, blue: 250, red: 500, yellow: 1000 } as Partial<
      Record<CrateTier, number>
    >,
    /** TUNE: gacha drop rates per tier; each row sums to 1 (spec §9.4). */
    crateDropRates: {
      wood: { common: 0.75, rare: 0.2, epic: 0.045, legendary: 0.005 },
      blue: { common: 0.6, rare: 0.3, epic: 0.08, legendary: 0.02 },
      red: { common: 0.45, rare: 0.35, epic: 0.16, legendary: 0.04 },
      yellow: { common: 0.3, rare: 0.4, epic: 0.22, legendary: 0.08 },
      gold: { common: 0.1, rare: 0.35, epic: 0.35, legendary: 0.2 },
    } as Record<CrateTier, DropRates>,
  },

  media: {
    /** TUNE: day-5 multi-photo cap (spec §7.1). */
    multiPhotoMax: 25,
  },

  mascot: {
    /** FOUNDER-SET: identity TBD (spec §7.9) — placeholder until supplied. */
    name: 'Beaver (placeholder)',
    /** Asset registry slot the mascot renders from. */
    assetSlot: 'mascotAvatar',
    /**
     * TUNE (FOUNDER-SET): fixed beatable-but-not-trivial target scores for
     * mascot H2H resolution, per H2H day (spec §7.9). Placeholders.
     */
    targets: {
      day1WaterBottleSeconds: 12,
      day2WordleGuesses: 4,
      day4HardThreePointersMade: 3,
      day5SelfieCount: 8,
    },
  },

  invites: {
    /** TUNE: one-time invite push nudge (spec §7.8, §13). */
    nudge: { betaDay: 2, friendThreshold: 3 },
    /**
     * FOUNDER-SET: where invite links land (TestFlight/App Store, spec §7.8).
     * Placeholder until the TestFlight link exists (M14).
     */
    shareUrl: 'https://testflight.apple.com/join/SEEK-TBD',
  },

  notifications: {
    /** TUNE: local time (24h) for the evening incomplete-challenge reminder. */
    eveningReminderHour: 19,
  },

  legal: {
    /**
     * FOUNDER-SET (spec §12): public URLs for the generated documents in
     * docs/legal/, served by GitHub Pages (repo Settings → Pages → deploy
     * from branch `main`, folder `/docs`). Linked from Settings and used in
     * App Store Connect. Founder reviews the documents before submission.
     */
    privacyPolicyUrl: 'https://ktran15.github.io/seek/legal/privacy.html',
    termsUrl: 'https://ktran15.github.io/seek/legal/terms.html',
    /** FOUNDER-SET: support/privacy contact shown in the documents. */
    contactEmail: 'alvaradof010407@gmail.com',
  },
} as const;

export type AppConfig = typeof config;
