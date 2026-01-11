import { StepProps } from "../../types";
import { StepContainer } from "../../StepContainer";
import { OptionCard } from "../../OptionCard";
import { Clock, ArrowLeftRight, DollarSign, FileText, MapPin, MoreHorizontal } from "lucide-react";

const deadlineOptions = [
  { value: '30_days', label: 'Em até 30 dias', icon: <Clock className="h-6 w-6" /> },
  { value: '1_to_3_months', label: 'De 1 a 3 meses', icon: <Clock className="h-6 w-6" /> },
  { value: '3_to_6_months', label: 'De 3 a 6 meses', icon: <Clock className="h-6 w-6" /> },
  { value: 'up_to_1_year', label: 'Até 1 ano', icon: <Clock className="h-6 w-6" /> },
];

const motivationOptions = [
  { value: 'exchange', label: 'Troca por outro imóvel', icon: <ArrowLeftRight className="h-6 w-6" /> },
  { value: 'financial', label: 'Necessidade financeira', icon: <DollarSign className="h-6 w-6" /> },
  { value: 'inheritance', label: 'Inventário / herança', icon: <FileText className="h-6 w-6" /> },
  { value: 'relocation', label: 'Mudança de cidade', icon: <MapPin className="h-6 w-6" /> },
  { value: 'other', label: 'Outro', icon: <MoreHorizontal className="h-6 w-6" /> },
];

export function SellDeadlineStep({ data, updateFlowData }: StepProps) {
  return (
    <StepContainer
      title="Prazo e motivação"
      subtitle="Nos conte sobre seus objetivos"
    >
      <div className="space-y-8">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Qual o prazo ideal para concluir a venda?</h3>
          <div className="grid grid-cols-2 gap-4">
            {deadlineOptions.map((option) => (
              <OptionCard
                key={option.value}
                label={option.label}
                icon={option.icon}
                isSelected={data.sell?.deadline === option.value}
                onClick={() => updateFlowData('sell', { deadline: option.value })}
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Qual o principal motivo da venda?</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {motivationOptions.map((option) => (
              <OptionCard
                key={option.value}
                label={option.label}
                icon={option.icon}
                isSelected={data.sell?.motivation === option.value}
                onClick={() => updateFlowData('sell', { motivation: option.value })}
              />
            ))}
          </div>
        </div>
      </div>
    </StepContainer>
  );
}
