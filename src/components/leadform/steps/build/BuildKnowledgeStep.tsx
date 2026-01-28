import { StepProps } from "../../types";
import { StepContainer } from "../../StepContainer";
import { OptionCard } from "../../OptionCard";
import { Check, X } from "lucide-react";

const options = [
  { value: 'yes', label: 'Sim', icon: <Check className="h-8 w-8" /> },
  { value: 'no', label: 'Não', icon: <X className="h-8 w-8" /> },
];

export function BuildKnowledgeStep({ data, updateFlowData }: StepProps) {
  return (
    <StepContainer
      title="Você já possui construtor definido para executar a obra?"
      subtitle="Já tem uma construtora ou engenheiro responsável?"
    >
      <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
        {options.map((option) => (
          <OptionCard
            key={option.value}
            label={option.label}
            icon={option.icon}
            isSelected={data.build?.hasKnowledge === (option.value === 'yes')}
            onClick={() => updateFlowData('build', { hasKnowledge: option.value === 'yes' })}
          />
        ))}
      </div>
    </StepContainer>
  );
}
