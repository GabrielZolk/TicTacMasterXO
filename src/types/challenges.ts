import { GameMode, Difficulty } from './game';

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  mode: GameMode;
  difficulty?: Difficulty;
  condition: ChallengeCondition;
  reward: { stars: number; xp: number };
}

export interface ChallengeCondition {
  type: 'win' | 'win_streak' | 'win_under_moves' | 'win_mode' | 'play_count' | 'play_online';
  value: number; // e.g. win 3 games, win in under 5 moves, play 5 games
  mode?: GameMode;
  difficulty?: Difficulty;
}

export interface ChallengeProgress {
  challengeId: string;
  date: string; // YYYY-MM-DD
  currentValue: number;
  targetValue: number;
  completed: boolean;
  claimed: boolean;
}

export interface WeeklyMission {
  id: string;
  title: string;
  description: string;
  icon: string;
  condition: ChallengeCondition;
  reward: { stars: number; xp: number };
}

export interface MissionProgress {
  missionId: string;
  weekStart: string; // YYYY-MM-DD (Monday)
  currentValue: number;
  targetValue: number;
  completed: boolean;
  claimed: boolean;
}

// Pool of possible daily challenges — one is picked each day
export const DAILY_CHALLENGE_POOL: Omit<DailyChallenge, 'id'>[] = [
  {
    title: 'Vitorioso',
    description: 'Vença 3 partidas',
    icon: '🏆',
    mode: 'classic',
    condition: { type: 'win', value: 3 },
    reward: { stars: 50, xp: 30 },
  },
  {
    title: 'Relâmpago',
    description: 'Vença no Blitz',
    icon: '⚡',
    mode: 'blitz',
    condition: { type: 'win_mode', value: 1, mode: 'blitz' },
    reward: { stars: 40, xp: 25 },
  },
  {
    title: 'Estrategista',
    description: 'Vença contra Expert',
    icon: '🧠',
    mode: 'classic',
    difficulty: 'expert',
    condition: { type: 'win', value: 1, difficulty: 'expert' },
    reward: { stars: 60, xp: 35 },
  },
  {
    title: 'Invertido',
    description: 'Vença no modo Reverso',
    icon: '🔄',
    mode: 'reverse',
    condition: { type: 'win_mode', value: 1, mode: 'reverse' },
    reward: { stars: 45, xp: 25 },
  },
  {
    title: 'Cego de Fé',
    description: 'Vença 2 partidas no Cego',
    icon: '🙈',
    mode: 'blind',
    condition: { type: 'win_mode', value: 2, mode: 'blind' },
    reward: { stars: 55, xp: 30 },
  },
  {
    title: 'Sequência',
    description: 'Faça 3 vitórias seguidas',
    icon: '🔥',
    mode: 'classic',
    condition: { type: 'win_streak', value: 3 },
    reward: { stars: 70, xp: 40 },
  },
  {
    title: 'Jogador Dedicado',
    description: 'Jogue 5 partidas',
    icon: '🎮',
    mode: 'classic',
    condition: { type: 'play_count', value: 5 },
    reward: { stars: 35, xp: 20 },
  },
  {
    title: 'Gravidade Zero',
    description: 'Vença no Gravity',
    icon: '🪐',
    mode: 'gravity',
    condition: { type: 'win_mode', value: 1, mode: 'gravity' },
    reward: { stars: 45, xp: 25 },
  },
  {
    title: 'Infinito',
    description: 'Vença 2 no Infinito',
    icon: '♾️',
    mode: 'infinity',
    condition: { type: 'win_mode', value: 2, mode: 'infinity' },
    reward: { stars: 50, xp: 30 },
  },
  {
    title: 'Desafiante',
    description: 'Vença contra Challenger',
    icon: '💀',
    mode: 'classic',
    difficulty: 'challenger',
    condition: { type: 'win', value: 1, difficulty: 'challenger' },
    reward: { stars: 100, xp: 50 },
  },
];

// Weekly missions pool
export const WEEKLY_MISSION_POOL: Omit<WeeklyMission, 'id'>[] = [
  {
    title: 'Maratonista',
    description: 'Jogue 20 partidas',
    icon: '🏃',
    condition: { type: 'play_count', value: 20 },
    reward: { stars: 150, xp: 80 },
  },
  {
    title: 'Mestre dos Modos',
    description: 'Venca em 4 modos diferentes',
    icon: '🎯',
    condition: { type: 'win', value: 4 },
    reward: { stars: 200, xp: 100 },
  },
  {
    title: 'Imbatível',
    description: 'Faca 5 vitorias seguidas',
    icon: '🔥',
    condition: { type: 'win_streak', value: 5 },
    reward: { stars: 250, xp: 120 },
  },
  {
    title: 'Guerreiro',
    description: 'Venca 15 partidas',
    icon: '⚔️',
    condition: { type: 'win', value: 15 },
    reward: { stars: 180, xp: 90 },
  },
  {
    // Social mission: playing online requires a second person, so completing
    // this is what actually pulls a friend into the game.
    title: 'Chame um Amigo',
    description: 'Jogue 3 partidas online',
    icon: '🤝',
    condition: { type: 'play_online', value: 3 },
    reward: { stars: 220, xp: 110 },
  },
];
