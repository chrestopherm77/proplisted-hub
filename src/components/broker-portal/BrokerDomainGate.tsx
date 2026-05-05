import { useBrokerPortalByDomain, fetchPortalProperties } from '@/hooks/useBrokerPortal';
import { BrokerPortalRenderer } from '@/components/broker-portal/BrokerPortalRenderer';
import { useEffect, useState, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

export function BrokerDomainGate({ children }: { children: ReactNode }) {
  const { portal, loading } = useBrokerPortalByDomain();
  const [properties, setProperties] = useState<any[]>([]);
  const [propsLoading, setPropsLoading] = useState(true);

  useEffect(() => {
    if (!portal) { setPropsLoading(false); return; }
    fetchPortalProperties(portal).then((p) => { setProperties(p); setPropsLoading(false); });
  }, [portal]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }
  if (portal) {
    if (propsLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
    return <BrokerPortalRenderer portal={portal} properties={properties} />;
  }
  return <>{children}</>;
}
