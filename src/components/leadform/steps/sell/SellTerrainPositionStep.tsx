import { StepProps } from "../../types";
import { StepContainer } from "../../StepContainer";
import { OptionCard } from "../../OptionCard";
import { CornerUpRight, ArrowUpDown, HelpCircle } from "lucide-react";

const options = [
  { value: 'CORNER', label: 'Esquina', icon: <CornerUpRight className="h-8 w-8" /> },
  { value: 'MIDDLE', label: 'Meio de Quadra', icon: <ArrowUpDown className="h-8 w-8" /> },
  { value: 'UNKNOWN', label: 'Não sei informar', icon: <HelpCircle className="h-8 w-8" /> },
];

export function SellTerrainPositionStep({ data, updateFlowData }: StepProps) {
  return (
    <StepContainer
      title="Qual a posição do terreno na quadra?"
      subtitle="Selecione a posição do terreno"
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {options.map((option) => (
          <OptionCard
            key={option.value}
            label={option.label}
            icon={option.icon}
            isSelected={data.sell?.terrainPosition === option.value}
            onClick={() => updateFlowData('sell', { terrainPosition: option.value as any })}
          />
        ))}
      </div>
    </StepContainer>
  );
}
