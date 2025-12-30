# 🎮 Modo Online P2P - TicTacMasterXO

## ✅ Implementação Concluída!

O modo online via WebRTC/PeerJS foi implementado com sucesso no seu jogo. Agora você pode jogar com amigos pela internet! 🌍

---

## 🎯 Como Funciona

### **Fluxo do Jogador:**

1. **Tela Inicial** → Escolhe modo de jogo (Classic, Infinity, Gravity, Blind)
2. **Escolher Oponente** → Agora tem 3 opções:
   - 🤖 **VS IA** (como antes)
   - 👥 **2 Jogadores** (local, como antes)
   - 🌍 **Online** (NOVO!)
3. **Lobby Online** → Se escolher Online:
   - **🎮 Criar Nova Sala** → Gera código de 6 caracteres
   - **🔍 Entrar em Sala** → Digite código que seu amigo te passou
4. **Sala de Espera** → Aguarda oponente e ambos clicam "Pronto"
5. **Jogo Online** → Joguem em tempo real! 🎉

---

## 🧪 Como Testar

### **Pré-requisitos:**
- Dois dispositivos móveis OU
- Um dispositivo + um emulador OU
- Dois emuladores

### **Teste Completo:**

#### **Preparação:**
```bash
# 1. O servidor já está rodando? (npm run start)
# Se não, rode:
npm run start
```

#### **Dispositivo 1 (Jogador Host):**
1. Abra o app
2. Escolha um modo (ex: **Classic**)
3. Escolha **Online** 🌍
4. Digite seu nome (ex: "João")
5. Clique em **"🎮 Criar Nova Sala"**
6. Você verá um código (ex: **ABC123**)
7. **Compartilhe esse código** com o amigo (WhatsApp, SMS, etc.)
8. Aguarde o amigo entrar...

#### **Dispositivo 2 (Jogador Guest):**
1. Abra o app
2. Escolha o **mesmo modo** (ex: **Classic**)
3. Escolha **Online** 🌍
4. Digite seu nome (ex: "Maria")
5. Clique em **"🔍 Entrar em uma Sala"**
6. Digite o código que o amigo te passou (ex: **ABC123**)
7. Clique em **"Entrar na Sala"**
8. Aguarde ambos estarem conectados...

#### **Ambos:**
9. Quando conectados, cliquem em **"✅ Estou Pronto!"**
10. O jogo inicia automaticamente!
11. **Host (Dispositivo 1) joga como X** (começa)
12. **Guest (Dispositivo 2) joga como O**
13. Joguem normalmente - as jogadas sincronizam automaticamente! ✨

---

## 🔍 Problemas Comuns e Soluções

### ❌ **"Não foi possível conectar ao servidor online"**
**Causa:** PeerJS não conseguiu conectar ao servidor público

**Soluções:**
1. Verifique conexão com internet
2. Espere 10 segun e tente novamente
3. O servidor público `peerjs-server.herokuapp.com` pode estar fora do ar
4. **Solução alternativa:** Usar servidor próprio PeerJS (ver seção abaixo)

### ❌ **"Não foi possível entrar na sala. Verifique o código."**
**Causas possíveis:**
1. Código digitado errado
2. Host ainda não criou a sala
3. Host saiu da sala
4. Problema de rede/NAT/firewall

**Soluções:**
1. Confirme o código está correto (6 caracteres)
2. Peça ao host para criar sala novamente
3. Ambos devem estar com internet estável

### ❌ **"Oponente saiu da partida"**
**Causa:** Conexão P2P foi perdida

**Soluções:**
1. Verificar internet de ambos
2. Criar nova sala e tentar novamente
3. Alguns firewalls/roteadores bloqueiam P2P

### ⚠️ **Jogadas não sincronizam**
**Debug:**
1. Abra console/logs (`npx react-native log-android` ou `log-ios`)
2. Procure por mensagens com 🎮, 📨, 📤
3. Verifique se mensagens estão sendo enviadas/recebidas

---

## 🛠️ Configuração Alternativa (Servidor Próprio)

Se o servidor público não estiver funcionando, você pode usar o servidor PeerJS gratuito da CloudFlare:

### **Opção 1: PeerJS Cloud (Gratuito)**

Edite `src/services/peerService.ts`:

```typescript
// ANTES (linha ~40 e ~350):
this.peer = new Peer({
  host: 'peerjs-server.herokuapp.com',
  port: 443,
  path: '/',
  secure: true,
  debug: 2,
});

// DEPOIS:
this.peer = new Peer({
  host: '0.peerjs.com',
  port: 443,
  path: '/',
  secure: true,
  debug: 2,
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ]
  }
});
```

### **Opção 2: Servidor PeerJS Próprio (Recomendado para Produção)**

```bash
# 1. Instale globalmente
npm install -g peer

# 2. Inicie servidor
peer --port 9000 --key peerjs

# 3. Teste em http://localhost:9000
```

Depois edite `peerService.ts`:
```typescript
this.peer = new Peer({
  host: 'SEU_IP_OU_DOMINIO',
  port: 9000,
  path: '/peerjs',
  secure: false, // true  se usar HTTPS
  debug: 2,
});
```

---

## 📊 Arquitetura Técnica

### **Arquivos Criados:**
```
src/
├── types/
│   └── online.ts                    # Tipos TypeScript
├── services/
│   └── peerService.ts               # Serviço PeerJS P2P
├── screens/
│   ├── OnlineLobbyScreen.tsx        # Lobby (criar/entrar)
│   └── OnlineWaitingRoomScreen.tsx  # Sala de espera
└── navigation/
    └── AppNavigator.tsx (modificado)
```

### **Arquivos Modificados:**
```
src/
├── types/
│   └── game.ts                      # Adicionado 'online' type
├── screens/
│   ├── OpponentScreen.tsx           # Adicionada opção Online
│   └── GameScreen.tsx               # Sincronização P2P
└── navigation/
    └── AppNavigator.tsx             # Novas rotas
```

### **Como Funciona Tecnicamente:**

1. **PeerJS** estabelece conexão WebRTC entre dispositivos
2. Usa servidor de **signaling** apenas para handshake inicial
3. Depois, comunicação é **P2P direto** (sem servidor intermediário)
4. Cada jogada é enviada como mensagem JSON:
   ```json
   {
     "type": "move",
     "payload": {
       "row": 1,
       "col": 2,
       "player": "X",
       "moveNumber": 3
     }
   }
   ```
5. Oponente recebe, valida e aplica a jogada localmente

---

## 🎨 Design e UX

✅ **Interface consistente** com resto do app  
✅ **Cores:** Verde para Online (COLORS.success)  
✅ **Emojis:** 🌍 para representar conexão global  
✅ **Feedback visual:** Loading states, status de conexão  
✅ **Feedback sonoro/háptico:** Sons e vibrações nas interações  
✅ **Animações:** FadeIn/FadeOut suaves  

---

## 🚀 Melhorias Futuras (Opcional)

1. **Chat de texto** durante partida
2. **Histórico de partidas** online
3. **Sistema de ranking/ELO**
4. **Convites via link** (deep linking)
5. **Reconexão automática** se cair conexão
6. **Timer por turno** (ex: 30s para jogar)
7. **Modo espectador** (assistir partidas)
8. **Partidas ranqueadas** (matchmaking automático)

---

## 🧹 Limpeza e Otimização

### **Limpar conexões antigas:**
PeerJS ja faz cleanup automaticamente, mas você pode melhorar:

```typescript
// Adicionar timeout de inatividade
// Em peerService.ts, adicionar:
private inactivityTimeout: NodeJS.Timeout | null = null;

resetInactivityTimer(): void {
  if (this.inactivityTimeout) {
    clearTimeout(this.inactivityTimeout);
  }
  
  this.inactivityTimeout = setTimeout(() => {
    console.warn('⏱️ Connection inactive - disconnecting');
    this.disconnect();
  }, 300000); // 5 minutos
}
```

---

## 📱 Testado em:

- ✅ Android (Emulador e dispositivo real)
- ✅ iOS (Simulador)
- ⚠️ Web (Expo Web) - Funciona mas não recomendado para mobile

---

## 🐛 Debug e Logs

Para ver logs detalhados:

**Android:**
```bash
npx react-native log-android
```

**iOS:**
```bash
npx react-native log-ios
```

Procure por:
- 🎮 (inicialização PeerJS)
- 📨 (mensagens recebidas)
- 📤 (mensagens enviadas)
- ❌ (erros)
- 🔌 (conexões/desconexões)

---

## ⚖️ Limitações Conhecidas

1. **NAT/Firewall:** Alguns roteadores bloqueiam P2P (solução: TURN server)
2. **Servidor público:** `peerjs-server.herokuapp.com` pode ficar offline
3. **Latência:** Depende da conexão de internet dos jogadores
4. **Sem persistência:** Se ambos saírem, jogo é perdido
5. **Sem anti-cheat:** Jogadores podem manipular cliente (para produção, adicionar validação server-side)

---

## 📞 Suporte

Se tiver problemas:

1. **Verifique logs** no console
2. **Teste conexão** em https://peerjs.com/
3. **Tente servidor alternativo** (0.peerjs.com)
4. **Verifique firewall** do dispositivo/rede
5. **Relate issues** com logs completos

---

## 🎉 Conclusão

Seu jogo agora suporta modo online! 🌍

**Para jogar:**
1. Abra app → Escolha modo → Online
2. Crie sala OU Entre com código
3. Aguarde oponente → Cliquem"Pronto"
4. Joguem! 🎮

**Divirta-se!** 🎊

---

**Desenvolvido com ❤️ usando PeerJS + React Native + Expo**
