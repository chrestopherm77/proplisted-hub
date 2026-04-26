import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { LandingPageRenderer } from '@/components/landing-page-renderer/LandingPageRenderer';
import NotFound from '@/pages/NotFound';
import {
  DEFAULT_CONTENT,
  DEFAULT_THEME,
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound || !lp) return <NotFound />;

  const theme: LPTheme = { ...DEFAULT_THEME, ...(lp.theme as LPTheme) };
  const content: LPContent = {
    ...DEFAULT_CONTENT,
    ...(lp.content as LPContent),
    header: { ...DEFAULT_CONTENT.header, ...(lp.content as LPContent)?.header },
    hero: { ...DEFAULT_CONTENT.hero, ...(lp.content as LPContent)?.hero },
    media: { ...DEFAULT_CONTENT.media, ...(lp.content as LPContent)?.media },
    social_proof: { ...DEFAULT_CONTENT.social_proof, ...(lp.content as LPContent)?.social_proof },
    final_cta: { ...DEFAULT_CONTENT.final_cta, ...(lp.content as LPContent)?.final_cta },
    socials: { ...DEFAULT_CONTENT.socials, ...(lp.content as LPContent)?.socials },
    footer: { ...DEFAULT_CONTENT.footer, ...(lp.content as LPContent)?.footer },
    features: (lp.content as LPContent)?.features ?? DEFAULT_CONTENT.features,
    floating_ctas:
      (lp.content as LPContent)?.floating_ctas ?? DEFAULT_CONTENT.floating_ctas,
    sections: (lp.content as LPContent)?.sections ?? [],
  };

  return <LandingPageRenderer theme={theme} content={content} />;
}
