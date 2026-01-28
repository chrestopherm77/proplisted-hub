import { StepProps } from "../../types";
import { StepContainer } from "../../StepContainer";
import { OptionCard } from "../../OptionCard";
import { DollarSign } from "lucide-react";

const budgetOptions = [
  { value: 'up_to_200k', label: 'Até R$ 200 mil' },
  { value: '200k_to_400k', label: 'R$ 200 a 400 mil' },
  { value: '400k_to_800k', label: 'R$ 400 a 800 mil' },
  { value: 'above_800k', label: 'Acima de R$ 800 mil' },
  { value: 'undefined', label: 'Ainda não defini' },
];

export function BuildBudgetStep({ data, updateFlowData }: StepProps) {
  return (
    <StepContainer
      title="Orçamento estimado"
      subtitle="Qual o orçamento estimado para a obra sem considerar o terreno"
    >
      <div className="space-y-4">
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
    </StepContainer>
  );
}
