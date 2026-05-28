import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Loader2, MessageCircle, Trash2, RefreshCw } from 'lucide-react';
import { buildWaLink, formatPhoneBR } from '@/lib/whatsapp';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FinancingLead {
  id: string;
  name: string;
  whatsapp: string;
  property_value: string | null;
  down_payment: string | null;
  term: string | null;
  monthly_income: string | null;
  modality: string | null;
  notes: string | null;
  source: string | null;
  status: string;
  created_at: string;
}

const STATUS_OPTIONS = [
  { value: 'NEW', label: 'Novo' },
  { value: 'CONTACTED', label: 'Contatado' },
  { value: 'NEGOTIATING', label: 'Em negociação' },
  { value: 'CLOSED', label: 'Fechado' },
  { value: 'LOST', label: 'Perdido' },
];

const STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-800',
  CONTACTED: 'bg-yellow-100 text-yellow-800',
  NEGOTIATING: 'bg-purple-100 text-purple-800',
  CLOSED: 'bg-green-100 text-green-800',
  LOST: 'bg-red-100 text-red-800',
};

export function FinancingLeadsManagement() {
  const { toast } = useToast();
  const [leads, setLeads] = useState<FinancingLead[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeads = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('financing_leads')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      toast({ title: 'Erro ao carregar', description: error.message, variant: 'destructive' });
    } else {
      setLeads((data as FinancingLead[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchLeads(); }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('financing_leads').update({ status }).eq('id', id);
    if (error) {
      toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' });
    } else {
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    }
  };

  const removeLead = async (id: string) => {
    if (!confirm('Excluir este pedido de simulação?')) return;
    const { error } = await supabase.from('financing_leads').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
    } else {
      setLeads((prev) => prev.filter((l) => l.id !== id));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pedidos de Financiamento</h1>
          <p className="text-sm text-muted-foreground">
            Simulações enviadas pelo portal ConectaEImob
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchLeads}>
          <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : leads.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          Nenhum pedido recebido ainda.
        </CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {leads.map((lead) => (
            <Card key={lead.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <CardTitle className="text-lg">{lead.name}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(lead.created_at), "d 'de' MMM 'às' HH:mm", { locale: ptBR })}
                      {lead.source ? ` · ${lead.source}` : ''}
                    </p>
                  </div>
                  <Badge className={STATUS_COLORS[lead.status] || ''}>
                    {STATUS_OPTIONS.find((s) => s.value === lead.status)?.label || lead.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  <Info label="WhatsApp" value={formatPhoneBR(lead.whatsapp)} />
                  <Info label="Valor do imóvel" value={lead.property_value} />
                  <Info label="Entrada" value={lead.down_payment} />
                  <Info label="Prazo" value={lead.term} />
                  <Info label="Renda mensal" value={lead.monthly_income} />
                  <Info label="Modalidade" value={lead.modality} />
                </div>
                <div className="flex items-center gap-2 flex-wrap pt-2 border-t">
                  <Button asChild size="sm" className="bg-green-600 hover:bg-green-700">
                    <a
                      href={buildWaLink(lead.whatsapp, `Olá ${lead.name}, recebi sua simulação de financiamento na ConectaEImob.`)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle className="h-4 w-4 mr-1" /> WhatsApp
                    </a>
                  </Button>
                  <Select value={lead.status} onValueChange={(v) => updateStatus(lead.id, v)}>
                    <SelectTrigger className="w-44 h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="sm" onClick={() => removeLead(lead.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

const Info = ({ label, value }: { label: string; value: string | null }) => (
  <div>
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="font-medium">{value || '—'}</p>
  </div>
);
