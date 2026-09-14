import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
  
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';

import { useTheme } from '../hooks/useTheme';
import { useGame } from '../contexts/GameContext';
import { useI18n } from '../i18n/useI18n';
import { storeService } from '../services/storeService';
import adMobService from '../services/adMobService';
import iapService, { CONSUMABLE_PRODUCTS, CONSUMABLE_DETAILS } from '../services/iapService';
import { boostService } from '../services/boostService';
import { BOOSTS } from '../types/boosts';
import { ALL_STORE_ITEMS, getItemsByType } from '../data/storeItems';
import { StoreItem, StoreItemType, PlayerWallet, PlayerInventory, ThemeStoreItem, REWARD_AMOUNTS, MAX_REWARDED_ADS_PER_DAY } from '../types/store';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, createTextStyle } from '../utils/theme';
import { RARITY_COLORS, RARITY_ICONS } from '../types/store';
import ThemePreview from '../components/ThemePreview';

const { width } = Dimensions.get('window');

type TabType = 'all' | 'theme' | 'symbol' | 'effect' | 'emote' | 'boost' | 'board_skin';

const StoreScreen: React.FC = () => {
    const navigation = useNavigation();
    const { colors } = useTheme();
    const { playSound, triggerHaptics, updateConfig, gameConfig } = useGame();
    const { t, tc } = useI18n();

    const [activeTab, setActiveTab] = useState<TabType>('all');
    const [wallet, setWallet] = useState<PlayerWallet>({ stars: 0, lastUpdated: 0 });
    const [inventory, setInventory] = useState<PlayerInventory | null>(null);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        loadStoreData();
    }, []);

    const loadStoreData = async () => {
        try {
            // Don't set loading true here to avoid flickering on reloads
            const storeData = await storeService.initialize();
            setWallet(storeData.wallet);
            setInventory(storeData.inventory);
            setAdsLeft(await storeService.getRemainingAdRewards());
            setLoading(false);
        } catch (error) {
            console.error('Error loading store data:', error);
            setLoading(false);
        }
    };

    const isEquipped = (item: StoreItem): boolean => {
        if (!inventory) return false;

        switch (item.type as string) {
            case 'theme':
                return inventory.equippedTheme === item.id;
            case 'symbol':
                return inventory.equippedSymbols === item.id;
            case 'effect':
                return inventory.equippedEffect === item.id;
            case 'board_skin':
                return inventory.equippedBoardSkin === item.id;
            default:
                return false;
        }
    };

    const handleEquip = async (item: StoreItem) => {
        try {
            setProcessingId(item.id);
            await triggerHaptics('medium');
            await playSound('button');

            const result = await storeService.equipItem(item.id, item.type as any);

            if (result) {
                // If it's a theme, update the app configuration and force-save immediately
                if (item.type === 'theme') {
                    const themeItem = item as ThemeStoreItem;
                    const themeId = themeItem.themeId || themeItem.id.replace('theme_', '');
                    updateConfig({ theme: themeId as any });
                    // Force immediate save to prevent losing theme on navigation
                    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
                    const currentConfig = JSON.parse(await AsyncStorage.getItem('@game_config') || '{}');
                    currentConfig.theme = themeId;
                    await AsyncStorage.setItem('@game_config', JSON.stringify(currentConfig));
                }

                await loadStoreData();
                await triggerHaptics('heavy');
            } else {
                Alert.alert(t('errorTitle'), t('equipFailed'));
            }
        } catch (error) {
            console.error('Error equipping item:', error);
            Alert.alert(t('errorTitle'), t('equipFailed'));
        } finally {
            setProcessingId(null);
        }
    };

    const handlePurchase = async (item: StoreItem) => {
        try {
            setProcessingId(item.id);
            await triggerHaptics('medium');
            await playSound('button');

            // Preço e Moeda (apenas estrelas)
            const cost = item.price.stars;
            const currencyType = '⭐';

            if (wallet.stars < cost) {
                Alert.alert(
                    t('insufficientStars'),
                    t('insufficientStarsBody')
                        .replace('{cost}', String(cost))
                        .replace('{have}', String(wallet.stars))
                );
                return;
            }

            Alert.alert(
                t('confirmPurchaseTitle'),
                t('confirmPurchaseBody')
                    .replace('{item}', tc(`item.${item.id}.name`, item.name))
                    .replace('{cost}', String(cost)),
                [
                    {
                        text: t('cancel'),
                        style: 'cancel',
                    },
                    {
                        text: t('buy'),
                        onPress: async () => {
                            const result = await storeService.purchaseItem(item);

                            if (result.success) {
                                await triggerHaptics('heavy');
                                await playSound('win');
                                Alert.alert(t('successTitle'), t(result.message as any));
                                await loadStoreData();
                            } else {
                                Alert.alert(t('errorTitle'), t(result.message as any));
                            }
                        },
                    },
                ]
            );
        } catch (error) {
            console.error('Error purchasing item:', error);
            Alert.alert(t('errorTitle'), t('purchaseFailed'));
        } finally {
            setProcessingId(null);
        }
    };

    const handleBuyBoost = async (boostId: string) => {
        await triggerHaptics('medium');
        await playSound('button');
        const success = await boostService.purchase(boostId);
        if (success) {
            await loadStoreData();
            Alert.alert(t('boughtTitle'), t('boostBought'));
        } else {
            Alert.alert(t('insufficientStars'), t('notEnoughStars'));
        }
    };

    const getFilteredItems = (): StoreItem[] => {
        if (activeTab === 'all' || activeTab === 'boost') {
            // boost tab shows boost cards, not store items
            if (activeTab === 'boost') return [];
            return ALL_STORE_ITEMS;
        }
        if (activeTab === 'emote') {
            return ALL_STORE_ITEMS.filter(i => (i.type as string) === 'emote');
        }
        if (activeTab === 'board_skin') {
            return ALL_STORE_ITEMS.filter(i => (i.type as string) === 'board_skin');
        }
        return getItemsByType(activeTab as StoreItemType);
    };

    const [watchingAd, setWatchingAd] = useState(false);
    // Rewarded ads left today (daily cap keeps the paid star packs meaningful)
    const [adsLeft, setAdsLeft] = useState(MAX_REWARDED_ADS_PER_DAY);
    const [buyingStars, setBuyingStars] = useState<string | null>(null);
    // CONSUMABLE_DETAILS is filled in with the store's real prices as soon as
    // billing answers. That mutation is invisible to React, so bump a counter on
    // every store event to repaint the pack cards with the true price.
    const [, setPriceRevision] = useState(0);
    useEffect(() => iapService.subscribe(() => setPriceRevision(n => n + 1)), []);
    // Tracks the in-flight purchase subscription so it can be detached on unmount
    const purchaseUnsubRef = useRef<(() => void) | null>(null);
    const mountedRef = useRef(true);
    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            purchaseUnsubRef.current?.();
            purchaseUnsubRef.current = null;
        };
    }, []);

    const handleBuyStars = async (productId: string) => {
        if (buyingStars) return;
        setBuyingStars(productId);
        try {
            await triggerHaptics('medium');
            await playSound('button');
            const started = await iapService.requestConsumable(productId);
            if (started) {
                // Wait for purchase listener to process. The unsubscribe is
                // tracked in a ref so unmounting mid-purchase detaches it —
                // otherwise it leaked and set state on an unmounted screen.
                purchaseUnsubRef.current?.();
                const unsubscribe = iapService.subscribe((state) => {
                    if (!state.isProcessing) {
                        unsubscribe();
                        purchaseUnsubRef.current = null;
                        if (!mountedRef.current) return;
                        setBuyingStars(null);
                        loadStoreData(); // Refresh wallet
                    }
                });
                purchaseUnsubRef.current = unsubscribe;
            } else {
                setBuyingStars(null);
                const state = iapService.getState();
                if (state.error) {
                    // `error` is an i18n KEY, not a message. Passing it straight to the
                    // Alert printed "iapErrProductUnavailable" at the player.
                    Alert.alert(t('errorTitle'), t(state.error as any));
                }
            }
        } catch (error) {
            setBuyingStars(null);
        }
    };

    const handleWatchAd = async () => {
        if (watchingAd) return;

        // Check the cap BEFORE showing the ad — never make someone sit through
        // a video only to be told it paid nothing.
        if (!(await storeService.canWatchRewardedAd())) {
            setAdsLeft(0);
            Alert.alert(t('adLimitTitle'), t('adLimitBody'));
            return;
        }

        setWatchingAd(true);
        try {
            await triggerHaptics('medium');
            const reward = await adMobService.showRewarded();
            if (reward) {
                const amount = await storeService.rewardWatchAd();
                await loadStoreData();
                if (amount > 0) {
                    await playSound('win');
                    Alert.alert(t('rewardTitle'), t('adRewardBody').replace('{stars}', String(amount)));
                } else {
                    Alert.alert(t('adLimitTitle'), t('adLimitBody'));
                }
            }
        } catch (error) {
            console.error('Error watching ad:', error);
        } finally {
            setWatchingAd(false);
        }
    };

    const renderCurrencyDisplay = () => (
        <View style={styles.currencyContainer}>
            <View style={styles.currencyItem}>
                <Text style={styles.currencyIcon}>⭐</Text>
                <Text style={styles.currencyAmount}>{wallet.stars}</Text>
            </View>
            {!adMobService.isSubscribed() && (
                <TouchableOpacity
                    style={[styles.watchAdButton, adsLeft <= 0 && styles.watchAdButtonDisabled]}
                    onPress={handleWatchAd}
                    disabled={watchingAd || adsLeft <= 0}
                    activeOpacity={0.7}
                >
                    <Ionicons
                        name="play-circle-outline"
                        size={18}
                        color={adsLeft <= 0 ? COLORS.gray : COLORS.gold}
                    />
                    <Text style={[styles.watchAdText, adsLeft <= 0 && { color: COLORS.gray }]}>
                        {watchingAd ? '...' : `+${REWARD_AMOUNTS.WATCH_AD} ⭐`}
                    </Text>
                    {/* Remaining-today counter, so the cap never feels arbitrary */}
                    <Text style={styles.watchAdCounter}>{adsLeft}/{MAX_REWARDED_ADS_PER_DAY}</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    const renderTabs = () => (
        <View style={styles.tabsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {[
                    { id: 'all', label: t('tabAll'), icon: 'apps-outline' },
                    { id: 'theme', label: t('themes'), icon: 'color-palette-outline' },
                    { id: 'symbol', label: t('tabSymbols'), icon: 'shapes-outline' },
                    { id: 'effect', label: t('tabEffects'), icon: 'sparkles-outline' },
                    { id: 'emote', label: 'Emotes', icon: 'happy-outline' },
                    { id: 'board_skin', label: t('tabBoard'), icon: 'grid-outline' },
                    { id: 'boost', label: t('boosts'), icon: 'flash-outline' },
                ].map((tab) => (
                    <TouchableOpacity
                        key={tab.id}
                        style={[
                            styles.tab,
                            activeTab === tab.id && styles.tabActive,
                        ]}
                        onPress={() => {
                            setActiveTab(tab.id as TabType);
                            playSound('button');
                            triggerHaptics('light');
                        }}
                    >
                        <Ionicons
                            name={tab.icon as any}
                            size={20}
                            color={activeTab === tab.id ? COLORS.white : COLORS.gray}
                        />
                        <Text
                            style={[
                                styles.tabText,
                                activeTab === tab.id && styles.tabTextActive,
                            ]}
                        >
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );

    const renderStoreItem = (item: StoreItem, index: number) => {
        const owned = inventory?.ownedItems.includes(item.id) || false;
        const equipped = isEquipped(item);
        const isProcessing = processingId === item.id;
        const rarityColor = RARITY_COLORS[item.rarity];
        const rarityIcon = RARITY_ICONS[item.rarity];

        // Determine price to display
        const displayPrice = item.price.stars;
        const displayCurrency = '⭐';

        return (
            <Animated.View
                key={item.id}
                entering={FadeInUp.delay(index * 50).duration(400)}
                style={styles.itemContainer}
            >
                <TouchableOpacity
                    style={[
                        styles.itemCard,
                        { borderColor: rarityColor },
                        owned && !equipped && styles.itemCardOwned,
                        equipped && styles.itemCardEquipped,
                    ]}
                    onPress={() => {
                        if (owned) {
                            // Emotes are collectible, not equippable
                            if ((item.type as string) !== 'emote' && !equipped) handleEquip(item);
                        } else {
                            handlePurchase(item);
                        }
                    }}
                    disabled={equipped || isProcessing || (owned && (item.type as string) === 'emote')}
                    activeOpacity={0.8}
                >
                    {/* Preview — mini board for themes, gradient for others */}
                    {item.previewGradient && item.type === 'theme' ? (
                        <View style={styles.itemPreview}>
                            <ThemePreview
                                gradient={item.previewGradient}
                                textColor={(item as ThemeStoreItem).content?.text}
                                secondaryColor={(item as ThemeStoreItem).content?.textSecondary}
                                size={80}
                            />
                        </View>
                    ) : item.previewGradient ? (
                        <LinearGradient
                            colors={item.previewGradient as any}
                            style={styles.itemPreview}
                        >
                            <Text style={styles.itemEmoji}>{item.emoji || item.icon}</Text>
                        </LinearGradient>
                    ) : (
                        <View style={[styles.itemPreview, { backgroundColor: COLORS.darkTertiary }]}>
                            <Text style={styles.itemEmoji}>{item.emoji || item.icon}</Text>
                        </View>
                    )}

                    {/* Conteúdo */}
                    <View style={styles.itemContent}>
                        {/* Badge de raridade */}
                        <View style={[styles.rarityBadge, { backgroundColor: rarityColor }]}>
                            <Text style={styles.rarityText}>{rarityIcon}</Text>
                        </View>

                        {/* Badge "NOVO" */}
                        {item.isNew && !owned && (
                            <View style={styles.newBadge}>
                                <Text style={styles.newBadgeText}>{t('newBadge')}</Text>
                            </View>
                        )}

                        {/* Nome */}
                        <Text style={styles.itemName} numberOfLines={1}>
                            {tc(`item.${item.id}.name`, item.name)}
                        </Text>

                        {/* Descrição */}
                        <Text style={styles.itemDescription} numberOfLines={2}>
                            {tc(`item.${item.id}.desc`, item.description)}
                        </Text>

                        {/* Botão de Ação (Footer) */}
                        <View style={styles.itemFooter}>
                            {isProcessing ? (
                                <View style={styles.actionButton}>
                                    <ActivityIndicator size="small" color={COLORS.white} />
                                </View>
                            ) : equipped ? (
                                <View style={[styles.actionButton, styles.buttonEquipped]}>
                                    <Ionicons name="checkmark-circle" size={16} color={COLORS.white} />
                                    <Text style={styles.buttonText}>{t('equippedUpper')}</Text>
                                </View>
                            ) : owned ? (
                                <View style={[styles.actionButton, (item.type as string) === 'emote' ? styles.buttonEquipped : styles.buttonEquip]}>
                                    <Text style={styles.buttonText}>{(item.type as string) === 'emote' ? t('purchasedUpper') : t('equipUpper')}</Text>
                                </View>
                            ) : (
                                <View style={[styles.actionButton, styles.buttonBuy]}>
                                    <Text style={styles.buttonText}>{displayPrice} {displayCurrency}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <ActivityIndicator size="large" color={COLORS.gold} />
                <Text style={styles.loadingText}>{t('loadingStore')}</Text>
            </View>
        );
    }

    const filteredItems = getFilteredItems();

    return (
        <LinearGradient
            colors={colors.gradient?.length >= 2 ? colors.gradient as any : ['#0A0A0A', '#1A1A2E']}
            style={styles.container}
        >
            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => {
                            navigation.goBack();
                            playSound('button');
                            triggerHaptics('light');
                        }}
                        style={styles.backButton}
                    >
                        <Ionicons name="arrow-back" size={24} color={COLORS.white} />
                    </TouchableOpacity>

                    <View style={styles.headerCenter}>
                        <Text style={styles.headerTitle}>🏪 {t('store')}</Text>
                    </View>

                    {renderCurrencyDisplay()}
                </View>

                {/* Tabs */}
                {renderTabs()}

                {/* Items Grid */}
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Star Packs - only on 'all' tab */}
                    {activeTab === 'all' && (
                        <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.starPacksSection}>
                            <Text style={styles.starPacksTitle}>⭐ {t('buyStars')}</Text>
                            <View style={styles.starPacksRow}>
                                {Object.entries(CONSUMABLE_DETAILS).map(([productId, details]) => (
                                    <TouchableOpacity
                                        key={productId}
                                        style={[
                                            styles.starPackCard,
                                            buyingStars === productId && styles.starPackCardDisabled,
                                        ]}
                                        onPress={() => handleBuyStars(productId)}
                                        disabled={!!buyingStars}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.starPackStars}>{details.stars} ⭐</Text>
                                        {details.bonus ? (
                                            <View style={styles.starPackBonusBadge}>
                                                <Text style={styles.starPackBonusText}>{details.bonus}</Text>
                                            </View>
                                        ) : null}
                                        <Text style={styles.starPackPrice}>
                                            {buyingStars === productId ? '...' : details.price}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </Animated.View>
                    )}

                    {/* Boost cards — show on 'boost' or 'all' tab */}
                    {(activeTab === 'boost' || activeTab === 'all') && (
                        <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.starPacksSection}>
                            {activeTab === 'all' && <Text style={styles.starPacksTitle}>⚡ {t('boosts')}</Text>}
                            <View style={styles.starPacksRow}>
                                {BOOSTS.map(boost => (
                                    <TouchableOpacity
                                        key={boost.id}
                                        style={styles.starPackCard}
                                        onPress={() => handleBuyBoost(boost.id)}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.starPackStars}>{boost.icon}</Text>
                                        <Text style={[styles.starPackPrice, { color: COLORS.white, fontSize: 12 }]}>{tc(`boost.${boost.id}.name`, boost.name)}</Text>
                                        <Text style={styles.starPackPrice}>{boost.price} ⭐</Text>
                                        <Text style={[styles.starPackBonusText, { color: COLORS.gray, fontSize: 10 }]}>
                                            x{boostService.getQuantity(boost.id)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </Animated.View>
                    )}

                    {/* Tip for emote tab */}
                    {activeTab === 'emote' && (
                        <View style={styles.emoteTip}>
                            <Text style={styles.emoteTipIcon}>💡</Text>
                            <Text style={styles.emoteTipText}>{t('emoteTip')}</Text>
                        </View>
                    )}

                    <View style={styles.itemsGrid}>
                        {filteredItems.map((item, index) => renderStoreItem(item, index))}
                    </View>

                    {/* Empty State — skip for boost tab since boosts render separately */}
                    {filteredItems.length === 0 && activeTab !== 'boost' && (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyIcon}>🛍️</Text>
                            <Text style={styles.emptyText}>{t('noItemsFound')}</Text>
                        </View>
                    )}
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    centerContent: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        ...createTextStyle('md', 'medium'),
        color: COLORS.white,
        marginTop: SPACING.md,
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.darkSecondary,
        alignItems: 'center',
        justifyContent: 'center',
        ...SHADOWS.light,
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        ...createTextStyle('xxl', 'bold'),
        color: COLORS.white,
    },

    // Currency Display
    currencyContainer: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    currencyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.darkSecondary,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.lg,
        ...SHADOWS.light,
    },
    currencyIcon: {
        fontSize: 18,
        marginRight: SPACING.xs,
    },
    currencyAmount: {
        ...createTextStyle('md', 'bold'),
        color: COLORS.white,
    },
    watchAdButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.gold + '20',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.gold + '40',
        gap: 4,
    },
    watchAdButtonDisabled: {
        opacity: 0.5,
    },
    watchAdCounter: {
        ...createTextStyle('xs', 'bold'),
        color: COLORS.gray,
        marginLeft: 2,
    },
    watchAdText: {
        ...createTextStyle('sm', 'bold'),
        color: COLORS.gold,
    },

    // Star Packs
    starPacksSection: {
        paddingHorizontal: SPACING.lg,
        marginBottom: SPACING.lg,
    },
    starPacksTitle: {
        ...createTextStyle('md', 'bold'),
        color: COLORS.gold,
        marginBottom: SPACING.sm,
    },
    starPacksRow: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    starPackCard: {
        flex: 1,
        backgroundColor: COLORS.darkSecondary,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.gold + '40',
        padding: SPACING.md,
        alignItems: 'center',
        ...SHADOWS.medium,
    },
    starPackCardDisabled: {
        opacity: 0.5,
    },
    starPackStars: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.white,
        marginBottom: 4,
    },
    starPackBonusBadge: {
        backgroundColor: COLORS.success,
        borderRadius: 8,
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginBottom: 4,
    },
    starPackBonusText: {
        ...createTextStyle('xs', 'bold'),
        color: COLORS.white,
    },
    starPackPrice: {
        ...createTextStyle('sm', 'bold'),
        color: COLORS.gold,
    },

    // Tabs
    tabsContainer: {
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        marginRight: SPACING.sm,
        backgroundColor: COLORS.darkSecondary + '80',
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    tabActive: {
        backgroundColor: COLORS.darkTertiary,
        borderColor: COLORS.gold,
    },
    tabText: {
        ...createTextStyle('sm', 'medium'),
        color: COLORS.gray,
        marginLeft: SPACING.xs,
    },
    tabTextActive: {
        color: COLORS.white,
    },

    // Scroll View
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: SPACING.lg,
        paddingBottom: SPACING.xxl,
    },

    // Items Grid
    itemsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    itemContainer: {
        width: '48%',
        marginBottom: SPACING.md,
    },
    itemCard: {
        backgroundColor: COLORS.darkSecondary,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 2,
        overflow: 'hidden',
        height: 250, // FIX: Altura fixa para todos os cards
        ...SHADOWS.medium,
        display: 'flex',
        flexDirection: 'column',
    },
    itemCardOwned: {
        borderColor: COLORS.success,
    },
    itemCardEquipped: {
        borderColor: COLORS.gold,
        backgroundColor: COLORS.darkTertiary + '40', // Highlight background
    },
    itemPreview: {
        width: '100%',
        height: 100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemEmoji: {
        fontSize: 40,
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    itemContent: {
        padding: SPACING.md,
        flex: 1,
        justifyContent: 'space-between', // Push footer to bottom
    },

    // Badges
    rarityBadge: {
        position: 'absolute',
        top: SPACING.xs,
        right: SPACING.xs,
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)', // Backdrop
    },
    rarityText: {
        fontSize: 12,
    },
    newBadge: {
        position: 'absolute',
        top: SPACING.xs,
        left: SPACING.xs,
        backgroundColor: COLORS.xColor,
        paddingHorizontal: SPACING.sm,
        paddingVertical: 2,
        borderRadius: BORDER_RADIUS.sm,
        zIndex: 1,
    },
    newBadgeText: {
        ...createTextStyle('xs', 'bold'),
        color: COLORS.white,
    },

    // Item Info
    itemName: {
        ...createTextStyle('md', 'bold'),
        color: COLORS.white,
        marginBottom: SPACING.xs,
        marginTop: SPACING.sm,
    },
    itemDescription: {
        ...createTextStyle('xs', 'regular'),
        color: COLORS.gray,
        lineHeight: 16,
        marginBottom: SPACING.sm,
        flex: 1, // Fill available space
    },

    // Footer / Actions
    itemFooter: {
        marginTop: 'auto',
        width: '100%',
    },
    actionButton: {
        paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.sm,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: SPACING.xs,
    },
    buttonBuy: {
        backgroundColor: COLORS.gold + '20',
        borderWidth: 1,
        borderColor: COLORS.gold,
    },
    buttonEquip: {
        backgroundColor: COLORS.darkSecondary,
    },
    buttonEquipped: {
        backgroundColor: COLORS.success,
    },
    buttonText: {
        ...createTextStyle('sm', 'bold'),
        color: COLORS.white,
    },

    // Empty State
    emoteTip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.info + '20',
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.info + '40',
        padding: SPACING.md,
        marginHorizontal: SPACING.lg,
        marginBottom: SPACING.md,
        gap: SPACING.sm,
    },
    emoteTipIcon: {
        fontSize: 22,
    },
    emoteTipText: {
        flex: 1,
        ...createTextStyle('xs', 'medium'),
        color: COLORS.lightGray,
        lineHeight: 17,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.xxl,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: SPACING.md,
    },
    emptyText: {
        ...createTextStyle('lg', 'medium'),
        color: COLORS.gray,
    },
});

export default StoreScreen;
