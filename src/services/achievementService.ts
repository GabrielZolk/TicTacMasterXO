import AsyncStorage from '@react-native-async-storage/async-storage';
import { Achievement, AchievementProgress, ACHIEVEMENTS } from '../types/achievements';
import { storeService } from './storeService';
import { profileService } from './profileService';
import { GameMode, Difficulty } from '../types/game';

const STORAGE_KEY = '@tictacmasterxo:achievements';

class AchievementService {
    private progress: Map<string, AchievementProgress> = new Map();
    private listeners: Set<() => void> = new Set();
    private modesWon: Set<string> = new Set();

    subscribe(listener: () => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notifyListeners(): void {
        this.listeners.forEach(l => l());
    }

    async initialize(): Promise<void> {
        try {
            const data = await AsyncStorage.getItem(STORAGE_KEY);
            if (data) {
                const parsed = JSON.parse(data);
                this.progress = new Map(Object.entries(parsed.progress || {}));
                this.modesWon = new Set(parsed.modesWon || []);
            }
        } catch {
            // First time
        }
    }

    private async save(): Promise<void> {
        const data = {
            progress: Object.fromEntries(this.progress),
            modesWon: Array.from(this.modesWon),
        };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    getAll(): { achievement: Achievement; progress: AchievementProgress }[] {
        return ACHIEVEMENTS.map(a => ({
            achievement: a,
            progress: this.progress.get(a.id) || {
                achievementId: a.id,
                currentValue: 0,
                unlocked: false,
                claimed: false,
            },
        }));
    }

    getUnclaimedCount(): number {
        return ACHIEVEMENTS.filter(a => {
            const p = this.progress.get(a.id);
            return p?.unlocked && !p.claimed;
        }).length;
    }

    // Update progress after a game
    async onGameEnd(
        won: boolean,
        isDraw: boolean,
        mode: GameMode,
        difficulty?: Difficulty,
        totalGames?: number,
        totalWins?: number,
        bestStreak?: number,
        chestsOpened?: number,
    ): Promise<string[]> {
        const newlyUnlocked: string[] = [];

        // Track mode wins
        if (won) {
            this.modesWon.add(mode);
        }

        // Check each achievement
        for (const achievement of ACHIEVEMENTS) {
            const existing = this.progress.get(achievement.id);
            if (existing?.unlocked) continue;

            let currentValue = existing?.currentValue || 0;
            const { type, value: target } = achievement.condition;

            switch (type) {
                case 'games_played':
                    currentValue = totalGames || 0;
                    break;
                case 'wins':
                    currentValue = totalWins || 0;
                    break;
                case 'best_streak':
                    currentValue = bestStreak || 0;
                    break;
                case 'modes_won':
                    currentValue = this.modesWon.size;
                    break;
                case 'chests_opened':
                    currentValue = chestsOpened || 0;
                    break;
                case 'beat_challenger':
                    if (won && difficulty === 'challenger') currentValue = 1;
                    break;
                case 'beat_troll':
                    if (won && difficulty === 'troll') currentValue = 1;
                    break;
                case 'lose_to_noob':
                    if (!won && !isDraw && difficulty === 'noob') currentValue = 1;
                    break;
                default:
                    // Mode-specific wins: win_mode_classic, win_mode_blitz, etc
                    if (type.startsWith('win_mode_') && won) {
                        const targetMode = type.replace('win_mode_', '');
                        if (mode === targetMode) currentValue = (existing?.currentValue || 0) + 1;
                    }
                    break;
            }

            const unlocked = currentValue >= target;

            this.progress.set(achievement.id, {
                achievementId: achievement.id,
                currentValue,
                unlocked,
                unlockedAt: unlocked && !existing?.unlocked ? Date.now() : existing?.unlockedAt,
                claimed: existing?.claimed || false,
            });

            if (unlocked && !existing?.unlocked) {
                // The id, not the title. The end-of-match modal looks the name up
                // with tc(`achv.${id}.title`), so pushing the title turned the key
                // into `achv.Grandao.title`, which does not exist — the modal then
                // fell back to the raw literal from the data file: Portuguese,
                // unaccented, in every language.
                newlyUnlocked.push(achievement.id);
            }
        }

        await this.save();
        if (newlyUnlocked.length > 0) this.notifyListeners();
        return newlyUnlocked;
    }

    async updateCollectionAchievements(themesOwned: number, symbolsOwned: number): Promise<void> {
        for (const a of ACHIEVEMENTS.filter(a => a.category === 'collection')) {
            const existing = this.progress.get(a.id);
            if (existing?.unlocked) continue;

            let value = 0;
            if (a.condition.type === 'themes_owned') value = themesOwned;
            if (a.condition.type === 'symbols_owned') value = symbolsOwned;

            this.progress.set(a.id, {
                achievementId: a.id,
                currentValue: value,
                unlocked: value >= a.condition.value,
                unlockedAt: value >= a.condition.value ? Date.now() : undefined,
                claimed: existing?.claimed || false,
            });
        }
        await this.save();
    }

    async updateReferralAchievement(referrals: number): Promise<void> {
        const a = ACHIEVEMENTS.find(a => a.condition.type === 'referrals');
        if (!a) return;
        const existing = this.progress.get(a.id);
        if (existing?.unlocked) return;

        this.progress.set(a.id, {
            achievementId: a.id,
            currentValue: referrals,
            unlocked: referrals >= a.condition.value,
            unlockedAt: referrals >= a.condition.value ? Date.now() : undefined,
            claimed: false,
        });
        await this.save();
    }

    async updateTournamentAchievement(wins: number): Promise<void> {
        const a = ACHIEVEMENTS.find(a => a.condition.type === 'tournament_wins');
        if (!a) return;
        const existing = this.progress.get(a.id);
        if (existing?.unlocked) return;

        this.progress.set(a.id, {
            achievementId: a.id,
            currentValue: wins,
            unlocked: wins >= a.condition.value,
            unlockedAt: wins >= a.condition.value ? Date.now() : undefined,
            claimed: false,
        });
        await this.save();
    }

    async claimReward(achievementId: string): Promise<Achievement | null> {
        const p = this.progress.get(achievementId);
        if (!p?.unlocked || p.claimed) return null;

        const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
        if (!achievement) return null;

        // Mark claimed BEFORE awaiting, so a double tap can't pass the guard
        // twice and pay the reward out twice.
        p.claimed = true;

        // Grant rewards
        if (achievement.reward.stars > 0) {
            await storeService.addCurrency('stars', achievement.reward.stars, `Conquista: ${achievement.title}`);
        }
        if (achievement.reward.title) {
            await profileService.purchaseProfileItem(achievement.reward.title);
        }
        if (achievement.reward.avatar) {
            await profileService.purchaseProfileItem(achievement.reward.avatar);
        }

        await this.save();
        this.notifyListeners();
        return achievement;
    }

    async reset(): Promise<void> {
        this.progress = new Map();
        this.modesWon = new Set();
        await this.save();
    }
}

export const achievementService = new AchievementService();
