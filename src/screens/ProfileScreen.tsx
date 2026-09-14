import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
  
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { useTheme } from '../hooks/useTheme';
import { useGame } from '../contexts/GameContext';
import { useI18n } from '../i18n/useI18n';
import { useNavigation } from '@react-navigation/native';
import { profileService } from '../services/profileService';
import { storeService } from '../services/storeService';
import { rankedService } from '../services/rankedService';
import iapService, { SUBSCRIPTION_PRODUCTS, CONSUMABLE_PRODUCTS } from '../services/iapService';
import { PlayerProfile, AVATARS, BORDERS, TITLES } from '../types/profile';
import { RankedProfile, getLeagueForPoints } from '../types/ranked';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, createTextStyle } from '../utils/theme';
import AppHeader from '../components/AppHeader';
import PlayerAvatar, { avatarAccent } from '../components/art/PlayerAvatar';
import LeagueMedal from '../components/art/LeagueMedal';
import CometBorder from '../components/art/CometBorder';

type ProfileTab = 'avatar' | 'border' | 'title';

const ProfileScreen: React.FC = () => {
    const { colors } = useTheme();
    const { playSound, triggerHaptics, gameStats } = useGame();
    const { t, tc } = useI18n();

    // Cosmetic names live in three separate pools, so the content namespace
    // depends on which tab the item came from.
    const profileItemLabel = (id: string, type: ProfileTab, fallback?: string): string =>
        tc(`${type}.${id}`, fallback);
    const navigation = useNavigation();

    const [profile, setProfile] = useState<PlayerProfile | null>(null);
    const [ranked, setRanked] = useState<RankedProfile | null>(null);
    const [ownedItems, setOwnedItems] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<ProfileTab>('avatar');
    const [editingName, setEditingName] = useState(false);
    const [nameInput, setNameInput] = useState('');
    const [stars, setStars] = useState(0);
    const [plan, setPlan] = useState(iapService.getState());

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const [p, r, wallet] = await Promise.all([
            profileService.getProfile(),
            rankedService.getProfile(),
            storeService.getWallet(),
        ]);
        setProfile(p);
        setRanked(r);
        setOwnedItems(profileService.getOwnedItems());
        setStars(wallet.stars);
        setNameInput(p.displayName);
        setPlan(iapService.getState());

        // Titles were checked against the in-memory scoreboard, which resets every
        // time the app restarts, and against playerX + playerO — playerO is the
        // AI, so losing to it counted as a win. `r` is the persisted profile that
        // GameContext updates after every match, for every mode and opponent.
        const unlocked = await profileService.checkTitleUnlocks(
            r.gamesPlayed,
            r.wins,
            r.bestStreak
        );
        if (unlocked.length > 0) {
            Alert.alert(t('titleUnlocked'), t('titleUnlockedBody').replace('{titles}', unlocked.join(', ')));
            setOwnedItems(profileService.getOwnedItems());
        }
    };

    const handleSaveName = async () => {
        if (nameInput.trim().length === 0) return;
        const result = await profileService.setDisplayName(nameInput);
        if (!result.ok) {
            Alert.alert(
                t('nameRejectedTitle'),
                result.reason === 'blocked' ? t('nameRejectedBlocked') : t('nameRejectedShort')
            );
            return;
        }
        setEditingName(false);
        setProfile(await profileService.getProfile());
        await playSound('button');
    };

    const handlePurchaseAndEquip = async (itemId: string, type: ProfileTab) => {
        await triggerHaptics('medium');
        const owned = ownedItems.includes(itemId);

        if (!owned) {
            const item = [...AVATARS, ...BORDERS, ...TITLES].find(i => i.id === itemId);
            const price = (item as any)?.price || 0;

            if (price > 0 && stars < price) {
                Alert.alert(t('insufficientStars'), t('needStars', { price: String(price) }));
                return;
            }

            if (price > 0) {
                const confirmed = await new Promise<boolean>(resolve => {
                    Alert.alert(t('buyConfirmTitle'), t('confirmPurchaseBody')
                        .replace('{item}', profileItemLabel(itemId, type, (item as any)?.name))
                        .replace('{cost}', String(price)), [
                        { text: t('cancel'), onPress: () => resolve(false), style: 'cancel' },
                        { text: t('buy'), onPress: () => resolve(true) },
                    ]);
                });
                if (!confirmed) return;
            }

            const success = await profileService.purchaseProfileItem(itemId);
            if (!success) {
                Alert.alert(t('errorTitle'), t('purchaseGenericFail'));
                return;
            }
            await playSound('win');
        } else {
            await playSound('button');
        }

        // Equip
        if (type === 'avatar') await profileService.equipAvatar(itemId);
        else if (type === 'border') await profileService.equipBorder(itemId);
        else if (type === 'title') await profileService.equipTitle(itemId);

        await loadData();
    };

    if (!profile || !ranked) return null;

    const league = getLeagueForPoints(ranked.points);

    // What the player currently owns: subscription > battle pass > free
    const planInfo = (() => {
        if (iapService.isSubscribed()) {
            const yearly = plan.productId === SUBSCRIPTION_PRODUCTS.YEARLY_NO_ADS;
            const until = plan.expiryDate
                ? new Date(plan.expiryDate).toLocaleDateString()
                : '';
            return {
                icon: '💎',
                label: yearly ? t('planPremiumYearly') : t('planPremiumMonthly'),
                color: COLORS.gold,
                detail: until ? t('planUntil').replace('{date}', until) : '',
            };
        }
        return {
            icon: '🆓',
            label: t('planFree'),
            color: COLORS.lightGray,
            detail: t('planUpgrade'),
        };
    })();
    const currentBorder = BORDERS.find(b => b.id === profile.borderId);
    const currentTitle = TITLES.find(t => t.id === profile.titleId);

    const renderItems = () => {
        if (activeTab === 'avatar') {
            return AVATARS.map((item, i) => renderItem(item.id, item.id, tc(`avatar.${item.id}`, item.name), item.price, profile.avatarId === item.id, 'avatar', i));
        } else if (activeTab === 'border') {
            return BORDERS.map((item, i) => renderItem(item.id, '', tc(`border.${item.id}`, item.name), item.price, profile.borderId === item.id, 'border', i, item.color));
        } else {
            return TITLES.map((item, i) => renderItem(item.id, '', item.label ? tc(`title.${item.id}`, item.label) : tc(`title.${item.id}`, item.name), item.price, profile.titleId === item.id, 'title', i, undefined, item.requirement ? tc(`title.${item.id}.req`, item.requirement) : undefined));
        }
    };

    const renderItem = (
        id: string, avatarId: string, name: string, price: number,
        isEquipped: boolean, type: ProfileTab, index: number,
        borderColor?: string, requirement?: string
    ) => {
        const owned = ownedItems.includes(id);
        return (
            <Animated.View key={id} entering={FadeInUp.delay(index * 40).duration(250)}>
                <TouchableOpacity
                    style={[
                        styles.itemCard,
                        isEquipped && styles.itemEquipped,
                        borderColor ? { borderLeftWidth: 4, borderLeftColor: borderColor } : null,
                    ]}
                    onPress={() => handlePurchaseAndEquip(id, type)}
                    activeOpacity={0.7}
                >
                    <View style={styles.itemLeft}>
                        {avatarId ? (
                            <View style={styles.itemArt}>
                                <PlayerAvatar id={avatarId} size={34} />
                            </View>
                        ) : null}
                        <View>
                            <Text style={styles.itemName}>{name || '—'}</Text>
                            {requirement && !owned && <Text style={styles.itemReq}>{requirement}</Text>}
                        </View>
                    </View>
                    <View style={styles.itemRight}>
                        {isEquipped ? (
                            <View style={styles.equippedBadge}>
                                <Ionicons name="checkmark" size={14} color={COLORS.white} />
                            </View>
                        ) : !owned && price > 0 ? (
                            <Text style={styles.itemPrice}>{price} ⭐</Text>
                        ) : owned ? (
                            <Text style={styles.itemOwned}>{t('use')}</Text>
                        ) : (
                            <Ionicons name="lock-closed" size={16} color={COLORS.gray} />
                        )}
                    </View>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    return (
        <LinearGradient colors={[colors.background, colors.background + 'E0']} style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <AppHeader title={t('profile')} showBack />

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    {/* Profile Card */}
                    <View style={styles.profileCard}>
                        {/* Drawn avatar; the equipped border animates around it. */}
                        {currentBorder && currentBorder.color !== 'transparent' ? (
                            <CometBorder
                                size={96}
                                color={currentBorder.color}
                                durationMs={currentBorder.style === 'animated' ? 2000 : 3200}
                            >
                                <PlayerAvatar id={profile.avatarId} size={76} showRing={false} />
                            </CometBorder>
                        ) : (
                            <PlayerAvatar id={profile.avatarId} size={88} />
                        )}

                        {editingName ? (
                            <View style={styles.nameEditRow}>
                                <TextInput
                                    style={styles.nameInput}
                                    value={nameInput}
                                    onChangeText={setNameInput}
                                    maxLength={20}
                                    autoFocus
                                    onSubmitEditing={handleSaveName}
                                />
                                <TouchableOpacity onPress={handleSaveName} style={styles.saveButton}>
                                    <Ionicons name="checkmark" size={20} color={COLORS.success} />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity onPress={() => setEditingName(true)} style={styles.nameRow}>
                                <Text style={styles.displayName}>{profile.displayName}</Text>
                                <Ionicons name="pencil" size={14} color={COLORS.gray} />
                            </TouchableOpacity>
                        )}

                        {currentTitle && currentTitle.label ? (
                            <Text style={styles.titleLabel}>{currentTitle.label}</Text>
                        ) : null}

                        {/* Ranked info — tap to see details */}
                        <TouchableOpacity
                            style={styles.rankedRow}
                            onPress={() => (navigation as any).navigate('Ranked')}
                            activeOpacity={0.7}
                        >
                            <LeagueMedal tier={league.tier} size={30} />
                            <Text style={[styles.leagueName, { color: league.color }]}>{tc(`league.${league.tier}`, league.name)}</Text>
                            <Text style={styles.rankedPoints}>{ranked.points} pts</Text>
                            <Ionicons name="chevron-forward" size={16} color={COLORS.gray} />
                        </TouchableOpacity>

                        {/* Current plan — players had no way to see what they own */}
                        <TouchableOpacity
                            style={styles.rankedRow}
                            onPress={() => (navigation as any).navigate('RemoveAds')}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.leagueIcon}>{planInfo.icon}</Text>
                            <Text style={[styles.leagueName, { color: planInfo.color }]}>{planInfo.label}</Text>
                            <Text style={styles.rankedPoints}>{planInfo.detail}</Text>
                            <Ionicons name="chevron-forward" size={16} color={COLORS.gray} />
                        </TouchableOpacity>

                        {/* Achievements shortcut */}
                        <TouchableOpacity
                            style={styles.rankedRow}
                            onPress={() => (navigation as any).navigate('Achievements')}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.leagueIcon}>🏅</Text>
                            <Text style={[styles.leagueName, { color: COLORS.gold }]}>{t('achievementsTitle')}</Text>
                            <Ionicons name="chevron-forward" size={16} color={COLORS.gray} />
                        </TouchableOpacity>

                        {/*
                          * These read the persisted profile, not gameStats: the
                          * scoreboard in GameContext lives only for the current app
                          * run, so a profile that had 2 wins showed 0 after a restart
                          * while the Ranked screen — same matches, persisted source —
                          * still showed 2.
                          */}
                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{ranked?.wins ?? 0}</Text>
                                <Text style={styles.statLabel}>{t('winsShort')}</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{ranked?.losses ?? 0}</Text>
                                <Text style={styles.statLabel}>{t('lossesShort')}</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{ranked?.draws ?? 0}</Text>
                                <Text style={styles.statLabel}>{t('drawsShort')}</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{ranked?.bestStreak ?? 0}</Text>
                                <Text style={styles.statLabel}>{t('bestLabel')}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Tabs */}
                    <View style={styles.tabsRow}>
                        {([
                            { id: 'avatar', label: t('avatars'), icon: 'person-outline' },
                            { id: 'border', label: t('borders'), icon: 'ellipse-outline' },
                            { id: 'title', label: t('titles'), icon: 'ribbon-outline' },
                        ] as { id: ProfileTab; label: string; icon: any }[]).map(tab => (
                            <TouchableOpacity
                                key={tab.id}
                                style={[styles.tab, activeTab === tab.id && styles.tabActive]}
                                onPress={() => { setActiveTab(tab.id); triggerHaptics('light'); }}
                            >
                                <Ionicons name={tab.icon} size={18} color={activeTab === tab.id ? COLORS.white : COLORS.gray} />
                                <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>{tab.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Items */}
                    <View style={styles.itemsList}>
                        {renderItems()}
                    </View>
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },
    scrollContent: { paddingBottom: 40 },
    profileCard: {
        alignItems: 'center',
        padding: SPACING.lg,
        marginHorizontal: SPACING.lg,
        marginTop: SPACING.md,
        backgroundColor: COLORS.darkSecondary + 'CC',
        borderRadius: BORDER_RADIUS.lg,
        ...SHADOWS.medium,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    displayName: {
        ...createTextStyle('lg', 'bold'),
        color: COLORS.white,
    },
    nameEditRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    nameInput: {
        ...createTextStyle('lg', 'bold'),
        color: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.xColor,
        minWidth: 120,
        textAlign: 'center',
        paddingVertical: 2,
    },
    saveButton: {
        padding: 4,
    },
    titleLabel: {
        ...createTextStyle('sm', 'medium'),
        color: COLORS.gold,
        marginBottom: SPACING.sm,
    },
    rankedRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: SPACING.sm,
    },
    leagueIcon: { fontSize: 20 },
    leagueName: {
        ...createTextStyle('md', 'bold'),
    },
    rankedPoints: {
        ...createTextStyle('sm', 'medium'),
        color: COLORS.lightGray,
    },
    statsRow: {
        flexDirection: 'row',
        gap: SPACING.lg,
    },
    statItem: { alignItems: 'center' },
    statValue: {
        ...createTextStyle('md', 'bold'),
        color: COLORS.white,
    },
    statLabel: {
        ...createTextStyle('xs', 'regular'),
        color: COLORS.gray,
    },
    tabsRow: {
        flexDirection: 'row',
        paddingHorizontal: SPACING.lg,
        marginTop: SPACING.lg,
        gap: SPACING.xs,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.md,
        backgroundColor: COLORS.darkSecondary,
        gap: 4,
    },
    tabActive: {
        backgroundColor: COLORS.xColor + '40',
        borderWidth: 1,
        borderColor: COLORS.xColor,
    },
    tabText: {
        ...createTextStyle('xs', 'medium'),
        color: COLORS.gray,
    },
    tabTextActive: { color: COLORS.white },
    itemsList: {
        paddingHorizontal: SPACING.lg,
        marginTop: SPACING.md,
        gap: SPACING.xs,
    },
    itemCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.darkSecondary,
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.md,
        ...SHADOWS.light,
    },
    itemEquipped: {
        borderWidth: 2,
        borderColor: COLORS.success,
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        flex: 1,
    },
    itemEmoji: { fontSize: 28 },
    itemArt: { marginRight: SPACING.sm },
    itemName: {
        ...createTextStyle('sm', 'bold'),
        color: COLORS.white,
    },
    itemReq: {
        ...createTextStyle('xs', 'regular'),
        color: COLORS.gray,
    },
    itemRight: { alignItems: 'flex-end' },
    equippedBadge: {
        backgroundColor: COLORS.success,
        borderRadius: 10,
        width: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemPrice: {
        ...createTextStyle('sm', 'bold'),
        color: COLORS.gold,
    },
    itemOwned: {
        ...createTextStyle('xs', 'bold'),
        color: COLORS.xColor,
    },
});

export default ProfileScreen;
