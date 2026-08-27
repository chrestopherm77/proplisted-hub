import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Check, X } from 'lucide-react';

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Em análise',
  APPROVED: 'Aprovado',
  REJECTED: 'Recusado',
};

export function BenefitsManagement() {
  const { toast } = useToast();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('benefits' as any)
      .select('*, benefit_partners(company_name)')
      .order('created_at', { ascending: false });
    setRows((data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const update = async (id: string, patch: Record<string, any>) => {
    const { error } = await supabase.from('benefits' as any).update(patch).eq('id', id);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    load();
  };

  return (
    <Card>
      <CardHeader><CardTitle>Benefícios</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : rows.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Nenhum benefício cadastrado.</p>
        ) : rows.map((b) => (
          <div key={b.id} className="border rounded-lg p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3 min-w-0">
              {b.banner_url && <img src={b.banner_url} alt="" className="h-14 w-20 object-cover rounded" />}
              <div className="min-w-0">
                <p className="font-medium truncate">{b.title}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {b.benefit_partners?.company_name}
                  {' · '}
                  {b.discount_label || (b.discount_percent ? `${Number(b.discount_percent)}% OFF` : '')}
                  {b.city ? ` · ${b.city}${b.state ? ' - ' + b.state : ''}` : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Badge variant={b.status === 'APPROVED' ? 'default' : b.status === 'REJECTED' ? 'destructive' : 'secondary'}>
                {STATUS_LABEL[b.status] || b.status}
              </Badge>
              <div className="flex items-center gap-1 text-sm">
                <Switch checked={b.is_active} onCheckedChange={(v) => update(b.id, { is_active: v })} />
                <span className="text-muted-foreground">Ativo</span>
              </div>
              <Button size="sm" onClick={() => update(b.id, { status: 'APPROVED' })} disabled={b.status === 'APPROVED'}>
                <Check className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="destructive" onClick={() => update(b.id, { status: 'REJECTED' })} disabled={b.status === 'REJECTED'}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
