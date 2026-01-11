import { StepProps, ResidentialType } from "../../types";
import { StepContainer } from "../../StepContainer";
import { OptionCard } from "../../OptionCard";
import { Building, Home, Hotel, LandPlot, Layers } from "lucide-react";

const options: { value: ResidentialType; label: string; icon: React.ReactNode }[] = [
  { value: 'APARTMENT', label: 'Apartamento', icon: <Building className="h-8 w-8" /> },
  { value: 'HOUSE', label: 'Casa', icon: <Home className="h-8 w-8" /> },
  { value: 'KITNET', label: 'Kitnet / Studio', icon: <Hotel className="h-8 w-8" /> },
  { value: 'MULTIPLE', label: 'Possuo mais de uma opção', icon: <Layers className="h-8 w-8" /> },
  { value: 'LAND', label: 'Terreno', icon: <LandPlot className="h-8 w-8" /> },
];

export function SellResidentialTypeStep({ data, updateFlowData }: StepProps) {
  return (
    <StepContainer
      title="Qual tipo de imóvel residencial?"
      subtitle="Selecione o tipo específico"
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {options.map((option) => (
          <OptionCard
            key={option.value}
            label={option.label}
            icon={option.icon}
            isSelected={data.sell?.residentialType === option.value}
            onClick={() => updateFlowData('sell', { residentialType: option.value })}
          />
        ))}
      </div>
    </StepContainer>
  );
}
