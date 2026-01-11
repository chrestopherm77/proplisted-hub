import { StepProps, RuralType } from "../../types";
import { StepContainer } from "../../StepContainer";
import { OptionCard } from "../../OptionCard";
import { Tractor, TreePine, Trees, MoreHorizontal } from "lucide-react";

const options: { value: RuralType; label: string; icon: React.ReactNode }[] = [
  { value: 'FARM', label: 'Fazenda', icon: <Tractor className="h-8 w-8" /> },
  { value: 'SITIO', label: 'Sítio', icon: <TreePine className="h-8 w-8" /> },
  { value: 'CHACARA', label: 'Chácara', icon: <Trees className="h-8 w-8" /> },
  { value: 'OTHER', label: 'Outro', icon: <MoreHorizontal className="h-8 w-8" /> },
];

export function SellRuralTypeStep({ data, updateFlowData }: StepProps) {
  return (
    <StepContainer
      title="Qual tipo de imóvel rural?"
      subtitle="Selecione o tipo específico"
    >
      <div className="grid grid-cols-2 gap-4">
        {options.map((option) => (
          <OptionCard
            key={option.value}
            label={option.label}
            icon={option.icon}
            isSelected={data.sell?.ruralType === option.value}
            onClick={() => updateFlowData('sell', { ruralType: option.value })}
          />
        ))}
      </div>
    </StepContainer>
  );
}
