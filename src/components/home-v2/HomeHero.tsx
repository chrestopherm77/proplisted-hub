import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export function HomeHero() {
  return (
    <section className="v2-dark relative overflow-hidden">
      {/* decoração: anéis translúcidos + blob verde */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -right-32 h-[520px] w-[520px] rounded-full border border-white/10"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-56 h-[620px] w-[620px] rounded-full border border-white/[0.07]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -left-24 h-[420px] w-[420px] rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, hsl(var(--v2-mint) / 0.28), transparent 65%)' }}
      />

      <div className="relative mx-auto max-w-[1440px] px-5 lg:px-16 pt-20 pb-24">
        <div className="max-w-3xl">
          <span className="v2-pill inline-flex items-center gap-2 rounded-full border border-[hsl(var(--v2-mint)/0.4)] bg-[hsl(var(--v2-mint)/0.14)] px-4 py-1.5 text-[11px] md:text-xs font-bold uppercase tracking-wide text-[hsl(var(--v2-mint))]">
            <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--v2-mint))]" />
            Portal + ferramentas do corretor, num só lugar
          </span>

          <h1 className="mt-6 text-[34px] leading-[1.1] md:text-[50px] font-extrabold text-white">
            A solução para quem busca o{' '}
            <span className="text-[hsl(var(--v2-mint))]">imóvel ideal</span> — e para o corretor que
            deseja anunciar
          </h1>

          <p className="mt-5 max-w-2xl text-base md:text-lg text-[hsl(var(--v2-on-dark))]">
            Conectamos clientes ao corretor ideal, com tecnologia, transparência e um portfólio de
            imóveis selecionados em todo o Brasil. Seja para comprar, alugar ou vender, aqui você
            encontra quem entende do mercado.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={() => document.getElementById('imoveis')?.scrollIntoView({ behavior: 'smooth' })}
              className="rounded-full bg-white px-7 py-4 text-[15px] font-bold text-[hsl(var(--v2-blue))] shadow-[var(--v2-shadow-btn)] hover:brightness-95 transition"
            >
              Encontrar meu imóvel
            </button>
            <Link
              to="/corretor"
              className="rounded-full border-[1.5px] border-white/50 px-7 py-4 text-[15px] font-bold text-white hover:bg-white/10 transition"
            >
              Sou corretor
            </Link>
          </div>

          <Link
            to="/corretor"
            className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[hsl(var(--v2-mint))] hover:text-white transition"
          >
            É corretor? Anuncie seus imóveis grátis <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
          </Link>
        </div>
      </div>
    </section>
  );
}
