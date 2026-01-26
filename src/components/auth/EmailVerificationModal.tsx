import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Loader2, Mail, RefreshCw, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  onVerified: () => void;
  onChangeEmail: () => void;
}

export function EmailVerificationModal({
  isOpen,
  onClose,
  email,
  onVerified,
  onChangeEmail,
}: EmailVerificationModalProps) {
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Auto-verify when 6 digits are entered
  useEffect(() => {
    if (code.length === 6) {
      handleVerify();
    }
  }, [code]);

  const handleVerify = async () => {
    if (code.length !== 6) return;

    setIsVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-email-code", {
        body: { email, code },
      });

      if (error) throw error;

      if (data.valid) {
        toast.success("E-mail verificado com sucesso!");
        onVerified();
      } else if (data.expired) {
        toast.error("Código expirado. Solicite um novo código.");
        setCode("");
      } else {
        toast.error("Código inválido. Tente novamente.");
        setCode("");
      }
    } catch (error: any) {
      console.error("Error verifying code:", error);
      toast.error("Erro ao verificar código");
      setCode("");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    setIsResending(true);
    try {
      const { error } = await supabase.functions.invoke("send-email-code", {
        body: { email },
      });

      if (error) throw error;

      toast.success("Novo código enviado para seu e-mail");
      setResendCooldown(60);
      setCode("");
    } catch (error: any) {
      console.error("Error resending code:", error);
      toast.error("Erro ao reenviar código");
    } finally {
      setIsResending(false);
    }
  };

  const handleChangeEmail = () => {
    setCode("");
    onChangeEmail();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl">Verificar seu E-mail</DialogTitle>
          <DialogDescription className="text-center">
            Enviamos um código de 6 dígitos para{" "}
            <span className="font-medium text-foreground">{email}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-4">
          <InputOTP
            maxLength={6}
            value={code}
            onChange={setCode}
            disabled={isVerifying}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>

          <Button
            onClick={handleVerify}
            disabled={code.length !== 6 || isVerifying}
            className="w-full"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verificando...
              </>
            ) : (
              "Verificar Código"
            )}
          </Button>

          <div className="flex flex-col items-center gap-2 text-sm">
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0 || isResending}
              className="text-primary hover:underline disabled:opacity-50 disabled:no-underline flex items-center gap-1"
            >
              {isResending ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Reenviando...
                </>
              ) : resendCooldown > 0 ? (
                <>
                  <RefreshCw className="w-3 h-3" />
                  Reenviar em {resendCooldown}s
                </>
              ) : (
                <>
                  <RefreshCw className="w-3 h-3" />
                  Reenviar código
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleChangeEmail}
              className="text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" />
              Alterar e-mail
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
