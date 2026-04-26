import { createContext, useContext } from 'react';
import type { HomeContent } from '@/components/admin/home-page/types';

/**
 * Permite que o `HomePageEditor` injete um conteúdo "ao vivo" (em edição,
 * ainda não salvo) dentro do <Index/> renderizado em modo Preview.
 *
 * Quando `null` (uso normal em /), Index busca o conteúdo do banco via
 * `useHomeContent`.
 */
export const HomeContentContext = createContext<HomeContent | null>(null);

export function useHomeContentOverride() {
  return useContext(HomeContentContext);
}
