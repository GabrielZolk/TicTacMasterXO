export interface PlayerProfile {
  displayName: string;
  avatarId: string;
  borderId: string;
  titleId: string;
}

export interface AvatarItem {
  id: string;
  emoji: string;
  name: string;
  price: number; // stars
}

export interface BorderItem {
  id: string;
  name: string;
  color: string;
  style: 'solid' | 'gradient' | 'animated';
  price: number;
}

export interface TitleItem {
  id: string;
  name: string;
  label: string; // displayed text
  price: number; // 0 = unlockable via achievement
  requirement?: string; // description of how to unlock
}

export const AVATARS: AvatarItem[] = [
  { id: 'avatar_default', emoji: '😊', name: 'Padrao', price: 0 },
  { id: 'avatar_cool', emoji: '😎', name: 'Estiloso', price: 100 },
  { id: 'avatar_fire', emoji: '🔥', name: 'Em Chamas', price: 150 },
  { id: 'avatar_alien', emoji: '👽', name: 'Alienigena', price: 200 },
  { id: 'avatar_robot', emoji: '🤖', name: 'Robo', price: 200 },
  { id: 'avatar_crown', emoji: '👑', name: 'Realeza', price: 400 },
  { id: 'avatar_wizard', emoji: '🧙', name: 'Mago', price: 300 },
  { id: 'avatar_ninja', emoji: '🥷', name: 'Ninja', price: 350 },
  { id: 'avatar_ghost', emoji: '👻', name: 'Fantasma', price: 250 },
  { id: 'avatar_diamond', emoji: '💎', name: 'Diamante', price: 500 },
];

export const BORDERS: BorderItem[] = [
  { id: 'border_none', name: 'Sem Borda', color: 'transparent', style: 'solid', price: 0 },
  { id: 'border_gold', name: 'Ouro', color: '#FFD700', style: 'solid', price: 200 },
  { id: 'border_neon', name: 'Neon', color: '#00FF41', style: 'solid', price: 300 },
  { id: 'border_fire', name: 'Fogo', color: '#FF6B35', style: 'gradient', price: 400 },
  { id: 'border_ice', name: 'Gelo', color: '#00D9FF', style: 'gradient', price: 400 },
  { id: 'border_rainbow', name: 'Arco-Iris', color: '#FF6B35', style: 'animated', price: 800 },
];

export const TITLES: TitleItem[] = [
  { id: 'title_none', name: 'Sem Titulo', label: '', price: 0 },
  { id: 'title_novato', name: 'Novato', label: 'Novato', price: 0, requirement: 'Jogue 1 partida' },
  { id: 'title_veterano', name: 'Veterano', label: 'Veterano', price: 0, requirement: 'Jogue 50 partidas' },
  { id: 'title_mestre', name: 'Mestre do Velha', label: 'Mestre do Velha', price: 0, requirement: 'Venca 100 partidas' },
  { id: 'title_imbativel', name: 'Imbativel', label: 'Imbativel', price: 0, requirement: '10 vitorias seguidas' },
  { id: 'title_estrategista', name: 'Estrategista', label: 'Estrategista', price: 300 },
  { id: 'title_lendario', name: 'Lendario', label: 'Lendario', price: 500 },
  { id: 'title_cosmico', name: 'Cosmico', label: 'Cosmico', price: 800 },
];
