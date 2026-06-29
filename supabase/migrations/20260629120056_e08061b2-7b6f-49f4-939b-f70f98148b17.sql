
-- 1) password_reset_tokens explicit deny SELECT
DROP POLICY IF EXISTS "Deny all SELECT on password_reset_tokens" ON public.password_reset_tokens;
CREATE POLICY "Deny all SELECT on password_reset_tokens"
  ON public.password_reset_tokens FOR SELECT TO public USING (false);

-- 2) whatsapp_verification_codes deny SELECT
DROP POLICY IF EXISTS "Deny all SELECT on whatsapp_verification_codes" ON public.whatsapp_verification_codes;
CREATE POLICY "Deny all SELECT on whatsapp_verification_codes"
  ON public.whatsapp_verification_codes FOR SELECT TO public USING (false);

-- 3) signup_progress: user can read own row
DROP POLICY IF EXISTS "Users can view own signup progress" ON public.signup_progress;
CREATE POLICY "Users can view own signup progress"
  ON public.signup_progress FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- 4) lp_partial_leads: drop unsafe session-based UPDATE
DROP POLICY IF EXISTS "Allow anonymous update of own session row" ON public.lp_partial_leads;
DROP POLICY IF EXISTS "Admins can update partial leads" ON public.lp_partial_leads;
CREATE POLICY "Admins can update partial leads"
  ON public.lp_partial_leads FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'MASTER_ADMIN'::app_role))
  WITH CHECK (has_role(auth.uid(), 'MASTER_ADMIN'::app_role));

-- 5) support-attachments: private read
DROP POLICY IF EXISTS "Public read support attachments" ON storage.objects;
DROP POLICY IF EXISTS "Owners read own support attachments" ON storage.objects;
CREATE POLICY "Owners read own support attachments"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'support-attachments'
    AND (
      has_role(auth.uid(), 'MASTER_ADMIN'::app_role)
      OR (auth.uid())::text = (storage.foldername(name))[1]
    )
  );

-- 6) launches bucket: ownership required on update/delete
DROP POLICY IF EXISTS "Users can delete own launch files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own launch files" ON storage.objects;
CREATE POLICY "Users can delete own launch files"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'launches'
    AND (
      has_role(auth.uid(), 'MASTER_ADMIN'::app_role)
      OR (auth.uid())::text = (storage.foldername(name))[1]
    )
  );
CREATE POLICY "Users can update own launch files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'launches'
    AND (
      has_role(auth.uid(), 'MASTER_ADMIN'::app_role)
      OR (auth.uid())::text = (storage.foldername(name))[1]
    )
  )
  WITH CHECK (
    bucket_id = 'launches'
    AND (
      has_role(auth.uid(), 'MASTER_ADMIN'::app_role)
      OR (auth.uid())::text = (storage.foldername(name))[1]
    )
  );

-- 7) Set search_path on remaining function
ALTER FUNCTION public.immutable_unaccent_lower(text) SET search_path = public, pg_catalog;

-- 8) Lockdown SECURITY DEFINER functions: revoke from PUBLIC/anon, grant to authenticated/service_role
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname='public' AND p.prosecdef=true
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC', r.sig);
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.sig);
  END LOOP;
END $$;

-- Re-grant anon access for explicitly public functions
GRANT EXECUTE ON FUNCTION public.list_land_searches_public() TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_property(text) TO anon;
GRANT EXECUTE ON FUNCTION public.increment_public_video_view(text) TO anon;
GRANT EXECUTE ON FUNCTION public.check_phone_availability(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_groups_for_city(text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_invite_url_for_city(text, text) TO anon;
