import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
  
    ScrollView,
    TouchableOpacity,
    Alert,
    RefreshControl,
    TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { database } from '../config/firebase';
import { ref, set, get, onValue, off, remove } from 'firebase/database';
import { getAuth } from 'firebase/auth';

import { useTheme } from '../hooks/useTheme';
import { useI18n } from '../i18n/useI18n';
import { useGame } from '../contexts/GameContext';
import { firebaseService } from '../services/firebaseService';
import { RootStackParamList, GameMode } from '../types/game';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, createTextStyle } from '../utils/theme';
import AppHeader from '../components/AppHeader';

const LOBBY_PATH = 'public_lobby';

interface PublicRoom {
    id: string;
    hostName: string;
    hostId: string;
    mode: GameMode;
    createdAt: number;
    roomCode: string;
}

/**
 * The mode name shown on the button and on each room badge.
 *
 * This used to be a hardcoded map that was Portuguese-only, half of it without
 * accents ("Classico"), half of it still in English ("Reverse", "Survival"),
 * and missing four modes entirely — bomb, mirror, mad and gobble fell through
 * to the raw id. The names already exist in i18n, one per mode.
 */
const modeLabel = (t: (k: any) => string, mode: string) => t(`${mode}.title`) || mode;

const PublicLobbyScreen: React.FC = () => {
    const { colors } = useTheme();
    const { t } = useI18n();
    const { playSound, triggerHaptics } = useGame();
    const navigation = useNavigation();
    const route = useRoute();
    const mode = (route.params as any)?.mode || 'classic';

    const [rooms, setRooms] = useState<PublicRoom[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [playerName, setPlayerName] = useState(t('defaultPlayerName'));
    const [creating, setCreating] = useState(false);
    const listenerRef = useRef<any>(null);

    // The room age is computed from Date.now() at render time, and the list only
    // re-renders when Firebase pushes a change — so every room sat frozen on the
    // "0s" it had when it arrived, making a stale room look brand new. Ticking
    // once a second keeps the age honest without touching the data.
    const [, setClock] = useState(0);
    useEffect(() => {
        const id = setInterval(() => setClock(n => n + 1), 1000);
        return () => clearInterval(id);
    }, []);

    useEffect(() => {
        // Initialize Firebase first, then listen
        firebaseService.initialize()
            .then(() => {
                loadRooms();
                listenToRooms();
            })
            .catch(() => {
                Alert.alert(t('noConnectionTitle'), t('noConnectionBody'));
            });

        return () => {
            if (listenerRef.current) {
                off(ref(database, LOBBY_PATH));
            }
        };
    }, []);

    const listenToRooms = () => {
        const lobbyRef = ref(database, LOBBY_PATH);
        listenerRef.current = onValue(lobbyRef, (snapshot) => {
            if (!snapshot.exists()) {
                setRooms([]);
                return;
            }

            const roomsList: PublicRoom[] = [];
            snapshot.forEach((child) => {
                const room = child.val() as PublicRoom;
                // Only show rooms less than 5 min old
                if (Date.now() - room.createdAt < 5 * 60 * 1000) {
                    roomsList.push(room);
                }
            });

            // Sort by newest first
            roomsList.sort((a, b) => b.createdAt - a.createdAt);
            setRooms(roomsList);
        });
    };

    const loadRooms = async () => {
        setRefreshing(true);
        try {
            // Clean stale rooms (older than 5 min)
            const snapshot = await get(ref(database, LOBBY_PATH));
            if (snapshot.exists()) {
                snapshot.forEach((child) => {
                    const room = child.val() as PublicRoom;
                    if (Date.now() - room.createdAt > 5 * 60 * 1000) {
                        remove(ref(database, `${LOBBY_PATH}/${child.key}`));
                    }
                });
            }
        } catch {}
        setRefreshing(false);
    };

    const handleCreateRoom = async () => {
        if (creating || !playerName.trim()) return;
        setCreating(true);
        await triggerHaptics('medium');

        try {
            // Ensure Firebase + auth are ready before creating
            await firebaseService.initialize();

            // Wait for auth to be ready (up to 5s)
            const auth = getAuth();
            let attempts = 0;
            while (!auth.currentUser && attempts < 25) {
                await new Promise(r => setTimeout(r, 200));
                attempts++;
            }
            if (!auth.currentUser) {
                throw new Error(t('authUnavailable'));
            }

            const roomCode = await firebaseService.createRoom(mode as GameMode, playerName);

            const publicRoom: PublicRoom = {
                id: roomCode,
                hostName: playerName,
                hostId: auth.currentUser.uid,
                mode: mode as GameMode,
                createdAt: Date.now(),
                roomCode,
            };

            // Post to public lobby
            await set(ref(database, `${LOBBY_PATH}/${roomCode}`), publicRoom);

            // Navigate to waiting room
            (navigation as any).navigate('OnlineWaitingRoom', {
                mode,
                roomCode,
                playerName,
                isHost: true,
            });
        } catch (error: any) {
            const msg = error?.message || t('createRoomFailed');
            Alert.alert(t('createRoomErrorTitle'), msg);
            console.error('Create room error:', error);
        } finally {
            setCreating(false);
        }
    };

    const handleJoinRoom = async (room: PublicRoom) => {
        await triggerHaptics('medium');
        await playSound('button');

        try {
            await firebaseService.initialize();
            await firebaseService.joinRoom(room.roomCode, playerName);

            // Remove from public lobby (room is now full)
            await remove(ref(database, `${LOBBY_PATH}/${room.id}`));

            (navigation as any).navigate('OnlineWaitingRoom', {
                mode: room.mode,
                roomCode: room.roomCode,
                playerName,
                isHost: false,
            });
        } catch (error: any) {
            // A lobby entry can outlive its room. Drop the dead one so the list
            // stops advertising it instead of leaving the player tapping a row
            // that always fails, and never surface the service's raw English
            // message ("Room not found") to someone playing in Portuguese.
            remove(ref(database, `${LOBBY_PATH}/${room.id}`)).catch(() => { });
            Alert.alert(t('errorTitle'), t('roomGoneBody'));
        }
    };

    const getTimeAgo = (timestamp: number): string => {
        const diff = Math.floor((Date.now() - timestamp) / 1000);
        if (diff < 60) return `${diff}s`;
        return `${Math.floor(diff / 60)}min`;
    };

    return (
        <LinearGradient colors={[colors.background, colors.background + 'E0']} style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <AppHeader title={t('onlineLobbyTitle')} showBack />

                <View style={styles.content}>
                    {/* Player name input */}
                    <View style={styles.nameSection}>
                        <Text style={styles.nameLabel}>{t('yourNameLabel')}</Text>
                        <TextInput
                            style={styles.nameInput}
                            value={playerName}
                            onChangeText={setPlayerName}
                            maxLength={15}
                            placeholder={t('namePlaceholder')}
                            placeholderTextColor={COLORS.gray}
                        />
                    </View>

                    {/* Create room button */}
                    <TouchableOpacity
                        style={styles.createButton}
                        onPress={handleCreateRoom}
                        disabled={creating}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="add-circle" size={22} color={COLORS.white} />
                        <Text style={styles.createButtonText}>
                            {creating ? t('creatingRoom') : t('createRoomWithMode').replace('{mode}', modeLabel(t, mode))}
                        </Text>
                    </TouchableOpacity>

                    {/* Room count */}
                    <Text style={styles.roomCount}>
                        {rooms.length === 1
                            ? t('roomsAvailableOne', { n: String(rooms.length) })
                            : t('roomsAvailableMany', { n: String(rooms.length) })}
                    </Text>

                    {/* Rooms list */}
                    <ScrollView
                        style={styles.roomsList}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={loadRooms} tintColor={COLORS.lightGray} />
                        }
                    >
                        {rooms.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Ionicons name="people-outline" size={48} color={COLORS.gray} />
                                <Text style={styles.emptyText}>{t('noRoomsAvailable')}</Text>
                                <Text style={styles.emptySubtext}>{t('noRoomsHint')}</Text>
                            </View>
                        ) : (
                            rooms.map((room, i) => (
                                <Animated.View key={room.id} entering={FadeInUp.delay(i * 60).duration(250)}>
                                    <TouchableOpacity
                                        style={styles.roomCard}
                                        onPress={() => handleJoinRoom(room)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.roomLeft}>
                                            <Text style={styles.roomHost}>{room.hostName}</Text>
                                            <View style={styles.roomMeta}>
                                                <View style={styles.modeBadge}>
                                                    <Text style={styles.modeBadgeText}>{modeLabel(t, room.mode)}</Text>
                                                </View>
                                                <Text style={styles.roomTime}>{getTimeAgo(room.createdAt)}</Text>
                                            </View>
                                        </View>
                                        <View style={styles.joinButton}>
                                            <Text style={styles.joinText}>{t('joinAction')}</Text>
                                            <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
                                        </View>
                                    </TouchableOpacity>
                                </Animated.View>
                            ))
                        )}
                        <View style={{ height: 40 }} />
                    </ScrollView>
                </View>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },
    content: { flex: 1, paddingHorizontal: SPACING.lg },
    nameSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        marginTop: SPACING.md,
        marginBottom: SPACING.md,
    },
    nameLabel: {
        ...createTextStyle('sm', 'bold'),
        color: COLORS.lightGray,
    },
    nameInput: {
        flex: 1,
        backgroundColor: COLORS.darkSecondary,
        borderRadius: BORDER_RADIUS.md,
        paddingHorizontal: SPACING.md,
        paddingVertical: 10,
        ...createTextStyle('md', 'bold'),
        color: COLORS.white,
    },
    createButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.success,
        paddingVertical: 14,
        borderRadius: BORDER_RADIUS.lg,
        gap: 8,
        ...SHADOWS.medium,
        marginBottom: SPACING.md,
    },
    createButtonText: {
        ...createTextStyle('md', 'bold'),
        color: COLORS.white,
    },
    roomCount: {
        ...createTextStyle('sm', 'medium'),
        color: COLORS.gray,
        marginBottom: SPACING.sm,
    },
    roomsList: { flex: 1 },
    emptyState: {
        alignItems: 'center',
        paddingVertical: SPACING.xl * 2,
        gap: SPACING.sm,
    },
    emptyText: {
        ...createTextStyle('md', 'bold'),
        color: COLORS.gray,
    },
    emptySubtext: {
        ...createTextStyle('sm', 'regular'),
        color: COLORS.gray,
    },
    roomCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.darkSecondary,
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.md,
        marginBottom: SPACING.sm,
        ...SHADOWS.light,
    },
    roomLeft: { flex: 1 },
    roomHost: {
        ...createTextStyle('md', 'bold'),
        color: COLORS.white,
        marginBottom: 4,
    },
    roomMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    modeBadge: {
        backgroundColor: COLORS.xColor + '30',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    modeBadgeText: {
        ...createTextStyle('xs', 'bold'),
        color: COLORS.xColor,
    },
    roomTime: {
        ...createTextStyle('xs', 'regular'),
        color: COLORS.gray,
    },
    joinButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.xColor,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: BORDER_RADIUS.md,
        gap: 4,
    },
    joinText: {
        ...createTextStyle('sm', 'bold'),
        color: COLORS.white,
    },
});

export default PublicLobbyScreen;
