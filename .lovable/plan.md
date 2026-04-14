

# Plano: Validade da Tabela, Alertas de Lançamentos e Melhorias nos Filtros

## Resumo

Adicionar campo de "Data de Validade da Tabela/Valores" nos lançamentos com disparo automático via WhatsApp 2 dias antes do vencimento. Implementar sistema de alertas (salvar filtro + receber notificação) na listagem de lançamentos, igual ao que existe em PropertySearches. Aplicar máscara monetária nos filtros de preço e tornar Zona selecionável nos filtros.

---

## 1. Migração: novo campo `table_expires_at`

Adicionar coluna `table_expires_at DATE` na tabela `launches`.

```sql
ALTER TABLE public.launches ADD COLUMN table_expires_at date;
```

## 2. Nova tabela `launch_alerts`

Tabela para salvar filtros de lançamentos com alertas (mesma lógica de `property_search_alerts`).

```sql
CREATE TABLE public.launch_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.launch_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own launch alerts" ON public.launch_alerts
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all launch alerts" ON public.launch_alerts
  FOR SELECT TO public
  USING (has_role(auth.uid(), 'MASTER_ADMIN'::app_role));
```

## 3. Formulário de cadastro (NewLaunch.tsx)

- Adicionar campo datepicker "Data de Validade da Tabela" (`table_expires_at`)
- Salvar no insert do lançamento

## 4. Detalhe do lançamento (LaunchDetail.tsx)

- Exibir "Validade da Tabela" na seção de Valores

## 5. Edge Function: `notify-launch-expiry`

Cron job que roda diariamente. Para cada lançamento ativo com `table_expires_at` = daqui a 2 dias, envia WhatsApp para `coordinator_phone` via Mega API avisando que a tabela está prestes a vencer.

Mensagem:
> "Olá {coordinator_name}, a tabela de valores do empreendimento *{name}* vence em 2 dias ({data}). Acesse o LeadByA para atualizar."

## 6. Cron job via pg_cron

Agendar execução diária da function `notify-launch-expiry`.

## 7. Edge Function: `notify-launch-alert-match`

Quando um novo lançamento for criado, chamar esta function (fire-and-forget no frontend). Ela verifica os `launch_alerts` salvos, compara filtros (estado, cidade, zona, tipo, status, faixa de preço) e dispara WhatsApp para os usuários que possuem alertas compatíveis.

## 8. Filtros na listagem (Launches.tsx)

- **Zona**: trocar de Select dinâmico (baseado nos dados) para Select fixo com opções: Norte, Sul, Leste, Oeste, Centro, Rural
- **Preço mín/máx**: aplicar máscara monetária (R$ X.XXX,XX) nos inputs, mesma lógica do PropertySearches
- **Salvar Alerta**: botão + modal para salvar filtros atuais como alerta (inserir em `launch_alerts`)
- **Meus Alertas**: seção colapsável listando alertas salvos com opção de excluir

## 9. Chamada no frontend (NewLaunch.tsx)

Após criar o lançamento com sucesso, chamar `notify-launch-alert-match` fire-and-forget passando os dados do lançamento (estado, cidade, zona, tipo, status, preço).

---

## Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| Migração SQL | `table_expires_at` em launches + tabela `launch_alerts` |
| `src/pages/NewLaunch.tsx` | Campo validade, fire-and-forget notify |
| `src/pages/LaunchDetail.tsx` | Exibir validade |
| `src/pages/Launches.tsx` | Máscara preço, zona fixa, salvar alerta, listar alertas |
| `supabase/functions/notify-launch-expiry/index.ts` | Nova function cron |
| `supabase/functions/notify-launch-alert-match/index.ts` | Nova function de matching |
| pg_cron insert | Agendar notify-launch-expiry diariamente |

