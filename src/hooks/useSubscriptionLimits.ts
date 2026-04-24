import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const ADMIN_PLAN: PlanInfo = {
  id: 'admin',
  slug: 'admin',
  name: 'Admin',
  price: 0,
  monthly_credits: 0,
  features: {
    partnership_requests: -1,
    partnership_offers: -1,
    portal_properties: -1,
    creatives_per_month: -1,
    leads_included: -1,
    hot_seat_per_month: -1,
    training_level: 'advanced',
  },
  feature_list: ['Acesso ilimitado de administrador'],
};

export type LimitResource =
  | 'portal_properties'
  | 'partnership_requests'
  | 'partnership_offers'
  | 'creatives_per_month'
  | 'leads_included'
  | 'hot_seat_per_month';

export interface PlanFeatures {
  partnership_requests?: number;
  partnership_offers?: number;
  portal_properties?: number;
  creatives_per_month?: number;
  leads_included?: number;
  hot_seat_per_month?: number;
  training_level?: 'basic' | 'intermediate' | 'advanced';
}

export interface PlanInfo {
  id: string;
  slug: string;
  name: string;
  price: number;
  monthly_credits: number;
  features: PlanFeatures;
  feature_list: string[];
}

export interface Usage {
  portal_properties: number;
  partnership_requests: number;
  partnership_offers: number;
  creatives_per_month: number;
}

export interface CanResult {
  allowed: boolean;
  reason?: string;
  limit: number;
  used: number;
  isUnlimited: boolean;
  remaining: number;
}

const FREE_FALLBACK: PlanFeatures = {
  partnership_requests: 1,
  partnership_offers: 5,
  portal_properties: 3,
  creatives_per_month: 1,
  leads_included: 0,
  hot_seat_per_month: 0,
  training_level: 'basic',
};

const RESOURCE_LABELS: Record<LimitResource, string> = {
  portal_properties: 'imóveis no portal',
  partnership_requests: 'solicitações de parceria',
  partnership_offers: 'ofertas de parceria',
  creatives_per_month: 'criativos no mês',
  leads_included: 'leads inclusos',
  hot_seat_per_month: 'hot seats',
};

export function useSubscriptionLimits() {
  const { user, isAdmin, permissionsLoading } = useAuth();
  const [plan, setPlan] = useState<PlanInfo | null>(null);
  const [usage, setUsage] = useState<Usage>({
    portal_properties: 0,
    partnership_requests: 0,
    partnership_offers: 0,
    creatives_per_month: 0,
  });
  const [creditBalance, setCreditBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);

    // Admin: acesso ilimitado, sem checagem de plano nem uso
    if (isAdmin) {
      setPlan(ADMIN_PLAN);
      setUsage({ portal_properties: 0, partnership_requests: 0, partnership_offers: 0, creatives_per_month: 0 });
      const { data: profile } = await supabase.from('profiles').select('credit_balance').eq('id', user.id).maybeSingle();
      setCreditBalance(profile?.credit_balance ?? 0);
      setLoading(false);
      return;
    }

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthIso = monthStart.toISOString();

    // 1) Busca assinatura ATIVA (com period_start para definir ciclo)
    const subRes = await supabase
      .from('user_subscriptions')
      .select('current_period_start, plan:subscription_plans(id, slug, name, price, monthly_credits, features, feature_list)')
      .eq('user_id', user.id)
      .in('status', ['ACTIVE'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Ciclo de cobrança do plano (para contagem persistente de imóveis e parcerias)
    const cycleStart = (subRes.data as any)?.current_period_start ?? monthIso;

    const [freePlanRes, profileRes, propsRes, searchesRes, offersRes, creativesRes] = await Promise.all([
      supabase
        .from('subscription_plans')
        .select('id, slug, name, price, monthly_credits, features, feature_list')
        .eq('slug', 'conexao')
        .maybeSingle(),
      supabase.from('profiles').select('credit_balance').eq('id', user.id).maybeSingle(),
      // Imóveis: conta tudo criado no ciclo, ATIVO OU NÃO (slot fica reservado mesmo após exclusão)
      supabase.from('properties').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', cycleStart),
      // Parcerias (solicitações): mesma regra
      supabase.from('property_searches').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', cycleStart),
      supabase.from('property_search_offers').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', monthIso),
      supabase.from('creatives').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', monthIso),
    ]);

    const activePlan = (subRes.data as any)?.plan ?? freePlanRes.data ?? null;
    if (activePlan) {
      setPlan({
        id: activePlan.id,
        slug: activePlan.slug,
        name: activePlan.name,
        price: Number(activePlan.price),
        monthly_credits: activePlan.monthly_credits,
        features: (activePlan.features ?? FREE_FALLBACK) as PlanFeatures,
        feature_list: (activePlan.feature_list ?? []) as string[],
      });
    } else {
      setPlan({
        id: 'fallback',
        slug: 'conexao',
        name: 'Conexão',
        price: 0,
        monthly_credits: 10,
        features: FREE_FALLBACK,
        feature_list: [],
      });
    }

    setCreditBalance(profileRes.data?.credit_balance ?? 0);
    setUsage({
      portal_properties: propsRes.count ?? 0,
      partnership_requests: searchesRes.count ?? 0,
      partnership_offers: offersRes.count ?? 0,
      creatives_per_month: creativesRes.count ?? 0,
    });
    setLoading(false);
  }, [user, isAdmin]);

  useEffect(() => {
    if (permissionsLoading) return;
    load();
  }, [load, permissionsLoading]);

  const can = useCallback(
    (resource: LimitResource): CanResult => {
      // Admin: liberado para tudo, sem limites
      if (isAdmin) {
        return { allowed: true, limit: -1, used: 0, isUnlimited: true, remaining: Infinity };
      }
      const limit = plan?.features?.[resource] ?? 0;
      const usedKey = resource as keyof Usage;
      const used = (usage as any)[usedKey] ?? 0;
      const isUnlimited = limit === -1;

      if (isUnlimited) {
        return { allowed: true, limit: -1, used, isUnlimited: true, remaining: Infinity };
      }
      if (limit <= 0) {
        return {
          allowed: false,
          reason: `Seu plano ${plan?.name ?? ''} não inclui ${RESOURCE_LABELS[resource]}.`,
          limit,
          used,
          isUnlimited: false,
          remaining: 0,
        };
      }
      if (used >= limit) {
        return {
          allowed: false,
          reason: `Você atingiu o limite de ${limit} ${RESOURCE_LABELS[resource]} do plano ${plan?.name ?? ''}.`,
          limit,
          used,
          isUnlimited: false,
          remaining: 0,
        };
      }
      return { allowed: true, limit, used, isUnlimited: false, remaining: limit - used };
    },
    [plan, usage]
  );

  return { plan, usage, creditBalance, loading, can, refresh: load };
}
