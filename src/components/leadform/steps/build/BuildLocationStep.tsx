import { StepProps } from "../../types";
import { StepContainer } from "../../StepContainer";
import { LocationSelector } from "../../LocationSelector";

export function BuildLocationStep({ data, updateFlowData }: StepProps) {
  // Gera o campo location para compatibilidade
  const updateLocationAndRegion = (updates: Partial<typeof data.build>) => {
    const newData = { ...data.build, ...updates };
    const location = newData.neighborhood && newData.city && newData.uf
      ? `${newData.neighborhood} - ${newData.city}/${newData.uf}`
      : newData.city && newData.uf
        ? `${newData.city}/${newData.uf}`
        : '';
    updateFlowData('build', { ...updates, location });
  };

  return (
    <StepContainer
      title="Onde a construção será realizada?"
      subtitle="Informe a localização"
    >
      <div className="max-w-md mx-auto">
        <LocationSelector
          uf={data.build?.uf || ''}
          city={data.build?.city || ''}
          neighborhood={data.build?.neighborhood || ''}
          onUFChange={(uf) => updateLocationAndRegion({ uf, city: '', neighborhood: '' })}
          onCityChange={(city) => updateLocationAndRegion({ city })}
          onNeighborhoodChange={(neighborhood) => updateLocationAndRegion({ neighborhood })}
        />
      </div>
    </StepContainer>
  );
}
