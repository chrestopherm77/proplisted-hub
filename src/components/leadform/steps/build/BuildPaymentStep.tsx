import { StepProps } from "../../types";
import { StepContainer } from "../../StepContainer";
import { OptionCard } from "../../OptionCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, Building, CreditCard, ArrowLeftRight, Layers, Check, X } from "lucide-react";
import { formatCurrencyWithLimits } from "@/lib/validators";

const paymentOptions = [
  { value: 'cash', label: 'Recursos próprios', icon: <Wallet className="h-6 w-6" /> },
  { value: 'financing', label: 'Financiamento bancário', icon: <Building className="h-6 w-6" /> },
  { value: 'consortium', label: 'Consórcio', icon: <CreditCard className="h-6 w-6" /> },
  { value: 'trade', label: 'Permuta', icon: <ArrowLeftRight className="h-6 w-6" /> },
  { value: 'combined', label: 'Combinação', icon: <Layers className="h-6 w-6" /> },
];

const yesNoOptions = [
  { value: 'yes', label: 'Sim', icon: <Check className="h-5 w-5" /> },
  { value: 'no', label: 'Não', icon: <X className="h-5 w-5" /> },
];

const tradeTypeOptions = [
  { value: 'property', label: 'Imóvel' },
  { value: 'vehicle', label: 'Veículo' },
  { value: 'other', label: 'Outro' },
];

export function BuildPaymentStep({ data, updateFlowData }: StepProps) {
  return (
    <StepContainer
      title="Forma de pagamento"
      subtitle="Como você pretende pagar pela construção?"
    >
      <div className="space-y-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {paymentOptions.map((option) => (
            <OptionCard
              key={option.value}
              label={option.label}
              icon={option.icon}
              isSelected={data.build?.paymentMethod === option.value}
              onClick={() => updateFlowData('build', { 
                paymentMethod: option.value,
                isFinancingApproved: undefined,
                isConsortiumContemplated: undefined,
                tradeOfferType: undefined,
                tradeOfferValue: undefined,
                tradeOfferPaidOff: undefined,
              })}
            />
          ))}
        </div>

        {data.build?.paymentMethod === 'financing' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
            <h3 className="text-lg font-medium">O financiamento já está aprovado?</h3>
            <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
              {yesNoOptions.map((option) => (
                <OptionCard
                  key={option.value}
                  label={option.label}
                  icon={option.icon}
                  isSelected={data.build?.isFinancingApproved === (option.value === 'yes')}
                  onClick={() => updateFlowData('build', { isFinancingApproved: option.value === 'yes' })}
                  className="py-4"
                />
              ))}
            </div>
          </div>
        )}

        {data.build?.paymentMethod === 'consortium' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
            <h3 className="text-lg font-medium">O consórcio já está contemplado?</h3>
            <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
              {yesNoOptions.map((option) => (
                <OptionCard
                  key={option.value}
                  label={option.label}
                  icon={option.icon}
                  isSelected={data.build?.isConsortiumContemplated === (option.value === 'yes')}
                  onClick={() => updateFlowData('build', { isConsortiumContemplated: option.value === 'yes' })}
                  className="py-4"
                />
              ))}
            </div>
          </div>
        )}

        {data.build?.paymentMethod === 'trade' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">O que você pretende oferecer na permuta?</h3>
              <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                {tradeTypeOptions.map((option) => (
                  <OptionCard
                    key={option.value}
                    label={option.label}
                    isSelected={data.build?.tradeOfferType === option.value}
                    onClick={() => updateFlowData('build', { tradeOfferType: option.value })}
                    className="py-4"
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <Label htmlFor="tradeValue">Qual o valor estimado desse item?</Label>
              <Input
                id="tradeValue"
                value={data.build?.tradeOfferValue || ''}
                onChange={(e) => updateFlowData('build', { tradeOfferValue: formatCurrencyWithLimits(e.target.value) })}
                placeholder="R$ 100.000,00"
                className="h-12"
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">O bem está quitado?</h3>
              <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
                {yesNoOptions.map((option) => (
                  <OptionCard
                    key={option.value}
                    label={option.label}
                    icon={option.icon}
                    isSelected={data.build?.tradeOfferPaidOff === (option.value === 'yes')}
                    onClick={() => updateFlowData('build', { tradeOfferPaidOff: option.value === 'yes' })}
                    className="py-4"
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </StepContainer>
  );
}
