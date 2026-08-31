import { Home, Briefcase } from 'lucide-react';

const BUYER = [
  { t: 'Busque o imóvel', d: 'Filtre por cidade, tipo e valor entre os anúncios dos nossos parceiros.' },
  { t: 'Demonstre interesse', d: 'Informe nome e telefone no imóvel que você gostou. Leva 10 segundos.' },
  { t: 'Um corretor te chama', d: 'O parceiro responsável pelo anúncio entra em contato para agendar a visita.' },
];

const BROKER = [
  { t: 'Crie sua conta', d: 'Cadastro rápido com validação de CRECI. Comece no plano gratuito.' },
  { t: 'Publique seus imóveis', d: 'Seus anúncios aparecem no portal para milhares de interessados.' },
  { t: 'Receba leads e feche', d: 'Atenda interessados, compre leads qualificados e acompanhe tudo no CRM.' },
];

export function HowItWorks() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center">Como funciona</h2>
        <p className="text-muted-foreground text-center mt-2">
          Dos dois lados da negociação, sem burocracia.
        </p>

        <div className="grid md:grid-cols-2 gap-6 mt-10">
          <Column icon={<Home className="h-5 w-5" />} title="Quero comprar ou alugar" steps={BUYER} />
          <Column icon={<Briefcase className="h-5 w-5" />} title="Sou corretor" steps={BROKER} />
        </div>
      </div>
    </section>
  );
}

function Column({
  icon,
  title,
  steps,
}: {
  icon: React.ReactNode;
  title: string;
  steps: { t: string; d: string }[];
}) {
  return (
    <div className="bg-card border rounded-xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <span className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          {icon}
        </span>
        <h3 className="font-semibold text-lg">{title}</h3>
      </div>
      <ol className="space-y-5">
        {steps.map((s, i) => (
          <li key={s.t} className="flex gap-4">
            <span className="h-8 w-8 shrink-0 rounded-full bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center">
              {i + 1}
            </span>
            <div>
              <p className="font-medium">{s.t}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{s.d}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
