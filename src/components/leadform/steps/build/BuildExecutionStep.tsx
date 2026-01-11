import { StepProps } from "../../types";
import { StepContainer } from "../../StepContainer";
import { OptionCard } from "../../OptionCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, X, MapPin, DollarSign } from "lucide-react";

const builderOptions = [
  { value: 'yes', label: 'Sim', icon: <Check className="h-6 w-6" /> },
  { value: 'no', label: 'Não', icon: <X className="h-6 w-6" /> },
];

const budgetOptions = [
  { value: 'up_to_200k', label: 'Até R$ 200 mil' },
  { value: '200k_to_400k', label: 'R$ 200 a 400 mil' },
  { value: '400k_to_800k', label: 'R$ 400 a 800 mil' },
  { value: 'above_800k', label: 'Acima de R$ 800 mil' },
  { value: 'undefined', label: 'Ainda não definido' },
];

export function BuildExecutionStep({ data, updateFlowData }: StepProps) {
  return (
    <StepContainer
      title="Execução da obra"
      subtitle="Informações sobre a construção"
    >
      <div className="space-y-8">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Já possui construtor definido?</h3>
          <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
            {builderOptions.map((option) => (
              <OptionCard
                key={option.value}
                label={option.label}
                icon={option.icon}
                isSelected={data.build?.hasBuilder === (option.value === 'yes')}
                onClick={() => updateFlowData('build', { hasBuilder: option.value === 'yes' })}
              />
            ))}
          </div>
        </div>

        <div className="space-y-2 max-w-md mx-auto">
          <Label htmlFor="location" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Onde será construída?
          </Label>
          <Input
            id="location"
            value={data.build?.location || ''}
            onChange={(e) => updateFlowData('build', { location: e.target.value })}
            placeholder="Bairro, cidade ou região"
            className="h-12"
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Orçamento estimado
          </h3>
          <p className="text-sm text-muted-foreground text-center">
            Considerar ou não o valor do terreno
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {budgetOptions.map((option) => (
              <OptionCard
                key={option.value}
                label={option.label}
                isSelected={data.build?.budget === option.value}
                onClick={() => updateFlowData('build', { budget: option.value })}
                className="py-4"
              />
            ))}
          </div>
        </div>
      </div>
    </StepContainer>
  );
}
