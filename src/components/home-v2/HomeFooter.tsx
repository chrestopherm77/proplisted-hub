import { Link } from 'react-router-dom';
import { Instagram, Linkedin, MessageCircle } from 'lucide-react';
import logoAsset from '@/assets/conectae-logo-branco.png.asset.json';

const logo = logoAsset.url;

export function HomeFooter() {
  return (
    <footer className="bg-[hsl(var(--v2-footer))] py-14">
      <div className="mx-auto max-w-[1440px] px-5 lg:px-16">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <img src={logo} alt="Conectaê Imob" className="h-10 w-auto object-contain" />
            <p className="mt-4 max-w-xs text-sm text-[hsl(var(--v2-meta))]">
              Portal de imóveis e hub de ferramentas para o corretor. Transparente, direto e
              pró-corretor.
            </p>
            <div className="mt-5 flex gap-3">
              {[
                { Icon: Instagram, label: 'Instagram', href: 'https://instagram.com' },
                { Icon: Linkedin, label: 'LinkedIn', href: 'https://linkedin.com' },
                { Icon: MessageCircle, label: 'WhatsApp', href: 'https://wa.me/5531991914663' },
              ].map(({ Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="grid h-9 w-9 place-items-center rounded-full border border-white/15 text-[hsl(var(--v2-on-dark))] hover:bg-white/10 transition"
                >
                  <Icon className="h-4 w-4" strokeWidth={2} />
                </a>
              ))}
            </div>
          </div>

          <FooterCol
            title="Portal"
            items={[
              { label: 'Imóveis', to: '#imoveis' },
              { label: 'Giro do Mercado', to: '/conectaeimob/noticias' },
              { label: 'Portal Conectaê', to: '/portal-conectae' },
            ]}
          />
          <FooterCol
            title="Corretores"
            items={[
              { label: 'Sou corretor', to: '/corretor' },
              { label: 'Planos', to: '/planos' },
              { label: 'Criar conta', to: '/cadastro' },
            ]}
          />
          <FooterCol
            title="Empresa"
            items={[
              { label: 'Entrar', to: '/auth' },
              { label: 'Notícias', to: '/conectaeimob/noticias' },
            ]}
          />
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-xs text-[hsl(var(--v2-meta))]">
          © {new Date().getFullYear()} Conectaê Imob. Todos os direitos reservados. · Anúncios
          publicados por corretores parceiros com CRECI ativo.
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, items }: { title: string; items: { label: string; to: string }[] }) {
  return (
    <div>
      <h4 className="font-display text-xs font-bold uppercase tracking-wide text-white">{title}</h4>
      <ul className="mt-4 space-y-2.5 text-sm text-[hsl(var(--v2-on-dark))]">
        {items.map((i) => (
          <li key={i.label}>
            {i.to.startsWith('#') ? (
              <button
                onClick={() => document.getElementById(i.to.slice(1))?.scrollIntoView({ behavior: 'smooth' })}
                className="hover:text-white transition"
              >
                {i.label}
              </button>
            ) : (
              <Link to={i.to} className="hover:text-white transition">
                {i.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
