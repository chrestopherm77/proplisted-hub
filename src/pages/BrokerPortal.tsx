import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useBrokerPortalBySlug, fetchPortalProperties } from '@/hooks/useBrokerPortal';
import { BrokerPortalRenderer } from '@/components/broker-portal/BrokerPortalRenderer';
import { Loader2 } from 'lucide-react';

export default function BrokerPortal() {
  const { slug } = useParams();
  const { portal, loading } = useBrokerPortalBySlug(slug);
  const [properties, setProperties] = useState<any[]>([]);
  const [loadingProps, setLoadingProps] = useState(true);

  useEffect(() => {
    if (!portal) return;
    fetchPortalProperties(portal).then((p) => {
      setProperties(p);
      setLoadingProps(false);
    });
  }, [portal]);

  if (loading || (portal && loadingProps)) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }
  if (!portal) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Portal não encontrado.</div>;
  }
  if (!portal.is_active) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Portal indisponível no momento.</div>;
  }
  return <BrokerPortalRenderer portal={portal} properties={properties} />;
}
