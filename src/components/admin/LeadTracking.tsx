import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Eye, UserX, Clock, Monitor, MessageSquare, CheckCircle, Send } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatFormDataToSections } from '@/lib/formatFormData';
import { useToast } from '@/hooks/use-toast';

interface StandbyLead {
  id: string;
  name: string;
  phone: string;
  description: string;
  whatsapp_confirmed: boolean | null;
  is_active: boolean | null;
  created_at: string | null;
  form_data: any;
  confirmation_whatsapp_status: string | null;
  confirmation_whatsapp_error: string | null;
  confirmation_whatsapp_message_id: string | null;
  confirmation_whatsapp_sent_at: string | null;
}

interface PageView {
  id: string;
  session_id: string;
  user_agent: string | null;
  referrer: string | null;
  screen_width: number | null;
  screen_height: number | null;
  language: string | null;
  created_at: string | null;
}

interface PartialLead {
  id: string;
  session_id: string;
  name: string | null;
  phone: string | null;
  intention: string | null;
  current_step: string | null;
  step_index: number | null;
  total_steps: number | null;
  completed: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  form_data: any;
}

const intentionLabels: Record<string, string> = {
  SELL: 'Vender',
  BUY: 'Comprar',
  BUILD: 'Construir',
  RENT: 'Alugar',
};

const intentionColors: Record<string, string> = {
  SELL: 'bg-red-100 text-red-800',
  BUY: 'bg-blue-100 text-blue-800',
  BUILD: 'bg-amber-100 text-amber-800',
  RENT: 'bg-green-100 text-green-800',
};

const stepLabels: Record<string, string> = {
  'intention': 'Intenção',
  'contact': 'Contato',
  // Sell
  'sell-relation': 'Relação com imóvel',
  'sell-exclusivity': 'Exclusividade',
  'sell-property-type': 'Tipo de imóvel',
  'sell-commercial-type': 'Tipo comercial',
  'sell-residential-type': 'Tipo residencial',
  'sell-mixed-type': 'Tipo misto',
  'sell-rural-details': 'Detalhes rurais',
  'sell-general-info': 'Informações gerais',
  'sell-terrain-position': 'Posição do terreno',
  'sell-value': 'Valor',
  'sell-payment-methods': 'Formas de pagamento',
  'sell-property-status': 'Status do imóvel',
  'sell-documentation': 'Documentação',
  'sell-deadline': 'Prazo',
  // Buy
  'buy-purpose': 'Finalidade',
  'buy-property-type': 'Tipo de imóvel',
  'buy-residential-prefs': 'Preferências residenciais',
  'buy-commercial-prefs': 'Preferências comerciais',
  'buy-land-prefs': 'Preferências de terreno',
  'buy-location-budget': 'Localização e orçamento',
  'buy-payment-method': 'Forma de pagamento',
  'buy-deadline': 'Prazo',
  // Build
  'build-purpose': 'Finalidade',
  'build-land': 'Terreno',
  'build-topography': 'Topografia',
  'build-project': 'Projeto',
  'build-characteristics': 'Características',
  'build-knowledge': 'Conhecimento',
  'build-location': 'Localização',
  'build-bts-confirm': 'Confirmação BTS',
  'build-bts': 'Built To Suit',
  'build-budget': 'Orçamento',
  'build-payment': 'Pagamento',
  'build-deadline': 'Prazo',
  // Rent
  'rent-purpose': 'Finalidade',
  'rent-property-type': 'Tipo de imóvel',
  'rent-residential-prefs': 'Preferências residenciais',
  'rent-commercial-prefs': 'Preferências comerciais',
  'rent-location-value': 'Localização e valor',
  'rent-guarantee': 'Garantia',
};

function parseBrowser(ua: string | null): string {
  if (!ua) return 'Desconhecido';
  if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
  if (ua.includes('Edg')) return 'Edge';
  return 'Outro';
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

export function LeadTracking() {
  const [pageViews, setPageViews] = useState<PageView[]>([]);
  const [partialLeads, setPartialLeads] = useState<PartialLead[]>([]);
  const [totalViews, setTotalViews] = useState(0);
  const [chartData, setChartData] = useState<{ date: string; views: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<PartialLead | null>(null);

  const [standbyLeads, setStandbyLeads] = useState<StandbyLead[]>([]);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [webhookSendingId, setWebhookSendingId] = useState<string | null>(null);

  const [activatingId, setActivatingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('partial-leads-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'lp_partial_leads',
      }, (payload) => {
        const newLead = payload.new as PartialLead;
        if (!newLead.completed) {
          setPartialLeads(prev => [newLead, ...prev]);
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'lp_partial_leads',
      }, (payload) => {
        const updated = payload.new as PartialLead;
        if (updated.completed) {
          setPartialLeads(prev => prev.filter(l => l.id !== updated.id));
        } else {
          setPartialLeads(prev => prev.map(l => l.id === updated.id ? updated : l));
        }
        // Also update the selected lead modal if open
        setSelectedLead(prev => prev?.id === updated.id ? (updated.completed ? null : updated) : prev);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchData() {
    setLoading(true);
    const [viewsRes, partialsRes, submissionsRes, standbyRes] = await Promise.all([
      supabase
        .from('lp_page_views')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100),
      supabase
        .from('lp_partial_leads')
        .select('*')
        .eq('completed', false)
        .order('updated_at', { ascending: false })
        .limit(100),
      supabase
        .from('lead_submissions')
        .select('phone'),
      supabase
        .from('leads')
        .select('id, name, phone, description, whatsapp_confirmed, is_active, created_at, form_data, confirmation_whatsapp_status, confirmation_whatsapp_error, confirmation_whatsapp_message_id, confirmation_whatsapp_sent_at')
        .eq('whatsapp_confirmed', false)
        .eq('is_active', false)
        .order('created_at', { ascending: false }),
    ]);

    if (viewsRes.data) {
      setPageViews(viewsRes.data as PageView[]);
      setTotalViews(viewsRes.data.length);

      const grouped: Record<string, number> = {};
      viewsRes.data.forEach((v) => {
        const day = v.created_at ? new Date(v.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : 'N/A';
        grouped[day] = (grouped[day] || 0) + 1;
      });
      const chart = Object.entries(grouped).map(([date, views]) => ({ date, views })).reverse();
      setChartData(chart);
    }

    if (partialsRes.data) {
      const effectivePhones = new Set(
        (submissionsRes.data || []).map(s => s.phone?.replace(/\D/g, '')).filter(Boolean)
      );
      const filtered = (partialsRes.data as PartialLead[]).filter(
        lead => !lead.phone || !effectivePhones.has(lead.phone.replace(/\D/g, ''))
      );
      setPartialLeads(filtered);
    }

    if (standbyRes.data) {
      setStandbyLeads(standbyRes.data as StandbyLead[]);
    }

    setLoading(false);
  }

  async function handleActivateLead(leadId: string) {
    setActivatingId(leadId);
    const { error } = await supabase
      .from('leads')
      .update({ is_active: true, whatsapp_confirmed: true, updated_at: new Date().toISOString() })
      .eq('id', leadId);
    setActivatingId(null);
    if (error) {
      toast({ title: 'Erro ao ativar lead', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Lead ativado com sucesso!' });
      setStandbyLeads(prev => prev.filter(l => l.id !== leadId));
    }
  }

  async function handleResendConfirmation(lead: StandbyLead) {
    setResendingId(lead.id);
    try {
      const { data, error } = await supabase.functions.invoke('send-lead-confirmation', {
        body: { name: lead.name, phone: lead.phone, leadId: lead.id },
      });
      if (error) throw error;
      
      const status = data?.delivery_status;
      if (status === 'sent_interactive') {
        toast({ title: 'Confirmação reenviada via WhatsApp!', description: 'Mensagem interativa enviada com sucesso.' });
      } else if (status === 'sent_fallback_text') {
        toast({ title: 'Confirmação reenviada (texto simples)', description: 'A mensagem interativa falhou, mas o texto simples foi enviado.' });
      } else if (status === 'failed') {
        toast({ title: 'Falha no envio', description: data?.detail || 'Não foi possível enviar a mensagem.', variant: 'destructive' });
      } else {
        toast({ title: 'Confirmação reenviada via WhatsApp!' });
      }
    } catch (err: any) {
      toast({ title: 'Erro ao reenviar', description: err.message, variant: 'destructive' });
    }
    setResendingId(null);
  }

  async function handleSendPartialWebhook(lead: PartialLead) {
    setWebhookSendingId(lead.id);
    try {
      const { data, error } = await supabase.functions.invoke('partial-lead-webhook', {
        body: { partialLeadId: lead.id },
      });
      if (error) throw error;
      const ok = data?.processed > 0;
      toast({
        title: ok ? 'Lead enviado ao webhook!' : 'Falha no envio',
        description: ok ? undefined : (data?.results?.[0]?.error || 'Não foi possível enviar.'),
        variant: ok ? undefined : 'destructive',
      });
    } catch (err: any) {
      toast({ title: 'Erro ao disparar', description: err.message, variant: 'destructive' });
    }
    setWebhookSendingId(null);
  }


  const detailSections = selectedLead?.form_data && selectedLead?.intention
    ? formatFormDataToSections(selectedLead.intention, selectedLead.form_data)
    : [];

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Carregando dados de rastreamento...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Page Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalViews}</div>
            <p className="text-xs text-muted-foreground">Últimas 100 visitas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Leads em Espera</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{partialLeads.length}</div>
            <p className="text-xs text-muted-foreground">Não finalizaram o formulário</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aguardando WhatsApp</CardTitle>
            <MessageSquare className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{standbyLeads.length}</div>
            <p className="text-xs text-muted-foreground">Não confirmaram interesse</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de Abandono</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalViews > 0 ? Math.round((partialLeads.length / totalViews) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Leads parciais / visitas</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Visitas por dia</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis allowDecimals={false} fontSize={12} />
                <Tooltip />
                <Bar dataKey="views" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Leads aguardando confirmação WhatsApp */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Leads Aguardando Confirmação WhatsApp
            {standbyLeads.length > 0 && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-800 ml-2">{standbyLeads.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {standbyLeads.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">Nenhum lead aguardando confirmação.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Cadastro</TableHead>
                    <TableHead>Envio WhatsApp</TableHead>
                    <TableHead>Erro</TableHead>
                    <TableHead>Último Envio</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {standbyLeads.map((lead) => {
                    const wsStatus = lead.confirmation_whatsapp_status;
                    const statusLabel = wsStatus === 'sent_interactive' ? 'Interativo ✅'
                      : wsStatus === 'sent_fallback_text' ? 'Texto (fallback) ⚠️'
                      : wsStatus === 'failed' ? 'Falhou ❌'
                      : wsStatus ? wsStatus
                      : 'Não registrado';
                    const statusClass = wsStatus === 'sent_interactive' ? 'bg-green-50 text-green-700 border-green-200'
                      : wsStatus === 'sent_fallback_text' ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                      : wsStatus === 'failed' ? 'bg-red-50 text-red-700 border-red-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200';

                    return (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.name}</TableCell>
                      <TableCell>{lead.phone}</TableCell>
                      <TableCell className="text-xs">{formatDate(lead.created_at)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusClass}>
                          {statusLabel}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate" title={lead.confirmation_whatsapp_error || ''}>
                        {lead.confirmation_whatsapp_error || '-'}
                      </TableCell>
                      <TableCell className="text-xs">{formatDate(lead.confirmation_whatsapp_sent_at)}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={resendingId === lead.id}
                          onClick={() => handleResendConfirmation(lead)}
                          title="Reenviar confirmação WhatsApp"
                        >
                          <Send className="h-3.5 w-3.5 mr-1" />
                          {resendingId === lead.id ? 'Enviando...' : 'Reenviar'}
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          disabled={activatingId === lead.id}
                          onClick={() => handleActivateLead(lead.id)}
                          title="Ativar lead manualmente"
                        >
                          <CheckCircle className="h-3.5 w-3.5 mr-1" />
                          {activatingId === lead.id ? 'Ativando...' : 'Ativar'}
                        </Button>
                      </TableCell>
                    </TableRow>
                    );
                  })}

                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UserX className="h-5 w-5" />
            Leads em Espera
          </CardTitle>
        </CardHeader>
        <CardContent>
          {partialLeads.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">Nenhum lead parcial encontrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Intenção</TableHead>
                    <TableHead>Etapa</TableHead>
                    <TableHead>Progresso</TableHead>
                    <TableHead>Última Atividade</TableHead>
                    <TableHead className="text-right">Ações</TableHead>

                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partialLeads.map((lead) => (
                    <TableRow
                      key={lead.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedLead(lead)}
                    >
                      <TableCell className="font-medium">{lead.name || '-'}</TableCell>
                      <TableCell>{lead.phone || '-'}</TableCell>
                      <TableCell>
                        {lead.intention ? (
                          <Badge variant="secondary" className={intentionColors[lead.intention] || ''}>
                            {intentionLabels[lead.intention] || lead.intention}
                          </Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {lead.current_step ? (stepLabels[lead.current_step] || lead.current_step) : '-'}
                      </TableCell>
                      <TableCell>
                        {lead.step_index != null && lead.total_steps ? (
                          <span className="text-xs">
                            {lead.step_index + 1}/{lead.total_steps}
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-xs">{formatDate(lead.updated_at)}</TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!lead.phone || webhookSendingId === lead.id}
                          onClick={() => handleSendPartialWebhook(lead)}
                        >
                          <Send className="h-3.5 w-3.5 mr-1" />
                          {webhookSendingId === lead.id ? 'Enviando...' : 'Disparar'}
                        </Button>
                      </TableCell>

                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail modal */}
      <Dialog open={!!selectedLead} onOpenChange={(open) => { if (!open) setSelectedLead(null); }}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Lead Parcial</DialogTitle>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">Nome:</span> {selectedLead.name || '-'}</div>
                <div><span className="text-muted-foreground">Telefone:</span> {selectedLead.phone || '-'}</div>
                <div><span className="text-muted-foreground">Intenção:</span> {selectedLead.intention ? intentionLabels[selectedLead.intention] || selectedLead.intention : '-'}</div>
                <div><span className="text-muted-foreground">Parou em:</span> {selectedLead.current_step ? stepLabels[selectedLead.current_step] || selectedLead.current_step : '-'}</div>
              </div>

              {detailSections.length > 0 ? (
                <div className="space-y-3 border-t pt-3">
                  <h4 className="text-sm font-semibold">Respostas preenchidas</h4>
                  {detailSections.map((section, i) => (
                    <div key={i} className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">{section.icon} {section.title}</p>
                      {section.fields.map((field, j) => (
                        <div key={j} className="flex justify-between text-sm pl-4">
                          <span className="text-muted-foreground">{field.label}</span>
                          <span className="text-right max-w-[60%]">{field.value}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma resposta registrada ainda.
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Recent page views */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Visitas Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Navegador</TableHead>
                  <TableHead>Tela</TableHead>
                  <TableHead>Referrer</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageViews.slice(0, 20).map((view) => (
                  <TableRow key={view.id}>
                    <TableCell className="text-xs">{formatDate(view.created_at)}</TableCell>
                    <TableCell className="text-xs">{parseBrowser(view.user_agent)}</TableCell>
                    <TableCell className="text-xs">
                      {view.screen_width && view.screen_height ? `${view.screen_width}x${view.screen_height}` : '-'}
                    </TableCell>
                    <TableCell className="text-xs max-w-[200px] truncate">{view.referrer || 'Direto'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
