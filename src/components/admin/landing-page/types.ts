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

// ===== Seções dinâmicas =====
export interface LPHowItWorksSection {
  id: string;
  type: 'how_it_works';
  title: string;
  subtitle: string;
  steps: { title: string; description: string }[];
}

export interface LPStatsSection {
  id: string;
  type: 'stats';
  items: { icon: string; value: string; label: string }[];
}

export interface LPBenefitsSection {
  id: string;
  type: 'benefits';
  title: string;
  items: { title: string; description: string }[];
}

export interface LPFaqSection {
  id: string;
  type: 'faq';
  title: string;
  items: { question: string; answer: string }[];
}

export type LPSection =
  | LPHowItWorksSection
  | LPStatsSection
  | LPBenefitsSection
  | LPFaqSection;

export type LPSectionType = LPSection['type'];

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
  /** Seções dinâmicas renderizadas entre Mídia e Prova Social. */
  sections: LPSection[];
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
  tracking?: {
    facebook_pixel_id?: string;
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

// Util: gera id estável (sem depender de crypto.randomUUID em ambientes antigos)
function genId(prefix = 'sec'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// Templates iniciais para cada tipo de seção (usados pelo botão "Adicionar seção")
export function createSection(type: LPSectionType): LPSection {
  switch (type) {
    case 'how_it_works':
      return {
        id: genId('hiw'),
        type: 'how_it_works',
        title: 'Como Funciona',
        subtitle: '3 passos simples para começar a fechar negócios hoje',
        steps: [
          { title: 'Escolha o Lead', description: 'Navegue pela plataforma e escolha leads que se encaixam no seu perfil de cliente' },
          { title: 'Realize o Pagamento', description: 'Adicione ao carrinho e finalize a compra de forma segura via PIX ou cartão' },
          { title: 'Entre em Contato', description: 'Acesse imediatamente nome e telefone do lead e comece a negociar' },
        ],
      };
    case 'stats':
      return {
        id: genId('stats'),
        type: 'stats',
        items: [
          { icon: 'Users', value: '500+', label: 'Corretores Ativos' },
          { icon: 'Target', value: '2.000+', label: 'Leads Vendidos' },
          { icon: 'Clock', value: '24/7', label: 'Suporte Disponível' },
        ],
      };
    case 'benefits':
      return {
        id: genId('ben'),
        type: 'benefits',
        title: 'Benefícios Exclusivos',
        items: [
          { title: 'Leads Exclusivos por Região', description: 'Cada lead é compartilhado com no máximo 5 corretores. Mais exclusividade, menos concorrência.' },
          { title: 'Informações Completas', description: 'Nome, telefone e descrição detalhada do interesse do cliente.' },
          { title: 'Pagamento Seguro', description: 'Pagamento 100% seguro via PIX ou cartão, processado pela Asaas.' },
          { title: 'Histórico Completo', description: 'Histórico completo de todos os leads adquiridos disponível 24/7.' },
        ],
      };
    case 'faq':
      return {
        id: genId('faq'),
        type: 'faq',
        title: 'Perguntas Frequentes',
        items: [
          { question: 'Como recebo os leads?', answer: 'Após a confirmação do pagamento você recebe nome, telefone e detalhes do interesse imediatamente.' },
          { question: 'Quantas pessoas recebem o mesmo lead?', answer: 'Cada lead é compartilhado com no máximo 5 corretores para garantir conversão.' },
        ],
      };
  }
}

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
  sections: [
    createSection('how_it_works'),
    createSection('stats'),
    createSection('benefits'),
  ],
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
  tracking: {
    facebook_pixel_id: '',
  },
};
