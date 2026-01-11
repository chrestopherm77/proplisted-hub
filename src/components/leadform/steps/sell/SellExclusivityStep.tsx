import { StepProps } from "../../types";
import { StepContainer } from "../../StepContainer";
import { OptionCard } from "../../OptionCard";
import { Check, X, HelpCircle } from "lucide-react";

const options = [
  { value: 'YES', label: 'Sim', icon: <Check className="h-8 w-8" /> },
  { value: 'NO', label: 'Não', icon: <X className="h-8 w-8" /> },
  { value: 'DEPENDS', label: 'Depende da proposta', icon: <HelpCircle className="h-8 w-8" /> },
];

export function SellExclusivityStep({ data, updateFlowData }: StepProps) {
  return (
    <StepContainer
      title="Você aceitaria oferecer o imóvel com exclusividade?"
      subtitle="A exclusividade pode ajudar a vender mais rápido"
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {options.map((option) => (
          <OptionCard
            key={option.value}
            label={option.label}
            icon={option.icon}
            isSelected={data.sell?.acceptsExclusivity === option.value}
            onClick={() => updateFlowData('sell', { acceptsExclusivity: option.value as any })}
          />
        ))}
      </div>
    </StepContainer>
  );
}
