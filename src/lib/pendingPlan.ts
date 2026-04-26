// Helper para "lembrar" o plano que o usuário escolheu na LP até o cadastro/login terminar.
// Estratégia: URL (?plan=slug) é a fonte primária; sessionStorage serve como fallback
// caso o usuário recarregue ou o fluxo perca o query param entre redirects.

const KEY = 'conectaae:pendingPlan';

export const setPendingPlan = (slug: string | null | undefined) => {
  if (!slug) return;
  try {
    sessionStorage.setItem(KEY, slug);
  } catch {
    /* ignore */
  }
};

export const getPendingPlan = (): string | null => {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
};

export const clearPendingPlan = () => {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
};

/**
 * Lê o slug priorizando a URL (?plan=) e caindo para o sessionStorage.
 * Sempre sincroniza o storage com a URL quando ela tem valor.
 */
export const resolvePendingPlan = (urlSlug?: string | null): string | null => {
  if (urlSlug) {
    setPendingPlan(urlSlug);
    return urlSlug;
  }
  return getPendingPlan();
};
