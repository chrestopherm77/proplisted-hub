import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { CheckCircle2, AlertCircle, Loader2, Sparkles } from "lucide-react";

interface CompleteProfileBannerProps {
  onCompleted?: () => void;
  onOpenWizard?: () => void;
}

export function CompleteProfileBanner({ onCompleted, onOpenWizard }: CompleteProfileBannerProps) {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [completed, setCompleted] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const highlight = searchParams.get("complete") === "1";

  const refresh = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("profile_completed")
      .eq("id", user.id)
      .maybeSingle();
    setCompleted(((data as any)?.profile_completed) === true);
  };

  useEffect(() => { refresh(); }, [user?.id]);

  const handleMarkComplete = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("mark_profile_complete", { p_user_id: user.id });
      if (error) throw error;
      const result = data as { success?: boolean; error?: string };
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Cadastro completo! Obrigado.");
        setCompleted(true);
        if (highlight) {
          searchParams.delete("complete");
          setSearchParams(searchParams, { replace: true });
        }
        onCompleted?.();
      }
    } catch (e: any) {
      toast.error(e?.message || "Erro ao marcar cadastro como completo");
    } finally {
      setLoading(false);
    }
  };

  if (completed === null) return null;

  if (completed) {
    return (
      <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800 dark:text-green-300">Cadastro completo</AlertTitle>
        <AlertDescription className="text-green-700 dark:text-green-400">
          Todos os seus dados estão preenchidos.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className={highlight ? "border-primary ring-2 ring-primary/20" : "border-amber-300"}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center shrink-0">
            <AlertCircle className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="font-semibold text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Complete seu cadastro
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Preencha os dados abaixo (CPF/CNPJ, endereço completo, registro profissional e aceite os termos)
                para liberar todos os recursos da plataforma.
              </p>
            </div>
            <Button onClick={handleMarkComplete} disabled={loading} size="sm">
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Validando...</> : "Já preenchi tudo — marcar como completo"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
