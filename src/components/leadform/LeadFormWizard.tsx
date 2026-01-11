import { useState, useMemo, useCallback } from "react";
import { LeadFormData, initialFormData, StepProps } from "./types";
import { LeadFormProgress } from "./LeadFormProgress";
import { LeadFormNavigation } from "./LeadFormNavigation";
import { SuccessScreen } from "./SuccessScreen";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Step imports
import { IntentionStep } from "./steps/IntentionStep";
import { ContactStep } from "./steps/ContactStep";

// Sell steps
import { SellRelationStep } from "./steps/sell/SellRelationStep";
import { SellExclusivityStep } from "./steps/sell/SellExclusivityStep";
import { SellPropertyTypeStep } from "./steps/sell/SellPropertyTypeStep";
import { SellCommercialTypeStep } from "./steps/sell/SellCommercialTypeStep";
import { SellResidentialTypeStep } from "./steps/sell/SellResidentialTypeStep";
import { SellResidentialDetailsStep } from "./steps/sell/SellResidentialDetailsStep";
import { SellRuralTypeStep } from "./steps/sell/SellRuralTypeStep";
import { SellRuralDetailsStep } from "./steps/sell/SellRuralDetailsStep";
import { SellGeneralInfoStep } from "./steps/sell/SellGeneralInfoStep";
import { SellPaymentMethodsStep } from "./steps/sell/SellPaymentMethodsStep";
import { SellPropertyStatusStep } from "./steps/sell/SellPropertyStatusStep";
import { SellDocumentationStep } from "./steps/sell/SellDocumentationStep";
import { SellDeadlineStep } from "./steps/sell/SellDeadlineStep";

// Buy steps
import { BuyPurposeStep } from "./steps/buy/BuyPurposeStep";
import { BuyPropertyStatusStep } from "./steps/buy/BuyPropertyStatusStep";
import { BuyPropertyTypeStep } from "./steps/buy/BuyPropertyTypeStep";
import { BuyResidentialPrefsStep } from "./steps/buy/BuyResidentialPrefsStep";
import { BuyCommercialPrefsStep } from "./steps/buy/BuyCommercialPrefsStep";
import { BuyLocationBudgetStep } from "./steps/buy/BuyLocationBudgetStep";
import { BuyPaymentMethodStep } from "./steps/buy/BuyPaymentMethodStep";
import { BuyDeadlineStep } from "./steps/buy/BuyDeadlineStep";

// Build steps
import { BuildPurposeStep } from "./steps/build/BuildPurposeStep";
import { BuildLandStep } from "./steps/build/BuildLandStep";
import { BuildProjectStep } from "./steps/build/BuildProjectStep";
import { BuildCharacteristicsStep } from "./steps/build/BuildCharacteristicsStep";
import { BuildExecutionStep } from "./steps/build/BuildExecutionStep";

// Rent steps
import { RentPurposeStep } from "./steps/rent/RentPurposeStep";
import { RentPropertyTypeStep } from "./steps/rent/RentPropertyTypeStep";
import { RentPreferencesStep } from "./steps/rent/RentPreferencesStep";
import { RentLocationValueStep } from "./steps/rent/RentLocationValueStep";
import { RentGuaranteeStep } from "./steps/rent/RentGuaranteeStep";

interface StepDefinition {
  id: string;
  component: React.ComponentType<StepProps>;
  isVisible: (data: LeadFormData) => boolean;
  validate?: (data: LeadFormData) => boolean;
}

const allSteps: StepDefinition[] = [
  // Step 1: Intention (always visible)
  { 
    id: 'intention', 
    component: IntentionStep, 
    isVisible: () => true,
    validate: (data) => !!data.intention,
  },
  
  // SELL FLOW
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
    id: 'sell-residential-details', 
    component: SellResidentialDetailsStep, 
    isVisible: (data) => data.intention === 'SELL' && 
      data.sell?.propertyType === 'RESIDENTIAL' && 
      ['APARTMENT', 'HOUSE', 'KITNET'].includes(data.sell?.residentialType || ''),
    validate: (data) => !!data.sell?.bedrooms && !!data.sell?.bathrooms,
  },
  { 
    id: 'sell-rural-type', 
    component: SellRuralTypeStep, 
    isVisible: (data) => data.intention === 'SELL' && data.sell?.propertyType === 'RURAL',
    validate: (data) => !!data.sell?.ruralType,
  },
  { 
    id: 'sell-rural-details', 
    component: SellRuralDetailsStep, 
    isVisible: (data) => data.intention === 'SELL' && data.sell?.propertyType === 'RURAL',
    validate: (data) => !!data.sell?.ruralArea && !!data.sell?.ruralPurpose,
  },
  { 
    id: 'sell-general-info', 
    component: SellGeneralInfoStep, 
    isVisible: (data) => data.intention === 'SELL',
    validate: (data) => !!data.sell?.region && !!data.sell?.expectedValue,
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
    validate: (data) => data.sell?.wasAppraised !== undefined && data.sell?.isOccupied !== undefined,
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
    validate: (data) => !!data.sell?.deadline && !!data.sell?.motivation,
  },
  
  // BUY FLOW
  { 
    id: 'buy-purpose', 
    component: BuyPurposeStep, 
    isVisible: (data) => data.intention === 'BUY',
    validate: (data) => !!data.buy?.purpose,
  },
  { 
    id: 'buy-property-status', 
    component: BuyPropertyStatusStep, 
    isVisible: (data) => data.intention === 'BUY',
    validate: (data) => !!data.buy?.propertyStatus,
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
    isVisible: (data) => data.intention === 'BUY' && ['HOUSE', 'APARTMENT'].includes(data.buy?.propertyType || ''),
    validate: (data) => !!data.buy?.bedrooms,
  },
  { 
    id: 'buy-commercial-prefs', 
    component: BuyCommercialPrefsStep, 
    isVisible: (data) => data.intention === 'BUY' && data.buy?.propertyType === 'COMMERCIAL',
    validate: (data) => !!data.buy?.commercialType,
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
  
  // BUILD FLOW
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
    id: 'build-execution', 
    component: BuildExecutionStep, 
    isVisible: (data) => data.intention === 'BUILD',
    validate: (data) => data.build?.hasBuilder !== undefined && !!data.build?.budget,
  },
  
  // RENT FLOW
  { 
    id: 'rent-purpose', 
    component: RentPurposeStep, 
    isVisible: (data) => data.intention === 'RENT',
    validate: (data) => !!data.rent?.purpose,
  },
  { 
    id: 'rent-property-type', 
    component: RentPropertyTypeStep, 
    isVisible: (data) => data.intention === 'RENT',
    validate: (data) => !!data.rent?.propertyType,
  },
  { 
    id: 'rent-preferences', 
    component: RentPreferencesStep, 
    isVisible: (data) => data.intention === 'RENT',
    validate: (data) => !!data.rent?.bathrooms,
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
  
  // CONTACT (always last)
  { 
    id: 'contact', 
    component: ContactStep, 
    isVisible: (data) => !!data.intention,
    validate: (data) => !!data.name.trim() && data.phone.length >= 14,
  },
];

export function LeadFormWizard() {
  const [formData, setFormData] = useState<LeadFormData>(initialFormData);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  // Get visible steps based on current form data
  const visibleSteps = useMemo(() => {
    return allSteps.filter(step => step.isVisible(formData));
  }, [formData]);

  const currentStep = visibleSteps[currentStepIndex];
  const isLastStep = currentStepIndex === visibleSteps.length - 1;

  // Update form data
  const updateData = useCallback((updates: Partial<LeadFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  // Update flow-specific data
  const updateFlowData = useCallback(<K extends 'sell' | 'buy' | 'build' | 'rent'>(
    flow: K,
    updates: Partial<NonNullable<LeadFormData[K]>>
  ) => {
    setFormData(prev => ({
      ...prev,
      [flow]: { ...prev[flow], ...updates }
    }));
  }, []);

  // Navigation handlers
  const handleBack = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  }, [currentStepIndex]);

  const handleNext = useCallback(async () => {
    // Validate current step
    if (currentStep.validate && !currentStep.validate(formData)) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, preencha todos os campos antes de continuar.",
        variant: "destructive",
      });
      return;
    }

    if (isLastStep) {
      // Submit form
      setIsSubmitting(true);
      try {
        const { error } = await supabase
          .from('lead_submissions')
          .insert([{
            name: formData.name.trim(),
            phone: formData.phone,
            email: formData.email.trim() || null,
            intention: formData.intention!,
            form_data: JSON.parse(JSON.stringify({
              sell: formData.sell,
              buy: formData.buy,
              build: formData.build,
              rent: formData.rent,
            })),
          }]);

        if (error) throw error;

        setIsSubmitted(true);
      } catch (error) {
        console.error('Error submitting form:', error);
        toast({
          title: "Erro ao enviar",
          description: "Ocorreu um erro ao enviar o formulário. Por favor, tente novamente.",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  }, [currentStep, formData, isLastStep, toast]);

  // Reset form
  const handleReset = useCallback(() => {
    setFormData(initialFormData);
    setCurrentStepIndex(0);
    setIsSubmitted(false);
  }, []);

  // Check if can proceed
  const canGoNext = currentStep.validate ? currentStep.validate(formData) : true;

  if (isSubmitted) {
    return <SuccessScreen onReset={handleReset} />;
  }

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
