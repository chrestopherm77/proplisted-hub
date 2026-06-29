import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type PendingKind = 'property' | 'property_search';
export type OperationType = 'SALE' | 'RENT' | 'SALE_RENT' | string;

export interface PendingItem {
  kind: PendingKind;
  id: string;
  title: string;
  subtitle: string;
  operation_type?: OperationType;
}

const THRESHOLD_MS = 30 * 24 * 60 * 60 * 1000;
const SESSION_KEY = 'validation_prompt_shown_at';

export function usePendingValidations() {
  const { user } = useAuth();
  const [pending, setPending] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPending = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const cutoff = new Date(Date.now() - THRESHOLD_MS).toISOString();

    const [propsRes, searchesRes] = await Promise.all([
      supabase
        .from('properties')
        .select('id, title, reference_code, city, neighborhood, last_validated_at, operation_type')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .lt('last_validated_at', cutoff),
      supabase
        .from('property_searches')
        .select('id, title, headline, city, neighborhood, last_validated_at, property_type, operation_type')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .lt('last_validated_at', cutoff),
    ]);

    const items: PendingItem[] = [];
    (propsRes.data || []).forEach((p: any) => {
      items.push({
        kind: 'property',
        id: p.id,
        title: p.title || `Imóvel ${p.reference_code || ''}`.trim(),
        subtitle: [p.neighborhood, p.city].filter(Boolean).join(' · '),
        operation_type: p.operation_type,
      });
    });
    (searchesRes.data || []).forEach((s: any) => {
      items.push({
        kind: 'property_search',
        id: s.id,
        title: s.title || s.headline || 'Interesse de compra',
        subtitle: [s.neighborhood, s.city].filter(Boolean).join(' · '),
        operation_type: s.operation_type,
      });
    });
    setPending(items);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) fetchPending();
    else setPending([]);
  }, [user, fetchPending]);

  const confirmValid = async (item: PendingItem) => {
    const table = item.kind === 'property' ? 'properties' : 'property_searches';
    await supabase.from(table).update({ last_validated_at: new Date().toISOString() }).eq('id', item.id);
    setPending((prev) => prev.filter((p) => !(p.id === item.id && p.kind === item.kind)));
  };

  const deactivate = async (item: PendingItem, reason: 'SOLD' | 'RENTED' | 'NO_LONGER_VALID') => {
    const table = item.kind === 'property' ? 'properties' : 'property_searches';
    await supabase
      .from(table)
      .update({
        is_active: false,
        last_validated_at: new Date().toISOString(),
        deactivated_reason: reason,
        deactivated_at: new Date().toISOString(),
      })
      .eq('id', item.id);
    setPending((prev) => prev.filter((p) => !(p.id === item.id && p.kind === item.kind)));
  };

  const markShown = () => {
    try {
      sessionStorage.setItem(SESSION_KEY, String(Date.now()));
    } catch {}
  };

  const wasShownThisSession = () => {
    try {
      return !!sessionStorage.getItem(SESSION_KEY);
    } catch {
      return false;
    }
  };

  return { pending, loading, confirmValid, deactivate, refresh: fetchPending, markShown, wasShownThisSession };
}
