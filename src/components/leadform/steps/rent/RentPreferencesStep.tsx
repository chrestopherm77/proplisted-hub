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

export function RentPreferencesStep({ data, updateFlowData }: StepProps) {
  const isCommercial = data.rent?.purpose === 'COMMERCIAL';

  return (
    <StepContainer
      title="Preferências"
      subtitle="Detalhes do imóvel que você procura"
    >
      <div className="space-y-8">
        {!isCommercial && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Condomínio fechado?</h3>
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
              {gatedOptions.map((option) => (
                <OptionCard
                  key={option.value}
                  label={option.label}
                  icon={option.icon}
                  isSelected={data.rent?.prefersGatedCommunity === (option.value === 'yes')}
                  onClick={() => updateFlowData('rent', { prefersGatedCommunity: option.value === 'yes' })}
                />
              ))}
            </div>
          </div>
        )}

        {!isCommercial && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Bed className="h-5 w-5 text-primary" />
              Dormitórios
            </h3>
            <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
              {bedroomOptions.map((option) => (
                <OptionCard
                  key={option}
                  label={option}
                  isSelected={data.rent?.bedrooms === option}
                  onClick={() => updateFlowData('rent', { bedrooms: option })}
                  className="py-4"
                />
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Bath className="h-5 w-5 text-primary" />
            Banheiros
          </h3>
          <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
            {bathroomOptions.map((option) => (
              <OptionCard
                key={option}
                label={option}
                isSelected={data.rent?.bathrooms === option}
                onClick={() => updateFlowData('rent', { bathrooms: option })}
                className="py-4"
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Car className="h-5 w-5 text-primary" />
            Vagas de garagem
          </h3>
          <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
            {parkingOptions.map((option) => (
              <OptionCard
                key={option}
                label={option}
                isSelected={data.rent?.parkingSpots === option}
                onClick={() => updateFlowData('rent', { parkingSpots: option })}
                className="py-4"
              />
            ))}
          </div>
        </div>
      </div>
    </StepContainer>
  );
}
