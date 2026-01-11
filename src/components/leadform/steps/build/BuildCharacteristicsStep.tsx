import { StepProps } from "../../types";
import { StepContainer } from "../../StepContainer";
import { OptionCard } from "../../OptionCard";
import { Layers, Ruler } from "lucide-react";

const floorOptions = ['1', '2', '3+'];

const areaOptions = [
  { value: 'up_to_50', label: 'Até 50 m²' },
  { value: '50_to_100', label: '50 a 100 m²' },
  { value: '100_to_200', label: '100 a 200 m²' },
  { value: '200_to_350', label: '200 a 350 m²' },
  { value: 'above_350', label: 'Mais de 350 m²' },
  { value: 'unknown', label: 'Ainda não sei' },
];

export function BuildCharacteristicsStep({ data, updateFlowData }: StepProps) {
  return (
    <StepContainer
      title="Características da construção"
      subtitle="Detalhes do projeto"
    >
      <div className="space-y-8">
        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            Quantos pavimentos?
          </h3>
          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
            {floorOptions.map((option) => (
              <OptionCard
                key={option}
                label={option}
                isSelected={data.build?.floors === option}
                onClick={() => updateFlowData('build', { floors: option })}
                className="py-4"
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Ruler className="h-5 w-5 text-primary" />
            Área aproximada
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {areaOptions.map((option) => (
              <OptionCard
                key={option.value}
                label={option.label}
                isSelected={data.build?.area === option.value}
                onClick={() => updateFlowData('build', { area: option.value })}
                className="py-4"
              />
            ))}
          </div>
        </div>
      </div>
    </StepContainer>
  );
}
