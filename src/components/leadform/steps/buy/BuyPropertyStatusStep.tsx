import { StepProps } from "../../types";
import { StepContainer } from "../../StepContainer";
import { OptionCard } from "../../OptionCard";
import { Home, HardHat, Layers } from "lucide-react";

const options = [
  { value: 'READY', label: 'Pronto para morar', icon: <Home className="h-8 w-8" /> },
  { value: 'UNDER_CONSTRUCTION', label: 'Na planta', icon: <HardHat className="h-8 w-8" /> },
  { value: 'BOTH', label: 'Aceito mais de uma opção', icon: <Layers className="h-8 w-8" /> },
];

export function BuyPropertyStatusStep({ data, updateFlowData }: StepProps) {
  return (
    <StepContainer
      title="Situação do imóvel desejado"
      subtitle="Qual a condição do imóvel que você procura?"
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {options.map((option) => (
          <OptionCard
            key={option.value}
            label={option.label}
            icon={option.icon}
            isSelected={data.buy?.propertyStatus === option.value}
            onClick={() => updateFlowData('buy', { propertyStatus: option.value as any })}
          />
        ))}
      </div>
    </StepContainer>
  );
}
