## Redesign da LP + integração do ContainerScroll

Vou elevar o design da página principal (`/`) deixando-a mais "premium" e moderna, e incluir o componente de scroll animation (mockup do dashboard que rotaciona ao rolar) logo antes/dentro da seção de funcionalidades.

### O que vai mudar

**1. Novo componente reutilizável**
- `src/components/ui/container-scroll-animation.tsx` — adaptação do componente fornecido (com 2 ajustes: tipagem TS correta para `MotionValue`, e remoção do `"use client"` / `next/image` — não usamos Next).
- Imagens: vou usar um screenshot real do próprio dashboard de Leads do app (capturada via `<img>` com fallback Unsplash) renderizado dentro do "laptop frame" do scroll. Pergunto abaixo qual fonte usar.

**2. Instalar dependência**
- `framer-motion` (necessário para o efeito de scroll/rotate/scale).

**3. Redesign do `src/pages/Index.tsx`**
Mantendo 100% do conteúdo editável pelo admin (`useHomeContent`), apenas evoluindo o visual:

- **Header**: efeito de blur mais forte, borda gradiente sutil, animação de fade-in no logo.
- **Hero**:
  - Background com **grid pattern** + **blobs de gradiente** animados (radial gradients usando `--primary` e `--secondary`).
  - Badge com glow/ring sutil.
  - Título maior, com gradiente animado no `title_line2` (clip-text).
  - Indicadores de "trust" abaixo dos CTAs (linha com 3 ícones: estrelas, usuários, suporte) — usando dados de `c.stats`.
- **Seção ContainerScroll (NOVA)** — entre Hero e Funcionalidades:
  - Título: "Veja sua operação em um só lugar".
  - Dentro do "laptop", screenshot do dashboard / leads do produto (mockup).
  - Cria efeito wow logo no primeiro fold pós-hero.
- **Funcionalidades**:
  - Cards com glassmorphism leve (`backdrop-blur` + borda gradiente no hover).
  - Ícone com fundo em gradiente (primary→secondary) em vez de fundo chapado.
  - Animação `animate-fade-in` em entrada (escalonada via `style={{animationDelay}}`).
  - Linha decorativa conectando o número (em "extras", layout horizontal mais rico).
- **Como funciona**:
  - Linha pontilhada conectando os 3 passos (desktop).
  - Círculos numerados com gradiente + glow.
- **Stats**:
  - Container com fundo escuro/gradiente em vez de transparente, contraste maior.
  - Números em cor accent, com pequena animação ao entrar no viewport.
- **Planos**: mantém estrutura, mas:
  - Card "Performance" com border gradiente animada (efeito conic-gradient sutil).
  - Sombras mais suaves, mais respiro vertical.
- **CTA Final**:
  - Background com pattern de pontos + glow.
  - Botão branco com ring animado.
- **Footer mínimo NOVO** (só visual): logo + copyright + 3 links (Termos, Privacidade, Contato) — sem editor por enquanto, hardcoded.

**4. Pequenos utilitários CSS em `src/index.css`**
- Keyframes adicionais: `gradient-shift`, `float-slow`, `pulse-glow`.
- Classes utilitárias: `.bg-grid-pattern`, `.bg-dots-pattern`, `.text-gradient-primary`.

### Detalhes técnicos

- **Não toco no schema do banco** nem no `HomeContent`. Todo o conteúdo continua vindo de `useHomeContent`/override de preview.
- O `ContainerScroll` é puramente visual; o conteúdo interno (mockup) é hardcoded por enquanto. Se você quiser depois, dá pra promover a imagem do mockup para campo editável no admin (próxima iteração).
- Acessibilidade: respeita `prefers-reduced-motion` (desativa animações pesadas).
- Mobile: ContainerScroll já tem comportamento mobile próprio; demais animações degradam bem em telas pequenas.

### Arquivos

- **Criar**: `src/components/ui/container-scroll-animation.tsx`
- **Editar**: `src/pages/Index.tsx`, `src/index.css`, `package.json` (via `bun add framer-motion`)

### Pergunta antes de implementar

Sobre o "mockup" que vai dentro do laptop do ContainerScroll: