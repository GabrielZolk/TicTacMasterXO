export interface BoostItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  price: number; // in stars
  type: 'hint' | 'extra_time' | 'undo';
}

export const BOOSTS: BoostItem[] = [
  {
    id: 'boost_hint',
    name: 'Dica',
    description: 'Mostra a melhor jogada',
    icon: '💡',
    price: 50,
    type: 'hint',
  },
  {
    id: 'boost_extra_time',
    name: 'Tempo Extra',
    description: '+3 segundos no Blitz',
    icon: '⏱️',
    price: 40,
    type: 'extra_time',
  },
  {
    id: 'boost_undo',
    name: 'Desfazer',
    description: 'Volta sua ultima jogada',
    icon: '↩️',
    price: 60,
    type: 'undo',
  },
];
