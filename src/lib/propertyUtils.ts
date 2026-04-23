export const PROPERTY_TYPES = [
  { value: 'APARTAMENTO', label: 'Apartamento' },
  { value: 'CASA', label: 'Casa' },
  { value: 'SOBRADO', label: 'Sobrado' },
  { value: 'COBERTURA', label: 'Cobertura' },
  { value: 'TERRENO', label: 'Terreno' },
  { value: 'SALA_COMERCIAL', label: 'Sala Comercial' },
  { value: 'GALPAO', label: 'Galpão' },
  { value: 'SITIO', label: 'Sítio' },
  { value: 'CHACARA', label: 'Chácara' },
];

export const OPERATION_TYPES = [
  { value: 'SALE', label: 'Venda' },
  { value: 'RENT', label: 'Aluguel' },
  { value: 'BOTH', label: 'Venda e Aluguel' },
];

export const ZONE_OPTIONS = ['Norte', 'Sul', 'Leste', 'Oeste', 'Centro', 'Rural'] as const;

export const PROPERTY_STATUS = [
  { value: 'NA_PLANTA', label: 'Na Planta' },
  { value: 'EM_CONSTRUCAO', label: 'Em Construção' },
  { value: 'NOVO', label: 'Imóvel Novo' },
  { value: 'USADO', label: 'Imóvel Usado' },
];

// ============================================================
// Comodidades do Condomínio (8 grupos)
// ============================================================
export interface AmenityGroup {
  key: string;
  label: string;
  items: string[];
}

export const CONDO_AMENITIES: AmenityGroup[] = [
  {
    key: 'wellness',
    label: 'Bem-Estar e Saúde',
    items: [
      'Piscina Adulto com raia',
      'Piscina Adulto e Infantil',
      'Piscina Aquecida/Coberta',
      'Sauna',
      'Jacuzzi',
      'Ofurô',
      'Sala de massagem',
      'Academia indoor',
      'Academia outdoor',
      'Sala de Pilates/Yoga',
      'Espaço Mulher/Beauty Care',
    ],
  },
  {
    key: 'social',
    label: 'Social e Entretenimento',
    items: [
      'Salão de Festas',
      'Espaço Gourmet',
      'Rooftop',
      'Sala de Jogos',
      'Cinema',
      'Espaço Influencer',
    ],
  },
  {
    key: 'convenience',
    label: 'Conveniência e Serviços',
    items: [
      'Market',
      'Sala de Delivery',
      'Lavanderia',
      'Car Wash',
      'Ferramentaria',
      'Pet Care (Banho e Tosa)',
      'Wi-fi nas áreas comuns',
      'Recarga de Carros Elétricos',
      'Car Sharing',
    ],
  },
  {
    key: 'business',
    label: 'Business',
    items: ['Coworking', 'Sala de Reunião'],
  },
  {
    key: 'sports',
    label: 'Esportes e Mobilidade',
    items: [
      'Quadra de Tênis',
      'Quadra de Areia',
      'Quadra Poliesportiva',
      'Campo de Futebol',
      'Bicicletário',
    ],
  },
  {
    key: 'kids',
    label: 'Kids e Natureza',
    items: [
      'Playground',
      'Brinquedoteca',
      'Casa na Árvore',
      'Pet Place (Parquinho)',
      'Redário',
      'Horta Comunitária',
      'Pomar',
      'Praça de Convivência',
    ],
  },
  {
    key: 'security',
    label: 'Segurança e Tecnologia',
    items: ['Portaria 24h', 'Reconhecimento Facial', 'Cerca Elétrica/Câmeras'],
  },
];

// ============================================================
// Características do Imóvel (4 grupos com quesitos)
// ============================================================
export interface FeatureQuestion {
  key: string;
  label: string;
  options: string[];
}

export interface FeatureGroup {
  key: string;
  label: string;
  questions: FeatureQuestion[];
}

export const PROPERTY_FEATURES: FeatureGroup[] = [
  {
    key: 'finishing',
    label: 'Acabamento e Conforto Térmico/Acústico',
    questions: [
      {
        key: 'floor_type',
        label: 'Tipo de Piso',
        options: [
          'Porcelanato',
          'Vinílico',
          'Madeira Maciça',
          'Laminado/Vinílico',
          'Mármore/Granito',
          'Cimento Queimado',
          'Piso Elevado',
          'Concreto Polido/Industrial',
          'Bruto/Sem Piso',
        ],
      },
      {
        key: 'climate',
        label: 'Climatização',
        options: [
          'Ar-condicionado Instalado',
          'Apenas infraestrutura',
          'Sistema Central (Chiller/VRF)',
          'Não possui',
        ],
      },
      {
        key: 'acoustic',
        label: 'Tratamento Acústico',
        options: [
          'Janelas com vidro padrão',
          'Janelas com vidro duplo/antirruído',
          'Manta acústica na laje',
          'Forro Acústico Removível',
        ],
      },
      {
        key: 'lighting',
        label: 'Iluminação',
        options: [
          'Projeto luminotécnico em LED',
          'Sanca de gesso/rebaixamento',
          'Iluminação Industrial/Calhas',
        ],
      },
      {
        key: 'heating',
        label: 'Aquecimento',
        options: ['A gás', 'Solar', 'Elétrico', 'Não se aplica'],
      },
      {
        key: 'blinds',
        label: 'Persianas/Fechamento',
        options: ['Manual', 'Automatizada', 'Piso-teto/Fachada de Vidro'],
      },
      {
        key: 'ceiling',
        label: 'Pé-direito',
        options: ['Padrão', 'Duplo', 'Elevado', 'Pé-direito Industrial (6m+)'],
      },
    ],
  },
  {
    key: 'kitchen',
    label: 'Cozinha, Copa e Área de Serviço',
    questions: [
      {
        key: 'kitchen_style',
        label: 'Estilo de Cozinha/Copa',
        options: [
          'Americana/Integrada',
          'Tradicional/Fechada',
          'Copa de Apoio',
          'Cozinha Industrial/Comercial',
        ],
      },
      {
        key: 'cabinets',
        label: 'Armários',
        options: [
          'Planejados residenciais',
          'Estações de Trabalho/Mobiliário de Escritório',
          'Sem armários',
        ],
      },
      {
        key: 'equipment',
        label: 'Equipamentos',
        options: [
          'Cooktop',
          'Forno elétrico',
          'Micro-ondas embutido',
          'Máquina de lavar louças',
          'Equipamentos de Cozinha Industrial',
          'Sem equipamentos',
        ],
      },
      {
        key: 'service_area',
        label: 'Área de Serviço/Operação',
        options: [
          'Lavanderia',
          'Estendal técnico',
          'Área de Carga e Descarga',
          'Doca',
        ],
      },
      {
        key: 'dependencies',
        label: 'Dependências/Sanitários',
        options: [
          'Banheiro de serviço',
          'Dormitório de empregada',
          'Banheiro PNE (Acessibilidade)',
          'Banheiros Coletivos (Masc/Fem)',
          'Vestiário',
        ],
      },
      {
        key: 'gas_canalizado',
        label: 'Gás Canalizado',
        options: ['Sim', 'Não'],
      },
    ],
  },
  {
    key: 'external',
    label: 'Áreas Externas e Expansão',
    questions: [
      {
        key: 'balcony',
        label: 'Perfil da Varanda/Área Externa',
        options: [
          'Varanda Gourmet',
          'Sacada técnica',
          'Terraço descoberto',
          'Laje Técnica para Máquinas',
          'Pátio de Manobra',
        ],
      },
      {
        key: 'bbq',
        label: 'Churrasqueira/Social',
        options: [
          'Carvão',
          'Gás/Vulcânica',
          'Grill',
          'Espaço de Descompressão para Funcionários',
        ],
      },
      {
        key: 'enclosure',
        label: 'Fechamento/Proteção',
        options: [
          'Vidro retrátil',
          'Tela de proteção',
          'Portão Eletrônico Industrial',
          'Grade de Segurança',
        ],
      },
      {
        key: 'leisure',
        label: 'Lazer/Diferencial',
        options: [
          'Piscina privativa',
          'Ofurô/Jacuzzi na varanda',
          'Sauna privativa',
          'Auditório',
          'Showroom',
        ],
      },
      {
        key: 'garden',
        label: 'Espaço Garden',
        options: [
          'Quintal privativo gramado',
          'Deck de madeira',
          'Horta privativa',
        ],
      },
    ],
  },
  {
    key: 'tech',
    label: 'Tecnologia, Segurança e Sustentabilidade Interna',
    questions: [
      {
        key: 'access',
        label: 'Acesso',
        options: [
          'Fechadura biométrica/facial',
          'Senha/cartão',
          'Catraca Eletrônica',
          'Controle de Acesso por QR Code',
        ],
      },
      {
        key: 'automation',
        label: 'Automação/TI',
        options: [
          'Smart Home',
          'Rack de TI/Servidores',
          'Cabeamento Estruturado (Dados/Voz)',
          'Gerador de Energia (Área Total ou Parcial)',
        ],
      },
      {
        key: 'parking_feature',
        label: 'Vaga de Garagem',
        options: [
          'Carregador elétrico',
          'Vaga Box',
          'Vagas paralelas',
          'Vaga para Caminhões/VUC',
          'Sistema de Valet',
        ],
      },
    ],
  },
];

// ============================================================
// Tipo estruturado e helpers de normalização
// ============================================================
export interface StructuredAmenities {
  condo?: Record<string, string[]>;
  property?: Record<string, string[]>;
  legacy?: string[]; // formato antigo (array simples)
}

/** Detecta formato antigo (array de strings) ou novo (objeto). */
export function normalizeAmenities(value: unknown): StructuredAmenities {
  if (!value) return {};
  if (Array.isArray(value)) {
    const arr = (value as unknown[]).filter((x) => typeof x === 'string') as string[];
    return arr.length ? { legacy: arr } : {};
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const out: StructuredAmenities = {};
    if (obj.condo && typeof obj.condo === 'object') {
      out.condo = sanitizeGroup(obj.condo as Record<string, unknown>);
    }
    if (obj.property && typeof obj.property === 'object') {
      out.property = sanitizeGroup(obj.property as Record<string, unknown>);
    }
    return out;
  }
  return {};
}

function sanitizeGroup(g: Record<string, unknown>): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const [k, v] of Object.entries(g)) {
    if (Array.isArray(v)) {
      const items = v.filter((x) => typeof x === 'string') as string[];
      if (items.length) out[k] = items;
    }
  }
  return out;
}

/** Achata todos os itens em uma lista plana (para card preview). */
export function flattenAmenities(value: unknown): string[] {
  const norm = normalizeAmenities(value);
  const out: string[] = [];
  if (norm.legacy) out.push(...norm.legacy);
  if (norm.condo) Object.values(norm.condo).forEach((arr) => out.push(...arr));
  if (norm.property) Object.values(norm.property).forEach((arr) => out.push(...arr));
  return out;
}

export function getCondoGroupLabel(key: string): string {
  if (key === 'others') return 'Outros';
  return CONDO_AMENITIES.find((g) => g.key === key)?.label || key;
}

export function getFeatureQuestionLabel(groupKey: string, questionKey: string): string {
  const g = PROPERTY_FEATURES.find((x) => x.key === groupKey);
  if (!g) return questionKey;
  return g.questions.find((q) => q.key === questionKey)?.label || questionKey;
}

export function getFeatureGroupLabel(key: string): string {
  return PROPERTY_FEATURES.find((g) => g.key === key)?.label || key;
}

// Lista plana legada — mantida para compatibilidade caso algo ainda importe.
export const AMENITIES = CONDO_AMENITIES.flatMap((g) => g.items);

export function getPropertyTypeLabel(value: string | null | undefined): string {
  if (!value) return '';
  return PROPERTY_TYPES.find((t) => t.value === value)?.label || value;
}

export function getOperationLabel(value: string | null | undefined): string {
  if (!value) return '';
  return OPERATION_TYPES.find((t) => t.value === value)?.label || value;
}

export function getStatusLabel(value: string | null | undefined): string {
  if (!value) return '';
  return PROPERTY_STATUS.find((s) => s.value === value)?.label || value;
}

export function buildPropertyTitle(propertyType: string, neighborhood: string | null): string {
  const typeLabel = getPropertyTypeLabel(propertyType);
  if (neighborhood) return `${typeLabel} ${neighborhood}`;
  return typeLabel;
}

export function formatPrice(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '';
  return `R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

export function parseCurrencyInput(value: string): number | null {
  const digits = value.replace(/\D/g, '');
  if (!digits) return null;
  return parseInt(digits, 10) / 100;
}

export function formatCurrencyInput(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  const num = parseInt(digits, 10);
  return `R$ ${(num / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

export function generateAffiliateToken(): string {
  const arr = new Uint8Array(6);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(36)).join('').slice(0, 8);
}

export interface PropertyPhoto {
  url: string;
  order: number;
  is_cover?: boolean;
}

export function sortPhotos(photos: PropertyPhoto[]): PropertyPhoto[] {
  return [...photos].sort((a, b) => {
    if (a.is_cover && !b.is_cover) return -1;
    if (!a.is_cover && b.is_cover) return 1;
    return (a.order || 0) - (b.order || 0);
  });
}

export function getCoverPhoto(photos: PropertyPhoto[]): string | null {
  if (!photos || photos.length === 0) return null;
  const sorted = sortPhotos(photos);
  return sorted[0]?.url || null;
}
