import { StepProps } from "../../types";
import { StepContainer } from "../../StepContainer";
import { OptionCard } from "../../OptionCard";
import { Home, Building, Hotel, HelpCircle, Warehouse, DoorOpen, Store, Layers } from "lucide-react";

const residentialOptions = [
  { value: 'HOUSE', label: 'Casa', icon: <Home className="h-6 w-6" /> },
  { value: 'APARTMENT', label: 'Apartamento', icon: <Building className="h-6 w-6" /> },
  { value: 'KITNET', label: 'Kitnet / Studio', icon: <Hotel className="h-6 w-6" /> },
  { value: 'EVALUATING', label: 'Estou avaliando opções', icon: <HelpCircle className="h-6 w-6" /> },
];

const commercialOptions = [
  { value: 'COMMERCIAL_BUILDING', label: 'Prédio comercial', icon: <Building className="h-6 w-6" /> },
  { value: 'WAREHOUSE', label: 'Galpão', icon: <Warehouse className="h-6 w-6" /> },
  { value: 'OFFICE', label: 'Sala', icon: <DoorOpen className="h-6 w-6" /> },
  { value: 'STORE', label: 'Loja', icon: <Store className="h-6 w-6" /> },
  { value: 'MULTIPLE', label: 'Aceito mais de uma opção', icon: <Layers className="h-6 w-6" /> },
];

export function RentPropertyTypeStep({ data, updateFlowData }: StepProps) {
  const isCommercial = data.rent?.purpose === 'COMMERCIAL';
  const options = isCommercial ? commercialOptions : residentialOptions;

  return (
    <StepContainer
      title="Tipo de imóvel"
      subtitle={isCommercial ? "Qual tipo de imóvel comercial?" : "Qual tipo de imóvel residencial?"}
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {options.map((option) => (
          <OptionCard
            key={option.value}
            label={option.label}
            icon={option.icon}
            isSelected={data.rent?.propertyType === option.value}
            onClick={() => updateFlowData('rent', { propertyType: option.value })}
          />
        ))}
      </div>
    </StepContainer>
  );
}
