-- 1. Atomic credit balance update function
CREATE OR REPLACE FUNCTION public.add_credits_atomic(
  p_user_id uuid,
  p_amount integer,
  p_type text DEFAULT 'CREDIT_PURCHASE',
  p_lead_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_balance integer;
BEGIN
  IF p_amount IS NULL OR p_amount = 0 THEN
    RETURN jsonb_build_object('error', 'Invalid amount');
  END IF;

  UPDATE public.profiles
  SET credit_balance = GREATEST(0, COALESCE(credit_balance, 0) + p_amount)
  WHERE id = p_user_id
  RETURNING credit_balance INTO v_new_balance;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Profile not found');
  END IF;

  INSERT INTO public.credit_transactions (user_id, lead_id, credits_used, type)
  VALUES (p_user_id, p_lead_id, p_amount, p_type);

  RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);
END;
$$;

-- 2. lp_partial_leads UPDATE policy: scope by session_id from header
DROP POLICY IF EXISTS "Allow anonymous update by session" ON public.lp_partial_leads;

CREATE POLICY "Allow update only by matching session"
  ON public.lp_partial_leads
  FOR UPDATE
  TO anon, authenticated
  USING (
    session_id = COALESCE(
      current_setting('request.headers', true)::json->>'x-lp-session-id',
      ''
    )
    AND session_id <> ''
  )
  WITH CHECK (
    session_id = COALESCE(
      current_setting('request.headers', true)::json->>'x-lp-session-id',
      ''
    )
    AND session_id <> ''
  );

-- 3. Remove lp_partial_leads from realtime publication (PII broadcast)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'lp_partial_leads'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.lp_partial_leads';
  END IF;
END $$;

-- 4. Realtime channel topic restrictions: users can only subscribe to topics
--    that start with their own user_id (e.g., "creatives:<uid>")
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'messages' AND relnamespace = 'realtime'::regnamespace) THEN
    -- Drop any prior overly-permissive policy from us (idempotent)
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated can subscribe to own topics" ON realtime.messages';

    EXECUTE $POL$
      CREATE POLICY "Authenticated can subscribe to own topics"
      ON realtime.messages
      FOR SELECT
      TO authenticated
      USING (
        realtime.topic() LIKE (auth.uid()::text || ':%')
        OR realtime.topic() LIKE ('%:' || auth.uid()::text)
        OR realtime.topic() = auth.uid()::text
      )
    $POL$;
  END IF;
END $$;

-- 5. Idempotency: prevent the same Asaas payment from being credited twice.
--    We track by asaas_payment_id on credit_purchases (already partially unique by usage),
--    but add a hard unique index here for safety.
CREATE UNIQUE INDEX IF NOT EXISTS idx_credit_purchases_asaas_payment_unique
  ON public.credit_purchases (asaas_payment_id)
  WHERE asaas_payment_id IS NOT NULL AND status = 'PAID';