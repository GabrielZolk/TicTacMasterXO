import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet,  ScrollView,
    TouchableOpacity, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { useTheme } from '../hooks/useTheme';
import { useGame } from '../contexts/GameContext';
import { achievementService } from '../services/achievementService';
import { SHOW_TOURNAMENT } from '../config/features';
import { Achievement, AchievementProgress } from '../types/achievements';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, createTextStyle } from '../utils/theme';
import AppHeader from '../components/AppHeader';
import { useI18n } from '../i18n/useI18n';

const AchievementsScreen: React.FC = () => {
    const { colors } = useTheme();
    const { t, tc } = useI18n();
    const { playSound, triggerHaptics } = useGame();
    const [data, setData] = useState<{ achievement: Achievement; progress: AchievementProgress }[]>([]);

    // "Campeão do Torneio" needs a tournament win, and the tournament is turned
    // off — so it sat in the list permanently unreachable and made 28/28
    // impossible for everyone. It comes back on its own when the flag flips.
    const visible = (list: { achievement: Achievement; progress: AchievementProgress }[]) =>
        SHOW_TOURNAMENT ? list : list.filter(d => d.achievement.condition.type !== 'tournament_wins');

    useEffect(() => {
        setData(visible(achievementService.getAll()));
        const unsub = achievementService.subscribe(() => setData(visible(achievementService.getAll())));
        return unsub;
    }, []);

    const handleClaim = async (id: string) => {
        await triggerHaptics('heavy');
        const result = await achievementService.claimReward(id);
        if (result) {
            await playSound('win');
            Alert.alert(t('rewardTitle'), `${tc(`achv.${result.id}.title`, result.title)}: +${result.reward.stars} ⭐`);
        }
    };

    const unlocked = data.filter(d => d.progress.unlocked).length;
    const total = data.length;

    return (
        <LinearGradient colors={[colors.background, colors.background + 'E0']} style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <AppHeader title={t('achievementsTitle')} showBack />

                <View style={styles.headerInfo}>
                    <Text style={styles.headerCount}>{unlocked}/{total}</Text>
                    <View style={styles.headerBar}>
                        <View style={[styles.headerBarFill, { width: `${(unlocked / total) * 100}%` }]} />
                    </View>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                    {data.map(({ achievement: a, progress: p }, i) => {
                        const isHidden = a.hidden && !p.unlocked;
                        const canClaim = p.unlocked && !p.claimed;
                        const pct = Math.min((p.currentValue / a.condition.value) * 100, 100);

                        return (
                            <Animated.View key={a.id} entering={FadeInUp.delay(i * 30).duration(200)}>
                                <TouchableOpacity
                                    style={[styles.card, p.unlocked && styles.cardUnlocked, p.claimed && styles.cardClaimed]}
                                    onPress={() => canClaim && handleClaim(a.id)}
                                    disabled={!canClaim}
                                    activeOpacity={canClaim ? 0.7 : 1}
                                >
                                    <Text style={styles.icon}>{isHidden ? '🔒' : a.icon}</Text>
                                    <View style={styles.info}>
                                        {/* The title went straight to the data literal while the
                                            description below already used tc(), so every language
                                            saw the Portuguese title — unaccented, at that. */}
                                        <Text style={styles.title}>{isHidden ? '???' : tc(`achv.${a.id}.title`, a.title)}</Text>
                                        <Text style={styles.desc}>{isHidden ? t('secretAchievement') : tc(`achv.${a.id}.desc`, a.description)}</Text>
                                        {!p.unlocked && !isHidden && (
                                            <View style={styles.progressBar}>
                                                <View style={[styles.progressFill, { width: `${pct}%` }]} />
                                            </View>
                                        )}
                                        {!p.unlocked && !isHidden && (
                                            <Text style={styles.progressText}>{p.currentValue}/{a.condition.value}</Text>
                                        )}
                                    </View>
                                    <View style={styles.right}>
                                        {p.claimed ? (
                                            <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                                        ) : canClaim ? (
                                            <View style={styles.claimBadge}>
                                                <Text style={styles.claimText}>{a.reward.stars} ⭐</Text>
                                            </View>
                                        ) : (
                                            <Text style={styles.rewardPreview}>{a.reward.stars} ⭐</Text>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            </Animated.View>
                        );
                    })}
                    <View style={{ height: 40 }} />
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },
    scroll: { paddingHorizontal: SPACING.lg },
    headerInfo: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm },
    headerCount: { ...createTextStyle('sm', 'bold'), color: COLORS.lightGray, marginBottom: 4 },
    headerBar: { height: 6, backgroundColor: COLORS.darkTertiary, borderRadius: 3, overflow: 'hidden' },
    headerBarFill: { height: '100%', backgroundColor: COLORS.gold, borderRadius: 3 },
    card: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: COLORS.darkSecondary, borderRadius: BORDER_RADIUS.md,
        padding: SPACING.md, marginBottom: SPACING.xs, gap: SPACING.md, ...SHADOWS.light,
        opacity: 0.7,
    },
    cardUnlocked: { opacity: 1, borderWidth: 1, borderColor: COLORS.gold + '40' },
    cardClaimed: { opacity: 0.6, borderColor: COLORS.success + '40' },
    icon: { fontSize: 28 },
    info: { flex: 1 },
    title: { ...createTextStyle('sm', 'bold'), color: COLORS.white },
    desc: { ...createTextStyle('xs', 'regular'), color: COLORS.lightGray, marginTop: 2 },
    progressBar: { height: 4, backgroundColor: COLORS.darkTertiary, borderRadius: 2, marginTop: 6, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: COLORS.xColor, borderRadius: 2 },
    progressText: { ...createTextStyle('xs', 'medium'), color: COLORS.gray, marginTop: 2 },
    right: { alignItems: 'flex-end' },
    claimBadge: { backgroundColor: COLORS.gold, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    claimText: { ...createTextStyle('xs', 'bold'), color: COLORS.darkBackground },
    rewardPreview: { ...createTextStyle('xs', 'medium'), color: COLORS.gray },
});

export default AchievementsScreen;
