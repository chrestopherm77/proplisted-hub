import { StepProps } from "../../types";
import { StepContainer } from "../../StepContainer";
import { OptionCard } from "../../OptionCard";
import { Home, Calendar, Building2 } from "lucide-react";

const options = [
  { value: 'HOUSING', label: 'Moradia', icon: <Home className="h-8 w-8" /> },
  { value: 'TEMPORARY', label: 'Temporário (contrato curto)', icon: <Calendar className="h-8 w-8" /> },
  { value: 'COMMERCIAL', label: 'Uso comercial', icon: <Building2 className="h-8 w-8" /> },
];

export function RentPurposeStep({ data, updateFlowData }: StepProps) {
  return (
    <StepContainer
      title="Qual a finalidade do aluguel?"
      subtitle="Para que você precisa alugar?"
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {options.map((option) => (
          <OptionCard
            key={option.value}
            label={option.label}
            icon={option.icon}
            isSelected={data.rent?.purpose === option.value}
            onClick={() => updateFlowData('rent', { purpose: option.value as any })}
          />
        ))}
      </div>
    </StepContainer>
  );
}
