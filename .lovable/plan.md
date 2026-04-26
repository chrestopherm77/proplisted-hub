## 🎯 Objetivo

Reformular completamente a Landing Page principal (`/`) com a nova marca **Conectaae Imob**, destacando todas as funcionalidades do sistema, planos e CTAs de conversão. Aplicar o novo nome em cabeçalhos visíveis (logo, título da aba, footer) — mantendo intactos os termos jurídicos e a configuração de domínio multi-tenant.

---

## 🏷️ Marca: Conectaae Imob

- Logo textual estilizado: **Conectaae** em peso bold + **imob** em peso regular com cor primária (mantemos as cores atuais do tema).
- Sem PNG novo — uso tipografia + ícone simples (`Building2` ou `Network` do lucide-react) ao lado do nome.

### 💡 Sugestões alternativas de nome (caso queira reconsiderar depois)

Curtos, vibrantes e ligados ao mercado imobiliário:

| Nome | Vibe |
|---|---|
| **Imobix** | Tecnologia + imob, fácil de memorizar |
| **Corretta** | Direto ao corretor, soa profissional |
| **Casabay** | Casa + hub (similar ao atual, suave) |
| **Lardo** | Curto, único, "lar" + final marcante |
| **Conecta Imob** | Versão simplificada da escolha atual |
| **ImobHub** | "Hub" comunica bem o conceito da plataforma |
| **Vendae** | Verbo de ação, foco em resultado |
| **Predo** | Curtíssimo, premium, fácil |
| **Imobi** | Direto, brasileiro, memorável |
| **CorretorPro** | Foco no profissional |

> Vou seguir com **Conectaae Imob** conforme aprovado. Esses ficam como referência caso queira pivotar.

---

## 📐 Nova estrutura da LP (`/` — `src/pages/Index.tsx`)

### 1. Header
- Logo textual "Conectaae **imob**" + botão "Entrar" / "Cadastre-se".
- Sticky com leve blur ao rolar.

### 2. Hero
- **Título**: "O hub completo do corretor de imóveis moderno"
- **Subtítulo**: "Leads qualificados, parcerias, lançamentos, portal de imóveis, IA, criativos e muito mais — tudo em uma única plataforma."
- 2 CTAs: "Começar grátis" → `/auth` e "Ver planos" → âncora `#planos`.
- Badge: "Plano grátis disponível • Sem cartão de crédito"

### 3. Seção "Tudo que você precisa para vender mais" (9 funcionalidades)

Grid 3×3 (responsivo) com card para cada feature, cada um com ícone lucide-react, título e copy persuasiva:

| # | Funcionalidade | Ícone | Copy curta |
|---|---|---|---|
| 1 | **Leads Disponíveis** | `Target` | "Compre leads de clientes prontos para fechar. Pague só pelo lead que escolher." |
| 2 | **Balcão de Parcerias** | `Handshake` | "Tem cliente sem imóvel? Publique e encontre o corretor que tem o match perfeito." |
| 3 | **Lançamentos** | `Building2` | "Acesso direto a lançamentos de construtoras parceiras para você vender." |
| 4 | **Portal de Imóveis** | `Home` | "Publique seus imóveis e deixe outros corretores se afiliarem para vender." |
| 5 | **Financiamento** | `Banknote` | "Suporte completo no financiamento dos seus clientes do início ao fim." |
| 6 | **Criativos com IA** | `Sparkles` | "Gere criativos profissionais para suas redes sociais em segundos." |
| 7 | **Calculadora de Emolumentos** | `Calculator` | "Calcule emolumentos por estado com precisão antes de fechar negócio." |
| 8 | **IA de Atendimento** | `Bot` | "Sua IA exclusiva para atender clientes 24/7 sem perder oportunidade." |
| 9 | **Notícias do Mercado** | `Newspaper` | "Fique por dentro das tendências e dados do mercado imobiliário diariamente." |

Mais 2 cards de **serviços extras** (largura completa, abaixo do grid):
- 🎓 **Educação Conectaae**: "Treinamentos básicos, intermediários e Hot Seats com especialistas."
- ⚖️ **Suporte Jurídico**: "Serviços jurídicos sob demanda para você operar com segurança total."

### 4. Como funciona (3 passos)
1. **Cadastre-se grátis** → comece sem custo
2. **Escolha seu plano** → mais créditos, mais resultado
3. **Use todas as ferramentas** → leads, parcerias, IA e mais

### 5. Stats de prova social
Mantém os 3 stats atuais, atualizando textos:
- 500+ Corretores ativos · 2.000+ Negócios viabilizados · 24/7 Suporte

### 6. **Seção Planos** (nova, completa, com âncora `#planos`)
4 cards lado a lado (grid responsivo 1/2/4 colunas):

- **Conexão** — Grátis · 10 créditos/mês — features resumidas → CTA "Começar grátis" → `/auth`
- **Essencial** — R$ 39,90/mês · 30 créditos — → CTA "Assinar" → `/auth?next=/planos`
- **Performance** — R$ 79,90/mês · 430 créditos — **badge "Mais Popular"** + destaque visual → CTA "Assinar"
- **Elite** — R$ 149,90/mês · 1.000 créditos — → CTA "Assinar"

Cada card mostra preço, créditos/mês e top 5-6 benefícios (lista completa com `Check`).
Texto abaixo: "Cancele quando quiser · Cobrança mensal recorrente"

### 7. CTA final
Banner gradiente: "Pronto para vender mais imóveis?" + botão "Criar conta grátis"

### 8. Footer
Logo textual + © 2025 Conectaae Imob.

---

## 🔧 Arquivos a editar

| Arquivo | Mudança |
|---|---|
| `src/pages/Index.tsx` | **Reescrita completa** seguindo a estrutura acima |
| `index.html` | `<title>` + meta tags og/twitter: "Conectaae Imob" |
| `src/components/Layout.tsx` | Trocar `<img leadbayLogo>` por componente `<BrandLogo>` textual + footer "Conectaae Imob" |
| `src/components/AppSidebar.tsx` | Trocar logo por `<BrandLogo>` textual (mantém fallback para partner) |
| `src/components/MobileMenu.tsx` | Trocar logo por `<BrandLogo>` textual |
| `src/components/admin/AdminLayout.tsx` | Trocar logo por `<BrandLogo>` textual |
| `src/pages/Auth.tsx` | Logo textual + título "Entrar no Conectaae Imob" |
| `src/pages/ThankYou.tsx` / `ThankYou01.tsx` | Logo textual |
| `src/pages/LeadForm.tsx` / `LeadForm01.tsx` | Logo textual |
| `src/pages/Indicar.tsx` | Atualizar mensagem WhatsApp para "Conhece o Conectaae Imob:..." |
| `src/components/BrandLogo.tsx` | **NOVO** componente reutilizável (props: `size`, `variant`) |

### Não vou alterar nesta rodada (preservados):
- `src/components/auth/constants/registrationTerms.ts` — termos jurídicos com "LEADBAY" (você decidiu manter)
- `src/contexts/PartnerContext.tsx` — lista de domínios `leadbay.com.br` (afeta white-label)
- `src/assets/leadbay-logo.png` — fica como fallback para sites parceiros que não têm logo próprio
- `src/pages/Launches.tsx` linha 252 — mensagem WhatsApp hardcoded de admin (revisamos depois se quiser)

---

## 🧩 Componente novo: `BrandLogo.tsx`

```tsx
// src/components/BrandLogo.tsx
interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const BrandLogo = ({ size = 'md', className }: BrandLogoProps) => {
  const sizes = { sm: 'text-lg', md: 'text-xl', lg: 'text-3xl' };
  return (
    <div className={cn('flex items-center gap-1.5 font-display', className)}>
      <Building2 className="text-primary" />
      <span className={cn('font-bold tracking-tight', sizes[size])}>
        Conectaae<span className="font-light text-muted-foreground">imob</span>
      </span>
    </div>
  );
};
```

Em sites de parceiros (white-label), continuamos exibindo o logo PNG do parceiro — o `BrandLogo` só aparece quando `!isPartnerSite`.

---

## ✅ Resultado esperado

- Página inicial moderna mostrando todas as 9 funcionalidades + 2 serviços extras + 4 planos com CTAs claros.
- Marca "Conectaae Imob" aparece em todos os cabeçalhos visíveis: aba do navegador, header, sidebar, menu mobile, admin, auth, lead forms, thank you e indicar.
- White-label de parceiros continua funcionando perfeitamente (logo do parceiro tem prioridade).
- Termos jurídicos e configuração de domínio intactos.

Próximo passo após aprovar: implemento tudo na próxima resposta.