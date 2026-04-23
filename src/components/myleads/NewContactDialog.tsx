import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CrmStage, STAGES } from './types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onCreated: () => void;
}

export function NewContactDialog({ open, onOpenChange, userId, onCreated }: Props) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [stage, setStage] = useState<CrmStage>('ENTRADA');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const reset = () => {
    setName(''); setPhone(''); setEmail(''); setDescription('');
    setStage('ENTRADA'); setNotes('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      toast({ title: 'Nome e telefone são obrigatórios', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('lead_crm_status').insert({
        user_id: userId,
        stage,
        notes: notes.trim() || null,
        is_manual: true,
        manual_name: name.trim(),
        manual_phone: phone.trim(),
        manual_email: email.trim() || null,
        manual_description: description.trim() || null,
      } as any);
      if (error) throw error;
      toast({ title: 'Contato adicionado!', description: 'O contato foi criado no seu CRM.' });
      reset();
      onOpenChange(false);
      onCreated();
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Erro ao criar contato', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo Contato</DialogTitle>
          <DialogDescription>
            Adicione manualmente um contato ao seu CRM para gerenciá-lo junto com seus leads.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nc-name">Nome *</Label>
            <Input id="nc-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do contato" required />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="nc-phone">Telefone *</Label>
              <Input id="nc-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-9999" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nc-email">E-mail</Label>
              <Input id="nc-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nc-stage">Etapa inicial</Label>
            <Select value={stage} onValueChange={(v) => setStage(v as CrmStage)}>
              <SelectTrigger id="nc-stage"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STAGES.map((s) => (
                  <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nc-desc">Interesse / Resumo</Label>
            <Textarea
              id="nc-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Comprar apto 2 quartos em Belo Horizonte até R$ 500.000"
              className="min-h-[70px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nc-notes">Anotações</Label>
            <Textarea
              id="nc-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações, follow-ups, próximos passos..."
              className="min-h-[80px]"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Adicionar Contato
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
