import { database } from '../config/firebase';
import { ref, set, get, onValue, off, remove, query, orderByChild, startAt, endAt, runTransaction } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { GameMode } from '../types/game';
import { rankedService } from './rankedService';

const QUEUE_PATH = 'matchmaking_queue';
const ELO_RANGE = 150; // Match with players within ±150 ELO
const EXPANDED_RANGE = 300; // After timeout, expand search
const SEARCH_TIMEOUT = 15000; // 15s before expanding range

export interface QueueEntry {
    playerId: string;
    playerName: string;
    elo: number;
    mode: GameMode;
    timestamp: number;
    roomCode?: string; // Set when matched
}

export type MatchmakingStatus = 'idle' | 'searching' | 'found' | 'error';

type StatusCallback = (status: MatchmakingStatus, data?: { roomCode?: string; isHost?: boolean; opponentName?: string }) => void;

class MatchmakingService {
    private statusCallback: StatusCallback | null = null;
    private queueRef: any = null;
    private myEntryRef: any = null;
    private searchTimer: ReturnType<typeof setTimeout> | null = null;
    private pollTimer: ReturnType<typeof setInterval> | null = null;
    private isSearching = false;

    onStatus(callback: StatusCallback): void {
        this.statusCallback = callback;
    }

    private updateStatus(status: MatchmakingStatus, data?: any): void {
        if (this.statusCallback) this.statusCallback(status, data);
    }

    async joinQueue(playerName: string, mode: GameMode = 'classic'): Promise<void> {
        if (this.isSearching) return;
        this.isSearching = true;

        const auth = getAuth();
        const playerId = auth.currentUser?.uid;
        if (!playerId) {
            this.updateStatus('error');
            this.isSearching = false;
            return;
        }

        const profile = await rankedService.getProfile();

        const entry: QueueEntry = {
            playerId,
            playerName,
            elo: profile.points,
            mode,
            timestamp: Date.now(),
        };

        // Post to queue
        this.myEntryRef = ref(database, `${QUEUE_PATH}/${playerId}`);
        await set(this.myEntryRef, entry);

        this.updateStatus('searching');

        // Start looking for a match
        this.startMatchSearch(playerId, entry.elo, mode, playerName);

        // Listen for our entry being updated (opponent found us)
        onValue(this.myEntryRef, (snapshot) => {
            if (!snapshot.exists()) return;
            const data = snapshot.val() as QueueEntry;
            if (data.roomCode) {
                // We were matched by someone else
                this.onMatchFound(data.roomCode, false, '');
            }
        });
    }

    private startMatchSearch(myId: string, myElo: number, mode: GameMode, myName: string): void {
        let currentRange = ELO_RANGE;

        // Expand range after timeout
        this.searchTimer = setTimeout(() => {
            currentRange = EXPANDED_RANGE;
        }, SEARCH_TIMEOUT);

        // Poll every 2 seconds for matches
        this.pollTimer = setInterval(async () => {
            if (!this.isSearching) return;

            try {
                const queueRef = ref(database, QUEUE_PATH);
                const snapshot = await get(queueRef);

                if (!snapshot.exists()) return;

                const entries: QueueEntry[] = [];
                snapshot.forEach((child) => {
                    const entry = child.val() as QueueEntry;
                    if (entry.playerId !== myId && entry.mode === mode && !entry.roomCode) {
                        entries.push(entry);
                    }
                });

                // Find best match within ELO range
                const match = entries
                    .filter(e => Math.abs(e.elo - myElo) <= currentRange)
                    .sort((a, b) => Math.abs(a.elo - myElo) - Math.abs(b.elo - myElo))[0];

                if (match) {
                    const roomCode = this.generateRoomCode();

                    // CLAIM the opponent atomically. Both peers poll on their
                    // own timers, so without this they could each "find" the
                    // other and write different room codes over each other —
                    // two hosts, no guest, dead match.
                    const claim = await runTransaction(
                        ref(database, `${QUEUE_PATH}/${match.playerId}/roomCode`),
                        (current) => {
                            if (current) return; // already claimed — abort
                            return roomCode;
                        }
                    );

                    if (!claim.committed) {
                        return; // someone else got them; keep searching
                    }

                    await set(ref(database, `${QUEUE_PATH}/${myId}/roomCode`), roomCode);
                    this.onMatchFound(roomCode, true, match.playerName);
                }
            } catch (error) {
                console.error('Matchmaking poll error:', error);
            }
        }, 2000);
    }

    private onMatchFound(roomCode: string, isHost: boolean, opponentName: string): void {
        this.cleanup();
        this.updateStatus('found', { roomCode, isHost, opponentName });
    }

    async leaveQueue(): Promise<void> {
        this.cleanup();

        // Remove from Firebase queue
        if (this.myEntryRef) {
            try { await remove(this.myEntryRef); } catch {}
            this.myEntryRef = null;
        }

        this.updateStatus('idle');
    }

    private cleanup(): void {
        this.isSearching = false;

        if (this.searchTimer) {
            clearTimeout(this.searchTimer);
            this.searchTimer = null;
        }
        if (this.pollTimer) {
            clearInterval(this.pollTimer);
            this.pollTimer = null;
        }
        if (this.myEntryRef) {
            off(this.myEntryRef);
        }
    }

    // Remove stale entries (older than 60s)
    async cleanStaleEntries(): Promise<void> {
        try {
            const snapshot = await get(ref(database, QUEUE_PATH));
            if (!snapshot.exists()) return;

            const now = Date.now();
            snapshot.forEach((child) => {
                const entry = child.val() as QueueEntry;
                if (now - entry.timestamp > 60000) {
                    remove(ref(database, `${QUEUE_PATH}/${child.key}`));
                }
            });
        } catch {}
    }

    private generateRoomCode(): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = 'R'; // Prefix R for ranked rooms
        for (let i = 0; i < 5; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
}

export const matchmakingService = new MatchmakingService();
