import { StepProps } from "../../types";
import { StepContainer } from "../../StepContainer";
import { OptionCard } from "../../OptionCard";
import { Check, X } from "lucide-react";

const options = [
  { value: true, label: 'Sim', icon: <Check className="h-8 w-8" /> },
  { value: false, label: 'Não', icon: <X className="h-8 w-8" /> },
];

export function BuildBTSConfirmStep({ data, updateFlowData }: StepProps) {
  return (
    <StepContainer
      title="É BTS?"
      subtitle="A construção será no modelo Built to Suit?"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {options.map((option) => (
          <OptionCard
            key={String(option.value)}
            label={option.label}
            icon={option.icon}
            isSelected={data.build?.isBTSConfirmed === option.value}
            onClick={() => updateFlowData('build', { isBTSConfirmed: option.value })}
          />
        ))}
      </div>
    </StepContainer>
  );
}
