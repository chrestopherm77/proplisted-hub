import { StepProps } from "../../types";
import { StepContainer } from "../../StepContainer";
import { OptionCard } from "../../OptionCard";
import { Building, Home, Hotel, Layers, Mountain, ArrowUp, ArrowDown, HelpCircle, Bed, Bath, Car } from "lucide-react";

const typeOptions = [
  { value: 'APARTMENT', label: 'Apartamento', icon: <Building className="h-6 w-6" /> },
  { value: 'HOUSE', label: 'Casa', icon: <Home className="h-6 w-6" /> },
  { value: 'KITNET', label: 'Kitnet / Studio', icon: <Hotel className="h-6 w-6" /> },
  { value: 'MULTIPLE', label: 'Possuo mais de uma opção', icon: <Layers className="h-6 w-6" /> },
];

const topographyOptions = [
  { value: 'FLAT', label: 'Plano', icon: <Mountain className="h-6 w-6" /> },
  { value: 'UPHILL', label: 'Aclive', icon: <ArrowUp className="h-6 w-6" /> },
  { value: 'DOWNHILL', label: 'Declive', icon: <ArrowDown className="h-6 w-6" /> },
  { value: 'UNKNOWN', label: 'Não sei informar', icon: <HelpCircle className="h-6 w-6" /> },
];

const bedroomOptions = ['1', '2', '3', '4+'];
const bathroomOptions = ['1', '2', '3', '4+'];
const parkingOptions = ['0', '1', '2', '3+'];

export function SellResidentialTypeStep({ data, updateFlowData }: StepProps) {
  return (
    <StepContainer
      title="Detalhes do imóvel residencial"
      subtitle="Informe as características do imóvel"
    >
      <div className="space-y-8">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Qual tipo de imóvel residencial?</h3>
          <div className="grid grid-cols-2 gap-4">
            {typeOptions.map((option) => (
              <OptionCard
                key={option.value}
                label={option.label}
                icon={option.icon}
                isSelected={data.sell?.residentialType === option.value}
                onClick={() => updateFlowData('sell', { residentialType: option.value as any })}
              />
            ))}
          </div>
        </div>

        {data.sell?.residentialType === 'HOUSE' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
            <h3 className="text-lg font-medium">Qual é a topografia do terreno?</h3>
            <div className="grid grid-cols-2 gap-4">
              {topographyOptions.map((option) => (
                <OptionCard
                  key={option.value}
                  label={option.label}
                  icon={option.icon}
                  isSelected={data.sell?.residentialTopography === option.value}
                  onClick={() => updateFlowData('sell', { residentialTopography: option.value as any })}
                />
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Bed className="h-5 w-5 text-primary" />
            Quantos dormitórios?
          </h3>
          <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
            {bedroomOptions.map((option) => (
              <OptionCard
                key={option}
                label={option}
                isSelected={data.sell?.bedrooms === option}
                onClick={() => updateFlowData('sell', { bedrooms: option })}
                className="py-4"
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Bath className="h-5 w-5 text-primary" />
            Quantos banheiros?
          </h3>
          <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
            {bathroomOptions.map((option) => (
              <OptionCard
                key={option}
                label={option}
                isSelected={data.sell?.bathrooms === option}
                onClick={() => updateFlowData('sell', { bathrooms: option })}
                className="py-4"
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Car className="h-5 w-5 text-primary" />
            Quantas vagas de garagem?
          </h3>
          <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
            {parkingOptions.map((option) => (
              <OptionCard
                key={option}
                label={option}
                isSelected={data.sell?.parkingSpots === option}
                onClick={() => updateFlowData('sell', { parkingSpots: option })}
                className="py-4"
              />
            ))}
          </div>
        </div>
      </div>
    </StepContainer>
  );
}
