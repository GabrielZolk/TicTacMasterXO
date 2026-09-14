import { BattlePassSeason } from '../types/battlepass';

// Season 1 — runs for 30 days
export const CURRENT_SEASON: BattlePassSeason = {
  id: 'season_1',
  name: 'Temporada Galáctica',
  startDate: Date.now(),
  endDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
  premiumProductId: 'tictacmaster_battlepass_s1',
  // Fallback only — the screen shows the price the store reports for the user's
  // country. This is the real Brazilian price (Play rounded our R$ 9,90 up).
  premiumPrice: 'R$ 9,99',
  tiers: [
    {
      level: 1,
      xpRequired: 50,
      freeReward: { type: 'stars', amount: 25, name: '25 Estrelas', icon: '⭐' },
      premiumReward: { type: 'stars', amount: 50, name: '50 Estrelas', icon: '💫' },
    },
    {
      level: 2,
      xpRequired: 120,
      freeReward: { type: 'stars', amount: 30, name: '30 Estrelas', icon: '⭐' },
      premiumReward: { type: 'symbol', id: 'symbols_fire_water', name: 'Fogo vs Água', icon: '🔥💧' },
    },
    {
      level: 3,
      xpRequired: 200,
      freeReward: { type: 'stars', amount: 40, name: '40 Estrelas', icon: '⭐' },
      premiumReward: { type: 'stars', amount: 100, name: '100 Estrelas', icon: '💫' },
    },
    {
      level: 4,
      xpRequired: 300,
      freeReward: { type: 'stars', amount: 50, name: '50 Estrelas', icon: '⭐' },
      premiumReward: { type: 'effect', id: 'effect_confetti', name: 'Confetes', icon: '🎊' },
    },
    {
      level: 5,
      xpRequired: 420,
      freeReward: { type: 'stars', amount: 60, name: '60 Estrelas', icon: '⭐' },
      premiumReward: { type: 'theme', id: 'theme_neon', name: 'Tema Neon', icon: '💫' },
    },
    {
      level: 6,
      xpRequired: 560,
      freeReward: { type: 'stars', amount: 50, name: '50 Estrelas', icon: '⭐' },
      premiumReward: { type: 'stars', amount: 150, name: '150 Estrelas', icon: '💫' },
    },
    {
      level: 7,
      xpRequired: 720,
      freeReward: { type: 'stars', amount: 60, name: '60 Estrelas', icon: '⭐' },
      premiumReward: { type: 'symbol', id: 'symbols_space', name: 'Foguete vs Alien', icon: '🚀👽' },
    },
    {
      level: 8,
      xpRequired: 900,
      freeReward: { type: 'stars', amount: 75, name: '75 Estrelas', icon: '⭐' },
      premiumReward: { type: 'effect', id: 'effect_fireworks', name: 'Fogos de Artifício', icon: '🎆' },
    },
    {
      level: 9,
      xpRequired: 1100,
      freeReward: { type: 'stars', amount: 80, name: '80 Estrelas', icon: '⭐' },
      premiumReward: { type: 'stars', amount: 200, name: '200 Estrelas', icon: '💫' },
    },
    {
      level: 10,
      xpRequired: 1350,
      freeReward: { type: 'stars', amount: 100, name: '100 Estrelas', icon: '⭐' },
      premiumReward: { type: 'theme', id: 'theme_samuel', name: 'Doutor Estranho', icon: '🔮✨' },
    },
  ],
};
