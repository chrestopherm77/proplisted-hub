import { StepProps } from "../../types";
import { StepContainer } from "../../StepContainer";
import { OptionCard } from "../../OptionCard";
import { Search, Check, Clock, X } from "lucide-react";

const options = [
  { value: 'RESEARCHING', label: 'Está apenas pesquisando ideias', icon: <Search className="h-8 w-8" /> },
  { value: 'YES', label: 'Sim', icon: <Check className="h-8 w-8" /> },
  { value: 'IN_PROGRESS', label: 'Está sendo elaborado', icon: <Clock className="h-8 w-8" /> },
  { value: 'NO', label: 'Ainda não possui', icon: <X className="h-8 w-8" /> },
];

export function BuildProjectStep({ data, updateFlowData }: StepProps) {
  return (
    <StepContainer
      title="Já possui projeto arquitetônico?"
      subtitle="Em qual fase está o planejamento?"
    >
      <div className="grid grid-cols-2 gap-4">
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
