import { StepProps } from "../../types";
import { StepContainer } from "../../StepContainer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign } from "lucide-react";
import { formatCurrencyWithLimits } from "@/lib/validators";

export function SellValueStep({ data, updateFlowData }: StepProps) {
  return (
    <StepContainer
      title="Valor de venda esperado"
      subtitle="Qual o valor que você espera pelo imóvel?"
    >
      <div className="space-y-6 max-w-md mx-auto">
        <div className="space-y-2">
          <Label htmlFor="expectedValue" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Qual o valor de venda esperado?
          </Label>
          <Input
            id="expectedValue"
            value={data.sell?.expectedValue || ''}
            onChange={(e) => updateFlowData('sell', { expectedValue: formatCurrencyWithLimits(e.target.value) })}
            placeholder="Ex: R$ 500.000,00"
            className="h-12"
          />
        </div>
      </div>
    </StepContainer>
  );
}
