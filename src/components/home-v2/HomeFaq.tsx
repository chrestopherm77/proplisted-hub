import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const ITEMS = [
  {
    q: 'É gratuito para quem está procurando imóvel?',
    a: 'Sim. Buscar imóveis e demonstrar interesse na Conectaê é totalmente gratuito para o cliente final.',
  },
  {
    q: 'Quem vai me atender depois que eu demonstrar interesse?',
    a: 'O corretor parceiro responsável pelo anúncio recebe seus dados e entra em contato diretamente com você.',
  },
  {
    q: 'Como faço para anunciar o meu imóvel?',
    a: 'Se você é proprietário, demonstre interesse em falar com um parceiro ou procure um corretor da plataforma: ele publica e cuida da divulgação do seu imóvel.',
  },
  {
    q: 'Sou corretor, como participo da plataforma?',
    a: 'Basta criar sua conta com CRECI válido. Você já começa publicando imóveis e recebendo oportunidades no plano gratuito.',
  },
  {
    q: 'Tem custo para o corretor?',
    a: 'Publicar imóveis é gratuito. Recursos avançados como leads qualificados, criativos com IA e site personalizado fazem parte dos planos pagos.',
  },
];

export function HomeFaq() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4 max-w-3xl">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Perguntas frequentes</h2>
        <Accordion type="single" collapsible className="w-full">
          {ITEMS.map((it, i) => (
            <AccordionItem key={it.q} value={`item-${i}`}>
              <AccordionTrigger className="text-left">{it.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{it.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
