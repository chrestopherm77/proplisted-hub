// Main intentions
export type LeadIntention = 'SELL' | 'BUY' | 'BUILD' | 'RENT';

// Property types
export type PropertyType = 'COMMERCIAL' | 'RESIDENTIAL' | 'MIXED' | 'RURAL';
export type CommercialType = 'BUILDING' | 'WAREHOUSE' | 'OFFICE' | 'STORE' | 'OTHER' | 'MULTIPLE';
export type ResidentialType = 'APARTMENT' | 'HOUSE' | 'KITNET' | 'LAND' | 'MULTIPLE';
export type RuralType = 'FARM' | 'SITIO' | 'CHACARA' | 'OTHER';

// Seller relation
export type SellerRelation = 'OWNER' | 'LEGAL_REP' | 'BROKER_EXCLUSIVE' | 'BROKER_NON_EXCLUSIVE';

// Sell flow data
export interface SellFlowData {
  relation?: SellerRelation;
  acceptsExclusivity?: 'YES' | 'NO' | 'DEPENDS';
  propertyType?: PropertyType;
  commercialType?: CommercialType;
  residentialType?: ResidentialType;
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
  size?: string;
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
  propertyStatus?: 'READY' | 'UNDER_CONSTRUCTION' | 'BOTH';
  propertyType?: string;
  prefersGatedCommunity?: boolean;
  bedrooms?: string;
  commercialType?: string;
  minSize?: string;
  bathrooms?: string;
  parkingSpots?: string;
  region?: string;
  budgetMin?: string;
  budgetMax?: string;
  paymentMethod?: string;
  isFinancingApproved?: boolean;
  isConsortiumContemplated?: boolean;
  tradeOfferType?: string;
  tradeOfferValue?: string;
  tradeOfferPaidOff?: boolean;
  deadline?: string;
}

// Build flow data
export interface BuildFlowData {
  purpose?: 'HOUSING' | 'INVESTMENT' | 'COMMERCIAL';
  hasLand?: 'YES' | 'NEGOTIATING' | 'NO';
  hasProject?: 'RESEARCHING' | 'YES' | 'IN_PROGRESS' | 'NO';
  floors?: string;
  area?: string;
  hasBuilder?: boolean;
  location?: string;
  budget?: string;
}

// Rent flow data
export interface RentFlowData {
  purpose?: 'HOUSING' | 'TEMPORARY' | 'COMMERCIAL';
  propertyType?: string;
  prefersGatedCommunity?: boolean;
  bedrooms?: string;
  bathrooms?: string;
  parkingSpots?: string;
  region?: string;
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
  email: string;
  
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
  email: '',
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
