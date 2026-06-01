import { StepProps } from "../../types";
import { StepContainer } from "../../StepContainer";
import { OptionCard } from "../../OptionCard";
import { Shield, ShieldOff, Bed, Bath, Car } from "lucide-react";

const gatedOptions = [
  { value: 'yes', label: 'Sim', icon: <Shield className="h-6 w-6" /> },
  { value: 'no', label: 'Não', icon: <ShieldOff className="h-6 w-6" /> },
];

const bedroomOptions = ['1', '2', '3', '4+'];
const bathroomOptions = ['1', '2', '3', '4+'];
const parkingOptions = ['0', '1', '2', '3+'];


export function BuyResidentialPrefsStep({ data, updateFlowData }: StepProps) {
  return (
    <StepContainer
      title="Preferências do imóvel"
      subtitle="Detalhes do imóvel que você procura"
    >
      <div className="space-y-8">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Possui preferência por condomínio fechado?</h3>
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            {gatedOptions.map((option) => (
              <OptionCard
                key={option.value}
                label={option.label}
                icon={option.icon}
                isSelected={data.buy?.prefersGatedCommunity === (option.value === 'yes')}
                onClick={() => updateFlowData('buy', { prefersGatedCommunity: option.value === 'yes' })}
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Bed className="h-5 w-5 text-primary" />
            Quantos dormitórios você precisa?
          </h3>
          <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
            {bedroomOptions.map((option) => (
              <OptionCard
                key={option}
                label={option}
                isSelected={data.buy?.bedrooms === option}
                onClick={() => updateFlowData('buy', { bedrooms: option })}
                className="py-4"
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Bath className="h-5 w-5 text-primary" />
            Quantos banheiros são importantes para você?
          </h3>
          <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
            {bathroomOptions.map((option) => (
              <OptionCard
                key={option}
                label={option}
                isSelected={data.buy?.bathrooms === option}
                onClick={() => updateFlowData('buy', { bathrooms: option })}
                className="py-4"
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Car className="h-5 w-5 text-primary" />
            Quantas vagas de garagem você precisa?
          </h3>
          <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
            {parkingOptions.map((option) => (
              <OptionCard
                key={option}
                label={option}
                isSelected={data.buy?.parkingSpots === option}
                onClick={() => updateFlowData('buy', { parkingSpots: option })}
                className="py-4"
              />
            ))}
          </div>
        </div>
      </div>
    </StepContainer>
  );
}
