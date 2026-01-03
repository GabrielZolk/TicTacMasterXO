# 📱 Guia Completo de Monetização - TicTacMasterXO

Este guia explica passo a passo como configurar:
1. ✅ Google AdMob (anúncios)
2. ✅ Google Play Console (publicação do app)
3. ✅ Assinaturas In-App Purchases (remover anúncios)

---

## 📋 ÍNDICE

1. [Pré-requisitos](#pré-requisitos)
2. [PARTE 1: Google Play Console](#parte-1-google-play-console)
3. [PARTE 2: Google AdMob](#parte-2-google-admob)
4. [PARTE 3: Criar Produtos de Assinatura](#parte-3-criar-produtos-de-assinatura)
5. [PARTE 4: Configurar o Código](#parte-4-configurar-o-código)
6. [PARTE 5: Build e Teste](#parte-5-build-e-teste)
7. [PARTE 6: Publicação](#parte-6-publicação)

---

## 📌 PRÉ-REQUISITOS

Antes de começar, você precisa ter:

- [ ] Conta Google
- [ ] Cartão de crédito/débito (para taxa única de $25 no Google Play)
- [ ] Conta bancária para receber pagamentos
- [ ] Documento de identidade (para verificação)
- [ ] O app funcionando localmente

---

## 🏪 PARTE 1: Google Play Console

### 1.1 Criar Conta de Desenvolvedor

1. **Acesse:** https://play.google.com/console
   
2. **Clique em "Primeiros passos"** (ou "Get started")

3. **Crie uma conta de desenvolvedor:**
   - Escolha o tipo de conta: **Pessoal** ou **Organização**
   - Para apps pessoais, escolha "Pessoal"
   
4. **Pague a taxa de registro:**
   - Taxa única de **US$ 25** (aproximadamente R$ 125)
   - Pague com cartão de crédito/débito
   
5. **Preencha as informações:**
   - Nome do desenvolvedor: `Seu Nome` ou `Nome da Empresa`
   - Email de contato: `seu-email@gmail.com`
   - Número de telefone (opcional mas recomendado)
   
6. **Aceite os termos** e clique em "Criar conta"

7. **Aguarde a verificação** (pode levar até 48 horas)

---

### 1.2 Criar o App no Play Console

Após sua conta ser aprovada:

1. **Clique em "Criar app"**

2. **Preencha os detalhes do app:**
   ```
   Nome do app: TicTacMasterXO
   Idioma padrão: Português (Brasil)
   App ou jogo: Jogo
   Gratuito ou pago: Gratuito
   ```

3. **Marque as declarações:**
   - [x] Aceito os termos do programa para desenvolvedores
   - [x] Aceito as políticas do programa para desenvolvedores
   - [x] Aceito as obrigações de exportação dos EUA

4. **Clique em "Criar app"**

---

### 1.3 Configurar o App (Ficha da Loja)

Vá em **Crescer > Presença na Play Store > Ficha principal da Play Store**

Preencha:

1. **Nome do app:** `TicTacMasterXO - Jogo da Velha`

2. **Descrição curta (até 80 caracteres):**
   ```
   O melhor Jogo da Velha com 8 modos únicos! Desafie IA ou amigos online.
   ```

3. **Descrição completa (até 4000 caracteres):**
   ```
   🎮 TicTacMasterXO - O Jogo da Velha Definitivo!

   Descubra uma nova dimensão do clássico Jogo da Velha com 8 modos de jogo únicos e desafiadores!

   ✨ MODOS DE JOGO:
   • Clássico - O tradicional 3x3 que todos amam
   • Infinito - Sem empate! As peças mais antigas desaparecem
   • Gravity - Peças podem cair aleatoriamente!
   • Cego - Memorize! As peças desaparecem
   • Blitz - Faça sua jogada em segundos ou perca
   • Reverso - Quem fizer 3 em linha PERDE!

   🤖 INTELIGÊNCIA ARTIFICIAL:
   • 5 níveis de dificuldade
   • Do Noob ao Challenger impossível
   • Modo Troll para rir muito

   🌐 MULTIPLAYER ONLINE:
   • Jogue com amigos em tempo real
   • Crie salas privadas
   • Ranking global

   🎨 PERSONALIZAÇÃO:
   • Múltiplos temas visuais
   • Efeitos sonoros e hápticos
   • Disponível em 4 idiomas

   📊 ESTATÍSTICAS:
   • Acompanhe seu desempenho
   • Sequências de vitórias
   • Histórico completo

   Baixe agora e prove que você é o mestre do Jogo da Velha!
   ```

4. **Ícone do app:** 512x512 pixels PNG

5. **Gráfico de recursos:** 1024x500 pixels

6. **Capturas de tela:** 
   - Mínimo 2 screenshots do celular
   - Tamanho: entre 320 e 3840 pixels, proporção 16:9 ou 9:16

---

### 1.4 Classificação de Conteúdo

Vá em **Política > Classificação de conteúdo do app**

1. Clique em "Iniciar questionário"
2. Informe seu email
3. Escolha a categoria: **Jogos**
4. Responda o questionário honestamente:
   - Violência: Não
   - Sexualidade: Não
   - Linguajar: Não
   - Substâncias controladas: Não
   - Compras no app: **SIM** (terá assinaturas)
   - Informações pessoais: Não
   - Anúncios: **SIM** (terá AdMob)

5. Salve e obtenha sua classificação (provavelmente Livre/L)

---

## 📢 PARTE 2: Google AdMob

### 2.1 Verificar sua Conta AdMob

Você mencionou que já criou a conta. Verifique se ela está ativa:

1. Acesse: https://admob.google.com/
2. Faça login com sua conta Google
3. Veja se aparece o painel principal

Se não tiver conta, crie uma em: https://admob.google.com/signup

---

### 2.2 Adicionar seu App no AdMob

1. No menu lateral, clique em **Apps**

2. Clique em **Adicionar app**

3. Responda: "O app foi publicado na Google Play Store ou App Store?"
   - Se ainda não publicou: **Não**
   - Se já publicou: **Sim** (e busque pelo nome)

4. Preencha:
   ```
   Plataforma: Android
   Nome do app: TicTacMasterXO
   ```

5. Clique em **Adicionar**

6. **ANOTE O APP ID** - Formato: `ca-app-pub-XXXXXXXXXXXXXXXX~NNNNNNNNNN`
   ```
   Seu App ID Android: ca-app-pub-7541883201708712~__________
   (Preencha com o número que aparecer)
   ```

---

### 2.3 Criar Ad Units (Unidades de Anúncio)

No seu app recém-criado no AdMob:

1. Clique em **Adicionar unidade de anúncio**

2. **Crie um Interstitial** (anúncio de vídeo/tela cheia):
   ```
   Tipo: Interstitial
   Nome: TicTac_Interstitial_Android
   ```
   - Clique em "Criar unidade de anúncio"
   - **ANOTE O AD UNIT ID:** `ca-app-pub-7541883201708712/XXXXXXXXXX`

3. **Crie um Banner** (opcional, para telas menores):
   ```
   Tipo: Banner
   Nome: TicTac_Banner_Android
   ```
   - Clique em "Criar unidade de anúncio"
   - **ANOTE O AD UNIT ID:** `ca-app-pub-7541883201708712/XXXXXXXXXX`

---

### 2.4 Resumo dos IDs AdMob

Preencha aqui seus IDs para referência:

```
=== SEUS IDs ADMOB ===

App ID Android: ca-app-pub-7541883201708712~_______________

Interstitial ID: ca-app-pub-7541883201708712/_______________

Banner ID: ca-app-pub-7541883201708712/_______________
```

---

## 💳 PARTE 3: Criar Produtos de Assinatura

### 3.1 Acessar Monetização no Play Console

1. Volte ao Google Play Console: https://play.google.com/console

2. Selecione seu app **TicTacMasterXO**

3. Vá em **Monetizar > Produtos > Assinaturas**

---

### 3.2 Criar Assinatura Mensal

1. Clique em **Criar assinatura**

2. **Preencha os detalhes:**
   ```
   ID do produto: tictacmaster_noads_monthly
   Nome: Premium Mensal - Sem Anúncios
   ```

3. Clique em **Criar assinatura**

4. **Adicione um plano base:**
   - Clique em "Adicionar plano base"
   - Preencha:
     ```
     ID do plano base: monthly-base
     Período de cobrança: Mensal
     Renovação automática: Sim
     Período de carência: 3 dias
     ```

5. **Defina o preço:**
   - Clique em "Definir preços"
   - Escolha Brasil (BRL)
   - Digite: **R$ 6,90**
   - Marque "Aplicar taxa de câmbio" para outros países
   - Clique em "Atualizar"

6. **Ative o plano:**
   - Clique nos 3 pontinhos do plano → Ativar

---

### 3.3 Criar Assinatura Anual

1. Clique em **Criar assinatura**

2. **Preencha os detalhes:**
   ```
   ID do produto: tictacmaster_noads_yearly
   Nome: Premium Anual - Sem Anúncios
   ```

3. Clique em **Criar assinatura**

4. **Adicione um plano base:**
   ```
   ID do plano base: yearly-base
   Período de cobrança: Anual
   Renovação automática: Sim
   Período de carência: 7 dias
   ```

5. **Defina o preço:**
   - Escolha Brasil (BRL)
   - Digite: **R$ 49,90**
   - Clique em "Atualizar"

6. **Ative o plano**

---

### 3.4 Resumo dos Produtos

```
=== PRODUTOS DE ASSINATURA ===

Mensal:
  - ID: tictacmaster_noads_monthly
  - Preço: R$ 6,90/mês

Anual:
  - ID: tictacmaster_noads_yearly
  - Preço: R$ 49,90/ano (economia de ~40%)
```

---

## 💻 PARTE 4: Configurar o Código

### 4.1 Atualizar app.json com IDs do AdMob

Substitua os XXX pelos seus IDs reais:

```json
{
  "expo": {
    "name": "TicTacMasterXO",
    "slug": "tictacmasterxo",
    "version": "1.0.0",
    "android": {
      "package": "com.seuusuario.tictacmasterxo",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#0A0A0A"
      },
      "config": {
        "googleMobileAdsAppId": "ca-app-pub-7541883201708712~NNNNNNNNNN"
      },
      "permissions": [
        "com.google.android.gms.permission.AD_ID"
      ]
    },
    "plugins": [
      [
        "expo-build-properties",
        {
          "android": {
            "usesCleartextTraffic": true
          }
        }
      ]
    ]
  }
}
```

---

### 4.2 Instalar Dependências para IAP

Execute os comandos:

```bash
# Instalar react-native-iap
npm install react-native-iap

# Instalar expo-build-properties (se não tiver)
npx expo install expo-build-properties

# Criar build de desenvolvimento
npx expo prebuild --clean
```

---

### 4.3 Atualizar o Serviço de IAP

O arquivo `src/services/iapService.ts` precisa ser atualizado para usar o react-native-iap real.

**IMPORTANTE:** Vou criar um arquivo atualizado para você.

---

## 🧪 PARTE 5: Build e Teste

### 5.1 Gerar Build de Desenvolvimento

Para testar compras, você precisa de um build real (não funciona no Expo Go):

```bash
# Gerar APK de desenvolvimento para Android
eas build --profile development --platform android
```

Se não tiver EAS CLI:
```bash
npm install -g eas-cli
eas login
eas build:configure
```

---

### 5.2 Configurar Testadores no Play Console

Para testar compras sem gastar dinheiro real:

1. No Play Console, vá em **Configuração > Contas de teste de licença**

2. Adicione os emails dos testadores:
   ```
   seu-email@gmail.com
   outro-tester@gmail.com
   ```

3. **Configurar Faixa de Testes:**
   - Vá em **Teste > Testes internos**
   - Clique em "Criar versão"
   - Faça upload do seu APK/AAB
   - Adicione os emails dos testadores

4. **Aceite o convite:**
   - Os testadores receberão um email
   - Clique no link para aceitar
   - Depois de aceitar, as compras serão "sandbox" (sem cobrança real)

---

### 5.3 Testar Compras

1. Instale o APK no celular do testador
2. Faça login com a conta do testador
3. Tente fazer uma compra
4. Verifique se aparece "Compra de teste" ou "Sandbox"
5. Complete a compra (não será cobrado)

---

## 🚀 PARTE 6: Publicação

### 6.1 Build de Produção

```bash
# Gerar AAB (Android App Bundle) para a Play Store
eas build --profile production --platform android
```

Ou se preferir APK:
```bash
eas build --profile production --platform android --local
```

---

### 6.2 Upload para Play Console

1. Vá em **Produção > Criar versão**
2. Faça upload do arquivo `.aab`
3. Preencha as notas da versão
4. Envie para revisão

---

### 6.3 Tempo de Revisão

- **Primeira submissão:** 3-7 dias úteis
- **Atualizações:** 1-3 dias úteis

---

## 📊 Checklist Final

### AdMob
- [ ] Conta AdMob criada
- [ ] App Android adicionado
- [ ] Ad Unit Interstitial criado
- [ ] IDs copiados para o código

### Play Console
- [ ] Conta de desenvolvedor criada ($25 pago)
- [ ] App criado
- [ ] Ficha da loja preenchida
- [ ] Classificação de conteúdo obtida
- [ ] Assinatura mensal criada (R$ 6,90)
- [ ] Assinatura anual criada (R$ 49,90)
- [ ] Testadores configurados

### Código
- [ ] app.json atualizado com IDs
- [ ] react-native-iap instalado
- [ ] iapService.ts atualizado
- [ ] Build de desenvolvimento gerado
- [ ] Testado com conta de teste

---

## 🆘 Problemas Comuns

### "A compra não está disponível"
- Verifique se o testador está na lista de licença
- Verifique se as assinaturas estão ativas
- Aguarde 24h após criar as assinaturas

### "App não encontrado no AdMob"
- O app precisa estar publicado na Play Store
- Ou vincule manualmente pelo package name

### "Build falha com erro de IAP"
- Certifique-se de usar `npx expo prebuild --clean`
- Verifique se o react-native-iap está instalado

---

## 📞 Suporte

Se precisar de ajuda:
- [Suporte AdMob](https://support.google.com/admob)
- [Suporte Play Console](https://support.google.com/googleplay/android-developer)
- [Documentação react-native-iap](https://react-native-iap.dooboolab.com/)

---

*Última atualização: Janeiro 2026*
