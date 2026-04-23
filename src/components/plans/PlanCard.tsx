import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles, Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface PlanCardData {
  id: string;
  slug: string;
  name: string;
  price: number;
  monthly_credits: number;
  feature_list: string[];
}

interface PlanCardProps {
  plan: PlanCardData;
  isCurrent?: boolean;
  isPopular?: boolean;
  loading?: boolean;
  pendingInvoiceUrl?: string | null;
  /** Texto exibido em tooltip + botão desabilitado quando troca não é permitida agora. */
  disabledReason?: string | null;
  /** Quando este plano custa MENOS que o atual e o atual é pago: true → rotulamos como downgrade agendado. */
  isDowngrade?: boolean;
  onSelect: (plan: PlanCardData) => void;
}

export const PlanCard = ({
  plan, isCurrent, isPopular, loading, pendingInvoiceUrl,
  disabledReason, isDowngrade, onSelect,
}: PlanCardProps) => {
  const isFree = Number(plan.price) === 0;
  const isPending = !!pendingInvoiceUrl;
  const isDisabled = isCurrent || loading || !!disabledReason;

  const buttonLabel = (() => {
    if (loading) return 'Processando...';
    if (isCurrent) return 'Plano Atual';
    if (isFree) return 'Ativar Plano Grátis';
    if (isDowngrade) return 'Agendar downgrade';
    return 'Assinar Plano';
  })();

  const renderButton = () => {
    if (isPending && !isCurrent) {
      return (
        <Button asChild className="w-full mt-6 bg-amber-500 hover:bg-amber-600 text-white">
          <a href={pendingInvoiceUrl!} target="_blank" rel="noopener noreferrer">
            Concluir pagamento
          </a>
        </Button>
      );
    }

    const btn = (
      <Button
        className="w-full mt-6"
        variant={isPopular ? 'default' : isCurrent ? 'outline' : 'default'}
        disabled={isDisabled}
        onClick={() => onSelect(plan)}
      >
        {loading ? (
          <><Loader2 className="h-4 w-4 animate-spin mr-2" />Processando...</>
        ) : (
          buttonLabel
        )}
      </Button>
    );

    if (disabledReason) {
      return (
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="block w-full mt-6">
                <Button
                  className="w-full"
                  variant="outline"
                  disabled
                >
                  {buttonLabel}
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs text-center">
              {disabledReason}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return btn;
  };

  return (
    <Card
      className={cn(
        'relative flex flex-col h-full transition-all',
        isPopular && 'border-primary border-2 shadow-lg shadow-primary/10 scale-[1.02]',
        isCurrent && 'border-emerald-500 border-2',
        isPending && !isCurrent && 'border-amber-500 border-2'
      )}
    >
      {isPopular && !isPending && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground gap-1">
            <Sparkles className="h-3 w-3" />
            Mais Popular
          </Badge>
        </div>
      )}
      {isCurrent && (
        <div className="absolute -top-3 right-4">
          <Badge className="bg-emerald-500 text-white">Plano Atual</Badge>
        </div>
      )}
      {isPending && !isCurrent && (
        <div className="absolute -top-3 right-4">
          <Badge className="bg-amber-500 text-white">Aguardando pagamento</Badge>
        </div>
      )}

      <CardHeader className="text-center pb-4">
        <CardTitle className="text-xl tracking-wide">{plan.name}</CardTitle>
        <div className="mt-2">
          {isFree ? (
            <div className="text-4xl font-bold">Grátis</div>
          ) : (
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-2xl font-medium text-muted-foreground">R$</span>
              <span className="text-4xl font-bold">
                {Number(plan.price).toFixed(2).replace('.', ',')}
              </span>
              <span className="text-sm text-muted-foreground">/mês</span>
            </div>
          )}
        </div>
        <div className="mt-2 text-sm text-primary font-medium">
          {plan.monthly_credits.toLocaleString('pt-BR')} créditos/mês
        </div>
      </CardHeader>

      <CardContent className="flex flex-col flex-1">
        <ul className="space-y-2.5 flex-1">
          {plan.feature_list.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <span className="text-foreground/90">{feature}</span>
            </li>
          ))}
        </ul>

        {renderButton()}
      </CardContent>
    </Card>
  );
};

