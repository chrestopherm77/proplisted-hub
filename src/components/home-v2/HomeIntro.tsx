import { Link } from 'react-router-dom';
import { ArrowDown, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import conectaeLogo from '@/assets/conectae-logo.png';

export function HomeIntro() {
  const scrollToProperties = () =>
    document.getElementById('imoveis')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <section className="relative min-h-[520px] flex items-center justify-center bg-foreground text-background pt-24 pb-16 overflow-hidden">
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-primary blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10 text-center">
        <img
          src={conectaeLogo}
          alt="Conectaê Imob"
          className="h-16 md:h-20 w-auto mx-auto mb-8 brightness-0 invert"
        />

        <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold leading-tight max-w-4xl mx-auto">
          Conectaê: a solução para quem busca o imóvel ideal e para o corretor que deseja anunciar
        </h1>

        <p className="mt-6 text-base md:text-xl opacity-80 max-w-2xl mx-auto leading-relaxed">
          Conectamos clientes ao corretor ideal, com tecnologia, transparência e um portfólio
          de imóveis selecionados em todo o Brasil. Seja para comprar, alugar ou vender, aqui
          você encontra quem entende do mercado.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" onClick={scrollToProperties}>
            <ArrowDown className="h-4 w-4 mr-2" />
            Encontrar meu imóvel
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="bg-transparent border-background/40 text-background hover:bg-background/10"
          >
            <Link to="/corretor">
              Sou corretor <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
