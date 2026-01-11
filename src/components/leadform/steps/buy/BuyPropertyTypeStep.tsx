import { StepProps } from "../../types";
import { StepContainer } from "../../StepContainer";
import { OptionCard } from "../../OptionCard";
import { Home, Building, Building2, LandPlot, Tractor } from "lucide-react";

const options = [
  { value: 'HOUSE', label: 'Casa', icon: <Home className="h-8 w-8" /> },
  { value: 'APARTMENT', label: 'Apartamento', icon: <Building className="h-8 w-8" /> },
  { value: 'COMMERCIAL', label: 'Comercial', icon: <Building2 className="h-8 w-8" /> },
  { value: 'LAND', label: 'Terreno', icon: <LandPlot className="h-8 w-8" /> },
  { value: 'RURAL', label: 'Rural', icon: <Tractor className="h-8 w-8" /> },
];

export function BuyPropertyTypeStep({ data, updateFlowData }: StepProps) {
  return (
    <StepContainer
      title="Tipo de imóvel"
      subtitle="Que tipo de imóvel você procura?"
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {options.map((option) => (
          <OptionCard
            key={option.value}
            label={option.label}
            icon={option.icon}
            isSelected={data.buy?.propertyType === option.value}
            onClick={() => updateFlowData('buy', { 
              propertyType: option.value,
              commercialType: undefined,
            })}
          />
        ))}
      </div>
    </StepContainer>
  );
}
