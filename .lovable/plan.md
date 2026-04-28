## Problemas Identificados

### 1. Balcão de Parceria envia para apenas 2 grupos
A função `notify-group-new-search` (que dispara quando alguém publica uma nova procura no balcão) envia para apenas 2 grupos:
```ts
const WHATSAPP_GROUP_IDS = [
  "120363407964054463@g.us",
  "120363426047592689@g.us",
];
```

As outras funções de notificação (`notify-lead-group`, `daily-news-broadcast`, `mega-webhook`) já enviam para 3 grupos, incluindo `"120363410244397205@g.us"`. O terceiro grupo simplesmente não foi adicionado nesta função.

### 2. Botão "Enviar Link" precisa virar "Entrar em contato"
Hoje, no modal de oferta (`src/pages/PropertySearches.tsx`):
- A pessoa cola o link do anúncio
- Clica em **"Enviar Link"**
- O link é registrado e enviado por WhatsApp pelo bot (Mega API) para o anunciante

O usuário quer mudar o fluxo:
- A pessoa cola o link do anúncio (continua igual)
- Clica em **"Entrar em contato"**
- Em vez de a Mega API enviar a mensagem, abre o WhatsApp Web/App do próprio corretor (`wa.me/...`) com a mensagem pronta contendo apresentação + **link do anúncio embutido no corpo**
- O link continua salvo em `property_search_offers.offer_link` para aparecer no card "Ofertas Recebidas"

## Plano de Correção

### 1. `supabase/functions/notify-group-new-search/index.ts`
Adicionar o terceiro grupo no array `WHATSAPP_GROUP_IDS`:
```ts
const WHATSAPP_GROUP_IDS = [
  "120363407964054463@g.us",
  "120363426047592689@g.us",
  "120363410244397205@g.us",
];
```
Redeploy da função.

### 2. `src/pages/PropertySearches.tsx` — Refatorar o handler do modal
- Renomear o botão para **"Entrar em contato"** com ícone `MessageCircle` (verde, estilo WhatsApp).
- Remover a chamada para `supabase.functions.invoke('notify-offer-whatsapp', ...)` neste fluxo.
- Manter:
  - `increment_offer_count` (para contagem)
  - `upsert` em `property_search_offers` salvando `offer_name` + `offer_link` (para aparecer no card)
- Substituir o disparo via Mega API por:
  - Buscar o telefone do anunciante via `supabase.rpc('get_profile_phone', { p_user_id: search.user_id })`
  - Normalizar para formato `55DDDNNNNNNNN`
  - Montar mensagem incluindo o link colado:
    ```
    Olá! Vi sua procura de {tipo} em {cidade} no Conectae Imob e tenho um imóvel que pode interessar.
    
    🔗 Link do anúncio: {offerLink}
    
    Podemos conversar?
    ```
  - `window.open('https://wa.me/{fullPhone}?text={msgEncoded}', '_blank')` para redirecionar o corretor ao WhatsApp já com a conversa pronta.
- Manter validação `if (!offerLink.trim()) return;` (link do anúncio é obrigatório).
- Renomear estado `sendingLink` → `sendingContact` (ou manter, é interno).
- Toast de sucesso: `"Oferta registrada! Continue a conversa pelo WhatsApp."`

### 3. Limpeza opcional
A edge function `notify-offer-whatsapp` deixa de ser chamada por este fluxo, mas será mantida (pode ser usada em outros pontos no futuro). Sem alteração nela.

## Arquivos Afetados

- `supabase/functions/notify-group-new-search/index.ts` (adicionar terceiro grupo + redeploy)
- `src/pages/PropertySearches.tsx` (refatorar `handleSendLink` e botão do modal)

## Resultado Esperado

1. Toda nova procura publicada no balcão dispara notificação para os **3 grupos** de WhatsApp.
2. No modal de oferta, ao colar o link e clicar em **"Entrar em contato"**, o corretor é redirecionado para o WhatsApp do anunciante com a mensagem pronta contendo o link do anúncio. A oferta também fica registrada no card "Ofertas Recebidas" da procura.
