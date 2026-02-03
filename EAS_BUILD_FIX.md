# Correção do Erro de Build no EAS

## Erro
```
🤖 Android build failed:
Unknown error. See logs of the Install dependencies build phase for more information.
```

## Possíveis Causas

### 1. Versão incompatível do react-native-nitro-modules
O `react-native-nitro-modules@0.33.2` pode não ser compatível com `react-native-google-mobile-ads@15.6.0`.

### 2. Conflito de versões do React
`react@19.1.0` é muito recente e pode ter incompatibilidades com algumas bibliotecas.

### 3. @react-native-community/cli com "latest"
Usar `"latest"` em devDependencies pode causar instabilidade.

## Soluções

### Opção 1: Remover react-native-nitro-modules (Recomendado)

Como fizemos downgrade do `react-native-google-mobile-ads` para 15.6.0, não precisamos mais do nitro-modules:

```bash
npm uninstall react-native-nitro-modules
```

Depois rebuilde:
```bash
eas build -p android --profile production
```

### Opção 2: Fixar versões estáveis

Atualizar `package.json` para usar versões mais estáveis:

```json
{
  "dependencies": {
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "react-native": "0.76.5"
  },
  "devDependencies": {
    "@react-native-community/cli": "15.1.3",
    "@types/react": "~18.2.45"
  }
}
```

Depois:
```bash
npm install
eas build -p android --profile production
```

### Opção 3: Limpar cache do EAS

```bash
eas build -p android --profile production --clear-cache
```

### Opção 4: Verificar eas.json

Certifique-se que o `eas.json` tem a configuração correta:

```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleRelease"
      }
    }
  }
}
```

## Solução Imediata (Passo a Passo)

1. **Remover nitro-modules** (não é mais necessário):
```bash
npm uninstall react-native-nitro-modules
```

2. **Verificar se package.json está limpo**:
```bash
npm install
```

3. **Rebuild com cache limpo**:
```bash
eas build -p android --profile production --clear-cache
```

## Se ainda falhar

Veja os logs completos em:
https://expo.dev/accounts/zolk/projects/TicTacMasterXO/builds/a26b0796-acc0-4064-bc8c-817f2d2abb20

Procure por:
- `npm ERR!` - Erro de instalação
- `ERESOLVE` - Conflito de dependências
- `peer dependencies` - Incompatibilidades

## Alternativa: Build Local

Se o EAS continuar falhando, você pode fazer build local:

```bash
# Gerar arquivos nativos
npx expo prebuild

# Build local
npx expo run:android --variant release
```

## Configuração Recomendada Final

**package.json** (versões estáveis testadas):

```json
{
  "dependencies": {
    "react": "18.3.1",
    "react-native": "0.76.5",
    "react-native-google-mobile-ads": "15.6.0",
    "react-native-iap": "14.7.0"
  },
  "devDependencies": {
    "@react-native-community/cli": "15.1.3"
  }
}
```
