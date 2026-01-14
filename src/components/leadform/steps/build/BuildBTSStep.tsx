import { StepProps } from "../../types";
import { StepContainer } from "../../StepContainer";
import { OptionCard } from "../../OptionCard";
import { DollarSign, Clock } from "lucide-react";

const rentRangeOptions = [
  { value: 'up_to_30', label: 'Até R$ 30/m²' },
  { value: '50_to_80', label: 'R$ 50 a 80/m²' },
  { value: 'above_80', label: 'Acima de R$ 80/m²' },
  { value: 'undefined', label: 'Ainda não defini' },
];

const contractTermOptions = [
  { value: '5_years', label: '5 anos' },
  { value: '7_to_10_years', label: '7 a 10 anos' },
  { value: '10_to_15_years', label: '10 a 15 anos' },
  { value: 'above_15_years', label: 'Acima de 15 anos' },
  { value: 'undefined', label: 'Ainda não defini' },
];

export function BuildBTSStep({ data, updateFlowData }: StepProps) {
  return (
    <StepContainer
      title="Detalhes do Built to Suit"
      subtitle="Informe os parâmetros do BTS"
    >
      <div className="space-y-8">
        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Qual faixa de aluguel mensal faria sentido para sua operação?
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {rentRangeOptions.map((option) => (
              <OptionCard
                key={option.value}
                label={option.label}
                isSelected={data.build?.btsRentRange === option.value}
                onClick={() => updateFlowData('build', { btsRentRange: option.value })}
                className="py-4"
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Qual o prazo mínimo de contrato que sua empresa considera viável?
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {contractTermOptions.map((option) => (
              <OptionCard
                key={option.value}
                label={option.label}
                isSelected={data.build?.btsMinContractTerm === option.value}
                onClick={() => updateFlowData('build', { btsMinContractTerm: option.value })}
                className="py-4"
              />
            ))}
          </div>
        </div>
      </div>
    </StepContainer>
  );
}
