import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CheckCircle2, Search } from 'lucide-react';

function maskPhone(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d{0,4})(\d{0,4}).*/, (_, a, b, c) => [a && `(${a})`, b, c && `-${c}`].filter(Boolean).join(' ').trim());
  return d.replace(/(\d{2})(\d{5})(\d{0,4}).*/, '($1) $2-$3');
}

export function InterestDialog({ open, onOpenChange, property, onExplore }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  property: any;
  onExplore: () => void;
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const reset = () => { setDone(false); setLoading(false); };

  const submit = async () => {
    const digits = phone.replace(/\D/g, '');
    if (name.trim().length < 3) return toast.error('Informe seu nome completo');
    if (digits.length < 10) return toast.error('Informe um WhatsApp válido com DDD');

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('create_portal_property_lead', {
        p_property_id: property.id,
        p_name: name.trim(),
        p_phone: digits,
        p_source: 'PORTAL_CONECTAE',
      } as any);
      if (error) throw error;
      const res = data as any;
      if (res && res.success === false) throw new Error(res.error || 'Não foi possível registrar');

      // Dispara webhook (não bloqueante)
      supabase.functions.invoke('portal-lead-webhook', { body: { lead_id: res?.lead_id } }).catch(() => {});

      setDone(true);
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao enviar interesse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="sm:max-w-md">
        {done ? (
          <div className="text-center py-2">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <DialogHeader>
              <DialogTitle className="text-center">Que bom que você gostou deste imóvel!</DialogTitle>
              <DialogDescription className="text-center">
                Recebemos seu interesse. Um parceiro responsável por este imóvel vai entrar em contato com você pelo WhatsApp.
                <br /><br />
                Enquanto isso, continue explorando outros imóveis do portal. Selecione quantos imóveis quiser — os parceiros
                vão entrar em contato com você sobre cada um deles.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-2 mt-5">
              <Button variant="outline" className="flex-1" onClick={() => { onOpenChange(false); reset(); }}>Fechar</Button>
              <Button className="flex-1" onClick={() => { onOpenChange(false); reset(); onExplore(); }}>
                <Search className="h-4 w-4 mr-2" /> Ver outros imóveis
              </Button>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Tenho interesse neste imóvel</DialogTitle>
              <DialogDescription>
                Deixe seu nome e WhatsApp. Um parceiro entrará em contato com você sobre o imóvel
                {property?.reference_code ? ` Ref. ${property.reference_code}` : ''}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label htmlFor="pc-name">Nome completo</Label>
                <Input id="pc-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" maxLength={120} />
              </div>
              <div>
                <Label htmlFor="pc-phone">WhatsApp</Label>
                <Input id="pc-phone" value={phone} onChange={(e) => setPhone(maskPhone(e.target.value))} placeholder="(11) 99999-9999" inputMode="numeric" />
              </div>
              <Button className="w-full" onClick={submit} disabled={loading}>
                {loading ? 'Enviando...' : 'Quero saber mais'}
              </Button>
              <p className="text-[11px] text-muted-foreground text-center">
                Ao enviar, você autoriza o contato de um parceiro da Conectaê sobre este imóvel.
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
