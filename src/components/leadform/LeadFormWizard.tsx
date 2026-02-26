import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { LeadFormData, initialFormData, StepProps } from "./types";
import { LeadFormProgress } from "./LeadFormProgress";
import { LeadFormNavigation } from "./LeadFormNavigation";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { generateDescription } from "@/lib/formatFormData";

// Default price for leads from form (in BRL)
const DEFAULT_LEAD_PRICE = 27.00;

const createClientUuid = () => {
  // Prefer the native UUID implementation when available
  if (typeof crypto !== "undefined" && "randomUUID" in crypto && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  // RFC4122 v4 UUID fallback using cryptographically secure random values
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);

    // Per RFC4122 section 4.4
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10

    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  // Very last resort (should practically never happen in modern browsers)
  return `fallback-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

// Step imports
import { IntentionStep } from "./steps/IntentionStep";
import { ContactStep } from "./steps/ContactStep";

// Sell steps
import { SellRelationStep } from "./steps/sell/SellRelationStep";
import { SellExclusivityStep } from "./steps/sell/SellExclusivityStep";
import { SellPropertyTypeStep } from "./steps/sell/SellPropertyTypeStep";
import { SellCommercialTypeStep } from "./steps/sell/SellCommercialTypeStep";
import { SellResidentialTypeStep } from "./steps/sell/SellResidentialTypeStep";
import { SellMixedTypeStep } from "./steps/sell/SellMixedTypeStep";
import { SellRuralDetailsStep } from "./steps/sell/SellRuralDetailsStep";
import { SellGeneralInfoStep } from "./steps/sell/SellGeneralInfoStep";
import { SellTerrainPositionStep } from "./steps/sell/SellTerrainPositionStep";
import { SellValueStep } from "./steps/sell/SellValueStep";
import { SellPaymentMethodsStep } from "./steps/sell/SellPaymentMethodsStep";
import { SellPropertyStatusStep } from "./steps/sell/SellPropertyStatusStep";
import { SellDocumentationStep } from "./steps/sell/SellDocumentationStep";
import { SellDeadlineStep } from "./steps/sell/SellDeadlineStep";

// Buy steps
import { BuyPurposeStep } from "./steps/buy/BuyPurposeStep";
import { BuyPropertyTypeStep } from "./steps/buy/BuyPropertyTypeStep";
import { BuyResidentialPrefsStep } from "./steps/buy/BuyResidentialPrefsStep";
import { BuyCommercialPrefsStep } from "./steps/buy/BuyCommercialPrefsStep";
import { BuyLandPrefsStep } from "./steps/buy/BuyLandPrefsStep";
import { BuyLocationBudgetStep } from "./steps/buy/BuyLocationBudgetStep";
import { BuyPaymentMethodStep } from "./steps/buy/BuyPaymentMethodStep";
import { BuyDeadlineStep } from "./steps/buy/BuyDeadlineStep";

// Build steps
import { BuildPurposeStep } from "./steps/build/BuildPurposeStep";
import { BuildLandStep } from "./steps/build/BuildLandStep";
import { BuildTopographyStep } from "./steps/build/BuildTopographyStep";
import { BuildProjectStep } from "./steps/build/BuildProjectStep";
import { BuildCharacteristicsStep } from "./steps/build/BuildCharacteristicsStep";
import { BuildKnowledgeStep } from "./steps/build/BuildKnowledgeStep";
import { BuildLocationStep } from "./steps/build/BuildLocationStep";
import { BuildBTSConfirmStep } from "./steps/build/BuildBTSConfirmStep";
import { BuildBTSStep } from "./steps/build/BuildBTSStep";
import { BuildBudgetStep } from "./steps/build/BuildBudgetStep";
import { BuildPaymentStep } from "./steps/build/BuildPaymentStep";
import { BuildDeadlineStep } from "./steps/build/BuildDeadlineStep";

// Rent steps
import { RentPurposeStep } from "./steps/rent/RentPurposeStep";
import { RentPropertyTypeStep } from "./steps/rent/RentPropertyTypeStep";
import { RentResidentialPrefsStep } from "./steps/rent/RentResidentialPrefsStep";
import { RentCommercialPrefsStep } from "./steps/rent/RentCommercialPrefsStep";
import { RentLocationValueStep } from "./steps/rent/RentLocationValueStep";
import { RentGuaranteeStep } from "./steps/rent/RentGuaranteeStep";

interface StepDefinition {
  id: string;
  component: React.ComponentType<StepProps>;
  isVisible: (data: LeadFormData) => boolean;
  validate?: (data: LeadFormData) => boolean;
}

const intentionStep: StepDefinition = { 
  id: 'intention', 
  component: IntentionStep, 
  isVisible: () => true,
  validate: (data) => !!data.intention,
};

const contactStep: StepDefinition = { 
  id: 'contact', 
  component: ContactStep, 
  isVisible: (data) => !!data.intention,
  validate: (data) => !!data.name.trim() && data.phone.length >= 14 && data.phoneVerified && data.acceptedTerms,
};

const flowSteps: StepDefinition[] = [
  // ============ SELL FLOW ============
  { 
    id: 'sell-relation', 
    component: SellRelationStep, 
    isVisible: (data) => data.intention === 'SELL',
    validate: (data) => !!data.sell?.relation,
  },
  { 
    id: 'sell-exclusivity', 
    component: SellExclusivityStep, 
    isVisible: (data) => data.intention === 'SELL',
    validate: (data) => !!data.sell?.acceptsExclusivity,
  },
  { 
    id: 'sell-property-type', 
    component: SellPropertyTypeStep, 
    isVisible: (data) => data.intention === 'SELL',
    validate: (data) => !!data.sell?.propertyType,
  },
  { 
    id: 'sell-commercial-type', 
    component: SellCommercialTypeStep, 
    isVisible: (data) => data.intention === 'SELL' && data.sell?.propertyType === 'COMMERCIAL',
    validate: (data) => !!data.sell?.commercialType,
  },
  { 
    id: 'sell-residential-type', 
    component: SellResidentialTypeStep, 
    isVisible: (data) => data.intention === 'SELL' && data.sell?.propertyType === 'RESIDENTIAL',
    validate: (data) => !!data.sell?.residentialType,
  },
  { 
    id: 'sell-mixed-type', 
    component: SellMixedTypeStep, 
    isVisible: (data) => data.intention === 'SELL' && data.sell?.propertyType === 'MIXED',
    validate: (data) => !!data.sell?.mixedType,
  },
  { 
    id: 'sell-rural-details', 
    component: SellRuralDetailsStep, 
    isVisible: (data) => data.intention === 'SELL' && data.sell?.propertyType === 'RURAL',
    validate: (data) => !!data.sell?.ruralArea,
  },
  { 
    id: 'sell-general-info', 
    component: SellGeneralInfoStep, 
    isVisible: (data) => data.intention === 'SELL',
    validate: (data) => !!data.sell?.region,
  },
  { 
    id: 'sell-terrain-position', 
    component: SellTerrainPositionStep, 
    isVisible: (data) => data.intention === 'SELL' && data.sell?.propertyType === 'LAND',
    validate: (data) => !!data.sell?.terrainPosition,
  },
  { 
    id: 'sell-value', 
    component: SellValueStep, 
    isVisible: (data) => data.intention === 'SELL',
    validate: (data) => !!data.sell?.expectedValue,
  },
  { 
    id: 'sell-payment-methods', 
    component: SellPaymentMethodsStep, 
    isVisible: (data) => data.intention === 'SELL',
    validate: (data) => (data.sell?.paymentMethods?.length || 0) > 0,
  },
  { 
    id: 'sell-property-status', 
    component: SellPropertyStatusStep, 
    isVisible: (data) => data.intention === 'SELL',
    validate: (data) => data.sell?.isOccupied !== undefined,
  },
  { 
    id: 'sell-documentation', 
    component: SellDocumentationStep, 
    isVisible: (data) => data.intention === 'SELL',
    validate: (data) => !!data.sell?.documentation,
  },
  { 
    id: 'sell-deadline', 
    component: SellDeadlineStep, 
    isVisible: (data) => data.intention === 'SELL',
    validate: (data) => !!data.sell?.deadline,
  },
  
  // ============ BUY FLOW ============
  { 
    id: 'buy-purpose', 
    component: BuyPurposeStep, 
    isVisible: (data) => data.intention === 'BUY',
    validate: (data) => !!data.buy?.purpose,
  },
  { 
    id: 'buy-property-type', 
    component: BuyPropertyTypeStep, 
    isVisible: (data) => data.intention === 'BUY',
    validate: (data) => !!data.buy?.propertyType,
  },
  { 
    id: 'buy-residential-prefs', 
    component: BuyResidentialPrefsStep, 
    isVisible: (data) => data.intention === 'BUY' && ['HOUSE', 'APARTMENT', 'KITNET'].includes(data.buy?.propertyType || ''),
    validate: (data) => !!data.buy?.bedrooms,
  },
  { 
    id: 'buy-commercial-prefs', 
    component: BuyCommercialPrefsStep, 
    isVisible: (data) => data.intention === 'BUY' && data.buy?.propertyType === 'COMMERCIAL',
    validate: (data) => !!data.buy?.commercialType,
  },
  { 
    id: 'buy-land-prefs', 
    component: BuyLandPrefsStep, 
    isVisible: (data) => data.intention === 'BUY' && data.buy?.propertyType === 'LAND',
    validate: (data) => !!data.buy?.landMinSize,
  },
  { 
    id: 'buy-location-budget', 
    component: BuyLocationBudgetStep, 
    isVisible: (data) => data.intention === 'BUY',
    validate: (data) => !!data.buy?.region,
  },
  { 
    id: 'buy-payment-method', 
    component: BuyPaymentMethodStep, 
    isVisible: (data) => data.intention === 'BUY',
    validate: (data) => !!data.buy?.paymentMethod,
  },
  { 
    id: 'buy-deadline', 
    component: BuyDeadlineStep, 
    isVisible: (data) => data.intention === 'BUY',
    validate: (data) => !!data.buy?.deadline,
  },
  
  // ============ BUILD FLOW ============
  { 
    id: 'build-purpose', 
    component: BuildPurposeStep, 
    isVisible: (data) => data.intention === 'BUILD',
    validate: (data) => !!data.build?.purpose,
  },
  { 
    id: 'build-land', 
    component: BuildLandStep, 
    isVisible: (data) => data.intention === 'BUILD',
    validate: (data) => !!data.build?.hasLand,
  },
  { 
    id: 'build-topography', 
    component: BuildTopographyStep, 
    isVisible: (data) => data.intention === 'BUILD' && (data.build?.hasLand === 'YES' || data.build?.hasLand === 'NEGOTIATING'),
    validate: (data) => !!data.build?.topography,
  },
  { 
    id: 'build-project', 
    component: BuildProjectStep, 
    isVisible: (data) => data.intention === 'BUILD',
    validate: (data) => !!data.build?.hasProject,
  },
  { 
    id: 'build-characteristics', 
    component: BuildCharacteristicsStep, 
    isVisible: (data) => data.intention === 'BUILD',
    validate: (data) => !!data.build?.floors && !!data.build?.area,
  },
  { 
    id: 'build-knowledge', 
    component: BuildKnowledgeStep, 
    isVisible: (data) => data.intention === 'BUILD',
    validate: (data) => data.build?.hasKnowledge !== undefined,
  },
  { 
    id: 'build-location', 
    component: BuildLocationStep, 
    isVisible: (data) => data.intention === 'BUILD',
    validate: (data) => !!data.build?.location,
  },
  { 
    id: 'build-bts-confirm', 
    component: BuildBTSConfirmStep, 
    // Só mostra se NÃO escolheu BTS_INTEREST na etapa do terreno
    isVisible: (data) => data.intention === 'BUILD' && data.build?.hasLand !== 'BTS_INTEREST',
    validate: (data) => data.build?.isBTSConfirmed !== undefined,
  },
  { 
    id: 'build-bts', 
    component: BuildBTSStep, 
    // Mostra se confirmou BTS OU se já escolheu BTS_INTEREST antes
    isVisible: (data) => data.intention === 'BUILD' && (data.build?.isBTSConfirmed === true || data.build?.hasLand === 'BTS_INTEREST'),
    validate: (data) => !!data.build?.btsRentRange && !!data.build?.btsMinContractTerm,
  },
  { 
    id: 'build-budget', 
    component: BuildBudgetStep, 
    isVisible: (data) => data.intention === 'BUILD',
    validate: (data) => !!data.build?.budget,
  },
  { 
    id: 'build-payment', 
    component: BuildPaymentStep, 
    isVisible: (data) => data.intention === 'BUILD',
    validate: (data) => !!data.build?.paymentMethod,
  },
  { 
    id: 'build-deadline', 
    component: BuildDeadlineStep, 
    isVisible: (data) => data.intention === 'BUILD',
    validate: (data) => !!data.build?.deadline,
  },
  
  // ============ RENT FLOW ============
  { 
    id: 'rent-purpose', 
    component: RentPurposeStep, 
    isVisible: (data) => data.intention === 'RENT',
    validate: (data) => !!data.rent?.purpose,
  },
  { 
    id: 'rent-property-type', 
    component: RentPropertyTypeStep, 
    isVisible: (data) => data.intention === 'RENT' && (data.rent?.purpose === 'HOUSING' || data.rent?.purpose === 'TEMPORARY'),
    validate: (data) => !!data.rent?.propertyType,
  },
  { 
    id: 'rent-residential-prefs', 
    component: RentResidentialPrefsStep, 
    isVisible: (data) => data.intention === 'RENT' && (data.rent?.purpose === 'HOUSING' || data.rent?.purpose === 'TEMPORARY'),
    validate: (data) => !!data.rent?.bedrooms,
  },
  { 
    id: 'rent-commercial-prefs', 
    component: RentCommercialPrefsStep, 
    isVisible: (data) => data.intention === 'RENT' && data.rent?.purpose === 'COMMERCIAL',
    validate: (data) => !!data.rent?.propertyType,
  },
  { 
    id: 'rent-location-value', 
    component: RentLocationValueStep, 
    isVisible: (data) => data.intention === 'RENT',
    validate: (data) => !!data.rent?.region && !!data.rent?.maxRent,
  },
  { 
    id: 'rent-guarantee', 
    component: RentGuaranteeStep, 
    isVisible: (data) => data.intention === 'RENT',
    validate: (data) => !!data.rent?.guarantee && !!data.rent?.moveInDeadline,
  },
  
];

interface LeadFormWizardProps {
  contactAtEnd?: boolean;
  thankYouPath?: string;
}

export function LeadFormWizard({ contactAtEnd = false, thankYouPath = '/lp-obrigado' }: LeadFormWizardProps) {
  const [formData, setFormData] = useState<LeadFormData>(initialFormData);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // --- Tracking ---
  const sessionIdRef = useRef<string>('');
  if (!sessionIdRef.current) {
    const VISITOR_KEY = 'lb_visitor_id';
    let visitorId = localStorage.getItem(VISITOR_KEY);
    if (!visitorId) {
      visitorId = createClientUuid();
      localStorage.setItem(VISITOR_KEY, visitorId);
    }
    sessionIdRef.current = visitorId;
  }
  const partialLeadCreatedRef = useRef(false);
  const [detectedCity, setDetectedCity] = useState<string | null>(null);
  const [detectedUf, setDetectedUf] = useState<string | null>(null);

  // Track page view on mount
  useEffect(() => {
    supabase.from('lp_page_views').insert([{
      session_id: sessionIdRef.current,
      user_agent: navigator.userAgent,
      referrer: document.referrer || null,
      screen_width: screen.width,
      screen_height: screen.height,
      language: navigator.language,
    }]).then(({ error }) => {
      if (error) console.error('Page view tracking error:', error);
    });

    // Geolocation: detect city on mobile
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=pt-BR`,
              { headers: { 'User-Agent': 'LeadBay/1.0' } }
            );
            const data = await res.json();
            const city = data?.address?.city || data?.address?.town || data?.address?.village;
            const state = data?.address?.state;
            if (city) setDetectedCity(city);
            if (state) {
              // Map full state name to UF abbreviation
              const stateToUf: Record<string, string> = {
                'Acre': 'AC', 'Alagoas': 'AL', 'Amapá': 'AP', 'Amazonas': 'AM',
                'Bahia': 'BA', 'Ceará': 'CE', 'Distrito Federal': 'DF', 'Espírito Santo': 'ES',
                'Goiás': 'GO', 'Maranhão': 'MA', 'Mato Grosso': 'MT', 'Mato Grosso do Sul': 'MS',
                'Minas Gerais': 'MG', 'Pará': 'PA', 'Paraíba': 'PB', 'Paraná': 'PR',
                'Pernambuco': 'PE', 'Piauí': 'PI', 'Rio de Janeiro': 'RJ', 'Rio Grande do Norte': 'RN',
                'Rio Grande do Sul': 'RS', 'Rondônia': 'RO', 'Roraima': 'RR', 'Santa Catarina': 'SC',
                'São Paulo': 'SP', 'Sergipe': 'SE', 'Tocantins': 'TO',
              };
              setDetectedUf(stateToUf[state] || state);
            }
          } catch (err) {
            console.warn('Geolocation reverse geocode failed:', err);
          }
        },
        () => { /* user denied or unavailable */ },
        { timeout: 10000, maximumAge: 300000 }
      );
    }
  }, []);

  const allSteps = useMemo(() => {
    if (contactAtEnd) {
      return [intentionStep, ...flowSteps, contactStep];
    }
    return [intentionStep, contactStep, ...flowSteps];
  }, [contactAtEnd]);

  const visibleSteps = useMemo(() => {
    return allSteps.filter(step => step.isVisible(formData));
  }, [formData, allSteps]);

  const currentStep = visibleSteps[currentStepIndex];
  const isLastStep = currentStepIndex === visibleSteps.length - 1;

  const updateData = useCallback((updates: Partial<LeadFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  const updateFlowData = useCallback(<K extends 'sell' | 'buy' | 'build' | 'rent'>(
    flow: K,
    updates: Partial<NonNullable<LeadFormData[K]>>
  ) => {
    setFormData(prev => ({
      ...prev,
      [flow]: { ...prev[flow], ...updates }
    }));
  }, []);

  const handleBack = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  }, [currentStepIndex]);

  // Auto-fill location from geolocation when intention is set
  useEffect(() => {
    if (!detectedCity || !formData.intention) return;
    const flow = formData.intention.toLowerCase() as 'sell' | 'buy' | 'build' | 'rent';
    const flowData = formData[flow];
    // Only pre-fill if city is not already set
    if (flowData && !flowData.city) {
      const updates: Record<string, string> = { city: detectedCity };
      if (detectedUf && !flowData.uf) updates.uf = detectedUf;
      updateFlowData(flow, updates);
    }
  }, [detectedCity, detectedUf, formData.intention]);

  // Helper: track partial lead creation/update (fire-and-forget)
  const trackPartialLead = useCallback((stepIndex: number) => {
    const step = visibleSteps[stepIndex];
    if (!step) return;

    // Only track after contact has been validated (name + phone required)
    const hasContact = formData.name.trim().length > 0 && formData.phone.length >= 14;
    if (!hasContact) return;

    const formDataJson = {
      intention: formData.intention,
      sell: formData.sell || {},
      buy: formData.buy || {},
      build: formData.build || {},
      rent: formData.rent || {},
    };

    const payload = {
      session_id: sessionIdRef.current,
      name: formData.name.trim() || null,
      phone: formData.phone || null,
      intention: formData.intention || null,
      current_step: step.id,
      step_index: stepIndex,
      total_steps: visibleSteps.length,
      form_data: JSON.parse(JSON.stringify(formDataJson)),
    };

    if (!partialLeadCreatedRef.current) {
      partialLeadCreatedRef.current = true;
      supabase.from('lp_partial_leads').insert([payload])
        .then(({ error }) => { if (error) console.error('Partial lead insert error:', error); });
    } else {
      supabase.from('lp_partial_leads')
        .update({
          current_step: payload.current_step,
          step_index: payload.step_index,
          total_steps: payload.total_steps,
          intention: payload.intention,
          name: payload.name,
          phone: payload.phone,
          form_data: payload.form_data,
        })
        .eq('session_id', sessionIdRef.current)
        .then(({ error }) => { if (error) console.error('Partial lead update error:', error); });
    }
  }, [formData, visibleSteps]);

  // Auto-save progress with debounce — only after contact is validated
  useEffect(() => {
    const hasContact = formData.name.trim().length > 0 && formData.phone.length >= 14;
    if (!hasContact) return;
    const timer = setTimeout(() => {
      trackPartialLead(currentStepIndex);
    }, 2000);
    return () => clearTimeout(timer);
  }, [currentStepIndex, formData, trackPartialLead]);

  const handleNext = useCallback(async () => {
    if (currentStep.validate && !currentStep.validate(formData)) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, preencha todos os campos antes de continuar.",
        variant: "destructive",
      });
      return;
    }

    if (isLastStep) {
      setIsSubmitting(true);
      try {
        // Generate UUID client-side to avoid needing SELECT permission
        const submissionId = createClientUuid();

        // Prepare form_data object
        const formDataJson = {
          intention: formData.intention,
          sell: formData.sell,
          buy: formData.buy,
          build: formData.build,
          rent: formData.rent,
        };

        // 1. First save to lead_submissions (backup) with pre-generated ID
        const { error: submissionError } = await supabase
          .from('lead_submissions')
          .insert([{
            id: submissionId,
            name: formData.name.trim(),
            phone: formData.phone,
            email: formData.email.trim() || null,
            intention: formData.intention!,
            form_data: JSON.parse(JSON.stringify(formDataJson)),
          }]);

        if (submissionError) throw submissionError;

        // 2. Generate description for marketplace
        const description = generateDescription(formData);

        // 3. Generate a UUID for the lead
        const leadId = createClientUuid();

        // 4. Create lead in marketplace
        const { error: leadError } = await supabase
          .from('leads')
          .insert([{
            id: leadId,
            name: formData.name.trim(),
            phone: formData.phone,
            description: description,
            price: DEFAULT_LEAD_PRICE,
            form_data: JSON.parse(JSON.stringify(formDataJson)),
            lead_submission_id: submissionId,
            is_active: true,
            max_purchases: 5,
            purchase_count: 0,
          }]);

        if (leadError) throw leadError;

        // 5. Notify users in the same city (fire-and-forget)
        const leadCity = formData.sell?.city || formData.buy?.city || 
                         formData.build?.city || formData.rent?.city;
        const leadUf = formData.sell?.uf || formData.buy?.uf || 
                       formData.build?.uf || formData.rent?.uf;

        if (leadCity) {
          const safeFormData = {
            intention: formData.intention,
            sell: formData.sell ? { ...formData.sell } : undefined,
            buy: formData.buy ? { ...formData.buy } : undefined,
            build: formData.build ? { ...formData.build } : undefined,
            rent: formData.rent ? { ...formData.rent } : undefined,
          };

          supabase.functions.invoke('notify-new-lead', {
            body: {
              leadId,
              city: leadCity,
              uf: leadUf,
              intention: formData.intention,
              description,
              formData: safeFormData,
            }
          }).catch(err => {
            console.error('Error sending notifications:', err);
          });
        }

        // 6. Mark partial lead as completed
        supabase.from('lp_partial_leads')
          .update({ completed: true })
          .eq('session_id', sessionIdRef.current)
          .then(({ error }) => { if (error) console.error('Mark completed error:', error); });

        navigate(thankYouPath);
      } catch (error) {
        const err = error as any;
        console.error('Error submitting form:', {
          message: err?.message,
          code: err?.code,
          details: err?.details,
          hint: err?.hint,
          original: err,
        });

        toast({
          title: "Erro ao enviar",
          description: `Ocorreu um erro ao enviar o formulário. (${err?.code ?? 'SEM_CODIGO'}) ${err?.message ?? ''}`.trim(),
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    } else {
      const nextIndex = currentStepIndex + 1;
      trackPartialLead(nextIndex);
      setCurrentStepIndex(nextIndex);
    }
  }, [currentStep, formData, isLastStep, toast]);

  const handleReset = useCallback(() => {
    setFormData(initialFormData);
    setCurrentStepIndex(0);
  }, []);

  const canGoNext = currentStep.validate ? currentStep.validate(formData) : true;

  const CurrentStepComponent = currentStep.component;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <LeadFormProgress
        currentStep={currentStepIndex + 1}
        totalSteps={visibleSteps.length}
      />

      <div className="mt-8 min-h-[400px]">
        <CurrentStepComponent
          data={formData}
          updateData={updateData}
          updateFlowData={updateFlowData}
        />
      </div>

      <LeadFormNavigation
        onBack={handleBack}
        onNext={handleNext}
        canGoBack={currentStepIndex > 0}
        canGoNext={canGoNext}
        isLastStep={isLastStep}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
