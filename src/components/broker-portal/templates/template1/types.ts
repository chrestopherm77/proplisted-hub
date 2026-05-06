import { BrokerPortal } from '@/hooks/useBrokerPortal';

export interface TemplateProps {
  portal: BrokerPortal;
  properties: any[];
}

export interface FilterState {
  operation: string;
  propertyType: string;
  priceMin: string;
  priceMax: string;
  city: string;
  reference: string;
}

export const EMPTY_FILTERS: FilterState = {
  operation: '',
  propertyType: '',
  priceMin: '',
  priceMax: '',
  city: '',
  reference: '',
};

export function applyFilters(items: any[], f: FilterState) {
  return items.filter((p) => {
    if (f.operation && p.operation_type !== f.operation) return false;
    if (f.propertyType && p.property_type !== f.propertyType) return false;
    if (f.city && (p.city || '').toLowerCase() !== f.city.toLowerCase()) return false;
    const price = Number(p.price_sale ?? p.price_rent ?? 0);
    if (f.priceMin && price < Number(f.priceMin.replace(/\D/g, ''))) return false;
    if (f.priceMax && price > Number(f.priceMax.replace(/\D/g, ''))) return false;
    if (f.reference && !String(p.reference_code || '').toLowerCase().includes(f.reference.toLowerCase())) return false;
    return true;
  });
}

export function statusLabel(status: string | null | undefined) {
  const s = (status || '').toLowerCase();
  if (s.includes('obra')) return 'Em obras';
  if (s.includes('construir') || s.includes('lote')) return 'Pronto para construir';
  if (s.includes('lanc')) return 'Lançamento';
  return 'Pronto para morar';
}
