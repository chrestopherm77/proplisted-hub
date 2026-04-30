
CREATE TABLE public.signup_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id text NOT NULL UNIQUE,
  email text,
  phone text,
  name text,
  person_type text,
  profession text,
  company_type text,
  current_step integer NOT NULL DEFAULT 1,
  step_label text,
  total_steps integer,
  form_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_signup_progress_updated_at ON public.signup_progress (updated_at DESC);
CREATE INDEX idx_signup_progress_completed ON public.signup_progress (completed);
CREATE INDEX idx_signup_progress_email ON public.signup_progress (email);

ALTER TABLE public.signup_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage signup progress"
  ON public.signup_progress
  FOR ALL
  USING (public.has_role(auth.uid(), 'MASTER_ADMIN'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'MASTER_ADMIN'::app_role));

CREATE TRIGGER trg_signup_progress_updated_at
  BEFORE UPDATE ON public.signup_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RPC pública para o formulário gravar progresso sem login
CREATE OR REPLACE FUNCTION public.upsert_signup_progress(
  p_session_id text,
  p_payload jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text := lower(nullif(trim(p_payload->>'email'), ''));
  v_phone text := nullif(trim(p_payload->>'phone'), '');
  v_name text := nullif(trim(p_payload->>'name'), '');
  v_person_type text := nullif(trim(p_payload->>'person_type'), '');
  v_profession text := nullif(trim(p_payload->>'profession'), '');
  v_company_type text := nullif(trim(p_payload->>'company_type'), '');
  v_current_step integer := COALESCE((p_payload->>'current_step')::int, 1);
  v_step_label text := nullif(trim(p_payload->>'step_label'), '');
  v_total_steps integer := NULLIF(p_payload->>'total_steps','')::int;
  v_form_data jsonb := COALESCE(p_payload->'form_data', '{}'::jsonb);
  v_completed boolean := COALESCE((p_payload->>'completed')::boolean, false);
  v_user_id uuid := NULLIF(p_payload->>'user_id','')::uuid;
BEGIN
  IF p_session_id IS NULL OR length(trim(p_session_id)) = 0 THEN
    RAISE EXCEPTION 'session_id is required';
  END IF;

  INSERT INTO public.signup_progress (
    session_id, email, phone, name, person_type, profession, company_type,
    current_step, step_label, total_steps, form_data, completed, completed_at, user_id
  ) VALUES (
    p_session_id, v_email, v_phone, v_name, v_person_type, v_profession, v_company_type,
    v_current_step, v_step_label, v_total_steps, v_form_data, v_completed,
    CASE WHEN v_completed THEN now() ELSE NULL END, v_user_id
  )
  ON CONFLICT (session_id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, public.signup_progress.email),
    phone = COALESCE(EXCLUDED.phone, public.signup_progress.phone),
    name = COALESCE(EXCLUDED.name, public.signup_progress.name),
    person_type = COALESCE(EXCLUDED.person_type, public.signup_progress.person_type),
    profession = COALESCE(EXCLUDED.profession, public.signup_progress.profession),
    company_type = COALESCE(EXCLUDED.company_type, public.signup_progress.company_type),
    current_step = EXCLUDED.current_step,
    step_label = COALESCE(EXCLUDED.step_label, public.signup_progress.step_label),
    total_steps = COALESCE(EXCLUDED.total_steps, public.signup_progress.total_steps),
    form_data = EXCLUDED.form_data,
    completed = public.signup_progress.completed OR EXCLUDED.completed,
    completed_at = CASE
      WHEN public.signup_progress.completed_at IS NOT NULL THEN public.signup_progress.completed_at
      WHEN EXCLUDED.completed THEN now()
      ELSE NULL
    END,
    user_id = COALESCE(EXCLUDED.user_id, public.signup_progress.user_id),
    updated_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_signup_progress(text, jsonb) TO anon, authenticated;
