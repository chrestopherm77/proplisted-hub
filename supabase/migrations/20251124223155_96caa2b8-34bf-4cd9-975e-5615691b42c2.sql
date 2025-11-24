-- Add column to store Asaas checkout ID for better webhook matching
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS asaas_checkout_id TEXT;

-- Create index for faster lookup by checkout ID
CREATE INDEX IF NOT EXISTS idx_purchases_checkout_id ON purchases(asaas_checkout_id);