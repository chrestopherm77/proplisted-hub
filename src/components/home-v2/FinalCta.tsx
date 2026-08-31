import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function FinalCta() {
  return (
    <section className="py-16 bg-primary/5 border-y">
      <div className="container mx-auto px-4 grid md:grid-cols-2 gap-6">
        <div className="bg-card border rounded-xl p-8 text-center">
          <h3 className="text-xl md:text-2xl font-bold">Procurando um imóvel?</h3>
          <p className="text-muted-foreground text-sm mt-2">
            Veja os anúncios dos nossos corretores parceiros e fale com quem conhece a região.
          </p>
          <Button
            size="lg"
            className="mt-6"
            onClick={() => document.getElementById('imoveis')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Ver imóveis
          </Button>
        </div>
        <div className="bg-foreground text-background rounded-xl p-8 text-center">
          <h3 className="text-xl md:text-2xl font-bold">É corretor?</h3>
          <p className="text-sm mt-2 opacity-80">
            Publique seus imóveis, receba leads qualificados e use as ferramentas da Conectaê.
          </p>
          <Button asChild size="lg" className="mt-6">
            <Link to="/corretor">Quero ser parceiro</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
