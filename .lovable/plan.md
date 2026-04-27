## Objetivo

Permitir que o admin configure o **Pixel do Facebook (Meta Pixel)** dentro do gerador de Landing Page, e fazer com que esse pixel seja carregado e dispare `PageView` automaticamente quando a LP for acessada publicamente em `/{slug}`.

---

## Mudanças

### 1. Adicionar campo de tracking no tipo `LPContent`
Arquivo: `src/components/admin/landing-page/types.ts`

- Adicionar nova seção opcional `tracking` em `LPContent`:
  ```ts
  tracking?: {
    facebook_pixel_id?: string; // ex: "1234567890123456"
  };
  ```
- Adicionar `tracking: { facebook_pixel_id: '' }` em `DEFAULT_CONTENT`.

### 2. Adicionar campo no editor da LP
Arquivo: `src/components/admin/LandingPageEditor.tsx`

- Criar um novo `AccordionItem` chamado **"Pixel & Rastreamento"** (entre as seções de SEO/Footer existentes).
- Campo único: input de texto para **ID do Pixel do Facebook** com:
  - `placeholder="Ex: 1234567890123456"`
  - Texto auxiliar explicando: "Cole apenas o ID numérico do seu pixel (15-16 dígitos). O script será carregado automaticamente."
  - Validação client-side: aceitar apenas dígitos (strip de não-numéricos no `onChange`), máx. 20 caracteres.
- Salvar em `content.tracking.facebook_pixel_id`.
- Garantir hidratação no `useEffect` de carregamento (merge com `DEFAULT_CONTENT.tracking`).

### 3. Injetar o pixel apenas na LP pública
Arquivo: `src/pages/CustomLandingPage.tsx`

- Após carregar a LP, se `content.tracking?.facebook_pixel_id` existir e for válido (regex `/^\d{6,20}$/`):
  - Em um `useEffect`, injetar dinamicamente o snippet do Meta Pixel no `<head>`:
    ```js
    !function(f,b,e,v,n,t,s){...fbq init...}(...);
    fbq('init', '<PIXEL_ID>');
    fbq('track', 'PageView');
    ```
  - Adicionar também o `<noscript><img src="https://www.facebook.com/tr?id=<PIXEL_ID>&ev=PageView&noscript=1"/></noscript>` no `<body>` (não no head — regra HTML5).
  - No cleanup do `useEffect`, remover o script e o noscript injetados para evitar duplicação ao trocar de slug.
- O pixel **NÃO** será injetado no preview do admin (renderer continua intocado), evitando contagem indevida.

### 4. Segurança e validação
- Sanitizar o `pixel_id` antes de injetar: aceitar apenas dígitos. Nunca interpolar string crua.
- Não logar o pixel_id no console.

---

## Arquivos afetados

- `src/components/admin/landing-page/types.ts` — adicionar `tracking` no `LPContent` e `DEFAULT_CONTENT`.
- `src/components/admin/LandingPageEditor.tsx` — novo accordion "Pixel & Rastreamento" com input do Facebook Pixel ID.
- `src/pages/CustomLandingPage.tsx` — `useEffect` que injeta/remove o snippet do Meta Pixel quando há ID configurado.

Nenhuma migração de banco é necessária — `content` já é JSONB e aceita o novo campo opcional. LPs antigas continuam funcionando (campo é opcional).

---

## Observação

Posso, em um passo seguinte, adicionar também suporte a **Google Tag Manager** e **Google Analytics 4 (gtag)** no mesmo accordion "Pixel & Rastreamento" se você quiser — me avise.
