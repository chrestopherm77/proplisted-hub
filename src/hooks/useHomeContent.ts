import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  DEFAULT_HOME_CONTENT,
  mergeHomeContent,
  type HomeContent,
} from '@/components/admin/home-page/types';

interface State {
  content: HomeContent;
  loading: boolean;
}

/**
 * Carrega o conteúdo editável da Página Principal a partir da tabela
 * `home_page_content` (singleton). Faz fallback para os defaults se nada
 * estiver salvo ou se a query falhar.
 */
export function useHomeContent(): State {
  const [state, setState] = useState<State>({
    content: DEFAULT_HOME_CONTENT,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('home_page_content')
        .select('content')
        .limit(1)
        .maybeSingle();

      if (cancelled) return;

      if (error || !data) {
        setState({ content: DEFAULT_HOME_CONTENT, loading: false });
        return;
      }
      setState({
        content: mergeHomeContent(data.content as Partial<HomeContent>),
        loading: false,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
