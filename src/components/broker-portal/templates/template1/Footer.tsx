import { BrokerPortal } from '@/hooks/useBrokerPortal';
import { Phone, Copy } from 'lucide-react';
import { toast } from 'sonner';

export function Footer({ portal, onNav }: { portal: BrokerPortal; onNav: (s: string) => void }) {
  const b = portal.branding ?? {};
  const copyEmail = () => { if (b.email) { navigator.clipboard.writeText(b.email); toast.success('E-mail copiado'); } };
  const year = new Date().getFullYear();
  return (
    <footer className="bg-[var(--bp-bg)] text-[var(--bp-fg)] mt-12">
      {(b.about_image_url || b.about_text) && (
        <div className="relative">
          {b.about_image_url && <img src={b.about_image_url} alt="" className="w-full h-72 object-cover" />}
          {b.about_text && (
            <div className="absolute inset-0 flex items-center justify-end p-8 bg-gradient-to-l from-black/60 to-transparent">
              <p className="max-w-md text-white text-2xl font-light leading-snug">{b.about_text}</p>
            </div>
          )}
        </div>
      )}
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
            {(() => {
              const lb = b.menu_labels ?? {};
              const def: Record<string,string> = { home: 'Início', sobre: 'Sobre', contato: 'Contato', financie: 'Financie', negociar: 'Negocie seu Imóvel' };
              return ['home','sobre','contato','financie','negociar'].map((id) => (
                <li key={id}><button onClick={() => onNav(id)} className="hover:text-[var(--bp-accent)] underline-offset-2 underline">{lb[id] || def[id]}</button></li>
              ));
            })()}
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
