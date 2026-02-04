import { StepProps } from "../../types";
import { StepContainer } from "../../StepContainer";
import { LocationSelector } from "../../LocationSelector";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign } from "lucide-react";
import { formatCurrencyWithLimits } from "@/lib/validators";

export function BuyLocationBudgetStep({ data, updateFlowData }: StepProps) {
  // Gera o campo region para compatibilidade
  const updateLocationAndRegion = (updates: Partial<typeof data.buy>) => {
    const newData = { ...data.buy, ...updates };
    const region = newData.neighborhood && newData.city && newData.uf
      ? `${newData.neighborhood} - ${newData.city}/${newData.uf}`
      : newData.city && newData.uf
        ? `${newData.city}/${newData.uf}`
        : '';
    updateFlowData('buy', { ...updates, region });
  };

  return (
    <StepContainer
      title="Localização e orçamento"
      subtitle="Onde você quer comprar e quanto pretende investir?"
    >
      <div className="space-y-6 max-w-md mx-auto">
        <LocationSelector
          uf={data.buy?.uf || ''}
          city={data.buy?.city || ''}
          neighborhood={data.buy?.neighborhood || ''}
          onUFChange={(uf) => updateLocationAndRegion({ uf, city: '', neighborhood: '' })}
          onCityChange={(city) => updateLocationAndRegion({ city })}
          onNeighborhoodChange={(neighborhood) => updateLocationAndRegion({ neighborhood })}
        />

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="budgetMin" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Valor mínimo
            </Label>
            <Input
              id="budgetMin"
              value={data.buy?.budgetMin || ''}
              onChange={(e) => updateFlowData('buy', { budgetMin: formatCurrencyWithLimits(e.target.value) })}
              placeholder="R$ 100.000,00"
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="budgetMax" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Valor máximo
            </Label>
            <Input
              id="budgetMax"
              value={data.buy?.budgetMax || ''}
              onChange={(e) => updateFlowData('buy', { budgetMax: formatCurrencyWithLimits(e.target.value) })}
              placeholder="R$ 10.000.000,00"
              className="h-12"
            />
          </div>
        </div>
      </div>
    </StepContainer>
  );
}
