import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const ALLOWED_ORIGINS = [
  'https://leadbay.com.br',
  'https://www.leadbay.com.br',
  'https://proplisted-hub.lovable.app',
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-lp-secret, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  };
}

interface NotifyNewLeadRequest {
  leadId: string;
  city: string;
  uf?: string;
  intention: string;
  description: string;
  formData: Record<string, any>;
}

interface EmailSection {
  icon: string;
  title: string;
  fields: { label: string; value: string }[];
}

// ===== LABEL MAPPINGS (translated from formatFormData.ts) =====

const intentionLabels: Record<string, string> = {
  SELL: "Vender imóvel",
  BUY: "Comprar imóvel",
  BUILD: "Construir",
  RENT: "Alugar",
};

const purposeLabels: Record<string, string> = {
  HOUSING: "Moradia",
  INVESTMENT: "Investimento",
  COMMERCIAL: "Comercial",
  TEMPORARY: "Temporário",
};

const propertyTypeLabels: Record<string, string> = {
  COMMERCIAL: "Comercial",
  MIXED: "Misto",
  RESIDENTIAL: "Residencial",
  LAND: "Terreno",
  RURAL: "Rural",
  HOUSE: "Casa",
  APARTMENT: "Apartamento",
  KITNET: "Kitnet",
};

const commercialTypeLabels: Record<string, string> = {
  BUILDING: "Prédio comercial",
  WAREHOUSE: "Galpão",
  OFFICE: "Sala comercial",
  STORE: "Loja",
  HOUSE: "Casa",
  OTHER: "Outro",
  MULTIPLE: "Múltiplos tipos",
};

const residentialTypeLabels: Record<string, string> = {
  HOUSE: "Casa",
  APARTMENT: "Apartamento",
  KITNET: "Kitnet",
  TOWNHOUSE: "Sobrado",
  CONDO_HOUSE: "Casa de condomínio",
  PENTHOUSE: "Cobertura",
  LOFT: "Loft",
  STUDIO: "Studio",
  MULTIPLE: "Múltiplos tipos",
};

const mixedTypeLabels: Record<string, string> = {
  RESIDENTIAL_COMMERCIAL: "Residencial + Comercial",
  STORE_APARTMENT: "Loja + Apartamento",
  OFFICE_RESIDENTIAL: "Escritório + Residencial",
  OTHER: "Outro",
};

const ruralTypeLabels: Record<string, string> = {
  FARM: "Fazenda",
  SITIO: "Sítio",
  CHACARA: "Chácara",
  OTHER: "Outro",
};

const relationLabels: Record<string, string> = {
  OWNER: "Proprietário",
  LEGAL_REP: "Representante Legal",
  FAMILY: "Familiar do proprietário",
  BROKER: "Corretor/Imobiliária",
};

const exclusivityLabels: Record<string, string> = {
  YES: "Sim",
  NO: "Não",
  DEPENDS: "Depende das condições",
};

const landLabels: Record<string, string> = {
  YES: "Sim, já possui",
  NEGOTIATING: "Em negociação",
  NO: "Não possui",
  BTS_INTEREST: "Interesse em BTS",
};

const topographyLabels: Record<string, string> = {
  FLAT: "Plano",
  SLIGHT_SLOPE: "Leve declive",
  STEEP: "Acentuado",
  IRREGULAR: "Irregular",
  UPHILL: "Aclive",
  DOWNHILL: "Declive",
  UNKNOWN: "Não sei informar",
};

const projectLabels: Record<string, string> = {
  YES: "Projeto completo",
  COMPLETE: "Projeto completo",
  IN_PROGRESS: "Em andamento",
  NO: "Não possui",
  NONE: "Não possui",
  NEED_HELP: "Precisa de ajuda",
};

const paymentMethodLabels: Record<string, string> = {
  CASH: "À vista",
  FINANCING: "Financiamento",
  INSTALLMENTS: "Parcelado",
  FGTS: "FGTS",
  CONSORTIUM: "Consórcio",
  EXCHANGE: "Permuta",
  MIXED: "Misto",
  financing: "Financiamento bancário",
  consortium: "Consórcio",
  property_trade: "Permuta por imóvel",
  vehicle_trade: "Permuta por veículo",
  installments: "Entrada + parcelamento",
  cash_only: "Somente à vista",
};

const guaranteeLabels: Record<string, string> = {
  GUARANTOR: "Fiador",
  DEPOSIT: "Caução",
  INSURANCE: "Seguro fiança",
  TITLE_CAPITALIZATION: "Título de capitalização",
  NONE: "Nenhuma",
  guarantor: "Fiador",
  deposit: "Caução",
  insurance: "Seguro fiança",
  title_capitalization: "Título de capitalização",
  capitalization: "Título de capitalização",
  none: "Nenhuma",
  unknown: "Ainda não sei",
};

const propertyReadyStatusLabels: Record<string, string> = {
  READY: "Pronto para morar",
  UNDER_CONSTRUCTION: "Em construção",
  BOTH: "Pronto ou em construção",
};

const tradeOfferTypeLabels: Record<string, string> = {
  PROPERTY: "Imóvel",
  VEHICLE: "Veículo",
  OTHER: "Outro",
  property: "Imóvel",
  vehicle: "Veículo",
  other: "Outro",
};

const btsRentRangeLabels: Record<string, string> = {
  up_to_300: "Até R$ 300/m²",
  UP_TO_300: "Até R$ 300/m²",
  up_to_30: "Até R$ 30/m²",
  "50_to_80": "R$ 50 a 80/m²",
  "50_80": "R$ 50 a 80/m²",
  above_80: "Acima de R$ 80/m²",
  ABOVE_80: "Acima de R$ 80/m²",
  undefined: "Ainda não defini",
};

const btsContractTermLabels: Record<string, string> = {
  "5_years": "5 anos",
  "5": "5 anos",
  "7_10_years": "7 a 10 anos",
  "7_10": "7 a 10 anos",
  "7_to_10_years": "7 a 10 anos",
  "10_15_years": "10 a 15 anos",
  "10_15": "10 a 15 anos",
  "10_to_15_years": "10 a 15 anos",
  "15_plus": "Mais de 15 anos",
  "+15": "Mais de 15 anos",
  above_15_years: "Acima de 15 anos",
  undefined: "Ainda não defini",
};

const moveInDeadlineLabels: Record<string, string> = {
  IMMEDIATE: "Imediato",
  UP_TO_1_MONTH: "Até 1 mês",
  UP_TO_3_MONTHS: "Até 3 meses",
  "1_TO_3_MONTHS": "1 a 3 meses",
  FLEXIBLE: "Flexível",
  immediate: "Imediato",
  immediately: "Imediatamente",
  up_to_1_month: "Até 1 mês",
  up_to_30_days: "Até 30 dias",
  up_to_3_months: "Até 3 meses",
  "1_to_3_months": "1 a 3 meses",
  more_than_3_months: "Mais de 3 meses",
  flexible: "Flexível",
};

const documentationLabels: Record<string, string> = {
  COMPLETE: "Toda regularizada",
  PARTIAL: "Parcialmente regularizada",
  PENDING: "Pendências a resolver",
  UNKNOWN: "Não sei informar",
  regularized: "Regularizada",
  in_progress: "Em processo de regularização",
  unknown: "Ainda não sei",
  pending: "Possui pendências",
};

const deadlineLabels: Record<string, string> = {
  IMMEDIATE: "Imediato",
  UP_TO_1_MONTH: "Até 1 mês",
  UP_TO_3_MONTHS: "Até 3 meses",
  "1_TO_3_MONTHS": "1 a 3 meses",
  "3_TO_6_MONTHS": "3 a 6 meses",
  "6_TO_12_MONTHS": "6 a 12 meses",
  OVER_12_MONTHS: "Mais de 12 meses",
  NO_RUSH: "Sem pressa",
  FLEXIBLE: "Flexível",
  "30_days": "Em até 30 dias",
  "1_to_3_months": "De 1 a 3 meses",
  "3_to_6_months": "De 3 a 6 meses",
  up_to_1_year: "Até 1 ano",
};

const areaLabels: Record<string, string> = {
  up_to_10: "Até 10 ha",
  "10_to_50": "10 a 50 ha",
  "50_to_100": "50 a 100 ha",
  "100_to_500": "100 a 500 ha",
  over_500: "Mais de 500 ha",
  above_500: "Acima de 500 ha",
  unknown: "Ainda não sei",
};

const ruralPurposeLabels: Record<string, string> = {
  agriculture: "Agricultura",
  livestock: "Pecuária",
  mixed: "Mista (agropecuária)",
  leisure: "Lazer / turismo rural",
  reserve: "Reserva / área improdutiva",
  other: "Outro",
};

const motivationLabels: Record<string, string> = {
  exchange: "Troca por outro imóvel",
  financial: "Necessidade financeira",
  inheritance: "Inventário / herança",
  relocation: "Mudança de cidade",
  other: "Outro",
};

const improvementLabels: Record<string, string> = {
  main_house: "Casa sede",
  staff_houses: "Casas para funcionários",
  warehouses: "Galpões / armazéns",
  corral: "Curral / estrutura pecuária",
  silos: "Silos",
  none: "Não possui benfeitorias relevantes",
};

const waterResourceLabels: Record<string, string> = {
  river: "Rio",
  stream: "Córrego / nascente",
  dam: "Represa / açude",
  well: "Poço",
  none: "Não possui",
  unknown: "Não sei informar",
};

const occupantPreferenceLabels: Record<string, string> = {
  YES: "Sim",
  NO: "Não",
  NOT_ASKED: "Não solicitado",
};

const terrainPositionLabels: Record<string, string> = {
  CORNER: "Esquina",
  MIDDLE: "Meio de quadra",
  THROUGH: "De uma rua a outra",
  IRREGULAR: "Formato irregular",
  UNKNOWN: "Não sei informar",
};

const accessLabels: Record<string, string> = {
  paved: "Asfalto até a entrada",
  good_dirt: "Estrada de terra em boas condições",
  difficult: "Estrada de terra com acesso difícil",
};

// ===== HELPER FUNCTIONS =====

const booleanLabels = (value: boolean | undefined): string => {
  if (value === undefined) return "";
  return value ? "Sim" : "Não";
};

const formatArrayOrString = (
  value: string | string[] | undefined,
  labelMap?: Record<string, string>
): string => {
  if (!value) return "";
  if (Array.isArray(value)) {
    return value.map((v) => labelMap?.[v] || v).join(", ");
  }
  return labelMap?.[value] || value;
};

// ===== EXTRACT ALL CHARACTERISTICS =====

function extractAllCharacteristics(
  formData: Record<string, any>
): EmailSection[] {
  const sections: EmailSection[] = [];
  const intention = formData.intention;

  // SELL FLOW
  if (intention === "SELL" && formData.sell) {
    const sell = formData.sell;

    const sellerFields: { label: string; value: string }[] = [];
    if (sell.relation)
      sellerFields.push({ label: "Relação com o imóvel", value: relationLabels[sell.relation] || sell.relation });
    if (sell.acceptsExclusivity)
      sellerFields.push({ label: "Aceita exclusividade", value: exclusivityLabels[sell.acceptsExclusivity] || sell.acceptsExclusivity });
    if (sellerFields.length > 0) {
      sections.push({ title: "Sobre o Vendedor", icon: "👤", fields: sellerFields });
    }

    const propertyFields: { label: string; value: string }[] = [];
    if (sell.propertyType) propertyFields.push({ label: "Tipo de imóvel", value: propertyTypeLabels[sell.propertyType] || sell.propertyType });
    if (sell.commercialType) propertyFields.push({ label: "Tipo comercial", value: commercialTypeLabels[sell.commercialType] || sell.commercialType });
    if (sell.residentialType) propertyFields.push({ label: "Tipo residencial", value: residentialTypeLabels[sell.residentialType] || sell.residentialType });
    if (sell.mixedType) propertyFields.push({ label: "Tipo misto", value: mixedTypeLabels[sell.mixedType] || sell.mixedType });
    if (sell.ruralType) propertyFields.push({ label: "Tipo rural", value: ruralTypeLabels[sell.ruralType] || sell.ruralType });
    if (propertyFields.length > 0) {
      sections.push({ title: "Tipo de Imóvel", icon: "🏠", fields: propertyFields });
    }

    const charFields: { label: string; value: string }[] = [];
    if (sell.commercialBedrooms || sell.bedrooms) charFields.push({ label: "Dormitórios", value: String(sell.commercialBedrooms || sell.bedrooms) });
    if (sell.commercialBathrooms || sell.bathrooms) charFields.push({ label: "Banheiros", value: String(sell.commercialBathrooms || sell.bathrooms) });
    if (sell.commercialParkingSpots || sell.parkingSpots) charFields.push({ label: "Vagas", value: String(sell.commercialParkingSpots || sell.parkingSpots) });
    if (sell.size) charFields.push({ label: "Tamanho", value: sell.size });
    if (sell.terrainPosition) charFields.push({ label: "Posição do terreno", value: terrainPositionLabels[sell.terrainPosition] || sell.terrainPosition });
    if (sell.residentialTopography) charFields.push({ label: "Topografia", value: topographyLabels[sell.residentialTopography] || sell.residentialTopography });
    if (charFields.length > 0) {
      sections.push({ title: "Características", icon: "📐", fields: charFields });
    }

    if (sell.propertyType === "RURAL") {
      const ruralFields: { label: string; value: string }[] = [];
      if (sell.ruralArea) ruralFields.push({ label: "Área", value: areaLabels[sell.ruralArea] || sell.ruralArea });
      if (sell.ruralPurpose) ruralFields.push({ label: "Finalidade", value: ruralPurposeLabels[sell.ruralPurpose] || sell.ruralPurpose });
      if (sell.improvements) ruralFields.push({ label: "Benfeitorias", value: formatArrayOrString(sell.improvements, improvementLabels) });
      if (sell.access) ruralFields.push({ label: "Acesso", value: formatArrayOrString(sell.access, accessLabels) });
      if (sell.waterResources) ruralFields.push({ label: "Recursos hídricos", value: formatArrayOrString(sell.waterResources, waterResourceLabels) });
      if (ruralFields.length > 0) {
        sections.push({ title: "Detalhes Rurais", icon: "🌾", fields: ruralFields });
      }
    }

    if (sell.region) {
      sections.push({ title: "Localização", icon: "📍", fields: [{ label: "Região", value: sell.region }] });
    }

    const valueFields: { label: string; value: string }[] = [];
    if (sell.expectedValue) valueFields.push({ label: "Valor esperado", value: sell.expectedValue });
    if (sell.paymentMethods && sell.paymentMethods.length > 0) {
      valueFields.push({ label: "Formas de pagamento", value: sell.paymentMethods.map((m: string) => paymentMethodLabels[m] || m).join(", ") });
    }
    if (valueFields.length > 0) {
      sections.push({ title: "Valor e Pagamento", icon: "💰", fields: valueFields });
    }

    const statusFields: { label: string; value: string }[] = [];
    if (sell.wasAppraised !== undefined) statusFields.push({ label: "Foi avaliado", value: booleanLabels(sell.wasAppraised) });
    if (sell.isOccupied !== undefined) statusFields.push({ label: "Está ocupado", value: booleanLabels(sell.isOccupied) });
    if (sell.isOccupied && sell.occupantHasPreference) {
      statusFields.push({ label: "Ocupante tem preferência", value: occupantPreferenceLabels[sell.occupantHasPreference] || sell.occupantHasPreference });
    }
    if (sell.documentation) statusFields.push({ label: "Documentação", value: documentationLabels[sell.documentation] || sell.documentation });
    if (statusFields.length > 0) {
      sections.push({ title: "Status do Imóvel", icon: "📋", fields: statusFields });
    }

    const deadlineFields: { label: string; value: string }[] = [];
    if (sell.deadline) deadlineFields.push({ label: "Prazo para venda", value: deadlineLabels[sell.deadline] || sell.deadline });
    if (sell.motivation) deadlineFields.push({ label: "Motivação", value: motivationLabels[sell.motivation] || sell.motivation });
    if (deadlineFields.length > 0) {
      sections.push({ title: "Prazo e Motivação", icon: "⏰", fields: deadlineFields });
    }
  }

  // BUY FLOW
  if (intention === "BUY" && formData.buy) {
    const buy = formData.buy;

    const intentFields: { label: string; value: string }[] = [];
    if (buy.purpose) intentFields.push({ label: "Finalidade", value: purposeLabels[buy.purpose] || buy.purpose });
    if (buy.propertyType) intentFields.push({ label: "Tipo de imóvel", value: propertyTypeLabels[buy.propertyType] || buy.propertyType });
    if (intentFields.length > 0) {
      sections.push({ title: "Intenção", icon: "🎯", fields: intentFields });
    }

    const prefFields: { label: string; value: string }[] = [];
    if (buy.prefersGatedCommunity !== undefined) prefFields.push({ label: "Prefere condomínio fechado", value: booleanLabels(buy.prefersGatedCommunity) });
    if (buy.landPrefersGated !== undefined) prefFields.push({ label: "Prefere condomínio (terreno)", value: booleanLabels(buy.landPrefersGated) });
    if (buy.bedrooms) prefFields.push({ label: "Dormitórios", value: String(buy.bedrooms) });
    if (buy.bathrooms) prefFields.push({ label: "Banheiros", value: String(buy.bathrooms) });
    if (buy.parkingSpots) prefFields.push({ label: "Vagas", value: String(buy.parkingSpots) });
    if (buy.propertyReadyStatus) prefFields.push({ label: "Status", value: propertyReadyStatusLabels[buy.propertyReadyStatus] || buy.propertyReadyStatus });
    if (buy.commercialType) prefFields.push({ label: "Tipo comercial", value: commercialTypeLabels[buy.commercialType] || buy.commercialType });
    if (buy.minSize) prefFields.push({ label: "Tamanho mínimo", value: `${buy.minSize} m²` });
    if (buy.landMinSize) prefFields.push({ label: "Tamanho mínimo terreno", value: `${buy.landMinSize} m²` });
    if (prefFields.length > 0) {
      sections.push({ title: "Preferências", icon: "🏠", fields: prefFields });
    }

    const budgetFields: { label: string; value: string }[] = [];
    if (buy.region) budgetFields.push({ label: "Região", value: buy.region });
    if (buy.budgetMin) budgetFields.push({ label: "Orçamento mínimo", value: buy.budgetMin });
    if (buy.budgetMax) budgetFields.push({ label: "Orçamento máximo", value: buy.budgetMax });
    if (budgetFields.length > 0) {
      sections.push({ title: "Localização e Orçamento", icon: "📍", fields: budgetFields });
    }

    const payFields: { label: string; value: string }[] = [];
    if (buy.paymentMethod) payFields.push({ label: "Forma de pagamento", value: paymentMethodLabels[buy.paymentMethod] || buy.paymentMethod });
    if (buy.isFinancingApproved !== undefined) payFields.push({ label: "Financiamento aprovado", value: booleanLabels(buy.isFinancingApproved) });
    if (buy.isConsortiumContemplated !== undefined) payFields.push({ label: "Consórcio contemplado", value: booleanLabels(buy.isConsortiumContemplated) });
    if (buy.tradeOfferType) payFields.push({ label: "Tipo de permuta", value: tradeOfferTypeLabels[buy.tradeOfferType] || buy.tradeOfferType });
    if (buy.tradeOfferValue) payFields.push({ label: "Valor da permuta", value: buy.tradeOfferValue });
    if (buy.tradeOfferPaidOff !== undefined) payFields.push({ label: "Permuta quitada", value: booleanLabels(buy.tradeOfferPaidOff) });
    if (payFields.length > 0) {
      sections.push({ title: "Pagamento", icon: "💳", fields: payFields });
    }

    if (buy.deadline) {
      sections.push({ title: "Prazo", icon: "⏰", fields: [{ label: "Prazo", value: deadlineLabels[buy.deadline] || buy.deadline }] });
    }
  }

  // BUILD FLOW
  if (intention === "BUILD" && formData.build) {
    const build = formData.build;

    if (build.purpose) {
      sections.push({ title: "Intenção", icon: "🎯", fields: [{ label: "Finalidade", value: purposeLabels[build.purpose] || build.purpose }] });
    }

    const landFields: { label: string; value: string }[] = [];
    if (build.hasLand) landFields.push({ label: "Possui terreno", value: landLabels[build.hasLand] || build.hasLand });
    if (build.topography) landFields.push({ label: "Topografia", value: topographyLabels[build.topography] || build.topography });
    if (build.location || build.uf || build.city) {
      const loc = build.location || `${build.city || ""}${build.uf ? "/" + build.uf : ""}`;
      if (loc) landFields.push({ label: "Localização", value: loc });
    }
    if (landFields.length > 0) {
      sections.push({ title: "Terreno", icon: "🏞️", fields: landFields });
    }

    const projectFields: { label: string; value: string }[] = [];
    if (build.hasProject) projectFields.push({ label: "Status do projeto", value: projectLabels[build.hasProject] || build.hasProject });
    if (build.floors) projectFields.push({ label: "Pavimentos", value: String(build.floors) });
    if (build.area) projectFields.push({ label: "Área", value: `${build.area} m²` });
    if (build.hasKnowledge !== undefined) projectFields.push({ label: "Conhecimento em construção", value: booleanLabels(build.hasKnowledge) });
    if (projectFields.length > 0) {
      sections.push({ title: "Projeto", icon: "📝", fields: projectFields });
    }

    if (build.isBTSConfirmed) {
      const btsFields: { label: string; value: string }[] = [{ label: "Built To Suit", value: "Sim" }];
      if (build.btsRentRange) btsFields.push({ label: "Faixa de aluguel", value: btsRentRangeLabels[build.btsRentRange] || build.btsRentRange });
      if (build.btsMinContractTerm) btsFields.push({ label: "Prazo mínimo de contrato", value: btsContractTermLabels[build.btsMinContractTerm] || build.btsMinContractTerm });
      sections.push({ title: "Built To Suit", icon: "🏗️", fields: btsFields });
    }

    const budgetFields: { label: string; value: string }[] = [];
    if (build.budget) budgetFields.push({ label: "Orçamento", value: build.budget });
    if (build.paymentMethod) budgetFields.push({ label: "Forma de pagamento", value: paymentMethodLabels[build.paymentMethod] || build.paymentMethod });
    if (build.isFinancingApproved !== undefined) budgetFields.push({ label: "Financiamento aprovado", value: booleanLabels(build.isFinancingApproved) });
    if (build.isConsortiumContemplated !== undefined) budgetFields.push({ label: "Consórcio contemplado", value: booleanLabels(build.isConsortiumContemplated) });
    if (build.tradeOfferType) budgetFields.push({ label: "Tipo de permuta", value: tradeOfferTypeLabels[build.tradeOfferType] || build.tradeOfferType });
    if (build.tradeOfferValue) budgetFields.push({ label: "Valor da permuta", value: build.tradeOfferValue });
    if (build.tradeOfferPaidOff !== undefined) budgetFields.push({ label: "Permuta quitada", value: booleanLabels(build.tradeOfferPaidOff) });
    if (budgetFields.length > 0) {
      sections.push({ title: "Orçamento", icon: "💰", fields: budgetFields });
    }

    if (build.deadline) {
      sections.push({ title: "Prazo", icon: "⏰", fields: [{ label: "Prazo", value: deadlineLabels[build.deadline] || build.deadline }] });
    }
  }

  // RENT FLOW
  if (intention === "RENT" && formData.rent) {
    const rent = formData.rent;

    const intentFields: { label: string; value: string }[] = [];
    if (rent.purpose) intentFields.push({ label: "Finalidade", value: purposeLabels[rent.purpose] || rent.purpose });
    if (rent.propertyType) intentFields.push({ label: "Tipo de imóvel", value: propertyTypeLabels[rent.propertyType] || rent.propertyType });
    if (intentFields.length > 0) {
      sections.push({ title: "Intenção", icon: "🎯", fields: intentFields });
    }

    const prefFields: { label: string; value: string }[] = [];
    if (rent.prefersGatedCommunity !== undefined) prefFields.push({ label: "Prefere condomínio fechado", value: booleanLabels(rent.prefersGatedCommunity) });
    if (rent.bedrooms) prefFields.push({ label: "Dormitórios", value: String(rent.bedrooms) });
    if (rent.bathrooms) prefFields.push({ label: "Banheiros", value: String(rent.bathrooms) });
    if (rent.parkingSpots) prefFields.push({ label: "Vagas", value: String(rent.parkingSpots) });
    if (rent.minSize) prefFields.push({ label: "Tamanho mínimo", value: `${rent.minSize} m²` });
    if (prefFields.length > 0) {
      sections.push({ title: "Preferências", icon: "🏠", fields: prefFields });
    }

    const budgetFields: { label: string; value: string }[] = [];
    if (rent.region) budgetFields.push({ label: "Região", value: rent.region });
    if (rent.maxRent) budgetFields.push({ label: "Valor máximo", value: rent.maxRent });
    if (rent.includesCondoAndTax !== undefined) budgetFields.push({ label: "Inclui condomínio e IPTU", value: booleanLabels(rent.includesCondoAndTax) });
    if (budgetFields.length > 0) {
      sections.push({ title: "Localização e Valor", icon: "📍", fields: budgetFields });
    }

    const guaranteeFields: { label: string; value: string }[] = [];
    if (rent.guarantee) guaranteeFields.push({ label: "Garantia", value: guaranteeLabels[rent.guarantee] || rent.guarantee });
    if (rent.moveInDeadline) guaranteeFields.push({ label: "Prazo para mudança", value: moveInDeadlineLabels[rent.moveInDeadline] || rent.moveInDeadline });
    if (guaranteeFields.length > 0) {
      sections.push({ title: "Garantia e Prazo", icon: "📋", fields: guaranteeFields });
    }
  }

  return sections;
}

// ===== EMAIL COLORS =====

const colors = {
  primary: "#0d9488",
  primaryLight: "#f0fdfa",
  primaryDark: "#0f766e",
  text: "#18181b",
  muted: "#71717a",
  border: "#e4e4e7",
  white: "#ffffff",
  background: "#f4f4f5",
};

// ===== GENERATE EMAIL HTML =====

const generateEmailHTML = (
  city: string,
  uf: string,
  intention: string,
  sections: EmailSection[],
  leadId: string
): string => {
  const leadUrl = `https://proplisted-hub.lovable.app/leads?leadId=${leadId}`;

  const sectionsHTML = sections
    .map(
      (section) => `
        <div style="background-color: ${colors.white}; border: 1px solid ${colors.border}; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
          <h3 style="color: ${colors.primary}; font-size: 16px; font-weight: 600; margin: 0 0 16px 0; display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 20px;">${section.icon}</span> ${section.title}
          </h3>
          <table style="width: 100%; border-collapse: collapse;">
            ${section.fields
              .map(
                (field) => `
              <tr>
                <td style="color: ${colors.muted}; font-size: 14px; padding: 6px 0; width: 45%; vertical-align: top;">${field.label}:</td>
                <td style="color: ${colors.text}; font-size: 14px; padding: 6px 0; font-weight: 500;">${field.value}</td>
              </tr>
            `
              )
              .join("")}
          </table>
        </div>
      `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: ${colors.background}; padding: 40px 20px; margin: 0;">
      <div style="max-width: 600px; margin: 0 auto;">
        
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: ${colors.primary}; font-size: 32px; font-weight: 700; margin: 0;">🏠 LeadBay</h1>
        </div>
        
        <!-- Hero Card -->
        <div style="background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%); border-radius: 16px; padding: 32px; margin-bottom: 24px; text-align: center;">
          <h2 style="color: ${colors.white}; font-size: 24px; font-weight: 700; margin: 0 0 12px 0;">
            🎉 Novo lead na sua região!
          </h2>
          <div style="display: inline-block; background-color: rgba(255,255,255,0.2); color: ${colors.white}; padding: 8px 20px; border-radius: 24px; font-size: 16px; font-weight: 500;">
            📍 ${city}${uf ? `/${uf}` : ""}
          </div>
        </div>
        
        <!-- Intention Card -->
        <div style="background-color: ${colors.primaryLight}; border: 2px solid ${colors.primary}; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
          <p style="color: ${colors.muted}; font-size: 14px; margin: 0 0 4px 0;">Interesse:</p>
          <p style="color: ${colors.primary}; font-size: 22px; font-weight: 700; margin: 0;">
            ${intentionLabels[intention] || intention}
          </p>
        </div>
        
        <!-- Sections -->
        ${sectionsHTML}
        
        <!-- CTA Button -->
        <div style="text-align: center; margin: 32px 0;">
          <a href="${leadUrl}" style="display: inline-block; background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%); color: ${colors.white}; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 18px; font-weight: 600; box-shadow: 0 4px 12px rgba(13, 148, 136, 0.3);">
            Ver Lead →
          </a>
        </div>
        
        <!-- Privacy Note -->
        <div style="background-color: ${colors.white}; border: 1px solid ${colors.border}; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: center;">
          <p style="color: ${colors.muted}; font-size: 13px; margin: 0;">
            ⚠️ <strong>Privacidade:</strong> Este email não inclui nome, telefone ou email do lead.<br>
            Essas informações são reveladas apenas após a compra.
          </p>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center;">
          <p style="color: ${colors.muted}; font-size: 12px; line-height: 20px; margin: 0 0 16px 0;">
            Você recebeu este e-mail porque está cadastrado no LeadBay.<br>
            Para deixar de receber notificações, atualize suas preferências no LeadBay.
          </p>
          <p style="color: ${colors.muted}; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} LeadBay. Todos os direitos reservados.
          </p>
        </div>
        
      </div>
    </body>
    </html>
  `;
};

// ===== HANDLER =====

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // CORS restriction limits which domains can call this endpoint

    const { leadId, city, uf, intention, description, formData } =
      await req.json();

    if (!leadId || !city || !intention) {
      console.error("Missing required fields:", { leadId, city, intention });
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Processing notification for lead ${leadId} in ${city}/${uf}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, is_active")
      .not("email", "is", null)
      .eq("is_active", true);

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch profiles" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const emails = (profiles || []).map((p) => p.email).filter(Boolean) as string[];

    console.log(`Found ${emails.length} active profiles to notify`);

    if (emails.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No valid emails found", emailsSent: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const sections = extractAllCharacteristics(formData);
    console.log(`Extracted ${sections.length} sections from form data`);

    const emailHTML = generateEmailHTML(city, uf || "", intention, sections, leadId);

    let successCount = 0;
    let failCount = 0;

    for (const email of emails) {
      try {
        const { data, error: sendError } = await resend.emails.send({
          from: "LeadBay <noreply@leadbay.com.br>",
          to: [email],
          subject: `🏠 Novo lead em ${city}! Confira agora`,
          html: emailHTML,
        });

        if (sendError) {
          failCount++;
          console.error(`Resend rejected email to ${email}:`, JSON.stringify(sendError));
        } else {
          successCount++;
          console.log(`Email sent to ${email}. Resend ID: ${data?.id}`);
        }

        await new Promise(resolve => setTimeout(resolve, 600));
      } catch (emailError) {
        failCount++;
        console.error(`Exception sending email to ${email}:`, emailError);
      }
    }

    console.log(`Notification complete: ${successCount} sent, ${failCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Notifications sent`,
        emailsSent: successCount,
        emailsFailed: failCount,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in notify-new-lead:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
