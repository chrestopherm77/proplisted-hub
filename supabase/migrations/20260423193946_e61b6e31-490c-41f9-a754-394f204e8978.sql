
-- Tabela de planos
CREATE TABLE public.subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  monthly_credits INTEGER NOT NULL DEFAULT 0,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  features JSONB NOT NULL DEFAULT '{}'::jsonb,
  feature_list JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view active plans"
  ON public.subscription_plans FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins manage all plans"
  ON public.subscription_plans FOR ALL
  USING (has_role(auth.uid(), 'MASTER_ADMIN'::app_role))
  WITH CHECK (has_role(auth.uid(), 'MASTER_ADMIN'::app_role));

CREATE TRIGGER trg_subscription_plans_updated
BEFORE UPDATE ON public.subscription_plans
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela de assinaturas dos usuários
CREATE TABLE public.user_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  asaas_subscription_id TEXT,
  asaas_customer_id TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  next_due_date DATE,
  payment_method TEXT,
  invoice_url TEXT,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uniq_user_active_subscription
  ON public.user_subscriptions(user_id)
  WHERE status = 'ACTIVE';

CREATE INDEX idx_user_subscriptions_user ON public.user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_asaas ON public.user_subscriptions(asaas_subscription_id);

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own subscription"
  ON public.user_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own subscription"
  ON public.user_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage all subscriptions"
  ON public.user_subscriptions FOR ALL
  USING (has_role(auth.uid(), 'MASTER_ADMIN'::app_role))
  WITH CHECK (has_role(auth.uid(), 'MASTER_ADMIN'::app_role));

CREATE TRIGGER trg_user_subscriptions_updated
BEFORE UPDATE ON public.user_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela de pagamentos da assinatura (histórico mensal)
CREATE TABLE public.subscription_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID NOT NULL REFERENCES public.user_subscriptions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  asaas_payment_id TEXT UNIQUE,
  amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  paid_at TIMESTAMPTZ,
  due_date DATE,
  payment_method TEXT,
  invoice_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscription_payments_sub ON public.subscription_payments(subscription_id);
CREATE INDEX idx_subscription_payments_user ON public.subscription_payments(user_id);

ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own subscription payments"
  ON public.subscription_payments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins manage all subscription payments"
  ON public.subscription_payments FOR ALL
  USING (has_role(auth.uid(), 'MASTER_ADMIN'::app_role))
  WITH CHECK (has_role(auth.uid(), 'MASTER_ADMIN'::app_role));

-- Seed dos 4 planos
INSERT INTO public.subscription_plans (slug, name, price, monthly_credits, display_order, features, feature_list) VALUES
('conexao', 'CONEXÃO', 0, 10, 1,
 jsonb_build_object(
   'partnership_requests', 1,
   'partnership_offers', 5,
   'portal_properties', 3,
   'launches_access', 'full',
   'financing_access', 'full',
   'news_access', 'full',
   'calculator_access', 'full',
   'creatives_per_month', 1,
   'leads_included', 0,
   'hot_seat_per_month', 0,
   'training_level', 'basic'
 ),
 jsonb_build_array(
   '1 solicitação de parceria',
   'Até 5 ofertas de parceria',
   'Até 3 imóveis no portal',
   'Acesso full a lançamentos',
   'Acesso full a financiamentos',
   'Acesso full a notícias',
   'Acesso full Calculadora de emolumentos',
   '1 criativo imobiliário',
   'Acesso a treinamentos Básicos'
 )
),
('essencial', 'ESSENCIAL', 39.90, 30, 2,
 jsonb_build_object(
   'partnership_requests', 5,
   'partnership_offers', 10,
   'portal_properties', 10,
   'launches_access', 'full',
   'financing_access', 'full',
   'news_access', 'full',
   'calculator_access', 'full',
   'creatives_per_month', 3,
   'leads_included', 0,
   'hot_seat_per_month', 0,
   'training_level', 'intermediate'
 ),
 jsonb_build_array(
   '5 solicitações de parceria',
   'Até 10 ofertas de parceria',
   'Até 10 imóveis no portal',
   'Acesso full a lançamentos',
   'Acesso full a financiamentos',
   'Acesso full a notícias',
   'Acesso full Calculadora de emolumentos',
   '3 criativos imobiliários',
   'Acesso a treinamentos Básicos e Intermediários'
 )
),
('performance', 'PERFORMANCE', 79.90, 430, 3,
 jsonb_build_object(
   'partnership_requests', -1,
   'partnership_offers', -1,
   'portal_properties', -1,
   'launches_access', 'full',
   'financing_access', 'full',
   'news_access', 'full',
   'calculator_access', 'full',
   'creatives_per_month', 15,
   'leads_included', 2,
   'hot_seat_per_month', 2,
   'training_level', 'basic'
 ),
 jsonb_build_array(
   'Solicitações de parceria ilimitadas',
   'Ofertas de parceria ilimitadas',
   'Imóveis no portal ilimitados',
   'Acesso full a lançamentos',
   'Acesso full a financiamentos',
   'Acesso full a notícias',
   'Acesso full Calculadora de emolumentos',
   '15 criativos imobiliários',
   'Acesso a treinamentos Básicos',
   'Hot Seat 2x mês',
   '2 leads inclusos'
 )
),
('elite', 'ELITE', 149.90, 1000, 4,
 jsonb_build_object(
   'partnership_requests', -1,
   'partnership_offers', -1,
   'portal_properties', -1,
   'launches_access', 'full',
   'financing_access', 'full',
   'news_access', 'full',
   'calculator_access', 'full',
   'creatives_per_month', 30,
   'leads_included', 5,
   'hot_seat_per_month', 2,
   'training_level', 'basic'
 ),
 jsonb_build_array(
   'Solicitações de parceria ilimitadas',
   'Ofertas de parceria ilimitadas',
   'Imóveis no portal ilimitados',
   'Acesso full a lançamentos',
   'Acesso full a financiamentos',
   'Acesso full a notícias',
   'Acesso full Calculadora de emolumentos',
   '30 criativos imobiliários',
   'Acesso a treinamentos Básicos',
   'Hot Seat 2x mês',
   '5 leads inclusos'
 )
);
