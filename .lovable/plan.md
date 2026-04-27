## Remover mockup + scroll reveal nos cards de funcionalidades (mobile)

### O que muda

**1. Remover a seção do ContainerScroll (mockup do laptop)**
- Apaga o bloco `<section>` que renderiza `<ContainerScroll>` com a imagem do dashboard.
- Remove o import de `ContainerScroll` e do asset `dashboardMockup` em `src/pages/Index.tsx`.
- Mantém o arquivo `src/components/ui/container-scroll-animation.tsx` no projeto (caso queira usar em outro lugar depois). Se preferir apagar de vez, me diga.
- O asset `src/assets/dashboard-mockup.jpg` também fica (não é referenciado por mais ninguém). Posso deletar se quiser.

**2. Novo componente: `src/components/ui/mobile-scroll-feature-card.tsx`**
- Wrapper que aplica scroll-driven animation **apenas no mobile** (`window.innerWidth < 768`).
- Usa `useScroll({ target: ref, offset: ["start end", "end start"] })` + `useTransform` do `framer-motion` para animar:
  - `opacity`: 0 → 1
  - `translateY`: 80px → 0
  - `scale`: 0.85 → 1
- O reveal acontece conforme o card entra na viewport (à medida que a pessoa rola).
- No desktop (≥ 768px) ou se o usuário tiver `prefers-reduced-motion`, renderiza o conteúdo sem qualquer animação — o grid `sm:grid-cols-2 lg:grid-cols-3` continua funcionando normalmente.

**3. Aplicar o wrapper nos cards de funcionalidades em `src/pages/Index.tsx`**
- Envolve cada card do `c.features_section.items.map(...)` com `<MobileScrollFeatureCard>`.
- Remove o `animate-fade-in-up` + `animationDelay` desses cards (substituídos pelo scroll-driven).
- Os cards extras (`c.extras`) ficam como estão (são apenas 2, não justifica o efeito).

### Arquivos

- **Criar**: `src/components/ui/mobile-scroll-feature-card.tsx`
- **Editar**: `src/pages/Index.tsx` (remover seção ContainerScroll, trocar wrapper dos cards de funcionalidades)

### Resultado esperado

- Desktop: visual idêntico ao atual, sem o mockup do laptop.
- Mobile: cada card de funcionalidade aparece com fade + slide-up + scale conforme a pessoa rola, criando aquele efeito "stories" de revelação progressiva.