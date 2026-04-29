## Objetivo

Adicionar um sistema de **formulário de cadastro** integrado aos botões de CTA do gerador de Landing Page, com redirecionamento configurável após envio (ex: para grupo de WhatsApp). Também simplificar o **floating CTA** para ter apenas 1 botão centralizado.

## Mudanças

### 1) Botão de CTA com opção "Formulário de Cadastro"

Hoje os CTAs (Hero, Final CTA e Floating) só têm `cta_label` + `cta_url`. Vou adicionar um novo modo:

- **Tipo de ação do CTA**: `link` (atual) ou `form` (novo)
- Quando for `form`, o admin define:
  - **Campos do formulário** (lista dinâmica): cada campo tem `label`, `type` (`text` | `email` | `phone`), `required` (sim/não)
    - Campos pré-sugeridos: Nome, Telefone, E-mail
    - Admin pode adicionar/remover/renomear/reordenar
  - **URL de redirecionamento** após envio (ex: link do grupo de WhatsApp)
  - **Texto do botão de envio** do formulário (ex: "Quero entrar no grupo")
  - **Mensagem opcional** acima do formulário

### 2) Página pública de cadastro vinda do CTA

- Ao clicar no botão CTA do tipo `form`, abre um **modal** (dialog) com o formulário configurado dentro da própria LP — fluxo mais rápido e sem perder contexto/pixel
- Submissão:
  - Salva os dados em `lead_submissions` (tabela já existente, com RLS de insert anônimo)
  - `intention = 'BUY'` (default), `form_data` recebe o JSON dos campos extras, `name`/`phone`/`email` do formulário
  - Dispara evento do Facebook Pixel `Lead` se configurado
  - Após sucesso, **redireciona** para a URL configurada (grupo de WhatsApp etc.) em nova aba e mostra tela de confirmação

### 3) Floating CTA: apenas 1 botão, centralizado

- Remove o array de 2 botões → vira **1 único** floating CTA
- Migração suave: ao carregar conteúdo antigo com `floating_ctas[]`, usa só o primeiro item
- Admin edita: ativar/desativar, **mudar nome**, e — coerente com o item 1 — escolher se ele é `link` (URL) ou `form` (abre o modal de cadastro com sua própria config)
- Posicionamento: `fixed bottom-4 left-1/2 -translate-x-1/2` (centralizado horizontalmente)

### 4) Editor admin (LandingPageEditor)

Em cada bloco de CTA (Hero, Final CTA, Floating CTA), adiciono uma seção:

```text
Tipo do botão: ( ) Link direto   ( ) Abrir formulário
[se Link]   URL: ____________________
[se Form]   - Botão de envio: ____________
            - Redirecionar para: ____________ (ex: link do grupo)
            - Mensagem topo (opcional): ____
            - Campos:
              [Nome]       tipo [texto▾]   [obrigatório ✓]   [remover]
              [Telefone]   tipo [telefone▾][obrigatório ✓]   [remover]
              [E-mail]     tipo [email▾]   [obrigatório  ]   [remover]
              [+ Adicionar campo]
```

Para evitar duplicação, os 3 CTAs podem **compartilhar a mesma config de formulário** (campo `content.cta_form`) e cada CTA só escolhe `mode: 'link' | 'form'`. Isso simplifica a UX (admin configura o formulário 1 vez).

### Detalhes técnicos

**Tipos (`landing-page/types.ts`)**:
```ts
type CTAMode = 'link' | 'form';
interface LPCTAFormField { id: string; label: string; type: 'text'|'email'|'phone'; required: boolean }
interface LPCTAForm {
  enabled: boolean;
  intro_text: string;          // mensagem opcional no topo do modal
  submit_label: string;        // texto do botão de envio
  redirect_url: string;        // p/ onde manda após cadastro
  fields: LPCTAFormField[];
}
// hero.cta_mode, final_cta.button_mode, floating_cta.mode
// novo: content.cta_form: LPCTAForm
// floating_ctas[] -> floating_cta (objeto único). Migração mantém leitura do array.
```

**Renderer (`LandingPageRenderer.tsx`)**:
- Helper `renderCtaButton({ mode, label, url, style, size })` → se `mode==='form'` abre o modal, senão `<a href={url}>`
- Novo componente `LPLeadFormModal` com:
  - `react-hook-form` + `zod` (validação client-side: nome 2-100, telefone 10-15 dígitos, email opcional)
  - Insert em `lead_submissions`
  - `window.fbq?.('track','Lead')` se houver pixel
  - Em sucesso: `window.open(redirect_url, '_blank')` e mostra confirmação
- Floating CTA: 1 só, `fixed bottom-4 left-1/2 -translate-x-1/2`, sem `flex-col`

**Editor (`LandingPageEditor.tsx`)**:
- Novo accordion item "Formulário de Cadastro" (config única do `cta_form`)
- Em cada CTA já existente, um `RadioGroup` para o modo + condicionalmente esconde o campo URL quando for `form`
- Substitui a lista `floating_ctas[]` por edição do `floating_cta` único

**Defaults (`DEFAULT_CONTENT`)**:
- `cta_form`: 3 campos (Nome obrigatório, Telefone obrigatório, E-mail opcional), `submit_label: 'Quero participar'`, `redirect_url: ''`
- `floating_cta: { mode: 'link', label: 'Quero Falar Agora', enabled: true }`
- Mantém leitura retrocompatível de `floating_ctas[]` antigo

**Sem migração de banco**: usa a tabela `lead_submissions` que já aceita insert anônimo. Os campos extras vão em `form_data`.

### Arquivos a editar
- `src/components/admin/landing-page/types.ts` — novos tipos, defaults, mode nos CTAs
- `src/components/admin/LandingPageEditor.tsx` — UI de configuração (form + modos + floating único)
- `src/components/landing-page-renderer/LandingPageRenderer.tsx` — modal, helper de CTA, floating centralizado
- `src/pages/CustomLandingPage.tsx` — apenas merge defaults p/ `cta_form` e `floating_cta` (retrocompat)

Sem mudanças em rotas ou banco de dados.
