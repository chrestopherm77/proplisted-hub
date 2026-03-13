CREATE TABLE public.login_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  logged_in_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all login history"
  ON public.login_history FOR SELECT
  USING (has_role(auth.uid(), 'MASTER_ADMIN'));

CREATE POLICY "Authenticated users can insert own login"
  ON public.login_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);