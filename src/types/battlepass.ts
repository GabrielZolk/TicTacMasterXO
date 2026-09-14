export interface BattlePassTier {
  level: number;
  xpRequired: number;
  freeReward: BattlePassReward;
  premiumReward: BattlePassReward;
}

export interface BattlePassReward {
  type: 'stars' | 'theme' | 'symbol' | 'effect' | 'emote' | 'avatar_border' | 'title';
  id?: string;   // item ID for cosmetics
  amount?: number; // for stars
  name: string;
  icon: string;
}

export interface BattlePassSeason {
  id: string;
  name: string;
  startDate: number; // timestamp
  endDate: number;   // timestamp
  tiers: BattlePassTier[];
  premiumProductId: string;
  premiumPrice: string;
}

export interface BattlePassProgress {
  seasonId: string;
  currentXp: number;
  currentLevel: number;
  isPremium: boolean;
  claimedFreeRewards: number[];  // tier levels claimed
  claimedPremiumRewards: number[]; // tier levels claimed
}

// XP sources
export const BATTLEPASS_XP = {
  WIN: 20,
  DRAW: 5,
  LOSS: 3,
  DAILY_LOGIN: 30,
  WIN_STREAK_3: 15,   // bonus at 3-win streak
  WIN_STREAK_5: 30,   // bonus at 5-win streak
  SPECIAL_MODE_WIN: 10, // extra for non-classic modes
} as const;
