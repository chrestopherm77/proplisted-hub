ALTER TABLE public.purchases
  ADD COLUMN IF NOT EXISTS first_contact_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS contact_count INTEGER NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.register_lead_contact(p_purchase_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_purchase RECORD;
BEGIN
  SELECT * INTO v_purchase FROM public.purchases WHERE id = p_purchase_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Compra não encontrada');
  END IF;
  IF v_purchase.user_id <> auth.uid() THEN
    RETURN jsonb_build_object('error', 'Não autorizado');
  END IF;

  UPDATE public.purchases
    SET first_contact_at = COALESCE(first_contact_at, now()),
        contact_count = COALESCE(contact_count, 0) + 1
    WHERE id = p_purchase_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_lead_contact(UUID) TO authenticated;