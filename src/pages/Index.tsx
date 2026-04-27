import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePartner } from '@/contexts/PartnerContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Sparkles, Check, Star, Shield, Zap } from 'lucide-react';
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
    document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const handlePlanSelect = (slug: HomePlan['slug']) => {
    import('@/lib/pendingPlan').then(({ setPendingPlan }) => setPendingPlan(slug));
    if (user) navigate(`/planos?plan=${slug}`);
    else navigate(`/auth?plan=${slug}`);
  };

  const isPopular = (slug: string) => slug === 'performance';
  const isHighlight = (slug: string) => slug === 'elite';

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* ===== Header ===== */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border/60">
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
            <Button onClick={goAuth} size="sm" className="md:size-default shadow-lg shadow-primary/20">
              {c.header.signup_label}
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* ===== Hero ===== */}
        <section className="relative overflow-hidden">
          {/* Background layers */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-light/60 via-background to-background" />
          <div className="absolute inset-0 bg-grid-pattern mask-radial-fade opacity-60" />
          <div className="absolute -top-40 -left-32 w-[28rem] h-[28rem] rounded-full bg-primary/30 blur-3xl animate-float-slow" aria-hidden />
          <div
            className="absolute top-20 -right-32 w-[26rem] h-[26rem] rounded-full bg-secondary/25 blur-3xl animate-float-slow"
            style={{ animationDelay: '3s' }}
            aria-hidden
          />

          <div className="container mx-auto px-4 py-16 md:py-28 text-center relative">
            {c.hero.badge_text && (
              <Badge
                variant="secondary"
                className="mb-6 px-4 py-1.5 text-xs font-medium ring-glow-primary backdrop-blur-sm bg-background/70 animate-fade-in-up"
              >
                {c.hero.badge_text}
              </Badge>
            )}
            <h1
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] mb-6 tracking-tight animate-fade-in-up"
              style={{ animationDelay: '0.1s' }}
            >
              {c.hero.title_line1}
              <br className="hidden md:block" />{' '}
              <span className="text-gradient-primary">{c.hero.title_line2}</span>
            </h1>
            <p
              className="text-base md:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed px-2 animate-fade-in-up"
              style={{ animationDelay: '0.2s' }}
            >
              {c.hero.subtitle}
            </p>
            <div
              className="flex flex-col sm:flex-row gap-3 justify-center px-4 animate-fade-in-up"
              style={{ animationDelay: '0.3s' }}
            >
              <Button size="lg" onClick={goAuth} className="text-base px-8 h-12 shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 transition-shadow">
                {c.hero.cta_primary_label}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={scrollToPlans} className="text-base px-8 h-12 backdrop-blur-sm bg-background/60">
                {c.hero.cta_secondary_label}
              </Button>
            </div>

            {/* Trust row */}
            <div
              className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground animate-fade-in-up"
              style={{ animationDelay: '0.4s' }}
            >
              <span className="flex items-center gap-2"><Star className="h-4 w-4 text-accent fill-accent" /> Avaliação 4.9</span>
              <span className="flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Pagamento seguro</span>
              <span className="flex items-center gap-2"><Zap className="h-4 w-4 text-secondary" /> Sem cartão para começar</span>
            </div>
          </div>
        </section>

        {/* ===== Funcionalidades ===== */}
        <section className="container mx-auto px-4 py-16 md:py-24 relative">
          <div className="text-center max-w-2xl mx-auto mb-14">
            {c.features_section.badge && (
              <Badge variant="outline" className="mb-3 backdrop-blur-sm bg-primary/5 border-primary/30">
                {c.features_section.badge}
              </Badge>
            )}
            <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
              {c.features_section.title}
            </h2>
            <p className="text-muted-foreground text-base md:text-lg">{c.features_section.subtitle}</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {c.features_section.items.map((f, i) => {
              const Icon = getLucideIcon(f.icon);
              return (
                <div
                  key={i}
                  className="group relative rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-6 hover:border-primary/40 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300"
                >
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center mb-4 shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                      <Icon className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Serviços extras */}
          <div className="grid md:grid-cols-2 gap-5 mt-8">
            {c.extras.map((extra, i) => {
              const Icon = getLucideIcon(extra.icon);
              return (
                <div
                  key={i}
                  className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-6 hover:border-primary/50 transition-all"
                >
                  <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-primary/10 blur-3xl" />
                  <div className="relative flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
                      <Icon className="h-7 w-7 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="text-lg md:text-xl font-semibold mb-1">{extra.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{extra.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ===== Como funciona ===== */}
        <section className="relative bg-muted/40 py-20 border-y border-border overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern mask-radial-fade opacity-40" />
          <div className="container mx-auto px-4 relative">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-5xl font-bold mb-3 tracking-tight">{c.how_it_works.title}</h2>
              <p className="text-muted-foreground text-base md:text-lg">{c.how_it_works.subtitle}</p>
            </div>
            <div className="relative grid md:grid-cols-3 gap-10 max-w-5xl mx-auto">
              {/* linha conectora desktop */}
              <div className="hidden md:block absolute top-7 left-[16%] right-[16%] h-px border-t-2 border-dashed border-primary/30 pointer-events-none" />
              {c.how_it_works.steps.map((s, idx) => (
                <div key={idx} className="text-center relative">
                  <div className="w-14 h-14 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-5 text-primary-foreground text-xl font-bold shadow-xl shadow-primary/30 ring-4 ring-background relative z-10">
                    {idx + 1}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== Stats ===== */}
        <section className="container mx-auto px-4 py-16">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary-dark to-secondary-dark p-10 md:p-14 shadow-2xl shadow-primary/20">
            <div className="absolute inset-0 bg-dots-pattern opacity-30" />
            <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-secondary/30 blur-3xl animate-pulse-glow" />
            <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 text-center text-primary-foreground">
              {c.stats.items.map((stat, i) => {
                const Icon = getLucideIcon(stat.icon);
                return (
                  <div key={i} className="p-4">
                    <Icon className="h-10 w-10 mx-auto mb-3 opacity-90" />
                    <div className="text-4xl md:text-5xl font-bold mb-1 tracking-tight">{stat.value}</div>
                    <p className="text-sm opacity-85">{stat.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ===== Planos ===== */}
        <section
          id="planos"
          className="relative bg-gradient-to-b from-primary-light/40 to-background py-16 md:py-24 scroll-mt-20 overflow-hidden"
        >
          <div className="absolute inset-0 bg-grid-pattern mask-radial-fade opacity-30" />
          <div className="container mx-auto px-4 relative">
            <div className="text-center max-w-2xl mx-auto mb-14">
              {c.plans_section.badge && (
                <Badge variant="outline" className="mb-3 backdrop-blur-sm bg-background/60">
                  {c.plans_section.badge}
                </Badge>
              )}
              <h2 className="text-3xl md:text-5xl font-bold mb-3 tracking-tight">{c.plans_section.title}</h2>
              <p className="text-muted-foreground text-base md:text-lg">{c.plans_section.subtitle}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-7xl mx-auto">
              {c.plans_section.plans.map((plan) => {
                const popular = isPopular(plan.slug);
                const highlight = isHighlight(plan.slug);
                return (
                  <div
                    key={plan.slug}
                    className={`relative flex flex-col rounded-2xl border bg-card p-6 transition-all hover:-translate-y-1 ${
                      popular
                        ? 'border-primary border-2 shadow-2xl shadow-primary/20 scale-[1.02] bg-gradient-to-b from-primary/5 to-card'
                        : highlight
                        ? 'border-foreground/30 hover:border-foreground/50'
                        : 'border-border hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10'
                    }`}
                  >
                    {popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-gradient-primary text-primary-foreground gap-1 shadow-lg px-3">
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
                        <span className="text-4xl font-bold tracking-tight">{plan.price}</span>
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
                      className={`w-full ${popular ? 'shadow-lg shadow-primary/30' : ''}`}
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
          <div className="relative overflow-hidden bg-gradient-to-br from-primary via-secondary to-primary-dark rounded-3xl p-10 md:p-16 text-center text-primary-foreground shadow-2xl shadow-primary/30">
            <div className="absolute inset-0 bg-dots-pattern opacity-25" />
            <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-white/10 blur-3xl animate-pulse-glow" />
            <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-accent/20 blur-3xl animate-pulse-glow" style={{ animationDelay: '2s' }} />
            <div className="relative">
              <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">{c.final_cta.title}</h2>
              <p className="text-base md:text-lg opacity-90 mb-8 max-w-2xl mx-auto">
                {c.final_cta.subtitle}
              </p>
              <Button
                size="lg"
                variant="secondary"
                onClick={goAuth}
                className="text-base px-8 h-12 bg-white text-primary hover:bg-white/90 shadow-2xl ring-4 ring-white/20"
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
          </div>
        </section>

        {/* ===== Footer ===== */}
        <footer className="border-t border-border bg-muted/30">
          <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {isWhiteLabel ? (
                <img src={partnerLogo} alt={brandName} className="h-7 max-w-[140px] object-contain opacity-80" />
              ) : (
                <BrandLogo size="sm" />
              )}
              <span className="text-xs text-muted-foreground">© {new Date().getFullYear()} {brandName}. Todos os direitos reservados.</span>
            </div>
            <div className="flex items-center gap-5 text-xs text-muted-foreground">
              <a href="#planos" className="hover:text-primary transition-colors">Planos</a>
              <button onClick={() => navigate('/auth?mode=login')} className="hover:text-primary transition-colors">Entrar</button>
              <button onClick={goAuth} className="hover:text-primary transition-colors">Cadastrar</button>
            </div>
          </div>
        </footer>
      </main>

      <FakeNotification />
    </div>
  );
};

export default Index;
