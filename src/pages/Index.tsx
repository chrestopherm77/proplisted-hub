import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePartner } from '@/contexts/PartnerContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  Target,
  Handshake,
  Building2,
  Home,
  Banknote,
  Sparkles,
  Calculator,
  Bot,
  Newspaper,
  GraduationCap,
  Scale,
  Check,
  Users,
  Clock,
  TrendingUp,
} from 'lucide-react';
import FakeNotification from '@/components/FakeNotification';
import { BrandLogo } from '@/components/BrandLogo';
import leadbayLogo from '@/assets/leadbay-logo.png';

// ----- Dados das funcionalidades principais (9) -----
const FEATURES = [
  {
    icon: Target,
    title: 'Leads Disponíveis',
    desc: 'Compre leads de clientes prontos para fechar. Pague só pelo lead que escolher.',
  },
  {
    icon: Handshake,
    title: 'Balcão de Parcerias',
    desc: 'Tem cliente sem imóvel? Publique e encontre o corretor que tem o match perfeito.',
  },
  {
    icon: Building2,
    title: 'Lançamentos',
    desc: 'Acesso direto aos lançamentos das construtoras parceiras para você vender.',
  },
  {
    icon: Home,
    title: 'Portal de Imóveis',
    desc: 'Publique seus imóveis e deixe outros corretores se afiliarem para vender em parceria.',
  },
  {
    icon: Banknote,
    title: 'Financiamento',
    desc: 'Suporte completo no financiamento dos seus clientes do início ao fim.',
  },
  {
    icon: Sparkles,
    title: 'Criativos com IA',
    desc: 'Gere criativos profissionais para suas redes sociais em segundos com IA.',
  },
  {
    icon: Calculator,
    title: 'Calculadora de Emolumentos',
    desc: 'Calcule emolumentos por estado com precisão antes de fechar negócio.',
  },
  {
    icon: Bot,
    title: 'IA de Atendimento',
    desc: 'Sua IA exclusiva para atender clientes 24/7 sem perder uma oportunidade.',
  },
  {
    icon: Newspaper,
    title: 'Notícias do Mercado',
    desc: 'Fique por dentro das tendências e dados do mercado imobiliário diariamente.',
  },
];

// ----- Planos exibidos na LP -----
type Plan = {
  slug: string;
  name: string;
  price: string;
  priceSuffix?: string;
  credits: string;
  popular?: boolean;
  highlight?: boolean;
  cta: string;
  features: string[];
};

const PLANS: Plan[] = [
  {
    slug: 'conexao',
    name: 'Conexão',
    price: 'Grátis',
    credits: '10 créditos/mês',
    cta: 'Começar grátis',
    features: [
      '1 solicitação de parceria',
      'Até 5 ofertas de parceria',
      'Até 3 imóveis no portal',
      'Acesso full a lançamentos',
      'Acesso full a financiamentos',
      '1 criativo imobiliário',
      'Treinamentos básicos',
    ],
  },
  {
    slug: 'essencial',
    name: 'Essencial',
    price: 'R$ 39,90',
    priceSuffix: '/mês',
    credits: '30 créditos/mês',
    cta: 'Assinar Essencial',
    features: [
      '5 solicitações de parceria',
      'Até 10 ofertas de parceria',
      'Até 10 imóveis no portal',
      'Acesso full a lançamentos',
      'Acesso full a financiamentos',
      '3 criativos imobiliários',
      'Treinamentos básicos e intermediários',
    ],
  },
  {
    slug: 'performance',
    name: 'Performance',
    price: 'R$ 79,90',
    priceSuffix: '/mês',
    credits: '430 créditos/mês',
    popular: true,
    cta: 'Assinar Performance',
    features: [
      'Solicitações de parceria ilimitadas',
      'Ofertas de parceria ilimitadas',
      'Imóveis no portal ilimitados',
      'Acesso full a lançamentos',
      '15 criativos imobiliários',
      'Hot Seat 2x mês',
      '2 leads inclusos',
    ],
  },
  {
    slug: 'elite',
    name: 'Elite',
    price: 'R$ 149,90',
    priceSuffix: '/mês',
    credits: '1.000 créditos/mês',
    highlight: true,
    cta: 'Assinar Elite',
    features: [
      'Tudo do Performance, e mais:',
      'Imóveis no portal ilimitados',
      '30 criativos imobiliários',
      'Treinamentos básicos e intermediários',
      'Hot Seat 2x mês',
      '5 leads inclusos',
      'Suporte prioritário',
    ],
  },
];

const Index = () => {
  const { user, loading } = useAuth();
  const { partner, isPartnerSite, loading: partnerLoading } = usePartner();
  const navigate = useNavigate();

  // Para sites de parceiros (white-label) seguimos exibindo a marca do parceiro.
  const isWhiteLabel = isPartnerSite && !!partner;
  const partnerLogo = partner?.logo_url ?? leadbayLogo;
  const brandName = isWhiteLabel ? partner!.name : 'Conectaae Imob';

  useEffect(() => {
    if (!loading && user) navigate('/leads');
  }, [user, loading, navigate]);

  // SEO básico
  useEffect(() => {
    if (!isWhiteLabel) {
      document.title = 'Conectaae Imob — O hub completo do corretor de imóveis';
    }
  }, [isWhiteLabel]);

  if (loading || partnerLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Carregando...</div>
      </div>
    );
  }

  const goAuth = () => navigate('/auth');
  const scrollToPlans = () => {
    const el = document.getElementById('planos');
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  // CTA dos cards de plano: leva para /auth (cadastro) já carregando o plano escolhido,
  // que será aplicado automaticamente após o cadastro/verificação. Se já estiver logado,
  // pula direto para /planos abrindo o checkout do plano certo.
  const handlePlanSelect = (slug: string) => {
    import('@/lib/pendingPlan').then(({ setPendingPlan }) => setPendingPlan(slug));
    if (user) {
      navigate(`/planos?plan=${slug}`);
    } else {
      navigate(`/auth?plan=${slug}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ===== Header ===== */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          {isWhiteLabel ? (
            <img src={partnerLogo} alt={brandName} className="h-10 max-w-[180px] object-contain" />
          ) : (
            <BrandLogo size="md" />
          )}
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={goAuth} className="hidden sm:inline-flex">
              Entrar
            </Button>
            <Button onClick={goAuth} size="sm" className="md:size-default">
              Cadastre-se
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* ===== Hero ===== */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary-light via-background to-background">
          <div className="container mx-auto px-4 py-14 md:py-24 text-center">
            <Badge variant="secondary" className="mb-5 px-3 py-1 text-xs font-medium">
              ✨ Plano grátis disponível • Sem cartão de crédito
            </Badge>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-5">
              O hub completo do <br className="hidden md:block" />
              <span className="text-primary">corretor de imóveis moderno</span>
            </h1>
            <p className="text-base md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed px-2">
              Leads qualificados, parcerias, lançamentos, portal de imóveis, IA, criativos e muito mais —
              tudo em uma única plataforma feita para você vender mais.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center px-4">
              <Button size="lg" onClick={goAuth} className="text-base px-8 h-12">
                Começar grátis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={scrollToPlans} className="text-base px-8 h-12">
                Ver planos
              </Button>
            </div>
          </div>
        </section>

        {/* ===== Funcionalidades ===== */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge variant="outline" className="mb-3">Funcionalidades</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Tudo que você precisa para vender mais
            </h2>
            <p className="text-muted-foreground">
              9 ferramentas completas integradas + serviços extras para o corretor moderno operar com autonomia.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <Card
                  key={f.title}
                  className="group border-border hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5 transition-all"
                >
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Serviços extras */}
          <div className="grid md:grid-cols-2 gap-5 mt-6">
            <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
              <CardContent className="p-6 flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                  <GraduationCap className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">Educação Conectaae</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Treinamentos básicos, intermediários e Hot Seats com especialistas para você
                    evoluir no mercado imobiliário.
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
              <CardContent className="p-6 flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                  <Scale className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">Suporte Jurídico</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Serviços jurídicos sob demanda para você operar com segurança total em
                    contratos e negociações.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* ===== Como funciona ===== */}
        <section className="bg-muted/40 py-16 md:py-20 border-y border-border">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-3">Como funciona</h2>
              <p className="text-muted-foreground">3 passos simples para começar a fechar negócios hoje</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {[
                { n: 1, t: 'Cadastre-se grátis', d: 'Crie sua conta em menos de 1 minuto. Plano grátis disponível, sem cartão.' },
                { n: 2, t: 'Escolha seu plano', d: 'Selecione o plano ideal para o volume de negócios que você quer fechar.' },
                { n: 3, t: 'Use todas as ferramentas', d: 'Leads, parcerias, IA, criativos, lançamentos — tudo na palma da mão.' },
              ].map((s) => (
                <div key={s.n} className="text-center">
                  <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-primary-foreground text-xl font-bold shadow-lg shadow-primary/20">
                    {s.n}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{s.t}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== Stats ===== */}
        <section className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center max-w-4xl mx-auto">
            <div className="p-6">
              <Users className="h-10 w-10 text-primary mx-auto mb-3" />
              <div className="text-4xl font-bold text-primary mb-1">500+</div>
              <p className="text-sm text-muted-foreground">Corretores ativos</p>
            </div>
            <div className="p-6">
              <TrendingUp className="h-10 w-10 text-primary mx-auto mb-3" />
              <div className="text-4xl font-bold text-primary mb-1">2.000+</div>
              <p className="text-sm text-muted-foreground">Negócios viabilizados</p>
            </div>
            <div className="p-6">
              <Clock className="h-10 w-10 text-primary mx-auto mb-3" />
              <div className="text-4xl font-bold text-primary mb-1">24/7</div>
              <p className="text-sm text-muted-foreground">Suporte disponível</p>
            </div>
          </div>
        </section>

        {/* ===== Planos ===== */}
        <section id="planos" className="bg-gradient-to-b from-primary-light/40 to-background py-16 md:py-24 scroll-mt-20">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <Badge variant="outline" className="mb-3">Planos</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-3">Escolha seu plano</h2>
              <p className="text-muted-foreground">
                Mais créditos, mais funcionalidades, mais resultado. Cancele quando quiser.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-7xl mx-auto">
              {PLANS.map((plan) => (
                <div
                  key={plan.slug}
                  className={`relative flex flex-col rounded-xl border bg-card p-6 transition-all ${
                    plan.popular
                      ? 'border-primary border-2 shadow-xl shadow-primary/15 scale-[1.02]'
                      : plan.highlight
                      ? 'border-foreground/30'
                      : 'border-border hover:border-primary/30'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground gap-1 shadow-md">
                        <Sparkles className="h-3 w-3" />
                        Mais Popular
                      </Badge>
                    </div>
                  )}

                  <div className="text-center mb-5">
                    <h3 className="text-base font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline justify-center gap-1 min-h-[3rem]">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      {plan.priceSuffix && (
                        <span className="text-sm text-muted-foreground">{plan.priceSuffix}</span>
                      )}
                    </div>
                    <div className="mt-2 text-sm text-primary font-medium">{plan.credits}</div>
                  </div>

                  <ul className="space-y-2.5 flex-1 mb-5">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-foreground/90">{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full"
                    variant={plan.popular ? 'default' : 'outline'}
                    onClick={() => handlePlanSelect(plan.slug)}
                  >
                    {plan.cta}
                  </Button>
                </div>
              ))}
            </div>

            <p className="text-center text-xs text-muted-foreground mt-8">
              Cobrança mensal recorrente • Cancele quando quiser • Pagamento seguro via Asaas
            </p>
          </div>
        </section>

        {/* ===== CTA Final ===== */}
        <section className="container mx-auto px-4 py-16 md:py-20">
          <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-10 md:p-14 text-center text-primary-foreground shadow-2xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Pronto para vender mais imóveis?
            </h2>
            <p className="text-lg md:text-xl mb-8 opacity-95 max-w-2xl mx-auto">
              Junte-se a centenas de corretores que já estão fechando mais negócios com o {brandName}.
            </p>
            <Button
              size="lg"
              onClick={goAuth}
              variant="secondary"
              className="bg-white text-primary hover:bg-gray-100 text-base md:text-lg px-10 h-12 md:h-14"
            >
              Criar conta grátis
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </section>
      </main>

      {/* ===== Footer ===== */}
      <footer className="bg-card border-t border-border">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {isWhiteLabel ? (
              <img src={partnerLogo} alt={brandName} className="h-7 max-w-[140px] object-contain" />
            ) : (
              <BrandLogo size="sm" />
            )}
            <div className="text-sm text-muted-foreground text-center">
              © 2025 {brandName}. Todos os direitos reservados.
            </div>
          </div>
        </div>
      </footer>

      <FakeNotification />
    </div>
  );
};

export default Index;
