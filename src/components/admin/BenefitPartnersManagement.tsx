import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Check, X } from 'lucide-react';

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Em análise',
  APPROVED: 'Aprovado',
  REJECTED: 'Recusado',
};

export function BenefitPartnersManagement() {
  const { toast } = useToast();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('benefit_partners' as any)
      .select('*')
      .order('created_at', { ascending: false });
    setRows((data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('benefit_partners' as any)
      .update({ status, admin_notes: notes[id] || null })
      .eq('id', id);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    toast({ title: `Parceiro ${status === 'APPROVED' ? 'aprovado' : 'recusado'}` });
    load();
  };

  return (
    <Card>
      <CardHeader><CardTitle>Parceiros de Benefícios</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : rows.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Nenhum parceiro cadastrado.</p>
        ) : rows.map((p) => (
          <div key={p.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium">{p.company_name}</p>
                <p className="text-sm text-muted-foreground">
                  {p.contact_name} · {p.email} · {p.phone}
                </p>
              </div>
              <Badge variant={p.status === 'APPROVED' ? 'default' : p.status === 'REJECTED' ? 'destructive' : 'secondary'}>
                {STATUS_LABEL[p.status] || p.status}
              </Badge>
            </div>
            <Textarea
              placeholder="Observações internas / motivo da recusa"
              value={notes[p.id] ?? p.admin_notes ?? ''}
              onChange={(e) => setNotes({ ...notes, [p.id]: e.target.value })}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setStatus(p.id, 'APPROVED')} disabled={p.status === 'APPROVED'}>
                <Check className="h-4 w-4 mr-1" /> Aprovar
              </Button>
              <Button size="sm" variant="destructive" onClick={() => setStatus(p.id, 'REJECTED')} disabled={p.status === 'REJECTED'}>
                <X className="h-4 w-4 mr-1" /> Recusar
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
