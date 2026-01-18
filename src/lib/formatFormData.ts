import { LeadFormData } from "@/components/leadform/types";

interface FormField {
  label: string;
  value: string;
}

interface FormSection {
  title: string;
  icon: string;
  fields: FormField[];
}

// Label mappings
const intentionLabels: Record<string, string> = {
  'SELL': 'Vender imóvel',
  'BUY': 'Comprar imóvel',
  'BUILD': 'Construir',
  'RENT': 'Alugar',
};

const purposeLabels: Record<string, string> = {
  'HOUSING': 'Moradia',
  'INVESTMENT': 'Investimento',
  'COMMERCIAL': 'Comercial',
  'TEMPORARY': 'Temporário',
};

const propertyTypeLabels: Record<string, string> = {
  'COMMERCIAL': 'Comercial',
  'MIXED': 'Misto',
  'RESIDENTIAL': 'Residencial',
  'LAND': 'Terreno',
  'RURAL': 'Rural',
  'HOUSE': 'Casa',
  'APARTMENT': 'Apartamento',
  'KITNET': 'Kitnet',
};

const commercialTypeLabels: Record<string, string> = {
  'BUILDING': 'Prédio comercial',
  'WAREHOUSE': 'Galpão',
  'ROOM': 'Sala comercial',
  'STORE': 'Loja',
  'OTHER': 'Outro',
  'MULTIPLE': 'Múltiplos tipos',
};

const residentialTypeLabels: Record<string, string> = {
  'HOUSE': 'Casa',
  'APARTMENT': 'Apartamento',
  'KITNET': 'Kitnet',
  'TOWNHOUSE': 'Sobrado',
  'CONDO_HOUSE': 'Casa de condomínio',
  'PENTHOUSE': 'Cobertura',
  'LOFT': 'Loft',
  'STUDIO': 'Studio',
  'MULTIPLE': 'Múltiplos tipos',
};

const mixedTypeLabels: Record<string, string> = {
  'RESIDENTIAL_COMMERCIAL': 'Residencial + Comercial',
  'STORE_APARTMENT': 'Loja + Apartamento',
  'OFFICE_RESIDENTIAL': 'Escritório + Residencial',
  'OTHER': 'Outro',
};

const ruralTypeLabels: Record<string, string> = {
  'FARM': 'Fazenda',
  'SITIO': 'Sítio',
  'CHACARA': 'Chácara',
  'OTHER': 'Outro',
};

const relationLabels: Record<string, string> = {
  'OWNER': 'Proprietário',
  'LEGAL_REP': 'Representante Legal',
  'FAMILY': 'Familiar do proprietário',
  'BROKER': 'Corretor/Imobiliária',
};

const exclusivityLabels: Record<string, string> = {
  'YES': 'Sim',
  'NO': 'Não',
  'DEPENDS': 'Depende das condições',
};

const landLabels: Record<string, string> = {
  'YES': 'Sim, já possui',
  'NEGOTIATING': 'Em negociação',
  'NO': 'Não possui',
  'BTS': 'Built To Suit (BTS)',
};

const topographyLabels: Record<string, string> = {
  'FLAT': 'Plano',
  'SLIGHT_SLOPE': 'Leve declive',
  'STEEP': 'Acentuado',
  'IRREGULAR': 'Irregular',
};

const projectLabels: Record<string, string> = {
  'COMPLETE': 'Projeto completo',
  'IN_PROGRESS': 'Em andamento',
  'NONE': 'Não possui',
  'NEED_HELP': 'Precisa de ajuda',
};

const paymentMethodLabels: Record<string, string> = {
  'CASH': 'À vista',
  'FINANCING': 'Financiamento',
  'INSTALLMENTS': 'Parcelado',
  'FGTS': 'FGTS',
  'CONSORTIUM': 'Consórcio',
  'EXCHANGE': 'Permuta',
  'MIXED': 'Misto',
  // Sell flow specific values
  'financing': 'Financiamento bancário',
  'consortium': 'Consórcio',
  'property_trade': 'Permuta por imóvel',
  'vehicle_trade': 'Permuta por veículo',
  'installments': 'Entrada + parcelamento',
  'cash_only': 'Somente à vista',
};

const guaranteeLabels: Record<string, string> = {
  'GUARANTOR': 'Fiador',
  'DEPOSIT': 'Caução',
  'INSURANCE': 'Seguro fiança',
  'TITLE_CAPITALIZATION': 'Título de capitalização',
  'NONE': 'Nenhuma',
  // Lowercase variants
  'guarantor': 'Fiador',
  'deposit': 'Caução',
  'insurance': 'Seguro fiança',
  'title_capitalization': 'Título de capitalização',
  'none': 'Nenhuma',
};

const propertyReadyStatusLabels: Record<string, string> = {
  'READY': 'Pronto para morar',
  'UNDER_CONSTRUCTION': 'Em construção',
  'BOTH': 'Pronto ou em construção',
};

const tradeOfferTypeLabels: Record<string, string> = {
  'PROPERTY': 'Imóvel',
  'VEHICLE': 'Veículo',
  'OTHER': 'Outro',
  'property': 'Imóvel',
  'vehicle': 'Veículo',
  'other': 'Outro',
};

const btsRentRangeLabels: Record<string, string> = {
  'up_to_300': 'Até R$ 300/m²',
  'UP_TO_300': 'Até R$ 300/m²',
  '50_to_80': 'R$ 50 a 80/m²',
  '50_80': 'R$ 50 a 80/m²',
  'above_80': 'Acima de R$ 80/m²',
  'ABOVE_80': 'Acima de R$ 80/m²',
};

const btsContractTermLabels: Record<string, string> = {
  '5_years': '5 anos',
  '5': '5 anos',
  '7_10_years': '7 a 10 anos',
  '7_10': '7 a 10 anos',
  '10_15_years': '10 a 15 anos',
  '10_15': '10 a 15 anos',
  '15_plus': 'Mais de 15 anos',
  '+15': 'Mais de 15 anos',
};

const moveInDeadlineLabels: Record<string, string> = {
  'IMMEDIATE': 'Imediato',
  'UP_TO_1_MONTH': 'Até 1 mês',
  'UP_TO_3_MONTHS': 'Até 3 meses',
  '1_TO_3_MONTHS': '1 a 3 meses',
  'FLEXIBLE': 'Flexível',
  'immediate': 'Imediato',
  'up_to_1_month': 'Até 1 mês',
  'up_to_3_months': 'Até 3 meses',
  '1_to_3_months': '1 a 3 meses',
  'flexible': 'Flexível',
};

const documentationLabels: Record<string, string> = {
  'COMPLETE': 'Toda regularizada',
  'PARTIAL': 'Parcialmente regularizada',
  'PENDING': 'Pendências a resolver',
  'UNKNOWN': 'Não sei informar',
  // Sell flow specific values
  'regularized': 'Regularizada',
  'in_progress': 'Em processo de regularização',
  'unknown': 'Ainda não sei',
  'pending': 'Possui pendências',
};

const deadlineLabels: Record<string, string> = {
  'IMMEDIATE': 'Imediato',
  'UP_TO_1_MONTH': 'Até 1 mês',
  'UP_TO_3_MONTHS': 'Até 3 meses',
  '1_TO_3_MONTHS': '1 a 3 meses',
  '3_TO_6_MONTHS': '3 a 6 meses',
  '6_TO_12_MONTHS': '6 a 12 meses',
  'OVER_12_MONTHS': 'Mais de 12 meses',
  'NO_RUSH': 'Sem pressa',
  'FLEXIBLE': 'Flexível',
  // Sell flow specific values
  '30_days': 'Em até 30 dias',
  '1_to_3_months': 'De 1 a 3 meses',
  '3_to_6_months': 'De 3 a 6 meses',
  'up_to_1_year': 'Até 1 ano',
};

const booleanLabels = (value: boolean | undefined): string => {
  if (value === undefined) return '';
  return value ? 'Sim' : 'Não';
};

const areaLabels: Record<string, string> = {
  'up_to_10': 'Até 10 ha',
  '10_to_50': '10 a 50 ha',
  '50_to_100': '50 a 100 ha',
  '100_to_500': '100 a 500 ha',
  'over_500': 'Mais de 500 ha',
  'above_500': 'Acima de 500 ha',
  'unknown': 'Ainda não sei',
};

const ruralPurposeLabels: Record<string, string> = {
  'agriculture': 'Agricultura',
  'livestock': 'Pecuária',
  'mixed': 'Mista (agropecuária)',
  'leisure': 'Lazer / turismo rural',
  'reserve': 'Reserva / área improdutiva',
  'other': 'Outro',
};

const motivationLabels: Record<string, string> = {
  'exchange': 'Troca por outro imóvel',
  'financial': 'Necessidade financeira',
  'inheritance': 'Inventário / herança',
  'relocation': 'Mudança de cidade',
  'other': 'Outro',
};

const improvementLabels: Record<string, string> = {
  'main_house': 'Casa sede',
  'staff_houses': 'Casas para funcionários',
  'warehouses': 'Galpões / armazéns',
  'corral': 'Curral / estrutura pecuária',
  'silos': 'Silos',
  'none': 'Não possui benfeitorias relevantes',
};

const waterResourceLabels: Record<string, string> = {
  'river': 'Rio',
  'stream': 'Córrego / nascente',
  'dam': 'Represa / açude',
  'well': 'Poço',
  'none': 'Não possui',
  'unknown': 'Não sei informar',
};

const occupantPreferenceLabels: Record<string, string> = {
  'YES': 'Sim',
  'NO': 'Não',
  'NOT_ASKED': 'Não solicitado',
};

const topographySellLabels: Record<string, string> = {
  'FLAT': 'Plano',
  'UPHILL': 'Aclive',
  'DOWNHILL': 'Declive',
  'UNKNOWN': 'Não sei informar',
};

const accessLabels: Record<string, string> = {
  'paved': 'Asfalto até a entrada',
  'good_dirt': 'Estrada de terra em boas condições',
  'difficult': 'Estrada de terra com acesso difícil',
};

// Helper to safely format values that may be string or string[]
const formatArrayOrString = (value: string | string[] | undefined, labelMap?: Record<string, string>): string => {
  if (!value) return '';
  if (Array.isArray(value)) {
    return value.map(v => labelMap?.[v] || v).join(', ');
  }
  return labelMap?.[value] || value;
};

const terrainPositionLabels: Record<string, string> = {
  'CORNER': 'Esquina',
  'MIDDLE': 'Meio de quadra',
  'THROUGH': 'De uma rua a outra',
  'IRREGULAR': 'Formato irregular',
};

export function generateDescription(data: LeadFormData): string {
  const lines: string[] = [];
  
  // Interesse
  if (data.intention) {
    lines.push(`Interesse: ${intentionLabels[data.intention] || data.intention}`);
  }
  
  // Região
  let region = '';
  if (data.intention === 'SELL' && data.sell?.region) {
    region = data.sell.region;
  } else if (data.intention === 'BUY' && data.buy?.region) {
    region = data.buy.region;
  } else if (data.intention === 'BUILD' && data.build?.location) {
    region = data.build.location;
  } else if (data.intention === 'RENT' && data.rent?.region) {
    region = data.rent.region;
  }
  if (region) {
    lines.push(`Região: ${region}`);
  }
  
  // Características resumidas
  const characteristics = extractCharacteristics(data);
  if (characteristics) {
    lines.push(`Características: ${characteristics}`);
  }
  
  return lines.join('\n');
}

function extractCharacteristics(data: LeadFormData): string {
  const chars: string[] = [];
  
  if (data.intention === 'SELL' && data.sell) {
    if (data.sell.propertyType) {
      chars.push(propertyTypeLabels[data.sell.propertyType] || data.sell.propertyType);
    }
    if (data.sell.residentialType) {
      chars.push(residentialTypeLabels[data.sell.residentialType] || data.sell.residentialType);
    }
    if (data.sell.commercialType) {
      chars.push(commercialTypeLabels[data.sell.commercialType] || data.sell.commercialType);
    }
    if (data.sell.bedrooms) {
      chars.push(`${data.sell.bedrooms} quarto(s)`);
    }
    if (data.sell.size) {
      chars.push(data.sell.size);
    }
  } else if (data.intention === 'BUY' && data.buy) {
    if (data.buy.propertyType) {
      chars.push(propertyTypeLabels[data.buy.propertyType] || data.buy.propertyType);
    }
    if (data.buy.bedrooms) {
      chars.push(`${data.buy.bedrooms} quarto(s)`);
    }
    if (data.buy.purpose) {
      chars.push(purposeLabels[data.buy.purpose] || data.buy.purpose);
    }
  } else if (data.intention === 'BUILD' && data.build) {
    if (data.build.purpose) {
      chars.push(purposeLabels[data.build.purpose] || data.build.purpose);
    }
    if (data.build.area) {
      chars.push(`${data.build.area}m²`);
    }
    if (data.build.floors) {
      chars.push(`${data.build.floors} pavimento(s)`);
    }
  } else if (data.intention === 'RENT' && data.rent) {
    if (data.rent.propertyType) {
      chars.push(propertyTypeLabels[data.rent.propertyType] || data.rent.propertyType);
    }
    if (data.rent.bedrooms) {
      chars.push(`${data.rent.bedrooms} quarto(s)`);
    }
    if (data.rent.purpose) {
      chars.push(purposeLabels[data.rent.purpose] || data.rent.purpose);
    }
  }
  
  return chars.join(', ');
}

export function formatFormDataToSections(intention: string, formData: any): FormSection[] {
  const sections: FormSection[] = [];
  
  if (intention === 'SELL' && formData?.sell) {
    const sell = formData.sell;
    
    // Sobre o vendedor
    const sellerFields: FormField[] = [];
    if (sell.relation) sellerFields.push({ label: 'Relação com o imóvel', value: relationLabels[sell.relation] || sell.relation });
    if (sell.acceptsExclusivity) sellerFields.push({ label: 'Aceita exclusividade', value: exclusivityLabels[sell.acceptsExclusivity] || sell.acceptsExclusivity });
    if (sellerFields.length > 0) {
      sections.push({ title: 'Sobre o Vendedor', icon: '👤', fields: sellerFields });
    }
    
    // Tipo de imóvel
    const propertyFields: FormField[] = [];
    if (sell.propertyType) propertyFields.push({ label: 'Tipo de imóvel', value: propertyTypeLabels[sell.propertyType] || sell.propertyType });
    if (sell.commercialType) propertyFields.push({ label: 'Tipo comercial', value: commercialTypeLabels[sell.commercialType] || sell.commercialType });
    if (sell.residentialType) propertyFields.push({ label: 'Tipo residencial', value: residentialTypeLabels[sell.residentialType] || sell.residentialType });
    if (sell.mixedType) propertyFields.push({ label: 'Tipo misto', value: mixedTypeLabels[sell.mixedType] || sell.mixedType });
    if (sell.ruralType) propertyFields.push({ label: 'Tipo rural', value: ruralTypeLabels[sell.ruralType] || sell.ruralType });
    if (propertyFields.length > 0) {
      sections.push({ title: 'Tipo de Imóvel', icon: '🏠', fields: propertyFields });
    }
    
    // Características
    const charFields: FormField[] = [];
    if (sell.commercialBedrooms) charFields.push({ label: 'Dormitórios', value: sell.commercialBedrooms });
    if (sell.bedrooms) charFields.push({ label: 'Dormitórios', value: sell.bedrooms });
    if (sell.commercialBathrooms) charFields.push({ label: 'Banheiros', value: sell.commercialBathrooms });
    if (sell.bathrooms) charFields.push({ label: 'Banheiros', value: sell.bathrooms });
    if (sell.commercialParkingSpots) charFields.push({ label: 'Vagas', value: sell.commercialParkingSpots });
    if (sell.parkingSpots) charFields.push({ label: 'Vagas', value: sell.parkingSpots });
    if (sell.size) charFields.push({ label: 'Tamanho', value: sell.size });
    if (sell.terrainPosition) charFields.push({ label: 'Posição do terreno', value: terrainPositionLabels[sell.terrainPosition] || sell.terrainPosition });
    if (sell.residentialTopography) charFields.push({ label: 'Topografia', value: topographySellLabels[sell.residentialTopography] || sell.residentialTopography });
    if (charFields.length > 0) {
      sections.push({ title: 'Características', icon: '📐', fields: charFields });
    }
    
    // Rural
    if (sell.propertyType === 'RURAL') {
      const ruralFields: FormField[] = [];
      if (sell.ruralType) ruralFields.push({ label: 'Tipo', value: ruralTypeLabels[sell.ruralType] || sell.ruralType });
      if (sell.ruralArea) ruralFields.push({ label: 'Área', value: areaLabels[sell.ruralArea] || sell.ruralArea });
      if (sell.ruralPurpose) ruralFields.push({ label: 'Finalidade', value: ruralPurposeLabels[sell.ruralPurpose] || sell.ruralPurpose });
      const improvementsVal = formatArrayOrString(sell.improvements, improvementLabels);
      if (improvementsVal) ruralFields.push({ label: 'Benfeitorias', value: improvementsVal });
      const accessVal = formatArrayOrString(sell.access, accessLabels);
      if (accessVal) ruralFields.push({ label: 'Acesso', value: accessVal });
      const waterVal = formatArrayOrString(sell.waterResources, waterResourceLabels);
      if (waterVal) ruralFields.push({ label: 'Recursos hídricos', value: waterVal });
      if (ruralFields.length > 0) {
        sections.push({ title: 'Detalhes Rurais', icon: '🌾', fields: ruralFields });
      }
    }
    
    // Localização
    const locationFields: FormField[] = [];
    if (sell.region) locationFields.push({ label: 'Região', value: sell.region });
    if (locationFields.length > 0) {
      sections.push({ title: 'Localização', icon: '📍', fields: locationFields });
    }
    
    // Valor e pagamento
    const valueFields: FormField[] = [];
    if (sell.expectedValue) valueFields.push({ label: 'Valor esperado', value: sell.expectedValue });
    if (sell.paymentMethods && sell.paymentMethods.length > 0) {
      valueFields.push({ label: 'Formas de pagamento', value: sell.paymentMethods.map((m: string) => paymentMethodLabels[m] || m).join(', ') });
    }
    if (valueFields.length > 0) {
      sections.push({ title: 'Valor e Pagamento', icon: '💰', fields: valueFields });
    }
    
    // Status
    const statusFields: FormField[] = [];
    if (sell.wasAppraised !== undefined) statusFields.push({ label: 'Foi avaliado', value: booleanLabels(sell.wasAppraised) });
    if (sell.isOccupied !== undefined) statusFields.push({ label: 'Está ocupado', value: booleanLabels(sell.isOccupied) });
    if (sell.isOccupied && sell.occupantHasPreference) {
      statusFields.push({ label: 'Ocupante tem preferência', value: occupantPreferenceLabels[sell.occupantHasPreference] || sell.occupantHasPreference });
    }
    if (sell.documentation) statusFields.push({ label: 'Documentação', value: documentationLabels[sell.documentation] || sell.documentation });
    if (statusFields.length > 0) {
      sections.push({ title: 'Status do Imóvel', icon: '📋', fields: statusFields });
    }
    
    // Prazo
    const deadlineFields: FormField[] = [];
    if (sell.deadline) deadlineFields.push({ label: 'Prazo para venda', value: deadlineLabels[sell.deadline] || sell.deadline });
    if (sell.motivation) deadlineFields.push({ label: 'Motivação', value: motivationLabels[sell.motivation] || sell.motivation });
    if (deadlineFields.length > 0) {
      sections.push({ title: 'Prazo e Motivação', icon: '⏰', fields: deadlineFields });
    }
  }
  
  if (intention === 'BUY' && formData?.buy) {
    const buy = formData.buy;
    
    // Intenção
    const intentFields: FormField[] = [];
    if (buy.purpose) intentFields.push({ label: 'Finalidade', value: purposeLabels[buy.purpose] || buy.purpose });
    if (buy.propertyType) intentFields.push({ label: 'Tipo de imóvel', value: propertyTypeLabels[buy.propertyType] || buy.propertyType });
    if (intentFields.length > 0) {
      sections.push({ title: 'Intenção', icon: '🎯', fields: intentFields });
    }
    
    // Preferências
    const prefFields: FormField[] = [];
    if (buy.prefersGatedCommunity !== undefined) prefFields.push({ label: 'Prefere condomínio fechado', value: booleanLabels(buy.prefersGatedCommunity) });
    if (buy.landPrefersGated !== undefined) prefFields.push({ label: 'Prefere condomínio (terreno)', value: booleanLabels(buy.landPrefersGated) });
    if (buy.bedrooms) prefFields.push({ label: 'Dormitórios', value: buy.bedrooms });
    if (buy.bathrooms) prefFields.push({ label: 'Banheiros', value: buy.bathrooms });
    if (buy.parkingSpots) prefFields.push({ label: 'Vagas', value: buy.parkingSpots });
    if (buy.propertyReadyStatus) prefFields.push({ label: 'Status', value: propertyReadyStatusLabels[buy.propertyReadyStatus] || buy.propertyReadyStatus });
    if (buy.commercialType) prefFields.push({ label: 'Tipo comercial', value: commercialTypeLabels[buy.commercialType] || buy.commercialType });
    if (buy.minSize) prefFields.push({ label: 'Tamanho mínimo', value: buy.minSize });
    if (buy.landMinSize) prefFields.push({ label: 'Tamanho mínimo do terreno', value: buy.landMinSize });
    if (prefFields.length > 0) {
      sections.push({ title: 'Preferências', icon: '🏠', fields: prefFields });
    }
    
    // Localização e orçamento
    const budgetFields: FormField[] = [];
    if (buy.region) budgetFields.push({ label: 'Região', value: buy.region });
    if (buy.budgetMin) budgetFields.push({ label: 'Orçamento mínimo', value: buy.budgetMin });
    if (buy.budgetMax) budgetFields.push({ label: 'Orçamento máximo', value: buy.budgetMax });
    if (budgetFields.length > 0) {
      sections.push({ title: 'Localização e Orçamento', icon: '📍', fields: budgetFields });
    }
    
    // Pagamento
    const payFields: FormField[] = [];
    if (buy.paymentMethod) payFields.push({ label: 'Forma de pagamento', value: paymentMethodLabels[buy.paymentMethod] || buy.paymentMethod });
    if (buy.isFinancingApproved !== undefined) payFields.push({ label: 'Financiamento aprovado', value: booleanLabels(buy.isFinancingApproved) });
    if (buy.isConsortiumContemplated !== undefined) payFields.push({ label: 'Consórcio contemplado', value: booleanLabels(buy.isConsortiumContemplated) });
    if (buy.tradeOfferType) payFields.push({ label: 'Tipo de permuta', value: tradeOfferTypeLabels[buy.tradeOfferType] || buy.tradeOfferType });
    if (buy.tradeOfferValue) payFields.push({ label: 'Valor da permuta', value: buy.tradeOfferValue });
    if (buy.tradeOfferPaidOff !== undefined) payFields.push({ label: 'Permuta quitada', value: booleanLabels(buy.tradeOfferPaidOff) });
    if (payFields.length > 0) {
      sections.push({ title: 'Pagamento', icon: '💳', fields: payFields });
    }
    
    // Prazo
    const deadlineFields: FormField[] = [];
    if (buy.deadline) deadlineFields.push({ label: 'Prazo', value: deadlineLabels[buy.deadline] || buy.deadline });
    if (deadlineFields.length > 0) {
      sections.push({ title: 'Prazo', icon: '⏰', fields: deadlineFields });
    }
  }
  
  if (intention === 'BUILD' && formData?.build) {
    const build = formData.build;
    
    // Intenção
    const intentFields: FormField[] = [];
    if (build.purpose) intentFields.push({ label: 'Finalidade', value: purposeLabels[build.purpose] || build.purpose });
    if (intentFields.length > 0) {
      sections.push({ title: 'Intenção', icon: '🎯', fields: intentFields });
    }
    
    // Terreno
    const landFields: FormField[] = [];
    if (build.hasLand) landFields.push({ label: 'Possui terreno', value: landLabels[build.hasLand] || build.hasLand });
    if (build.topography) landFields.push({ label: 'Topografia', value: topographyLabels[build.topography] || build.topography });
    if (build.location) landFields.push({ label: 'Localização', value: build.location });
    if (landFields.length > 0) {
      sections.push({ title: 'Terreno', icon: '🏞️', fields: landFields });
    }
    
    // Projeto
    const projectFields: FormField[] = [];
    if (build.hasProject) projectFields.push({ label: 'Status do projeto', value: projectLabels[build.hasProject] || build.hasProject });
    if (build.floors) projectFields.push({ label: 'Pavimentos', value: build.floors });
    if (build.area) projectFields.push({ label: 'Área', value: `${build.area}m²` });
    if (build.hasKnowledge !== undefined) projectFields.push({ label: 'Conhecimento em construção', value: booleanLabels(build.hasKnowledge) });
    if (projectFields.length > 0) {
      sections.push({ title: 'Projeto', icon: '📝', fields: projectFields });
    }
    
    // BTS
    if (build.isBTSConfirmed) {
      const btsFields: FormField[] = [];
      btsFields.push({ label: 'Built To Suit', value: 'Sim' });
      if (build.btsRentRange) btsFields.push({ label: 'Faixa de aluguel', value: btsRentRangeLabels[build.btsRentRange] || build.btsRentRange });
      if (build.btsMinContractTerm) btsFields.push({ label: 'Prazo mínimo de contrato', value: btsContractTermLabels[build.btsMinContractTerm] || build.btsMinContractTerm });
      sections.push({ title: 'Built To Suit', icon: '🏗️', fields: btsFields });
    }
    
    // Orçamento
    const budgetFields: FormField[] = [];
    if (build.budget) budgetFields.push({ label: 'Orçamento', value: build.budget });
    if (build.paymentMethod) budgetFields.push({ label: 'Forma de pagamento', value: paymentMethodLabels[build.paymentMethod] || build.paymentMethod });
    if (build.isFinancingApproved !== undefined) budgetFields.push({ label: 'Financiamento aprovado', value: booleanLabels(build.isFinancingApproved) });
    if (build.isConsortiumContemplated !== undefined) budgetFields.push({ label: 'Consórcio contemplado', value: booleanLabels(build.isConsortiumContemplated) });
    if (build.tradeOfferType) budgetFields.push({ label: 'Tipo de permuta', value: tradeOfferTypeLabels[build.tradeOfferType] || build.tradeOfferType });
    if (build.tradeOfferValue) budgetFields.push({ label: 'Valor da permuta', value: build.tradeOfferValue });
    if (build.tradeOfferPaidOff !== undefined) budgetFields.push({ label: 'Permuta quitada', value: booleanLabels(build.tradeOfferPaidOff) });
    if (budgetFields.length > 0) {
      sections.push({ title: 'Orçamento', icon: '💰', fields: budgetFields });
    }
    
    // Prazo
    const deadlineFields: FormField[] = [];
    if (build.deadline) deadlineFields.push({ label: 'Prazo', value: deadlineLabels[build.deadline] || build.deadline });
    if (deadlineFields.length > 0) {
      sections.push({ title: 'Prazo', icon: '⏰', fields: deadlineFields });
    }
  }
  
  if (intention === 'RENT' && formData?.rent) {
    const rent = formData.rent;
    
    // Intenção
    const intentFields: FormField[] = [];
    if (rent.purpose) intentFields.push({ label: 'Finalidade', value: purposeLabels[rent.purpose] || rent.purpose });
    if (rent.propertyType) intentFields.push({ label: 'Tipo de imóvel', value: propertyTypeLabels[rent.propertyType] || rent.propertyType });
    if (intentFields.length > 0) {
      sections.push({ title: 'Intenção', icon: '🎯', fields: intentFields });
    }
    
    // Preferências
    const prefFields: FormField[] = [];
    if (rent.prefersGatedCommunity !== undefined) prefFields.push({ label: 'Prefere condomínio fechado', value: booleanLabels(rent.prefersGatedCommunity) });
    if (rent.bedrooms) prefFields.push({ label: 'Dormitórios', value: rent.bedrooms });
    if (rent.bathrooms) prefFields.push({ label: 'Banheiros', value: rent.bathrooms });
    if (rent.parkingSpots) prefFields.push({ label: 'Vagas', value: rent.parkingSpots });
    if (rent.minSize) prefFields.push({ label: 'Tamanho mínimo', value: rent.minSize });
    if (prefFields.length > 0) {
      sections.push({ title: 'Preferências', icon: '🏠', fields: prefFields });
    }
    
    // Localização e valor
    const budgetFields: FormField[] = [];
    if (rent.region) budgetFields.push({ label: 'Região', value: rent.region });
    if (rent.maxRent) budgetFields.push({ label: 'Valor máximo', value: rent.maxRent });
    if (rent.includesCondoAndTax !== undefined) budgetFields.push({ label: 'Inclui condomínio e IPTU', value: booleanLabels(rent.includesCondoAndTax) });
    if (budgetFields.length > 0) {
      sections.push({ title: 'Localização e Valor', icon: '📍', fields: budgetFields });
    }
    
    // Garantia
    const guaranteeFields: FormField[] = [];
    if (rent.guarantee) guaranteeFields.push({ label: 'Garantia', value: guaranteeLabels[rent.guarantee] || rent.guarantee });
    if (rent.moveInDeadline) guaranteeFields.push({ label: 'Prazo para mudança', value: moveInDeadlineLabels[rent.moveInDeadline] || rent.moveInDeadline });
    if (guaranteeFields.length > 0) {
      sections.push({ title: 'Garantia e Prazo', icon: '📋', fields: guaranteeFields });
    }
  }
  
  return sections;
}

export const intentionLabelsExport = intentionLabels;
