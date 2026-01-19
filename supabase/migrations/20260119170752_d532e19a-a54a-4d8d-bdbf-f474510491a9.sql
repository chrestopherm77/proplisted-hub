-- Create table to store WhatsApp verification codes
CREATE TABLE public.whatsapp_verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast phone lookup
CREATE INDEX idx_whatsapp_codes_phone ON public.whatsapp_verification_codes(phone);
CREATE INDEX idx_whatsapp_codes_expires_at ON public.whatsapp_verification_codes(expires_at);

-- Enable RLS
ALTER TABLE public.whatsapp_verification_codes ENABLE ROW LEVEL SECURITY;

-- Allow public insert (codes are temporary)
CREATE POLICY "Allow public insert" ON public.whatsapp_verification_codes
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Allow public select (for verification)
CREATE POLICY "Allow public select" ON public.whatsapp_verification_codes
  FOR SELECT TO anon, authenticated USING (true);

-- Allow public update (to mark as verified)
CREATE POLICY "Allow public update" ON public.whatsapp_verification_codes
  FOR UPDATE TO anon, authenticated USING (true);

-- Admin can delete expired codes
CREATE POLICY "Admins can delete" ON public.whatsapp_verification_codes
  FOR DELETE USING (has_role(auth.uid(), 'MASTER_ADMIN'::app_role));