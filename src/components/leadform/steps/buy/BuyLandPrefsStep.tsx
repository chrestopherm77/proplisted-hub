import { StepProps } from "../../types";
import { StepContainer } from "../../StepContainer";
import { OptionCard } from "../../OptionCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Ruler, Shield, ShieldOff } from "lucide-react";

const gatedOptions = [
  { value: 'yes', label: 'Sim', icon: <Shield className="h-6 w-6" /> },
  { value: 'no', label: 'Não', icon: <ShieldOff className="h-6 w-6" /> },
];

export function BuyLandPrefsStep({ data, updateFlowData }: StepProps) {
  return (
    <StepContainer
      title="Preferências do terreno"
      subtitle="Detalhes do terreno que você procura"
    >
      <div className="space-y-8">
        <div className="space-y-2 max-w-md mx-auto">
          <Label htmlFor="landMinSize" className="flex items-center gap-2">
            <Ruler className="h-4 w-4" />
            Qual a metragem mínima desejada?
          </Label>
          <Input
            id="landMinSize"
            value={data.buy?.landMinSize || ''}
            onChange={(e) => updateFlowData('buy', { landMinSize: e.target.value })}
            placeholder="Ex: 300 m²"
            className="h-12"
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Possui preferência por condomínio fechado?</h3>
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            {gatedOptions.map((option) => (
              <OptionCard
                key={option.value}
                label={option.label}
                icon={option.icon}
                isSelected={data.buy?.landPrefersGated === (option.value === 'yes')}
                onClick={() => updateFlowData('buy', { landPrefersGated: option.value === 'yes' })}
              />
            ))}
          </div>
        </div>
      </div>
    </StepContainer>
  );
}
