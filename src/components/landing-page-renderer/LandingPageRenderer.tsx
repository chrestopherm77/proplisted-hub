import { useRef } from 'react';
import * as LucideIcons from 'lucide-react';
import { Instagram, Linkedin, Youtube, Facebook, ArrowRight, Star, CheckCircle } from 'lucide-react';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import type { LPContent, LPSection, LPTheme } from '@/components/admin/landing-page/types';

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

  const scrollToFinalCta = () => {
    finalCtaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const styleVars = {
    '--lp-primary': theme.primary,
    '--lp-secondary': theme.secondary,
    '--lp-bg': theme.background,
    '--lp-text': theme.text,
    '--lp-accent': theme.accent,
  } as React.CSSProperties;

  const ytId = content.media?.type === 'youtube' ? extractYoutubeId(content.media.url) : null;

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
          <Button
            size="lg"
            asChild
            style={{ backgroundColor: theme.primary, color: '#fff' }}
          >
            <a href={content.hero.cta_url} target="_blank" rel="noopener noreferrer">
              {content.hero.cta_label}
            </a>
          </Button>
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

      {/* Floating CTAs */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {content.floating_ctas.filter((c) => c.enabled && c.label).map((cta, i) => (
          <Button
            key={i}
            size="lg"
            onClick={scrollToFinalCta}
            className="shadow-2xl"
            style={{
              backgroundColor: i === 0 ? theme.accent : theme.secondary,
              color: '#fff',
            }}
          >
            {cta.label}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ))}
      </div>
    </div>
  );
}
