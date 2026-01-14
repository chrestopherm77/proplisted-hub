import { StepProps } from "../../types";
import { StepContainer } from "../../StepContainer";
import { OptionCard } from "../../OptionCard";
import { Building, Warehouse, DoorOpen, Store, MoreHorizontal, Layers, Bed, Bath, Car } from "lucide-react";

const typeOptions = [
  { value: 'BUILDING', label: 'Prédio comercial', icon: <Building className="h-6 w-6" /> },
  { value: 'WAREHOUSE', label: 'Galpão', icon: <Warehouse className="h-6 w-6" /> },
  { value: 'OFFICE', label: 'Sala', icon: <DoorOpen className="h-6 w-6" /> },
  { value: 'STORE', label: 'Loja', icon: <Store className="h-6 w-6" /> },
  { value: 'OTHER', label: 'Outro', icon: <MoreHorizontal className="h-6 w-6" /> },
  { value: 'MULTIPLE', label: 'Possuo mais de uma opção', icon: <Layers className="h-6 w-6" /> },
];

const bedroomOptions = ['1', '2', '3', '4+'];
const bathroomOptions = ['1', '2', '3', '4+'];
const parkingOptions = ['0', '1', '2', '3+'];

export function SellCommercialTypeStep({ data, updateFlowData }: StepProps) {
  return (
    <StepContainer
      title="Detalhes do imóvel comercial"
      subtitle="Informe as características do imóvel"
    >
      <div className="space-y-8">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Qual tipo de imóvel comercial?</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {typeOptions.map((option) => (
              <OptionCard
                key={option.value}
                label={option.label}
                icon={option.icon}
                isSelected={data.sell?.commercialType === option.value}
                onClick={() => updateFlowData('sell', { commercialType: option.value as any })}
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Bed className="h-5 w-5 text-primary" />
            Quantos dormitórios o imóvel possui?
          </h3>
          <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
            {bedroomOptions.map((option) => (
              <OptionCard
                key={option}
                label={option}
                isSelected={data.sell?.commercialBedrooms === option}
                onClick={() => updateFlowData('sell', { commercialBedrooms: option })}
                className="py-4"
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Bath className="h-5 w-5 text-primary" />
            Quantos banheiros o imóvel possui?
          </h3>
          <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
            {bathroomOptions.map((option) => (
              <OptionCard
                key={option}
                label={option}
                isSelected={data.sell?.commercialBathrooms === option}
                onClick={() => updateFlowData('sell', { commercialBathrooms: option })}
                className="py-4"
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Car className="h-5 w-5 text-primary" />
            Quantas vagas de garagem o imóvel possui?
          </h3>
          <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
            {parkingOptions.map((option) => (
              <OptionCard
                key={option}
                label={option}
                isSelected={data.sell?.commercialParkingSpots === option}
                onClick={() => updateFlowData('sell', { commercialParkingSpots: option })}
                className="py-4"
              />
            ))}
          </div>
        </div>
      </div>
    </StepContainer>
  );
}
