export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'games' | 'wins' | 'streak' | 'modes' | 'social' | 'collection' | 'special';
  condition: { type: string; value: number };
  reward: { stars: number; title?: string; avatar?: string };
  hidden?: boolean; // Secret achievements
}

export interface AchievementProgress {
  achievementId: string;
  currentValue: number;
  unlocked: boolean;
  unlockedAt?: number;
  claimed: boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  // Games played
  { id: 'play_1', title: 'Primeiro Passo', description: 'Jogue 1 partida', icon: '🎮', category: 'games', condition: { type: 'games_played', value: 1 }, reward: { stars: 10 } },
  { id: 'play_10', title: 'Jogador Casual', description: 'Jogue 10 partidas', icon: '🎮', category: 'games', condition: { type: 'games_played', value: 10 }, reward: { stars: 25 } },
  { id: 'play_50', title: 'Dedicado', description: 'Jogue 50 partidas', icon: '🎮', category: 'games', condition: { type: 'games_played', value: 50 }, reward: { stars: 75, title: 'title_veterano' } },
  { id: 'play_100', title: 'Viciado', description: 'Jogue 100 partidas', icon: '🎮', category: 'games', condition: { type: 'games_played', value: 100 }, reward: { stars: 150 } },
  { id: 'play_500', title: 'Lendário', description: 'Jogue 500 partidas', icon: '👑', category: 'games', condition: { type: 'games_played', value: 500 }, reward: { stars: 500, title: 'title_lendario' } },

  // Wins
  { id: 'win_1', title: 'Primeira Vitória', description: 'Vença 1 partida', icon: '🏆', category: 'wins', condition: { type: 'wins', value: 1 }, reward: { stars: 15 } },
  { id: 'win_10', title: 'Vencedor', description: 'Vença 10 partidas', icon: '🏆', category: 'wins', condition: { type: 'wins', value: 10 }, reward: { stars: 50 } },
  { id: 'win_50', title: 'Campeão', description: 'Vença 50 partidas', icon: '🏆', category: 'wins', condition: { type: 'wins', value: 50 }, reward: { stars: 100, title: 'title_mestre' } },
  { id: 'win_100', title: 'Mestre Supremo', description: 'Vença 100 partidas', icon: '👑', category: 'wins', condition: { type: 'wins', value: 100 }, reward: { stars: 250 } },

  // Streaks
  { id: 'streak_3', title: 'Sequência', description: '3 vitórias seguidas', icon: '🔥', category: 'streak', condition: { type: 'best_streak', value: 3 }, reward: { stars: 30 } },
  { id: 'streak_5', title: 'Em Chamas', description: '5 vitórias seguidas', icon: '🔥', category: 'streak', condition: { type: 'best_streak', value: 5 }, reward: { stars: 75 } },
  { id: 'streak_10', title: 'Imbatível', description: '10 vitórias seguidas', icon: '🔥', category: 'streak', condition: { type: 'best_streak', value: 10 }, reward: { stars: 200, title: 'title_imbativel' } },

  // Modes
  { id: 'mode_classic', title: 'Clássico', description: 'Vença no Clássico', icon: '📋', category: 'modes', condition: { type: 'win_mode_classic', value: 1 }, reward: { stars: 15 } },
  { id: 'mode_blitz', title: 'Relâmpago', description: 'Vença no Blitz', icon: '⚡', category: 'modes', condition: { type: 'win_mode_blitz', value: 1 }, reward: { stars: 20 } },
  { id: 'mode_reverse', title: 'Invertido', description: 'Vença no Reverso', icon: '🔄', category: 'modes', condition: { type: 'win_mode_reverse', value: 1 }, reward: { stars: 20 } },
  { id: 'mode_blind', title: 'Cego de Fé', description: 'Vença no Cego', icon: '🙈', category: 'modes', condition: { type: 'win_mode_blind', value: 1 }, reward: { stars: 25 } },
  { id: 'mode_gravity', title: 'Gravidade', description: 'Vença no Gravity', icon: '🪐', category: 'modes', condition: { type: 'win_mode_gravity', value: 1 }, reward: { stars: 20 } },
  { id: 'mode_infinity', title: 'Infinito', description: 'Vença no Infinito', icon: '♾️', category: 'modes', condition: { type: 'win_mode_infinity', value: 1 }, reward: { stars: 20 } },
  { id: 'mode_bigboard', title: 'Grandão', description: 'Vença no Grande', icon: '🏟️', category: 'modes', condition: { type: 'win_mode_bigBoard', value: 1 }, reward: { stars: 25 } },
  { id: 'mode_all', title: 'Mestre dos Modos', description: 'Vença em todos os modos', icon: '🎯', category: 'modes', condition: { type: 'modes_won', value: 8 }, reward: { stars: 200 } },

  // Special
  { id: 'beat_challenger', title: 'Desafiante', description: 'Derrote o Challenger', icon: '💀', category: 'special', condition: { type: 'beat_challenger', value: 1 }, reward: { stars: 100 } },
  { id: 'beat_troll', title: 'Anti-Troll', description: 'Derrote o Troll', icon: '😈', category: 'special', condition: { type: 'beat_troll', value: 1 }, reward: { stars: 50 } },
  { id: 'tournament_win', title: 'Campeão do Torneio', description: 'Vença um torneio', icon: '🏆', category: 'special', condition: { type: 'tournament_wins', value: 1 }, reward: { stars: 150 } },
  { id: 'chest_10', title: 'Caçador de Baús', description: 'Abra 10 baús', icon: '📦', category: 'special', condition: { type: 'chests_opened', value: 10 }, reward: { stars: 75 } },
  { id: 'referral_3', title: 'Influencer', description: 'Convide 3 amigos', icon: '🎁', category: 'social', condition: { type: 'referrals', value: 3 }, reward: { stars: 150 } },

  // Collection
  { id: 'own_5_themes', title: 'Colecionador', description: 'Possua 5 temas', icon: '🎨', category: 'collection', condition: { type: 'themes_owned', value: 5 }, reward: { stars: 100 } },
  { id: 'own_3_symbols', title: 'Estiloso', description: 'Possua 3 símbolos', icon: '✨', category: 'collection', condition: { type: 'symbols_owned', value: 3 }, reward: { stars: 50 } },

  // Hidden
  { id: 'secret_troll_lose', title: 'Vacilo Histórico', description: 'Perca para o Noob', icon: '🤫', category: 'special', condition: { type: 'lose_to_noob', value: 1 }, reward: { stars: 25 }, hidden: true },
];
