import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

type Alert = {
  id: string;
  source: string;
  alert_type: string;
  message: string;
  details: Record<string, unknown> | null;
  created_at: string;
};

export const MegaApiAlertModal = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();

  // Verifica role do usuário
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) { setIsAdmin(false); return; }
      const { data } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "MASTER_ADMIN",
      });
      if (!cancelled) setIsAdmin(Boolean(data));
    })();
    return () => { cancelled = true; };
  }, [user]);

  const { data: alerts = [] } = useQuery({
    queryKey: ["mega-api-alerts", user?.id],
    enabled: isAdmin,
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mega_api_alerts")
        .select("id, source, alert_type, message, details, created_at")
        .is("resolved_at", null)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as Alert[];
    },
  });

  // Abre o modal quando há alertas pendentes
  useEffect(() => {
    if (isAdmin && alerts.length > 0) setOpen(true);
  }, [isAdmin, alerts.length]);

  const resolveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("mega_api_alerts")
        .update({
          resolved_at: new Date().toISOString(),
          resolved_by: user?.id ?? null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mega-api-alerts"] });
      toast.success("Alerta marcado como resolvido");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const resolveAll = useMutation({
    mutationFn: async () => {
      const ids = alerts.map((a) => a.id);
      if (ids.length === 0) return;
      const { error } = await supabase
        .from("mega_api_alerts")
        .update({
          resolved_at: new Date().toISOString(),
          resolved_by: user?.id ?? null,
        })
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mega-api-alerts"] });
      toast.success("Todos os alertas marcados como resolvidos");
      setOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (!isAdmin || alerts.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl" lang="pt-BR" translate="no">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            MegaAPI com erro ({alerts.length})
          </DialogTitle>
          <DialogDescription>
            Foram detectados erros na integração com a MegaAPI. Verifique o painel
            e a conexão do WhatsApp. Após resolver, marque os alertas como resolvidos.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh] pr-3">
          <div className="space-y-3">
            {alerts.map((a) => (
              <div
                key={a.id}
                className="rounded-md border border-destructive/30 bg-destructive/5 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {a.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      <span className="font-mono">{a.source}</span> · {a.alert_type} ·{" "}
                      {new Date(a.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => resolveMutation.mutate(a.id)}
                    disabled={resolveMutation.isPending}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Resolver
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex justify-between gap-2 pt-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Fechar
          </Button>
          <Button
            variant="destructive"
            onClick={() => resolveAll.mutate()}
            disabled={resolveAll.isPending}
          >
            Resolver todos
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
