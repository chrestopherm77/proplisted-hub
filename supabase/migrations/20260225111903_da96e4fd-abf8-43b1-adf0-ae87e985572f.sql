
-- Tabela de page views
CREATE TABLE public.lp_page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  user_agent text,
  referrer text,
  screen_width int,
  screen_height int,
  language text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.lp_page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous insert" ON public.lp_page_views
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view page views" ON public.lp_page_views
  FOR SELECT USING (public.has_role(auth.uid(), 'MASTER_ADMIN'::app_role));

-- Tabela de leads parciais
CREATE TABLE public.lp_partial_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  name text,
  phone text,
  intention text,
  current_step text,
  step_index int DEFAULT 0,
  total_steps int DEFAULT 0,
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.lp_partial_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous insert" ON public.lp_partial_leads
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous update by session" ON public.lp_partial_leads
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Admins can view partial leads" ON public.lp_partial_leads
  FOR SELECT USING (public.has_role(auth.uid(), 'MASTER_ADMIN'::app_role));

-- Trigger para updated_at
CREATE TRIGGER update_lp_partial_leads_updated_at
  BEFORE UPDATE ON public.lp_partial_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
