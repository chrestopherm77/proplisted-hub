import { StepProps } from "../../types";
import { StepContainer } from "../../StepContainer";
import { OptionCard } from "../../OptionCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building, Warehouse, DoorOpen, Store, Layers, Ruler, Bath, Car } from "lucide-react";

const typeOptions = [
  { value: 'COMMERCIAL_BUILDING', label: 'Prédio comercial', icon: <Building className="h-6 w-6" /> },
  { value: 'WAREHOUSE', label: 'Galpão', icon: <Warehouse className="h-6 w-6" /> },
  { value: 'OFFICE', label: 'Sala', icon: <DoorOpen className="h-6 w-6" /> },
  { value: 'STORE', label: 'Loja', icon: <Store className="h-6 w-6" /> },
  { value: 'MULTIPLE', label: 'Aceito mais de uma opção', icon: <Layers className="h-6 w-6" /> },
];

const bathroomOptions = ['1', '2', '3', '4+'];
const parkingOptions = ['0', '1', '2', '3+'];

export function RentCommercialPrefsStep({ data, updateFlowData }: StepProps) {
  return (
    <StepContainer
      title="Preferências do imóvel comercial"
      subtitle="Detalhes do imóvel que você procura"
    >
      <div className="space-y-8">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Qual tipo de imóvel comercial você procura? (aceita mais de uma opção)</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {typeOptions.map((option) => (
              <OptionCard
                key={option.value}
                label={option.label}
                icon={option.icon}
                isSelected={data.rent?.propertyType === option.value}
                onClick={() => updateFlowData('rent', { propertyType: option.value })}
                className="py-4"
              />
            ))}
          </div>
        </div>

        <div className="space-y-2 max-w-md mx-auto">
          <Label htmlFor="minSize" className="flex items-center gap-2">
            <Ruler className="h-4 w-4" />
            Qual a metragem mínima desejada?
          </Label>
          <Input
            id="minSize"
            value={data.rent?.minSize || ''}
            onChange={(e) => updateFlowData('rent', { minSize: e.target.value })}
            placeholder="Ex: 50 m²"
            className="h-12"
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Bath className="h-5 w-5 text-primary" />
            Quantos banheiros são importantes para você?
          </h3>
          <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
            {bathroomOptions.map((option) => (
              <OptionCard
                key={option}
                label={option}
                isSelected={data.rent?.bathrooms === option}
                onClick={() => updateFlowData('rent', { bathrooms: option })}
                className="py-4"
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Car className="h-5 w-5 text-primary" />
            Quantas vagas de garagem você precisa?
          </h3>
          <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
            {parkingOptions.map((option) => (
              <OptionCard
                key={option}
                label={option}
                isSelected={data.rent?.parkingSpots === option}
                onClick={() => updateFlowData('rent', { parkingSpots: option })}
                className="py-4"
              />
            ))}
          </div>
        </div>
      </div>
    </StepContainer>
  );
}
