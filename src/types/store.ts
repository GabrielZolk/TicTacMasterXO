import { ThemeType } from './game';

// Tipos de moeda
export type CurrencyType = 'stars';

// Tipos de itens da loja
export type StoreItemType = 'theme' | 'symbol' | 'effect' | 'avatar' | 'boost' | 'bundle';

// Raridade dos itens
export type ItemRarity = 'common' | 'rare' | 'epic' | 'legendary';

// Interface para preço de item
export interface ItemPrice {
  stars: number;
}

// Interface principal para itens da loja
export interface StoreItem {
  id: string;
  type: StoreItemType;
  name: string;
  nameKey: string; // Chave para i18n
  description: string;
  descriptionKey: string; // Chave para i18n
  icon: string;
  emoji?: string;
  
  // Preço
  price: ItemPrice;
  
  // Raridade
  rarity: ItemRarity;
  
  // Status
  isOwned: boolean;
  isEquipped: boolean;
  isNew?: boolean;
  
  // Preview
  previewColors?: string[];
  previewGradient?: string[];
  
  // Conteúdo específico do item
  content?: any;
  
  // Requisitos
  requiresPremium?: boolean;
  unlockLevel?: number;
}

// Interface para temas da loja
export interface ThemeStoreItem extends StoreItem {
  type: 'theme';
  themeId: ThemeType | string; // Permite temas customizados
  content: {
    background: string;
    secondary: string;
    tertiary: string;
    text: string;
    textSecondary: string;
    textTertiary: string;
    gradient: string[];
    buttonGradient: string[];
  };
}

// Interface para símbolos customizados
export interface SymbolStoreItem extends StoreItem {
  type: 'symbol';
  content: {
    playerX: string; // emoji ou caractere
    playerO: string; // emoji ou caractere
    animated?: boolean;
  };
}

// Interface para efeitos de vitória
export interface EffectStoreItem extends StoreItem {
  type: 'effect';
  content: {
    animationType: 'confetti' | 'fireworks' | 'stars' | 'lightning' | 'coins' | 'sparkles';
    particleCount?: number;
    colors?: string[];
    duration?: number;
  };
}

// Interface para carteira do jogador
export interface PlayerWallet {
  stars: number;
  lastUpdated: number;
}

// Interface para histórico de transações
export interface Transaction {
  id: string;
  type: 'earn' | 'spend' | 'purchase';
  currency: CurrencyType;
  amount: number;
  itemId?: string;
  reason: string;
  timestamp: number;
}

// Interface para inventário do jogador
export interface PlayerInventory {
  ownedItems: string[]; // IDs dos itens possuídos
  equippedTheme?: string;
  equippedSymbols?: string;
  equippedEffect?: string;
  equippedAvatar?: string;
}

// Interface para dados da loja
export interface StoreData {
  wallet: PlayerWallet;
  inventory: PlayerInventory;
  transactions: Transaction[];
  lastDailyReward?: number;
  consecutiveDays?: number;
}

// Constantes de recompensa
export const REWARD_AMOUNTS = {
  WIN_CLASSIC: 5,
  WIN_SPECIAL_MODE: 10,
  WIN_STREAK_BONUS: 3, // por vitória na sequência
  DAILY_LOGIN: 50,
  WATCH_AD: 25,
  COMPLETE_ACHIEVEMENT: 100,
  FIRST_WIN_OF_DAY: 20,
} as const;

// Cores por raridade
export const RARITY_COLORS = {
  common: '#9E9E9E',
  rare: '#2196F3',
  epic: '#9C27B0',
  legendary: '#FFD700',
} as const;

// Ícones por raridade
export const RARITY_ICONS = {
  common: '⭐',
  rare: '💎',
  epic: '👑',
  legendary: '🏆',
} as const;
