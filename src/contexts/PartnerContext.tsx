import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

function hexToHsl(hex: string | null): { h: number; s: number; l: number } | null {
  if (!hex) return null;
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export interface Partner {
  id: string;
  name: string;
  slug: string;
  custom_domain: string | null;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  is_active: boolean;
}

interface PartnerContextType {
  partner: Partner | null;
  isPartnerSite: boolean;
  loading: boolean;
}

const PartnerContext = createContext<PartnerContextType>({
  partner: null,
  isPartnerSite: false,
  loading: true,
});

export const usePartner = () => useContext(PartnerContext);

export const PartnerProvider = ({ children }: { children: ReactNode }) => {
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const detectPartner = async () => {
      const hostname = window.location.hostname;

      const knownDomains = [
        'localhost',
        'conectaeimob.com.br',
        'www.conectaeimob.com.br',
        'proplisted-hub.lovable.app',
      ];

      if (knownDomains.some(d => hostname === d || hostname.endsWith('.lovable.app'))) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('partners')
          .select('*')
          .eq('custom_domain', hostname)
          .eq('is_active', true)
          .maybeSingle();

        if (!error && data) {
          setPartner(data as Partner);
        }
      } catch (err) {
        console.error('Error detecting partner:', err);
      } finally {
        setLoading(false);
      }
    };

    detectPartner();
  }, []);

  // Apply partner CSS variables (convert hex to HSL and override design system)
  useEffect(() => {
    const root = document.documentElement;
    if (partner) {
      const primary = hexToHsl(partner.primary_color);
      const secondary = hexToHsl(partner.secondary_color);

      if (primary) {
        const p = `${primary.h} ${primary.s}% ${primary.l}%`;
        root.style.setProperty('--primary', p);
        root.style.setProperty('--primary-dark', `${primary.h} ${primary.s}% ${Math.max(primary.l - 10, 0)}%`);
        root.style.setProperty('--primary-light', `${primary.h} ${primary.s}% 92%`);
        root.style.setProperty('--ring', p);
        root.style.setProperty('--info', p);
      }
      if (secondary) {
        root.style.setProperty('--secondary', `${secondary.h} ${secondary.s}% ${secondary.l}%`);
        root.style.setProperty('--secondary-dark', `${secondary.h} ${secondary.s}% ${Math.max(secondary.l - 10, 0)}%`);
      }
    } else {
      ['--primary', '--primary-dark', '--primary-light', '--ring', '--info',
       '--secondary', '--secondary-dark'].forEach(v => root.style.removeProperty(v));
    }
  }, [partner]);

  return (
    <PartnerContext.Provider value={{ partner, isPartnerSite: !!partner, loading }}>
      {children}
    </PartnerContext.Provider>
  );
};
