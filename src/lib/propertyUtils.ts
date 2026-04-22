export const PROPERTY_TYPES = [
  { value: 'APARTAMENTO', label: 'Apartamento' },
  { value: 'CASA', label: 'Casa' },
  { value: 'SOBRADO', label: 'Sobrado' },
  { value: 'COBERTURA', label: 'Cobertura' },
  { value: 'TERRENO', label: 'Terreno' },
  { value: 'SALA_COMERCIAL', label: 'Sala Comercial' },
  { value: 'GALPAO', label: 'Galpão' },
  { value: 'SITIO', label: 'Sítio' },
  { value: 'CHACARA', label: 'Chácara' },
];

export const OPERATION_TYPES = [
  { value: 'SALE', label: 'Venda' },
  { value: 'RENT', label: 'Aluguel' },
  { value: 'BOTH', label: 'Venda e Aluguel' },
];

export const PROPERTY_STATUS = [
  { value: 'PRONTO', label: 'Pronto pra morar' },
  { value: 'EM_CONSTRUCAO', label: 'Em construção' },
  { value: 'REFORMADO', label: 'Reformado' },
  { value: 'PRECISA_REFORMA', label: 'Precisa reforma' },
];

export const AMENITIES = [
  'Piscina',
  'Churrasqueira',
  'Academia',
  'Portaria 24h',
  'Salão de festas',
  'Playground',
  'Pet friendly',
  'Mobiliado',
  'Quadra esportiva',
  'Sauna',
  'Espaço gourmet',
  'Coworking',
  'Bicicletário',
  'Lavanderia',
  'Jardim',
  'Varanda',
  'Sacada',
  'Ar condicionado',
  'Aquecimento solar',
  'Vista mar',
];

export function getPropertyTypeLabel(value: string | null | undefined): string {
  if (!value) return '';
  return PROPERTY_TYPES.find((t) => t.value === value)?.label || value;
}

export function getOperationLabel(value: string | null | undefined): string {
  if (!value) return '';
  return OPERATION_TYPES.find((t) => t.value === value)?.label || value;
}

export function getStatusLabel(value: string | null | undefined): string {
  if (!value) return '';
  return PROPERTY_STATUS.find((t) => t.value === value)?.label || value;
}

export function buildPropertyTitle(propertyType: string, neighborhood: string | null): string {
  const typeLabel = getPropertyTypeLabel(propertyType);
  if (neighborhood) return `${typeLabel} ${neighborhood}`;
  return typeLabel;
}

export function formatPrice(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '';
  return `R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

export function parseCurrencyInput(value: string): number | null {
  const digits = value.replace(/\D/g, '');
  if (!digits) return null;
  return parseInt(digits, 10) / 100;
}

export function formatCurrencyInput(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  const num = parseInt(digits, 10);
  return `R$ ${(num / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

export function generateAffiliateToken(): string {
  // Curto e único
  const arr = new Uint8Array(6);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(36)).join('').slice(0, 8);
}

export interface PropertyPhoto {
  url: string;
  order: number;
  is_cover?: boolean;
}

export function sortPhotos(photos: PropertyPhoto[]): PropertyPhoto[] {
  return [...photos].sort((a, b) => {
    if (a.is_cover && !b.is_cover) return -1;
    if (!a.is_cover && b.is_cover) return 1;
    return (a.order || 0) - (b.order || 0);
  });
}

export function getCoverPhoto(photos: PropertyPhoto[]): string | null {
  if (!photos || photos.length === 0) return null;
  const sorted = sortPhotos(photos);
  return sorted[0]?.url || null;
}
