import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "@/lib/pageViewTracking";

/** Loga PAGE_VIEW em user_activity_log a cada mudança de rota (apenas usuário logado). */
export function PageViewTracker() {
  const location = useLocation();
  useEffect(() => {
    void trackPageView(location.pathname);
  }, [location.pathname]);
  return null;
}
