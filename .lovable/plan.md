## Gerador de LPs no Admin

### 1. Banco de dados (nova migration)

**Tabela `custom_landing_pages`**
- `id uuid pk`
- `slug text unique` (validado, lowercase, sem acentos, contra lista de reservadas)
- `is_published boolean default true`
- `created_by uuid` (admin)
- `theme jsonb` — `{ primary, secondary, background, text, accent }` (cores em HEX)
- `content jsonb` — estrutura completa editável:
  ```
  {
    header: { logo_url, brand_name },
    hero: { title, highlight, subtitle, cta_label, cta_url },
    features: [{ icon, title, description }],         // 3-6 cards
    media: { type: 'youtube'|'image'|'video', url, caption },
    social_proof: {
      title, subtitle,
      testimonials: [{ name, role, photo_url, quote, rating }],
      logos: [{ name, image_url }]
    },
    final_cta: { title, subtitle, button_label, button_url },
    floating_ctas: [                                  // 2 botões fixos que rolam pro CTA final
      { label, scroll_to: 'final_cta' }
    ],
    socials: { instagram, linkedin, youtube, facebook },
    footer: { company_name, cnpj, rights_text }
  }
  ```
- `created_at`, `updated_at`

**RLS**: SELECT público para `is_published=true` (LP é página aberta). INSERT/UPDATE/DELETE apenas `MASTER_ADMIN` via `has_role()`.

**Storage**: usar bucket `creatives` existente OU criar bucket `landing-pages` (público) para logos/imagens/vídeos MP4 das LPs. Recomendo bucket dedicado pra organização.

**Slugs reservados** (validados em trigger ou no frontend antes de salvar):
`admin, auth, leads, my-leads, cart, checkout, checkout-success, checkout-error, checkout-expired, profile, lp, lp-01, lp-obrigado, lp-obrigado-01, reset-password, property-searches, launches, financiamento, giro-do-mercado, nossa-ia, comprar-creditos, calculadora, criativos, portal-imoveis, imovel, planos`

### 2. Roteamento (`src/App.tsx`)

Adicionar **última rota antes do `*`**:
```tsx
<Route path="/:customSlug" element={<CustomLandingPage />} />
```
Como vem por último, todas rotas conhecidas têm prioridade. O componente `CustomLandingPage` busca por slug; se não achar → renderiza `<NotFound />`.

### 3. Página pública `src/pages/CustomLandingPage.tsx`

- Lê `slug` da URL → busca em `custom_landing_pages` via Supabase (RLS pública).
- Renderiza seções na ordem: Header → Hero (CTA principal) → Features → Mídia central → Prova social → CTA final → Footer.
- 2 **floating CTAs** ficam fixos (lado direito ou bottom) e usam `scrollIntoView` para a seção `final_cta`.
- Mídia central: YouTube → iframe embed; imagem → `<img>`; vídeo → `<video controls>` lendo do bucket.
- Cores aplicadas via CSS variables inline no container raiz.
- Botões CTA principais usam `cta_url` (link externo/WhatsApp); abrem em nova aba se externo.
- Redes sociais: ícones do `lucide-react` (Instagram, Linkedin, Youtube, Facebook) só aparecem se URL preenchida.
- Rodapé: nome da empresa + CNPJ (opcional) + texto "© ano · Todos os direitos reservados".
- Tracking de view: insert em nova tabela `landing_page_views` (ou reusar `property_views` schema) — opcional, pode ficar pra v2.

### 4. Admin: novo módulo "Landing Pages"

**`src/components/admin/LandingPagesManagement.tsx`** — lista de LPs criadas:
- Tabela: slug · publicada · criada em · ações (editar, copiar link, abrir, duplicar, excluir).
- Botão **"+ Nova LP"** abre o editor.

**`src/components/admin/LandingPageEditor.tsx`** — editor full-screen split:
- **Coluna esquerda**: formulário accordion por seção (Header, Hero, Features, Mídia, Prova Social, CTA Final, CTAs flutuantes, Redes, Rodapé, Cores, Slug).
- **Coluna direita**: preview ao vivo (mesmo componente da página pública, com dados do form em tempo real).
- Inputs: `Input`, `Textarea`, color picker (input nativo `type="color"`), upload de imagem/vídeo via Supabase storage.
- Botão "Salvar rascunho" (`is_published=false`) e "Publicar".
- Validação de slug: lowercase, sem espaços, contra lista de reservadas, único no banco.

**Integrar no admin**:
- `src/components/admin/AdminLayout.tsx` → adicionar item `{ title: 'Landing Pages', url: '/admin/landing-pages', icon: Globe, group: 'Conteúdo' }`.
- `src/pages/Admin.tsx` → adicionar `'landing-pages': LandingPagesManagement` no map.
- `src/App.tsx` → adicionar `<Route path="/admin/landing-pages" element={<Admin section="landing-pages" />} />` e `<Route path="/admin/landing-pages/:id" element={<Admin section="landing-page-editor" />} />` (ou abrir editor em modal).

### 5. Mídia: upload

- **Imagens** (JPG/PNG/WEBP, ≤ 5MB) → upload direto pro bucket via `supabase.storage`.
- **Vídeo MP4** (≤ 50MB) → upload direto pro bucket. Avisar que arquivos grandes consomem storage.
- **YouTube** → só cola URL; extrair ID com regex e montar `https://www.youtube.com/embed/{id}`.

### 6. O que NÃO entra agora (pra manter escopo)
- Permissão pra parceiros white-label (você confirmou: só admin).
- Formulário de lead embutido (você confirmou: só link externo customizável).
- Analytics avançado de LPs (views/cliques) — pode ser v2.
- Versionamento/histórico de edições.
- A/B testing.

### Arquivos criados/editados
**Novos:**
- `supabase/migrations/{timestamp}_landing_pages.sql`
- `src/pages/CustomLandingPage.tsx`
- `src/components/admin/LandingPagesManagement.tsx`
- `src/components/admin/LandingPageEditor.tsx`
- `src/components/admin/landing-page/SectionPreview.tsx` (componente compartilhado entre editor e página pública)

**Editados:**
- `src/App.tsx` (2 rotas admin + 1 rota catch-slug antes do `*`)
- `src/components/admin/AdminLayout.tsx` (item de menu)
- `src/pages/Admin.tsx` (sections map)

### Risco principal
A rota `/:customSlug` na raiz **captura qualquer 1º segmento desconhecido**. A lista de reservadas precisa estar sincronizada com `App.tsx` — se você adicionar uma rota nova futuramente (ex: `/blog`), tem que adicionar `blog` à lista antes de alguém criar uma LP com esse slug. Vou centralizar a lista num arquivo `src/lib/reservedSlugs.ts` importado pelo editor + pela validação.
