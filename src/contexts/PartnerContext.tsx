import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

      // Skip partner detection for known LeadBay domains
      const knownDomains = [
        'localhost',
        'leadbay.com.br',
        'www.leadbay.com.br',
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
