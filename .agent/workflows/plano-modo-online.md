---
description: Plano completo para implementar modo online entre jogadores no TicTacMasterXO
---

# 🎮 Plano de Implementação: Modo Online Multijogador

## 📋 Visão Geral do Aplicativo Atual

**TicTacMasterXO** é um jogo da velha desenvolvido em:
- **Frontend**: React Native 0.81.4 + Expo ~54.0.6
- **Navegação**: React Navigation 7.x
- **Estado**: Context API (GameContext)
- **Armazenamento**: AsyncStorage (local)
- **Animações**: React Native Reanimated 4.x
- **Som**: expo-av
- **Haptics**: expo-haptics

### Modos de Jogo Existentes:
1. **Classic** - Jogo da velha tradicional 3x3
2. **Infinity** - Modo com limite de 6 peças (peças antigas são removidas)
3. **Gravity** - Peças caem como Connect Four
4. **Blind** - Jogadas anteriores ficam invisíveis
5. **BigBoard** - Tabuleiro 4x4 ou 5x5
6. **Survival** - Modo com vidas limitadas

### Oponentes Atuais:
- **AI** - Com 5 níveis de dificuldade (noob, mediano, expert, challenger, troll)
- **Human** - 2 jogadores locais (mesmo dispositivo)

---

## 🎯 Objetivo Principal

Adicionar um novo tipo de oponente: **"Online"** que permitirá jogadores se conectarem via internet para jogar em tempo real.

---

## 🏗️ Arquitetura Proposta

### Opções de Backend/Comunicação:

#### **Opção 1: Firebase Realtime Database** ⭐ RECOMENDADO
**Vantagens:**
- ✅ Fácil configuração e integração com React Native
- ✅ Real-time sincronização automática
- ✅ Gratuito até 100 conexões simultâneas
- ✅ Não requer servidor próprio
- ✅ Autenticação integrada (Firebase Auth)
- ✅ Excelente documentação

**Desvantagens:**
- ⚠️ Dependência de serviço terceiro
- ⚠️ Limitações no plano gratuito

#### **Opção 2: Socket.IO + Node.js Backend**
**Vantagens:**
- ✅ Total controle do backend
- ✅ WebSocket para comunicação bidirecional
- ✅ Muito usado para jogos multiplayer

**Desvantagens:**
- ⚠️ Requer servidor próprio (hospedagem)
- ⚠️ Mais complexo de configurar
- ⚠️ Custos de hospedagem

#### **Opção 3: Supabase** 
**Vantagens:**
- ✅ Database PostgreSQL com real-time
- ✅ Autenticação integrada
- ✅ Plano gratuito generoso
- ✅ Alternativa open-source ao Firebase

**Desvantagens:**
- ⚠️ Menos documentação para React Native
- ⚠️ Curva de aprendizado

---

## 📦 Escolha: Firebase Realtime Database

Vamos usar **Firebase** por ser a opção mais rápida, gratuita e confiável para começar.

---

## 🔧 Implementação Detalhada

### **Fase 1: Configuração Inicial** (1-2 horas)

#### 1.1. Instalar Dependências
```bash
npm install firebase
npm install @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/database
# OU usar apenas o firebase web SDK (mais simples para Expo)
npm install firebase
```

#### 1.2. Configurar Firebase
- Criar projeto no Firebase Console
- Adicionar app Web ao projeto
- Obter credenciais de configuração
- Criar arquivo `src/config/firebase.ts`

#### 1.3. Estrutura de Dados no Firebase
```
games/
  {gameId}/
    - id: string
    - mode: GameMode
    - status: 'waiting' | 'playing' | 'finished'
    - createdAt: timestamp
    - players:
        host:
          - id: string
          - name: string
          - symbol: 'X' | 'O'
          - ready: boolean
        guest:
          - id: string
          - name: string
          - symbol: 'X' | 'O'
          - ready: boolean
    - gameState:
        - board: Cell[][]
        - currentPlayer: 'X' | 'O'
        - winner: Player | null
        - isDraw: boolean
        - moves: GameMove[]
        - moveCount: number
    - config:
        - mode: GameMode
        - soundEnabled: boolean
        - hapticsEnabled: boolean

lobbies/
  - list of available games waiting for players
```

---

### **Fase 2: Criar Serviços Firebase** (2-3 horas)

#### 2.1. Criar `src/services/firebaseService.ts`
Funções principais:
- `initializeFirebase()` - Inicializar conexão
- `createGame(mode, hostName)` - Criar nova partida
- `joinGame(gameId, guestName)` - Entrar em partida
- `makeMove(gameId, row, col)` - Fazer jogada
- `listenToGame(gameId, callback)` - Escutar mudanças em tempo real
- `leaveGame(gameId)` - Sair da partida
- `deleteGame(gameId)` - Deletar partida

#### 2.2. Criar `src/services/matchmakingService.ts`
Funções:
- `createLobby(gameId)` - Adicionar jogo ao lobby
- `removeLobby(gameId)` - Remover do lobby
- `getAvailableLobbies()` - Listar jogos disponíveis
- `listenToLobbies(callback)` - Escutar mudanças nos lobbies

---

### **Fase 3: Criar Context para Modo Online** (2-3 horas)

#### 3.1. Criar `src/contexts/OnlineGameContext.tsx`
- Estado do jogo online
- Gerenciar conexão com Firebase
- Sincronizar estado local com Firebase
- Lidar com desconexões
- Notificações de eventos (jogador entrou, saiu, etc.)

---

### **Fase 4: Criar Telas de Modo Online** (3-4 horas)

#### 4.1. `src/screens/OnlineLobbyScreen.tsx`
Interface para:
- ✨ Criar nova partida (escolher modo de jogo)
- 🔍 Procurar partidas disponíveis
- 📋 Listar lobbies ativos
- 🎮 Entrar em partida
- 👤 Definir nome do jogador
- 📊 Status da conexão

#### 4.2. `src/screens/OnlineWaitingRoomScreen.tsx`
- Exibir código da sala (gameId)
- Mostrar jogadores conectados
- Botão "Pronto" para ambos os jogadores
- Iniciar partida quando ambos estiverem prontos
- Opção de cancelar/sair

#### 4.3. Modificar `src/screens/OpponentScreen.tsx`
Adicionar terceira opção:
```typescript
{
  id: 'online',
  title: 'Online',
  subtitle: 'Jogue contra jogadores do mundo todo',
  description: 'Conecte-se via internet e desafie outros jogadores',
  icon: 'globe-outline',
  color: COLORS.success,
  emoji: '🌍',
}
```

---

### **Fase 5: Adaptar GameScreen para Modo Online** (2-3 horas)

#### 5.1. Modificar `src/screens/GameScreen.tsx`
- Detectar quando `opponent === 'online'`
- Usar `OnlineGameContext` ao invés de `GameContext` local
- Sincronizar jogadas com Firebase
- Exibir indicador de "Aguardando oponente..."
- Lidar com desconexão do oponente
- Adicionar chat básico (opcional)
- Adicionar botão "Desistir"

#### 5.2. Modificar `src/contexts/GameContext.tsx`
- Adicionar suporte para modo online
- Função `makeOnlineMove()` que sincroniza com Firebase
- Observer pattern para escutar mudanças online

---

### **Fase 6: Autenticação de Usuário** (1-2 horas)

#### 6.1. Criar `src/screens/ProfileScreen.tsx`
- Login anônimo (Firebase Anonymous Auth)
- Definir nome de usuário
- Histórico de partidas online
- Estatísticas online

#### 6.2. Criar `src/services/authService.ts`
- Autenticação anônima
- Salvar/recuperar perfil do usuário
- Gerenciar sessão

---

### **Fase 7: Melhorias e Features Extras** (2-3 horas)

#### 7.1. Sistema de Notificações
- Notificar quando é sua vez de jogar
- Notificar quando oponente desconectar
- Som especial para jogadas online

#### 7.2. Tratamento de Erros
- Reconexão automática
- Timeout de partidas inativas
- Mensagens de erro amigáveis

#### 7.3. Sistema de Chat (Opcional)
- Chat de texto simples
- Emojis rápidos (👍, 🎉, 😭)

#### 7.4. Ranking/Leaderboard (Opcional)
- Armazenar vitórias/derrotas online
- Placar global
- Sistema de ELO/Ranking

#### 7.5. Modo Privado
- Criar sala privada com código
- Compartilhar código via WhatsApp/Telegram
- Apenas quem tem o código pode entrar

---

## 📁 Estrutura de Arquivos a Criar

```
src/
├── config/
│   └── firebase.ts                 # Configuração do Firebase
├── services/
│   ├── firebaseService.ts         # Serviço principal Firebase
│   ├── matchmakingService.ts      # Sistema de matchmaking
│   └── authService.ts             # Autenticação
├── contexts/
│   └── OnlineGameContext.tsx      # Context para jogos online
├── screens/
│   ├── OnlineLobbyScreen.tsx      # Lobby de jogos online
│   ├── OnlineWaitingRoomScreen.tsx # Sala de espera
│   └── ProfileScreen.tsx          # Perfil do jogador
├── components/
│   ├── OnlinePlayerCard.tsx       # Card de jogador online
│   ├── LobbyListItem.tsx          # Item de lista de lobbies
│   ├── ConnectionStatus.tsx       # Indicador de conexão
│   └── OnlineChatBox.tsx          # Chat box (opcional)
└── types/
    └── online.ts                   # Tipos TypeScript para online
```

---

## 🔄 Fluxo de Jogo Online

### Criando uma Partida:
1. Usuário clica em "Online" na seleção de oponente
2. Escolhe modo de jogo (Classic, Infinity, etc.)
3. Vai para OnlineLobbyScreen
4. Clica em "Criar Partida"
5. Sistema cria entrada no Firebase
6. Vai para OnlineWaitingRoomScreen
7. Aguarda outro jogador entrar
8. Ambos clicam em "Pronto"
9. Jogo inicia em GameScreen

### Entrando em uma Partida:
1. Usuário clica em "Online"
2. Vai para OnlineLobbyScreen
3. Vê lista de partidas disponíveis
4. Clica em uma partida
5. Entra na OnlineWaitingRoomScreen
6. Clica em "Pronto"
7. Aguarda host ficar pronto
8. Jogo inicia em GameScreen

### Durante a Partida:
1. Jogador X faz uma jogada
2. App envia jogada para Firebase
3. Firebase sincroniza com app do Jogador O
4. Jogador O vê a jogada aparecer
5. Agora é a vez do Jogador O
6. Repete até fim do jogo

---

## ⚙️ Configurações Necessárias

### Firebase Console:
1. ✅ Criar projeto
2. ✅ Ativar Realtime Database
3. ✅ Ativar Authentication (Anonymous)
4. ✅ Configurar regras de segurança:

```json
{
  "rules": {
    "games": {
      "$gameId": {
        ".read": true,
        ".write": "auth != null"
      }
    },
    "lobbies": {
      ".read": true,
      ".write": "auth != null"
    },
    "users": {
      "$userId": {
        ".read": "auth != null && auth.uid == $userId",
        ".write": "auth != null && auth.uid == $userId"
      }
    }
  }
}
```

---

## 🧪 Testes Necessários

### Cenários de Teste:
1. ✅ Criar e entrar em partida
2. ✅ Fazer jogadas em tempo real
3. ✅ Desconexão de um jogador
4. ✅ Reconexão de jogador
5. ✅ Partida completa até o fim
6. ✅ Múltiplas partidas simultâneas
7. ✅ Lobby com várias salas
8. ✅ Performance com conexão lenta

---

## 📊 Estimativa de Tempo Total

| Fase | Tarefa | Tempo Estimado |
|------|--------|----------------|
| 1 | Configuração Firebase | 1-2h |
| 2 | Criar serviços | 2-3h |
| 3 | Context Online | 2-3h |
| 4 | Telas de Lobby | 3-4h |
| 5 | Adaptar GameScreen | 2-3h |
| 6 | Autenticação | 1-2h |
| 7 | Melhorias | 2-3h |
| 8 | Testes e Ajustes | 2-3h |
| **TOTAL** | | **15-23 horas** |

---

## 🎨 Melhorias de UX/UI

### Elementos Visuais:
- 🌍 Ícone de globo para modo online
- 🟢 Indicador verde = online/conectado
- 🔴 Indicador vermelho = offline/desconectado
- ⏳ Animação de "aguardando oponente"
- 💬 Notificações toast para eventos
- 🎊 Efeitos especiais quando oponente faz jogada

### Feedback para Usuário:
- Sons diferentes para jogadas online
- Haptic feedback ao receber jogada
- Contador de tempo (opcional)
- Histórico de chat

---

## 🚀 Próximos Passos (Pós-MVP)

### Versão 2.0:
- 🏆 Sistema de ranking global
- 👥 Sistema de amigos
- 🎁 Sistema de recompensas
- 📈 Estatísticas avançadas
- 🎮 Torneios online
- 💰 In-app purchases (temas, emojis)
- 🌐 Tradução de chat
- 🎭 Avatares personalizados
- 📱 Push notifications
- 🔄 Sistema de replay de partidas

---

## ⚠️ Considerações Importantes

### Segurança:
- ✅ Validar todas as jogadas no cliente
- ✅ Implementar anti-cheat básico
- ✅ Rate limiting de jogadas
- ✅ Timeout para jogadas (ex: 30s por turno)

### Performance:
- ✅ Limpar conexões antigas
- ✅ Deletar partidas finalizadas após X tempo
- ✅ Limitar número de lobbies simultâneos
- ✅ Otimizar queries do Firebase

### Experiência do Usuário:
- ✅ Mensagens claras de erro
- ✅ Loading states apropriados
- ✅ Confirmação antes de sair de partida
- ✅ Opção de reportar jogadores (futuro)

---

## 📝 Checklist de Implementação

### Setup Inicial
- [ ] Criar projeto Firebase
- [ ] Instalar dependências npm
- [ ] Configurar firebase.ts
- [ ] Testar conexão básica

### Backend/Services
- [ ] firebaseService.ts completo
- [ ] matchmakingService.ts completo
- [ ] authService.ts completo
- [ ] Tipos TypeScript (online.ts)

### Contexts
- [ ] OnlineGameContext.tsx
- [ ] Integrar com GameContext existente

### Telas
- [ ] OnlineLobbyScreen.tsx
- [ ] OnlineWaitingRoomScreen.tsx
- [ ] Modificar OpponentScreen.tsx
- [ ] Modificar GameScreen.tsx
- [ ] ProfileScreen.tsx (opcional)

### Componentes
- [ ] OnlinePlayerCard.tsx
- [ ] LobbyListItem.tsx
- [ ] ConnectionStatus.tsx
- [ ] OnlineChatBox.tsx (opcional)

### Navegação
- [ ] Adicionar rotas para novas telas
- [ ] Atualizar RootStackParamList

### Testes
- [ ] Teste de criação de sala
- [ ] Teste de entrada em sala
- [ ] Teste de sincronização de jogadas
- [ ] Teste de desconexão
- [ ] Teste de reconexão
- [ ] Teste de múltiplas partidas

### Polimento
- [ ] Animações e transições
- [ ] Sons e haptics para eventos online
- [ ] Mensagens de erro user-friendly
- [ ] Loading states
- [ ] Documentação do código

---

## 🎓 Recursos e Documentação

### Firebase:
- [Firebase Realtime Database Docs](https://firebase.google.com/docs/database)
- [React Native Firebase](https://rnfirebase.io/)
- [Firebase Auth Docs](https://firebase.google.com/docs/auth)

### React Native:
- [React Navigation](https://reactnavigation.org/)
- [Expo Documentation](https://docs.expo.dev/)

### Tutoriais Relevantes:
- Building Multiplayer Games with Firebase
- Real-time Chat with React Native
- WebSocket vs Firebase Realtime Database

---

## 💡 Dicas de Implementação

1. **Comece Simples**: Implemente primeiro o modo básico (Classic) online
2. **Teste Localmente**: Use dois emuladores/dispositivos para testar
3. **Logs Abundantes**: Console.log para debug de sincronização
4. **Versionamento**: Commit frequente no Git
5. **Feedback Visual**: Sempre mostre ao usuário o que está acontecendo
6. **Offline First**: Pense em como o app se comporta sem internet

---

## 🎯 Objetivo Final

Ao final desta implementação, o usuário poderá:
- ✅ Criar uma partida online
- ✅ Convidar amigos com código de sala
- ✅ Jogar em tempo real com oponentes
- ✅ Ver lista de partidas disponíveis
- ✅ Jogar qualquer modo de jogo online
- ✅ Ter estatísticas de partidas online
- ✅ Experiência fluida e responsiva

---

**Última atualização:** 2025-12-27
**Próxima revisão:** Após implementação do MVP
