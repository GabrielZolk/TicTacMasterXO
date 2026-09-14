import { Board, Player } from '../types/game';

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.zolk.TicTacMasterXO';

/** Emoji used to draw the final board in a shareable message. */
const CELL_EMOJI: Record<string, string> = {
    X: '❌',
    O: '⭕',
    empty: '⬜',
};

/** Renders the board as emoji rows — pastes cleanly into any chat app. */
export const boardToEmoji = (board: Board): string =>
    board
        .map(row => row.map(cell => (cell ? CELL_EMOJI[cell] : CELL_EMOJI.empty)).join(''))
        .join('\n');

interface ShareCardOptions {
    board: Board;
    winner: Player | null;
    isDraw: boolean;
    /** Localised mode name, e.g. "Modo Clássico VS IA (EXPERT)". */
    gameMode: string;
    /** Localised strings so the card follows the player's language. */
    labels: {
        appName: string;
        won: string;
        lost: string;
        draw: string;
        callToAction: string;
    };
    /** In vs-AI games X is the human; online/local uses the winner symbol. */
    playerSymbol?: Player;
}

/**
 * Builds the shareable "victory card". Deliberately text+emoji rather than a
 * rendered image: no native screenshot dependency, and chat apps show it inline
 * instead of as a file attachment — which is what actually gets forwarded.
 */
export const buildShareCard = ({
    board,
    winner,
    isDraw,
    gameMode,
    labels,
    playerSymbol = 'X',
}: ShareCardOptions): string => {
    let headline: string;
    if (isDraw || !winner) {
        headline = `🤝 ${labels.draw}`;
    } else if (winner === playerSymbol) {
        headline = `🏆 ${labels.won}`;
    } else {
        headline = `😤 ${labels.lost}`;
    }

    return [
        `${labels.appName}`,
        `${headline} — ${gameMode}`,
        '',
        boardToEmoji(board),
        '',
        labels.callToAction,
        PLAY_STORE_URL,
    ].join('\n');
};
