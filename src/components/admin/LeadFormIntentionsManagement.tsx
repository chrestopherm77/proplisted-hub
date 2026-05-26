import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface Row {
  intention: string;
  label: string;
  is_active: boolean;
  sort_order: number;
}

export function LeadFormIntentionsManagement() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('lead_form_intentions')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) {
      toast({ title: 'Erro ao carregar', description: error.message, variant: 'destructive' });
    } else {
      setRows((data ?? []) as Row[]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggle = async (intention: string, is_active: boolean) => {
    setRows((prev) => prev.map((r) => r.intention === intention ? { ...r, is_active } : r));
    const { error } = await supabase
      .from('lead_form_intentions')
      .update({ is_active, updated_at: new Date().toISOString() })
      .eq('intention', intention);
    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
      load();
    } else {
      toast({ title: is_active ? 'Opção ativada' : 'Opção desativada' });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Opções do Formulário (LP)</h2>
        <p className="text-sm text-muted-foreground">
          Ative ou desative as intenções que aparecem na primeira etapa do formulário das landing pages.
        </p>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Carregando…</div>
      ) : (
        <div className="grid gap-3">
          {rows.map((r) => (
            <Card key={r.intention} className="p-4 flex items-center justify-between">
              <div>
                <div className="font-medium">{r.label}</div>
                <div className="text-xs text-muted-foreground">{r.intention}</div>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor={`sw-${r.intention}`} className="text-sm">
                  {r.is_active ? 'Ativa' : 'Inativa'}
                </Label>
                <Switch
                  id={`sw-${r.intention}`}
                  checked={r.is_active}
                  onCheckedChange={(v) => toggle(r.intention, v)}
                />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
