import { StepProps } from "../../types";
import { StepContainer } from "../../StepContainer";
import { OptionCard } from "../../OptionCard";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Check, X, BadgeCheck, ArrowUpRight } from "lucide-react";

export function SellIsRealtorStep({ data, updateFlowData }: StepProps) {
  const isRealtor = data.sell?.isRealtor;

  return (
    <StepContainer
      title="Você é corretor de imóveis?"
      subtitle="Como representante legal, queremos saber se você atua no mercado imobiliário"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <OptionCard
          label="Sim, sou corretor"
          icon={<Check className="h-8 w-8" />}
          isSelected={isRealtor === true}
          onClick={() => updateFlowData('sell', { isRealtor: true })}
        />
        <OptionCard
          label="Não sou corretor"
          icon={<X className="h-8 w-8" />}
          isSelected={isRealtor === false}
          onClick={() => updateFlowData('sell', { isRealtor: false })}
        />
      </div>

      {isRealtor === true && (
        <Alert className="mt-6 text-left">
          <BadgeCheck className="h-4 w-4" />
          <AlertDescription className="space-y-3">
            <p>
              Que ótimo! Corretores têm um espaço próprio na Conecta E Imob: cadastre-se
              como corretor para receber leads, divulgar seus imóveis e fechar parcerias.
            </p>
            <Button
              type="button"
              size="sm"
              className="gap-2"
              onClick={() => window.open('/cadastro', '_blank', 'noopener')}
            >
              Quero ser corretor da plataforma
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </StepContainer>
  );
}
