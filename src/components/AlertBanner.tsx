import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { X, ExternalLink } from 'lucide-react';

interface Banner {
  id: string;
  title: string | null;
  message: string;
  link_url: string | null;
  link_label: string | null;
  bg_color: string;
  text_color: string;
  dismissible: boolean;
}

const DISMISS_KEY = 'alert_banner_dismissed';

export const AlertBanner = () => {
  const [banner, setBanner] = useState<Banner | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const { data } = await supabase
        .from('alert_banners')
        .select('id, title, message, link_url, link_label, bg_color, text_color, dismissible')
        .eq('is_active', true)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!mounted || !data) return;
      const dismissed = localStorage.getItem(DISMISS_KEY);
      if (dismissed === data.id && data.dismissible) return;
      setBanner(data as Banner);
    };
    load();
    return () => { mounted = false; };
  }, []);

  if (!banner) return null;

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, banner.id);
    setBanner(null);
  };

  return (
    <div
      className="w-full px-4 py-2 text-sm flex items-center justify-center gap-3 flex-wrap"
      style={{ backgroundColor: banner.bg_color, color: banner.text_color }}
      role="region"
      aria-label="Alerta"
    >
      <div className="flex items-center gap-2 flex-wrap justify-center">
        {banner.title && <strong className="font-semibold">{banner.title}</strong>}
        <span>{banner.message}</span>
        {banner.link_url && (
          <a
            href={banner.link_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 font-medium transition-colors"
            style={{ color: banner.text_color }}
          >
            {banner.link_label || 'Saiba mais'}
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
      {banner.dismissible && (
        <button
          onClick={handleDismiss}
          aria-label="Fechar alerta"
          className="ml-auto opacity-80 hover:opacity-100 transition-opacity"
          style={{ color: banner.text_color }}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};
