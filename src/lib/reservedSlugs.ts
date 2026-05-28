// Lista sincronizada com src/App.tsx e o trigger validate_landing_page_slug no banco.
// Adicione aqui qualquer rota nova de 1º nível antes de criar uma LP com esse slug.
export const RESERVED_SLUGS = [
  'admin', 'auth', 'leads', 'my-leads', 'cart', 'checkout',
  'checkout-success', 'checkout-error', 'checkout-expired',
  'profile', 'lp', 'lp-01', 'lp-obrigado', 'lp-obrigado-01',
  'reset-password', 'property-searches', 'launches', 'financiamento',
  'giro-do-mercado', 'nossa-ia', 'comprar-creditos', 'calculadora',
  'criativos', 'portal-imoveis', 'imovel', 'planos',
  'primeiros-passos', 'indicar', 'v', 'conectaeimob', 'corretor',
  'api', 'assets', 'public', 'static',
];

export const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{0,59}$/;

export function validateSlug(slug: string): { valid: boolean; error?: string } {
  const s = slug.trim().toLowerCase();
  if (!s) return { valid: false, error: 'O slug não pode ser vazio' };
  if (!SLUG_REGEX.test(s)) {
    return {
      valid: false,
      error: 'Use apenas letras minúsculas, números e hífens (sem acentos ou espaços).',
    };
  }
  if (RESERVED_SLUGS.includes(s)) {
    return { valid: false, error: 'Este slug é reservado pelo sistema. Escolha outro.' };
  }
  return { valid: true };
}

export function normalizeSlug(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);
}
