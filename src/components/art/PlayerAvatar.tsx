import React from 'react';
import Svg, { Circle, Ellipse, G, Path, Polygon, Rect } from 'react-native-svg';

/**
 * Drawn player avatars — flat "sticker" characters (thick dark outline, flat
 * fill) sitting inside a dark disc with a bright accent ring.
 *
 * These replace the system emoji the profile store used to render: emoji look
 * different on every phone, are not ours, and could not carry the app's palette.
 *
 * Every shape is authored on a 64x64 grid and generated from the same source
 * that produced the approved mockup, so the app and the design cannot drift.
 * The disc is deliberately a *very dark* tint of the ring colour — an earlier
 * pass used a mid tone and the blue robot vanished into its blue disc.
 */
interface AvatarEntry {
    disc: string;
    ring: string;
    art: React.ReactNode;
}

const AVATAR_ART: Record<string, AvatarEntry> = {
    avatar_default: {
        disc: '#3D2E00',
        ring: '#FFC93C',
        art: (
            <>
            <Circle cx={32} cy={32} r={21} fill="#FFC93C" stroke="#0E1020" strokeWidth={2.6} strokeLinejoin="round" strokeLinecap="round" />
            <Circle cx={24.5} cy={27} r={3.1} fill="#0E1020" />
            <Circle cx={39.5} cy={27} r={3.1} fill="#0E1020" />
            <Path d="M21 36 Q32 46 43 36" fill="none" stroke="#0E1020" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
            </>
        ),
    },
    avatar_cool: {
        disc: '#0A2440',
        ring: '#4DA3FF',
        art: (
            <>
            <Circle cx={32} cy={32} r={21} fill="#FFC93C" stroke="#0E1020" strokeWidth={2.6} strokeLinejoin="round" strokeLinecap="round" />
            <Rect x={13.5} y={23} width={16} height={11} rx={4} fill="#0E1020" />
            <Rect x={34.5} y={23} width={16} height={11} rx={4} fill="#0E1020" />
            <Rect x={29.5} y={26.5} width={5} height={3} rx={0} fill="#0E1020" />
            <Path d="M17 26 L24 28.5" fill="none" stroke="#5D7FA8" strokeWidth={2.4} strokeLinejoin="round" strokeLinecap="round" />
            <Path d="M38 26 L45 28.5" fill="none" stroke="#5D7FA8" strokeWidth={2.4} strokeLinejoin="round" strokeLinecap="round" />
            <Path d="M23 39 Q32 47 41 38" fill="none" stroke="#0E1020" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
            </>
        ),
    },
    avatar_fire: {
        disc: '#3A1509',
        ring: '#FF6B35',
        art: (
            <>
            <Path d="M32 7 C34 16 40 19 44 26 C48 34 44 48 32 51 C20 48 16 34 20 26 C22 22 25 20 26 16 C28 21 30 22 31 19 C32 15 31 11 32 7 Z" fill="#FF6B35" stroke="#0E1020" strokeWidth={2.6} strokeLinejoin="round" strokeLinecap="round" />
            <Path d="M32 27 C35 32 38 35 38 40 A6.5 6.5 0 0 1 26 40 C26 35 29 32 32 27 Z" fill="#FFD24A" stroke="#0E1020" strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" />
            </>
        ),
    },
    avatar_alien: {
        disc: '#0F3311',
        ring: '#7CE87C',
        art: (
            <>
            <Path d="M32 9 C44 9 52 18 52 29 C52 40 43 53 32 53 C21 53 12 40 12 29 C12 18 20 9 32 9 Z" fill="#7CE87C" stroke="#0E1020" strokeWidth={2.6} strokeLinejoin="round" strokeLinecap="round" />
            <Path d="M19 26 C24 22 29 25 30 30 C31 35 27 38 22 36 C18 34 16 29 19 26 Z" fill="#0E1020" />
            <Path d="M45 26 C40 22 35 25 34 30 C33 35 37 38 42 36 C46 34 48 29 45 26 Z" fill="#0E1020" />
            <Path d="M27 44 H37" fill="none" stroke="#0E1020" strokeWidth={2.6} strokeLinejoin="round" strokeLinecap="round" />
            </>
        ),
    },
    avatar_robot: {
        disc: '#161E3D',
        ring: '#8FA6FF',
        art: (
            <>
            <Path d="M32 19 V11" fill="none" stroke="#0E1020" strokeWidth={2.8} strokeLinejoin="round" strokeLinecap="round" />
            <Circle cx={32} cy={9} r={4} fill="#FFD700" stroke="#0E1020" strokeWidth={2.6} strokeLinejoin="round" strokeLinecap="round" />
            <Rect x={12} y={19} width={40} height={32} rx={9} fill="#B9C8FF" stroke="#0E1020" strokeWidth={2.6} strokeLinejoin="round" strokeLinecap="round" />
            <Rect x={17} y={24} width={30} height={14} rx={6} fill="#1E2647" />
            <Circle cx={25} cy={31} r={4} fill="#7FE9FF" />
            <Circle cx={39} cy={31} r={4} fill="#7FE9FF" />
            <Rect x={24} y={42} width={16} height={4.5} rx={2.2} fill="#5D6FB5" stroke="#0E1020" strokeWidth={2.6} strokeLinejoin="round" strokeLinecap="round" />
            </>
        ),
    },
    avatar_crown: {
        disc: '#33260A',
        ring: '#FFD700',
        art: (
            <>
            <Path d="M10 45 L15 17 L24 29 L32 12 L40 29 L49 17 L54 45 Z" fill="#FFD700" stroke="#0E1020" strokeWidth={2.6} strokeLinejoin="round" strokeLinecap="round" />
            <Rect x={10} y={45} width={44} height={8} rx={3.5} fill="#D9A800" stroke="#0E1020" strokeWidth={2.6} strokeLinejoin="round" strokeLinecap="round" />
            <Circle cx={32} cy={38} r={4} fill="#E33B4E" stroke="#0E1020" strokeWidth={2.6} strokeLinejoin="round" strokeLinecap="round" />
            <Circle cx={19} cy={39} r={2.8} fill="#4DA3FF" stroke="#0E1020" strokeWidth={2.6} strokeLinejoin="round" strokeLinecap="round" />
            <Circle cx={45} cy={39} r={2.8} fill="#4DA3FF" stroke="#0E1020" strokeWidth={2.6} strokeLinejoin="round" strokeLinecap="round" />
            </>
        ),
    },
    avatar_wizard: {
        disc: '#1F1640',
        ring: '#B49BFF',
        art: (
            <>
            <Path d="M32 3 C33 12 38 20 45 26 H19 C26 20 31 12 32 3 Z" fill="#8F73FF" stroke="#0E1020" strokeWidth={2.6} strokeLinejoin="round" strokeLinecap="round" />
            <Path d="M32 3 C33 12 38 20 45 26 H32 Z" fill="#6647E0" />
            <Circle cx={32} cy={18} r={2.6} fill="#FFD700" stroke="#0E1020" strokeWidth={2.6} strokeLinejoin="round" strokeLinecap="round" />
            <Rect x={13} y={25} width={38} height={6} rx={3} fill="#FFD700" stroke="#0E1020" strokeWidth={2.6} strokeLinejoin="round" strokeLinecap="round" />
            <Circle cx={32} cy={39} r={11} fill="#F0C9A0" stroke="#0E1020" strokeWidth={2.6} strokeLinejoin="round" strokeLinecap="round" />
            <Circle cx={27.8} cy={37} r={2} fill="#0E1020" />
            <Circle cx={36.2} cy={37} r={2} fill="#0E1020" />
            <Path d="M24 43 Q32 48 40 43 L37 52 Q32 58 27 52 Z" fill="#F7F8FC" stroke="#0E1020" strokeWidth={2.6} strokeLinejoin="round" strokeLinecap="round" />
            </>
        ),
    },
    avatar_ninja: {
        disc: '#14172A',
        ring: '#9AA3C4',
        art: (
            <>
            <Circle cx={32} cy={32} r={21} fill="#5A5F85" stroke="#0E1020" strokeWidth={2.6} strokeLinejoin="round" strokeLinecap="round" />
            <Path d="M11 26 H53 V38 H11 Z" fill="#1C1F33" stroke="#0E1020" strokeWidth={2.6} strokeLinejoin="round" strokeLinecap="round" />
            <Rect x={17} y={28.5} width={11} height={5.5} rx={2.7} fill="#FFFFFF" />
            <Rect x={36} y={28.5} width={11} height={5.5} rx={2.7} fill="#FFFFFF" />
            <Circle cx={24} cy={31.2} r={1.7} fill="#0E1020" />
            <Circle cx={43} cy={31.2} r={1.7} fill="#0E1020" />
            <Path d="M52 27 L62 21 L59 35 Z" fill="#E33B4E" stroke="#0E1020" strokeWidth={2.6} strokeLinejoin="round" strokeLinecap="round" />
            </>
        ),
    },
    avatar_ghost: {
        disc: '#222534',
        ring: '#E6E9F5',
        art: (
            <>
            <Path d="M32 9 A19 19 0 0 1 51 28 V53 L44.5 47.5 L38 53 L32 47.5 L26 53 L19.5 47.5 L13 53 V28 A19 19 0 0 1 32 9 Z" fill="#F5F7FF" stroke="#0E1020" strokeWidth={2.6} strokeLinejoin="round" strokeLinecap="round" />
            <Circle cx={24.5} cy={28} r={3.9} fill="#0E1020" />
            <Circle cx={39.5} cy={28} r={3.9} fill="#0E1020" />
            <Ellipse cx={32} cy={38.5} rx={4} ry={5.2} fill="#0E1020" />
            </>
        ),
    },
    avatar_diamond: {
        disc: '#052E3A',
        ring: '#7FE9FF',
        art: (
            <>
            <Polygon points="32,9 50,24 32,54 14,24" fill="#7FE9FF" stroke="#0E1020" strokeWidth={2.6} strokeLinejoin="round" strokeLinecap="round" />
            <Polygon points="32,9 50,24 32,54" fill="#39B6D6" />
            <Polygon points="32,9 41,24 23,24" fill="#E4FCFF" />
            <Path d="M14 24 H50" fill="none" stroke="#0E1020" strokeWidth={2.4} strokeLinejoin="round" strokeLinecap="round" />
            <Path d="M23 24 L32 54 L41 24" fill="none" stroke="#0E1020" strokeWidth={2.4} strokeLinejoin="round" strokeLinecap="round" />
            </>
        ),
    },
};

/** Ids that actually have drawn art, for callers that want exhaustiveness. */
export type AvatarArtId = keyof typeof AVATAR_ART;

/** How much of the disc the character fills. */
const ART_SCALE = 0.88;

interface PlayerAvatarProps {
    id: string;
    size?: number;
    /** Hide the outer ring when the avatar already sits inside another border. */
    showRing?: boolean;
}

const PlayerAvatar: React.FC<PlayerAvatarProps> = ({ id, size = 64, showRing = true }) => {
    const entry = AVATAR_ART[id] ?? AVATAR_ART.avatar_default;

    return (
        <Svg width={size} height={size} viewBox="0 0 64 64">
            <Circle cx={32} cy={32} r={31} fill={entry.disc} />
            <G scale={ART_SCALE} originX={32} originY={32}>
                {entry.art}
            </G>
            {showRing && (
                <Circle cx={32} cy={32} r={30} fill="none" stroke={entry.ring} strokeWidth={2.6} />
            )}
        </Svg>
    );
};

/** Accent colour of an avatar, for borders and glows that must match it. */
export const avatarAccent = (id: string): string =>
    (AVATAR_ART[id] ?? AVATAR_ART.avatar_default).ring;

export default PlayerAvatar;
