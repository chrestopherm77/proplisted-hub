
CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_percent integer NOT NULL,
  is_active boolean DEFAULT true,
  max_uses integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage coupons"
  ON public.coupons FOR ALL
  USING (has_role(auth.uid(), 'MASTER_ADMIN'));

CREATE POLICY "Authenticated can read active coupons"
  ON public.coupons FOR SELECT TO authenticated
  USING (is_active = true);

CREATE TABLE public.coupon_usages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL REFERENCES coupons(id),
  user_id uuid NOT NULL,
  used_at timestamptz DEFAULT now(),
  UNIQUE(coupon_id, user_id)
);

ALTER TABLE public.coupon_usages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage coupon usages"
  ON public.coupon_usages FOR ALL
  USING (has_role(auth.uid(), 'MASTER_ADMIN'));

CREATE POLICY "Users can view own usages"
  ON public.coupon_usages FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usages"
  ON public.coupon_usages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
