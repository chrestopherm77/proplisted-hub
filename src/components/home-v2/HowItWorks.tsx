const CLIENT = [
  { t: 'Busque o imóvel', d: 'Filtre por cidade, tipo e valor no portal da Conectae.' },
  { t: 'Demonstre interesse', d: 'Deixe seu nome e telefone no imóvel que gostou.' },
  { t: 'Um corretor te chama', d: 'O corretor responsável pelo anúncio entra em contato com você.' },
];

const BROKER = [
  { t: 'Crie sua conta', d: 'Cadastro gratuito com CRECI ativo, em poucos minutos.' },
  { t: 'Publique seus imóveis', d: 'Seu portfólio no portal e no seu site personalizado.' },
  { t: 'Receba leads e feche', d: 'Atenda contatos qualificados e use as ferramentas da plataforma.' },
];

function Step({ i, t, d, dark }: { i: number; t: string; d: string; dark?: boolean }) {
  return (
    <li className="flex gap-4">
      <span
        className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full font-display text-sm font-bold text-white"
        style={{ background: 'var(--v2-gradient-badge)' }}
      >
        {i}
      </span>
      <div>
        <h4 className={`font-display text-[15px] font-bold ${dark ? 'text-white' : 'text-[hsl(var(--v2-ink))]'}`}>
          {t}
        </h4>
        <p className={`mt-1 text-sm ${dark ? 'text-[hsl(var(--v2-on-dark))]' : 'text-[hsl(var(--v2-body))]'}`}>{d}</p>
      </div>
    </li>
  );
}

export function HowItWorks() {
  return (
    <section className="bg-[hsl(var(--v2-bg-1))] py-20">
      <div className="mx-auto max-w-[1440px] px-5 lg:px-16">
        <h2 className="text-center font-display text-[28px] md:text-[38px] font-extrabold text-[hsl(var(--v2-ink))]">
          Dos dois lados da negociação, sem burocracia.
        </h2>

        <div className="mt-10 grid gap-7 lg:grid-cols-2">
          <div className="rounded-[24px] bg-[hsl(var(--v2-bg-2))] p-8">
            <h3 className="font-display text-xl font-bold text-[hsl(var(--v2-ink))]">
              Quero comprar ou alugar
            </h3>
            <ul className="mt-6 space-y-6">
              {CLIENT.map((s, i) => (
                <Step key={s.t} i={i + 1} t={s.t} d={s.d} />
              ))}
            </ul>
          </div>

          <div className="v2-dark rounded-[24px] p-8">
            <h3 className="font-display text-xl font-bold text-white">Sou corretor</h3>
            <ul className="mt-6 space-y-6">
              {BROKER.map((s, i) => (
                <Step key={s.t} i={i + 1} t={s.t} d={s.d} dark />
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
