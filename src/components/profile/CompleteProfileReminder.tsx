import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Sparkles } from "lucide-react";

const REMINDER_INTERVAL_DAYS = 3;

// Rotas onde o lembrete NÃO deve aparecer
const EXCLUDED_PATHS = [
  "/auth", "/cadastro", "/cadastro-realizado", "/reset-password",
  "/lp", "/lp-01", "/lp-obrigado", "/lp-obrigado-01",
];

export function CompleteProfileReminder() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [profileCompleted, setProfileCompleted] = useState<boolean | null>(null);

  useEffect(() => {
    if (loading || !user) return;
    if (EXCLUDED_PATHS.some((p) => location.pathname.startsWith(p))) return;

    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("profile_completed, last_completion_reminder_at")
        .eq("id", user.id)
        .maybeSingle();

      if (cancelled || !data) return;
      const completed = (data as any).profile_completed === true;
      setProfileCompleted(completed);
      if (completed) return;

      const last = (data as any).last_completion_reminder_at as string | null;
      const shouldShow =
        !last ||
        Date.now() - new Date(last).getTime() >= REMINDER_INTERVAL_DAYS * 24 * 60 * 60 * 1000;

      if (shouldShow) {
        setOpen(true);
      }
    })();

    return () => { cancelled = true; };
  }, [user, loading, location.pathname]);

  const dismissAndTouch = async () => {
    setOpen(false);
    if (user) {
      await supabase.rpc("touch_completion_reminder", { p_user_id: user.id });
    }
  };

  const handleComplete = async () => {
    await dismissAndTouch();
    navigate("/profile?complete=1");
  };

  if (profileCompleted) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) dismissAndTouch(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center">Complete seu cadastro</DialogTitle>
          <DialogDescription className="text-center">
            Complete seu cadastro para poder acompanhar leads, imóveis e parcerias da sua região.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0">
          <Button variant="outline" onClick={dismissAndTouch} className="w-full sm:w-auto">
            Mais tarde
          </Button>
          <Button onClick={handleComplete} className="w-full sm:w-auto">
            Completar agora
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
