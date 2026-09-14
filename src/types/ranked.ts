export type LeagueTier = 'bronze' | 'silver' | 'gold' | 'diamond' | 'master';

export interface LeagueInfo {
  tier: LeagueTier;
  name: string;
  icon: string;
  color: string;
  minPoints: number;
  maxPoints: number;
}

export const LEAGUES: LeagueInfo[] = [
  { tier: 'bronze', name: 'Bronze', icon: '🥉', color: '#CD7F32', minPoints: 0, maxPoints: 299 },
  { tier: 'silver', name: 'Prata', icon: '🥈', color: '#C0C0C0', minPoints: 300, maxPoints: 699 },
  { tier: 'gold', name: 'Ouro', icon: '🥇', color: '#FFD700', minPoints: 700, maxPoints: 1199 },
  { tier: 'diamond', name: 'Diamante', icon: '💎', color: '#00D9FF', minPoints: 1200, maxPoints: 1799 },
  { tier: 'master', name: 'Mestre', icon: '👑', color: '#FF6B35', minPoints: 1800, maxPoints: 99999 },
];

export interface RankedProfile {
  points: number;
  tier: LeagueTier;
  wins: number;
  losses: number;
  draws: number;
  winStreak: number;
  bestStreak: number;
  gamesPlayed: number;
  seasonId: string;
}

// Points gained/lost per result
export const RANKED_POINTS = {
  WIN_BASE: 25,
  WIN_STREAK_BONUS: 5,    // extra per streak win
  LOSS_BASE: -15,
  DRAW: 5,
  // Difficulty multipliers (AI ranked)
  DIFF_NOOB: 0.5,
  DIFF_MEDIANO: 0.8,
  DIFF_EXPERT: 1.0,
  DIFF_CHALLENGER: 1.3,
  DIFF_TROLL: 1.1,
} as const;

export function getLeagueForPoints(points: number): LeagueInfo {
  for (let i = LEAGUES.length - 1; i >= 0; i--) {
    if (points >= LEAGUES[i].minPoints) return LEAGUES[i];
  }
  return LEAGUES[0];
}
