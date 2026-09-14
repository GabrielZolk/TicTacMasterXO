import React from 'react';
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Stop } from 'react-native-svg';

/**
 * League medals — a serrated metal disc with a ribbon, tinted per league.
 *
 * Replaces the 🥉🥈🥇💎👑 emoji that used to stand in for rank: those render
 * differently on every device and carry none of the league colour.
 *
 * The rim teeth are pre-computed here (not derived with trig at render time)
 * so the component stays allocation-free on every frame.
 */
export type LeagueTierId = 'bronze' | 'silver' | 'gold' | 'diamond' | 'master';

const TIERS: Record<LeagueTierId, { base: string; lite: string; dark: string }> = {
    bronze: { base: '#CD7F32', lite: '#F0B27A', dark: '#7A4517' },
    silver: { base: '#C0C0C0', lite: '#F4F4F4', dark: '#6E6E6E' },
    gold: { base: '#FFD700', lite: '#FFF6B0', dark: '#A8830A' },
    diamond: { base: '#00D9FF', lite: '#C4F7FF', dark: '#00688F' },
    master: { base: '#FF6B35', lite: '#FFC7AC', dark: '#94300B' },
};

const RIBBON = 'M20 2 L26 24 H38 L44 2 Z';
const RIBBON_FOLD = 'M20 2 L26 24 H32 L29.5 2 Z';
const STAR = 'M32 26 L34.9 33.2 L42.6 33.7 L36.6 38.6 L38.6 46.1 L32 41.8 L25.4 46.1 L27.4 38.6 L21.4 33.7 L29.1 33.2 Z';

interface LeagueMedalProps {
    tier: LeagueTierId;
    size?: number;
}

const LeagueMedal: React.FC<LeagueMedalProps> = ({ tier, size = 48 }) => {
    const c = TIERS[tier] ?? TIERS.bronze;
    const gradientId = `medal_${tier}`;

    return (
        <Svg width={size} height={size} viewBox="0 0 64 64">
            <Defs>
                <LinearGradient id={gradientId} x1="0" y1="0" x2="0.35" y2="1">
                    <Stop offset="0" stopColor={c.lite} />
                    <Stop offset="0.52" stopColor={c.base} />
                    <Stop offset="1" stopColor={c.dark} />
                </LinearGradient>
            </Defs>

            <Path d={RIBBON} fill={c.dark} />
            <Path d={RIBBON_FOLD} fill={c.base} opacity={0.8} />

            <G>
            <Line x1={52.5} y1={36.0} x2={57.0} y2={36.0} stroke={c.dark} strokeWidth={2.6} strokeLinecap="round" />
            <Line x1={51.8} y1={41.31} x2={56.15} y2={42.47} stroke={c.dark} strokeWidth={2.6} strokeLinecap="round" />
            <Line x1={49.75} y1={46.25} x2={53.65} y2={48.5} stroke={c.dark} strokeWidth={2.6} strokeLinecap="round" />
            <Line x1={46.5} y1={50.5} x2={49.68} y2={53.68} stroke={c.dark} strokeWidth={2.6} strokeLinecap="round" />
            <Line x1={42.25} y1={53.75} x2={44.5} y2={57.65} stroke={c.dark} strokeWidth={2.6} strokeLinecap="round" />
            <Line x1={37.31} y1={55.8} x2={38.47} y2={60.15} stroke={c.dark} strokeWidth={2.6} strokeLinecap="round" />
            <Line x1={32.0} y1={56.5} x2={32.0} y2={61.0} stroke={c.dark} strokeWidth={2.6} strokeLinecap="round" />
            <Line x1={26.69} y1={55.8} x2={25.53} y2={60.15} stroke={c.dark} strokeWidth={2.6} strokeLinecap="round" />
            <Line x1={21.75} y1={53.75} x2={19.5} y2={57.65} stroke={c.dark} strokeWidth={2.6} strokeLinecap="round" />
            <Line x1={17.5} y1={50.5} x2={14.32} y2={53.68} stroke={c.dark} strokeWidth={2.6} strokeLinecap="round" />
            <Line x1={14.25} y1={46.25} x2={10.35} y2={48.5} stroke={c.dark} strokeWidth={2.6} strokeLinecap="round" />
            <Line x1={12.2} y1={41.31} x2={7.85} y2={42.47} stroke={c.dark} strokeWidth={2.6} strokeLinecap="round" />
            <Line x1={11.5} y1={36.0} x2={7.0} y2={36.0} stroke={c.dark} strokeWidth={2.6} strokeLinecap="round" />
            <Line x1={12.2} y1={30.69} x2={7.85} y2={29.53} stroke={c.dark} strokeWidth={2.6} strokeLinecap="round" />
            <Line x1={14.25} y1={25.75} x2={10.35} y2={23.5} stroke={c.dark} strokeWidth={2.6} strokeLinecap="round" />
            <Line x1={17.5} y1={21.5} x2={14.32} y2={18.32} stroke={c.dark} strokeWidth={2.6} strokeLinecap="round" />
            <Line x1={21.75} y1={18.25} x2={19.5} y2={14.35} stroke={c.dark} strokeWidth={2.6} strokeLinecap="round" />
            <Line x1={26.69} y1={16.2} x2={25.53} y2={11.85} stroke={c.dark} strokeWidth={2.6} strokeLinecap="round" />
            <Line x1={32.0} y1={15.5} x2={32.0} y2={11.0} stroke={c.dark} strokeWidth={2.6} strokeLinecap="round" />
            <Line x1={37.31} y1={16.2} x2={38.47} y2={11.85} stroke={c.dark} strokeWidth={2.6} strokeLinecap="round" />
            <Line x1={42.25} y1={18.25} x2={44.5} y2={14.35} stroke={c.dark} strokeWidth={2.6} strokeLinecap="round" />
            <Line x1={46.5} y1={21.5} x2={49.68} y2={18.32} stroke={c.dark} strokeWidth={2.6} strokeLinecap="round" />
            <Line x1={49.75} y1={25.75} x2={53.65} y2={23.5} stroke={c.dark} strokeWidth={2.6} strokeLinecap="round" />
            <Line x1={51.8} y1={30.69} x2={56.15} y2={29.53} stroke={c.dark} strokeWidth={2.6} strokeLinecap="round" />
            </G>

            <Circle cx={32} cy={36} r={20.5} fill={`url(#${gradientId})`}
                    stroke={c.dark} strokeWidth={2} />
            <Circle cx={32} cy={36} r={14} fill="none"
                    stroke={c.lite} strokeWidth={1.6} opacity={0.85} />
            <Path d={STAR} fill={c.lite} />
        </Svg>
    );
};

/** Colour of a league, for text that must match its medal. */
export const leagueColor = (tier: LeagueTierId): string => (TIERS[tier] ?? TIERS.bronze).base;

export default LeagueMedal;
