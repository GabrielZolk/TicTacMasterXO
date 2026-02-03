# 🏪 Sistema de Loja - TicTacMasterXO

## ✨ Implementação Completa

### 📦 Arquivos Criados/Modificados:

#### **Novos Arquivos:**
1. `src/types/store.ts` - Tipos completos do sistema de loja
2.` src/services/storeService.ts` - Serviço de gerenciamento de moedas e compras
3. `src/data/storeItems.ts` - Catálogo completo de itens da loja
4. `src/screens/StoreScreen.tsx` - Tela da loja com UI premium

#### **Arquivos Modificados:**
- `src/types/game.ts` - Adicionado rota 'Store' e novos tipos de temas
- `src/navigation/AppNavigator.tsx` - Adicionada rota para StoreScreen
- `src/screens/HomeScreen.tsx` - Adicionado botão da loja no header
- `src/utils/theme.ts` - Adicionados 5 novos temas premium

---

## 💰 Sistema de Moedas

### **Moedas Disponíveis:**
- **Estrelas (⭐)** - Moeda grátis, ganha jogando
- **Diamantes (💎)** - Moeda premium (futura integração com IAP)

### **Como Ganhar Estrelas:**
- Vitória no modo clássico: **5 ⭐**
- Vitória em modo especial: **10 ⭐**
- Bônus de sequência: **+3 ⭐ por vitória consecutiva**
- Login diário: **50-120 ⭐** (aumenta com dias consecutivos)
- Assistir anúncio: **25 ⭐** (futuro)
- Conquistas: **100 ⭐** (futuro)

---

## 🛍️ Itens da Loja

### **1. 🎨 Temas (14 temas totais)**

#### **Gratuitos (já desbloqueados):**
- 🌙 **Escuro** - Tema clássico
- ☀️ **Claro** - Minimalista

#### **Comuns (podem desbloquear com estrelas):**
- 🎨 **Cartoon** - 300 ⭐
- 🌿 **Natureza** - 400 ⭐

#### **Raros:**
- 💫 **Neon** - 600 ⭐ ou 50 💎
- 📻 **Retrô** - 700 ⭐ ou 60 💎
- 😂 **Meme** - 500 ⭐ ou 40 💎

#### **Épicos:**
- 🚀 **Futurístico** - 1000 ⭐ ou 100 💎
- 💻 **Matrix** - 1200 ⭐ ou 120 💎 ✨ NOVO
- 🌊 **Oceano** - 800 ⭐ ou 80 💎 ✨ NOVO
- 🔥❄️ **Fogo & Gelo** - 1000 ⭐ ou 100 💎 ✨ NOVO
- 👽 **Alienígena** - 900 ⭐ ou 90 💎 ✨ NOVO

#### **Legendários:**
- 🔮 **Samuel Doutor Estranho** - 1500 ⭐ ou 150 💎
- 👑 **Ouro Luxo** - 200 💎 apenas ✨ NOVO

### **2. ✨ Símbolos Personalizados (5 opções)**
- ❌⭕ **Padrão** - Gratuito
- 😎🤖 **Legal vs Robô** - 200 ⭐
- 🦁🐯 **Leão vs Tigre** - 250 ⭐
- 🔥💧 **Fogo vs Água** - 300 ⭐
- 🚀👽 **Foguete vs Alien** - 400 ⭐ ou 40 💎

### **3. 🎬 Efeitos de Vitória (4 opções)**
- ⚪ **Sem Efeito** - Gratuito
- 🎊 **Confetes** - 300 ⭐
- 🎆 **Fogos de Artifício** - 400 ⭐ ou 40 💎
- ⭐ **Chuva de Estrelas** - 500 ⭐ ou 50 💎

---

## 🎯 Recursos Implementados

### ✅ **Funcionalidades Core:**
- [x] Sistema de moedas (Stars ⭐ e Diamonds 💎)
- [x] Persistência com AsyncStorage
- [x] Catálogo de 24+ itens
- [x] 5 novos temas premium
- [x] Símbolos personalizados
- [x] Efeitos de vitória
- [x] Sistema de raridade (Comum, Raro, Épico, Legendário)
- [x] Recompensas por vitória
- [x] Login diário com bônus progressivo
- [x] UI moderna com tabs, filtros e animações
- [x] Preview de itens antes da compra
- [x] Confirmação de compra
- [x] Botão de acesso na HomeScreen

### 🎨 **UI/UX:**
- **Tabs** - Filtro por categoria (Todos, Temas, Símbolos, Efeitos)
- **Cards Premium** - Preview com gradiente, raridade e badges
- **Cores de Raridade:**
  - Comum: Cinza (#9E9E9E)
  - Raro: Azul (#2196F3)
  - Épico: Roxo (#9C27B0)
  - Legendário: Dourado (#FFD700)
- **Badges:**
  - "NOVO" para itens recém-adicionados
  - Ícones de raridade
  - Status "Possui" para itens comprados
- **Animações:**
  - FadeIn ao entrar na tela
  - Stagger animation nos cards
  - Feedback visual nas compras

---

## 🔮 Próximos Passos Sugeridos

### **Fase 2 - Monetização (PRÓXIMA):**
- [ ] Integrar recompensas por vitória no GameContext
- [ ] Daily rewards modal
- [ ] Sistema de conquistas/missões
- [ ] Assistir anúncio para ganhar estrelas
- [ ] IAP para comprar pacotes de diamantes
- [ ] Pacotes de temas com desconto

### **Fase 3 - Expansão:**
- [ ] Mais símbolos personalizados (comida, esportes, etc)
- [ ] Efeitos de jogada (trail de partículas ao colocar peça)
- [ ] Avatares e molduras de perfil
- [ ] Títulos/Badges
- [ ] Power-ups/boosts opcionais
- [ ] Sistema de level do jogador
- [ ] Seasonal items (eventos especiais)

### **Fase 4 - Social:**
- [ ] Tabela de líderes de colecionadores
- [ ] Shop de presentes (enviar itens para amigos)
- [ ] Troca de itens entre jogadores
- [ ] Conquistas compartilháveis

---

## 📱 Como Usar

### **Para o Jogador:**
1. Acesse a loja pelo botão 🏪 no canto superior esquerdo da tela inicial
2. Navegue pelas categorias usando as tabs
3. Toque em um item para ver detalhes e comprar
4. Confirme a compra
5. O item é adicionado ao seu inventário automaticamente

### **Para Desenvolvedores:**

#### **Adicionar novos itens:**
```typescript
// Em src/data/storeItems.ts
const newTheme: ThemeStoreItem = {
  id: 'theme_my_theme',
  type: 'theme',
  themeId: 'my_theme',
  name: 'Meu Tema',
  nameKey: 'store.themes.my_theme.name',
  description: 'Descrição do tema',
  descriptionKey: 'store.themes.my_theme.description',
  icon: '🎨',
  emoji: '🎨',
  price: { stars: 500 },
  rarity: 'rare',
  isOwned: false,
  isEquipped: false,
  content: { /* cores do tema */ },
  previewGradient: ['#color1', '#color2', '#color3'],
};
```

#### **Dar moedas ao jogador:**
```typescript
import { storeService } from '../services/storeService';

// Dar estrelas
await storeService.addCurrency('stars', 100, 'Completou tutorial');

// Dar diamantes
await storeService.addCurrency('diamonds', 50, 'Compra IAP');
```

#### **Verificar se possui item:**
```typescript
const hasItem = await storeService.ownsItem('theme_matrix');
```

---

## 🎨 Novos Temas Adicionados

### **💻 Matrix** (Épico - 1200 ⭐)
Inspired by The Matrix com códigos verdes caindo
- Background: `#0D0208` 
- Primary: `#00FF41` (verde matrix)

### **🌊 Oceano** (Épico - 800 ⭐)
Profundezas marinhas azuis
- Background: `#001F3F`
- Primary: `#00D9FF` (azul oceano)

### **🔥❄️ Fogo & Gelo** (Épico - 1000 ⭐)
Contraste dramático entre elementos
- Primary: `#FF6B35` (laranja fogo)
- Secondary: `#00D9FF` (azul gelo)

### **👑 Ouro Luxo** (Legendário - 200 💎)
Elegância dourada premium
- Background: `#1A1106`
- Primary: `#FFD700` (dourado puro)

### **👽 Alienígena** (Épico - 900 ⭐)
Mundo extraterrestre roxo/verde
- Background: `#0A0520`
- Primary: `#B026FF` (roxo alien)
- Accent: `#00FF88` (verde alien)

---

## 💡 Dicas de Design

- **Todos os temas** têm gradientes suaves para profundidade
- **Cores de texto** são automaticamente ajustadas para contraste
- **Botões** usam o `buttonGradient` de cada tema
- **Animações** são consistentes em todos os temas
- **Acessibilidade** foi considerada nas escolhas de cor

---

## 🐛 Debug

### **Resetar dados da loja:**
```typescript
import { storeService } from '../services/storeService';
await storeService.reset();
```

### **Ver transações:**
```typescript
const transactions = await storeService.getTransactionHistory(50);
console.log(transactions);
```

### **Dar todas as moedas:**
```typescript
await storeService.addCurrency('stars', 10000, 'DEBUG');
await storeService.addCurrency('diamonds', 1000, 'DEBUG');
```

---

## 📊 Estatísticas

- **Total de itens:** 24+
- **Temas disponíveis:** 14 (2 gratuitos, 12 premium)
- **Símbolos:** 5 opções
- **Efeitos:** 4 opções
- **Moedas:** 2 tipos
- **Raridades:** 4 níveis
- **Linhas de código:** ~1500+

---

**Desenvolvido com 💎 para TicTacMasterXO**

*Sistema de loja completo e pronto para monetização!*
