

# Alertas de Leads Disponíveis

## Resumo
Adicionar sistema de alertas na página "Leads Disponíveis" para que usuários salvem filtros (cidade e estado obrigatórios) e sejam notificados quando novos leads compatíveis forem cadastrados. Inclui filtro de objetivo (Comprar/Vender/Alugar/Construir).

## 1. Criar tabela `lead_alerts`

```sql
CREATE TABLE public.lead_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.lead_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own lead alerts"
  ON public.lead_alerts FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all lead alerts"
  ON public.lead_alerts FOR SELECT TO public
  USING (has_role(auth.uid(), 'MASTER_ADMIN'::app_role));
```

Filtros salvos no JSONB: `{ state, city, objective, bairro, valueRange }` — `state` e `city` obrigatórios.

## 2. Atualizar `src/pages/Leads.tsx`

- Importar `Bell`, `Save`, `Trash2` e `Dialog`
- Adicionar states para `alerts`, `showAlerts`, `savingAlert`
- `fetchAlerts()` — busca alertas do usuário
- `saveAlert()` — valida que UF e cidade estão preenchidos, insere na tabela
- `deleteAlert()` — remove alerta
- UI: botão "Meus Alertas" ao lado do título + botão "Salvar Alerta" abaixo dos filtros
- Dialog mostrando alertas salvos com opção de excluir

## 3. Atualizar `supabase/functions/mega-webhook/index.ts`

Após o bloco existente de envio ao grupo WhatsApp, adicionar bloco de matching com `lead_alerts`:
- Buscar todos alertas ativos
- Para cada alerta, comparar `filters.state`, `filters.city`, `filters.objective` com os dados do lead
- Se match, buscar email/phone do profile e enviar notificação (email via Resend)
- Fire-and-forget para não bloquear resposta do webhook

## 4. Atualizar `supabase/functions/notify-new-lead/index.ts`

Adicionar matching de `lead_alerts` no mesmo fluxo:
- Após enviar emails para todos os perfis, buscar alertas que correspondem ao lead (por city, uf, intention)
- Enviar emails personalizados para usuários com alertas compatíveis que não receberam no envio geral (evitar duplicatas)

**Alternativa mais simples**: como o `notify-new-lead` já envia para TODOS os perfis ativos, o matching de alertas serve para uma futura segmentação. Por agora, focar em salvar os alertas na UI e manter a lógica de disparo existente.

## Arquivos modificados
1. **Migration SQL** — criar tabela `lead_alerts`
2. **`src/pages/Leads.tsx`** — UI de salvar/ver/excluir alertas com validação de cidade+estado obrigatórios
3. **`supabase/functions/mega-webhook/index.ts`** — matching de alertas ao confirmar lead (opcional, depende se quer disparo segmentado)

