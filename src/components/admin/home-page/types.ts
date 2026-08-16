// Tipos da Página Principal editável (singleton em home_page_content)

export interface HomeFeatureItem {
  icon: string;
  title: string;
  desc: string;
}

export interface HomeStepItem {
  title: string;
  desc: string;
}

export interface HomeStatItem {
  icon: string;
  value: string;
  label: string;
}

export interface HomePlan {
  slug: 'conexao' | 'essencial' | 'elite' | 'partner';
  name: string;
  price: string;
  priceSuffix: string;
  credits: string;
  cta: string;
  features: string[];
}

export interface HomeContent {
  header: {
    brand_logo_url: string;
    show_login_button: boolean;
    login_label: string;
    signup_label: string;
  };
  hero: {
    badge_text: string;
    title_line1: string;
    title_line2: string;
    subtitle: string;
    cta_primary_label: string;
    cta_secondary_label: string;
  };
  features_section: {
    badge: string;
    title: string;
    subtitle: string;
    items: HomeFeatureItem[]; // sempre 9
  };
  extras: HomeFeatureItem[]; // sempre 2
  how_it_works: {
    title: string;
    subtitle: string;
    steps: HomeStepItem[]; // sempre 3
  };
  stats: {
    items: HomeStatItem[]; // sempre 3
  };
  plans_section: {
    badge: string;
    title: string;
    subtitle: string;
    footer_note: string;
    plans: HomePlan[]; // sempre 4 (slugs travados)
  };
  final_cta: {
    title: string;
    subtitle: string;
    cta_label: string;
    secondary_text: string;
  };
}

export const PLAN_SLUGS: HomePlan['slug'][] = [
  'conexao',
  'essencial',
  'elite',
];

// Defaults espelhando o seed da migration — fallback caso a tabela esteja vazia.
export const DEFAULT_HOME_CONTENT: HomeContent = {
  header: {
    brand_logo_url: '',
    show_login_button: true,
    login_label: 'Entrar',
    signup_label: 'Cadastre-se',
  },
  hero: {
    badge_text: '✨ Plano grátis disponível • Sem cartão de crédito',
    title_line1: 'O hub completo do',
    title_line2: 'corretor de imóveis moderno',
    subtitle:
      'Leads qualificados, parcerias, lançamentos, portal de imóveis, IA, criativos e muito mais — tudo em uma única plataforma feita para você vender mais.',
    cta_primary_label: 'Começar grátis',
    cta_secondary_label: 'Ver planos',
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
    footer_note: 'Cobrança mensal recorrente • Cancele quando quiser • Pagamento seguro via Asaas',
    plans: [
      {
        slug: 'conexao', name: 'Conexão', price: 'Grátis', priceSuffix: '',
        credits: '10 créditos Grátis/mês', cta: 'Começar grátis',
        features: [
          '1 solicitação de parceria', 'Até 5 ofertas de parceria',
          'Até 3 imóveis no portal', 'Acesso full a lançamentos',
          'Acesso full a financiamentos', '1 criativo imobiliário',
          'Treinamentos básicos',
        ],
      },
      {
        slug: 'essencial', name: 'Essencial', price: 'R$ 39,90', priceSuffix: '/mês',
        credits: '30 créditos Grátis/mês', cta: 'Assinar Essencial',
        features: [
          'Solicitações de parceria ilimitadas', 'Ofertas de parceria ilimitadas',
          'Imóveis no portal ilimitados', 'Acesso full a lançamentos',
          'Acesso full a financiamentos', '3 criativos imobiliários',
          'Treinamentos básicos e intermediários', '50% de desconto na compra de créditos e leads',
        ],
      },
      {
        slug: 'elite', name: 'Elite', price: 'R$ 79,90', priceSuffix: '/mês',
        credits: '150 créditos Grátis/mês', cta: 'Assinar Elite',
        features: [
          'Tudo do Plano Essencial',
          '15 criativos imobiliários',
          'Site Personalizado',
        ],
      },
    ],
  },
  final_cta: {
    title: 'Pronto para vender mais imóveis?',
    subtitle: 'Comece grátis hoje. Sem cartão de crédito.',
    cta_label: 'Criar minha conta grátis',
    secondary_text: 'Já tem cadastro? Acesse agora',
  },
};

/**
 * Mescla conteúdo persistido com os defaults para garantir que campos novos
 * (adicionados em versões futuras) sempre tenham valor.
 */
export function mergeHomeContent(partial: Partial<HomeContent> | null | undefined): HomeContent {
  const p = partial ?? {};
  return {
    header: { ...DEFAULT_HOME_CONTENT.header, ...(p.header ?? {}) },
    hero: { ...DEFAULT_HOME_CONTENT.hero, ...(p.hero ?? {}) },
    features_section: {
      ...DEFAULT_HOME_CONTENT.features_section,
      ...(p.features_section ?? {}),
      items: (p.features_section?.items?.length === 9
        ? p.features_section.items
        : DEFAULT_HOME_CONTENT.features_section.items),
    },
    extras: p.extras?.length === 2 ? p.extras : DEFAULT_HOME_CONTENT.extras,
    how_it_works: {
      ...DEFAULT_HOME_CONTENT.how_it_works,
      ...(p.how_it_works ?? {}),
      steps: (p.how_it_works?.steps?.length === 3
        ? p.how_it_works.steps
        : DEFAULT_HOME_CONTENT.how_it_works.steps),
    },
    stats: {
      items: p.stats?.items?.length === 3
        ? p.stats.items
        : DEFAULT_HOME_CONTENT.stats.items,
    },
    plans_section: {
      ...DEFAULT_HOME_CONTENT.plans_section,
      ...(p.plans_section ?? {}),
      // Garante 4 planos com slugs travados, na ordem certa
      plans: PLAN_SLUGS.map((slug, idx) => {
        const fromPartial = p.plans_section?.plans?.find((pl) => pl.slug === slug);
        return fromPartial ?? DEFAULT_HOME_CONTENT.plans_section.plans[idx];
      }),
    },
    final_cta: { ...DEFAULT_HOME_CONTENT.final_cta, ...(p.final_cta ?? {}) },
  };
}
