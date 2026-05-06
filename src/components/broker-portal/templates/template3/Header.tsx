import { Instagram, Facebook, Youtube, Heart, Phone } from 'lucide-react';
import { BrokerPortal } from '@/hooks/useBrokerPortal';
import { resolveMenuItems } from '../template1/menuItems';

export function Header({ portal, onNav, currentSection }: { portal: BrokerPortal; onNav: (s: string) => void; currentSection: string }) {
  const b = portal.branding ?? {};
  const items = resolveMenuItems(b).filter((m) => m.visible);
  const accent = 'var(--bp-accent)';
  return (
    <header className="relative z-30" style={{ background: 'var(--bp-bg-light)' }}>
      <div className="container mx-auto px-4 pt-5 pb-2">
        <div className="grid grid-cols-3 items-center">
          <div className="text-sm flex items-center gap-2 text-neutral-700">
            {b.whatsapp && (
              <a href={`https://wa.me/${String(b.whatsapp).replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:opacity-80" style={{ color: accent }}>
                {b.phone || b.whatsapp} <Phone className="h-4 w-4 text-green-600" />
              </a>
            )}
          </div>
          <div className="flex justify-center">
            {b.logo_url
              ? <img src={b.logo_url} alt="logo" className="h-20 md:h-28 object-contain" />
              : <span className="font-serif text-2xl tracking-widest" style={{ color: accent }}>{portal.seo?.title ?? 'Imobiliária'}</span>}
          </div>
          <div className="flex items-center justify-end gap-2">
            {b.instagram && <a href={b.instagram} target="_blank" rel="noreferrer" className="w-8 h-8 rounded bg-white/70 flex items-center justify-center hover:bg-white"><Instagram className="h-4 w-4 text-neutral-700" /></a>}
            {b.facebook && <a href={b.facebook} target="_blank" rel="noreferrer" className="w-8 h-8 rounded bg-white/70 flex items-center justify-center hover:bg-white"><Facebook className="h-4 w-4 text-neutral-700" /></a>}
            {b.youtube && <a href={b.youtube} target="_blank" rel="noreferrer" className="w-8 h-8 rounded bg-white/70 flex items-center justify-center hover:bg-white"><Youtube className="h-4 w-4 text-neutral-700" /></a>}
          </div>
        </div>

        <nav className="flex items-center justify-center flex-wrap gap-1 mt-4">
          {items.map((it) => {
            const active = it.mode === 'section' && currentSection === it.target;
            const cls = `px-5 py-2.5 text-sm tracking-wide rounded transition-colors ${active ? 'text-white font-semibold' : 'text-neutral-700 hover:text-[color:var(--bp-accent)]'}`;
            const style = active ? { background: 'var(--bp-accent-strong)' } : undefined;
            if (it.mode === 'url') {
              return <a key={it.id} href={it.target} target="_blank" rel="noreferrer" className={cls} style={style}>{it.label}</a>;
            }
            return <button key={it.id} onClick={() => onNav(it.target)} className={cls} style={style}>{it.label}</button>;
          })}
          <button onClick={() => onNav('favoritos')} className="px-4 py-2.5 text-sm flex items-center gap-1 text-neutral-700 hover:text-[color:var(--bp-accent)]">
            <Heart className="h-4 w-4 text-red-500 fill-red-500" /> Imóveis Favoritos
          </button>
        </nav>
      </div>
    </header>
  );
}
