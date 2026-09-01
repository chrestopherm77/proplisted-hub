import { Link } from 'react-router-dom';
import { Sparkles, Target, Globe, Handshake } from 'lucide-react';

const FEATURES = [
  { icon: Target, title: 'Leads qualificados', desc: 'Contatos de quem realmente quer comprar, alugar ou vender.' },
  { icon: Globe, title: 'Portal e site personalizado', desc: 'Seus imóveis num portal nacional e no seu próprio site.' },
  { icon: Sparkles, title: 'Criativos com IA', desc: 'Artes para redes sociais geradas em segundos.' },
  { icon: Handshake, title: 'Parcerias e benefícios', desc: 'Parcerias, lançamentos e benefícios exclusivos.' },
];

export function ForBrokers() {
  return (
    <section id="corretores" className="v2-dark relative overflow-hidden py-20">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 top-10 h-[480px] w-[480px] rounded-full border border-white/10"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-20 bottom-0 h-[380px] w-[380px] rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, hsl(var(--v2-mint) / 0.25), transparent 65%)' }}
      />

      <div className="relative mx-auto max-w-[1440px] px-5 lg:px-16">
        <span className="v2-pill inline-flex items-center gap-2 rounded-full border border-[hsl(var(--v2-mint)/0.4)] bg-[hsl(var(--v2-mint)/0.14)] px-4 py-1.5 text-[11px] md:text-xs font-bold uppercase tracking-wide text-[hsl(var(--v2-mint))]">
          <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--v2-mint))]" />
          Para corretores
        </span>

        <h2 className="mt-6 max-w-3xl font-display text-[28px] md:text-[42px] font-extrabold leading-tight text-white">
          Do outro lado do anúncio, tem um corretor crescendo com a Conectae
        </h2>
        <p className="mt-4 max-w-2xl text-[15px] md:text-lg text-[hsl(var(--v2-on-dark))]">
          Mais de uma dezena de ferramentas em um só lugar para você captar, atender e fechar mais
          negócios — sem depender de indicação.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-[18px] border border-white/[0.14] bg-white/[0.08] p-6 backdrop-blur-sm"
            >
              <span
                className="mb-4 grid h-12 w-12 place-items-center rounded-[14px]"
                style={{ background: 'var(--v2-gradient-badge)' }}
              >
                <f.icon className="h-5 w-5 text-white" strokeWidth={2} />
              </span>
              <h3 className="font-display text-base font-semibold text-white">{f.title}</h3>
              <p className="mt-2 text-sm text-[hsl(var(--v2-on-dark))]">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            to="/cadastro"
            className="rounded-full bg-white px-7 py-4 text-[15px] font-bold text-[hsl(var(--v2-blue))] shadow-[var(--v2-shadow-btn)] hover:brightness-95 transition"
          >
            Quero ser parceiro
          </Link>
          <Link
            to="/planos"
            className="rounded-full border-[1.5px] border-white/50 px-7 py-4 text-[15px] font-bold text-white hover:bg-white/10 transition"
          >
            Ver planos
          </Link>
        </div>
        <p className="mt-4 text-sm text-[hsl(var(--v2-meta))]">
          Existe plano gratuito — comece sem pagar nada e evolua quando fizer sentido.
        </p>
      </div>
    </section>
  );
}
