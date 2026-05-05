import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { LandingPageRenderer } from '@/components/landing-page-renderer/LandingPageRenderer';
import NotFound from '@/pages/NotFound';
import {
  DEFAULT_THEME,
  mergeLPContent,
  type CustomLandingPage as LP,
  type LPContent,
  type LPTheme,
} from '@/components/admin/landing-page/types';

export default function CustomLandingPage() {
  const { customSlug } = useParams<{ customSlug: string }>();
  const [lp, setLp] = useState<LP | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!customSlug) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from('custom_landing_pages')
        .select('*')
        .eq('slug', customSlug.toLowerCase())
        .eq('is_published', true)
        .maybeSingle();

      if (error || !data) {
        setNotFound(true);
      } else {
        setLp(data as unknown as LP);
        // SEO básico
        document.title = data.title || 'Landing Page';
      }
      setLoading(false);
    })();
  }, [customSlug]);

  // Injetar Meta Pixel apenas na LP pública (não no preview do admin)
  const pixelId = (lp?.content as LPContent | undefined)?.tracking?.facebook_pixel_id;
  useEffect(() => {
    if (!pixelId || !/^\d{6,20}$/.test(pixelId)) return;
    const safeId = pixelId.replace(/\D/g, '');

    const script = document.createElement('script');
    script.setAttribute('data-fb-pixel', safeId);
    script.innerHTML = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${safeId}');
      fbq('track', 'PageView');
    `;
    document.head.appendChild(script);

    const noscript = document.createElement('noscript');
    noscript.setAttribute('data-fb-pixel', safeId);
    const img = document.createElement('img');
    img.height = 1;
    img.width = 1;
    img.style.display = 'none';
    img.src = `https://www.facebook.com/tr?id=${safeId}&ev=PageView&noscript=1`;
    noscript.appendChild(img);
    document.body.appendChild(noscript);

    return () => {
      script.remove();
      noscript.remove();
    };
  }, [pixelId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound || !lp) return <NotFound />;

  const theme: LPTheme = { ...DEFAULT_THEME, ...(lp.theme as LPTheme) };
  const raw = (lp.content as LPContent) || ({} as LPContent);
  const legacyFloating = raw.floating_ctas?.[0];
  const content: LPContent = {
    ...DEFAULT_CONTENT,
    ...raw,
    header: { ...DEFAULT_CONTENT.header, ...raw.header },
    hero: { ...DEFAULT_CONTENT.hero, ...raw.hero },
    media: { ...DEFAULT_CONTENT.media, ...raw.media },
    social_proof: { ...DEFAULT_CONTENT.social_proof, ...raw.social_proof },
    final_cta: { ...DEFAULT_CONTENT.final_cta, ...raw.final_cta },
    socials: { ...DEFAULT_CONTENT.socials, ...raw.socials },
    footer: { ...DEFAULT_CONTENT.footer, ...raw.footer },
    tracking: { ...DEFAULT_CONTENT.tracking, ...raw.tracking },
    cta_form: { ...DEFAULT_CONTENT.cta_form!, ...raw.cta_form },
    features: raw.features ?? DEFAULT_CONTENT.features,
    floating_cta: raw.floating_cta ?? (legacyFloating
      ? { ...legacyFloating, mode: 'link', url: '' }
      : DEFAULT_CONTENT.floating_cta),
    sections: raw.sections ?? [],
  };

  return <LandingPageRenderer theme={theme} content={content} />;
}
