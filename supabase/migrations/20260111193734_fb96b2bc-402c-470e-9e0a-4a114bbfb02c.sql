-- Create lead_submissions table for storing form responses
CREATE TABLE public.lead_submissions (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  
  -- Contact data
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  
  -- Main intention
  intention TEXT NOT NULL CHECK (intention IN ('SELL', 'BUY', 'BUILD', 'RENT')),
  
  -- Structured form data (flexible JSON)
  form_data JSONB NOT NULL DEFAULT '{}',
  
  -- Control
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSED', 'CONVERTED')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for searches
CREATE INDEX idx_lead_submissions_intention ON public.lead_submissions(intention);
CREATE INDEX idx_lead_submissions_status ON public.lead_submissions(status);
CREATE INDEX idx_lead_submissions_created ON public.lead_submissions(created_at DESC);

-- Enable RLS
ALTER TABLE public.lead_submissions ENABLE ROW LEVEL SECURITY;

-- Allow anonymous insert (public form)
CREATE POLICY "Allow anonymous insert" ON public.lead_submissions
  FOR INSERT WITH CHECK (true);

-- Allow admins to view all submissions
CREATE POLICY "Admins can view all submissions" ON public.lead_submissions
  FOR SELECT USING (has_role(auth.uid(), 'MASTER_ADMIN'::app_role));

-- Allow admins to manage submissions
CREATE POLICY "Admins can manage submissions" ON public.lead_submissions
  FOR ALL USING (has_role(auth.uid(), 'MASTER_ADMIN'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_lead_submissions_updated_at
  BEFORE UPDATE ON public.lead_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();