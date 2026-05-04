## Objetivo

1. Permitir que o Admin dispare manualmente um lançamento no(s) grupo(s) de WhatsApp (igual ao botão já existente nos leads).
2. Corrigir a formatação do preço na mensagem do grupo (hoje sai `R$ 55046400`, deve sair `R$ 550.464,00`).

## Mudanças

### 1. Corrigir formatação de preço
**Arquivo:** `supabase/functions/notify-launch-group/index.ts`

Os campos `price_from` / `price_max` são armazenados como string de centavos (ex: `"55046400"` = R$ 550.464,00). Adicionar um helper local `formatBRL` que converte centavos → `R$ 550.464,00` (mesma lógica do `formatCurrency` em `src/pages/Launches.tsx`) e aplicá-lo em `price_from` e `price_max`. Se houver `price_max`, exibir como faixa: `*Faixa de preço:* R$ X – R$ Y`. Caso contrário, manter `*A partir de:* R$ X`.

### 2. Botão de disparo no grupo (Admin)
**Arquivo:** `src/pages/Launches.tsx`

Adicionar, no card de cada lançamento, um botão flutuante "megafone" visível apenas quando `isAdmin === true`. Ao clicar:
- `event.stopPropagation()` para não abrir o detalhe do lançamento
- chama `supabase.functions.invoke('notify-launch-group', { body: { launchId: launch.id } })`
- mostra toast de sucesso/erro (mesmo padrão do botão em `LeadsManagement.tsx`: trata mensagens de instabilidade do MegaAPI)

Também adicionar o mesmo botão em `src/pages/LaunchDetail.tsx` (no header da página, ao lado das ações já existentes), visível só para admin, para conveniência.

### 3. Backend já está pronto
A edge function `notify-launch-group` já aceita admin como disparo válido (`launch.user_id !== user.id && !isAdmin` → 403). Nenhuma mudança de permissão necessária — basta corrigir o preço.

## Detalhes técnicos do helper de preço

```ts
function formatBRL(raw: string | null): string {
  if (!raw) return "";
  const digits = String(raw).replace(/\D/g, "");
  if (!digits) return "";
  const num = parseInt(digits, 10);
  return `R$ ${(num / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}
```

Substitui a linha atual:
```
if (launch.price_from) lines.push(`*A partir de:* R$ ${String(launch.price_from).replace(/^R\$\s*/i, "")}`);
```

Por:
```
const pf = formatBRL(launch.price_from);
const pm = formatBRL(launch.price_max);
if (pf && pm) lines.push(`*Faixa de preço:* ${pf} – ${pm}`);
else if (pf) lines.push(`*A partir de:* ${pf}`);
```

## Resultado esperado da mensagem

```
🏗️ Novo Lançamento na sua região!

CITTÁ 07
Tipo: Apartamento
Local: Quintas de São José - Sul - Ribeirão Preto - SP
Área: 62 a 82 m²
Faixa de preço: R$ 550.464,00 – R$ 870.477,00
Status: Em construção

Confira detalhes, tabela e book completo no sistema:
👉 https://www.conectaeimob.com.br/launches
```
