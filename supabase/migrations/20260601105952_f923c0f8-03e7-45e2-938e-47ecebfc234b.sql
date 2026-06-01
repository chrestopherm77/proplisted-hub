-- Add owner column
ALTER TABLE public.land_searches ADD COLUMN IF NOT EXISTS user_id uuid;
CREATE INDEX IF NOT EXISTS idx_land_searches_user_id ON public.land_searches(user_id);

-- Permissions table (similar to launch_permissions)
CREATE TABLE IF NOT EXISTS public.land_search_publish_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  granted_by uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.land_search_publish_permissions TO authenticated;
GRANT ALL ON public.land_search_publish_permissions TO service_role;

ALTER TABLE public.land_search_publish_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage land search publish permissions"
  ON public.land_search_publish_permissions
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'MASTER_ADMIN'::app_role))
  WITH CHECK (has_role(auth.uid(), 'MASTER_ADMIN'::app_role));

CREATE POLICY "Users view own land search publish permission"
  ON public.land_search_publish_permissions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Helper function
CREATE OR REPLACE FUNCTION public.can_publish_land_search(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.land_search_publish_permissions WHERE user_id = _user_id);
$$;

-- Allow authorized users to manage their own land_searches
CREATE POLICY "Authorized users insert own land searches"
  ON public.land_searches
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND can_publish_land_search(auth.uid()));

CREATE POLICY "Authorized users update own land searches"
  ON public.land_searches
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND can_publish_land_search(auth.uid()))
  WITH CHECK (auth.uid() = user_id AND can_publish_land_search(auth.uid()));

CREATE POLICY "Authorized users delete own land searches"
  ON public.land_searches
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id AND can_publish_land_search(auth.uid()));

CREATE POLICY "Owner views own land search"
  ON public.land_searches
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Allow authorized users to manage areas for their own land_search
CREATE POLICY "Authorized users manage own land search areas"
  ON public.land_search_areas
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.land_searches ls WHERE ls.id = land_search_id AND ls.user_id = auth.uid() AND can_publish_land_search(auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.land_searches ls WHERE ls.id = land_search_id AND ls.user_id = auth.uid() AND can_publish_land_search(auth.uid())));