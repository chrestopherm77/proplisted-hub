import { StepProps } from "../../types";
import { StepContainer } from "../../StepContainer";
import { OptionCard } from "../../OptionCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, Building, CreditCard, ArrowLeftRight, Layers, Check, X } from "lucide-react";
import { formatCurrency } from "@/lib/validators";

const paymentOptions = [
  { value: 'cash', label: 'Recursos próprios', icon: <Wallet className="h-6 w-6" /> },
  { value: 'financing', label: 'Financiamento bancário', icon: <Building className="h-6 w-6" /> },
  { value: 'consortium', label: 'Consórcio', icon: <CreditCard className="h-6 w-6" /> },
  { value: 'trade', label: 'Permuta', icon: <ArrowLeftRight className="h-6 w-6" /> },
  { value: 'combined', label: 'Combinação de formas', icon: <Layers className="h-6 w-6" /> },
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

export function BuyPaymentMethodStep({ data, updateFlowData }: StepProps) {
  return (
    <StepContainer
      title="Forma de pagamento"
      subtitle="Como pretende pagar pelo imóvel?"
    >
      <div className="space-y-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {paymentOptions.map((option) => (
            <OptionCard
              key={option.value}
              label={option.label}
              icon={option.icon}
              isSelected={data.buy?.paymentMethod === option.value}
              onClick={() => updateFlowData('buy', { 
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

        {data.buy?.paymentMethod === 'financing' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
            <h3 className="text-lg font-medium">Já aprovado?</h3>
            <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
              {yesNoOptions.map((option) => (
                <OptionCard
                  key={option.value}
                  label={option.label}
                  icon={option.icon}
                  isSelected={data.buy?.isFinancingApproved === (option.value === 'yes')}
                  onClick={() => updateFlowData('buy', { isFinancingApproved: option.value === 'yes' })}
                  className="py-4"
                />
              ))}
            </div>
          </div>
        )}

        {data.buy?.paymentMethod === 'consortium' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
            <h3 className="text-lg font-medium">Já contemplado?</h3>
            <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
              {yesNoOptions.map((option) => (
                <OptionCard
                  key={option.value}
                  label={option.label}
                  icon={option.icon}
                  isSelected={data.buy?.isConsortiumContemplated === (option.value === 'yes')}
                  onClick={() => updateFlowData('buy', { isConsortiumContemplated: option.value === 'yes' })}
                  className="py-4"
                />
              ))}
            </div>
          </div>
        )}

        {data.buy?.paymentMethod === 'trade' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">O que pretende oferecer?</h3>
              <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                {tradeTypeOptions.map((option) => (
                  <OptionCard
                    key={option.value}
                    label={option.label}
                    isSelected={data.buy?.tradeOfferType === option.value}
                    onClick={() => updateFlowData('buy', { tradeOfferType: option.value })}
                    className="py-4"
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <Label htmlFor="tradeValue">Valor estimado do bem</Label>
              <Input
                id="tradeValue"
                value={data.buy?.tradeOfferValue || ''}
                onChange={(e) => updateFlowData('buy', { tradeOfferValue: formatCurrency(e.target.value) })}
                placeholder="R$ 100.000,00"
                className="h-12"
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Bem quitado?</h3>
              <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
                {yesNoOptions.map((option) => (
                  <OptionCard
                    key={option.value}
                    label={option.label}
                    icon={option.icon}
                    isSelected={data.buy?.tradeOfferPaidOff === (option.value === 'yes')}
                    onClick={() => updateFlowData('buy', { tradeOfferPaidOff: option.value === 'yes' })}
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
