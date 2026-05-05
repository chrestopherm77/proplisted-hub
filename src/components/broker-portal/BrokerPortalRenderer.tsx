import { BrokerPortal } from '@/hooks/useBrokerPortal';
import Template1 from './templates/Template1';
import Template2 from './templates/Template2';
import Template3 from './templates/Template3';

interface Props {
  portal: BrokerPortal;
  properties: any[];
}

export function BrokerPortalRenderer({ portal, properties }: Props) {
  switch (portal.template_id) {
    case 2: return <Template2 portal={portal} properties={properties} />;
    case 3: return <Template3 portal={portal} properties={properties} />;
    default: return <Template1 portal={portal} properties={properties} />;
  }
}
