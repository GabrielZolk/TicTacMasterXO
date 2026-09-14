/**
 * Reward names live inside the reward objects themselves (chest tables, battle
 * pass tiers), written in Portuguese. They are rebuilt here from the reward's
 * *shape* so every language gets a proper label:
 *
 *   { type: 'stars', amount: 50 }              -> "50 Estrelas" / "50 Stars"
 *   { type: 'boost', id: 'boost_hint', x: 2 }  -> "Dica x2" / "Hint x2"
 *   { type: 'theme', id: 'theme_neon' }        -> the store item's name
 */
export interface LabelledReward {
    type: string;
    id?: string;
    amount?: number;
    name: string;
}

type Translator = (id: string, fallback?: string) => string;

export const rewardLabel = (reward: LabelledReward, tc: Translator): string => {
    if (reward.type === 'stars') {
        return tc('reward.stars', '{n} Estrelas').replace('{n}', String(reward.amount ?? 0));
    }

    if (reward.type === 'boost' && reward.id) {
        const base = tc(`boost.${reward.id}.name`, reward.name);
        // Chest tables encode the quantity in the name ("Dica x2"); keep it visible.
        return reward.amount ? `${base} x${reward.amount}` : base;
    }

    // symbol / effect / theme / item all carry a store-item id
    if (reward.id) return tc(`item.${reward.id}.name`, reward.name);

    return reward.name;
};

/**
 * Accents are stripped before the key is built, so fixing the accent in a data
 * literal never moves the translation key. That is not hypothetical: the map
 * below was written with `Imbativel` while the pool title says `Imbativel` with
 * an accent, so the lookup missed, the fallback produced `imbat_vel`, and the
 * mission showed its raw Portuguese literal in every language.
 */
const slugify = (s: string): string =>
    s
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_');

/**
 * Weekly missions have no stable id in the data pool (the id is assigned at
 * runtime), so their translation key is derived from the pool title. Only the
 * titles whose key is not simply the slug need an entry here.
 */
const MISSION_SLUGS: Record<string, string> = {
    mestre_dos_modos: 'modos',
    chame_um_amigo: 'amigo',
};

export const missionSlug = (idOrTitle: string): string => {
    const key = slugify(idOrTitle);
    return MISSION_SLUGS[key] ?? key;
};

/**
 * Same story for the daily challenge: the pool carries no id (the id is the
 * date), so the translation key comes from the pool title.
 */
export const dailySlug = (title: string): string => slugify(title);
