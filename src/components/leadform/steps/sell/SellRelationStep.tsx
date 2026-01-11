import { StepProps, SellerRelation } from "../../types";
import { StepContainer } from "../../StepContainer";
import { OptionCard } from "../../OptionCard";
import { User, Scale, BadgeCheck, Badge } from "lucide-react";

const options: { value: SellerRelation; label: string; icon: React.ReactNode }[] = [
  { value: 'OWNER', label: 'Proprietário', icon: <User className="h-8 w-8" /> },
  { value: 'LEGAL_REP', label: 'Representante legal', icon: <Scale className="h-8 w-8" /> },
  { value: 'BROKER_EXCLUSIVE', label: 'Corretor / Imobiliária com exclusividade', icon: <BadgeCheck className="h-8 w-8" /> },
  { value: 'BROKER_NON_EXCLUSIVE', label: 'Corretor / Imobiliária sem exclusividade', icon: <Badge className="h-8 w-8" /> },
];

export function SellRelationStep({ data, updateFlowData }: StepProps) {
  return (
    <StepContainer
      title="Quem é você em relação ao imóvel?"
      subtitle="Selecione sua relação com a propriedade"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {options.map((option) => (
          <OptionCard
            key={option.value}
            label={option.label}
            icon={option.icon}
            isSelected={data.sell?.relation === option.value}
            onClick={() => updateFlowData('sell', { relation: option.value })}
          />
        ))}
      </div>
    </StepContainer>
  );
}
