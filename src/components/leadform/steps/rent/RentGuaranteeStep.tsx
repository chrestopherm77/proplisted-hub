import { StepProps } from "../../types";
import { StepContainer } from "../../StepContainer";
import { OptionCard } from "../../OptionCard";
import { Shield, Wallet, Users, CreditCard, HelpCircle, Clock } from "lucide-react";

const guaranteeOptions = [
  { value: 'insurance', label: 'Seguro fiança', icon: <Shield className="h-6 w-6" /> },
  { value: 'deposit', label: 'Caução', icon: <Wallet className="h-6 w-6" /> },
  { value: 'guarantor', label: 'Fiador', icon: <Users className="h-6 w-6" /> },
  { value: 'capitalization', label: 'Título de capitalização', icon: <CreditCard className="h-6 w-6" /> },
  { value: 'unknown', label: 'Ainda não sei', icon: <HelpCircle className="h-6 w-6" /> },
];

const deadlineOptions = [
  { value: 'immediately', label: 'Imediatamente', icon: <Clock className="h-6 w-6" /> },
  { value: 'up_to_30_days', label: 'Até 30 dias', icon: <Clock className="h-6 w-6" /> },
  { value: '1_to_3_months', label: 'De 1 a 3 meses', icon: <Clock className="h-6 w-6" /> },
  { value: 'more_than_3_months', label: 'Mais de 3 meses', icon: <Clock className="h-6 w-6" /> },
];

export function RentGuaranteeStep({ data, updateFlowData }: StepProps) {
  return (
    <StepContainer
      title="Garantia e prazo"
      subtitle="Informações finais sobre o aluguel"
    >
      <div className="space-y-8">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Garantia locatícia preferida</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {guaranteeOptions.map((option) => (
              <OptionCard
                key={option.value}
                label={option.label}
                icon={option.icon}
                isSelected={data.rent?.guarantee === option.value}
                onClick={() => updateFlowData('rent', { guarantee: option.value })}
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Prazo para mudança</h3>
          <div className="grid grid-cols-2 gap-4">
            {deadlineOptions.map((option) => (
              <OptionCard
                key={option.value}
                label={option.label}
                icon={option.icon}
                isSelected={data.rent?.moveInDeadline === option.value}
                onClick={() => updateFlowData('rent', { moveInDeadline: option.value })}
              />
            ))}
          </div>
        </div>
      </div>
    </StepContainer>
  );
}
