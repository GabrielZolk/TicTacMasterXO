import { database } from '../config/firebase';
import { ref, onValue, off, get } from 'firebase/database';

// Admin-controlled config read from Firebase /admin node
// Edit via Firebase Console (https://console.firebase.google.com)

export interface SeasonalTheme {
    id: string;
    name: string;
    icon: string;
    startDate: number;
    endDate: number;
    colors: {
        background: string;
        secondary: string;
        tertiary: string;
        text: string;
        textSecondary: string;
        gradient: string[];
    };
    price: number; // stars, 0 = free during event
}

export interface WeeklyEvent {
    id: string;
    title: string;
    description: string;
    icon: string;
    mode: string; // target game mode
    multiplier: number; // star earning multiplier
    startDate: number;
    endDate: number;
}

export interface AdminConfig {
    seasonalTheme: SeasonalTheme | null;
    weeklyEvent: WeeklyEvent | null;
    announcement: string | null; // shown on home screen
}

const DEFAULT_CONFIG: AdminConfig = {
    seasonalTheme: null,
    weeklyEvent: null,
    announcement: null,
};

class AdminConfigService {
    private config: AdminConfig = { ...DEFAULT_CONFIG };
    private listeners: Set<() => void> = new Set();
    private listenerRef: any = null;

    subscribe(listener: () => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notifyListeners(): void {
        this.listeners.forEach(l => l());
    }

    async initialize(): Promise<void> {
        try {
            // Read initial config
            const snapshot = await get(ref(database, 'admin'));
            if (snapshot.exists()) {
                this.config = { ...DEFAULT_CONFIG, ...snapshot.val() };
                this.filterExpired();
            }

            // Listen for real-time updates
            this.listenerRef = onValue(ref(database, 'admin'), (snapshot) => {
                if (snapshot.exists()) {
                    this.config = { ...DEFAULT_CONFIG, ...snapshot.val() };
                    this.filterExpired();
                    this.notifyListeners();
                }
            });
        } catch (error) {
            console.log('AdminConfig: Firebase not available, using defaults');
        }
    }

    private filterExpired(): void {
        const now = Date.now();
        if (this.config.seasonalTheme && now > this.config.seasonalTheme.endDate) {
            this.config.seasonalTheme = null;
        }
        if (this.config.weeklyEvent && now > this.config.weeklyEvent.endDate) {
            this.config.weeklyEvent = null;
        }
    }

    getConfig(): AdminConfig {
        return { ...this.config };
    }

    getSeasonalTheme(): SeasonalTheme | null {
        return this.config.seasonalTheme;
    }

    getWeeklyEvent(): WeeklyEvent | null {
        return this.config.weeklyEvent;
    }

    getAnnouncement(): string | null {
        return this.config.announcement;
    }

    // Check if a weekly event applies to the current game mode
    getStarMultiplier(mode: string): number {
        const event = this.config.weeklyEvent;
        if (!event) return 1;
        const now = Date.now();
        if (now < event.startDate || now > event.endDate) return 1;
        if (event.mode === 'all' || event.mode === mode) return event.multiplier;
        return 1;
    }

    cleanup(): void {
        if (this.listenerRef) {
            off(ref(database, 'admin'));
            this.listenerRef = null;
        }
    }
}

export const adminConfigService = new AdminConfigService();
