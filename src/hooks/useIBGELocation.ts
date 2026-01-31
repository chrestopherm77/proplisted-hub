import { useState, useCallback, useEffect } from 'react';

export interface IBGEState {
  id: number;
  sigla: string;
  nome: string;
}

export interface IBGECity {
  id: number;
  nome: string;
}

const IBGE_API = 'https://servicodados.ibge.gov.br/api/v1/localidades';

export function useIBGELocation() {
  const [states, setStates] = useState<IBGEState[]>([]);
  const [cities, setCities] = useState<IBGECity[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStates = useCallback(async () => {
    setLoadingStates(true);
    setError(null);
    try {
      const res = await fetch(`${IBGE_API}/estados?orderBy=nome`);
      if (!res.ok) throw new Error('Falha ao carregar estados');
      const data = await res.json();
      setStates(data);
    } catch (err) {
      setError('Erro ao carregar estados');
      console.error('Erro ao buscar estados:', err);
    } finally {
      setLoadingStates(false);
    }
  }, []);

  const fetchCities = useCallback(async (uf: string) => {
    if (!uf) {
      setCities([]);
      return;
    }
    setLoadingCities(true);
    setError(null);
    try {
      const res = await fetch(`${IBGE_API}/estados/${uf}/municipios?orderBy=nome`);
      if (!res.ok) throw new Error('Falha ao carregar cidades');
      const data = await res.json();
      setCities(data);
    } catch (err) {
      setError('Erro ao carregar cidades');
      console.error('Erro ao buscar cidades:', err);
    } finally {
      setLoadingCities(false);
    }
  }, []);

  const clearCities = useCallback(() => {
    setCities([]);
  }, []);

  // Carregar estados automaticamente na montagem
  useEffect(() => {
    fetchStates();
  }, [fetchStates]);

  return {
    states,
    cities,
    loadingStates,
    loadingCities,
    error,
    fetchStates,
    fetchCities,
    clearCities,
  };
}
