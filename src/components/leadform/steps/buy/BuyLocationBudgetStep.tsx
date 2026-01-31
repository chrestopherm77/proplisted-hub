import { StepProps } from "../../types";
import { StepContainer } from "../../StepContainer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, DollarSign } from "lucide-react";
import { formatCurrencyWithLimits } from "@/lib/validators";

export function BuyLocationBudgetStep({ data, updateFlowData }: StepProps) {
  return (
    <StepContainer
      title="Localização e orçamento"
      subtitle="Onde você quer comprar e quanto pretende investir?"
    >
      <div className="space-y-6 max-w-md mx-auto">
        <div className="space-y-2">
          <Label htmlFor="region" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Região desejada
          </Label>
          <Input
            id="region"
            value={data.buy?.region || ''}
            onChange={(e) => updateFlowData('buy', { region: e.target.value })}
            placeholder="Bairro, cidade ou região"
            className="h-12"
          />
        </div>

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
              placeholder="R$ 200.000,00"
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
              placeholder="R$ 500.000,00"
              className="h-12"
            />
          </div>
        </div>
      </div>
    </StepContainer>
  );
}
