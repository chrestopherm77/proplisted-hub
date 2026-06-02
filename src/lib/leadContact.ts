import { supabase } from '@/integrations/supabase/client';

/**
 * Registra o primeiro contato (clique no WhatsApp) do corretor com o lead.
 * Idempotente: só atualiza first_contact_at na primeira vez.
 */
export async function registerLeadContact(purchaseId: string): Promise<void> {
  if (!purchaseId) return;
  try {
    const { error } = await supabase.rpc('register_lead_contact', { p_purchase_id: purchaseId });
    if (error) console.error('[registerLeadContact]', error.message);
  } catch (e) {
    console.error('[registerLeadContact]', e);
  }
}
