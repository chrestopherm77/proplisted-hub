import { BrokerPortal } from '@/hooks/useBrokerPortal';

export function CtaBanner({ portal, onContact }: { portal: BrokerPortal; onContact: () => void }) {
  const b = portal.branding ?? {};
  const bg = b.cta_banner_url || b.hero_bg_url;
  const text = b.cta_banner_text || 'Não encontrou o que procurava?';
  return (
    <section
      className="relative py-20 text-white text-center"
      style={{
        backgroundImage: bg
          ? `linear-gradient(rgba(15,30,60,0.65), rgba(15,30,60,0.65)), url(${bg})`
          : 'linear-gradient(135deg, #0f1e3c, #1e3a8a)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <h3 className="text-3xl md:text-4xl font-light italic" style={{ fontFamily: 'cursive' }}>{text}</h3>
      <button onClick={onContact} className="mt-4 text-xs uppercase tracking-[0.3em] hover:underline">Entre em contato</button>
    </section>
  );
}
