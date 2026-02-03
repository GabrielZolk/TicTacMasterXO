import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
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
import { storeService } from '../services/storeService';
import { ALL_STORE_ITEMS, getItemsByType } from '../data/storeItems';
import { StoreItem, StoreItemType, PlayerWallet, PlayerInventory, ThemeStoreItem } from '../types/store';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, createTextStyle } from '../utils/theme';
import { RARITY_COLORS, RARITY_ICONS } from '../types/store';

const { width } = Dimensions.get('window');

type TabType = 'all' | 'theme' | 'symbol' | 'effect';

const StoreScreen: React.FC = () => {
    const navigation = useNavigation();
    const { colors } = useTheme();
    const { playSound, triggerHaptics, updateConfig, gameConfig } = useGame();

    const [activeTab, setActiveTab] = useState<TabType>('all');
    const [wallet, setWallet] = useState<PlayerWallet>({ stars: 0, diamonds: 0, lastUpdated: 0 });
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
            setLoading(false);
        } catch (error) {
            console.error('Error loading store data:', error);
            setLoading(false);
        }
    };

    const isEquipped = (item: StoreItem): boolean => {
        if (!inventory) return false;

        switch (item.type) {
            case 'theme':
                return inventory.equippedTheme === item.id;
            case 'symbol':
                return inventory.equippedSymbols === item.id;
            case 'effect':
                return inventory.equippedEffect === item.id;
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
                // If it's a theme, update the app configuration immediately
                if (item.type === 'theme') {
                    const themeItem = item as ThemeStoreItem;
                    const themeId = themeItem.themeId || themeItem.id.replace('theme_', '');
                    updateConfig({ theme: themeId as any });
                }

                await loadStoreData(); // Reload to update UI (equipped status)
                await triggerHaptics('heavy');
            } else {
                Alert.alert('Erro', 'Não foi possível equipar o item.');
            }
        } catch (error) {
            console.error('Error equipping item:', error);
            Alert.alert('Erro', 'Falha ao equipar item');
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
                    'Estrelas Insuficientes',
                    `Você precisa de ${cost} ⭐ mas tem apenas ${wallet.stars} ⭐`
                );
                return;
            }

            Alert.alert(
                'Confirmar Compra',
                `Deseja comprar "${item.name}" por ${cost} ${currencyType}?`,
                [
                    {
                        text: 'Cancelar',
                        style: 'cancel',
                    },
                    {
                        text: 'Comprar',
                        onPress: async () => {
                            const result = await storeService.purchaseItem(item);

                            if (result.success) {
                                await triggerHaptics('heavy');
                                await playSound('win');
                                Alert.alert('Sucesso!', result.message);
                                await loadStoreData();
                            } else {
                                Alert.alert('Erro', result.message);
                            }
                        },
                    },
                ]
            );
        } catch (error) {
            console.error('Error purchasing item:', error);
            Alert.alert('Erro', 'Não foi possível completar a compra');
        } finally {
            setProcessingId(null);
        }
    };

    const getFilteredItems = (): StoreItem[] => {
        if (activeTab === 'all') {
            return ALL_STORE_ITEMS;
        }
        return getItemsByType(activeTab as StoreItemType);
    };

    const renderCurrencyDisplay = () => (
        <View style={styles.currencyContainer}>
            <View style={styles.currencyItem}>
                <Text style={styles.currencyIcon}>⭐</Text>
                <Text style={styles.currencyAmount}>{wallet.stars}</Text>
            </View>
        </View>
    );

    const renderTabs = () => (
        <View style={styles.tabsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {[
                    { id: 'all', label: 'Todos', icon: 'apps-outline' },
                    { id: 'theme', label: 'Temas', icon: 'color-palette-outline' },
                    { id: 'symbol', label: 'Símbolos', icon: 'shapes-outline' },
                    { id: 'effect', label: 'Efeitos', icon: 'sparkles-outline' },
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
                            if (!equipped) handleEquip(item);
                        } else {
                            handlePurchase(item);
                        }
                    }}
                    disabled={equipped || isProcessing}
                    activeOpacity={0.8}
                >
                    {/* Preview com gradiente */}
                    {item.previewGradient && (
                        <LinearGradient
                            colors={item.previewGradient as any}
                            style={styles.itemPreview}
                        >
                            <Text style={styles.itemEmoji}>{item.emoji || item.icon}</Text>
                        </LinearGradient>
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
                                <Text style={styles.newBadgeText}>NOVO</Text>
                            </View>
                        )}

                        {/* Nome */}
                        <Text style={styles.itemName} numberOfLines={1}>
                            {item.name}
                        </Text>

                        {/* Descrição */}
                        <Text style={styles.itemDescription} numberOfLines={2}>
                            {item.description}
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
                                    <Text style={styles.buttonText}>EQUIPADO</Text>
                                </View>
                            ) : owned ? (
                                <View style={[styles.actionButton, styles.buttonEquip]}>
                                    <Text style={styles.buttonText}>EQUIPAR</Text>
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
                <Text style={styles.loadingText}>Carregando loja...</Text>
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
                        <Text style={styles.headerTitle}>🏪 Loja</Text>
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
                    <View style={styles.itemsGrid}>
                        {filteredItems.map((item, index) => renderStoreItem(item, index))}
                    </View>

                    {/* Empty State */}
                    {filteredItems.length === 0 && (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyIcon}>🛍️</Text>
                            <Text style={styles.emptyText}>Nenhum item encontrado</Text>
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
