import { StepProps } from "../../types";
import { StepContainer } from "../../StepContainer";
import { OptionCard } from "../../OptionCard";
import { Check, X, HelpCircle, Users, Home } from "lucide-react";

const appraisedOptions = [
  { value: 'yes', label: 'Sim', icon: <Check className="h-6 w-6" /> },
  { value: 'no', label: 'Não', icon: <X className="h-6 w-6" /> },
];

const occupiedOptions = [
  { value: 'occupied', label: 'Ocupado', icon: <Users className="h-6 w-6" /> },
  { value: 'vacant', label: 'Desocupado', icon: <Home className="h-6 w-6" /> },
];

const preferenceOptions = [
  { value: 'YES', label: 'Sim', icon: <Check className="h-6 w-6" /> },
  { value: 'NO', label: 'Não', icon: <X className="h-6 w-6" /> },
  { value: 'NOT_ASKED', label: 'Não solicitado', icon: <HelpCircle className="h-6 w-6" /> },
];

export function SellPropertyStatusStep({ data, updateFlowData }: StepProps) {
  return (
    <StepContainer
      title="Situação do imóvel"
      subtitle="Informe o estado atual do imóvel"
    >
      <div className="space-y-8">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Já foi avaliado por um profissional?</h3>
          <div className="grid grid-cols-2 gap-4">
            {appraisedOptions.map((option) => (
              <OptionCard
                key={option.value}
                label={option.label}
                icon={option.icon}
                isSelected={data.sell?.wasAppraised === (option.value === 'yes')}
                onClick={() => updateFlowData('sell', { wasAppraised: option.value === 'yes' })}
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">O imóvel está:</h3>
          <div className="grid grid-cols-2 gap-4">
            {occupiedOptions.map((option) => (
              <OptionCard
                key={option.value}
                label={option.label}
                icon={option.icon}
                isSelected={data.sell?.isOccupied === (option.value === 'occupied')}
                onClick={() => updateFlowData('sell', { 
                  isOccupied: option.value === 'occupied',
                  occupantHasPreference: option.value === 'occupied' ? data.sell?.occupantHasPreference : undefined
                })}
              />
            ))}
          </div>
        </div>

        {data.sell?.isOccupied && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
            <h3 className="text-lg font-medium">O ocupante possui direito de preferência?</h3>
            <div className="grid grid-cols-3 gap-4">
              {preferenceOptions.map((option) => (
                <OptionCard
                  key={option.value}
                  label={option.label}
                  icon={option.icon}
                  isSelected={data.sell?.occupantHasPreference === option.value}
                  onClick={() => updateFlowData('sell', { occupantHasPreference: option.value as any })}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </StepContainer>
  );
}
