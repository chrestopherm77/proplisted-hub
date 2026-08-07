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
  const [paymentMethod, setPaymentMethod] = useState<'PIX_AUTOMATIC' | 'PIX' | 'CREDIT_CARD'>('PIX_AUTOMATIC');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [phone, setPhone] = useState('');
  const [pixAuto, setPixAuto] = useState<{ payload: string | null; image: string | null } | null>(null);

  useEffect(() => {
    if (!user || !open) return;
    setPixAuto(null);
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

      if (data.pixAutomatic) {
        setPixAuto({ payload: data.pixPayload ?? null, image: data.pixQrCodeImage ?? null });
        toast({
          title: 'Autorização criada!',
          description: 'Pague o QR Code para ativar o débito automático.',
        });
      } else if (data.invoiceUrl) {
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
            R$ {Number(plan.price).toFixed(2).replace('.', ',')}
            {plan.billing_cycle === 'YEARLY' ? '/ano' : plan.billing_cycle === 'QUARTERLY' ? '/trimestre' : '/mês'}
            {' '}— {plan.monthly_credits.toLocaleString('pt-BR')} créditos por cobrança
          </DialogDescription>
        </DialogHeader>

        {pixAuto ? (
          <div className="space-y-4 py-2 text-center">
            <p className="text-sm text-muted-foreground">
              Escaneie o QR Code abaixo no app do seu banco. Ao pagar esta primeira cobrança você também
              autoriza as próximas cobranças automáticas — não precisará pagar manualmente todo mês.
            </p>
            {pixAuto.image && (
              <img
                src={`data:image/png;base64,${pixAuto.image}`}
                alt="QR Code do Pix Automático da assinatura"
                className="mx-auto h-56 w-56 rounded-lg border"
              />
            )}
            {pixAuto.payload && (
              <div className="space-y-2">
                <Label>Pix copia e cola</Label>
                <Input readOnly value={pixAuto.payload} onFocus={(e) => e.currentTarget.select()} />
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    navigator.clipboard.writeText(pixAuto.payload!);
                    toast({ title: 'Código copiado!' });
                  }}
                >
                  Copiar código
                </Button>
              </div>
            )}
            <Button
              className="w-full"
              onClick={() => {
                onOpenChange(false);
                onSuccess?.();
              }}
            >
              Já paguei
            </Button>
          </div>
        ) : (
          <>
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
                <Label>Forma de pagamento</Label>
                <RadioGroup value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="PIX_AUTOMATIC" id="pix-auto" className="mt-1" />
                    <Label htmlFor="pix-auto" className="font-normal cursor-pointer">
                      Pix Automático (débito automático)
                      <span className="block text-xs text-muted-foreground">
                        Autorize uma vez e as próximas cobranças acontecem sozinhas.
                      </span>
                    </Label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="CREDIT_CARD" id="cc" className="mt-1" />
                    <Label htmlFor="cc" className="font-normal cursor-pointer">
                      Cartão de Crédito
                      <span className="block text-xs text-muted-foreground">Cobrança recorrente automática.</span>
                    </Label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="PIX" id="pix" className="mt-1" />
                    <Label htmlFor="pix" className="font-normal cursor-pointer">
                      Pix comum
                      <span className="block text-xs text-muted-foreground">
                        Você paga um novo QR Code a cada ciclo.
                      </span>
                    </Label>
                  </div>
                </RadioGroup>
                <p className="text-xs text-muted-foreground">Boleto não está disponível.</p>
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

