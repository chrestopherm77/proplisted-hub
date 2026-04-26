import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Gift, MessageCircle, Users, CheckCircle, Coins } from "lucide-react";
import { toast } from "sonner";

export default function Indicar() {
  const { user } = useAuth();
  const [code, setCode] = useState<string | null>(null);
  const [stats, setStats] = useState({ signups: 0, paid: 0, credits: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("referral_code")
          .eq("id", user.id)
          .single();
        if (profile?.referral_code) setCode(profile.referral_code);

        // Indicados
        const { data: referred } = await supabase
          .from("profiles")
          .select("id, referral_credits_granted")
          .eq("referred_by", user.id);

        const signups = referred?.length ?? 0;
        const paid = referred?.filter((r) => r.referral_credits_granted).length ?? 0;

        // Créditos recebidos via REFERRAL_BONUS
        const { data: txs } = await supabase
          .from("credit_transactions")
          .select("credits_used")
          .eq("user_id", user.id)
          .eq("type", "REFERRAL_BONUS");

        const credits = (txs ?? []).reduce((s, t) => s + (t.credits_used || 0), 0);

        setStats({ signups, paid, credits });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  if (!user) return null;

  const link = code ? `${window.location.origin}/auth?ref=${code}` : "";
  const message = `Conheça a LeadBay: hub completo para o corretor de imóveis. De leads qualificados ao suporte administrativo, tudo o que você precisa para operar com autonomia.\n\nCadastre-se pelo meu link e comece agora:\n${link}`;
  const whatsappLink = `https://wa.me/?text=${encodeURIComponent(message)}`;

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copiado!`);
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mx-auto mb-3">
          <Gift className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-3xl font-bold">Indique e ganhe 280 créditos</h1>
        <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
          Compartilhe seu link único. Você ganha{" "}
          <strong className="text-foreground">280 créditos</strong> quando seu indicado se cadastrar
          e ativar uma <strong className="text-foreground">assinatura paga</strong> (Essencial,
          Performance ou Elite).
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <Users className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-3xl font-bold">{loading ? "—" : stats.signups}</p>
            <p className="text-xs text-muted-foreground mt-1">Cadastros pelo seu link</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <CheckCircle className="w-6 h-6 text-success mx-auto mb-2" />
            <p className="text-3xl font-bold">{loading ? "—" : stats.paid}</p>
            <p className="text-xs text-muted-foreground mt-1">Assinaturas confirmadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Coins className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-3xl font-bold">{loading ? "—" : stats.credits}</p>
            <p className="text-xs text-muted-foreground mt-1">Créditos recebidos</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seu link de indicação</CardTitle>
          <CardDescription>
            Envie esse link para outros corretores. Quando eles assinarem um plano pago, você ganha
            os créditos automaticamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input value={link} readOnly className="font-mono text-sm" />
            <Button variant="outline" size="icon" onClick={() => copy(link, "Link")}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Mensagem pronta</label>
            <div className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground whitespace-pre-wrap">
              {message}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => copy(message, "Mensagem")}>
                <Copy className="w-4 h-4 mr-2" />
                Copiar mensagem
              </Button>
              <Button className="flex-1" asChild>
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  WhatsApp
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
