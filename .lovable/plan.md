
## Corrigir tradução do tipo de imóvel + Excluir interesse no Balcão

### Problema 1 — "APARTMENT" e "R$ R$" no WhatsApp

O fluxo **Comprar** (`BuyPropertyTypeStep`) salva os valores como `propertyType = HOUSE | APARTMENT | KITNET | COMMERCIAL | LAND | RURAL`.

Já as funções `mega-webhook` e `notify-lead-group` só traduzem `propertyType` quando ele é `RESIDENTIAL/COMMERCIAL/MIXED/RURAL/LAND` (esquema antigo do fluxo Sell/Rent). Resultado: `APARTMENT`, `HOUSE`, `KITNET` aparecem crus.

Bônus: `budgetMax` é salvo já formatado como `"R$ 270.000,00"`, então ao fazer `R$ ${value}` vira **"R$ R$ 270.000,00"**.

**Correção** (em `mega-webhook/index.ts` e `notify-lead-group/index.ts`):
1. Expandir o `propLabels` para incluir os valores do fluxo Comprar:
   ```ts
   HOUSE: "Casa", APARTMENT: "Apartamento", KITNET: "Kitnet/Studio",
   COMMERCIAL: "Comercial", LAND: "Terreno", RURAL: "Rural",
   RESIDENTIAL: "Residencial", MIXED: "Misto",
   ```
2. Limpar prefixo `R$` duplicado antes de imprimir o valor:
   ```ts
   const cleanValue = String(value).replace(/^R\$\s*/i, "").trim();
   if (cleanValue) lines.push(`R$ ${cleanValue}`);
   ```

### Problema 2 — Excluir interesse no Balcão de Parcerias

Hoje em `/property-searches` (Balcão), os cards **não têm** botão de excluir o próprio interesse. Só alertas têm.

**Correção** em `src/pages/PropertySearches.tsx`:
- Criar `handleDeleteSearch(id)` que confirma e faz `supabase.from('property_searches').delete().eq('id', id).eq('user_id', user.id)` (RLS já garante isolamento), removendo do estado local `searches`.
- Adicionar botão **Excluir** (ícone `Trash2`, variant ghost, vermelho) no rodapé de cada card, **somente quando** `s.user_id === user.id` (lado do dono). Admin (`isAdmin`) também pode excluir qualquer um.
- Usar `AlertDialog` (shadcn) para confirmação antes de deletar.

### Arquivos editados
- `supabase/functions/mega-webhook/index.ts` — propLabels expandido + clean R$
- `supabase/functions/notify-lead-group/index.ts` — propLabels expandido + clean R$
- `src/pages/PropertySearches.tsx` — botão de excluir nos cards próprios + admin
