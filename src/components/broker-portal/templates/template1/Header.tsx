import { Instagram, Facebook, Youtube, Heart, Phone, Mail, Copy } from 'lucide-react';
import { BrokerPortal } from '@/hooks/useBrokerPortal';
import { toast } from 'sonner';

export function Header({ portal, onNav, currentSection }: { portal: BrokerPortal; onNav: (s: string) => void; currentSection: string }) {
  const b = portal.branding ?? {};
  const labels = b.menu_labels ?? {};
  const items = [
    { id: 'home', label: labels.home || 'Início' },
    { id: 'sobre', label: labels.sobre || 'Sobre' },
    { id: 'contato', label: labels.contato || 'Contato' },
    { id: 'financie', label: labels.financie || 'Financie' },
    { id: 'negociar', label: labels.negociar || 'Negocie seu Imóvel' },
  ];
  const copyEmail = () => { if (b.email) { navigator.clipboard.writeText(b.email); toast.success('E-mail copiado'); } };
  return (
    <header className="bg-[var(--bp-bg)] text-[var(--bp-fg)] border-b border-white/5">
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
          {items.map((it) => (
            <button
              key={it.id}
              onClick={() => onNav(it.id)}
              className={`px-3 py-2 text-sm uppercase tracking-wider transition-colors ${currentSection === it.id ? 'bg-[var(--bp-accent)] text-black font-semibold' : 'hover:text-[var(--bp-accent)]'}`}
            >
              {it.label}
            </button>
          ))}
        </nav>
        <button onClick={() => onNav('favoritos')} className="flex items-center gap-1 text-sm uppercase tracking-wider hover:text-[var(--bp-accent)]">
          <Heart className="h-4 w-4 text-red-500" /> Imóveis Favoritos
        </button>
      </div>
    </header>
  );
}
