# 🛠️ Ferramentas de Desenvolvedor & Cheats

Para facilitar os testes da economia do jogo sem precisar jogar horas ou gastar dinheiro real, implementamos um **Menu Secreto de Debug**.

## 🔓 Como Ativar

1. Vá para a tela de **Configurações**.
2. Role até o final, na seção **Sobre**.
3. Toque **5 vezes** rapidamente no número da **Versão** (ex: "Versão 1.0.0").
4. Você ouvirá um som de sucesso e um alerta aparecerá.
5. O menu **🛠️ Menu Secreto (Dev)** aparecerá no final da tela.

## 💰 Funcionalidades Disponíveis

*   **⭐ Adicionar 1000 Estrelas:** Adiciona moeda grátis instantaneamente.
*   **💎 Adicionar 1000 Diamantes:** Adiciona moeda premium instantaneamente.
*   **⚠️ Resetar Loja:** Apaga todo o progresso da loja (itens comprados, moedas) e restaura para o estado inicial (100 estrelas, 0 diamantes). Útil para testar o fluxo de "primeira vez".

---

## 🔒 Notas sobre Segurança e Persistência

Atualmente, todos os dados da loja (moedas e itens) são salvos localmente usando `AsyncStorage`.

### Limitações Atuais (MVP):
*   **Segurança:** Usuários com acesso root ou conhecimento técnico podem manipular os dados locais.
*   **Perda de Dados:** Se o usuário desinstalar o app ou limpar os dados, as **moedas consumíveis** serão perdidas.
*   **Restaurar Compras:** Itens comprados com dinheiro real (IAP) via Google Play são seguros pois a "posse" é gerenciada pelo Google. Implementaremos um botão "Restaurar Compras" futuramente.

### Solução Recomendada (Futuro):
Para um jogo comercial seguro, recomenda-se integrar **Firebase Firestore** + **Firebase Auth**:
1.  O usuário faz login (Google/Anon).
2.  O saldo de moedas fica no servidor (Firestore).
3.  As alterações de saldo críticas passam por Cloud Functions.

Enquanto o app for offline-first ou indie, o armazenamento local é um risco aceitável, desde que as compras IAP sejam validadas.
