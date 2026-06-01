import { StepProps } from "../../types";
import { StepContainer } from "../../StepContainer";
import { OptionCard } from "../../OptionCard";
import { HardHat, Home, Layers } from "lucide-react";

const options = [
  { value: 'UNDER_CONSTRUCTION', label: 'Em construção', icon: <HardHat className="h-8 w-8" /> },
  { value: 'READY', label: 'Pronto para morar', icon: <Home className="h-8 w-8" /> },
  { value: 'BOTH', label: 'Em construção ou pronto para morar', icon: <Layers className="h-8 w-8" /> },
];

export function BuyPropertyReadyStatusStep({ data, updateFlowData }: StepProps) {
  return (
    <StepContainer
      title="O imóvel que você busca está:"
      subtitle="Selecione o status da obra do imóvel desejado"
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
        {options.map((option) => (
          <OptionCard
            key={option.value}
            label={option.label}
            icon={option.icon}
            isSelected={data.buy?.propertyReadyStatus === option.value}
            onClick={() => updateFlowData('buy', { propertyReadyStatus: option.value as any })}
          />
        ))}
      </div>
    </StepContainer>
  );
}
