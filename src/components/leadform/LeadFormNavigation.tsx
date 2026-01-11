import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Loader2, Send } from "lucide-react";

interface LeadFormNavigationProps {
  onBack: () => void;
  onNext: () => void;
  canGoBack: boolean;
  canGoNext: boolean;
  isLastStep: boolean;
  isSubmitting?: boolean;
}

export function LeadFormNavigation({
  onBack,
  onNext,
  canGoBack,
  canGoNext,
  isLastStep,
  isSubmitting = false,
}: LeadFormNavigationProps) {
  return (
    <div className="flex justify-between items-center gap-4 pt-6">
      <Button
        type="button"
        variant="ghost"
        onClick={onBack}
        disabled={!canGoBack}
        className="gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Button>

      <Button
        type="button"
        onClick={onNext}
        disabled={!canGoNext || isSubmitting}
        className="gap-2 min-w-[140px]"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Enviando...
          </>
        ) : isLastStep ? (
          <>
            Enviar
            <Send className="h-4 w-4" />
          </>
        ) : (
          <>
            Avançar
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>
    </div>
  );
}
