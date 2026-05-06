import { BrokerPortal } from '@/hooks/useBrokerPortal';

export function AboutSection({ portal }: { portal: BrokerPortal }) {
  const b = portal.branding ?? {};
  if (!b.about_text && !b.about_image_url) return null;
  return (
    <section id="bp-sobre" className="py-16 bg-neutral-50">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-10 items-center max-w-5xl mx-auto">
          {b.about_image_url && (
            <div className="w-full max-w-md mx-auto">
              <div className="aspect-[4/3] overflow-hidden rounded-lg shadow-lg">
                <img src={b.about_image_url} alt="Sobre nós" className="w-full h-full object-cover" style={{ objectPosition: 'center top' }} />
              </div>
            </div>
          )}
          <div>
            <h2 className="text-3xl md:text-4xl font-light mb-4 text-neutral-900">Sobre nós</h2>
            <div className="h-1 w-16 mb-5" style={{ background: 'var(--bp-accent)' }} />
            <p className="text-neutral-700 leading-relaxed whitespace-pre-line">{b.about_text || b.about}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
