import { useState, useEffect } from 'react';
import { storeService } from '../services/storeService';
import { getItemById } from '../data/storeItems';
import { SymbolStoreItem, EffectStoreItem } from '../types/store';

export const useEquippedSymbols = () => {
    const [symbols, setSymbols] = useState<{ playerX: string; playerO: string }>({
        playerX: 'X',
        playerO: 'O',
    });

    useEffect(() => {
        const loadEquippedSymbols = async () => {
            try {
                const inventory = await storeService.getInventory();
                const equippedSymbolId = inventory.equippedSymbols;

                if (equippedSymbolId) {
                    const item = getItemById(equippedSymbolId);
                    if (item && item.type === 'symbol') {
                        const symbolItem = item as SymbolStoreItem;
                        setSymbols({
                            playerX: symbolItem.content.playerX,
                            playerO: symbolItem.content.playerO,
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

        return unsubscribe;
    }, []);

    return symbols;
};

export const useEquippedEffect = () => {
    const [effect, setEffect] = useState<EffectStoreItem['content'] | null>(null);

    useEffect(() => {
        const loadEquippedEffect = async () => {
            try {
                const inventory = await storeService.getInventory();
                const equippedEffectId = inventory.equippedEffect;

                console.log('🎆 [useEquippedEffect] equippedEffectId:', equippedEffectId);

                if (equippedEffectId) {
                    const item = getItemById(equippedEffectId);
                    console.log('🎆 [useEquippedEffect] Found item:', item?.name, 'Type:', item?.type);

                    if (item && item.type === 'effect') {
                        const effectItem = item as EffectStoreItem;
                        console.log('🎆 [useEquippedEffect] Setting effect:', effectItem.content);
                        setEffect(effectItem.content);
                    }
                }
            } catch (error) {
                console.error('Error loading equipped effect:', error);
            }
        };

        loadEquippedEffect();

        // Subscribe to inventory changes
        const unsubscribe = storeService.subscribe(() => {
            console.log('🎆 [useEquippedEffect] Inventory changed! Reloading...');
            loadEquippedEffect();
        });

        return unsubscribe;
    }, []);

    return effect;
};
