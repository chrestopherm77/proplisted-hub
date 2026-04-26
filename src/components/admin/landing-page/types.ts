export interface LPTheme {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  accent: string;
}

export interface LPFeature {
  icon: string; // lucide icon name
  title: string;
  description: string;
}

export interface LPTestimonial {
  name: string;
  role: string;
  photo_url: string;
  quote: string;
  rating: number;
}

export interface LPLogo {
  name: string;
  image_url: string;
}

export interface LPMedia {
  type: 'youtube' | 'image' | 'video' | 'none';
  url: string;
  caption: string;
}

export interface LPFloatingCTA {
  label: string;
  enabled: boolean;
}

export interface LPContent {
  header: { logo_url: string; brand_name: string };
  hero: {
    title: string;
    highlight: string;
    subtitle: string;
    cta_label: string;
    cta_url: string;
  };
  features: LPFeature[];
  media: LPMedia;
  social_proof: {
    title: string;
    subtitle: string;
    testimonials: LPTestimonial[];
    logos: LPLogo[];
  };
  final_cta: {
    title: string;
    subtitle: string;
    button_label: string;
    button_url: string;
  };
  floating_ctas: LPFloatingCTA[];
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

export const DEFAULT_CONTENT: LPContent = {
  header: { logo_url: '', brand_name: 'Minha Marca' },
  hero: {
    title: 'Leads Qualificados para',
    highlight: 'Seu Negócio Imobiliário',
    subtitle:
      'Conecte-se com clientes prontos para comprar ou vender imóveis. Aumente suas vendas com leads verificados.',
    cta_label: 'Quero Começar',
    cta_url: 'https://wa.me/5500000000000',
  },
  features: [
    {
      icon: 'TrendingUp',
      title: 'Leads Qualificados',
      description: 'Leads 100% verificados com interesse real de compra ou venda.',
    },
    {
      icon: 'Shield',
      title: 'Seguro e Confiável',
      description: 'Total segurança e conformidade com a LGPD em cada transação.',
    },
    {
      icon: 'Zap',
      title: 'Acesso Instantâneo',
      description: 'Receba acesso imediato aos contatos após confirmação. Sem espera.',
    },
  ],
  media: { type: 'none', url: '', caption: 'Veja como os leads chegam pra você' },
  social_proof: {
    title: 'O que dizem nossos clientes',
    subtitle: 'Centenas de corretores já transformaram seus resultados',
    testimonials: [],
    logos: [],
  },
  final_cta: {
    title: 'Pronto para começar?',
    subtitle: 'Junte-se a milhares de corretores que já confiam na nossa plataforma.',
    button_label: 'Começar Agora',
    button_url: 'https://wa.me/5500000000000',
  },
  floating_ctas: [
    { label: 'Quero Falar Agora', enabled: true },
    { label: 'Fale Conosco', enabled: true },
  ],
  socials: { instagram: '', linkedin: '', youtube: '', facebook: '' },
  footer: {
    company_name: 'Minha Empresa',
    cnpj: '',
    rights_text: 'Todos os direitos reservados',
  },
};
