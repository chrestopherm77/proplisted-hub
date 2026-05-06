import { useEffect, useState, useCallback } from 'react';

export function useFavorites(slug: string) {
  const key = `bp-fav-${slug}`;
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    try { setIds(JSON.parse(localStorage.getItem(key) || '[]')); } catch {}
  }, [key]);

  const toggle = useCallback((id: string) => {
    setIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem(key, JSON.stringify(next));
      return next;
    });
  }, [key]);

  const has = useCallback((id: string) => ids.includes(id), [ids]);

  return { ids, toggle, has };
}
