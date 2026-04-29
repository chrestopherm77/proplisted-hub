import { useRef, useState } from 'react';
import * as LucideIcons from 'lucide-react';
import { Instagram, Linkedin, Youtube, Facebook, ArrowRight, Star, CheckCircle, Loader2 } from 'lucide-react';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { LPContent, LPCTAForm, LPCTAMode, LPSection, LPTheme } from '@/components/admin/landing-page/types';

interface Props {
  theme: LPTheme;
  content: LPContent;
}

function extractYoutubeId(url: string): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
}

function getIcon(name: string) {
  const I = (LucideIcons as any)[name];
  return I || LucideIcons.CircleDot;
}

export function LandingPageRenderer({ theme, content }: Props) {
  const finalCtaRef = useRef<HTMLDivElement>(null);
  const [formOpen, setFormOpen] = useState(false);

  const scrollToFinalCta = () => {
    finalCtaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const ctaForm = content.cta_form;
  const openForm = () => {
    if (ctaForm && ctaForm.fields?.length) setFormOpen(true);
    else scrollToFinalCta();
  };

  const handleCtaClick = (mode: LPCTAMode | undefined, url: string) => (e: React.MouseEvent) => {
    if (mode === 'form') {
      e.preventDefault();
      openForm();
    }
  };

  const styleVars = {
    '--lp-primary': theme.primary,
    '--lp-secondary': theme.secondary,
    '--lp-bg': theme.background,
    '--lp-text': theme.text,
    '--lp-accent': theme.accent,
  } as React.CSSProperties;

  const ytId = content.media?.type === 'youtube' ? extractYoutubeId(content.media.url) : null;
  const floating = content.floating_cta;

  return (
    <div
      style={{ ...styleVars, backgroundColor: theme.background, color: theme.text }}
      className="min-h-screen relative"
    >
      {/* Header */}
      <header className="container mx-auto px-4 py-5 border-b" style={{ borderColor: `${theme.text}15` }}>
        <div className="flex items-center justify-between">
          {content.header.logo_url ? (
            <img src={content.header.logo_url} alt={content.header.brand_name} className="h-10 object-contain" />
          ) : (
            <span className="text-xl font-bold" style={{ color: theme.primary }}>
              {content.header.brand_name}
            </span>
          )}
          {content.hero.cta_mode === 'form' ? (
            <Button
              size="lg"
              onClick={openForm}
              style={{ backgroundColor: theme.primary, color: '#fff' }}
            >
              {content.hero.cta_label}
            </Button>
          ) : (
            <Button
              size="lg"
              asChild
              style={{ backgroundColor: theme.primary, color: '#fff' }}
            >
              <a href={content.hero.cta_url} target="_blank" rel="noopener noreferrer">
                {content.hero.cta_label}
              </a>
            </Button>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-12 md:py-20 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 leading-tight">
          {content.hero.title}{' '}
          {content.hero.highlight && (
            <span style={{ color: theme.primary }}>{content.hero.highlight}</span>
          )}
        </h1>
        <p className="text-base md:text-xl mb-8 max-w-2xl mx-auto opacity-80 px-4">
          {content.hero.subtitle}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center px-4">
          {content.hero.cta_mode === 'form' ? (
            <Button
              size="lg"
              onClick={openForm}
              className="text-base md:text-lg px-8 h-12"
              style={{ backgroundColor: theme.primary, color: '#fff' }}
            >
              {content.hero.cta_label}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          ) : (
            <Button
              size="lg"
              asChild
              className="text-base md:text-lg px-8 h-12"
              style={{ backgroundColor: theme.primary, color: '#fff' }}
            >
              <a href={content.hero.cta_url} target="_blank" rel="noopener noreferrer">
                {content.hero.cta_label}
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
          )}
        </div>
      </section>

      {/* Features */}
      {content.features?.length > 0 && (
        <section className="container mx-auto px-4 py-12 md:py-16">
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {content.features.map((f, i) => {
              const Icon = getIcon(f.icon);
              return (
                <div
                  key={i}
                  className="p-6 rounded-xl border shadow-sm"
                  style={{ borderColor: `${theme.text}15`, backgroundColor: `${theme.background}` }}
                >
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${theme.primary}15` }}
                  >
                    <Icon className="h-6 w-6" style={{ color: theme.primary }} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                  <p className="text-sm opacity-80 leading-relaxed">{f.description}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Mídia central */}
      {content.media && content.media.type !== 'none' && content.media.url && (
        <section className="container mx-auto px-4 py-12 md:py-16">
          {content.media.caption && (
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
              {content.media.caption}
            </h2>
          )}
          <div className="max-w-4xl mx-auto rounded-xl overflow-hidden shadow-2xl bg-black aspect-video">
            {content.media.type === 'youtube' && ytId && (
              <iframe
                src={`https://www.youtube.com/embed/${ytId}`}
                title="Vídeo"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
            {content.media.type === 'image' && (
              <img src={content.media.url} alt="" className="w-full h-full object-cover" />
            )}
            {content.media.type === 'video' && (
              <video src={content.media.url} controls className="w-full h-full" />
            )}
          </div>
        </section>
      )}

      {/* Seções dinâmicas (Como Funciona, Stats, Benefícios, FAQ) */}
      {content.sections?.map((sec) => (
        <DynamicSection key={sec.id} section={sec} theme={theme} />
      ))}

      {/* Prova social */}
      {(content.social_proof?.testimonials?.length > 0 || content.social_proof?.logos?.length > 0) && (
        <section className="py-12 md:py-16" style={{ backgroundColor: `${theme.primary}08` }}>
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-3">
              {content.social_proof.title}
            </h2>
            {content.social_proof.subtitle && (
              <p className="text-center opacity-80 mb-10 max-w-2xl mx-auto">
                {content.social_proof.subtitle}
              </p>
            )}

            {content.social_proof.testimonials.length > 0 && (
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 mb-10">
                {content.social_proof.testimonials.map((t, i) => (
                  <div
                    key={i}
                    className="p-6 rounded-xl shadow-sm"
                    style={{ backgroundColor: theme.background, border: `1px solid ${theme.text}15` }}
                  >
                    <div className="flex gap-1 mb-3">
                      {Array.from({ length: t.rating || 5 }).map((_, idx) => (
                        <Star key={idx} className="h-4 w-4 fill-current" style={{ color: theme.accent }} />
                      ))}
                    </div>
                    <p className="text-sm italic mb-4 leading-relaxed">"{t.quote}"</p>
                    <div className="flex items-center gap-3">
                      {t.photo_url && (
                        <img src={t.photo_url} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
                      )}
                      <div>
                        <p className="text-sm font-semibold">{t.name}</p>
                        {t.role && <p className="text-xs opacity-70">{t.role}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {content.social_proof.logos.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-8 opacity-70">
                {content.social_proof.logos.map((l, i) => (
                  <img key={i} src={l.image_url} alt={l.name} className="h-10 object-contain" />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* CTA Final */}
      <section
        ref={finalCtaRef}
        className="py-16 md:py-24"
        style={{ backgroundColor: theme.primary, color: '#fff' }}
      >
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{content.final_cta.title}</h2>
          {content.final_cta.subtitle && (
            <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">{content.final_cta.subtitle}</p>
          )}
          {content.final_cta.button_mode === 'form' ? (
            <Button
              size="lg"
              onClick={openForm}
              className="text-lg px-10 h-14"
              style={{ backgroundColor: theme.accent, color: '#fff' }}
            >
              {content.final_cta.button_label}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          ) : (
            <Button
              size="lg"
              asChild
              className="text-lg px-10 h-14"
              style={{ backgroundColor: theme.accent, color: '#fff' }}
            >
              <a href={content.final_cta.button_url} target="_blank" rel="noopener noreferrer">
                {content.final_cta.button_label}
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-4" style={{ backgroundColor: `${theme.text}`, color: theme.background }}>
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <p className="font-semibold">{content.footer.company_name}</p>
              {content.footer.cnpj && (
                <p className="text-xs opacity-70">CNPJ: {content.footer.cnpj}</p>
              )}
              <p className="text-xs opacity-70 mt-1">
                © {new Date().getFullYear()} · {content.footer.rights_text}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {content.socials.instagram && (
                <a href={content.socials.instagram} target="_blank" rel="noopener noreferrer"
                  className="p-2 rounded-full hover:opacity-80 transition"
                  style={{ backgroundColor: `${theme.background}15` }}>
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {content.socials.linkedin && (
                <a href={content.socials.linkedin} target="_blank" rel="noopener noreferrer"
                  className="p-2 rounded-full hover:opacity-80 transition"
                  style={{ backgroundColor: `${theme.background}15` }}>
                  <Linkedin className="h-5 w-5" />
                </a>
              )}
              {content.socials.youtube && (
                <a href={content.socials.youtube} target="_blank" rel="noopener noreferrer"
                  className="p-2 rounded-full hover:opacity-80 transition"
                  style={{ backgroundColor: `${theme.background}15` }}>
                  <Youtube className="h-5 w-5" />
                </a>
              )}
              {content.socials.facebook && (
                <a href={content.socials.facebook} target="_blank" rel="noopener noreferrer"
                  className="p-2 rounded-full hover:opacity-80 transition"
                  style={{ backgroundColor: `${theme.background}15` }}>
                  <Facebook className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>
        </div>
      </footer>

      {/* Floating CTA (único, centralizado) */}
      {floating?.enabled && floating.label && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
          {floating.mode === 'form' ? (
            <Button
              size="lg"
              onClick={openForm}
              className="shadow-2xl"
              style={{ backgroundColor: theme.accent, color: '#fff' }}
            >
              {floating.label}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : floating.mode === 'link' && floating.url ? (
            <Button
              asChild
              size="lg"
              className="shadow-2xl"
              style={{ backgroundColor: theme.accent, color: '#fff' }}
            >
              <a href={floating.url} target="_blank" rel="noopener noreferrer">
                {floating.label}
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={scrollToFinalCta}
              className="shadow-2xl"
              style={{ backgroundColor: theme.accent, color: '#fff' }}
            >
              {floating.label}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {/* Modal de formulário de cadastro */}
      {ctaForm && (
        <LeadFormModal
          open={formOpen}
          onOpenChange={setFormOpen}
          form={ctaForm}
          theme={theme}
          sourceLp={content.header.brand_name}
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

function LeadFormModal({ open, onOpenChange, form, theme, sourceLp }: LeadFormModalProps) {
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
      // Detecta campos especiais p/ name / phone / email
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

      // Pixel
      try { (window as any).fbq?.('track', 'Lead'); } catch { /* noop */ }

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
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao enviar. Tente novamente.');
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
            <CheckCircle className="h-14 w-14 mx-auto mb-3" style={{ color: theme.accent }} />
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
                style={{ backgroundColor: theme.primary, color: '#fff' }}
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
                style={{ backgroundColor: theme.primary, color: '#fff' }}
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

function DynamicSection({ section, theme }: { section: LPSection; theme: LPTheme }) {
  if (section.type === 'how_it_works') {
    return (
      <section className="py-12 md:py-20" style={{ backgroundColor: `${theme.text}06` }}>
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-3">
            {section.title}
          </h2>
          {section.subtitle && (
            <p className="text-center opacity-80 mb-10 max-w-2xl mx-auto">
              {section.subtitle}
            </p>
          )}
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {section.steps.map((step, i) => (
              <div key={i} className="text-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold"
                  style={{ backgroundColor: theme.primary, color: '#fff' }}
                >
                  {i + 1}
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="opacity-80 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (section.type === 'stats') {
    return (
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 text-center">
            {section.items.map((item, i) => {
              const Icon = getIcon(item.icon);
              return (
                <div key={i} className="p-6 md:p-8">
                  <Icon className="h-12 w-12 mx-auto mb-4" style={{ color: theme.primary }} />
                  <div className="text-4xl font-bold mb-2" style={{ color: theme.primary }}>
                    {item.value}
                  </div>
                  <p className="opacity-80">{item.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  if (section.type === 'benefits') {
    return (
      <section className="py-12 md:py-20" style={{ backgroundColor: `${theme.primary}10` }}>
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            {section.title && (
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-10">
                {section.title}
              </h2>
            )}
            <div className="space-y-4">
              {section.items.map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 p-5 rounded-lg shadow-sm"
                  style={{ backgroundColor: theme.background }}
                >
                  <CheckCircle
                    className="h-6 w-6 flex-shrink-0 mt-1"
                    style={{ color: theme.accent }}
                  />
                  <div>
                    <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                    <p className="opacity-80">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (section.type === 'faq') {
    return (
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4 max-w-3xl">
          {section.title && (
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-10">
              {section.title}
            </h2>
          )}
          <Accordion type="single" collapsible className="space-y-2">
            {section.items.map((item, i) => (
              <AccordionItem
                key={i}
                value={`q-${i}`}
                className="border rounded-md px-4"
                style={{ borderColor: `${theme.text}20` }}
              >
                <AccordionTrigger className="text-left font-semibold">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="opacity-80 leading-relaxed whitespace-pre-line">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    );
  }

  return null;
}
