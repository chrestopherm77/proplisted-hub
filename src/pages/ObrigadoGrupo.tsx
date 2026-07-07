import { useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';

const REDIRECT_URL = 'https://www.google.com.br';

export default function ObrigadoGrupo() {
  useEffect(() => {
    const t = setTimeout(() => {
      window.location.href = REDIRECT_URL;
    }, 3000);
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
          Obrigado pela sua compra. Você será redirecionado em instantes para o grupo.
        </p>
        <a
          href={REDIRECT_URL}
          className="inline-block text-sm text-primary underline hover:no-underline"
        >
          Clique aqui se não for redirecionado
        </a>
      </div>
    </div>
  );
}
