import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Gift, MessageCircle } from "lucide-react";
import { toast } from "sonner";

interface ReferralPopupProps {
  userId: string;
}

const STORAGE_KEY = "referral_popup_shown";

export function ReferralPopup({ userId }: ReferralPopupProps) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    if (sessionStorage.getItem(STORAGE_KEY) === "true") return;

    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("referral_code")
          .eq("id", userId)
          .single();

        if (cancelled) return;
        if (error || !data?.referral_code) return;
        setCode(data.referral_code);
        setOpen(true);
        sessionStorage.setItem(STORAGE_KEY, "true");
      } catch (e) {
        console.error("[ReferralPopup] Erro ao buscar código:", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (!code) return null;

  const message = `Olá! 👋 Tô usando a LeadBay pra comprar leads de imóveis. Se você se cadastrar usando meu código de indicação *${code}*, eu ganho créditos e você entra numa plataforma top. Cadastra aqui: https://leadbay.com.br/auth`;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Código copiado!");
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message);
      toast.success("Mensagem copiada!");
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  const whatsappLink = `https://wa.me/?text=${encodeURIComponent(message)}`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto mb-2">
            <Gift className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl">
            Indique um corretor e ganhe 280 créditos
          </DialogTitle>
          <DialogDescription className="text-center">
            Compartilhe seu código de indicação. Quando seu amigo se cadastrar usando ele, você ganha
            <strong className="text-foreground"> 280 créditos</strong> direto na sua conta.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Seu código de indicação</label>
            <div className="flex gap-2">
              <Input
                value={code}
                readOnly
                className="font-mono text-lg text-center tracking-widest font-semibold"
              />
              <Button type="button" variant="outline" size="icon" onClick={handleCopyCode}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Mensagem pronta</label>
            <div className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground whitespace-pre-wrap">
              {message}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={handleCopyMessage}>
                <Copy className="w-4 h-4 mr-2" />
                Copiar mensagem
              </Button>
              <Button type="button" className="flex-1" asChild>
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  WhatsApp
                </a>
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="w-full">
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
