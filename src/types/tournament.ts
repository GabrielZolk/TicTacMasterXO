import { Difficulty } from './game';

export interface TournamentRound {
  round: number;
  difficulty: Difficulty;
  label: string;
}

export interface TournamentConfig {
  entryFee: number; // stars
  rounds: TournamentRound[];
  rewards: {
    win: { stars: number; chest: 'common' | 'rare' | 'epic' };
    loss: { stars: number };
  };
}

export const TOURNAMENT_CONFIG: TournamentConfig = {
  entryFee: 50,
  rounds: [
    { round: 1, difficulty: 'mediano', label: 'Rodada 1 — Mediano' },
    { round: 2, difficulty: 'expert', label: 'Rodada 2 — Expert' },
    { round: 3, difficulty: 'challenger', label: 'Rodada 3 — Challenger' },
  ],
  rewards: {
    win: { stars: 300, chest: 'epic' },
    loss: { stars: 25 }, // consolation prize
  },
};

export interface TournamentState {
  isActive: boolean;
  currentRound: number; // 0-indexed
  wins: number;
  lost: boolean;
}
