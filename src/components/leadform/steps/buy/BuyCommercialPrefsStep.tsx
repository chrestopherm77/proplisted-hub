import { StepProps } from "../../types";
import { StepContainer } from "../../StepContainer";
import { OptionCard } from "../../OptionCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building, Warehouse, DoorOpen, Store, Home, Layers, Ruler, Bath, Car, HardHat } from "lucide-react";
import { formatArea } from "@/lib/validators";

const typeOptions = [
  { value: 'BUILDING', label: 'Prédio comercial', icon: <Building className="h-6 w-6" /> },
  { value: 'WAREHOUSE', label: 'Galpão', icon: <Warehouse className="h-6 w-6" /> },
  { value: 'OFFICE', label: 'Sala comercial', icon: <DoorOpen className="h-6 w-6" /> },
  { value: 'STORE', label: 'Loja', icon: <Store className="h-6 w-6" /> },
  { value: 'HOUSE', label: 'Casa', icon: <Home className="h-6 w-6" /> },
  { value: 'MULTIPLE', label: 'Aceito mais de uma opção', icon: <Layers className="h-6 w-6" /> },
];

const bathroomOptions = ['1', '2', '3', '4+'];
const parkingOptions = ['0', '1', '2', '3+'];

const readyStatusOptions = [
  { value: 'READY', label: 'Pronto para morar', icon: <Home className="h-6 w-6" /> },
  { value: 'UNDER_CONSTRUCTION', label: 'Na planta', icon: <HardHat className="h-6 w-6" /> },
  { value: 'BOTH', label: 'Aceito mais de uma opção', icon: <Layers className="h-6 w-6" /> },
];

export function BuyCommercialPrefsStep({ data, updateFlowData }: StepProps) {
  return (
    <StepContainer
      title="Requisitos do imóvel comercial"
      subtitle="Especifique o que você precisa"
    >
      <div className="space-y-8">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Qual tipo de imóvel comercial? (pode aceitar mais de uma opção)</h3>
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
            Qual a metragem mínima desejada? (m²)
          </Label>
          <Input
            id="minSize"
            value={data.buy?.minSize || ''}
            onChange={(e) => updateFlowData('buy', { minSize: formatArea(e.target.value) })}
            placeholder="Ex: 50"
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
            Quantas vagas de garagem você precisa?
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

        <div className="space-y-4">
          <h3 className="text-lg font-medium">O imóvel que você busca é:</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {readyStatusOptions.map((option) => (
              <OptionCard
                key={option.value}
                label={option.label}
                icon={option.icon}
                isSelected={data.buy?.propertyReadyStatus === option.value}
                onClick={() => updateFlowData('buy', { propertyReadyStatus: option.value as any })}
              />
            ))}
          </div>
        </div>
      </div>
    </StepContainer>
  );
}
