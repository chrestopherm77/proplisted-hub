
-- Create vouchers table
CREATE TABLE public.vouchers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  max_uses integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage vouchers" ON public.vouchers
  FOR ALL TO public
  USING (has_role(auth.uid(), 'MASTER_ADMIN'::app_role));

CREATE POLICY "Authenticated can read active vouchers" ON public.vouchers
  FOR SELECT TO authenticated
  USING (is_active = true);

-- Create voucher_redemptions table
CREATE TABLE public.voucher_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_id uuid NOT NULL REFERENCES public.vouchers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  redeemed_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.voucher_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage redemptions" ON public.voucher_redemptions
  FOR ALL TO public
  USING (has_role(auth.uid(), 'MASTER_ADMIN'::app_role));

CREATE POLICY "Users can view own redemptions" ON public.voucher_redemptions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
