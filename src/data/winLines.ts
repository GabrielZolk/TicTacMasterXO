/**
 * Alinhadores: o traço que cobre as casas alinhadas quando alguém ganha.
 *
 * Até aqui o jogo não desenhava linha nenhuma — a vitória era só a casa
 * dourada e a borda do tabuleiro acendendo. O `line_default` é esse traço
 * limpo, de graça: o jogador ganha uma coisa que não existia. Os pagos
 * acrescentam matéria em cima dele, na linguagem "matéria viva".
 */

export type WinLineMotif = 'plain' | 'ember' | 'frost' | 'comet' | 'ink';

export interface WinLineDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  price: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  /** Cor do traço. */
  color: string;
  /** Tom claro do brilho e dos detalhes. */
  accent: string;
  /** Espessura em dp. */
  thickness: number;
  motif: WinLineMotif;
}

export const WIN_LINES: WinLineDef[] = [
  {
    id: 'line_default',
    name: 'Traço',
    description: 'Um risco limpo por cima das três casas',
    icon: '➖',
    price: 0,
    rarity: 'common',
    color: '#FFD700',
    accent: '#FFF3BF',
    thickness: 6,
    motif: 'plain',
  },
  {
    id: 'line_ember',
    name: 'Brasa',
    description: 'O risco queima e solta brasas',
    icon: '🔥',
    price: 250,
    rarity: 'rare',
    color: '#FF6B1A',
    accent: '#FFC24A',
    thickness: 7,
    motif: 'ember',
  },
  {
    id: 'line_frost',
    name: 'Geada',
    description: 'O risco congela e cria farpas de gelo',
    icon: '❄️',
    price: 350,
    rarity: 'rare',
    color: '#7FE9FF',
    accent: '#E6FBFF',
    thickness: 5,
    motif: 'frost',
  },
  {
    id: 'line_comet',
    name: 'Cometa',
    description: 'Uma faísca corre na frente e acende o rastro',
    icon: '☄️',
    price: 450,
    rarity: 'epic',
    color: '#B388FF',
    accent: '#FFFFFF',
    thickness: 6,
    motif: 'comet',
  },
  {
    id: 'line_ink',
    name: 'Tinta Viva',
    description: 'Tinta grossa que escorre e pinga do tabuleiro',
    icon: '🪶',
    price: 650,
    rarity: 'legendary',
    color: '#FFB300',
    accent: '#FFF6C9',
    thickness: 9,
    motif: 'ink',
  },
];

export const DEFAULT_WIN_LINE: WinLineDef = WIN_LINES[0];

export const getWinLineById = (id?: string): WinLineDef =>
  WIN_LINES.find(l => l.id === id) || DEFAULT_WIN_LINE;
