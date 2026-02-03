/**
 * EXEMPLO DE INTEGRAÇÃO - RECOMPENSAS DE VITÓRIA
 * 
 * Este arquivo mostra como integrar o sistema de recompensas
 * no seu GameContext ou GameScreen quando o jogador vencer.
 */

import { storeService } from '../services/storeService';
import { GameMode } from '../types/game';

/**
 * Função para recompensar o jogador após uma vitória
 * Chame esta função quando o jogador vencer uma partida
 */
export const rewardPlayerForWin = async (
    gameMode: GameMode,
    currentStreak: number
): Promise<number> => {
    try {
        // Modos especiais dão mais estrelas
        const specialModes: GameMode[] = ['infinity', 'gravity', 'blind', 'blitz', 'reverse', 'bigBoard', 'survival'];
        const isSpecialMode = specialModes.includes(gameMode);

        // Usar o serviço da loja para dar a recompensa
        const starsEarned = await storeService.rewardWin(isSpecialMode, currentStreak);

        console.log(`🌟 Jogador ganhou ${starsEarned} estrelas!`);

        return starsEarned;
    } catch (error) {
        console.error('Erro ao recompensar jogador:', error);
        return 0;
    }
};

/**
 * EXEMPLO 1: Integrar no GameContext
 * 
 * Adicione esta lógica no seu GameContext onde você atualiza as estatísticas de vitória
 */
const exampleGameContextIntegration = `
// No seu GameContext.tsx

import { storeService } from '../services/storeService';

const updateStats = async (winner: Player) => {
  // ... seu código existente de atualizar stats ...
  
  // ADICIONE ISTO:
  if (winner === 'X') { // Ou verifique se é o jogador humano que ganhou
    const specialModes = ['infinity', 'gravity', 'blind', 'blitz', 'reverse'];
    const isSpecialMode = specialModes.includes(gameConfig.mode);
    
    // Recompensar com estrelas
    const starsEarned = await storeService.rewardWin(
      isSpecialMode, 
      gameStats.currentStreak
    );
    
    // Opcional: Mostrar notificação de estrelas ganhas
    console.log(\`⭐ Você ganhou \${starsEarned} estrelas!\`);
  }
};
`;

/**
 * EXEMPLO 2: Integrar no GameScreen
 * 
 * Ou adicione quando o modal de vitória aparecer
 */
const exampleGameScreenIntegration = `
// No seu GameScreen.tsx

import { storeService } from '../services/storeService';

useEffect(() => {
  if (winner && winner === 'X') { // Jogador humano ganhou
    const specialModes = ['infinity', 'gravity', 'blind', 'blitz', 'reverse'];
    const isSpecialMode = specialModes.includes(mode);
    
    // Recompensar
    storeService.rewardWin(isSpecialMode, currentStreak).then(stars => {
      console.log(\`Ganhou \${stars} estrelas!\`);
    });
  }
}, [winner]);
`;

/**
 * EXEMPLO 3: Mostrar estrelas ganhas no Modal de Vitória
 * 
 * Você pode adicionar um componente visual para mostrar a recompensa
 */
const exampleWinModalWithReward = `
// Em algum componente de Modal de Vitória

const [starsEarned, setStarsEarned] = useState(0);

useEffect(() => {
  if (winner) {
    const specialModes = ['infinity', 'gravity', 'blind', 'blitz', 'reverse'];
    const isSpecialMode = specialModes.includes(mode);
    
    storeService.rewardWin(isSpecialMode, currentStreak).then(stars => {
      setStarsEarned(stars);
    });
  }
}, [winner]);

return (
  <Modal visible={winner !== null}>
    <Text>Você ganhou!</Text>
    
    {starsEarned > 0 && (
      <View style={styles.rewardContainer}>
        <Text style={styles.rewardIcon}>⭐</Text>
        <Text style={styles.rewardText}>+{starsEarned} Estrelas</Text>
      </View>
    )}
    
    <Button onPress={playAgain}>Jogar Novamente</Button>
  </Modal>
);
`;

/**
 * EXEMPLO 4: Daily Reward no App Launch
 * 
 * Mostrar modal de daily reward quando o app abrir
 */
export const checkDailyReward = async (): Promise<{
    canClaim: boolean;
    amount?: number;
    consecutiveDays?: number;
}> => {
    try {
        const canClaim = await storeService.canClaimDailyReward();

        if (canClaim) {
            const result = await storeService.claimDailyReward();

            if (result.success) {
                return {
                    canClaim: true,
                    amount: result.amount,
                    consecutiveDays: result.consecutiveDays,
                };
            }
        }

        return { canClaim: false };
    } catch (error) {
        console.error('Erro ao verificar daily reward:', error);
        return { canClaim: false };
    }
};

/**
 * EXEMPLO 5: Daily Reward Modal Component
 */
const exampleDailyRewardModal = `
// DailyRewardModal.tsx

import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import { storeService } from '../services/storeService';

const DailyRewardModal: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [reward, setReward] = useState({ amount: 0, consecutiveDays: 0 });

  useEffect(() => {
    checkAndShowDailyReward();
  }, []);

  const checkAndShowDailyReward = async () => {
    const canClaim = await storeService.canClaimDailyReward();
    
    if (canClaim) {
      const result = await storeService.claimDailyReward();
      
      if (result.success) {
        setReward({
          amount: result.amount,
          consecutiveDays: result.consecutiveDays,
        });
        setVisible(true);
      }
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>🎁 Recompensa Diária!</Text>
          
          <View style={styles.rewardBox}>
            <Text style={styles.icon}>⭐</Text>
            <Text style={styles.amount}>{reward.amount}</Text>
            <Text style={styles.label}>Estrelas</Text>
          </View>
          
          <Text style={styles.streak}>
            Dia {reward.consecutiveDays} consecutivo! 🔥
          </Text>
          
          <TouchableOpacity 
            style={styles.button}
            onPress={() => setVisible(false)}
          >
            <Text style={styles.buttonText}>Coletar!</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default DailyRewardModal;
`;

/**
 * EXEMPLO 6: Integrar na HomeScreen
 * 
 * Mostrar daily reward quando usuário abrir o app
 */
const exampleHomeScreenIntegration = `
// No seu HomeScreen.tsx

import { storeService } from '../services/storeService';

useEffect(() => {
  checkDailyReward();
}, []);

const checkDailyReward = async () => {
  const canClaim = await storeService.canClaimDailyReward();
  
  if (canClaim) {
    const result = await storeService.claimDailyReward();
    
    if (result.success) {
      Alert.alert(
        '🎁 Recompensa Diária!',
        \`Você ganhou \${result.amount} ⭐ estrelas!\\n\\nDia \${result.consecutiveDays} consecutivo 🔥\`,
        [{ text: 'Legal!', onPress: () => {} }]
      );
    }
  }
};
`;

// Export exemplos como string para documentação
export const INTEGRATION_EXAMPLES = {
    gameContext: exampleGameContextIntegration,
    gameScreen: exampleGameScreenIntegration,
    winModal: exampleWinModalWithReward,
    dailyModal: exampleDailyRewardModal,
    homeScreen: exampleHomeScreenIntegration,
};

/**
 * UTILIDADES EXTRAS
 */

// Verificar saldo atual
export const getCurrentWallet = async () => {
    return await storeService.getWallet();
};

// Ver histórico de transações
export const getRecentTransactions = async (limit = 10) => {
    return await storeService.getTransactionHistory(limit);
};

// Dar moedas manualmente (para testes ou eventos especiais)
export const giveBonus = async (stars: number, reason: string) => {
    await storeService.addCurrency('stars', stars, reason);
};

// Exemplo de uso:
// await giveBonus(500, 'Evento especial de Natal');
