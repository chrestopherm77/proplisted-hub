import { StepProps } from "../../types";
import { StepContainer } from "../../StepContainer";
import { OptionCard } from "../../OptionCard";
import { Check, Clock, X } from "lucide-react";

const options = [
  { value: 'YES', label: 'Sim', icon: <Check className="h-8 w-8" /> },
  { value: 'NEGOTIATING', label: 'Em negociação', icon: <Clock className="h-8 w-8" /> },
  { value: 'NO', label: 'Ainda não', icon: <X className="h-8 w-8" /> },
];

export function BuildLandStep({ data, updateFlowData }: StepProps) {
  return (
    <StepContainer
      title="Já possui terreno?"
      subtitle="Você já tem onde construir?"
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {options.map((option) => (
          <OptionCard
            key={option.value}
            label={option.label}
            icon={option.icon}
            isSelected={data.build?.hasLand === option.value}
            onClick={() => updateFlowData('build', { hasLand: option.value as any })}
          />
        ))}
      </div>
    </StepContainer>
  );
}
