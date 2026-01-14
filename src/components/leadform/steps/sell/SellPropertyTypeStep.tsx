import { StepProps } from "../../types";
import { StepContainer } from "../../StepContainer";
import { OptionCard } from "../../OptionCard";
import { Building2, Home, Combine, Tractor, LandPlot } from "lucide-react";

const options = [
  { value: 'COMMERCIAL', label: 'Comercial', icon: <Building2 className="h-8 w-8" /> },
  { value: 'MIXED', label: 'Misto', icon: <Combine className="h-8 w-8" /> },
  { value: 'RESIDENTIAL', label: 'Residencial', icon: <Home className="h-8 w-8" /> },
  { value: 'LAND', label: 'Terreno', icon: <LandPlot className="h-8 w-8" /> },
  { value: 'RURAL', label: 'Rural', icon: <Tractor className="h-8 w-8" /> },
];

export function SellPropertyTypeStep({ data, updateFlowData }: StepProps) {
  return (
    <StepContainer
      title="Qual tipo de imóvel?"
      subtitle="Selecione a categoria do seu imóvel"
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {options.map((option) => (
          <OptionCard
            key={option.value}
            label={option.label}
            icon={option.icon}
            isSelected={data.sell?.propertyType === option.value}
            onClick={() => updateFlowData('sell', { 
              propertyType: option.value as any,
              commercialType: undefined,
              residentialType: undefined,
              mixedType: undefined,
              ruralType: undefined,
              commercialBathrooms: undefined,
              commercialParkingSpots: undefined,
              residentialTopography: undefined,
            })}
          />
        ))}
      </div>
    </StepContainer>
  );
}
