import AsyncStorage from '@react-native-async-storage/async-storage';
import { database } from '../config/firebase';
import { ref, set, get, onValue, off, update, remove, query, orderByChild, limitToLast } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { rankedService } from './rankedService';
import { profileService } from './profileService';

const STORAGE_KEY = '@tictacmasterxo:social';

export interface LeaderboardEntry {
    playerId: string;
    playerName: string;
    avatar: string;
    points: number;
    tier: string;
    wins: number;
}

export interface FriendInfo {
    id: string;
    name: string;
    avatar: string;
    status: 'online' | 'offline' | 'playing';
    lastSeen: number;
    points: number;
}

interface SocialState {
    friends: string[]; // friend user IDs
    pendingRequests: string[]; // incoming friend request IDs
}

class SocialService {
    private state: SocialState = { friends: [], pendingRequests: [] };
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
            // Merge over the current shape so state written by an older
            // version doesn't leave newly added fields undefined.
            if (data) this.state = { ...this.state, ...JSON.parse(data) };

            // Sync my profile to leaderboard
            await this.syncToLeaderboard();

            // Listen for friend requests
            this.listenForRequests();
        } catch (error) {
            console.log('Social: init error', error);
        }
    }

    private async save(): Promise<void> {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    }

    private getMyId(): string | null {
        return getAuth().currentUser?.uid || null;
    }

    // Sync my ranked profile to the global leaderboard
    async syncToLeaderboard(): Promise<void> {
        const myId = this.getMyId();
        if (!myId) return;

        try {
            const [ranked, profile] = await Promise.all([
                rankedService.getProfile(),
                profileService.getProfile(),
            ]);

            const entry: LeaderboardEntry = {
                playerId: myId,
                playerName: profile.displayName,
                avatar: profile.avatarId,
                points: ranked.points,
                tier: ranked.tier,
                wins: ranked.wins,
            };

            await set(ref(database, `leaderboard/${myId}`), entry);
        } catch {}
    }

    // Get top N players
    async getLeaderboard(limit: number = 50): Promise<LeaderboardEntry[]> {
        try {
            // Ask the server for just the top N. Reading the whole `leaderboard`
            // node and sorting client-side downloaded every player on every
            // screen open — megabytes of billed traffic once the game grows.
            // (The rules declare .indexOn: ["points"] so this is indexed.)
            const topQuery = query(
                ref(database, 'leaderboard'),
                orderByChild('points'),
                limitToLast(limit)
            );
            const snapshot = await get(topQuery);
            if (!snapshot.exists()) return [];

            const entries: LeaderboardEntry[] = [];
            snapshot.forEach(child => {
                entries.push(child.val() as LeaderboardEntry);
            });

            // limitToLast returns ascending order — flip to highest first
            return entries.sort((a, b) => (b.points || 0) - (a.points || 0));
        } catch {
            return [];
        }
    }

    // Set my online status
    async setStatus(status: 'online' | 'offline' | 'playing'): Promise<void> {
        const myId = this.getMyId();
        if (!myId) return;
        try {
            await update(ref(database, `players/${myId}`), {
                status,
                lastSeen: Date.now(),
            });
        } catch {}
    }

    // Add friend by referral code (find their user ID)
    async addFriendByCode(code: string): Promise<boolean> {
        try {
            const snapshot = await get(ref(database, `referrals/${code.toUpperCase()}`));
            if (!snapshot.exists()) return false;

            const data = snapshot.val();
            const friendId = data.ownerId;
            const myId = this.getMyId();

            if (!myId || friendId === myId) return false;
            if (this.state.friends.includes(friendId)) return true; // already friends

            // Send friend request
            await set(ref(database, `friend_requests/${friendId}/${myId}`), {
                from: myId,
                timestamp: Date.now(),
            });

            return true;
        } catch {
            return false;
        }
    }

    // Accept friend request
    async acceptRequest(fromId: string): Promise<void> {
        const myId = this.getMyId();
        if (!myId) return;

        // Add to both friend lists
        if (!this.state.friends.includes(fromId)) {
            this.state.friends.push(fromId);
        }
        this.state.pendingRequests = this.state.pendingRequests.filter(id => id !== fromId);

        // Save on Firebase for the other player too
        try {
            await set(ref(database, `friends/${myId}/${fromId}`), true);
            await set(ref(database, `friends/${fromId}/${myId}`), true);
            await remove(ref(database, `friend_requests/${myId}/${fromId}`));
        } catch {}

        await this.save();
        this.notifyListeners();
    }

    // Get friend list with status
    async getFriends(): Promise<FriendInfo[]> {
        const friends: FriendInfo[] = [];

        for (const friendId of this.state.friends) {
            try {
                const [lbSnap, statusSnap] = await Promise.all([
                    get(ref(database, `leaderboard/${friendId}`)),
                    get(ref(database, `players/${friendId}`)),
                ]);

                const lb = lbSnap.exists() ? lbSnap.val() : {};
                const st = statusSnap.exists() ? statusSnap.val() : {};

                friends.push({
                    id: friendId,
                    name: lb.playerName || 'Jogador',
                    avatar: lb.avatar || 'avatar_default',
                    status: st.status || 'offline',
                    lastSeen: st.lastSeen || 0,
                    points: lb.points || 0,
                });
            } catch {}
        }

        return friends.sort((a, b) => b.points - a.points);
    }

    getPendingRequests(): string[] {
        return this.state.pendingRequests;
    }

    private listenForRequests(): void {
        const myId = this.getMyId();
        if (!myId) return;

        try {
            onValue(ref(database, `friend_requests/${myId}`), (snapshot) => {
                if (!snapshot.exists()) {
                    this.state.pendingRequests = [];
                } else {
                    this.state.pendingRequests = Object.keys(snapshot.val());
                }
                this.save();
                this.notifyListeners();
            });
        } catch {}
    }

    // Load friends from Firebase
    async loadFriendsFromFirebase(): Promise<void> {
        const myId = this.getMyId();
        if (!myId) return;

        try {
            const snapshot = await get(ref(database, `friends/${myId}`));
            if (snapshot.exists()) {
                this.state.friends = Object.keys(snapshot.val());
                await this.save();
            }
        } catch {}
    }

    async reset(): Promise<void> {
        this.state = { friends: [], pendingRequests: [] };
        await this.save();
    }
}

export const socialService = new SocialService();
