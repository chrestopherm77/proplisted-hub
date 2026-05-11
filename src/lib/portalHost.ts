// Helper para detectar o host efetivo de um portal de corretor.
// Quando o portal é servido via proxy (Vercel), o domínio original do cliente
// é injetado na URL pelo rewrite como `?__portal_host=DOMINIO`. Guardamos no
// sessionStorage para sobreviver à navegação client-side da SPA.

const STORAGE_KEY = '__portal_host';
const QUERY_KEY = '__portal_host';

/**
 * Retorna o host que o app deve usar para resolver o portal.
 * Prioridade:
 *   1. ?__portal_host=... (vindo do proxy Vercel)
 *   2. sessionStorage (persistido após primeira visita)
 *   3. window.location.hostname (acesso direto)
 */
export function getEffectivePortalHost(): string {
  if (typeof window === 'undefined') return '';

  try {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get(QUERY_KEY)?.trim().toLowerCase();
    if (fromQuery) {
      sessionStorage.setItem(STORAGE_KEY, fromQuery);
      // Limpa o param da URL para não poluir, sem recarregar a página.
      params.delete(QUERY_KEY);
      const newSearch = params.toString();
      const newUrl =
        window.location.pathname +
        (newSearch ? `?${newSearch}` : '') +
        window.location.hash;
      window.history.replaceState({}, '', newUrl);
      return fromQuery;
    }
  } catch {
    /* ignore */
  }

  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) return stored.toLowerCase();
  } catch {
    /* ignore */
  }

  return window.location.hostname.toLowerCase();
}

export function clearStoredPortalHost() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
