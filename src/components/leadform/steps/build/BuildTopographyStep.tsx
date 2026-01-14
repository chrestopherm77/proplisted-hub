import { StepProps } from "../../types";
import { StepContainer } from "../../StepContainer";
import { OptionCard } from "../../OptionCard";
import { Mountain, ArrowUp, ArrowDown, HelpCircle } from "lucide-react";

const options = [
  { value: 'FLAT', label: 'Plano', icon: <Mountain className="h-8 w-8" /> },
  { value: 'UPHILL', label: 'Aclive', icon: <ArrowUp className="h-8 w-8" /> },
  { value: 'DOWNHILL', label: 'Declive', icon: <ArrowDown className="h-8 w-8" /> },
  { value: 'UNKNOWN', label: 'Não sei informar', icon: <HelpCircle className="h-8 w-8" /> },
];

export function BuildTopographyStep({ data, updateFlowData }: StepProps) {
  return (
    <StepContainer
      title="Conhece a topografia do terreno?"
      subtitle="Selecione o tipo de terreno"
    >
      <div className="grid grid-cols-2 gap-4">
        {options.map((option) => (
          <OptionCard
            key={option.value}
            label={option.label}
            icon={option.icon}
            isSelected={data.build?.topography === option.value}
            onClick={() => updateFlowData('build', { topography: option.value as any })}
          />
        ))}
      </div>
    </StepContainer>
  );
}
