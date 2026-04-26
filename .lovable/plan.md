
## Objetivo

Tornar **toda** a copy, ícones, cards, logo e textos da **Página Principal** (`/` → `src/pages/Index.tsx`) editáveis a partir do admin, sem alterar o visual atual da home.

A edição vive dentro de **Landing Pages** como um item fixo no topo da lista chamado **"Página Principal (home)"**, separado das LPs de slug livre que você já tem.

---

## 1. Banco de dados (1 migration)

Crio uma tabela nova **`home_page_content`** (singleton — apenas 1 linha permitida via constraint) para guardar o conteúdo da home. Não reaproveito `custom_landing_pages` porque a estrutura de dados é diferente (planos, 9 cards fixos, header de auth, etc.).

```
home_page_content
├── id            uuid PK
├── singleton     boolean UNIQUE DEFAULT true   -- garante 1 linha só
├── content       jsonb  (estrutura abaixo)
├── updated_by    uuid
├── updated_at    timestamptz
└── created_at    timestamptz
```

**RLS**:
- `SELECT` público (anon + authenticated) — a home é pública.
- `INSERT/UPDATE/DELETE` apenas `MASTER_ADMIN` via `has_role()`.

**Seed**: insiro a primeira (e única) linha com o conteúdo atual hard-coded da `Index.tsx` como default, então nada quebra ao publicar.

### Estrutura do JSON `content`

```ts
type HomeContent = {
  header: {
    brand_logo_url: string;     // se vazio → usa <BrandLogo/> textual
    show_login_button: boolean; // padrão true
    login_label: string;        // "Entrar"
    signup_label: string;       // "Cadastre-se"
  };
  hero: {
    badge_text: string;         // "✨ Plano grátis disponível • Sem cartão de crédito"
    title_line1: string;        // "O hub completo do"
    title_line2: string;        // "corretor de imóveis moderno" (em destaque)
    subtitle: string;
    cta_primary_label: string;  // "Começar grátis"
    cta_secondary_label: string;// "Ver planos"
  };
  features_section: {
    badge: string;              // "Funcionalidades"
    title: string;
    subtitle: string;
    items: [9 cards FIXOS]      // {icon, title, desc} — sempre 9, só edita conteúdo
  };
  extras: [2 cards FIXOS]       // Educação e Jurídico — {icon, title, desc}
  how_it_works: {
    title: string;
    subtitle: string;
    steps: [3 passos FIXOS]     // {title, desc}
  };
  stats: {
    items: [3 stats FIXOS]      // {icon, value, label}
  };
  plans_section: {
    badge: string;              // "Planos"
    title: string;              // "Escolha seu plano"
    subtitle: string;
    plans: [4 planos FIXOS]     // slug travado: conexao/essencial/performance/elite
                                // Editáveis: name, price, priceSuffix, credits, cta, features[]
    footer_note: string;        // "Cobrança mensal recorrente..."
  };
  final_cta: {
    title: string;
    subtitle: string;
    cta_label: string;
    secondary_text: string;     // "Já tem cadastro? Acesse agora"
  };
};
```

**Validação na UI**: campos travados em 9/2/3/3/4 quantidades. Admin só edita `icon`, `title`, `desc`, `value`, etc. — não pode adicionar/remover. Slugs dos planos ficam travados (apenas mostrados como label, não editáveis), porque o sistema de auto-checkout depende deles (`conexao/essencial/performance/elite`).

---

## 2. Frontend — refatorar `Index.tsx`

`src/pages/Index.tsx` deixa de ter as constantes `FEATURES` e `PLANS` hard-coded. Em vez disso:

1. Carrega `home_page_content` via `useQuery` no mount (com fallback para os defaults atuais caso a tabela esteja vazia).
2. Renderiza exatamente o mesmo JSX/estilo de hoje, mas lendo de `content.*`.
3. Lógica de auto-checkout dos planos (`handlePlanSelect`) **não muda** — continua usando os slugs travados.
4. Ícones: cada card guarda só o nome do ícone (`"Target"`, `"Handshake"`...). Resolução em runtime via `lucide-react` dinâmico (mesma técnica já usada no `LandingPageRenderer`).
5. Loading skeleton enquanto busca conteúdo.

Resultado: visual idêntico ao atual, mas todo o texto e ícones vêm do banco.

---

## 3. Admin — novo editor dedicado

### 3.1. Lista de LPs (`LandingPagesManagement.tsx`)

Adiciono no topo da lista um **card fixo destacado** — não vem do banco `custom_landing_pages`, é um item visual hard-coded:

```
┌────────────────────────────────────────────────────────────────────┐
│ 🏠  Página Principal (home)              [Sempre visível em /]      │
│     Editar hero, features, planos, CTA, logo e toda a copy          │
│                                  [Ver home] [Editar página]        │
└────────────────────────────────────────────────────────────────────┘
─────────────  Landing pages com slug livre  ─────────────
┌── lista atual (custom_landing_pages) ──┐
```

O botão "Editar página" leva para `/admin/home-page`.

### 3.2. Novo editor: `HomePageEditor.tsx`

Componente novo em `src/components/admin/home-page/HomePageEditor.tsx` com **tabs verticais**, cada uma para um bloco da home:

| Tab | O que edita |
|---|---|
| 🎨 Cabeçalho | Upload do logo (ou usa textual), rótulos dos botões Entrar/Cadastre-se, toggle pra esconder Entrar |
| 🚀 Hero | Badge, título linha 1 e 2 (destaque), subtítulo, label dos 2 CTAs |
| ⚡ Funcionalidades (9) | Badge da seção, título, subtítulo + 9 cards (ícone via Select com 30+ ícones, título, descrição) |
| 🎓 Serviços extras (2) | Os 2 cards "Educação Conectaae" e "Suporte Jurídico" (ícone, título, descrição) |
| 📋 Como funciona (3) | Título da seção, subtítulo + 3 passos (título, descrição) |
| 📊 Stats (3) | 3 itens (ícone, número grande, legenda) |
| 💰 Planos (4) | Badge, título, subtítulo + 4 planos (nome, preço, sufixo, créditos, label do CTA, lista de features adicionável/removível dentro do plano) — slug travado e exibido como badge |
| 🎯 CTA Final | Título, subtítulo, label do botão, texto "Já tem cadastro? Acesse agora" |
| 👁 Preview | Renderiza o `Index.tsx` com o conteúdo atualmente em edição (modo preview) |

Cada tab tem auto-save desabilitado — botão **"Salvar"** no topo persiste tudo de uma vez. Botão **"Restaurar padrão"** com confirmação reseta para o conteúdo original.

**Componentes reaproveitáveis**:
- `IconPicker` — Select com preview do ícone Lucide.
- `ImageUploadField` — já existe no `LandingPageEditor`, extraio para `src/components/admin/shared/ImageUploadField.tsx` e reuso nos dois editores. Upload vai para o bucket `landing-pages` que já existe.

### 3.3. Roteamento

- Rota nova `/admin/home-page` em `App.tsx`.
- Adiciono `'home-page': HomePageEditor` no map de seções de `src/pages/Admin.tsx`.
- O sidebar do admin **não ganha item separado** (decisão sua: fica dentro de Landing Pages como item fixo).

---

## 4. Arquivos criados / alterados

**Novos**
- `supabase/migrations/<ts>_home_page_content.sql` — tabela + RLS + seed.
- `src/components/admin/home-page/types.ts` — tipos do `HomeContent` + defaults.
- `src/components/admin/home-page/HomePageEditor.tsx` — editor principal com tabs.
- `src/components/admin/home-page/tabs/` — um arquivo por tab (HeaderTab, HeroTab, FeaturesTab, ExtrasTab, HowItWorksTab, StatsTab, PlansTab, FinalCtaTab, PreviewTab).
- `src/components/admin/shared/ImageUploadField.tsx` — extraído do editor de LP.
- `src/components/admin/shared/IconPicker.tsx` — Select de ícones Lucide com preview.
- `src/hooks/useHomeContent.ts` — hook que faz `useQuery` da tabela com fallback default.

**Alterados**
- `src/pages/Index.tsx` — remove constantes hard-coded, lê do hook, mantém visual.
- `src/pages/Admin.tsx` — adiciona `'home-page'` ao map.
- `src/App.tsx` — adiciona rota `/admin/home-page`.
- `src/components/admin/LandingPagesManagement.tsx` — adiciona card fixo no topo "Página Principal (home)" + separador antes da lista atual.

**Não toco**
- `LandingPageEditor.tsx` (editor de LPs com slug livre) — fica como está, finalidades diferentes.
- Lógica de auto-checkout dos planos (`pendingPlan.ts`, `Planos.tsx`, `MultiStepSignup.tsx`) — slugs continuam travados.
- White-label/PartnerContext — quando `isPartnerSite=true`, a home continua mostrando a marca do parceiro e ignora o `home_page_content`.

---

## 5. Como você vai usar (depois de aprovar)

1. Vai em **Admin → Landing Pages**.
2. Clica no card destacado **"Página Principal (home)"** no topo.
3. Cai numa tela com tabs laterais. Em cada tab edita o que quiser (texto, ícones, upload de logo, planos, etc.).
4. Clica **"Preview"** pra ver como ficou antes de publicar.
5. Clica **"Salvar"** — qualquer pessoa que abrir `/` já vê o novo conteúdo.

Tudo o que está hoje na home (header, hero, 9 cards, 2 extras, como funciona, stats, 4 planos, CTA final, "Já tem cadastro?") fica editável. O visual continua **exatamente** o mesmo da home atual.
