import { StepProps } from "../../types";
import { StepContainer } from "../../StepContainer";
import { OptionCard } from "../../OptionCard";
import { Home, TrendingUp, Building2 } from "lucide-react";

const options = [
  { value: 'HOUSING', label: 'Moradia', icon: <Home className="h-8 w-8" /> },
  { value: 'INVESTMENT', label: 'Investimento', icon: <TrendingUp className="h-8 w-8" /> },
  { value: 'COMMERCIAL', label: 'Uso comercial', icon: <Building2 className="h-8 w-8" /> },
];

export function BuildPurposeStep({ data, updateFlowData }: StepProps) {
  return (
    <StepContainer
      title="Qual a finalidade da construção?"
      subtitle="Para que você vai construir?"
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {options.map((option) => (
          <OptionCard
            key={option.value}
            label={option.label}
            icon={option.icon}
            isSelected={data.build?.purpose === option.value}
            onClick={() => updateFlowData('build', { purpose: option.value as any })}
          />
        ))}
      </div>
    </StepContainer>
  );
}
