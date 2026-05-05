import { useEffect, useRef, useState } from 'react';
import * as LucideIcons from 'lucide-react';
import {
  Instagram, Linkedin, Youtube, Facebook,
  ArrowRight, Sparkles, Check, Star, Shield, Zap, CheckCircle, Loader2, X,
} from 'lucide-react';
import whatsappIcon from '@/assets/whatsapp-icon.png';
import { normalizePhoneToWa } from '@/lib/whatsapp';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { LPContent, LPCTAForm, LPPlan, LPTheme } from '@/components/admin/landing-page/types';

interface Props {
  theme: LPTheme;
  content: LPContent;
}

function getIcon(name: string) {
  const I = (LucideIcons as Record<string, unknown>)[name] as React.ComponentType<{ className?: string }>;
  return I || LucideIcons.CircleDot;
}

export function LandingPageRenderer({ theme, content }: Props) {
  const plansRef = useRef<HTMLDivElement>(null);
  const finalCtaRef = useRef<HTMLDivElement>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [floatingClosed, setFloatingClosed] = useState(false);

  const scrollToPlans = () =>
    plansRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const ctaForm = content.cta_form;
  const openForm = () => {
    if (ctaForm && ctaForm.fields?.length) setFormOpen(true);
    else finalCtaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // Helper para CTA: link/form/scroll
  const handleCta = (mode: 'link' | 'form' | 'scroll_plans' | undefined, url: string | undefined) => {
    if (mode === 'form') return openForm();
    if (mode === 'scroll_plans') return scrollToPlans();
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
    else openForm();
  };

  const c = content;
  const floating = c.floating_cta;

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* ===== Header ===== */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border/60">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          {c.header.logo_url ? (
            <img
              src={c.header.logo_url}
              alt={c.header.brand_name}
              className="h-14 md:h-16 max-w-[220px] object-contain"
            />
          ) : (
            <span className="text-xl font-bold text-primary">{c.header.brand_name}</span>
          )}
          <div className="flex items-center gap-2">
            {c.header.show_login_button && (
              <Button
                variant="ghost"
                size="sm"
                className="md:size-default"
                onClick={() =>
                  c.header.login_url
                    ? window.open(c.header.login_url, '_blank', 'noopener,noreferrer')
                    : openForm()
                }
              >
                {c.header.login_label}
              </Button>
            )}
            <Button
              size="sm"
              className="md:size-default shadow-lg shadow-primary/20"
              onClick={() => handleCta(c.header.signup_mode, c.header.signup_url)}
            >
              {c.header.signup_label}
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* ===== Hero ===== */}
        <section className="relative overflow-hidden">
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
              <Badge className="mb-6 px-4 py-1.5 text-xs font-medium bg-brand-green text-brand-green-foreground border-transparent shadow-lg shadow-brand-green/30 hover:bg-brand-green/90 animate-fade-in-up">
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
              <Button
                size="lg"
                onClick={() => handleCta(c.hero.cta_primary_mode, c.hero.cta_primary_url)}
                className="text-base px-8 h-12 shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 transition-shadow"
              >
                {c.hero.cta_primary_label}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              {c.hero.cta_secondary_label && (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() =>
                    handleCta(
                      c.hero.cta_secondary_mode === 'form'
                        ? 'form'
                        : c.hero.cta_secondary_mode === 'link'
                        ? 'link'
                        : 'scroll_plans',
                      c.hero.cta_secondary_url,
                    )
                  }
                  className="text-base px-8 h-12 backdrop-blur-sm bg-background/60"
                >
                  {c.hero.cta_secondary_label}
                </Button>
              )}
            </div>

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
              const Icon = getIcon(f.icon);
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

          {/* Extras */}
          {c.extras.length > 0 && (
            <div className="grid md:grid-cols-2 gap-5 mt-8">
              {c.extras.map((extra, i) => {
                const Icon = getIcon(extra.icon);
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
          )}
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
                const Icon = getIcon(stat.icon);
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
          ref={plansRef}
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
              {c.plans_section.plans.map((plan: LPPlan, idx) => {
                const popular = plan.highlight === 'popular';
                const premium = plan.highlight === 'premium';
                return (
                  <div
                    key={idx}
                    className={`relative flex flex-col rounded-2xl border bg-card p-6 transition-all hover:-translate-y-1 ${
                      popular
                        ? 'border-primary border-2 shadow-2xl shadow-primary/20 scale-[1.02] bg-gradient-to-b from-primary/5 to-card'
                        : premium
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
                      {plan.credits && (
                        <div className="mt-2 text-sm text-primary font-medium">{plan.credits}</div>
                      )}
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
                      onClick={() => handleCta(plan.cta_mode, plan.cta_url)}
                    >
                      {plan.cta_label}
                    </Button>
                  </div>
                );
              })}
            </div>

            {c.plans_section.footer_note && (
              <p className="text-center text-xs text-muted-foreground mt-8">
                {c.plans_section.footer_note}
              </p>
            )}
          </div>
        </section>

        {/* ===== CTA Final ===== */}
        <section ref={finalCtaRef} className="container mx-auto px-4 py-16 md:py-20 scroll-mt-20">
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
                onClick={() => handleCta(c.final_cta.cta_mode, c.final_cta.cta_url)}
                className="text-base px-8 h-12 bg-white text-primary hover:bg-white/90 shadow-2xl ring-4 ring-white/20"
              >
                {c.final_cta.cta_label}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              {c.final_cta.secondary_text && (
                <div className="mt-5">
                  <button
                    onClick={() =>
                      c.final_cta.secondary_url
                        ? window.open(c.final_cta.secondary_url, '_blank', 'noopener,noreferrer')
                        : openForm()
                    }
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
            <div className="flex flex-col md:flex-row items-center gap-3 text-center md:text-left">
              {c.header.logo_url ? (
                <img src={c.header.logo_url} alt={c.footer.company_name} className="h-10 max-w-[160px] object-contain opacity-80" />
              ) : null}
              <div>
                <p className="text-sm font-semibold">{c.footer.company_name}</p>
                {c.footer.cnpj && (
                  <p className="text-xs text-muted-foreground">CNPJ: {c.footer.cnpj}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  © {new Date().getFullYear()} · {c.footer.rights_text}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {c.socials.instagram && (
                <a href={c.socials.instagram} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {c.socials.linkedin && (
                <a href={c.socials.linkedin} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                  <Linkedin className="h-5 w-5" />
                </a>
              )}
              {c.socials.youtube && (
                <a href={c.socials.youtube} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                  <Youtube className="h-5 w-5" />
                </a>
              )}
              {c.socials.facebook && (
                <a href={c.socials.facebook} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                  <Facebook className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>
        </footer>
      </main>

      {/* Floating CTA */}
      {floating?.enabled && floating.label && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
          <Button
            size="lg"
            className="shadow-2xl"
            onClick={() => handleCta(floating.mode, floating.url)}
          >
            {floating.label}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}

      {ctaForm && (
        <LeadFormModal
          open={formOpen}
          onOpenChange={setFormOpen}
          form={ctaForm}
          theme={theme}
          sourceLp={c.header.brand_name}
        />
      )}
    </div>
  );
}

// ====== Lead Form Modal ======
interface LeadFormModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  form: LPCTAForm;
  theme: LPTheme;
  sourceLp?: string;
}

function LeadFormModal({ open, onOpenChange, form, sourceLp }: LeadFormModalProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const setField = (id: string, v: string) => setValues((p) => ({ ...p, [id]: v }));

  const validateField = (field: typeof form.fields[number], value: string): string | null => {
    const v = (value || '').trim();
    if (field.required && !v) return `${field.label} é obrigatório`;
    if (!v) return null;
    if (v.length > 200) return `${field.label} muito longo`;
    if (field.type === 'email') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'E-mail inválido';
    }
    if (field.type === 'phone') {
      const digits = v.replace(/\D/g, '');
      if (digits.length < 10 || digits.length > 15) return 'Telefone inválido';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    for (const f of form.fields) {
      const err = validateField(f, values[f.id] || '');
      if (err) { toast.error(err); return; }
    }

    setSubmitting(true);
    try {
      const findByType = (t: 'text' | 'phone' | 'email') => {
        const f = form.fields.find((ff) => ff.type === t);
        return f ? (values[f.id] || '').trim() : '';
      };
      const name = findByType('text') || values['name'] || 'Lead LP';
      const phone = findByType('phone') || values['phone'] || '';
      const email = findByType('email') || values['email'] || null;

      const formDataPayload: Record<string, string> = {};
      for (const f of form.fields) {
        formDataPayload[f.label] = (values[f.id] || '').trim();
      }
      formDataPayload['source_lp'] = sourceLp || '';

      const { error } = await supabase.from('lead_submissions').insert({
        name: name.slice(0, 200),
        phone: phone.slice(0, 30),
        email: email ? email.slice(0, 200) : null,
        intention: 'BUY',
        form_data: formDataPayload,
        status: 'PENDING',
      });
      if (error) throw error;

      try { (window as unknown as { fbq?: (...a: unknown[]) => void }).fbq?.('track', 'Lead'); } catch { /* noop */ }

      setSuccess(true);

      if (form.redirect_url) {
        try {
          const url = new URL(form.redirect_url);
          if (url.protocol === 'http:' || url.protocol === 'https:') {
            setTimeout(() => window.open(url.toString(), '_blank', 'noopener,noreferrer'), 600);
          }
        } catch {
          toast.error('Link de redirecionamento inválido');
        }
      }
    } catch (err: unknown) {
      toast.error((err as Error)?.message || 'Erro ao enviar. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenChange = (v: boolean) => {
    onOpenChange(v);
    if (!v) {
      setTimeout(() => { setSuccess(false); setValues({}); }, 200);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        {success ? (
          <div className="text-center py-6">
            <CheckCircle className="h-14 w-14 mx-auto mb-3 text-emerald-500" />
            <DialogTitle className="text-xl mb-2">Cadastro realizado!</DialogTitle>
            <DialogDescription>
              {form.redirect_url
                ? 'Redirecionando você agora...'
                : 'Recebemos seus dados. Em breve entraremos em contato.'}
            </DialogDescription>
            {form.redirect_url && (
              <Button
                className="mt-4"
                onClick={() => window.open(form.redirect_url, '_blank', 'noopener,noreferrer')}
              >
                Abrir link
              </Button>
            )}
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Cadastro</DialogTitle>
              {form.intro_text && <DialogDescription>{form.intro_text}</DialogDescription>}
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3 mt-2">
              {form.fields.map((f) => (
                <div key={f.id}>
                  <Label htmlFor={`lp-f-${f.id}`}>
                    {f.label}{f.required && <span className="text-destructive ml-0.5">*</span>}
                  </Label>
                  <Input
                    id={`lp-f-${f.id}`}
                    type={f.type === 'email' ? 'email' : f.type === 'phone' ? 'tel' : 'text'}
                    inputMode={f.type === 'phone' ? 'tel' : undefined}
                    required={f.required}
                    maxLength={200}
                    value={values[f.id] || ''}
                    onChange={(e) => setField(f.id, e.target.value)}
                  />
                </div>
              ))}
              <Button
                type="submit"
                disabled={submitting}
                className="w-full"
                size="lg"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (form.submit_label || 'Enviar')}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
