import { Instagram, Facebook, Youtube, Heart, Phone, Mail, Copy } from 'lucide-react';
import { BrokerPortal } from '@/hooks/useBrokerPortal';
import { toast } from 'sonner';
import { resolveMenuItems } from './menuItems';

export function Header({ portal, onNav, currentSection }: { portal: BrokerPortal; onNav: (s: string) => void; currentSection: string }) {
  const b = portal.branding ?? {};
  const items = resolveMenuItems(b).filter((m) => m.visible);
  const copyEmail = () => { if (b.email) { navigator.clipboard.writeText(b.email); toast.success('E-mail copiado'); } };
  return (
    <header className="relative z-30 bg-[var(--bp-bg)] text-[var(--bp-fg)]">
      <div className="bg-black/30 text-xs">
        <div className="container mx-auto px-4 py-2 flex items-center justify-end gap-4 flex-wrap">
          {b.whatsapp && (
            <a href={`https://wa.me/${String(b.whatsapp).replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-[var(--bp-accent)]">
              <Phone className="h-3 w-3" /> {b.whatsapp}
            </a>
          )}
          {b.email && (
            <button onClick={copyEmail} className="flex items-center gap-1 hover:text-[var(--bp-accent)]">
              <Mail className="h-3 w-3" /> Ver e-mail <Copy className="h-3 w-3" />
            </button>
          )}
          <div className="flex items-center gap-2 ml-2">
            {b.instagram && <a href={b.instagram} target="_blank" rel="noreferrer"><Instagram className="h-4 w-4 hover:text-[var(--bp-accent)]" /></a>}
            {b.facebook && <a href={b.facebook} target="_blank" rel="noreferrer"><Facebook className="h-4 w-4 hover:text-[var(--bp-accent)]" /></a>}
            {b.youtube && <a href={b.youtube} target="_blank" rel="noreferrer"><Youtube className="h-4 w-4 hover:text-[var(--bp-accent)]" /></a>}
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          {b.logo_url ? <img src={b.logo_url} alt="logo" className="h-10" /> : <span className="font-bold text-lg">{portal.seo?.title ?? 'Portal de Imóveis'}</span>}
        </div>
        <nav className="flex items-center gap-1 flex-wrap">
          {items.map((it) => {
            const active = it.mode === 'section' && currentSection === it.target;
            const cls = `px-3 py-2 text-sm uppercase tracking-wider transition-colors ${active ? 'bg-[var(--bp-accent)] text-black font-semibold' : 'hover:text-[var(--bp-accent)]'}`;
            if (it.mode === 'url') {
              return <a key={it.id} href={it.target} target="_blank" rel="noreferrer" className={cls}>{it.label}</a>;
            }
            return (
              <button key={it.id} onClick={() => onNav(it.target)} className={cls}>{it.label}</button>
            );
          })}
        </nav>
        <button onClick={() => onNav('favoritos')} className="flex items-center gap-1 text-sm uppercase tracking-wider hover:text-[var(--bp-accent)]">
          <Heart className="h-4 w-4 text-red-500" /> Imóveis Favoritos
        </button>
      </div>
      {/* Esfumaçado abaixo do header, sobrepondo o hero */}
      <div className="pointer-events-none absolute left-0 right-0 top-full h-24 bg-gradient-to-b from-[var(--bp-bg)] via-[var(--bp-bg)]/60 to-transparent" />
    </header>
  );
}
