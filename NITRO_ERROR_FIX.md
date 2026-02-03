# Correção do Erro NitroModules

## Problema
```
Uncaught Error
Failed to get NitroModules: The native "NitroModules" TurboModule could not be found.
```

Este erro ocorre ao clicar no botão "Remove Ads" (tela de assinatura IAP).

## Causa
O módulo `react-native-google-mobile-ads` (versão 16.0.1) depende de `react-native-nitro-modules`, que precisa ser configurado nativamente no projeto React Native.

## Soluções Possíveis

### Solução 1: Instalar e Configurar NitroModules (Recomendado para Build Nativo)

Se você está usando `eas build` ou `react-native run-android`:

```bash
# 1. Instalar o módulo
npm install react-native-nitro-modules

# 2. No Android, rodar:
npx react-native config

# 3. Reconstruir o app
npx expo prebuild --clean
eas build --platform android
```

### Solução 2: Downgrade do react-native-google-mobile-ads (Temporário)

Se estiver usando apenas Expo Go (desenvolvimento):

```bash
# Usar versão anterior que não depende de NitroModules
npm install react-native-google-mobile-ads@15.6.0
```

### Solução 3: Desabilitar AdMob Temporariamente (Desenvolvimento)

No arquivo `src/services/adMobService.ts`, a biblioteca já possui um sistema de fallback que detecta se o módulo nativo está disponível.

O erro aparece porque:
1. A biblioteca tenta importar o módulo nativo
2. No Expo Go, módulos nativos não estão disponíveis
3. O app quebra antes de chegar no fallback

### Solução 4: Build Nativo Completo (Produção)

Para produção, o correto é:

```bash
# 1. Configurar projeto para build nativo
npx expo prebuild

# 2. Instalar dependências nativas
npm install react-native-nitro-modules

# 3. Build nativo
eas build --platform android --profile production
```

## Status Atual

O sistema de IAP no app já está preparado para funcionar sem o módulo nativo:
- ✅ Detecta se está em Expo Go
- ✅ Fornece fallback mockado
- ✅ Não quebra se módulo não estiver disponível

**PORÉM**, o erro ocorre durante a **importação** do módulo, antes do código de fallback rodar.

## Recomendação Final

Para **desenvolvimento** (Expo Go):
```bash
npm install react-native-google-mobile-ads@15.6.0
```

Para **produção** (Build nativo):
```bash
npm install react-native-nitro-modules
npx expo prebuild --clean
eas build --platform android
```

## Nota Importante
Este erro **não afeta** a funcionalidade da loja, símbolos ou efeitos. Apenas afeta a tela "Remove Ads" (assinatura).
