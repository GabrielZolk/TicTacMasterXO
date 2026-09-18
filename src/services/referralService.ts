import AsyncStorage from '@react-native-async-storage/async-storage';
import { database } from '../config/firebase';
import { ref, set, get, update } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { storeService } from './storeService';

const STORAGE_KEY = '@tictacmasterxo:referral';
export const REFERRAL_REWARD = 900; // stars for both inviter and invitee

interface ReferralState {
    myCode: string;
    usedCode: string | null; // code I used to join
    invitedCount: number;
    totalEarned: number;
}

class ReferralService {
    private state: ReferralState | null = null;

    async initialize(): Promise<void> {
        try {
            const data = await AsyncStorage.getItem(STORAGE_KEY);
            if (data) {
                // Merge over defaults so state saved by an older version still
                // has every field (undefined counters would produce NaN).
                const parsed = JSON.parse(data);
                this.state = {
                    myCode: '',
                    usedCode: null,
                    invitedCount: 0,
                    totalEarned: 0,
                    ...parsed,
                };
            } else {
                // Generate unique code based on user ID
                const auth = getAuth();
                const uid = auth.currentUser?.uid || Math.random().toString(36).substring(2, 8);
                const code = uid.substring(0, 6).toUpperCase();

                this.state = {
                    myCode: code,
                    usedCode: null,
                    invitedCount: 0,
                    totalEarned: 0,
                };

                // Register code in Firebase
                try {
                    const codeRef = ref(database, `referrals/${code}`);
                    await set(codeRef, {
                        ownerId: uid,
                        createdAt: Date.now(),
                        usedBy: {},
                    });
                } catch {
                    // Firebase may not be available in Expo Go
                    console.log('Referral: Firebase not available, using local only');
                }

                await this.save();
            }
        } catch (error) {
            console.error('Error initializing referral:', error);
        }
    }

    private async save(): Promise<void> {
        if (this.state) {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
        }
    }

    getMyCode(): string {
        return this.state?.myCode || '------';
    }

    getStats(): { invitedCount: number; totalEarned: number } {
        return {
            invitedCount: this.state?.invitedCount || 0,
            totalEarned: this.state?.totalEarned || 0,
        };
    }

    hasUsedCode(): boolean {
        return !!this.state?.usedCode;
    }

    async useCode(code: string): Promise<{ success: boolean; message: string }> {
        if (!this.state) await this.initialize();

        const upperCode = code.trim().toUpperCase();

        // Can't use own code
        if (upperCode === this.state!.myCode) {
            return { success: false, message: 'referralOwnCode' };
        }

        // Already used a code
        if (this.state!.usedCode) {
            return { success: false, message: 'referralAlreadyUsedAny' };
        }

        // Validate code exists in Firebase
        try {
            const codeRef = ref(database, `referrals/${upperCode}`);
            const snapshot = await get(codeRef);

            if (!snapshot.exists()) {
                return { success: false, message: 'referralCodeNotFound' };
            }

            const codeData = snapshot.val();
            const auth = getAuth();
            const myId = auth.currentUser?.uid || 'local';

            // Check if already used by this user
            if (codeData.usedBy && codeData.usedBy[myId]) {
                return { success: false, message: 'referralCodeAlreadyUsed' };
            }

            // Register usage in Firebase
            await update(ref(database, `referrals/${upperCode}/usedBy`), {
                [myId]: Date.now(),
            });

            // Increment inviter's count
            const currentCount = codeData.usedCount || 0;
            await update(ref(database, `referrals/${upperCode}`), {
                usedCount: currentCount + 1,
            });

        } catch (error) {
            // NEVER grant currency for a code we could not verify. This used to
            // fall through to the reward, so airplane mode + any 6-char string
            // was 100 free stars, repeatable by clearing app data.
            console.warn('Referral validation failed:', error);
            return {
                success: false,
                message: 'referralValidateFailed',
            };
        }

        // Mark the code as used BEFORE awaiting the grant, so a double tap
        // can't pass the "already used" guard twice.
        this.state!.usedCode = upperCode;

        // Reward the invitee (me)
        await storeService.addCurrency('stars', REFERRAL_REWARD, `Codigo de convite: ${upperCode}`);
        await this.save();

        return { success: true, message: 'referralSuccessBody' };
    }

    // Called when someone uses our code (checked periodically or via Firebase listener)
    async checkInvites(): Promise<number> {
        if (!this.state) await this.initialize();

        try {
            const codeRef = ref(database, `referrals/${this.state!.myCode}`);
            const snapshot = await get(codeRef);

            if (snapshot.exists()) {
                const data = snapshot.val();
                const newCount = data.usedCount || 0;
                const previousCount = this.state!.invitedCount;

                if (newCount > previousCount) {
                    const newInvites = newCount - previousCount;
                    const reward = newInvites * REFERRAL_REWARD;

                    await storeService.addCurrency('stars', reward, `${newInvites} amigo(s) usaram seu código`);

                    this.state!.invitedCount = newCount;
                    this.state!.totalEarned += reward;
                    await this.save();

                    return newInvites;
                }
            }
        } catch {
            // Firebase not available
        }

        return 0;
    }

    getShareMessage(): string {
        return `Jogue TicTac Master XO comigo! Use meu codigo ${this.state?.myCode || ''} e ganhe ${REFERRAL_REWARD} estrelas gratis! 🎮⭐`;
    }
}

export const referralService = new ReferralService();
