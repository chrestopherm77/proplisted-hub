import { StepProps } from "../types";
import { StepContainer } from "../StepContainer";
import { OptionCard } from "../OptionCard";
import { Tag, ShoppingCart, HardHat, Key } from "lucide-react";

const options = [
  { value: 'SELL', label: 'Vender um imóvel', icon: <Tag className="h-8 w-8" /> },
  { value: 'BUY', label: 'Comprar um imóvel', icon: <ShoppingCart className="h-8 w-8" /> },
  { value: 'BUILD', label: 'Construir um imóvel', icon: <HardHat className="h-8 w-8" /> },
  { value: 'RENT', label: 'Alugar um imóvel', icon: <Key className="h-8 w-8" /> },
];

export function IntentionStep({ data, updateData }: StepProps) {
  return (
    <StepContainer
      title="O que você deseja fazer neste momento?"
      subtitle="Selecione a opção que melhor descreve sua intenção"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {options.map((option) => (
          <OptionCard
            key={option.value}
            label={option.label}
            icon={option.icon}
            isSelected={data.intention === option.value}
            onClick={() => updateData({ intention: option.value as any })}
          />
        ))}
      </div>
    </StepContainer>
  );
}
