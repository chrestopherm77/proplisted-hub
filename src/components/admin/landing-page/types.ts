// ============================================================================
// Tipos da LP customizável (Gerador de LPs).
// A partir de 2026-05, o template padrão clona a Página Principal do Conectae.
// Mantemos campos antigos como OPCIONAIS para retrocompat com LPs já criadas.
// ============================================================================

export interface LPTheme {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  accent: string;
}

// ===== Tipos compartilhados =====
export type LPCTAMode = 'link' | 'form';

export interface LPCTAFormField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'phone';
  required: boolean;
}

export interface LPCTAForm {
  intro_text: string;
  submit_label: string;
  redirect_url: string;
  fields: LPCTAFormField[];
}

export interface LPFloatingCTA {
  label: string;
  enabled: boolean;
  mode?: LPCTAMode;
  url?: string;
}

// ===== Cards / itens novos (espelham a Home) =====
export interface LPFeatureCard {
  icon: string;
  title: string;
  desc: string;
}

export interface LPExtraCard {
  icon: string;
  title: string;
  desc: string;
}

export interface LPStep {
  title: string;
  desc: string;
}

export interface LPStat {
  icon: string;
  value: string;
  label: string;
}

export interface LPPlan {
  name: string;
  price: string;
  priceSuffix: string;
  credits: string;
  features: string[];
  cta_label: string;
  cta_mode?: LPCTAMode;
  cta_url?: string;
  highlight?: 'popular' | 'premium' | null;
}

// ===== Seções dinâmicas (LEGADO — mantidas só para LPs antigas) =====
export interface LPHowItWorksSection {
  id: string; type: 'how_it_works';
  title: string; subtitle: string;
  steps: { title: string; description: string }[];
}
export interface LPStatsSection {
  id: string; type: 'stats';
  items: { icon: string; value: string; label: string }[];
}
export interface LPBenefitsSection {
  id: string; type: 'benefits';
  title: string;
  items: { title: string; description: string }[];
}
export interface LPFaqSection {
  id: string; type: 'faq';
  title: string;
  items: { question: string; answer: string }[];
}
export type LPSection = LPHowItWorksSection | LPStatsSection | LPBenefitsSection | LPFaqSection;
export type LPSectionType = LPSection['type'];

// ===== Conteúdo principal da LP (NOVO) =====
export interface LPContent {
  header: {
    logo_url: string;
    brand_name: string;
    show_login_button: boolean;
    login_label: string;
    login_url: string;
    signup_label: string;
    signup_mode?: LPCTAMode;
    signup_url: string;
  };
  hero: {
    badge_text: string;
    title_line1: string;
    title_line2: string;
    subtitle: string;
    cta_primary_label: string;
    cta_primary_mode?: LPCTAMode;
    cta_primary_url: string;
    cta_secondary_label: string;
    cta_secondary_mode?: 'link' | 'form' | 'scroll_plans';
    cta_secondary_url: string;
  };
  features_section: {
    badge: string;
    title: string;
    subtitle: string;
    items: LPFeatureCard[]; // tipicamente 9
  };
  extras: LPExtraCard[]; // tipicamente 2
  how_it_works: {
    title: string;
    subtitle: string;
    steps: LPStep[]; // tipicamente 3
  };
  stats: {
    items: LPStat[]; // tipicamente 3
  };
  plans_section: {
    badge: string;
    title: string;
    subtitle: string;
    footer_note: string;
    plans: LPPlan[]; // tipicamente 4
  };
  final_cta: {
    title: string;
    subtitle: string;
    cta_label: string;
    cta_mode?: LPCTAMode;
    cta_url: string;
    secondary_text: string;
    secondary_url: string;
  };
  socials: {
    instagram: string;
    linkedin: string;
    youtube: string;
    facebook: string;
  };
  footer: {
    company_name: string;
    cnpj: string;
    rights_text: string;
  };
  tracking?: {
    facebook_pixel_id?: string;
  };
  cta_form?: LPCTAForm;
  floating_cta?: LPFloatingCTA;

  // ===== LEGADO (não usados pelo novo template, preservados em runtime) =====
  /** @deprecated layout antigo */
  features?: { icon: string; title: string; description: string }[];
  /** @deprecated layout antigo */
  media?: { type: 'youtube' | 'image' | 'video' | 'none'; url: string; caption: string };
  /** @deprecated layout antigo */
  sections?: LPSection[];
  /** @deprecated layout antigo */
  social_proof?: {
    title: string; subtitle: string;
    testimonials: { name: string; role: string; photo_url: string; quote: string; rating: number }[];
    logos: { name: string; image_url: string }[];
  };
  /** @deprecated retrocompat */
  floating_ctas?: LPFloatingCTA[];
}

export interface CustomLandingPage {
  id: string;
  slug: string;
  title: string;
  is_published: boolean;
  created_by: string | null;
  theme: LPTheme;
  content: LPContent;
  created_at: string;
  updated_at: string;
}

export const DEFAULT_THEME: LPTheme = {
  primary: '#2563eb',
  secondary: '#1e40af',
  background: '#ffffff',
  text: '#0f172a',
  accent: '#22c55e',
};

// ===== DEFAULT espelhando a Home do Conectae =====
export const DEFAULT_CONTENT: LPContent = {
  header: {
    logo_url: '',
    brand_name: 'Conectae Imob',
    show_login_button: true,
    login_label: 'Entrar',
    login_url: '',
    signup_label: 'Cadastre-se',
    signup_mode: 'link',
    signup_url: '',
  },
  hero: {
    badge_text: '✨ Plano grátis disponível • Sem cartão de crédito',
    title_line1: 'O hub completo do',
    title_line2: 'corretor de imóveis moderno',
    subtitle:
      'Leads qualificados, parcerias, lançamentos, portal de imóveis, IA, criativos e muito mais — tudo em uma única plataforma feita para você vender mais.',
    cta_primary_label: 'Começar grátis',
    cta_primary_mode: 'link',
    cta_primary_url: '',
    cta_secondary_label: 'Ver planos',
    cta_secondary_mode: 'scroll_plans',
    cta_secondary_url: '',
  },
  features_section: {
    badge: 'Funcionalidades',
    title: 'Tudo que você precisa para vender mais',
    subtitle:
      '9 ferramentas completas integradas + serviços extras para o corretor moderno operar com autonomia.',
    items: [
      { icon: 'Target', title: 'Leads Disponíveis', desc: 'Compre leads de clientes prontos para fechar. Pague só pelo lead que escolher.' },
      { icon: 'Handshake', title: 'Balcão de Parcerias', desc: 'Tem cliente sem imóvel? Publique e encontre o corretor que tem o match perfeito.' },
      { icon: 'Building2', title: 'Lançamentos', desc: 'Acesso direto aos lançamentos das construtoras parceiras para você vender.' },
      { icon: 'Home', title: 'Portal de Imóveis', desc: 'Publique seus imóveis e deixe outros corretores se afiliarem para vender em parceria.' },
      { icon: 'Banknote', title: 'Financiamento', desc: 'Suporte completo no financiamento dos seus clientes do início ao fim.' },
      { icon: 'Sparkles', title: 'Criativos com IA', desc: 'Gere criativos profissionais para suas redes sociais em segundos com IA.' },
      { icon: 'Calculator', title: 'Calculadora de Emolumentos', desc: 'Calcule emolumentos por estado com precisão antes de fechar negócio.' },
      { icon: 'Bot', title: 'IA de Atendimento', desc: 'Sua IA exclusiva para atender clientes 24/7 sem perder uma oportunidade.' },
      { icon: 'Newspaper', title: 'Notícias do Mercado', desc: 'Fique por dentro das tendências e dados do mercado imobiliário diariamente.' },
    ],
  },
  extras: [
    { icon: 'GraduationCap', title: 'Educação Conectae', desc: 'Treinamentos básicos, intermediários e Hot Seats com especialistas para você evoluir no mercado imobiliário.' },
    { icon: 'Scale', title: 'Suporte Jurídico', desc: 'Serviços jurídicos sob demanda para você operar com segurança total em contratos e negociações.' },
  ],
  how_it_works: {
    title: 'Como funciona',
    subtitle: '3 passos simples para começar a fechar negócios hoje',
    steps: [
      { title: 'Cadastre-se grátis', desc: 'Crie sua conta em menos de 1 minuto. Plano grátis disponível, sem cartão.' },
      { title: 'Escolha seu plano', desc: 'Selecione o plano ideal para o volume de negócios que você quer fechar.' },
      { title: 'Use todas as ferramentas', desc: 'Leads, parcerias, IA, criativos, lançamentos — tudo na palma da mão.' },
    ],
  },
  stats: {
    items: [
      { icon: 'Users', value: '500+', label: 'Corretores ativos' },
      { icon: 'TrendingUp', value: '2.000+', label: 'Negócios viabilizados' },
      { icon: 'Clock', value: '24/7', label: 'Suporte disponível' },
    ],
  },
  plans_section: {
    badge: 'Planos',
    title: 'Escolha seu plano',
    subtitle: 'Mais créditos, mais funcionalidades, mais resultado. Cancele quando quiser.',
    footer_note: 'Cobrança mensal recorrente • Cancele quando quiser • Pagamento seguro',
    plans: [
      {
        name: 'Conexão', price: 'Grátis', priceSuffix: '',
        credits: '10 créditos/mês', cta_label: 'Começar grátis',
        cta_mode: 'link', cta_url: '',
        features: [
          '1 solicitação de parceria', 'Até 5 ofertas de parceria',
          'Até 3 imóveis no portal', 'Acesso full a lançamentos',
          'Acesso full a financiamentos', '1 criativo imobiliário',
          'Treinamentos básicos',
        ],
      },
      {
        name: 'Essencial', price: 'R$ 39,90', priceSuffix: '/mês',
        credits: '30 créditos/mês', cta_label: 'Assinar Essencial',
        cta_mode: 'link', cta_url: '',
        features: [
          '5 solicitações de parceria', 'Até 10 ofertas de parceria',
          'Até 10 imóveis no portal', 'Acesso full a lançamentos',
          'Acesso full a financiamentos', '3 criativos imobiliários',
          'Treinamentos básicos e intermediários',
        ],
      },
      {
        name: 'Performance', price: 'R$ 79,90', priceSuffix: '/mês',
        credits: '430 créditos/mês', cta_label: 'Assinar Performance',
        cta_mode: 'link', cta_url: '',
        highlight: 'popular',
        features: [
          'Solicitações de parceria ilimitadas', 'Ofertas de parceria ilimitadas',
          'Imóveis no portal ilimitados', 'Acesso full a lançamentos',
          '15 criativos imobiliários', 'Hot Seat 2x mês', '2 leads inclusos',
        ],
      },
      {
        name: 'Elite', price: 'R$ 149,90', priceSuffix: '/mês',
        credits: '1.000 créditos/mês', cta_label: 'Assinar Elite',
        cta_mode: 'link', cta_url: '',
        highlight: 'premium',
        features: [
          'Tudo do Performance, e mais:', 'Imóveis no portal ilimitados',
          '30 criativos imobiliários', 'Treinamentos básicos e intermediários',
          'Hot Seat 2x mês', '5 leads inclusos', 'Suporte prioritário',
        ],
      },
    ],
  },
  final_cta: {
    title: 'Pronto para vender mais imóveis?',
    subtitle: 'Comece grátis hoje. Sem cartão de crédito.',
    cta_label: 'Criar minha conta grátis',
    cta_mode: 'link',
    cta_url: '',
    secondary_text: 'Já tem cadastro? Acesse agora',
    secondary_url: '',
  },
  socials: { instagram: '', linkedin: '', youtube: '', facebook: '' },
  footer: {
    company_name: 'Conectae Imob',
    cnpj: '',
    rights_text: 'Todos os direitos reservados',
  },
  tracking: { facebook_pixel_id: '' },
  cta_form: {
    intro_text: 'Preencha seus dados para entrarmos em contato',
    submit_label: 'Quero começar',
    redirect_url: '',
    fields: [
      { id: 'name', label: 'Nome completo', type: 'text', required: true },
      { id: 'phone', label: 'WhatsApp', type: 'phone', required: true },
      { id: 'email', label: 'E-mail', type: 'email', required: false },
    ],
  },
  floating_cta: { label: 'Quero Falar Agora', enabled: false, mode: 'link', url: '' },
};

/**
 * Mescla um conteúdo persistido (potencialmente em formato antigo) com os
 * defaults novos, garantindo que LPs antigas adotem o novo template sem
 * quebrar.
 */
export function mergeLPContent(raw: Partial<LPContent> | null | undefined): LPContent {
  const r = (raw ?? {}) as Partial<LPContent>;
  const legacyFloating = r.floating_ctas?.[0];
  return {
    ...DEFAULT_CONTENT,
    ...r,
    header: { ...DEFAULT_CONTENT.header, ...(r.header ?? {}) },
    hero: { ...DEFAULT_CONTENT.hero, ...(r.hero ?? {}) },
    features_section: {
      ...DEFAULT_CONTENT.features_section,
      ...(r.features_section ?? {}),
      items: r.features_section?.items?.length
        ? r.features_section.items
        : DEFAULT_CONTENT.features_section.items,
    },
    extras: r.extras?.length ? r.extras : DEFAULT_CONTENT.extras,
    how_it_works: {
      ...DEFAULT_CONTENT.how_it_works,
      ...(r.how_it_works ?? {}),
      steps: r.how_it_works?.steps?.length
        ? r.how_it_works.steps
        : DEFAULT_CONTENT.how_it_works.steps,
    },
    stats: {
      items: r.stats?.items?.length
        ? r.stats.items
        : DEFAULT_CONTENT.stats.items,
    },
    plans_section: {
      ...DEFAULT_CONTENT.plans_section,
      ...(r.plans_section ?? {}),
      plans: r.plans_section?.plans?.length
        ? r.plans_section.plans
        : DEFAULT_CONTENT.plans_section.plans,
    },
    final_cta: { ...DEFAULT_CONTENT.final_cta, ...(r.final_cta ?? {}) },
    socials: { ...DEFAULT_CONTENT.socials, ...(r.socials ?? {}) },
    footer: { ...DEFAULT_CONTENT.footer, ...(r.footer ?? {}) },
    tracking: { ...DEFAULT_CONTENT.tracking, ...(r.tracking ?? {}) },
    cta_form: { ...DEFAULT_CONTENT.cta_form!, ...(r.cta_form ?? {}) },
    floating_cta:
      r.floating_cta ??
      (legacyFloating
        ? { ...legacyFloating, mode: 'link', url: '' }
        : DEFAULT_CONTENT.floating_cta),
  };
}

// ===== Helpers legados (mantidos para SectionsEditor antigo, se referenciado) =====
function genId(prefix = 'sec'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createSection(type: LPSectionType): LPSection {
  switch (type) {
    case 'how_it_works':
      return {
        id: genId('hiw'), type: 'how_it_works',
        title: 'Como Funciona', subtitle: '',
        steps: [
          { title: 'Passo 1', description: '' },
          { title: 'Passo 2', description: '' },
          { title: 'Passo 3', description: '' },
        ],
      };
    case 'stats':
      return {
        id: genId('stats'), type: 'stats',
        items: [
          { icon: 'Users', value: '500+', label: 'Clientes' },
          { icon: 'Target', value: '2.000+', label: 'Vendas' },
          { icon: 'Clock', value: '24/7', label: 'Suporte' },
        ],
      };
    case 'benefits':
      return {
        id: genId('ben'), type: 'benefits',
        title: 'Benefícios',
        items: [{ title: 'Item 1', description: '' }],
      };
    case 'faq':
      return {
        id: genId('faq'), type: 'faq',
        title: 'Perguntas Frequentes',
        items: [{ question: '', answer: '' }],
      };
  }
}
