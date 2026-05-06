import { BrokerPortal } from '@/hooks/useBrokerPortal';

export function AboutSection({ portal }: { portal: BrokerPortal }) {
  const b = portal.branding ?? {};
  if (!b.about_text && !b.about_image_url) return null;
  return (
    <section id="bp-sobre" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-10 items-center max-w-5xl mx-auto">
          {b.about_image_url && (
            <div className="w-full">
              <div className="aspect-[4/3] overflow-hidden rounded-md shadow-lg">
                <img src={b.about_image_url} alt="Sobre nós" className="w-full h-full object-cover" />
              </div>
            </div>
          )}
          <div>
            <h2 className="text-3xl md:text-4xl font-light mb-3 tracking-wide" style={{ color: 'var(--bp-accent)' }}>Sobre nós</h2>
            <div className="h-1 w-16 mb-5" style={{ background: 'var(--bp-accent-strong)' }} />
            <p className="text-neutral-700 leading-relaxed whitespace-pre-line">{b.about_text || b.about}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
