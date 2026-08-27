import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Eye, EyeOff, Flame, Download, Ban, RotateCcw, CheckCircle, Megaphone, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CsvImport } from './CsvImport';
import { LeadEditDialog } from './LeadEditDialog';

interface Lead {
  id: string;
  name: string;
  phone: string;
  description: string;
  price: number;
  purchase_count: number;
  max_purchases: number;
  is_active: boolean;
  is_promotion: boolean;
  is_exhausted: boolean;
  whatsapp_confirmed: boolean;
  created_at: string | null;
  form_data?: any;
}

export function LeadsManagement() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [periodFilter, setPeriodFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    description: '',
    price: '',
    max_purchases: '5',
  });

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast({
        title: 'Erro ao carregar leads',
        description: 'Não foi possível carregar os leads',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const leadData = {
        name: formData.name,
        phone: formData.phone,
        description: formData.description,
        price: parseFloat(formData.price),
        max_purchases: parseInt(formData.max_purchases),
        is_active: true,
      };

      if (editingLead) {
        const { error } = await supabase
          .from('leads')
          .update(leadData)
          .eq('id', editingLead.id);

        if (error) throw error;

        toast({
          title: 'Lead atualizado!',
          description: 'Lead atualizado com sucesso',
        });
      } else {
        const { error } = await supabase
          .from('leads')
          .insert([leadData]);

        if (error) throw error;

        toast({
          title: 'Lead criado!',
          description: 'Lead criado com sucesso',
        });
      }

      setIsDialogOpen(false);
      setEditingLead(null);
      setFormData({ name: '', phone: '', description: '', price: '', max_purchases: '5' });
      fetchLeads();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível salvar o lead',
        variant: 'destructive',
      });
    }
  };

  const toggleLeadStatus = async (lead: Lead) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ is_active: !lead.is_active })
        .eq('id', lead.id);

      if (error) throw error;

      toast({
        title: 'Status atualizado!',
        description: `Lead ${!lead.is_active ? 'ativado' : 'desativado'} com sucesso`,
      });
      fetchLeads();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status',
        variant: 'destructive',
      });
    }
  };

  const togglePromotion = async (lead: Lead) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ is_promotion: !lead.is_promotion })
        .eq('id', lead.id);

      if (error) throw error;

      toast({
        title: !lead.is_promotion ? '🔥 Promoção ativada!' : 'Promoção removida',
        description: `Lead ${!lead.is_promotion ? 'marcado como promoção' : 'removido da promoção'}`,
      });
      fetchLeads();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a promoção',
        variant: 'destructive',
      });
    }
  };

  const toggleExhausted = async (lead: Lead) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ is_exhausted: !lead.is_exhausted })
        .eq('id', lead.id);

      if (error) throw error;

      toast({
        title: !lead.is_exhausted ? '🚫 Lead esgotado!' : 'Lead reativado',
        description: `Lead ${!lead.is_exhausted ? 'marcado como esgotado' : 'removido do esgotamento'}`,
      });
      fetchLeads();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o lead',
        variant: 'destructive',
      });
    }
  };

  const deleteLead = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este lead?')) return;

    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Lead excluído!',
        description: 'Lead excluído com sucesso',
      });
      fetchLeads();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o lead',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (lead: Lead) => {
    setEditingLead(lead);
    setIsEditOpen(true);
  };

  const formatCredits = (price: number) => {
    return `${Math.round(price)} créditos`;
  };

  const formatBRL = (price: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
  };

  const filteredLeads = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return leads.filter((l) => {
      const matchesPeriod = (() => {
        if (periodFilter === 'all') return true;
        const days = parseInt(periodFilter);
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        return l.created_at && new Date(l.created_at) >= cutoff;
      })();

      const matchesSearch =
        !query ||
        l.name?.toLowerCase().includes(query) ||
        l.phone?.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && l.is_active) ||
        (statusFilter === 'inactive' && !l.is_active);

      return matchesPeriod && matchesSearch && matchesStatus;
    });
  }, [leads, periodFilter, searchQuery, statusFilter]);

  const exportLeadsCsv = () => {
    const headers = ['Nome', 'Telefone', 'Descrição', 'Créditos', 'Vendas', 'Max Vendas', 'Promoção', 'Status', 'Data Cadastro'];
    const rows = filteredLeads.map((l) => [
      l.name,
      l.phone,
      l.description,
      Math.round(l.price),
      l.purchase_count,
      l.max_purchases,
      l.is_promotion ? 'Sim' : 'Não',
      l.is_active ? 'Ativo' : 'Inativo',
      l.created_at ? new Date(l.created_at).toLocaleDateString('pt-BR') : '',
    ]);
    const csvContent = '\uFEFF' + [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: `${filteredLeads.length} leads exportados` });
  };

  if (loading) {
    return <div className="text-center py-12">Carregando leads...</div>;
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <CsvImport onImportComplete={fetchLeads} />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h2 className="text-xl md:text-2xl font-bold">Gerenciar Leads</h2>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou telefone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'all' | 'active' | 'inactive')}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="inactive">Inativos</SelectItem>
            </SelectContent>
          </Select>
          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="15">Últimos 15 dias</SelectItem>
              <SelectItem value="20">Últimos 20 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={exportLeadsCsv} disabled={filteredLeads.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => { 
                setEditingLead(null); 
                setFormData({ name: '', phone: '', description: '', price: '', max_purchases: '5' }); 
              }}
              size="sm"
              className="w-full sm:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingLead ? 'Editar Lead' : 'Novo Lead'}</DialogTitle>
              <DialogDescription>
                {editingLead ? 'Atualize as informações do lead' : 'Adicione um novo lead ao marketplace'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="price">Créditos</Label>
                <Input
                  id="price"
                  type="number"
                  step="1"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="max_purchases">Máximo de Vendas</Label>
                <Input
                  id="max_purchases"
                  type="number"
                  value={formData.max_purchases}
                  onChange={(e) => setFormData({ ...formData, max_purchases: e.target.value })}
                  required
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingLead ? 'Atualizar' : 'Criar'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="grid gap-3 md:gap-4">
        {filteredLeads.map((lead) => (
          <Card key={lead.id}>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="text-base md:text-lg">{lead.name}</CardTitle>
                    <Badge
                      variant="outline"
                      className="text-xs font-mono cursor-pointer hover:bg-muted"
                      title="Clique para copiar o ID completo"
                      onClick={() => {
                        navigator.clipboard.writeText(lead.id);
                        toast({ title: 'ID copiado', description: lead.id });
                      }}
                    >
                      Lead #{lead.id.slice(0, 5).toUpperCase()}
                    </Badge>
                  </div>
                  <CardDescription className="text-sm">
                    {lead.phone}
                    {lead.created_at && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        • Cadastrado em {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </CardDescription>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {!lead.whatsapp_confirmed && !lead.is_active && (
                    <Badge className="text-xs bg-yellow-500 hover:bg-yellow-500 text-white border-transparent">
                      ⏳ Aguardando confirmação
                    </Badge>
                  )}
                  {lead.whatsapp_confirmed && (
                    <Badge className="text-xs bg-green-600 hover:bg-green-600 text-white border-transparent">
                      ✅ Confirmado via WhatsApp
                    </Badge>
                  )}
                  {lead.is_exhausted && (
                    <Badge variant="destructive" className="text-xs">
                      🚫 Esgotado
                    </Badge>
                  )}
                  {lead.is_promotion && (
                    <Badge className="text-xs animate-pulse bg-orange-500 hover:bg-orange-500 text-white border-transparent">
                      🔥 Promoção
                    </Badge>
                  )}
                  <Badge variant={lead.is_active ? 'default' : 'secondary'} className="text-xs">
                    {lead.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {lead.purchase_count}/{lead.max_purchases} vendidos
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs md:text-sm text-muted-foreground mb-3">{lead.description}</p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <span className="text-base md:text-lg font-bold text-primary">{formatCredits(lead.price)} <span className="text-sm font-normal text-muted-foreground">({formatBRL(lead.price)})</span></span>
                <div className="flex gap-2 w-full sm:w-auto">
                  {!lead.whatsapp_confirmed && !lead.is_active && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        try {
                          await supabase.from('leads').update({ is_active: true, whatsapp_confirmed: true }).eq('id', lead.id);
                          toast({ title: 'Lead ativado manualmente' });

                          // Dispara notificações em paralelo (não bloqueante)
                          Promise.allSettled([
                            supabase.functions.invoke('notify-new-lead', { body: { leadId: lead.id } }),
                            supabase.functions.invoke('notify-lead-group', { body: { leadId: lead.id } }),
                          ]).then((results) => {
                            const [emailRes, groupRes] = results;
                            if (emailRes.status === 'fulfilled' && !(emailRes.value as any)?.error) {
                              toast({ title: '📧 E-mails enviados aos corretores' });
                            } else {
                              toast({ title: 'Falha ao disparar e-mails', variant: 'destructive' });
                            }
                            if (groupRes.status === 'fulfilled' && !(groupRes.value as any)?.error) {
                              toast({ title: '📣 Notificação enviada ao grupo WhatsApp' });
                            } else {
                              toast({ title: 'Falha ao disparar grupo WhatsApp', variant: 'destructive' });
                            }
                          });

                          fetchLeads();
                        } catch { toast({ title: 'Erro', variant: 'destructive' }); }
                      }}
                      className="flex-1 sm:flex-none h-8 bg-green-600 hover:bg-green-700 text-white"
                      title="Ativar manualmente"
                    >
                      <CheckCircle className="h-3 w-3 md:h-4 md:w-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant={lead.is_promotion ? "default" : "outline"}
                    onClick={() => togglePromotion(lead)}
                    className={`flex-1 sm:flex-none h-8 ${lead.is_promotion ? 'bg-orange-500 hover:bg-orange-600 text-white' : ''}`}
                    title={lead.is_promotion ? 'Remover promoção' : 'Marcar como promoção'}
                  >
                    <Flame className="h-3 w-3 md:h-4 md:w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={lead.is_exhausted ? "default" : "outline"}
                    onClick={() => toggleExhausted(lead)}
                    className={`flex-1 sm:flex-none h-8 ${lead.is_exhausted ? 'bg-red-600 hover:bg-red-700 text-white' : ''}`}
                    title={lead.is_exhausted ? 'Reativar lead' : 'Esgotar lead'}
                  >
                    {lead.is_exhausted ? <RotateCcw className="h-3 w-3 md:h-4 md:w-4" /> : <Ban className="h-3 w-3 md:h-4 md:w-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      try {
                        const { data, error } = await supabase.functions.invoke('notify-lead-group', {
                          body: { leadId: lead.id },
                        });
                        if (error || (data && (data as any).error)) {
                          const msg = (data as any)?.error || error?.message || 'Erro desconhecido';
                          throw new Error(msg);
                        }
                        toast({ title: '✅ Notificação enviada ao grupo WhatsApp!' });
                      } catch (err: any) {
                        const msg: string = err?.message || '';
                        const isMegaDown = msg.includes('tentativas') || msg.includes('instável') || msg.includes('WhatsApp');
                        toast({
                          title: 'Falha ao disparar no grupo',
                          description: isMegaDown
                            ? 'A API do WhatsApp está retornando erro. Tente novamente em alguns minutos.'
                            : (msg || 'Erro desconhecido'),
                          variant: 'destructive',
                        });
                      }
                    }}
                    className="flex-1 sm:flex-none h-8"
                    title="Disparar no grupo WhatsApp"
                  >
                    <Megaphone className="h-3 w-3 md:h-4 md:w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleLeadStatus(lead)}
                    className="flex-1 sm:flex-none h-8"
                  >
                    {lead.is_active ? <EyeOff className="h-3 w-3 md:h-4 md:w-4" /> : <Eye className="h-3 w-3 md:h-4 md:w-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditDialog(lead)}
                    className="flex-1 sm:flex-none h-8"
                  >
                    <Edit className="h-3 w-3 md:h-4 md:w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteLead(lead.id)}
                    className="flex-1 sm:flex-none h-8"
                  >
                    <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredLeads.length === 0 && (
        <div className="text-center py-8 md:py-12">
          <p className="text-sm md:text-base text-muted-foreground">Nenhum lead cadastrado</p>
        </div>
      )}

      <LeadEditDialog
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open);
          if (!open) setEditingLead(null);
        }}
        lead={editingLead}
        onSaved={() => {
          setIsEditOpen(false);
          setEditingLead(null);
          fetchLeads();
        }}
      />
    </div>
  );
}
