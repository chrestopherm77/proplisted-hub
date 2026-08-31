import { Link } from 'react-router-dom';
import { Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import dashboardMockup from '@/assets/dashboard-mockup.jpg';

const BULLETS = [
  'Leads qualificados de quem realmente quer comprar',
  'Portal e site personalizado para os seus imóveis',
  'Criativos para redes sociais com IA em segundos',
  'Parcerias, lançamentos e benefícios exclusivos',
];

export function ForBrokers() {
  return (
    <section id="corretores" className="py-20 bg-foreground text-background">
      <div className="container mx-auto px-4 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <span className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">
            Para corretores
          </span>
          <h2 className="text-2xl md:text-4xl font-bold mt-3 leading-tight">
            Do outro lado do anúncio, tem um corretor crescendo com a Conectaê
          </h2>
          <p className="mt-4 opacity-80">
            Mais de uma dezena de ferramentas em um só lugar para você captar, atender e fechar mais
            negócios — sem depender de indicação.
          </p>

          <ul className="mt-6 space-y-3">
            {BULLETS.map((b) => (
              <li key={b} className="flex items-start gap-3">
                <span className="mt-0.5 h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Check className="h-3.5 w-3.5 text-primary" />
                </span>
                <span className="text-sm md:text-base opacity-90">{b}</span>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap gap-3 mt-8">
            <Button asChild size="lg">
              <Link to="/corretor">
                Quero ser parceiro <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-transparent border-background/40 text-background hover:bg-background/10">
              <Link to="/planos">Ver planos</Link>
            </Button>
          </div>
        </div>

        <div className="rounded-xl overflow-hidden shadow-2xl ring-1 ring-background/10">
          <img
            src={dashboardMockup}
            alt="Painel da Conectaê Imob usado por corretores parceiros"
            loading="lazy"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </section>
  );
}
