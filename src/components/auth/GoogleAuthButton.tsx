import { Button } from "@/components/ui/button";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import { useState } from "react";
import { Loader2 } from "lucide-react";

interface GoogleAuthButtonProps {
  label?: string;
  className?: string;
}

export function GoogleAuthButton({ label = "Continuar com Google", className }: GoogleAuthButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    // O broker OAuth do Lovable só funciona em domínios .lovable.app e domínios customizados.
    // No preview de desenvolvimento (*.lovableproject.com) o callback /~oauth/callback
    // não é interceptado e cai no 404 do React Router.
    const host = window.location.hostname;
    const isDevPreview = host.endsWith(".lovableproject.com");
    if (isDevPreview) {
      toast.error(
        "Login com Google não funciona no preview de desenvolvimento. Teste no app publicado (proplisted-hub.lovable.app) ou no seu domínio.",
        { duration: 6000 },
      );
      return;
    }

    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error("Erro ao entrar com Google. Tente novamente.");
        setLoading(false);
        return;
      }
      if (result.redirected) {
        // navegador redireciona pro Google
        return;
      }
      // tokens recebidos: vai para primeiros passos
      window.location.href = "/cadastro-realizado";
    } catch (e) {
      console.error(e);
      toast.error("Erro inesperado ao entrar com Google");
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      className={`w-full gap-2 ${className ?? ""}`}
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.74-6-6.1s2.7-6.1 6-6.1c1.9 0 3.16.81 3.88 1.5l2.65-2.55C16.93 3.36 14.7 2.4 12 2.4 6.84 2.4 2.7 6.54 2.7 11.7s4.14 9.3 9.3 9.3c5.37 0 8.93-3.77 8.93-9.08 0-.61-.07-1.08-.16-1.55H12z"/>
        </svg>
      )}
      {label}
    </Button>
  );
}
