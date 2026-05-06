export interface PortalTemplateInfo {
  id: number;
  name: string;
  description: string;
  available: boolean;
}

export const PORTAL_TEMPLATES: PortalTemplateInfo[] = [
  {
    id: 1,
    name: 'Agnus Premium',
    description: 'Modelo escuro elegante com hero em destaque, filtros avançados e galeria de imóveis.',
    available: true,
  },
  {
    id: 2,
    name: 'Modelo 2 (em breve)',
    description: 'Em desenvolvimento.',
    available: false,
  },
  {
    id: 3,
    name: 'Modelo 3 (em breve)',
    description: 'Em desenvolvimento.',
    available: false,
  },
];

export function getTemplateName(id: number): string {
  return PORTAL_TEMPLATES.find((t) => t.id === id)?.name || `Template ${id}`;
}
