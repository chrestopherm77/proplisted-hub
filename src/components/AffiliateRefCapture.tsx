import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function AffiliateRefCapture() {
  const location = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const aff = params.get('aff');
    if (aff && aff.trim()) {
      try {
        localStorage.setItem('affiliate_ref', aff.trim().toLowerCase());
        localStorage.setItem('affiliate_ref_at', String(Date.now()));
      } catch { /* ignore */ }
    }
  }, [location.search]);
  return null;
}
