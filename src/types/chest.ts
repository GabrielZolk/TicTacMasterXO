export type ChestRarity = 'common' | 'rare' | 'epic';

export interface ChestReward {
  type: 'stars' | 'boost' | 'item';
  id?: string;
  amount?: number;
  name: string;
  icon: string;
}

export interface ChestConfig {
  rarity: ChestRarity;
  name: string;
  icon: string;
  color: string;
  possibleRewards: { reward: ChestReward; weight: number }[];
  rewardCount: number; // how many rewards per chest
}

export const CHEST_CONFIGS: Record<ChestRarity, ChestConfig> = {
  common: {
    rarity: 'common',
    name: 'Bau Comum',
    icon: '📦',
    color: '#9E9E9E',
    rewardCount: 1,
    possibleRewards: [
      { reward: { type: 'stars', amount: 10, name: '10 Estrelas', icon: '⭐' }, weight: 40 },
      { reward: { type: 'stars', amount: 20, name: '20 Estrelas', icon: '⭐' }, weight: 30 },
      { reward: { type: 'stars', amount: 30, name: '30 Estrelas', icon: '⭐' }, weight: 15 },
      { reward: { type: 'boost', id: 'boost_hint', amount: 1, name: 'Dica x1', icon: '💡' }, weight: 10 },
      { reward: { type: 'boost', id: 'boost_undo', amount: 1, name: 'Desfazer x1', icon: '↩️' }, weight: 5 },
    ],
  },
  rare: {
    rarity: 'rare',
    name: 'Bau Raro',
    icon: '🎁',
    color: '#2196F3',
    rewardCount: 2,
    possibleRewards: [
      { reward: { type: 'stars', amount: 30, name: '30 Estrelas', icon: '⭐' }, weight: 25 },
      { reward: { type: 'stars', amount: 50, name: '50 Estrelas', icon: '⭐' }, weight: 20 },
      { reward: { type: 'stars', amount: 75, name: '75 Estrelas', icon: '⭐' }, weight: 10 },
      { reward: { type: 'boost', id: 'boost_hint', amount: 2, name: 'Dica x2', icon: '💡' }, weight: 15 },
      { reward: { type: 'boost', id: 'boost_extra_time', amount: 1, name: 'Tempo x1', icon: '⏱️' }, weight: 15 },
      { reward: { type: 'item', id: 'symbols_emoji_cool', name: 'Simbolo Cool', icon: '😎🤖' }, weight: 10 },
      { reward: { type: 'item', id: 'effect_confetti', name: 'Confetes', icon: '🎊' }, weight: 5 },
    ],
  },
  epic: {
    rarity: 'epic',
    name: 'Bau Epico',
    icon: '👑',
    color: '#9C27B0',
    rewardCount: 3,
    possibleRewards: [
      { reward: { type: 'stars', amount: 75, name: '75 Estrelas', icon: '⭐' }, weight: 20 },
      { reward: { type: 'stars', amount: 100, name: '100 Estrelas', icon: '⭐' }, weight: 15 },
      { reward: { type: 'stars', amount: 150, name: '150 Estrelas', icon: '💫' }, weight: 5 },
      { reward: { type: 'boost', id: 'boost_hint', amount: 3, name: 'Dica x3', icon: '💡' }, weight: 15 },
      { reward: { type: 'boost', id: 'boost_extra_time', amount: 2, name: 'Tempo x2', icon: '⏱️' }, weight: 10 },
      { reward: { type: 'item', id: 'symbols_animals', name: 'Leao vs Tigre', icon: '🦁🐯' }, weight: 10 },
      { reward: { type: 'item', id: 'effect_fireworks', name: 'Fogos', icon: '🎆' }, weight: 10 },
      { reward: { type: 'item', id: 'theme_cartoon', name: 'Tema Cartoon', icon: '🎨' }, weight: 8 },
      { reward: { type: 'item', id: 'theme_nature', name: 'Tema Natureza', icon: '🌿' }, weight: 7 },
    ],
  },
};
