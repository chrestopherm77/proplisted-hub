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
    name: 'Colleone Classic',
    description: 'Modelo claro com hero em destaque, seção de imóveis exclusivos, depoimentos e identidade azul-marinho.',
    available: true,
  },
  {
    id: 3,
    name: 'Maison Boutique',
    description: 'Modelo boutique claro com logo central, paleta bege/verde-oliva, hero amplo e seções separadas de venda e locação.',
    available: true,
  },
];

export function getTemplateName(id: number): string {
  return PORTAL_TEMPLATES.find((t) => t.id === id)?.name || `Template ${id}`;
}
