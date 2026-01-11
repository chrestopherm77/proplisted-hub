import { StepProps } from "../../types";
import { StepContainer } from "../../StepContainer";
import { OptionCard } from "../../OptionCard";
import { CheckCircle, Clock, HelpCircle, AlertTriangle } from "lucide-react";

const options = [
  { value: 'regularized', label: 'Regularizada', icon: <CheckCircle className="h-8 w-8" /> },
  { value: 'in_progress', label: 'Em processo de regularização', icon: <Clock className="h-8 w-8" /> },
  { value: 'unknown', label: 'Ainda não sei', icon: <HelpCircle className="h-8 w-8" /> },
  { value: 'pending', label: 'Possui pendências', icon: <AlertTriangle className="h-8 w-8" /> },
];

export function SellDocumentationStep({ data, updateFlowData }: StepProps) {
  return (
    <StepContainer
      title="Como está a documentação do imóvel hoje?"
      subtitle="Selecione a situação atual"
    >
      <div className="grid grid-cols-2 gap-4">
        {options.map((option) => (
          <OptionCard
            key={option.value}
            label={option.label}
            icon={option.icon}
            isSelected={data.sell?.documentation === option.value}
            onClick={() => updateFlowData('sell', { documentation: option.value })}
          />
        ))}
      </div>
    </StepContainer>
  );
}
