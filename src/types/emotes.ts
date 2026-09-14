export interface EmotePack {
  id: string;
  name: string;
  price: number; // in stars, 0 = free
  emotes: Emote[];
}

export interface Emote {
  id: string;
  emoji: string;
  label: string;
}

export const EMOTE_PACKS: EmotePack[] = [
  {
    id: 'pack_basic',
    name: 'Basico',
    price: 0,
    emotes: [
      { id: 'gg', emoji: '👍', label: 'GG' },
      { id: 'think', emoji: '🤔', label: 'Hmm' },
      { id: 'happy', emoji: '😄', label: 'Haha' },
      { id: 'sad', emoji: '😢', label: 'Triste' },
    ],
  },
  {
    id: 'pack_provocacao',
    name: 'Provocacao',
    price: 200,
    emotes: [
      { id: 'troll', emoji: '😈', label: 'Troll' },
      { id: 'sleep', emoji: '😴', label: 'Sono' },
      { id: 'clown', emoji: '🤡', label: 'Palhaco' },
      { id: 'skull', emoji: '💀', label: 'Morri' },
    ],
  },
  {
    id: 'pack_gentileza',
    name: 'Gentileza',
    price: 150,
    emotes: [
      { id: 'heart', emoji: '❤️', label: 'Love' },
      { id: 'clap', emoji: '👏', label: 'Bravo' },
      { id: 'star', emoji: '⭐', label: 'Incrivel' },
      { id: 'hug', emoji: '🤗', label: 'Abraco' },
    ],
  },
  {
    id: 'pack_meme',
    name: 'Meme',
    price: 300,
    emotes: [
      { id: 'brain', emoji: '🧠', label: '200 QI' },
      { id: 'fire', emoji: '🔥', label: 'On Fire' },
      { id: 'cold', emoji: '🥶', label: 'Frio' },
      { id: 'sus', emoji: '🫣', label: 'Sus' },
    ],
  },
];

// Get all emotes from owned packs
export function getAvailableEmotes(ownedPackIds: string[]): Emote[] {
  return EMOTE_PACKS
    .filter(pack => pack.price === 0 || ownedPackIds.includes(pack.id))
    .flatMap(pack => pack.emotes);
}
