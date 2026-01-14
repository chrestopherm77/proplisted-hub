import { StepProps } from "../../types";
import { StepContainer } from "../../StepContainer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin } from "lucide-react";

export function BuildLocationStep({ data, updateFlowData }: StepProps) {
  return (
    <StepContainer
      title="Onde a construção será realizada?"
      subtitle="Informe a localização"
    >
      <div className="space-y-6 max-w-md mx-auto">
        <div className="space-y-2">
          <Label htmlFor="location" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Localização
          </Label>
          <Input
            id="location"
            value={data.build?.location || ''}
            onChange={(e) => updateFlowData('build', { location: e.target.value })}
            placeholder="Bairro, cidade ou região"
            className="h-12"
          />
        </div>
      </div>
    </StepContainer>
  );
}
