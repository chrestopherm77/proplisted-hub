
-- Saldo de créditos no perfil
ALTER TABLE public.profiles ADD COLUMN credit_balance integer NOT NULL DEFAULT 0;

-- Pacotes de créditos
CREATE TABLE public.credit_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric NOT NULL,
  credits integer NOT NULL,
  lead_count integer NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.credit_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active packages" ON public.credit_packages
  FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "Admins can manage packages" ON public.credit_packages
  FOR ALL TO public USING (has_role(auth.uid(), 'MASTER_ADMIN'));

-- Histórico de compras de créditos
CREATE TABLE public.credit_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  package_id uuid REFERENCES public.credit_packages(id),
  credits integer NOT NULL,
  amount numeric NOT NULL,
  asaas_checkout_id text,
  asaas_payment_id text,
  status text DEFAULT 'PENDING',
  payment_method text,
  created_at timestamptz DEFAULT now(),
  confirmed_at timestamptz
);

ALTER TABLE public.credit_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credit purchases" ON public.credit_purchases
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credit purchases" ON public.credit_purchases
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage credit purchases" ON public.credit_purchases
  FOR ALL TO public USING (has_role(auth.uid(), 'MASTER_ADMIN'));

-- Histórico de uso de créditos
CREATE TABLE public.credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lead_id uuid,
  credits_used integer NOT NULL,
  type text NOT NULL DEFAULT 'LEAD_PURCHASE',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" ON public.credit_transactions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage transactions" ON public.credit_transactions
  FOR ALL TO public USING (has_role(auth.uid(), 'MASTER_ADMIN'));

-- Inserir pacotes
INSERT INTO public.credit_packages (name, price, credits, lead_count) VALUES
  ('Pacote 1 Lead', 28, 140, 1),
  ('Pacote 5 Leads', 125, 625, 5),
  ('Pacote 10 Leads', 220, 1100, 10),
  ('Pacote 15 Leads', 300, 1500, 15),
  ('Pacote 25 Leads', 475, 2375, 25),
  ('Pacote 50 Leads', 850, 4250, 50);

-- Função atômica para comprar lead com créditos
CREATE OR REPLACE FUNCTION public.purchase_lead_with_credits(p_user_id uuid, p_lead_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_profile record;
  v_lead record;
  v_existing_purchase uuid;
  v_new_count integer;
  v_max integer;
  v_active boolean;
BEGIN
  -- Lock profile row
  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Perfil não encontrado');
  END IF;

  -- Lock lead row
  SELECT * INTO v_lead FROM leads WHERE id = p_lead_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Lead não encontrado');
  END IF;

  IF NOT v_lead.is_active THEN
    RETURN jsonb_build_object('error', 'Este lead não está mais disponível');
  END IF;

  IF v_lead.purchase_count >= COALESCE(v_lead.max_purchases, 3) THEN
    RETURN jsonb_build_object('error', 'Este lead já atingiu o limite de vendas');
  END IF;

  -- Check existing purchase
  SELECT id INTO v_existing_purchase FROM purchases
    WHERE user_id = p_user_id AND lead_id = p_lead_id AND status = 'PAID' LIMIT 1;
  IF v_existing_purchase IS NOT NULL THEN
    RETURN jsonb_build_object('error', 'Você já possui este lead');
  END IF;

  -- Check credit balance (price = credits cost)
  IF v_profile.credit_balance < v_lead.price THEN
    RETURN jsonb_build_object('error', 'Saldo de créditos insuficiente', 'needed', v_lead.price::integer, 'balance', v_profile.credit_balance);
  END IF;

  -- Deduct credits
  UPDATE profiles SET credit_balance = credit_balance - v_lead.price::integer WHERE id = p_user_id;

  -- Create purchase
  INSERT INTO purchases (user_id, lead_id, amount, status, payment_confirmed_at, payment_method)
  VALUES (p_user_id, p_lead_id, v_lead.price, 'PAID', now(), 'CREDITS');

  -- Record transaction
  INSERT INTO credit_transactions (user_id, lead_id, credits_used, type)
  VALUES (p_user_id, p_lead_id, v_lead.price::integer, 'LEAD_PURCHASE');

  -- Increment purchase count
  UPDATE leads SET purchase_count = COALESCE(purchase_count, 0) + 1 WHERE id = p_lead_id
  RETURNING purchase_count, max_purchases INTO v_new_count, v_max;

  v_active := v_new_count < COALESCE(v_max, 3);
  UPDATE leads SET is_active = v_active WHERE id = p_lead_id;

  -- Remove from cart
  DELETE FROM shopping_cart WHERE user_id = p_user_id AND lead_id = p_lead_id;

  RETURN jsonb_build_object('success', true, 'message', 'Lead comprado com sucesso!', 'credits_used', v_lead.price::integer, 'new_balance', v_profile.credit_balance - v_lead.price::integer);
END;
$$;
