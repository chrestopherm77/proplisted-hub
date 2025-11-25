-- Add RLS policy to allow users to view leads they purchased (even if inactive)
CREATE POLICY "Users can view purchased leads"
ON public.leads
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.purchases 
    WHERE purchases.lead_id = leads.id 
      AND purchases.user_id = auth.uid() 
      AND purchases.status = 'PAID'
  )
);