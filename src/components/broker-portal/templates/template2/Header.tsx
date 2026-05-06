import { Instagram, Facebook, Youtube, Heart, Phone, Copy } from 'lucide-react';
import { BrokerPortal } from '@/hooks/useBrokerPortal';
import { toast } from 'sonner';
import { resolveMenuItems } from '../template1/menuItems';

export function Header({ portal, onNav, currentSection }: { portal: BrokerPortal; onNav: (s: string) => void; currentSection: string }) {
  const b = portal.branding ?? {};
  const items = resolveMenuItems(b).filter((m) => m.visible);
  const accent = 'var(--bp-accent)';
  const copyEmail = () => { if (b.email) { navigator.clipboard.writeText(b.email); toast.success('E-mail copiado'); } };
  return (
    <header className="relative z-30 bg-white text-neutral-800 border-b">
      <div className="container mx-auto px-4 flex items-center gap-4 flex-wrap">
        <div className="py-3 flex items-center gap-2 mr-auto">
          {b.logo_url ? <img src={b.logo_url} alt="logo" className="h-16 md:h-20" /> : <span className="font-bold text-xl" style={{ color: accent }}>{portal.seo?.title ?? 'Imobiliária'}</span>}
        </div>

        <nav className="flex items-center flex-wrap">
          {items.map((it) => {
            const active = it.mode === 'section' && currentSection === it.target;
            const cls = `px-5 py-7 text-sm uppercase tracking-wider transition-colors ${active ? 'text-white font-semibold' : 'hover:text-[color:var(--bp-accent)]'}`;
            const style = active ? { background: accent } : undefined;
            if (it.mode === 'url') {
              return <a key={it.id} href={it.target} target="_blank" rel="noreferrer" className={cls} style={style}>{it.label}</a>;
            }
            return (
              <button key={it.id} onClick={() => onNav(it.target)} className={cls} style={style}>{it.label}</button>
            );
          })}
        </nav>

        <div className="hidden md:flex items-center gap-3 ml-2 text-xs">
          {b.whatsapp && (
            <a href={`https://wa.me/${String(b.whatsapp).replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-[color:var(--bp-accent)]">
              <Phone className="h-3 w-3 text-green-600" /> {b.whatsapp}
            </a>
          )}
          {b.email && (
            <button onClick={copyEmail} className="flex items-center gap-1 hover:text-[color:var(--bp-accent)] underline">
              Ver e-mail <Copy className="h-3 w-3" />
            </button>
          )}
          <div className="flex items-center gap-2 ml-1">
            {b.instagram && <a href={b.instagram} target="_blank" rel="noreferrer" className="w-7 h-7 rounded-full bg-neutral-200 flex items-center justify-center hover:bg-neutral-300"><Instagram className="h-3.5 w-3.5" /></a>}
            {b.facebook && <a href={b.facebook} target="_blank" rel="noreferrer" className="w-7 h-7 rounded-full bg-neutral-200 flex items-center justify-center hover:bg-neutral-300"><Facebook className="h-3.5 w-3.5" /></a>}
            {b.youtube && <a href={b.youtube} target="_blank" rel="noreferrer" className="w-7 h-7 rounded-full bg-neutral-200 flex items-center justify-center hover:bg-neutral-300"><Youtube className="h-3.5 w-3.5" /></a>}
          </div>
        </div>

        <button onClick={() => onNav('favoritos')} className="flex items-center gap-1 text-xs uppercase tracking-wider hover:text-[color:var(--bp-accent)] py-2">
          <Heart className="h-4 w-4 text-red-500 fill-red-500" /> Imóveis Favoritos
        </button>
      </div>
    </header>
  );
}
