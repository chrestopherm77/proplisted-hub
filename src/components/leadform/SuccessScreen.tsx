import { CheckCircle } from "lucide-react";

export function SuccessScreen() {
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
    </div>
  );
}
