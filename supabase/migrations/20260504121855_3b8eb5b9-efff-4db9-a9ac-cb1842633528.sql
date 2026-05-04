
CREATE TABLE public.user_activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  event_label TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_activity_log_user_id ON public.user_activity_log(user_id);
CREATE INDEX idx_user_activity_log_created_at ON public.user_activity_log(created_at DESC);
CREATE INDEX idx_user_activity_log_user_created ON public.user_activity_log(user_id, created_at DESC);
CREATE INDEX idx_user_activity_log_event_type ON public.user_activity_log(event_type);

ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all activity" ON public.user_activity_log FOR SELECT
  USING (public.has_role(auth.uid(), 'MASTER_ADMIN'::app_role));
CREATE POLICY "Admins can manage activity" ON public.user_activity_log FOR ALL
  USING (public.has_role(auth.uid(), 'MASTER_ADMIN'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'MASTER_ADMIN'::app_role));
CREATE POLICY "Users can insert own activity" ON public.user_activity_log FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own activity" ON public.user_activity_log FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.log_user_activity(
  p_user_id UUID, p_event_type TEXT, p_event_label TEXT, p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_user_id IS NULL THEN RETURN; END IF;
  INSERT INTO public.user_activity_log (user_id, event_type, event_label, metadata)
  VALUES (p_user_id, p_event_type, p_event_label, COALESCE(p_metadata, '{}'::jsonb));
END; $$;

CREATE OR REPLACE FUNCTION public.trg_log_signup()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.log_user_activity(NEW.id, 'SIGNUP', 'Concluiu o cadastro na plataforma',
    jsonb_build_object('person_type', NEW.person_type, 'name', NEW.name, 'email', NEW.email));
  RETURN NEW;
END; $$;
CREATE TRIGGER user_activity_signup AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.trg_log_signup();

CREATE OR REPLACE FUNCTION public.trg_log_profile_completed()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (OLD.profile_completed IS DISTINCT FROM NEW.profile_completed) AND NEW.profile_completed = true THEN
    PERFORM public.log_user_activity(NEW.id, 'PROFILE_COMPLETED', 'Completou o perfil', '{}'::jsonb);
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER user_activity_profile_completed AFTER UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.trg_log_profile_completed();

CREATE OR REPLACE FUNCTION public.trg_log_login()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.log_user_activity(NEW.user_id, 'LOGIN', 'Fez login no sistema', '{}'::jsonb);
  RETURN NEW;
END; $$;
CREATE TRIGGER user_activity_login AFTER INSERT ON public.login_history
FOR EACH ROW EXECUTE FUNCTION public.trg_log_login();

CREATE OR REPLACE FUNCTION public.trg_log_lead_purchase()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'PAID' THEN
    PERFORM public.log_user_activity(NEW.user_id, 'LEAD_PURCHASE', 'Comprou um lead no Balcão',
      jsonb_build_object('lead_id', NEW.lead_id, 'amount', NEW.amount, 'payment_method', NEW.payment_method));
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER user_activity_lead_purchase AFTER INSERT ON public.purchases
FOR EACH ROW EXECUTE FUNCTION public.trg_log_lead_purchase();

CREATE OR REPLACE FUNCTION public.trg_log_credit_purchase()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.status = 'PAID')
     OR (TG_OP = 'UPDATE' AND NEW.status = 'PAID' AND OLD.status IS DISTINCT FROM 'PAID') THEN
    PERFORM public.log_user_activity(NEW.user_id, 'CREDIT_PURCHASE', 'Comprou créditos',
      jsonb_build_object('credits', NEW.credits, 'amount', NEW.amount));
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER user_activity_credit_purchase AFTER INSERT OR UPDATE ON public.credit_purchases
FOR EACH ROW EXECUTE FUNCTION public.trg_log_credit_purchase();

CREATE OR REPLACE FUNCTION public.trg_log_property_published()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.log_user_activity(NEW.user_id, 'PROPERTY_PUBLISHED', 'Publicou um imóvel no Portal',
    jsonb_build_object('property_id', NEW.id, 'title', NEW.title, 'reference_code', NEW.reference_code, 'city', NEW.city));
  RETURN NEW;
END; $$;
CREATE TRIGGER user_activity_property_published AFTER INSERT ON public.properties
FOR EACH ROW EXECUTE FUNCTION public.trg_log_property_published();

CREATE OR REPLACE FUNCTION public.trg_log_launch_published()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.log_user_activity(NEW.user_id, 'LAUNCH_PUBLISHED', 'Publicou um lançamento',
    jsonb_build_object('launch_id', NEW.id, 'name', NEW.name, 'city', NEW.city));
  RETURN NEW;
END; $$;
CREATE TRIGGER user_activity_launch_published AFTER INSERT ON public.launches
FOR EACH ROW EXECUTE FUNCTION public.trg_log_launch_published();

CREATE OR REPLACE FUNCTION public.trg_log_property_search()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.log_user_activity(NEW.user_id, 'PROPERTY_SEARCH_CREATED', 'Criou uma captação no Balcão',
    jsonb_build_object('search_id', NEW.id, 'title', NEW.title, 'city', NEW.city, 'operation_type', NEW.operation_type));
  RETURN NEW;
END; $$;
CREATE TRIGGER user_activity_property_search AFTER INSERT ON public.property_searches
FOR EACH ROW EXECUTE FUNCTION public.trg_log_property_search();

CREATE OR REPLACE FUNCTION public.trg_log_creative()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.log_user_activity(NEW.user_id, 'CREATIVE_GENERATED', 'Gerou um criativo',
    jsonb_build_object('creative_id', NEW.id, 'style_slug', NEW.style_slug, 'format', NEW.format));
  RETURN NEW;
END; $$;
CREATE TRIGGER user_activity_creative AFTER INSERT ON public.creatives
FOR EACH ROW EXECUTE FUNCTION public.trg_log_creative();

CREATE OR REPLACE FUNCTION public.trg_log_lead_alert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.log_user_activity(NEW.user_id, 'LEAD_ALERT_CREATED', 'Criou um alerta de lead',
    jsonb_build_object('alert_id', NEW.id, 'filters', NEW.filters));
  RETURN NEW;
END; $$;
CREATE TRIGGER user_activity_lead_alert AFTER INSERT ON public.lead_alerts
FOR EACH ROW EXECUTE FUNCTION public.trg_log_lead_alert();

-- Backfill
INSERT INTO public.user_activity_log (user_id, event_type, event_label, metadata, created_at)
SELECT p.id, 'SIGNUP', 'Concluiu o cadastro na plataforma',
  jsonb_build_object('person_type', p.person_type, 'name', p.name, 'email', p.email), p.created_at
FROM public.profiles p WHERE p.created_at IS NOT NULL;

INSERT INTO public.user_activity_log (user_id, event_type, event_label, metadata, created_at)
SELECT p.id, 'PROFILE_COMPLETED', 'Completou o perfil', '{}'::jsonb, COALESCE(p.updated_at, p.created_at, now())
FROM public.profiles p WHERE p.profile_completed = true;

INSERT INTO public.user_activity_log (user_id, event_type, event_label, metadata, created_at)
SELECT lh.user_id, 'LOGIN', 'Fez login no sistema', '{}'::jsonb, lh.logged_in_at
FROM public.login_history lh;

INSERT INTO public.user_activity_log (user_id, event_type, event_label, metadata, created_at)
SELECT pu.user_id, 'LEAD_PURCHASE', 'Comprou um lead no Balcão',
  jsonb_build_object('lead_id', pu.lead_id, 'amount', pu.amount, 'payment_method', pu.payment_method),
  COALESCE(pu.payment_confirmed_at, pu.purchased_at, now())
FROM public.purchases pu WHERE pu.status = 'PAID';

INSERT INTO public.user_activity_log (user_id, event_type, event_label, metadata, created_at)
SELECT cp.user_id, 'CREDIT_PURCHASE', 'Comprou créditos',
  jsonb_build_object('credits', cp.credits, 'amount', cp.amount),
  COALESCE(cp.confirmed_at, cp.created_at, now())
FROM public.credit_purchases cp WHERE cp.status = 'PAID';

INSERT INTO public.user_activity_log (user_id, event_type, event_label, metadata, created_at)
SELECT pr.user_id, 'PROPERTY_PUBLISHED', 'Publicou um imóvel no Portal',
  jsonb_build_object('property_id', pr.id, 'title', pr.title, 'reference_code', pr.reference_code, 'city', pr.city),
  pr.created_at
FROM public.properties pr;

INSERT INTO public.user_activity_log (user_id, event_type, event_label, metadata, created_at)
SELECT l.user_id, 'LAUNCH_PUBLISHED', 'Publicou um lançamento',
  jsonb_build_object('launch_id', l.id, 'name', l.name, 'city', l.city), l.created_at
FROM public.launches l WHERE l.created_at IS NOT NULL;

INSERT INTO public.user_activity_log (user_id, event_type, event_label, metadata, created_at)
SELECT ps.user_id, 'PROPERTY_SEARCH_CREATED', 'Criou uma captação no Balcão',
  jsonb_build_object('search_id', ps.id, 'title', ps.title, 'city', ps.city, 'operation_type', ps.operation_type),
  ps.created_at
FROM public.property_searches ps WHERE ps.created_at IS NOT NULL;

INSERT INTO public.user_activity_log (user_id, event_type, event_label, metadata, created_at)
SELECT c.user_id, 'CREATIVE_GENERATED', 'Gerou um criativo',
  jsonb_build_object('creative_id', c.id, 'style_slug', c.style_slug, 'format', c.format), c.created_at
FROM public.creatives c;

INSERT INTO public.user_activity_log (user_id, event_type, event_label, metadata, created_at)
SELECT la.user_id, 'LEAD_ALERT_CREATED', 'Criou um alerta de lead',
  jsonb_build_object('alert_id', la.id, 'filters', la.filters), la.created_at
FROM public.lead_alerts la WHERE la.created_at IS NOT NULL;
