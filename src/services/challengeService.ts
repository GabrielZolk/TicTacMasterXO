import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    ChallengeProgress,
    MissionProgress,
    DailyChallenge,
    WeeklyMission,
    DAILY_CHALLENGE_POOL,
    WEEKLY_MISSION_POOL,
} from '../types/challenges';
import { GameMode, Difficulty } from '../types/game';
import { storeService } from './storeService';
import { battlepassService } from './battlepassService';

const STORAGE_KEY = '@tictacmasterxo:challenges';

interface ChallengeState {
    daily: ChallengeProgress | null;
    dailyChallengeData: DailyChallenge | null;
    missions: MissionProgress[];
    missionData: WeeklyMission[];
    lastDailyDate: string;
    lastWeekStart: string;
}

/**
 * LOCAL date key (YYYY-MM-DD). toISOString() is UTC, so in Brazil (UTC-3) the
 * "day" rolled over at 21:00 — discarding an in-progress daily challenge, and
 * any completed-but-unclaimed reward with it, three hours early.
 */
const toLocalKey = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

const getToday = () => toLocalKey(new Date());

const getWeekStart = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
    d.setDate(diff);
    return toLocalKey(d);
};

// Deterministic daily challenge based on date
const getDailyChallenge = (date: string): DailyChallenge => {
    // Use date string as seed for consistent selection
    let hash = 0;
    for (let i = 0; i < date.length; i++) {
        hash = ((hash << 5) - hash) + date.charCodeAt(i);
        hash |= 0;
    }
    const index = Math.abs(hash) % DAILY_CHALLENGE_POOL.length;
    const template = DAILY_CHALLENGE_POOL[index];
    return { ...template, id: `daily_${date}` };
};

// Deterministic weekly missions based on week start
const getWeeklyMissions = (weekStart: string): WeeklyMission[] => {
    let hash = 0;
    for (let i = 0; i < weekStart.length; i++) {
        hash = ((hash << 5) - hash) + weekStart.charCodeAt(i);
        hash |= 0;
    }
    // Pick 3 missions
    const shuffled = [...WEEKLY_MISSION_POOL].sort((a, b) => {
        const ha = Math.abs((hash * (WEEKLY_MISSION_POOL.indexOf(a) + 1)) % 1000);
        const hb = Math.abs((hash * (WEEKLY_MISSION_POOL.indexOf(b) + 1)) % 1000);
        return ha - hb;
    });
    return shuffled.slice(0, 3).map((m, i) => ({ ...m, id: `weekly_${weekStart}_${i}` }));
};

class ChallengeService {
    private state: ChallengeState | null = null;
    private listeners: Set<() => void> = new Set();

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
            this.state = data ? JSON.parse(data) : null;
        } catch {
            this.state = null;
        }

        const today = getToday();
        const weekStart = getWeekStart();

        // New day — refresh daily challenge
        if (!this.state || this.state.lastDailyDate !== today) {
            const challenge = getDailyChallenge(today);
            this.state = {
                ...this.state,
                daily: {
                    challengeId: challenge.id,
                    date: today,
                    currentValue: 0,
                    targetValue: challenge.condition.value,
                    completed: false,
                    claimed: false,
                },
                dailyChallengeData: challenge,
                lastDailyDate: today,
                missions: this.state?.missions || [],
                missionData: this.state?.missionData || [],
                // Must NOT default to the current week: on a fresh install that
                // made the "new week" check below false, so weekly missions were
                // never generated and the section stayed empty until next Monday.
                lastWeekStart: this.state?.lastWeekStart || '',
            };
        }

        // New week — refresh missions
        if (!this.state.lastWeekStart || this.state.lastWeekStart !== weekStart) {
            const missions = getWeeklyMissions(weekStart);
            this.state.missions = missions.map(m => ({
                missionId: m.id,
                weekStart,
                currentValue: 0,
                targetValue: m.condition.value,
                completed: false,
                claimed: false,
            }));
            this.state.missionData = missions;
            this.state.lastWeekStart = weekStart;
        }

        await this.save();
    }

    private async save(): Promise<void> {
        if (this.state) {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
        }
    }

    getDaily(): { challenge: DailyChallenge | null; progress: ChallengeProgress | null } {
        return {
            challenge: this.state?.dailyChallengeData || null,
            progress: this.state?.daily || null,
        };
    }

    getMissions(): { missions: WeeklyMission[]; progress: MissionProgress[] } {
        return {
            missions: this.state?.missionData || [],
            progress: this.state?.missions || [],
        };
    }

    // Called after every game
    async onGameEnd(won: boolean, isDraw: boolean, mode: GameMode, difficulty?: Difficulty, currentStreak?: number, opponent?: string): Promise<void> {
        if (!this.state) await this.initialize();

        // Update daily challenge
        if (this.state!.daily && !this.state!.daily.completed && this.state!.dailyChallengeData) {
            const cond = this.state!.dailyChallengeData.condition;
            let increment = 0;

            switch (cond.type) {
                case 'win':
                    if (won && (!cond.difficulty || cond.difficulty === difficulty)) increment = 1;
                    break;
                case 'win_mode':
                    if (won && cond.mode === mode) increment = 1;
                    break;
                case 'win_streak':
                    // Reset if not won, set to streak value if won
                    if (won && currentStreak) {
                        this.state!.daily!.currentValue = Math.min(currentStreak, cond.value);
                    } else {
                        this.state!.daily!.currentValue = 0;
                    }
                    break;
                case 'play_count':
                    increment = 1;
                    break;
                case 'win_under_moves':
                    // Not implemented in current pool
                    break;
            }

            if (cond.type !== 'win_streak') {
                this.state!.daily!.currentValue += increment;
            }

            if (this.state!.daily!.currentValue >= this.state!.daily!.targetValue) {
                this.state!.daily!.completed = true;
            }
        }

        // Update weekly missions
        for (let i = 0; i < this.state!.missions.length; i++) {
            const mp = this.state!.missions[i];
            const mission = this.state!.missionData[i];
            if (!mp || !mission || mp.completed) continue;

            const cond = mission.condition;
            let increment = 0;

            switch (cond.type) {
                case 'win':
                    if (won) increment = 1;
                    break;
                case 'win_streak':
                    if (won && currentStreak) {
                        mp.currentValue = Math.min(currentStreak, cond.value);
                    } else if (!won) {
                        mp.currentValue = 0;
                    }
                    break;
                case 'play_count':
                    increment = 1;
                    break;
                case 'win_mode':
                    if (won && cond.mode === mode) increment = 1;
                    break;
                case 'play_online':
                    // Only real online matches count — this is the mission that
                    // gets a friend to install the game.
                    if (opponent === 'online') increment = 1;
                    break;
            }

            if (cond.type !== 'win_streak') {
                mp.currentValue += increment;
            }

            if (mp.currentValue >= mp.targetValue) {
                mp.completed = true;
            }
        }

        await this.save();
        this.notifyListeners();
    }

    async claimDailyReward(): Promise<{ stars: number; xp: number } | null> {
        if (!this.state?.daily?.completed || this.state.daily.claimed) return null;

        const reward = this.state.dailyChallengeData!.reward;
        this.state.daily.claimed = true;

        await storeService.addCurrency('stars', reward.stars, `Desafio Diario: ${this.state.dailyChallengeData!.title}`);
        if (reward.xp > 0) {
            await battlepassService.addXp(reward.xp);
        }

        await this.save();
        this.notifyListeners();
        return reward;
    }

    async claimMissionReward(index: number): Promise<{ stars: number; xp: number } | null> {
        if (!this.state) return null;
        const mp = this.state.missions[index];
        const mission = this.state.missionData[index];
        if (!mp?.completed || mp.claimed || !mission) return null;

        mp.claimed = true;

        await storeService.addCurrency('stars', mission.reward.stars, `Missao: ${mission.title}`);
        if (mission.reward.xp > 0) {
            await battlepassService.addXp(mission.reward.xp);
        }

        await this.save();
        this.notifyListeners();
        return mission.reward;
    }

    async reset(): Promise<void> {
        this.state = null;
        await AsyncStorage.removeItem(STORAGE_KEY);
        await this.initialize();
        this.notifyListeners();
    }
}

export const challengeService = new ChallengeService();
