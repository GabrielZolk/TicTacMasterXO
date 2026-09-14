import { useState, useEffect, useRef } from 'react';
import { storeService } from '../services/storeService';
import { getItemById } from '../data/storeItems';
import { SymbolStoreItem, EffectStoreItem } from '../types/store';
import { BOARD_SKINS, BoardSkin } from '../types/boardSkins';

const DEFAULT_EFFECT: EffectStoreItem['content'] = {
    animationType: 'sparkles',
};

export type SymbolStyle = 'default' | 'theme' | 'neon' | 'gold' | 'fire' | 'ice' | 'matrix';

export const useEquippedSymbols = () => {
    const [symbols, setSymbols] = useState<{ playerX: string; playerO: string; style: SymbolStyle }>({
        playerX: 'X',
        playerO: 'O',
        style: 'default',
    });
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;

        const loadEquippedSymbols = async () => {
            try {
                const inventory = await storeService.getInventory();
                const equippedSymbolId = inventory.equippedSymbols;

                if (!mountedRef.current) return;

                if (equippedSymbolId) {
                    const item = getItemById(equippedSymbolId);
                    if (item && item.type === 'symbol') {
                        const symbolItem = item as SymbolStoreItem;
                        setSymbols({
                            playerX: symbolItem.content.playerX,
                            playerO: symbolItem.content.playerO,
                            style: (symbolItem.content as any).style || 'default',
                        });
                    }
                }
            } catch (error) {
                console.error('Error loading equipped symbols:', error);
            }
        };

        loadEquippedSymbols();

        // Subscribe to inventory changes
        const unsubscribe = storeService.subscribe(() => {
            loadEquippedSymbols();
        });

        return () => {
            mountedRef.current = false;
            unsubscribe();
        };
    }, []);

    return symbols;
};

export const useEquippedEffect = () => {
    const [effect, setEffect] = useState<EffectStoreItem['content']>(DEFAULT_EFFECT);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;

        const loadEquippedEffect = async () => {
            try {
                const inventory = await storeService.getInventory();
                const equippedEffectId = inventory.equippedEffect;

                if (!mountedRef.current) return;

                if (equippedEffectId) {
                    const item = getItemById(equippedEffectId);
                    if (item && item.type === 'effect') {
                        const effectItem = item as EffectStoreItem;
                        setEffect(effectItem.content);
                    } else {
                        setEffect(DEFAULT_EFFECT);
                    }
                } else {
                    setEffect(DEFAULT_EFFECT);
                }
            } catch (error) {
                console.error('Error loading equipped effect:', error);
                if (mountedRef.current) setEffect(DEFAULT_EFFECT);
            }
        };

        loadEquippedEffect();

        // Subscribe to inventory changes
        const unsubscribe = storeService.subscribe(() => {
            loadEquippedEffect();
        });

        return () => {
            mountedRef.current = false;
            unsubscribe();
        };
    }, []);

    return effect;
};

const DEFAULT_BOARD_SKIN: BoardSkin = BOARD_SKINS.find(s => s.id === 'skin_default')!;

export const useEquippedBoardSkin = () => {
    const [skin, setSkin] = useState<BoardSkin>(DEFAULT_BOARD_SKIN);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;

        const loadSkin = async () => {
            try {
                const inventory = await storeService.getInventory();
                const equippedId = inventory.equippedBoardSkin;
                if (!mountedRef.current) return;

                if (equippedId) {
                    const found = BOARD_SKINS.find(s => s.id === equippedId);
                    if (found) {
                        setSkin(found);
                        return;
                    }
                }
                setSkin(DEFAULT_BOARD_SKIN);
            } catch {
                if (mountedRef.current) setSkin(DEFAULT_BOARD_SKIN);
            }
        };

        loadSkin();
        const unsubscribe = storeService.subscribe(loadSkin);

        return () => {
            mountedRef.current = false;
            unsubscribe();
        };
    }, []);

    return skin;
};
