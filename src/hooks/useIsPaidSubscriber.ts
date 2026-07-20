import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/**
 * Retorna true se o usuário possui qualquer plano pago ativo (price > 0)
 * ou é admin. Usado para aplicar precificação diferenciada de créditos/leads.
 */
export function useIsPaidSubscriber() {
  const { user, isAdmin, permissionsLoading } = useAuth();
  const [isPaidSubscriber, setIsPaidSubscriber] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (permissionsLoading) return;
    let cancelled = false;

    const load = async () => {
      if (!user) {
        if (!cancelled) {
          setIsPaidSubscriber(false);
          setLoading(false);
        }
        return;
      }

      if (isAdmin) {
        if (!cancelled) {
          setIsPaidSubscriber(true);
          setLoading(false);
        }
        return;
      }

      const { data } = await supabase
        .from('user_subscriptions')
        .select('id, plan:subscription_plans!user_subscriptions_plan_id_fkey(price)')
        .eq('user_id', user.id)
        .eq('status', 'ACTIVE')
        .order('created_at', { ascending: false });

      const paid = Array.isArray(data) && data.some((row: any) => Number(row?.plan?.price ?? 0) > 0);
      if (!cancelled) {
        setIsPaidSubscriber(paid);
        setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [user, isAdmin, permissionsLoading]);

  return { isPaidSubscriber, loading };
}
