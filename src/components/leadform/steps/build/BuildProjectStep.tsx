import { StepProps } from "../../types";
import { StepContainer } from "../../StepContainer";
import { OptionCard } from "../../OptionCard";
import { Check, Clock, X } from "lucide-react";

const options = [
  { value: 'YES', label: 'Sim', icon: <Check className="h-8 w-8" /> },
  { value: 'IN_PROGRESS', label: 'Está sendo elaborado', icon: <Clock className="h-8 w-8" /> },
  { value: 'NO', label: 'Ainda não possuo', icon: <X className="h-8 w-8" /> },
];

export function BuildProjectStep({ data, updateFlowData }: StepProps) {
  return (
    <StepContainer
      title="Você já possui um projeto arquitetônico?"
      subtitle="Em qual fase está o planejamento?"
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {options.map((option) => (
          <OptionCard
            key={option.value}
            label={option.label}
            icon={option.icon}
            isSelected={data.build?.hasProject === option.value}
            onClick={() => updateFlowData('build', { hasProject: option.value as any })}
          />
        ))}
      </div>
    </StepContainer>
  );
}
