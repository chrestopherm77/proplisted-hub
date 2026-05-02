import { Button } from "@/components/ui/button";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import { useState } from "react";
import { Loader2 } from "lucide-react";

interface GoogleAuthButtonProps {
  label?: string;
  className?: string;
}

export function GoogleAuthButton({
  label = "Continuar com Google",
  className,
}: GoogleAuthButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      // Usa o cliente OAuth gerenciado do backend (Lovable Cloud).
      // O broker autoriza automaticamente *.lovable.app e os domínios
      // personalizados registrados no projeto. Para domínios externos
      // (Vercel/GitHub Pages) é necessário cadastrar o domínio como
      // domínio personalizado do projeto OU configurar credenciais
      // Google próprias no painel de autenticação do backend.
      const redirectTo = `${window.location.origin}/cadastro-realizado`;

      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: redirectTo,
        extraParams: { prompt: "select_account" },
      });

      if (result.error) {
        console.error("[GoogleAuth] error", result.error);
        toast.error(
          "Não foi possível entrar com Google neste domínio. Cadastre o domínio como domínio personalizado do projeto ou configure suas credenciais Google.",
          { duration: 7000 },
        );
        setLoading(false);
        return;
      }

      if (result.redirected) {
        // Navegador redirecionando para o Google.
        return;
      }

      // Sessão já criada — vai para a página de cadastro concluído.
      window.location.href = "/cadastro-realizado";
    } catch (e) {
      console.error("[GoogleAuth] exception", e);
      toast.error("Erro inesperado ao entrar com Google. Tente novamente.");
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
          <path
            fill="#EA4335"
            d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.74-6-6.1s2.7-6.1 6-6.1c1.9 0 3.16.81 3.88 1.5l2.65-2.55C16.93 3.36 14.7 2.4 12 2.4 6.84 2.4 2.7 6.54 2.7 11.7s4.14 9.3 9.3 9.3c5.37 0 8.93-3.77 8.93-9.08 0-.61-.07-1.08-.16-1.55H12z"
          />
        </svg>
      )}
      {label}
    </Button>
  );
}
