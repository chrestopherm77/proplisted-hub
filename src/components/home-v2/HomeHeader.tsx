import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import logoAsset from '@/assets/conectae-logo-branco.png.asset.json';
import conectaeLogo from '@/assets/conectae-logo.png';

const logoWhite = logoAsset.url;

const NAV = [
  { id: 'imoveis', label: 'Imóveis' },
  { id: 'corretores', label: 'Para corretores' },
  { id: 'noticias', label: 'Notícias' },
];

export function HomeHeader() {
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-colors duration-300 ${
        solid ? 'bg-background/95 backdrop-blur border-b shadow-sm' : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link to="/validacao" aria-label="Conectaê Imob">
          <img src={solid ? conectaeLogo : logoWhite} alt="Conectaê Imob" className="h-9 w-auto object-contain" />
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => go(n.id)}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                solid ? 'text-foreground hover:text-primary' : 'text-white/90 hover:text-white'
              }`}
            >
              {n.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            asChild
            variant={solid ? 'outline' : 'secondary'}
            size="sm"
            className={solid ? '' : 'bg-white/15 text-white border-white/30 hover:bg-white/25'}
          >
            <Link to="/corretor">Sou corretor</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/auth">Entrar</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
