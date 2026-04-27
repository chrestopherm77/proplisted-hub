## Objetivo

1. Aumentar o tamanho da logo Conectae no header da landing page.
2. Substituir o `BrandLogo` (ícone "predinho" + texto "Conectaae imob") pela imagem `conectae-logo.png` em todo o sistema (header LP, sidebar, admin, auth, lead form, thank you, mobile menu).

---

## Mudanças propostas

### 1. Refatorar `src/components/BrandLogo.tsx` para usar a imagem

Substituir a lógica atual (ícone Lucide `Building2` + texto) por uma `<img>` da logo Conectae. Mantém:
- a mesma API (`size`, `className`, `hideIcon`) para não quebrar nenhum chamador,
- escala generosa por tamanho para a logo ficar visível.

```tsx
import conectaeLogo from '@/assets/conectae-logo.png';
import { cn } from '@/lib/utils';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  hideIcon?: boolean; // mantido por compatibilidade, ignorado
}

const SIZE_MAP = {
  sm: 'h-8',         // antes ~text-base
  md: 'h-12',        // antes text-xl  → bem maior
  lg: 'h-16',        // antes text-2xl
  xl: 'h-20 md:h-24',// antes text-3xl/4xl
};

export const BrandLogo = ({ size = 'md', className }: BrandLogoProps) => (
  <img
    src={conectaeLogo}
    alt="Conectae"
    className={cn('w-auto object-contain select-none', SIZE_MAP[size], className)}
    draggable={false}
  />
);
```

Como o componente já é importado em todos os lugares relevantes, a troca propaga automaticamente para:
- Header da Landing Page (`src/pages/Index.tsx`) — `size="md"` → vira `h-12` (≈48px), bem maior que o atual.
- Sidebar (`src/components/AppSidebar.tsx`) — collapsed `sm` (h-8) / expanded `md` (h-12).
- Admin (`src/components/admin/AdminLayout.tsx`) — mesmo comportamento.
- Layout principal (`src/components/Layout.tsx`).
- Auth (`src/pages/Auth.tsx`) — `size="lg"` (h-16).
- LeadForm / LeadForm01 / ThankYou / ThankYou01 — `size="lg"` (h-16).
- MobileMenu — `size="sm"` (h-8).
- Footer da Landing Page — `size="sm"` (h-8).

### 2. Aumentar a logo no header da Landing Page

Em `src/pages/Index.tsx`, o header hoje usa `<BrandLogo size="md" />`. Após a mudança acima ela já fica `h-12`. Para ficar ainda mais destacada no header (que tem `py-3`), trocamos para `size="lg"`:

```tsx
<BrandLogo size="lg" />
```

Isso deixa a logo com altura `h-16` (~64px) no header, ficando bem visível e proporcional.

### 3. Compatibilidade com white-label e logo customizada

- Quando `isWhiteLabel` ou `c.header.brand_logo_url` estiver setado, `Index.tsx` continua usando `<img>` próprio do parceiro/admin (já é o caso hoje) — apenas aumentamos a altura também:
  - `className="h-14 md:h-16 max-w-[220px] object-contain"` (hoje é `h-10 max-w-[180px]`).
- Footer mantém logo do parceiro com altura levemente maior: `h-10 max-w-[160px]` (hoje `h-7`).

---

## Arquivos afetados

- `src/components/BrandLogo.tsx` — refatorar para renderizar `conectae-logo.png` com escala maior por tamanho.
- `src/pages/Index.tsx` — header: trocar `size="md"` → `size="lg"`; aumentar `<img>` do white-label/custom logo no header e footer.

Nenhuma mudança necessária nos outros chamadores — eles herdam o novo visual automaticamente.