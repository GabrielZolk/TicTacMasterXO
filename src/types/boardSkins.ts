export interface BoardSkin {
  id: string;
  name: string;
  icon: string;
  price: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  // Visual properties
  boardBackground: string;
  cellBackground: string;
  cellBorder: string;
  gridLineColor: string;
  // Texture overlay (simulated via patterns)
  texture: 'none' | 'wood' | 'metal' | 'glass' | 'neon_grid' | 'marble' | 'carbon' | 'holographic';
  // Extra visual effects
  cellBorderRadius: number;
  cellShadow: boolean;
  glowColor?: string;
}

export const BOARD_SKINS: BoardSkin[] = [
  {
    id: 'skin_default',
    name: 'Tema',
    icon: '🎨',
    price: 0,
    rarity: 'common',
    boardBackground: 'transparent',
    cellBackground: '#16213E40',
    cellBorder: '#424242',
    gridLineColor: '#424242',
    texture: 'none',
    cellBorderRadius: 8,
    cellShadow: false,
  },
  {
    id: 'skin_wood',
    name: 'Madeira',
    icon: '🪵',
    price: 300,
    rarity: 'rare',
    boardBackground: '#8B6914',
    cellBackground: '#A0783220',
    cellBorder: '#6B4F10',
    gridLineColor: '#5C4033',
    texture: 'wood',
    cellBorderRadius: 4,
    cellShadow: true,
  },
  {
    id: 'skin_metal',
    name: 'Metal',
    icon: '⚙️',
    price: 500,
    rarity: 'epic',
    boardBackground: '#2C3E50',
    cellBackground: '#34495E40',
    cellBorder: '#7F8C8D',
    gridLineColor: '#95A5A6',
    texture: 'metal',
    cellBorderRadius: 2,
    cellShadow: true,
  },
  {
    id: 'skin_glass',
    name: 'Vidro',
    icon: '🔮',
    price: 600,
    rarity: 'epic',
    boardBackground: '#FFFFFF10',
    cellBackground: '#FFFFFF08',
    cellBorder: '#FFFFFF30',
    gridLineColor: '#FFFFFF20',
    texture: 'glass',
    cellBorderRadius: 12,
    cellShadow: false,
    glowColor: '#FFFFFF15',
  },
  {
    id: 'skin_neon_grid',
    name: 'Neon Grid',
    icon: '💜',
    price: 800,
    rarity: 'epic',
    boardBackground: '#000000',
    cellBackground: '#00000080',
    cellBorder: '#FF00FF60',
    gridLineColor: '#00FFFF40',
    texture: 'neon_grid',
    cellBorderRadius: 0,
    cellShadow: false,
    glowColor: '#FF00FF30',
  },
  {
    id: 'skin_marble',
    name: 'Marmore',
    icon: '🏛️',
    price: 700,
    rarity: 'epic',
    boardBackground: '#E8E4E0',
    cellBackground: '#D4CFC820',
    cellBorder: '#B8B0A8',
    gridLineColor: '#A09890',
    texture: 'marble',
    cellBorderRadius: 6,
    cellShadow: true,
  },
  {
    id: 'skin_carbon',
    name: 'Fibra de Carbono',
    icon: '🖤',
    price: 900,
    rarity: 'legendary',
    boardBackground: '#1A1A1A',
    cellBackground: '#2A2A2A40',
    cellBorder: '#333333',
    gridLineColor: '#444444',
    texture: 'carbon',
    cellBorderRadius: 4,
    cellShadow: true,
  },
  {
    id: 'skin_holographic',
    name: 'Holografico',
    icon: '🌈',
    price: 1200,
    rarity: 'legendary',
    boardBackground: '#0A0A2E',
    cellBackground: '#1A1A4E20',
    cellBorder: '#FF69B460',
    gridLineColor: '#00FFFF40',
    texture: 'holographic',
    cellBorderRadius: 10,
    cellShadow: false,
    glowColor: '#FF69B420',
  },
];
