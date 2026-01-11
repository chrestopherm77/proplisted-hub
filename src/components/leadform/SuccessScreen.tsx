import { CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SuccessScreenProps {
  onReset?: () => void;
}

export function SuccessScreen({ onReset }: SuccessScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-in fade-in zoom-in duration-500">
      <div className="h-24 w-24 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
        <CheckCircle className="h-14 w-14 text-green-600 dark:text-green-400" />
      </div>
      
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-foreground">
          Obrigado pelo seu interesse!
        </h1>
        <p className="text-lg text-muted-foreground max-w-md">
          Recebemos suas informações com sucesso. Em breve, um de nossos especialistas entrará em contato com você.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 pt-4">
        <Button
          variant="outline"
          onClick={onReset}
          className="gap-2"
        >
          Enviar outra solicitação
          <ArrowRight className="h-4 w-4" />
        </Button>
        
        <Button
          asChild
          className="gap-2"
        >
          <a href="/">
            Visitar o site
            <ArrowRight className="h-4 w-4" />
          </a>
        </Button>
      </div>
    </div>
  );
}
