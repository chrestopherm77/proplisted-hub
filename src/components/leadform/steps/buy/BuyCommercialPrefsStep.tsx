import { StepProps } from "../../types";
import { StepContainer } from "../../StepContainer";
import { OptionCard } from "../../OptionCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building, Warehouse, DoorOpen, Store, Home, Layers, Ruler, Bath, Car } from "lucide-react";

const typeOptions = [
  { value: 'BUILDING', label: 'Prédio comercial', icon: <Building className="h-6 w-6" /> },
  { value: 'WAREHOUSE', label: 'Galpão', icon: <Warehouse className="h-6 w-6" /> },
  { value: 'OFFICE', label: 'Sala', icon: <DoorOpen className="h-6 w-6" /> },
  { value: 'STORE', label: 'Loja', icon: <Store className="h-6 w-6" /> },
  { value: 'HOUSE', label: 'Casa', icon: <Home className="h-6 w-6" /> },
  { value: 'MULTIPLE', label: 'Aceito mais de uma opção', icon: <Layers className="h-6 w-6" /> },
];

const bathroomOptions = ['1', '2', '3', '4+'];
const parkingOptions = ['0', '1', '2', '3+'];

export function BuyCommercialPrefsStep({ data, updateFlowData }: StepProps) {
  return (
    <StepContainer
      title="Requisitos comerciais"
      subtitle="Especifique o que você precisa"
    >
      <div className="space-y-8">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Tipo de imóvel comercial</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {typeOptions.map((option) => (
              <OptionCard
                key={option.value}
                label={option.label}
                icon={option.icon}
                isSelected={data.buy?.commercialType === option.value}
                onClick={() => updateFlowData('buy', { commercialType: option.value })}
                className="py-4"
              />
            ))}
          </div>
        </div>

        <div className="space-y-2 max-w-md mx-auto">
          <Label htmlFor="minSize" className="flex items-center gap-2">
            <Ruler className="h-4 w-4" />
            Metragem mínima
          </Label>
          <Input
            id="minSize"
            value={data.buy?.minSize || ''}
            onChange={(e) => updateFlowData('buy', { minSize: e.target.value })}
            placeholder="Ex: 50 m²"
            className="h-12"
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Bath className="h-5 w-5 text-primary" />
            Banheiros
          </h3>
          <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
            {bathroomOptions.map((option) => (
              <OptionCard
                key={option}
                label={option}
                isSelected={data.buy?.bathrooms === option}
                onClick={() => updateFlowData('buy', { bathrooms: option })}
                className="py-4"
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Car className="h-5 w-5 text-primary" />
            Vagas de garagem
          </h3>
          <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
            {parkingOptions.map((option) => (
              <OptionCard
                key={option}
                label={option}
                isSelected={data.buy?.parkingSpots === option}
                onClick={() => updateFlowData('buy', { parkingSpots: option })}
                className="py-4"
              />
            ))}
          </div>
        </div>
      </div>
    </StepContainer>
  );
}
