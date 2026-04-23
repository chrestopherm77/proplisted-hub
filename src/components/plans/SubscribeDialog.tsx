import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { PlanCardData } from './PlanCard';

interface SubscribeDialogProps {
  plan: PlanCardData | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess?: () => void;
}

export const SubscribeDialog = ({ plan, open, onOpenChange, onSuccess }: SubscribeDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CREDIT_CARD'>('PIX');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (!user || !open) return;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('name, company_name, cpf, cnpj, phone')
        .eq('id', user.id)
        .maybeSingle();
      if (data) {
        setName(data.name || data.company_name || '');
        setCpfCnpj(data.cpf || data.cnpj || '');
        setPhone(data.phone || '');
      }
      setEmail(user.email || '');
    })();
  }, [user, open]);

  const handleSubmit = async () => {
    if (!plan) return;
    if (!name || !email || !cpfCnpj) {
      toast({ title: 'Preencha os campos', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: {
          planId: plan.id,
          paymentMethod,
          customerData: { name, email, cpfCnpj, phone },
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data.invoiceUrl) {
        toast({ title: 'Redirecionando para pagamento...' });
        window.location.href = data.invoiceUrl;
      } else {
        toast({ title: 'Assinatura criada!', description: 'Acesse seu perfil para acompanhar.' });
        onOpenChange(false);
        onSuccess?.();
      }
    } catch (err: any) {
      toast({ title: 'Erro ao assinar', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (!plan) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assinar {plan.name}</DialogTitle>
          <DialogDescription>
            R$ {Number(plan.price).toFixed(2).replace('.', ',')}/mês — {plan.monthly_credits} créditos mensais
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Nome completo / Razão social</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>E-mail</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>CPF/CNPJ</Label>
              <Input value={cpfCnpj} onChange={(e) => setCpfCnpj(e.target.value)} placeholder="Sem pontos" />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(00) 00000-0000" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Forma de pagamento preferida</Label>
            <RadioGroup value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="PIX" id="pix" />
                <Label htmlFor="pix" className="font-normal cursor-pointer">PIX</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="CREDIT_CARD" id="cc" />
                <Label htmlFor="cc" className="font-normal cursor-pointer">Cartão de Crédito</Label>
              </div>
            </RadioGroup>
            <p className="text-xs text-muted-foreground">
              Você poderá escolher novamente a forma de pagamento na tela do Asaas.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Criando...</> : 'Continuar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
