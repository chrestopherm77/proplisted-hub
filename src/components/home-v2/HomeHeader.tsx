import { Link } from 'react-router-dom';
import logoAsset from '@/assets/conectae-logo-branco.png.asset.json';

const logoWhite = logoAsset.url;

const NAV = [
  { id: 'imoveis', label: 'Comprar' },
  { id: 'imoveis', label: 'Alugar' },
  { id: 'noticias', label: 'Giro do Mercado' },
  { id: 'corretores', label: 'Sou corretor' },
];

export function HomeHeader() {
  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <header className="sticky top-0 z-50 bg-[hsl(var(--v2-navy))]">
      <div className="mx-auto max-w-[1440px] px-5 lg:px-16 h-[72px] md:h-[88px] flex items-center justify-between gap-4">
        <Link to="/validacao" aria-label="Conectaê Imob" className="shrink-0">
          <img src={logoWhite} alt="Conectaê Imob" className="h-8 md:h-9 w-auto object-contain" />
        </Link>

        <nav className="hidden lg:flex items-center gap-7">
          {NAV.map((n) => (
            <button
              key={n.label}
              onClick={() => go(n.id)}
              className="text-sm font-semibold text-[hsl(var(--v2-on-dark))] hover:text-white transition-colors"
            >
              {n.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2 md:gap-3">
          <Link
            to="/auth"
            className="hidden sm:inline-flex items-center rounded-full px-4 py-2 text-sm font-bold text-white/90 hover:text-white transition-colors"
          >
            Entrar
          </Link>
          <Link
            to="/cadastro"
            className="inline-flex items-center rounded-full bg-[hsl(var(--v2-mint))] px-5 py-2.5 text-sm font-bold text-[hsl(var(--v2-navy))] hover:brightness-105 transition"
          >
            Anunciar grátis
          </Link>
        </div>
      </div>
    </header>
  );
}
