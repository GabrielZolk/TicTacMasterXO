import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

/**
 * Last line of defence. In a release build an uncaught render error has no red
 * box to land in — React unmounts the whole tree, the surface goes blank and
 * Android kills the process, so the player just sees the app vanish. That is
 * exactly how the stored-config crash read on a real device: "abri e fechou".
 *
 * This boundary sits OUTSIDE every provider on purpose, so it also catches a
 * provider that throws while mounting. For the same reason it does not use the
 * i18n context, the theme or any service: whatever broke must not be able to
 * break the screen that reports it. Its strings and colours are its own.
 */

type Lang = 'pt' | 'en' | 'es' | 'fr';

const COPY: Record<Lang, {
    title: string;
    body: string;
    retry: string;
    bodyAgain: string;
    reset: string;
}> = {
    pt: {
        title: 'Algo deu errado',
        body: 'O jogo tropeçou em um problema. Suas estrelas e seu progresso estão salvos.',
        retry: 'Tentar de novo',
        bodyAgain: 'O problema voltou. Recomeçar leva você ao menu inicial — suas estrelas e seu progresso continuam salvos.',
        reset: 'Recomeçar do menu',
    },
    en: {
        title: 'Something went wrong',
        body: 'The game hit a problem. Your stars and your progress are safe.',
        retry: 'Try again',
        bodyAgain: 'The problem came back. Starting over takes you to the main menu — your stars and progress stay saved.',
        reset: 'Start from the menu',
    },
    es: {
        title: 'Algo salió mal',
        body: 'El juego encontró un problema. Tus estrellas y tu progreso están guardados.',
        retry: 'Intentar de nuevo',
        bodyAgain: 'El problema volvió. Empezar de nuevo te lleva al menú principal — tus estrellas y tu progreso siguen guardados.',
        reset: 'Empezar desde el menú',
    },
    fr: {
        title: 'Un problème est survenu',
        body: 'Le jeu a rencontré un problème. Vos étoiles et votre progression sont sauvegardées.',
        retry: 'Réessayer',
        bodyAgain: 'Le problème est revenu. Recommencer vous ramène au menu principal — vos étoiles et votre progression restent sauvegardées.',
        reset: 'Repartir du menu',
    },
};

/** Same 4-language mapping as useI18n, but with no dependency on it. */
const detectLanguage = (): Lang => {
    try {
        const locales = Localization.getLocales?.();
        const primary = locales && locales.length > 0 ? locales[0] : null;
        const detected = primary?.languageCode || primary?.languageTag?.split('-')[0];
        const code = (detected || '').toLowerCase();
        if (code === 'en' || code === 'es' || code === 'fr') {
            return code;
        }
    } catch {
        // Locale lookup is not worth crashing the crash screen over.
    }
    return 'pt';
};

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    /** Counts failures so the second one can offer a real way out. */
    failures: number;
}

export default class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false, failures: 0 };

    static getDerivedStateFromError(): Partial<State> {
        return { hasError: true };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        // Only to the log — the screen never shows a stack to the player.
        console.log('Uncaught error:', error?.message, info?.componentStack);
        this.setState((prev) => ({ failures: prev.failures + 1 }));
    }

    private retry = () => {
        this.setState({ hasError: false });
    };

    /**
     * Escape hatch for a crash loop. Clears only the saved game configuration —
     * the mode/opponent/difficulty the app reopens into, which is the one piece
     * of stored state that can put the app straight back into the broken
     * screen. Stats, stars and every other key are left untouched.
     */
    private resetAndRetry = async () => {
        try {
            await AsyncStorage.removeItem('@game_config');
        } catch {
            // Nothing else to try; fall through and re-render anyway.
        }
        this.setState({ hasError: false, failures: 0 });
    };

    render() {
        if (!this.state.hasError) {
            return this.props.children;
        }

        const copy = COPY[detectLanguage()];
        const looping = this.state.failures > 1;

        return (
            <View style={styles.container}>
                <Text style={styles.emoji}>🎮</Text>
                <Text style={styles.title}>{copy.title}</Text>
                <Text style={styles.body}>{looping ? copy.bodyAgain : copy.body}</Text>

                <TouchableOpacity
                    style={styles.button}
                    onPress={looping ? this.resetAndRetry : this.retry}
                    activeOpacity={0.8}
                >
                    <Text style={styles.buttonText}>{looping ? copy.reset : copy.retry}</Text>
                </TouchableOpacity>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A0A0A',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    emoji: {
        fontSize: 56,
        marginBottom: 20,
    },
    title: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 12,
    },
    body: {
        color: '#B0B0B0',
        fontSize: 16,
        lineHeight: 24,
        textAlign: 'center',
        marginBottom: 32,
    },
    button: {
        backgroundColor: '#FFD700',
        paddingVertical: 14,
        paddingHorizontal: 36,
        borderRadius: 12,
    },
    buttonText: {
        color: '#0A0A0A',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
