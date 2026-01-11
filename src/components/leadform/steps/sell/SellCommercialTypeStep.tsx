import { StepProps, CommercialType } from "../../types";
import { StepContainer } from "../../StepContainer";
import { OptionCard } from "../../OptionCard";
import { Building, Warehouse, DoorOpen, Store, MoreHorizontal, Layers } from "lucide-react";

const options: { value: CommercialType; label: string; icon: React.ReactNode }[] = [
  { value: 'BUILDING', label: 'Prédio comercial', icon: <Building className="h-8 w-8" /> },
  { value: 'WAREHOUSE', label: 'Galpão', icon: <Warehouse className="h-8 w-8" /> },
  { value: 'OFFICE', label: 'Sala', icon: <DoorOpen className="h-8 w-8" /> },
  { value: 'STORE', label: 'Loja', icon: <Store className="h-8 w-8" /> },
  { value: 'OTHER', label: 'Outro', icon: <MoreHorizontal className="h-8 w-8" /> },
  { value: 'MULTIPLE', label: 'Possuo mais de uma opção', icon: <Layers className="h-8 w-8" /> },
];

export function SellCommercialTypeStep({ data, updateFlowData }: StepProps) {
  return (
    <StepContainer
      title="Qual tipo de imóvel comercial?"
      subtitle="Selecione o tipo específico"
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {options.map((option) => (
          <OptionCard
            key={option.value}
            label={option.label}
            icon={option.icon}
            isSelected={data.sell?.commercialType === option.value}
            onClick={() => updateFlowData('sell', { commercialType: option.value })}
          />
        ))}
      </div>
    </StepContainer>
  );
}
