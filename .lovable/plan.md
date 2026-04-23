
## Correção urgente: painel admin não refletindo plano/créditos

### Diagnóstico confirmado
A base já está parcialmente correta:
- **Todos os 32 usuários não-admin já possuem assinatura `ACTIVE` do plano CONEXÃO**.
- O problema principal agora é:
  1. **os créditos não foram creditados para a maioria**;
  2. **o painel admin pode continuar mostrando estado antigo** porque a tela de usuários busca os dados só no carregamento inicial.

Em outras palavras: o problema agora é menos “ativar plano” e mais **sincronizar créditos + garantir que o admin veja o estado atualizado**.

### O que vou corrigir

#### 1. Backfill de créditos para todos os não-admin
Executar uma operação de dados para:
- localizar todos os usuários que **não têm role `MASTER_ADMIN`**;
- garantir que o plano ativo deles seja o **CONEXÃO**;
- **somar +10 créditos** no `profiles.credit_balance`;
- registrar a movimentação em `credit_transactions` com tipo `SUBSCRIPTION_RENEWAL`.

Regra de segurança:
- a operação será escrita para não tocar admins;
- não vai remover saldo existente;
- vai atuar só no grupo elegível.

#### 2. Revalidar o vínculo de plano dos não-admin
Mesmo já existindo `ACTIVE` para os não-admin, vou rodar uma validação final para:
- confirmar que todos apontam para o plano `slug = 'conexao'`;
- criar a assinatura apenas se algum usuário realmente estiver sem `ACTIVE`.

Isso evita que o painel continue com usuários fora do padrão.

#### 3. Ajustar o painel Admin para refletir imediatamente
Atualizar `src/components/admin/UsersManagement.tsx` para o painel não depender só do primeiro carregamento:
- adicionar **refresh manual** da listagem;
- refazer `fetchData()` ao voltar para a aba/janela;
- garantir que a coluna de plano use sempre o registro mais recente válido com prioridade:
  `ACTIVE > OVERDUE > PENDING`;
- manter o filtro de planos funcionando após a recarga.

#### 4. Melhorar a leitura visual do status
Na listagem de usuários:
- quando o usuário tiver `ACTIVE` de CONEXÃO, mostrar claramente o nome do plano;
- manter “Sem plano” apenas para casos realmente sem assinatura válida;
- garantir que os créditos renderizem o valor atualizado após o backfill.

### Validação após execução
Vou validar com consultas finais:
1. **Não-admins sem ACTIVE** → deve retornar `0`
2. **Não-admins com plano diferente de CONEXÃO** → deve retornar `0` ou somente exceções intencionais
3. **Não-admins com créditos abaixo do esperado após o backfill** → conferir resultado final
4. Conferência visual no Admin:
   - coluna **Plano** preenchida;
   - coluna **Créditos** atualizada;
   - filtro por plano funcionando.

### Arquivos e operações afetados
- **Operação de dados**: atualização de `profiles`, `user_subscriptions` e `credit_transactions`
- **Frontend**:
  - `src/components/admin/UsersManagement.tsx`

### Resultado esperado
Depois dessa correção:
- todos os **não-admin** aparecerão no admin com plano **CONEXÃO**;
- todos terão os **10 créditos refletidos**;
- o painel deixará de ficar preso em estado antigo e passará a refletir o backend corretamente.
