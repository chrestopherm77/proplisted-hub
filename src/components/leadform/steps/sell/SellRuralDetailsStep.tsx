import { StepProps } from "../../types";
import { StepContainer } from "../../StepContainer";
import { OptionCard, MultiOptionCard } from "../../OptionCard";
import { Ruler, Target, Home, Route, Droplets } from "lucide-react";

const areaOptions = [
  { value: 'up_to_10', label: 'Até 10 ha' },
  { value: '10_to_50', label: '10 a 50 ha' },
  { value: '50_to_100', label: '50 a 100 ha' },
  { value: '100_to_500', label: '100 a 500 ha' },
  { value: 'above_500', label: 'Acima de 500 ha' },
  { value: 'unknown', label: 'Ainda não sei' },
];

const purposeOptions = [
  { value: 'agriculture', label: 'Agricultura' },
  { value: 'livestock', label: 'Pecuária' },
  { value: 'mixed', label: 'Mista (agropecuária)' },
  { value: 'leisure', label: 'Lazer / turismo rural' },
  { value: 'reserve', label: 'Reserva / área improdutiva' },
  { value: 'other', label: 'Outro' },
];

const improvementOptions = [
  { value: 'main_house', label: 'Casa sede' },
  { value: 'staff_houses', label: 'Casas para funcionários' },
  { value: 'warehouses', label: 'Galpões / armazéns' },
  { value: 'corral', label: 'Curral / estrutura pecuária' },
  { value: 'silos', label: 'Silos' },
  { value: 'none', label: 'Não possui benfeitorias relevantes' },
];

const accessOptions = [
  { value: 'paved', label: 'Asfalto até a entrada' },
  { value: 'good_dirt', label: 'Estrada de terra em boas condições' },
  { value: 'difficult', label: 'Estrada de terra com acesso difícil' },
];

const waterOptions = [
  { value: 'river', label: 'Rio' },
  { value: 'stream', label: 'Córrego / nascente' },
  { value: 'dam', label: 'Represa / açude' },
  { value: 'well', label: 'Poço' },
  { value: 'none', label: 'Não possui' },
  { value: 'unknown', label: 'Não sei informar' },
];

export function SellRuralDetailsStep({ data, updateFlowData }: StepProps) {
  const toggleImprovement = (value: string) => {
    const current = data.sell?.improvements || [];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    updateFlowData('sell', { improvements: updated });
  };

  const toggleWater = (value: string) => {
    const current = data.sell?.waterResources || [];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    updateFlowData('sell', { waterResources: updated });
  };

  return (
    <StepContainer
      title="Detalhes do imóvel rural"
      subtitle="Preencha as informações sobre a propriedade"
    >
      <div className="space-y-8">
        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Ruler className="h-5 w-5 text-primary" />
            Tamanho da área
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {areaOptions.map((option) => (
              <OptionCard
                key={option.value}
                label={option.label}
                isSelected={data.sell?.ruralArea === option.value}
                onClick={() => updateFlowData('sell', { ruralArea: option.value })}
                className="py-4"
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Finalidade do imóvel
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {purposeOptions.map((option) => (
              <OptionCard
                key={option.value}
                label={option.label}
                isSelected={data.sell?.ruralPurpose === option.value}
                onClick={() => updateFlowData('sell', { ruralPurpose: option.value })}
                className="py-4"
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Home className="h-5 w-5 text-primary" />
            O imóvel possui benfeitorias? (múltipla escolha)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {improvementOptions.map((option) => (
              <MultiOptionCard
                key={option.value}
                value={option.value}
                label={option.label}
                selectedValues={data.sell?.improvements || []}
                onToggle={toggleImprovement}
                className="py-4"
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Route className="h-5 w-5 text-primary" />
            Acesso ao imóvel
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {accessOptions.map((option) => (
              <OptionCard
                key={option.value}
                label={option.label}
                isSelected={data.sell?.access === option.value}
                onClick={() => updateFlowData('sell', { access: option.value })}
                className="py-4"
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Droplets className="h-5 w-5 text-primary" />
            Recursos hídricos (múltipla escolha)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {waterOptions.map((option) => (
              <MultiOptionCard
                key={option.value}
                value={option.value}
                label={option.label}
                selectedValues={data.sell?.waterResources || []}
                onToggle={toggleWater}
                className="py-4"
              />
            ))}
          </div>
        </div>
      </div>
    </StepContainer>
  );
}
