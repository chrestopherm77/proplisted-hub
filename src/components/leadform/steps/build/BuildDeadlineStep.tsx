import { StepProps } from "../../types";
import { StepContainer } from "../../StepContainer";
import { OptionCard } from "../../OptionCard";
import { Clock } from "lucide-react";

const options = [
  { value: '30_days', label: 'Em até 30 dias', icon: <Clock className="h-6 w-6" /> },
  { value: '1_to_3_months', label: 'De 1 a 3 meses', icon: <Clock className="h-6 w-6" /> },
  { value: '3_to_6_months', label: 'De 3 a 6 meses', icon: <Clock className="h-6 w-6" /> },
];

export function BuildDeadlineStep({ data, updateFlowData }: StepProps) {
  return (
    <StepContainer
      title="Em quanto tempo pretende comprar/construir?"
      subtitle="Selecione seu prazo ideal"
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {options.map((option) => (
          <OptionCard
            key={option.value}
            label={option.label}
            icon={option.icon}
            isSelected={data.build?.deadline === option.value}
            onClick={() => updateFlowData('build', { deadline: option.value })}
          />
        ))}
      </div>
    </StepContainer>
  );
}
