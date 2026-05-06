import { useParams } from 'react-router-dom';
import { BrokerPortalRenderer } from '@/components/broker-portal/BrokerPortalRenderer';
import { buildDemoPortal, buildDemoProperties } from '@/lib/portalTemplateDemo';
import { getTemplateName, PORTAL_TEMPLATES } from '@/lib/portalTemplatesCatalog';
import { useMemo } from 'react';

export default function PortalTemplatePreview() {
  const { id } = useParams();
  const tplId = Number(id) || 1;
  const info = PORTAL_TEMPLATES.find((t) => t.id === tplId);
  const portal = useMemo(() => buildDemoPortal(tplId), [tplId]);
  const properties = useMemo(() => buildDemoProperties(), []);

  if (!info?.available) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Modelo "{getTemplateName(tplId)}" ainda não disponível.
      </div>
    );
  }

  return (
    <>
      <div className="bg-yellow-400 text-black text-center text-xs py-1.5 px-3 sticky top-0 z-50">
        🎨 PRÉ-VISUALIZAÇÃO — Modelo: <strong>{info.name}</strong> (dados fictícios)
      </div>
      <BrokerPortalRenderer portal={portal} properties={properties} />
    </>
  );
}
