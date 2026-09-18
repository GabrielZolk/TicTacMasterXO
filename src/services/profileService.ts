import AsyncStorage from '@react-native-async-storage/async-storage';
import { PlayerProfile, AVATARS, BORDERS, TITLES } from '../types/profile';
import { storeService } from './storeService';

const STORAGE_KEY = '@tictacmasterxo:profile';

/**
 * Substrings rejected in display names. Matched against a normalized form
 * (accents, spacing and leetspeak stripped), so variants are caught too.
 * Deliberately short and conservative — it blocks the obvious, not everything.
 */
const BLOCKED_NAME_TERMS = [
    // pt-BR
    'caralho', 'porra', 'buceta', 'boceta', 'piroca', 'rola', 'pinto',
    'foder', 'fuder', 'fodase', 'puta', 'putaria', 'viado', 'veado',
    'merda', 'cuzao', 'cuzinho', 'arrombado', 'vagabunda', 'piranha',
    'pau', 'xoxota', 'punheta', 'chupa', 'gozada', 'corno', 'bosta',
    // en
    'fuck', 'shit', 'bitch', 'cunt', 'dick', 'cock', 'pussy', 'asshole',
    'whore', 'slut', 'nigger', 'nigga', 'rape', 'penis', 'vagina',
    // es
    'mierda', 'coño', 'cono', 'polla', 'pendejo', 'cabron', 'chinga',
    // fr
    'merde', 'putain', 'salope', 'connard', 'enculer',
    // hate
    'hitler', 'nazi',
];

const INITIAL_PROFILE: PlayerProfile = {
    displayName: 'Jogador',
    avatarId: 'avatar_default',
    borderId: 'border_none',
    titleId: 'title_none',
};

class ProfileService {
    private profile: PlayerProfile | null = null;
    private ownedItems: string[] = ['avatar_default', 'border_none', 'title_none', 'title_novato'];
    private listeners: Set<() => void> = new Set();

    subscribe(listener: () => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notifyListeners(): void {
        this.listeners.forEach(l => l());
    }

    async initialize(): Promise<PlayerProfile> {
        try {
            const data = await AsyncStorage.getItem(STORAGE_KEY);
            if (data) {
                const parsed = JSON.parse(data);
                // Merge over the defaults so profiles saved by older app versions
                // still get any fields added since — otherwise those read as
                // undefined and crash the screens that render them.
                this.profile = { ...INITIAL_PROFILE, ...(parsed.profile || {}) };
                this.ownedItems = parsed.ownedItems || ['avatar_default', 'border_none', 'title_none'];
            } else {
                this.profile = { ...INITIAL_PROFILE };
            }
            return this.profile!;
        } catch (error) {
            console.error('Error initializing profile:', error);
            this.profile = { ...INITIAL_PROFILE };
            return this.profile;
        }
    }

    private async save(): Promise<void> {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
            profile: this.profile,
            ownedItems: this.ownedItems,
        }));
    }

    async getProfile(): Promise<PlayerProfile> {
        if (!this.profile) await this.initialize();
        return this.profile!;
    }

    getOwnedItems(): string[] {
        return this.ownedItems;
    }

    ownsItem(itemId: string): boolean {
        return this.ownedItems.includes(itemId);
    }

    async purchaseProfileItem(itemId: string): Promise<boolean> {
        if (this.ownedItems.includes(itemId)) return true;

        // Find price
        const avatar = AVATARS.find(a => a.id === itemId);
        const border = BORDERS.find(b => b.id === itemId);
        const title = TITLES.find(t => t.id === itemId);
        const price = avatar?.price || border?.price || title?.price || 0;

        // A title that advertises a requirement ("Win 100 games") is earned, never
        // bought. It carries price 0 so that it can be granted for free once the
        // requirement is met — but that also meant the purchase path below sailed
        // straight past both the "can you afford it" check and the confirmation,
        // pushed it into `ownedItems` and handed it over. Every locked title was
        // one tap away from anyone. Only checkTitleUnlocks may grant these.
        if (title?.requirement) return false;

        if (price > 0) {
            const spent = await storeService.spendCurrency('stars', price, itemId, `Comprou perfil: ${itemId}`);
            if (!spent) return false;
        }

        this.ownedItems.push(itemId);
        await this.save();
        this.notifyListeners();
        return true;
    }

    /**
     * The display name is published to the globally readable `leaderboard`
     * node, so it is user-generated content other players (including kids)
     * will see. Filter it before it leaves the device.
     */
    async setDisplayName(name: string): Promise<{ ok: boolean; reason?: 'empty' | 'blocked' }> {
        if (!this.profile) await this.initialize();

        const clean = name.trim().replace(/\s+/g, ' ').substring(0, 20);
        if (clean.length < 2) {
            return { ok: false, reason: 'empty' };
        }

        // Compare with accents/spacing/leetspeak stripped so "p1r0ca" is caught
        const normalized = clean
            .toLowerCase()
            .normalize('NFD')
            .replace(/[̀-ͯ]/g, '')
            .replace(/[0]/g, 'o')
            .replace(/[1|!]/g, 'i')
            .replace(/[3]/g, 'e')
            .replace(/[4@]/g, 'a')
            .replace(/[5$]/g, 's')
            .replace(/[7]/g, 't')
            .replace(/[^a-z]/g, '');

        if (BLOCKED_NAME_TERMS.some(term => normalized.includes(term))) {
            return { ok: false, reason: 'blocked' };
        }

        this.profile!.displayName = clean;
        await this.save();
        this.notifyListeners();
        return { ok: true };
    }

    async equipAvatar(avatarId: string): Promise<boolean> {
        if (!this.ownsItem(avatarId)) return false;
        if (!this.profile) await this.initialize();
        this.profile!.avatarId = avatarId;
        await this.save();
        this.notifyListeners();
        return true;
    }

    async equipBorder(borderId: string): Promise<boolean> {
        if (!this.ownsItem(borderId)) return false;
        if (!this.profile) await this.initialize();
        this.profile!.borderId = borderId;
        await this.save();
        this.notifyListeners();
        return true;
    }

    async equipTitle(titleId: string): Promise<boolean> {
        if (!this.ownsItem(titleId)) return false;
        if (!this.profile) await this.initialize();
        this.profile!.titleId = titleId;
        await this.save();
        this.notifyListeners();
        return true;
    }

    // Check and unlock achievement-based titles
    async checkTitleUnlocks(totalGames: number, totalWins: number, bestStreak: number): Promise<string[]> {
        const unlocked: string[] = [];

        if (totalGames >= 1 && !this.ownsItem('title_novato')) {
            this.ownedItems.push('title_novato');
            unlocked.push('Novato');
        }
        if (totalGames >= 50 && !this.ownsItem('title_veterano')) {
            this.ownedItems.push('title_veterano');
            unlocked.push('Veterano');
        }
        if (totalWins >= 100 && !this.ownsItem('title_mestre')) {
            this.ownedItems.push('title_mestre');
            unlocked.push('Mestre do Velha');
        }
        if (bestStreak >= 10 && !this.ownsItem('title_imbativel')) {
            this.ownedItems.push('title_imbativel');
            unlocked.push('Imbativel');
        }

        if (unlocked.length > 0) {
            await this.save();
            this.notifyListeners();
        }

        return unlocked;
    }

    async reset(): Promise<void> {
        this.profile = { ...INITIAL_PROFILE };
        this.ownedItems = ['avatar_default', 'border_none', 'title_none'];
        await this.save();
        this.notifyListeners();
    }
}

export const profileService = new ProfileService();
