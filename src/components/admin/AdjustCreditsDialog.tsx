import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Coins } from 'lucide-react';

interface AdjustCreditsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  currentBalance: number;
  onSuccess: (newBalance: number) => void;
}

export function AdjustCreditsDialog({
  open,
  onOpenChange,
  userId,
  userName,
  currentBalance,
  onSuccess,
}: AdjustCreditsDialogProps) {
  const [operation, setOperation] = useState<'ADD' | 'REMOVE'>('ADD');
  const [amount, setAmount] = useState<string>('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const numericAmount = parseInt(amount) || 0;
  const delta = operation === 'ADD' ? numericAmount : -numericAmount;
  const previewBalance = currentBalance + delta;
  const wouldBeNegative = previewBalance < 0;
  const canSubmit = numericAmount > 0 && !wouldBeNegative && !loading;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);

    const { data, error } = await supabase.functions.invoke('admin-adjust-credits', {
      body: { user_id: userId, amount: numericAmount, operation, reason: reason || undefined },
    });

    setLoading(false);

    if (error || data?.error) {
      toast({
        title: 'Erro',
        description: data?.error || 'Não foi possível ajustar o saldo',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Saldo atualizado',
      description: `Novo saldo: ${data.new_balance} créditos`,
    });
    onSuccess(data.new_balance);
    setAmount('');
    setReason('');
    setOperation('ADD');
    onOpenChange(false);
  };

  const handleClose = (next: boolean) => {
    if (!next) {
      setAmount('');
      setReason('');
      setOperation('ADD');
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ajustar créditos</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md border p-3 bg-muted/30">
            <p className="text-sm font-medium">{userName}</p>
            <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
              <Coins className="h-4 w-4 text-yellow-500" />
              Saldo atual: <span className="font-semibold text-foreground">{currentBalance}</span> créditos
            </div>
          </div>

          <div className="space-y-2">
            <Label>Operação</Label>
            <RadioGroup value={operation} onValueChange={(v) => setOperation(v as 'ADD' | 'REMOVE')} className="flex gap-4">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="ADD" id="op-add" />
                <Label htmlFor="op-add" className="font-normal cursor-pointer">Adicionar</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="REMOVE" id="op-remove" />
                <Label htmlFor="op-remove" className="font-normal cursor-pointer">Remover</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Quantidade</Label>
            <Input
              id="amount"
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="Ex: 10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Motivo (opcional)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Bônus de boas-vindas, ajuste manual, reembolso..."
              rows={3}
              maxLength={500}
            />
          </div>

          {numericAmount > 0 && (
            <div className={`rounded-md border p-3 text-sm ${wouldBeNegative ? 'border-destructive bg-destructive/10 text-destructive' : 'bg-muted/30'}`}>
              {wouldBeNegative ? (
                <>O saldo ficaria negativo ({previewBalance}). Operação bloqueada.</>
              ) : (
                <>
                  Novo saldo: <span className="font-semibold">{previewBalance}</span> créditos
                </>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {loading ? 'Salvando...' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
