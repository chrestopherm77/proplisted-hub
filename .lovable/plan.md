## Feedback periódico de validade (30 dias)

Após o login, mostrar um modal pedindo confirmação de cada **imóvel** (tabela `properties`) e cada **interesse de venda em parceria** (tabela `property_searches`) do corretor que esteja ativo (`is_active = true`) e cuja última confirmação tenha mais de **30 dias**. Para cada item:

- **"Ainda está válido"** → atualiza data de confirmação, segue ativo.
- **"Já foi vendido / não é mais válido"** → marca `is_active = false` e registra motivo + data.

### 1. Banco de dados

Adicionar em ambas as tabelas:
- `last_validated_at timestamptz` (default `now()` para registros existentes e novos)
- `deactivated_reason text` (`SOLD`, `NO_LONGER_VALID`, `OTHER`)
- `deactivated_at timestamptz`

Index parcial para acelerar a busca de pendências:
```
WHERE is_active = true AND (last_validated_at IS NULL OR last_validated_at < now() - interval '30 days')
```

Trigger: ao `UPDATE` com `is_active = false` vindo do fluxo de feedback, gravar `deactivated_at = now()`.

### 2. Hook `usePendingValidations`

- Roda quando `user` carrega.
- Busca `properties` e `property_searches` do `user_id` atual onde `is_active = true` e `last_validated_at < now() - 30d` (ou null).
- Retorna `{ pending: Array<{kind, id, title, ...}>, loading, refresh }`.
- Throttle por sessão: guardar `lastShownAt` em `localStorage` para não reabrir o modal a cada navegação no mesmo dia (mas reabre no próximo login/dia se houver pendência).

### 3. Componente `ValidationPromptModal`

Renderizado dentro do `Layout` (mesmo lugar de `CompleteProfileModal`). Aparece uma vez por sessão, mostrando um card por item com:
- Título + cidade/bairro + link "ver detalhes".
- Botões: **Ainda está disponível** / **Já foi vendido** / **Não é mais válido**.
- Botão **"Revisar depois"** que fecha o modal mas mantém pendência para próximo login.

Cada confirmação faz `update` direto via Supabase respeitando RLS existente (`auth.uid() = user_id`).

### 4. Local da exibição

`src/components/Layout.tsx` — montar `<ValidationPromptModal />` quando `user && pending.length > 0 && !shownThisSession`.

### 5. Arquivos

- **Migration**: novas colunas + índices nas duas tabelas.
- **Novo**: `src/hooks/usePendingValidations.ts`, `src/components/validation/ValidationPromptModal.tsx`.
- **Editar**: `src/components/Layout.tsx`.

### Perguntas

1. **Reativação**: se o corretor depois quiser reativar um anúncio marcado como "vendido", isso já é tratado pela edição normal em "Meus Imóveis" — ok manter assim?
2. **Periodicidade no painel admin**: quer um relatório/contador no admin mostrando quantos itens estão pendentes de validação por usuário, ou só o fluxo do corretor já basta nesse momento?
