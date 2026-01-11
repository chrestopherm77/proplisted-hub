import { StepProps } from "../../types";
import { StepContainer } from "../../StepContainer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Ruler, DollarSign } from "lucide-react";

export function SellGeneralInfoStep({ data, updateFlowData }: StepProps) {
  return (
    <StepContainer
      title="Informações gerais"
      subtitle="Nos conte mais sobre o imóvel"
    >
      <div className="space-y-6 max-w-md mx-auto">
        <div className="space-y-2">
          <Label htmlFor="region" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Em qual região está localizado?
          </Label>
          <Input
            id="region"
            value={data.sell?.region || ''}
            onChange={(e) => updateFlowData('sell', { region: e.target.value })}
            placeholder="Bairro, cidade ou região"
            className="h-12"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="size" className="flex items-center gap-2">
            <Ruler className="h-4 w-4" />
            Qual a metragem?
          </Label>
          <Input
            id="size"
            value={data.sell?.size || ''}
            onChange={(e) => updateFlowData('sell', { size: e.target.value })}
            placeholder="Ex: 150 m² ou 50 hectares"
            className="h-12"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="expectedValue" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Qual o valor de venda esperado?
          </Label>
          <Input
            id="expectedValue"
            value={data.sell?.expectedValue || ''}
            onChange={(e) => updateFlowData('sell', { expectedValue: e.target.value })}
            placeholder="Ex: R$ 500.000,00"
            className="h-12"
          />
        </div>
      </div>
    </StepContainer>
  );
}
