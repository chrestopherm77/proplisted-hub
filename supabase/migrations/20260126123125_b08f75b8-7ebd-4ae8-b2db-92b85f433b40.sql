-- Create table for email verification codes
CREATE TABLE public.email_verification_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.email_verification_codes ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is used before authentication)
CREATE POLICY "Allow public insert for email verification"
ON public.email_verification_codes
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public select for email verification"
ON public.email_verification_codes
FOR SELECT
USING (true);

CREATE POLICY "Allow public update for email verification"
ON public.email_verification_codes
FOR UPDATE
USING (true);

CREATE POLICY "Admins can delete verification codes"
ON public.email_verification_codes
FOR DELETE
USING (has_role(auth.uid(), 'MASTER_ADMIN'::app_role));

-- Create index for faster lookups
CREATE INDEX idx_email_verification_codes_email ON public.email_verification_codes(email);
CREATE INDEX idx_email_verification_codes_expires_at ON public.email_verification_codes(expires_at);