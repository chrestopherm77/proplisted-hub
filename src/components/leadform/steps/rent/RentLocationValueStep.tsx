import { StepProps } from "../../types";
import { StepContainer } from "../../StepContainer";
import { LocationSelector } from "../../LocationSelector";
import { OptionCard } from "../../OptionCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign, Check, X } from "lucide-react";
import { formatCurrencyWithLimits } from "@/lib/validators";

const includesOptions = [
  { value: 'yes', label: 'Sim', icon: <Check className="h-6 w-6" /> },
  { value: 'no', label: 'Não', icon: <X className="h-6 w-6" /> },
];

export function RentLocationValueStep({ data, updateFlowData }: StepProps) {
  // Gera o campo region para compatibilidade
  const updateLocationAndRegion = (updates: Partial<typeof data.rent>) => {
    const newData = { ...data.rent, ...updates };
    const region = newData.neighborhood && newData.city && newData.uf
      ? `${newData.neighborhood} - ${newData.city}/${newData.uf}`
      : newData.city && newData.uf
        ? `${newData.city}/${newData.uf}`
        : '';
    updateFlowData('rent', { ...updates, region });
  };

  return (
    <StepContainer
      title="Localização e valor"
      subtitle="Onde você quer alugar e quanto pode pagar?"
    >
      <div className="space-y-8">
        <div className="max-w-md mx-auto">
          <LocationSelector
            uf={data.rent?.uf || ''}
            city={data.rent?.city || ''}
            neighborhood={data.rent?.neighborhood || ''}
            onUFChange={(uf) => updateLocationAndRegion({ uf, city: '', neighborhood: '' })}
            onCityChange={(city) => updateLocationAndRegion({ city })}
            onNeighborhoodChange={(neighborhood) => updateLocationAndRegion({ neighborhood })}
          />
        </div>

        <div className="space-y-2 max-w-md mx-auto">
          <Label htmlFor="maxRent" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Valor máximo do aluguel mensal
          </Label>
          <Input
            id="maxRent"
            value={data.rent?.maxRent || ''}
            onChange={(e) => updateFlowData('rent', { maxRent: formatCurrencyWithLimits(e.target.value) })}
            placeholder="R$ 2.000,00"
            className="h-12"
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium text-center">
            Esse valor inclui condomínio e IPTU?
          </h3>
          <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
            {includesOptions.map((option) => (
              <OptionCard
                key={option.value}
                label={option.label}
                icon={option.icon}
                isSelected={data.rent?.includesCondoAndTax === (option.value === 'yes')}
                onClick={() => updateFlowData('rent', { includesCondoAndTax: option.value === 'yes' })}
              />
            ))}
          </div>
        </div>
      </div>
    </StepContainer>
  );
}
