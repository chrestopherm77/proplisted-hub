# Adicionar seções editáveis ao gerador de LP

Hoje a LP customizável tem **6 blocos fixos** (Header, Hero, Features, Mídia, Prova Social, CTA Final, Footer). Vou adicionar **4 novos tipos de seção** replicando a página inicial da Leadbay e implementar um **sistema de seções dinâmicas** onde você adiciona, remove e reordena livremente.

## 1. Novos tipos de seção (replicados da Leadbay)

Cada uma vira um "bloco" plugável dentro de um array `sections[]` no `content` da LP:

### a) `how_it_works` — Como Funciona
3 passos numerados (círculo com 1, 2, 3) + título + descrição. Cada item editável; suporta de 2 a 6 passos.

### b) `stats` — Estatísticas
3 cards com ícone Lucide + número grande (ex: "500+") + label (ex: "Corretores Ativos"). Cor primária do tema. 2 a 6 itens.

### c) `benefits` — Benefícios
Lista vertical de itens com check verde + título + descrição em cards brancos. Igual ao "Benefícios Exclusivos". 2 a 8 itens.

### d) `faq` — Perguntas Frequentes
Accordion de pergunta/resposta. 1 a 12 itens. Tipo extra que não existe na Leadbay original mas pediu.

## 2. Sistema de seções dinâmicas

### Estrutura de dados (em `LPContent`)
Adicionar um novo campo `sections: LPSection[]` que vive **entre a Mídia e a Prova Social** na renderização. Os blocos antigos (Hero, Features, Mídia, Prova Social, CTA Final) continuam fixos para não quebrar LPs existentes.

```ts
type LPSection =
  | { id: string; type: 'how_it_works'; title: string; subtitle: string; steps: { title: string; description: string }[] }
  | { id: string; type: 'stats'; items: { icon: string; value: string; label: string }[] }
  | { id: string; type: 'benefits'; title: string; items: { title: string; description: string }[] }
  | { id: string; type: 'faq'; title: string; items: { question: string; answer: string }[] };
```

Cada seção tem `id` único (UUID) para servir de chave do drag & drop e do React.

### Template padrão da Leadbay
LPs novas começam com `sections` pré-populado nesta ordem (idêntico à Leadbay):
1. `how_it_works` (Escolha o Lead → Pagamento → Contato)
2. `stats` (500+ Corretores, 2.000+ Leads, 24/7 Suporte)
3. `benefits` (4 itens com check)
4. `faq` (vazio por padrão, opcional)

LPs já existentes recebem `sections: []` no merge com `DEFAULT_CONTENT` — não quebra nada.

### Drag & drop no editor
Usar **`@dnd-kit/core` + `@dnd-kit/sortable`** (já é o padrão Lovable, leve e acessível). Cada bloco vira um card com:
- Handle de arrastar (ícone `GripVertical`)
- Botão "Editar" (expande accordion interno)
- Botão "Duplicar" (clona com novo `id`)
- Botão "Remover" (`Trash2`)

Botão **"+ Adicionar seção"** no final abre um menu (popover) com os 4 tipos disponíveis. Ao escolher, adiciona um bloco novo com conteúdo padrão.

## 3. Ordem final de renderização na LP

Header → Hero → Features → Mídia → **[sections dinâmicas na ordem definida]** → Prova social → CTA final → Footer → Floating CTAs

Isso mantém a ordem da Leadbay como você pediu, e ainda permite remover/reordenar tudo do meio.

## 4. Arquivos a editar/criar

- **`src/components/admin/landing-page/types.ts`**: adicionar tipos `LPSection`, `LPHowItWorksSection`, `LPStatsSection`, `LPBenefitsSection`, `LPFaqSection` e o array `sections` em `LPContent`. Atualizar `DEFAULT_CONTENT` com o template da Leadbay.

- **`src/components/landing-page-renderer/LandingPageRenderer.tsx`**: adicionar bloco que itera `content.sections` e renderiza o componente certo por tipo. Cada tipo respeita o tema (cores `theme.primary`, `theme.text`, `theme.background`, `theme.accent`).

- **`src/components/admin/landing-page/SectionsEditor.tsx`** (novo): componente isolado com drag & drop e os 4 sub-editores (`HowItWorksEditor`, `StatsEditor`, `BenefitsEditor`, `FaqEditor`).

- **`src/components/admin/LandingPageEditor.tsx`**: encaixar `<SectionsEditor>` dentro do accordion principal entre "Mídia" e "Prova social". Ajustar o merge no `useEffect` para incluir `sections`.

- **Dependência**: instalar `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` (provavelmente já presentes — verificar `package.json`; se não, `bun add`).

## 5. Compatibilidade com LPs já criadas

LPs salvas hoje **não têm** `sections` no JSON. O loader já faz spread com `DEFAULT_CONTENT`, então `sections` virá `[]` para LPs antigas — elas continuam funcionando exatamente como estão. O admin pode entrar e adicionar seções manualmente quando quiser.

## 6. O que **não** muda

- Slug, tema, header, hero, features, mídia, prova social, CTA final, footer, floating CTAs, redes sociais — tudo igual.
- Banco: nenhuma migration necessária (tudo cabe no `content jsonb`).
- Renderização pública em `/{slug}` continua igual; só ganha mais blocos no meio.

Quando aprovar, eu implemento.