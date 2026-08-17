import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Send, Loader2 } from 'lucide-react';

type Intention = 'BUY' | 'RENT' | 'SELL' | 'BUILD';

const INTENTION_OPTIONS: { value: Intention; label: string }[] = [
  { value: 'BUY', label: 'Comprar' },
  { value: 'RENT', label: 'Alugar' },
  { value: 'SELL', label: 'Vender' },
  { value: 'BUILD', label: 'Construir' },
];

interface LogItem {
  at: string;
  phone: string;
  name: string;
  intention: Intention;
  ok: boolean;
  detail: string;
}

export function LeadFeedbackManualPanel() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [intention, setIntention] = useState<Intention>('BUY');
  const [sending, setSending] = useState(false);
  const [log, setLog] = useState<LogItem[]>([]);
  const { toast } = useToast();

  const handleSend = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      toast({ title: 'Telefone inválido', description: 'Informe DDD + número.', variant: 'destructive' });
      return;
    }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-lead-feedback', {
        body: { testPhone: digits, testName: name || null, testIntention: intention },
      });
      if (error) throw error;
      const ok = !!(data as any)?.ok;
      setLog((prev) => [
        {
          at: new Date().toISOString(),
          phone: digits,
          name: name || '—',
          intention,
          ok,
          detail: ok ? 'Webhook recebeu o disparo' : String((data as any)?.error || 'Falha no webhook'),
        },
        ...prev,
      ]);
      toast({
        title: ok ? 'Disparo enviado' : 'Falha no disparo',
        description: ok ? 'O webhook confirmou o recebimento.' : String((data as any)?.error || ''),
        variant: ok ? 'default' : 'destructive',
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setLog((prev) => [
        { at: new Date().toISOString(), phone: digits, name: name || '—', intention, ok: false, detail: msg },
        ...prev,
      ]);
      toast({ title: 'Erro ao disparar', description: msg, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  return (
    <Card translate="no">
      <CardHeader>
        <CardTitle>Disparo manual</CardTitle>
        <p className="text-sm text-muted-foreground">
          Envia a mensagem de feedback para um número avulso e mostra se o webhook recebeu.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="fb-name">Nome</Label>
            <Input id="fb-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do lead" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fb-phone">WhatsApp</Label>
            <Input
              id="fb-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="31991914663"
              inputMode="numeric"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Interesse</Label>
            <Select value={intention} onValueChange={(v) => setIntention(v as Intention)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INTENTION_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button onClick={handleSend} disabled={sending} className="w-full">
              {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Disparar
            </Button>
          </div>
        </div>

        {log.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Disparos desta sessão</p>
            <div className="rounded-md border divide-y">
              {log.map((l, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2 p-3 text-sm">
                  <Badge variant={l.ok ? 'default' : 'destructive'} className={l.ok ? 'bg-emerald-600 hover:bg-emerald-600' : ''}>
                    {l.ok ? 'Enviado' : 'Falhou'}
                  </Badge>
                  <span className="font-medium">{l.name}</span>
                  <span className="text-muted-foreground">{l.phone}</span>
                  <span className="text-muted-foreground">
                    {INTENTION_OPTIONS.find((o) => o.value === l.intention)?.label}
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {new Date(l.at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                  <span className="w-full text-xs text-muted-foreground">{l.detail}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
