# 📋 Checklist de Monetização - TicTacMasterXO

Use este arquivo para acompanhar seu progresso. Marque as tarefas concluídas.

---

## 🔐 SEUS IDs E CREDENCIAIS

**Preencha aqui após criar cada item (NÃO compartilhe esses dados):**

### AdMob
```
Publisher ID: pub-7541883201708712

App ID Android: ca-app-pub-7541883201708712~_______________

Interstitial Ad Unit ID: ca-app-pub-7541883201708712/_______________

Banner Ad Unit ID (opcional): ca-app-pub-7541883201708712/_______________
```

### Google Play Console
```
Developer Account: [   ] Criada e Aprovada

App ID no Play Console: _______________
```

---

## ✅ CHECKLIST

### FASE 1: Google Play Console

- [ ] Acessar https://play.google.com/console
- [ ] Pagar taxa de $25
- [ ] Preencher dados do desenvolvedor
- [ ] Aguardar aprovação da conta (até 48h)
- [ ] Criar app "TicTacMasterXO"
- [ ] Preencher ficha da loja
- [ ] Fazer upload de ícone (512x512)
- [ ] Fazer upload de gráfico de recursos (1024x500)
- [ ] Fazer upload de screenshots (mín. 2)
- [ ] Responder questionário de classificação
- [ ] Obter classificação de conteúdo

### FASE 2: Google AdMob

- [ ] Acessar https://admob.google.com
- [ ] Adicionar app Android
- [ ] Anotar App ID
- [ ] Criar Ad Unit Interstitial
- [ ] Anotar Ad Unit ID
- [ ] (Opcional) Criar Ad Unit Banner

### FASE 3: Produtos de Assinatura

- [ ] No Play Console, ir em Monetizar > Assinaturas
- [ ] Criar assinatura "tictacmaster_noads_monthly"
- [ ] Definir preço R$ 6,90
- [ ] Ativar plano mensal
- [ ] Criar assinatura "tictacmaster_noads_yearly"
- [ ] Definir preço R$ 49,90
- [ ] Ativar plano anual

### FASE 4: Configurar Código

- [ ] Editar app.json - substituir XXXXXXXXXX pelo App ID do AdMob
- [ ] Verificar se react-native-iap está instalado
- [ ] Verificar se expo-build-properties está instalado

### FASE 5: Build e Teste

- [ ] Executar: `eas build --profile development --platform android`
- [ ] Adicionar testadores no Play Console (em Testes > Internos)
- [ ] Configurar conta de teste de licença
- [ ] Instalar APK no celular do testador
- [ ] Testar fluxo de assinatura
- [ ] Verificar se anúncios param após assinar

### FASE 6: Publicação

- [ ] Executar: `eas build --profile production --platform android`
- [ ] Fazer upload do AAB no Play Console
- [ ] Preencher notas da versão
- [ ] Enviar para revisão
- [ ] Aguardar aprovação (3-7 dias)

---

## 📝 NOTAS E ANOTAÇÕES

Use este espaço para suas anotações durante o processo:

```
Data de início: ___/___/2026

Problemas encontrados:
- 

Soluções aplicadas:
- 

Data de conclusão: ___/___/2026
```

---

## 🔧 COMANDOS ÚTEIS

```bash
# Ver pacotes instalados
npm list react-native-iap expo-build-properties

# Gerar build de desenvolvimento
eas build --profile development --platform android

# Gerar build de produção
eas build --profile production --platform android

# Limpar cache e rebuild
npx expo prebuild --clean

# Ver logs detalhados
eas build --profile development --platform android --non-interactive --json
```

---

## 📞 PRÓXIMOS PASSOS APÓS CADA FASE

### Após Fase 1 (Play Console):
→ Anote o nome da conta de desenvolvedor

### Após Fase 2 (AdMob):
→ Copie os IDs e cole no app.json
→ Substitua XXXXXXXXXX pelos seus IDs reais

### Após Fase 3 (Assinaturas):
→ Aguarde 24h para as assinaturas ficarem ativas

### Após Fase 4 (Código):
→ Teste localmente com npx expo start

### Após Fase 5 (Teste):
→ Confirme que tudo funciona antes de publicar

### Após Fase 6 (Publicação):
→ Monitore avaliações e feedbacks

---

*Criado em: Janeiro 2026*
