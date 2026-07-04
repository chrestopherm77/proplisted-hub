import { StepProps } from "../../types";
import { StepContainer } from "../../StepContainer";
import { LocationSelector } from "../../LocationSelector";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Ruler } from "lucide-react";
import { formatArea } from "@/lib/validators";

export function SellGeneralInfoStep({ data, updateFlowData }: StepProps) {
  // Gera o campo region para compatibilidade
  const updateLocationAndRegion = (updates: Partial<typeof data.sell>) => {
    const newData = { ...data.sell, ...updates };
    const region = newData.neighborhood && newData.city && newData.uf
      ? `${newData.neighborhood} - ${newData.city}/${newData.uf}`
      : newData.city && newData.uf
        ? `${newData.city}/${newData.uf}`
        : '';
    updateFlowData('sell', { ...updates, region });
  };

  return (
    <StepContainer
      title="Informações do imóvel"
      subtitle="Nos conte mais sobre o imóvel"
    >
      <div className="space-y-6 max-w-md mx-auto">
        <div className="space-y-2">
          <Label htmlFor="size" className="flex items-center gap-2">
            <Ruler className="h-4 w-4" />
            Qual a metragem do imóvel? (m²)
          </Label>
          <Input
            id="size"
            value={data.sell?.size || ''}
            onChange={(e) => updateFlowData('sell', { size: formatArea(e.target.value) })}
            placeholder="Ex: 150"
            className="h-12"
          />
        </div>

        <LocationSelector
          uf={data.sell?.uf || ''}
          city={data.sell?.city || ''}
          neighborhood={data.sell?.neighborhood || ''}
          onUFChange={(uf) => updateLocationAndRegion({ uf, city: '', neighborhood: '' })}
          onCityChange={(city) => updateLocationAndRegion({ city })}
          onNeighborhoodChange={(neighborhood) => updateLocationAndRegion({ neighborhood })}
        />
      </div>
    </StepContainer>
  );
}
