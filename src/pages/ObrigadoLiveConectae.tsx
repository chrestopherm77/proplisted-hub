import { useEffect } from 'react';
import { CheckCircle2, ExternalLink } from 'lucide-react';

const FINAL_REDIRECT_URL = 'https://conectei.digital/lp/liveconectae/obrigado';

export default function ObrigadoLiveConectae() {
  useEffect(() => {
    const t = setTimeout(() => {
      window.location.href = FINAL_REDIRECT_URL;
    }, 3500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full text-center space-y-6 bg-card p-8 rounded-2xl border shadow-sm">
        <div className="flex justify-center">
          <CheckCircle2 className="w-16 h-16 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Pagamento confirmado!</h1>
        <p className="text-muted-foreground">
          Obrigado pela sua compra. Você será redirecionado para a página oficial do evento em instantes.
        </p>
        <a
          href={FINAL_REDIRECT_URL}
          className="inline-flex items-center justify-center gap-2 w-full bg-primary text-primary-foreground font-medium py-3 px-6 rounded-lg hover:opacity-90 transition-opacity"
        >
          <ExternalLink className="w-5 h-5" />
          Ir para a página do evento
        </a>
        <p className="text-xs text-muted-foreground">
          Redirecionamento automático em instantes...
        </p>
      </div>
    </div>
  );
}
