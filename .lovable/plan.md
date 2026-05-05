## Clonar Página Principal no Gerador de LP

LPs existentes serão migradas visualmente para o novo template (opção A confirmada).

### Estrutura nova de cada LP (espelha a Home)
- **Header** — logo, labels de Entrar/Cadastre-se, CTA do header (link ou form)
- **Hero** — badge, título linha 1 + linha 2 (com destaque), subtítulo, CTA primário e secundário
- **Funcionalidades** — badge, título, subtítulo, **9 cards** (ícone + título + descrição)
- **Extras** — **2 cards** destaque (ícone + título + descrição)
- **Como Funciona** — título, subtítulo, **3 passos**
- **Stats** — **3 itens** (ícone + valor + label)
- **Planos** — badge, título, subtítulo, **4 planos** (nome, preço, sufixo, créditos, lista de features, CTA label + url/mode), nota de rodapé
- **CTA Final** — título, subtítulo, botão (label + url/mode), texto secundário
- **Footer / Socials / Tracking / Floating CTA / cta_form** — preservados

Tudo persistido por LP no JSON `content` da `custom_landing_pages`. Editar uma LP NÃO afeta a Home real do Conectae.

### Arquivos impactados

**Tipos & defaults**
- `src/components/admin/landing-page/types.ts` — reescrever `LPContent` e `DEFAULT_CONTENT` com a nova estrutura; adicionar `LPFeatureCard`, `LPExtraCard`, `LPStep`, `LPStat`, `LPPlan`. Manter `LPSection` opcional (legado).

**Renderer**
- `src/components/landing-page-renderer/LandingPageRenderer.tsx` — copiar JSX de `src/pages/Index.tsx` (header → hero → features → extras → how_it_works → stats → planos → CTA final → footer). CTAs respeitam `mode='link'` (abre URL) ou `mode='form'` (abre modal `cta_form` existente). Preservar floating CTA, socials, tracking.

**Editor admin**
- `src/components/admin/LandingPageEditor.tsx` — substituir accordions pelos da nova estrutura. Cada item de array editável com `IconPicker` (já existe) + Input/Textarea. Editor de planos com lista de features (add/remove). Preview ao vivo continua via `LandingPageRenderer`.

**Compatibilidade com LPs existentes**
- Função de merge runtime em `CustomLandingPage.tsx` e no editor preenche campos novos com defaults. Sem rewrite no banco — LPs antigas adotam o novo layout automaticamente.

### Detalhes técnicos
- Reusa classes globais do Tailwind/`index.css` (`bg-gradient-primary`, `bg-grid-pattern`, etc.) — funcionam dentro da LP sem ajustes.
- `LPTheme` mantido mas sem aplicar override forçado nesta etapa (LP herda tokens do Conectae). Override de cores pode ser ligado depois.
- Cada plano ganha `cta_url` + `cta_mode` para funcionar em LP standalone (sem depender de `/auth`).
- Logo do header reusa o `uploadFile()` já existente.
- Sem migration SQL: shape do JSON é flexível, merge resolve em runtime.
