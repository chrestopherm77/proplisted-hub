import { StepProps } from "../../types";
import { StepContainer } from "../../StepContainer";
import { OptionCard } from "../../OptionCard";
import { User, Scale } from "lucide-react";

const options = [
  { value: 'OWNER', label: 'Proprietário (dono direto do imóvel)', icon: <User className="h-8 w-8" /> },
  { value: 'LEGAL_REP', label: 'Representante legal (procurador, herdeiro, etc.)', icon: <Scale className="h-8 w-8" /> },
];

export function SellRelationStep({ data, updateFlowData }: StepProps) {
  return (
    <StepContainer
      title="Quem sou eu?"
      subtitle="Selecione sua relação com a propriedade"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {options.map((option) => (
          <OptionCard
            key={option.value}
            label={option.label}
            icon={option.icon}
            isSelected={data.sell?.relation === option.value}
            onClick={() => updateFlowData('sell', { relation: option.value as any })}
          />
        ))}
      </div>
    </StepContainer>
  );
}
