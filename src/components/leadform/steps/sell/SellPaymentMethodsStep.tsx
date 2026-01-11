import { StepProps } from "../../types";
import { StepContainer } from "../../StepContainer";
import { MultiOptionCard } from "../../OptionCard";
import { Building, Wallet, ArrowLeftRight, Car, Calculator, Banknote } from "lucide-react";

const options = [
  { value: 'financing', label: 'Financiamento bancário', icon: <Building className="h-6 w-6" /> },
  { value: 'consortium', label: 'Consórcio', icon: <Wallet className="h-6 w-6" /> },
  { value: 'property_trade', label: 'Permuta por imóvel', icon: <ArrowLeftRight className="h-6 w-6" /> },
  { value: 'vehicle_trade', label: 'Permuta por veículo', icon: <Car className="h-6 w-6" /> },
  { value: 'installments', label: 'Entrada + parcelamento', icon: <Calculator className="h-6 w-6" /> },
  { value: 'cash_only', label: 'Somente à vista', icon: <Banknote className="h-6 w-6" /> },
];

export function SellPaymentMethodsStep({ data, updateFlowData }: StepProps) {
  const toggleMethod = (value: string) => {
    const current = data.sell?.paymentMethods || [];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    updateFlowData('sell', { paymentMethods: updated });
  };

  return (
    <StepContainer
      title="Formas de pagamento que aceita considerar"
      subtitle="Selecione uma ou mais opções"
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {options.map((option) => (
          <MultiOptionCard
            key={option.value}
            value={option.value}
            label={option.label}
            icon={option.icon}
            selectedValues={data.sell?.paymentMethods || []}
            onToggle={toggleMethod}
          />
        ))}
      </div>
    </StepContainer>
  );
}
