// Main intentions
export type LeadIntention = 'SELL' | 'BUY' | 'BUILD' | 'RENT';

// Property types
export type PropertyType = 'COMMERCIAL' | 'RESIDENTIAL' | 'MIXED' | 'RURAL' | 'LAND';
export type CommercialType = 'BUILDING' | 'WAREHOUSE' | 'OFFICE' | 'STORE' | 'HOUSE' | 'OTHER' | 'MULTIPLE';
export type ResidentialType = 'APARTMENT' | 'HOUSE' | 'KITNET' | 'LAND' | 'MULTIPLE';
export type MixedType = 'APARTMENT' | 'HOUSE' | 'KITNET' | 'MULTIPLE';
export type RuralType = 'FARM' | 'SITIO' | 'CHACARA' | 'OTHER';
export type Topography = 'FLAT' | 'UPHILL' | 'DOWNHILL' | 'UNKNOWN';

// Seller relation
export type SellerRelation = 'OWNER' | 'LEGAL_REP';

// Sell flow data
export interface SellFlowData {
  relation?: SellerRelation;
  isRealtor?: boolean;
  acceptsExclusivity?: 'YES' | 'NO' | 'DEPENDS';
  propertyType?: PropertyType;
  commercialType?: CommercialType;
  commercialBedrooms?: string;
  commercialBathrooms?: string;
  commercialParkingSpots?: string;
  residentialType?: ResidentialType;
  residentialTopography?: Topography;
  mixedType?: MixedType;
  ruralType?: RuralType;
  bedrooms?: string;
  bathrooms?: string;
  parkingSpots?: string;
  ruralArea?: string;
  ruralPurpose?: string;
  improvements?: string[];
  access?: string;
  waterResources?: string[];
  region?: string;
  uf?: string;
  city?: string;
  neighborhood?: string;
  size?: string;
  terrainPosition?: 'CORNER' | 'MIDDLE' | 'UNKNOWN';
  expectedValue?: string;
  paymentMethods?: string[];
  wasAppraised?: boolean;
  isOccupied?: boolean;
  occupantHasPreference?: 'YES' | 'NO' | 'NOT_ASKED';
  documentation?: string;
  deadline?: string;
  motivation?: string;
}

// Buy flow data
export interface BuyFlowData {
  purpose?: 'HOUSING' | 'INVESTMENT' | 'COMMERCIAL';
  propertyType?: string;
  // Condição (novo/usado)
  propertyCondition?: 'NEW' | 'USED' | 'BOTH';
  // Residential prefs
  prefersGatedCommunity?: boolean;
  bedrooms?: string;
  bathrooms?: string;
  parkingSpots?: string;
  propertyReadyStatus?: 'READY' | 'UNDER_CONSTRUCTION' | 'BOTH';
  // Commercial prefs
  commercialType?: string;
  minSize?: string;
  // Land prefs
  landMinSize?: string;
  landPrefersGated?: boolean;
  // Location/Budget
  region?: string;
  uf?: string;
  city?: string;
  zone?: string;
  neighborhood?: string;
  budgetMin?: string;
  budgetMax?: string;
  // Payment
  paymentMethod?: string;
  isFinancingApproved?: boolean;
  isConsortiumContemplated?: boolean;
  tradeOfferType?: string;
  tradeOfferValue?: string;
  tradeOfferPaidOff?: boolean;
  // Deadline
  deadline?: string;
}

// Build flow data
export interface BuildFlowData {
  purpose?: 'HOUSING' | 'INVESTMENT' | 'COMMERCIAL';
  hasLand?: 'YES' | 'NEGOTIATING' | 'NO' | 'BTS_INTEREST';
  topography?: Topography;
  hasProject?: 'YES' | 'IN_PROGRESS' | 'NO';
  floors?: string;
  area?: string;
  hasKnowledge?: boolean;
  location?: string;
  uf?: string;
  city?: string;
  neighborhood?: string;
  // BTS (Built To Suit)
  isBTSConfirmed?: boolean;
  btsRentRange?: string;
  btsMinContractTerm?: string;
  // Budget
  budget?: string;
  // Payment
  paymentMethod?: string;
  isFinancingApproved?: boolean;
  isConsortiumContemplated?: boolean;
  tradeOfferType?: string;
  tradeOfferValue?: string;
  tradeOfferPaidOff?: boolean;
  // Deadline
  deadline?: string;
}

// Rent flow data
export interface RentFlowData {
  purpose?: 'HOUSING' | 'TEMPORARY' | 'COMMERCIAL';
  propertyType?: string;
  prefersGatedCommunity?: boolean;
  bedrooms?: string;
  bathrooms?: string;
  parkingSpots?: string;
  minSize?: string;
  region?: string;
  uf?: string;
  city?: string;
  zone?: string;
  neighborhood?: string;
  maxRent?: string;
  includesCondoAndTax?: boolean;
  guarantee?: string;
  moveInDeadline?: string;
}

// Complete form data
export interface LeadFormData {
  // Step 1
  intention: LeadIntention | null;
  
  // Contact data (final step)
  name: string;
  phone: string;
  phoneVerified: boolean;
  email: string;
  acceptedTerms: boolean;
  
  // Flow-specific data
  sell?: SellFlowData;
  buy?: BuyFlowData;
  build?: BuildFlowData;
  rent?: RentFlowData;
}

// Initial form state
export const initialFormData: LeadFormData = {
  intention: null,
  name: '',
  phone: '',
  phoneVerified: false,
  email: '',
  acceptedTerms: false,
};

// Step definition
export interface StepDefinition {
  id: string;
  component: React.ComponentType<StepProps>;
  isVisible: (data: LeadFormData) => boolean;
}

// Step props
export interface StepProps {
  data: LeadFormData;
  updateData: (updates: Partial<LeadFormData>) => void;
  updateFlowData: <K extends 'sell' | 'buy' | 'build' | 'rent'>(
    flow: K,
    updates: Partial<NonNullable<LeadFormData[K]>>
  ) => void;
}

// Option card item
export interface OptionItem {
  value: string;
  label: string;
  icon?: React.ReactNode;
}
