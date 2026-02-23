import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { validateEmail } from "@/lib/validators";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("E-mail é obrigatório");
      return;
    }

    if (!validateEmail(email)) {
      setError("E-mail inválido");
      return;
    }

    setIsLoading(true);
    try {
      const { error: fnError } = await supabase.functions.invoke("send-password-reset", {
        body: { email },
      });

      if (fnError) throw fnError;

      setIsSent(true);
      toast.success("E-mail de recuperação enviado!");
    } catch (error: any) {
      console.error("Error sending reset email:", error);
      // Still show success for security (don't reveal if email exists)
      setIsSent(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setIsSent(false);
    setError("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              {isSent ? (
                <CheckCircle className="w-8 h-8 text-green-500" />
              ) : (
                <Mail className="w-8 h-8 text-primary" />
              )}
            </div>
          </div>
          <DialogTitle className="text-center text-xl">
            {isSent ? "E-mail Enviado!" : "Esqueci minha senha"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {isSent
              ? "Se o e-mail existir em nossa base, você receberá instruções para redefinir sua senha."
              : "Digite seu e-mail para receber instruções de recuperação de senha."}
          </DialogDescription>
        </DialogHeader>

        {isSent ? (
          <div className="flex flex-col items-center gap-4 py-4">
            <p className="text-sm text-muted-foreground text-center">
              Verifique sua caixa de entrada e a pasta de spam.
            </p>
            <Button onClick={handleClose} className="w-full">
              Voltar ao login
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">E-mail</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                disabled={isLoading}
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar link de recuperação"
              )}
            </Button>

            <button
              type="button"
              onClick={handleClose}
              className="text-sm text-muted-foreground hover:text-foreground text-center"
            >
              Voltar ao login
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
