import { BrokerPortal } from '@/hooks/useBrokerPortal';

export function CtaBanner({ portal }: { portal: BrokerPortal }) {
  const b = portal.branding ?? {};
  const bg = b.cta_banner_url;
  if (!bg) return null;
  return (
    <section className="w-full">
      <div
        className="w-full aspect-[16/4] min-h-[180px] bg-neutral-200"
        style={{ backgroundImage: `url(${bg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        aria-label={b.cta_banner_text || ''}
      />
    </section>
  );
}
