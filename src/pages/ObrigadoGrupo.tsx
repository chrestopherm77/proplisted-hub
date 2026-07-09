import { useEffect } from 'react';
import { CheckCircle2, Users } from 'lucide-react';

const REDIRECT_URL = 'https://chat.whatsapp.com/HFADh8ziAHsKjnfDbb0E6N?mode=gi_t';

export default function ObrigadoGrupo() {
  useEffect(() => {
    const t = setTimeout(() => {
      window.location.href = REDIRECT_URL;
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
          Obrigado pela sua compra. Agora entre no grupo oficial do evento no WhatsApp para receber todas as informações e novidades.
        </p>
        <a
          href={REDIRECT_URL}
          className="inline-flex items-center justify-center gap-2 w-full bg-primary text-primary-foreground font-medium py-3 px-6 rounded-lg hover:opacity-90 transition-opacity"
        >
          <Users className="w-5 h-5" />
          Entrar no grupo do evento
        </a>
        <p className="text-xs text-muted-foreground">
          Você será redirecionado automaticamente em instantes...
        </p>
      </div>
    </div>
  );
}
