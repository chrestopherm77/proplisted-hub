import { StepProps } from "../../types";
import { StepContainer } from "../../StepContainer";
import { OptionCard } from "../../OptionCard";
import { Sparkles, Home, Layers } from "lucide-react";

const options = [
  { value: 'NEW', label: 'Novo', icon: <Sparkles className="h-8 w-8" /> },
  { value: 'BOTH', label: 'Novo ou Usado', icon: <Layers className="h-8 w-8" /> },
  { value: 'USED', label: 'Usado', icon: <Home className="h-8 w-8" /> },
];

export function BuyPropertyConditionStep({ data, updateFlowData }: StepProps) {
  return (
    <StepContainer
      title="Qual o tipo do imóvel?"
      subtitle="Você procura um imóvel novo, usado, ou aceita ambos?"
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl mx-auto">
        {options.map((option) => (
          <OptionCard
            key={option.value}
            label={option.label}
            icon={option.icon}
            isSelected={data.buy?.propertyCondition === option.value}
            onClick={() => updateFlowData('buy', {
              propertyCondition: option.value as any,
              // Se o usuário escolher "Usado", limpa o status de obra
              propertyReadyStatus: option.value === 'USED' ? undefined : data.buy?.propertyReadyStatus,
            })}
          />
        ))}
      </div>
    </StepContainer>
  );
}
