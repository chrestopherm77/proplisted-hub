import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FAQ = [
  {
    q: 'É gratuito para quem está procurando imóvel?',
    a: 'Sim! Buscar imóveis, demonstrar interesse e falar com o corretor responsável é 100% gratuito para quem está procurando imóvel.',
  },
  {
    q: 'Quem vai me atender depois que eu demonstrar interesse?',
    a: 'O próprio corretor parceiro responsável pelo anúncio entra em contato com você. Seus dados não são distribuídos para outros corretores.',
  },
  {
    q: 'Como faço para anunciar o meu imóvel?',
    a: 'Se você é proprietário, fale com um corretor parceiro da Conectaê pelo portal — ele cuida da publicação e da negociação.',
  },
  {
    q: 'Sou corretor, como participo da plataforma?',
    a: 'Crie sua conta com CRECI ativo, publique seus imóveis e comece a receber leads e usar as ferramentas da plataforma.',
  },
  {
    q: 'Tem custo para o corretor?',
    a: 'Existe um plano gratuito para começar. Os planos pagos liberam mais créditos, criativos com IA e site personalizado — sem fidelidade contratual.',
  },
];

export function HomeFaq() {
  const [open, setOpen] = useState(0);

  return (
    <section className="bg-[hsl(var(--v2-bg-2))] py-20">
      <div className="mx-auto max-w-[900px] px-5 lg:px-16">
        <h2 className="text-center font-display text-[28px] md:text-[38px] font-extrabold text-[hsl(var(--v2-ink))]">
          Perguntas frequentes
        </h2>

        <div className="mt-10 space-y-4">
          {FAQ.map((f, i) => (
            <div key={f.q} className="rounded-[18px] bg-white shadow-[var(--v2-shadow-card)]">
              <button
                onClick={() => setOpen(open === i ? -1 : i)}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                aria-expanded={open === i}
              >
                <span className="font-display text-[15px] md:text-base font-bold text-[hsl(var(--v2-ink))]">
                  {f.q}
                </span>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-[hsl(var(--v2-blue))] transition-transform ${open === i ? 'rotate-180' : ''}`}
                  strokeWidth={2}
                />
              </button>
              {open === i && (
                <p className="px-6 pb-6 -mt-1 text-sm leading-relaxed text-[hsl(var(--v2-body))]">{f.a}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
