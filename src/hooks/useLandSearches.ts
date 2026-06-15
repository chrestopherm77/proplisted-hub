import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { useAuth } from '@/hooks/useAuth';

export interface LandSearchArea {
  id: string;
  land_search_id: string;
  state: string;
  city: string;
  zone: string | null;
  neighborhood: string | null;
  min_area_m2: number | null;
}

export interface LandSearch {
  id: string;
  company_name: string;
  min_area_m2: number | null;
  notes: string | null;
  logo_url: string | null;
  sort_order: number;
  created_at: string;
  // Campos sensíveis: presentes apenas para admin ou plano pago
  contact_name?: string | null;
  contact_whatsapp?: string | null;
  contact_email?: string | null;
  areas: LandSearchArea[];
}

export function useLandSearches() {
  const { user } = useAuth();
  const { plan, isAdmin } = useSubscriptionLimits();
  const [items, setItems] = useState<LandSearch[]>([]);
  const [loading, setLoading] = useState(true);

  const isPaid = isAdmin || (plan?.price ?? 0) > 0;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let rows: any[] = [];
      if (isPaid) {
        const { data } = await supabase
          .from('land_searches' as any)
          .select('id, company_name, contact_name, contact_whatsapp, contact_email, min_area_m2, notes, logo_url, sort_order, created_at')
          .eq('is_active', true)
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: false });
        rows = data || [];
      } else {
        const { data } = await supabase.rpc('list_land_searches_public' as any);
        rows = data || [];
      }

      const ids = rows.map((r) => r.id);
      let areas: LandSearchArea[] = [];
      if (ids.length > 0) {
        const { data } = await supabase
          .from('land_search_areas' as any)
          .select('id, land_search_id, state, city, zone, neighborhood, min_area_m2')
          .in('land_search_id', ids);
        areas = (data as any) || [];
      }

      setItems(rows.map((r) => ({
        ...r,
        areas: areas.filter((a) => a.land_search_id === r.id),
      })));
    } finally {
      setLoading(false);
    }
  }, [isPaid]);

  useEffect(() => { load(); }, [load]);

  return { items, loading, reload: load, isPaid, isLoggedIn: !!user };
}
