import { Link } from 'react-router-dom';

export function FinalCta() {
  return (
    <section className="bg-[hsl(var(--v2-bg-1))] pb-20">
      <div className="mx-auto max-w-[1440px] px-5 lg:px-16">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-[24px] bg-[hsl(var(--v2-bg-3))] p-10">
            <h3 className="font-display text-2xl font-extrabold text-[hsl(var(--v2-ink))]">
              Procurando um imóvel?
            </h3>
            <p className="mt-3 max-w-md text-[15px] text-[hsl(var(--v2-body))]">
              Veja os imóveis anunciados por corretores parceiros e fale com quem entende do bairro.
            </p>
            <button
              onClick={() => document.getElementById('imoveis')?.scrollIntoView({ behavior: 'smooth' })}
              className="mt-7 rounded-full bg-[hsl(var(--v2-blue))] px-7 py-4 text-[15px] font-bold text-white hover:brightness-110 transition"
            >
              Ver imóveis
            </button>
          </div>

          <div className="v2-dark rounded-[24px] p-10">
            <h3 className="font-display text-2xl font-extrabold text-white">É corretor?</h3>
            <p className="mt-3 max-w-md text-[15px] text-[hsl(var(--v2-on-dark))]">
              Anuncie grátis, receba leads qualificados e use as ferramentas da Conectae para vender mais.
            </p>
            <Link
              to="/cadastro"
              className="mt-7 inline-block rounded-full bg-white px-7 py-4 text-[15px] font-bold text-[hsl(var(--v2-blue))] shadow-[var(--v2-shadow-btn)] hover:brightness-95 transition"
            >
              Quero ser parceiro
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
