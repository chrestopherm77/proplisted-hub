import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getEffectivePortalHost } from '@/lib/portalHost';

export interface BrokerPortal {
  id: string;
  user_id: string;
  slug: string;
  custom_domain: string | null;
  template_id: number;
  is_active: boolean;
  properties_source: 'OWN' | 'CITY';
  city: string | null;
  state: string | null;
  branding: Record<string, any>;
  seo: Record<string, any>;
}

const MAIN_HOSTS = [
  'conectaeimob.com.br',
  'www.conectaeimob.com.br',
  'proplisted-hub.lovable.app',
  'localhost',
];

export function useBrokerPortalByDomain() {
  const [portal, setPortal] = useState<BrokerPortal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const host = getEffectivePortalHost();
    const realHost = window.location.hostname;
    // Se NÃO veio host via proxy/storage e estamos num host principal, ignora.
    if (host === realHost && (MAIN_HOSTS.includes(host) || host.includes('lovable.app'))) {
      setLoading(false);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from('broker_portals')
        .select('*')
        .eq('custom_domain', host)
        .eq('is_active', true)
        .maybeSingle();
      setPortal(data as BrokerPortal | null);
      setLoading(false);
    })();
  }, []);

  return { portal, loading };
}

export function useBrokerPortalBySlug(slug: string | undefined) {
  const [portal, setPortal] = useState<BrokerPortal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) { setLoading(false); return; }
    (async () => {
      const { data } = await supabase
        .from('broker_portals')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      setPortal(data as BrokerPortal | null);
      setLoading(false);
    })();
  }, [slug]);

  return { portal, loading };
}

export async function fetchPortalProperties(portal: BrokerPortal) {
  let q = supabase.from('properties').select('*').eq('is_active', true);
  if (portal.properties_source === 'OWN') {
    q = q.eq('user_id', portal.user_id);
  } else if (portal.city) {
    q = q.eq('city', portal.city);
    if (portal.state) q = q.eq('state', portal.state);
  }
  const { data } = await q.order('created_at', { ascending: false });
  return data ?? [];
}
