/**
 * Marca de velha: o "V" que cai sobre o tabuleiro quando o jogo empata.
 *
 * Até aqui o empate não tinha nada — nem som no tabuleiro, nem risco, nada.
 * Só o áudio e o modal dois segundos depois. O `draw_default` é o V limpo, de
 * graça. Os pagos acrescentam matéria em cima dele, na mesma linguagem dos
 * alinhadores.
 */

export type DrawMarkMotif = 'plain' | 'rise' | 'shard' | 'wash' | 'drip';

export interface DrawMarkDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  price: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  color: string;
  accent: string;
  thickness: number;
  motif: DrawMarkMotif;
}

export const DRAW_MARKS: DrawMarkDef[] = [
  {
    id: 'draw_default',
    name: 'Velha',
    description: 'Um V simples marcando o empate',
    icon: '🤝',
    price: 0,
    rarity: 'common',
    color: '#BDBDBD',
    accent: '#FFFFFF',
    thickness: 7,
    motif: 'plain',
  },
  {
    id: 'draw_ash',
    name: 'Cinzas',
    description: 'O V queima e sobe cinza',
    icon: '🌋',
    price: 200,
    rarity: 'rare',
    color: '#C97B4A',
    accent: '#FFD9A0',
    thickness: 8,
    motif: 'rise',
  },
  {
    id: 'draw_crack',
    name: 'Rachadura',
    description: 'O V entra como uma trinca no tabuleiro',
    icon: '🪨',
    price: 300,
    rarity: 'rare',
    color: '#9E9E9E',
    accent: '#FFFFFF',
    thickness: 6,
    motif: 'shard',
  },
  {
    id: 'draw_tide',
    name: 'Maré',
    description: 'O V escorre e se espalha como água',
    icon: '🌊',
    price: 400,
    rarity: 'epic',
    color: '#3FA9F5',
    accent: '#BFE9FF',
    thickness: 8,
    motif: 'wash',
  },
  {
    id: 'draw_wax',
    name: 'Lacre',
    description: 'Cera quente que escorre e endurece',
    icon: '🕯️',
    price: 600,
    rarity: 'legendary',
    color: '#C62828',
    accent: '#FF8A80',
    thickness: 11,
    motif: 'drip',
  },
];

export const DEFAULT_DRAW_MARK: DrawMarkDef = DRAW_MARKS[0];

export const getDrawMarkById = (id?: string): DrawMarkDef =>
  DRAW_MARKS.find(m => m.id === id) || DEFAULT_DRAW_MARK;
