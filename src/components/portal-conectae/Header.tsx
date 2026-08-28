import { Heart } from 'lucide-react';
import logo from '@/assets/conectae-logo.png';

export function Header({ onNav, currentSection }: { onNav: (s: string) => void; currentSection: string }) {
  const items = [
    { id: 'home', label: 'Início' },
    { id: 'imoveis', label: 'Imóveis' },
    { id: 'sobre', label: 'Sobre' },
  ];
  return (
    <header className="relative z-30 bg-[var(--pc-bg)] text-[var(--pc-fg)]">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
        <button onClick={() => onNav('home')} aria-label="Portal Conectaê">
          <img src={logo} alt="Portal Conectaê" className="h-10 w-auto" />
        </button>

        <nav className="flex items-center gap-1 flex-wrap">
          {items.map((it) => {
            const active = currentSection === it.id;
            return (
              <button
                key={it.id}
                onClick={() => onNav(it.id)}
                className={`px-3 py-2 text-sm uppercase tracking-wider transition-colors ${active ? 'bg-[var(--pc-accent)] text-black font-semibold' : 'hover:text-[var(--pc-accent)]'}`}
              >
                {it.label}
              </button>
            );
          })}
          <button onClick={() => onNav('favoritos')} className="ml-2 flex items-center gap-1 text-sm uppercase tracking-wider hover:text-[var(--pc-accent)]">
            <Heart className="h-4 w-4 text-red-500" /> Favoritos
          </button>
        </nav>
      </div>
      <div className="pointer-events-none absolute left-0 right-0 top-full h-24 bg-gradient-to-b from-[var(--pc-bg)] via-[var(--pc-bg)]/60 to-transparent" />
    </header>
  );
}
