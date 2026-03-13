

## Histórico de Acessos dos Corretores no Painel Admin

### O que será feito

Adicionar uma nova aba "Acessos" no painel administrativo que exibe o histórico completo de login de todos os corretores, com data, hora e e-mail.

### 1. Criar tabela `login_history` (migração)

```sql
CREATE TABLE public.login_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  logged_in_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all login history"
  ON public.login_history FOR SELECT
  USING (has_role(auth.uid(), 'MASTER_ADMIN'));

CREATE POLICY "Authenticated users can insert own login"
  ON public.login_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### 2. Registrar login em `src/pages/Auth.tsx`

Após login bem-sucedido (e verificação de `is_active`), inserir um registro na tabela `login_history` com o `user_id`.

### 3. Criar componente `src/components/admin/AccessHistory.tsx`

- Busca `login_history` com JOIN nos `profiles` (nome) e e-mails via `list-users` edge function (já existente)
- Tabela com colunas: Nome, E-mail, Data/Hora do acesso
- Filtro de busca por nome/e-mail
- Ordenado por data mais recente

### 4. Adicionar aba "Acessos" em `src/pages/Admin.tsx`

- Nova tab na grid (7 colunas agora) com valor "access"
- Renderiza o componente `AccessHistory`

