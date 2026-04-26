import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePartner } from '@/contexts/PartnerContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Sparkles, Check } from 'lucide-react';
import FakeNotification from '@/components/FakeNotification';
import { BrandLogo } from '@/components/BrandLogo';
import leadbayLogo from '@/assets/leadbay-logo.png';
import { useHomeContent } from '@/hooks/useHomeContent';
import { useHomeContentOverride } from '@/components/admin/home-page/HomeContentContext';
import { getLucideIcon } from '@/components/admin/shared/IconPicker';
import type { HomePlan } from '@/components/admin/home-page/types';

const Index = () => {
  const { user, loading } = useAuth();
  const { partner, isPartnerSite, loading: partnerLoading } = usePartner();
  const navigate = useNavigate();

  // Conteúdo: prioridade para preview do admin (override) > hook do banco
  const override = useHomeContentOverride();
  const { content, loading: contentLoading } = useHomeContent();
  const c = override ?? content;

  // White-label segue exibindo a marca do parceiro
  const isWhiteLabel = isPartnerSite && !!partner;
  const partnerLogo = partner?.logo_url ?? leadbayLogo;
  const brandName = isWhiteLabel ? partner!.name : 'Conectaae Imob';

  useEffect(() => {
    if (!loading && user && !override) navigate('/leads');
  }, [user, loading, navigate, override]);

  // SEO básico
  useEffect(() => {
    if (!isWhiteLabel && !override) {
      document.title = 'Conectaae Imob — O hub completo do corretor de imóveis';
    }
  }, [isWhiteLabel, override]);

  if ((loading || partnerLoading || contentLoading) && !override) {
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
  const scrollToFinalCta = () => {
    const el = document.getElementById('cta-final');
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  // CTA dos cards de plano: leva para /auth (cadastro) já carregando o plano
  // escolhido. Slugs travados — alimentam o checkout automático.
  const handlePlanSelect = (slug: HomePlan['slug']) => {
    import('@/lib/pendingPlan').then(({ setPendingPlan }) => setPendingPlan(slug));
    if (user) {
      navigate(`/planos?plan=${slug}`);
    } else {
      navigate(`/auth?plan=${slug}`);
    }
  };

  // Posicionamento "popular" / "highlight" mantém o destaque visual original
  // baseado no slug (Performance = popular, Elite = highlight).
  const isPopular = (slug: string) => slug === 'performance';
  const isHighlight = (slug: string) => slug === 'elite';

  return (
    <div className="min-h-screen bg-background">
      {/* ===== Header ===== */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          {isWhiteLabel ? (
            <img src={partnerLogo} alt={brandName} className="h-10 max-w-[180px] object-contain" />
          ) : c.header.brand_logo_url ? (
            <img src={c.header.brand_logo_url} alt={brandName} className="h-10 max-w-[180px] object-contain" />
          ) : (
            <BrandLogo size="md" />
          )}
          <div className="flex items-center gap-2">
            {c.header.show_login_button && (
              <Button variant="ghost" size="sm" onClick={() => navigate('/auth?mode=login')} className="md:size-default">
                {c.header.login_label}
              </Button>
            )}
            <Button onClick={goAuth} size="sm" className="md:size-default">
              {c.header.signup_label}
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* ===== Hero ===== */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary-light via-background to-background">
          <div className="container mx-auto px-4 py-14 md:py-24 text-center">
            {c.hero.badge_text && (
              <Badge variant="secondary" className="mb-5 px-3 py-1 text-xs font-medium">
                {c.hero.badge_text}
              </Badge>
            )}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-5">
              {c.hero.title_line1} <br className="hidden md:block" />
              <span className="text-primary">{c.hero.title_line2}</span>
            </h1>
            <p className="text-base md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed px-2">
              {c.hero.subtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center px-4">
              <Button size="lg" onClick={goAuth} className="text-base px-8 h-12">
                {c.hero.cta_primary_label}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={scrollToPlans} className="text-base px-8 h-12">
                {c.hero.cta_secondary_label}
              </Button>
            </div>
          </div>
        </section>

        {/* ===== Funcionalidades ===== */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="text-center max-w-2xl mx-auto mb-12">
            {c.features_section.badge && (
              <Badge variant="outline" className="mb-3">{c.features_section.badge}</Badge>
            )}
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {c.features_section.title}
            </h2>
            <p className="text-muted-foreground">{c.features_section.subtitle}</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {c.features_section.items.map((f, i) => {
              const Icon = getLucideIcon(f.icon);
              return (
                <Card
                  key={i}
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
            {c.extras.map((extra, i) => {
              const Icon = getLucideIcon(extra.icon);
              return (
                <Card key={i} className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
                  <CardContent className="p-6 flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-1">{extra.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{extra.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* ===== Como funciona ===== */}
        <section className="bg-muted/40 py-16 md:py-20 border-y border-border">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-3">{c.how_it_works.title}</h2>
              <p className="text-muted-foreground">{c.how_it_works.subtitle}</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {c.how_it_works.steps.map((s, idx) => (
                <div key={idx} className="text-center">
                  <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-primary-foreground text-xl font-bold shadow-lg shadow-primary/20">
                    {idx + 1}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== Stats ===== */}
        <section className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center max-w-4xl mx-auto">
            {c.stats.items.map((stat, i) => {
              const Icon = getLucideIcon(stat.icon);
              return (
                <div key={i} className="p-6">
                  <Icon className="h-10 w-10 text-primary mx-auto mb-3" />
                  <div className="text-4xl font-bold text-primary mb-1">{stat.value}</div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ===== Planos ===== */}
        <section id="planos" className="bg-gradient-to-b from-primary-light/40 to-background py-16 md:py-24 scroll-mt-20">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-12">
              {c.plans_section.badge && (
                <Badge variant="outline" className="mb-3">{c.plans_section.badge}</Badge>
              )}
              <h2 className="text-3xl md:text-4xl font-bold mb-3">{c.plans_section.title}</h2>
              <p className="text-muted-foreground">{c.plans_section.subtitle}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-7xl mx-auto">
              {c.plans_section.plans.map((plan) => {
                const popular = isPopular(plan.slug);
                const highlight = isHighlight(plan.slug);
                return (
                  <div
                    key={plan.slug}
                    className={`relative flex flex-col rounded-xl border bg-card p-6 transition-all ${
                      popular
                        ? 'border-primary border-2 shadow-xl shadow-primary/15 scale-[1.02]'
                        : highlight
                        ? 'border-foreground/30'
                        : 'border-border hover:border-primary/30'
                    }`}
                  >
                    {popular && (
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
                      variant={popular ? 'default' : 'outline'}
                      onClick={() => handlePlanSelect(plan.slug)}
                    >
                      {plan.cta}
                    </Button>
                  </div>
                );
              })}
            </div>

            <p className="text-center text-xs text-muted-foreground mt-8">
              {c.plans_section.footer_note}
            </p>
          </div>
        </section>

        {/* ===== CTA Final ===== */}
        <section id="cta-final" className="container mx-auto px-4 py-16 md:py-20 scroll-mt-20">
          <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-10 md:p-14 text-center text-primary-foreground shadow-2xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{c.final_cta.title}</h2>
            <p className="text-base md:text-lg opacity-90 mb-8 max-w-2xl mx-auto">
              {c.final_cta.subtitle}
            </p>
            <Button
              size="lg"
              variant="secondary"
              onClick={goAuth}
              className="text-base px-8 h-12 bg-white text-primary hover:bg-white/90"
            >
              {c.final_cta.cta_label}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            {c.final_cta.secondary_text && (
              <div className="mt-5">
                <button
                  onClick={() => navigate('/auth?mode=login')}
                  className="text-sm underline opacity-90 hover:opacity-100"
                >
                  {c.final_cta.secondary_text}
                </button>
              </div>
            )}
          </div>
        </section>
      </main>

      <FakeNotification />
    </div>
  );
};

export default Index;
