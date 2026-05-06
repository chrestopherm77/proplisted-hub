import { BrokerPortal } from '@/hooks/useBrokerPortal';
import { Phone, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { resolveMenuItems } from './menuItems';

export function Footer({ portal, onNav }: { portal: BrokerPortal; onNav: (s: string) => void }) {
  const b = portal.branding ?? {};
  const copyEmail = () => { if (b.email) { navigator.clipboard.writeText(b.email); toast.success('E-mail copiado'); } };
  const year = new Date().getFullYear();
  const menu = resolveMenuItems(b);
  return (
    <footer className="bg-[var(--bp-bg)] text-[var(--bp-fg)] mt-12">
      <div className="container mx-auto px-4 py-10 grid md:grid-cols-4 gap-8">
        <div>
          {b.logo_url && <img src={b.logo_url} alt="logo" className="h-16" />}
        </div>
        <div className="text-sm space-y-2">
          <p className="font-semibold">{portal.seo?.title || 'Imobiliária'}</p>
          {b.cnpj && <p className="font-semibold text-[var(--bp-accent)]">CNPJ - {b.cnpj}</p>}
          {b.whatsapp && (
            <a href={`https://wa.me/${String(b.whatsapp).replace(/\D/g, '')}`} className="flex items-center gap-2 text-[var(--bp-accent)]">
              <Phone className="h-4 w-4" /> {b.whatsapp}
            </a>
          )}
          {b.email && (
            <button onClick={copyEmail} className="flex items-center gap-1 text-sm">Ver e-mail <Copy className="h-3 w-3" /></button>
          )}
          {b.address && <p className="text-xs text-white/60">{b.address}</p>}
        </div>
        <div className="text-sm">
          <h4 className="font-semibold mb-3">Menu</h4>
          <ul className="space-y-2">
            {menu.filter((m) => m.visible).map((m) => (
              <li key={m.id}>
                {m.mode === 'url' ? (
                  <a href={m.target} target="_blank" rel="noreferrer" className="hover:text-[var(--bp-accent)] underline underline-offset-2">{m.label}</a>
                ) : (
                  <button onClick={() => onNav(m.target)} className="hover:text-[var(--bp-accent)] underline underline-offset-2">{m.label}</button>
                )}
              </li>
            ))}
          </ul>
        </div>
        <div className="text-sm">
          <h4 className="font-semibold mb-3">Social</h4>
          <ul className="space-y-2">
            {b.instagram && <li><a href={b.instagram} target="_blank" rel="noreferrer" className="underline hover:text-[var(--bp-accent)]">Instagram</a></li>}
            {b.facebook && <li><a href={b.facebook} target="_blank" rel="noreferrer" className="underline hover:text-[var(--bp-accent)]">Facebook</a></li>}
            {b.youtube && <li><a href={b.youtube} target="_blank" rel="noreferrer" className="underline hover:text-[var(--bp-accent)]">Youtube</a></li>}
            {b.tiktok && <li><a href={b.tiktok} target="_blank" rel="noreferrer" className="underline hover:text-[var(--bp-accent)]">TikTok</a></li>}
            {b.linkedin && <li><a href={b.linkedin} target="_blank" rel="noreferrer" className="underline hover:text-[var(--bp-accent)]">LinkedIn</a></li>}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/60">
        {b.footer_text || `© Copyright ${year} - ${portal.seo?.title || 'Portal de Imóveis'} - Todos os direitos reservados`}
      </div>
    </footer>
  );
}
