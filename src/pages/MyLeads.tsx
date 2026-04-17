import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/Layout';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LeadKanbanColumn } from '@/components/myleads/LeadKanbanColumn';
import { LeadCrmDialog } from '@/components/myleads/LeadCrmDialog';
import { LeadKanbanCard } from '@/components/myleads/LeadKanbanCard';
import { CrmLead, CrmStage, STAGES } from '@/components/myleads/types';

export default function MyLeads() {
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CrmLead | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/auth'); return; }
    fetchAll();
    fetchProfile();
    const interval = setInterval(fetchAll, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles').select('name, phone').eq('id', user.id).single();
    if (data) {
      setUserName(data.name || '');
      setUserPhone(data.phone || '');
    }
  };

  const fetchAll = async () => {
    if (!user) return;
    try {
      // 1) purchases PAID com lead
      const { data: purchases, error: pErr } = await supabase
        .from('purchases')
        .select(`id, amount, purchased_at, lead_id,
          leads ( id, name, phone, description, form_data )`)
        .eq('user_id', user.id)
        .eq('status', 'PAID')
        .order('purchased_at', { ascending: false });
      if (pErr) throw pErr;

      const validPurchases = (purchases || []).filter((p: any) => p.leads);

      // 2) crm status existentes
      const { data: crmRows, error: cErr } = await supabase
        .from('lead_crm_status')
        .select('id, purchase_id, lead_id, stage, notes')
        .eq('user_id', user.id);
      if (cErr) throw cErr;

      const crmByPurchase = new Map<string, any>();
      (crmRows || []).forEach((r: any) => crmByPurchase.set(r.purchase_id, r));

      // 3) backfill: cria entrada ENTRADA para purchases sem crm
      const missing = validPurchases.filter((p: any) => !crmByPurchase.has(p.id));
      if (missing.length > 0) {
        const inserts = missing.map((p: any) => ({
          user_id: user.id,
          purchase_id: p.id,
          lead_id: p.lead_id,
          stage: 'ENTRADA',
        }));
        const { data: inserted, error: iErr } = await supabase
          .from('lead_crm_status')
          .insert(inserts)
          .select('id, purchase_id, lead_id, stage, notes');
        if (iErr) {
          console.error('Backfill error:', iErr);
        } else {
          (inserted || []).forEach((r: any) => crmByPurchase.set(r.purchase_id, r));
        }
      }

      // 4) merge
      const merged: CrmLead[] = validPurchases.map((p: any) => {
        const crm = crmByPurchase.get(p.id);
        return {
          crmId: crm?.id || '',
          stage: (crm?.stage || 'ENTRADA') as CrmStage,
          notes: crm?.notes || null,
          purchaseId: p.id,
          amount: Number(p.amount),
          purchasedAt: p.purchased_at,
          leadId: p.leads.id,
          name: p.leads.name,
          phone: p.leads.phone,
          description: p.leads.description,
          formData: p.leads.form_data,
        };
      }).filter((l) => l.crmId);

      setLeads(merged);
    } catch (e) {
      console.error('Error fetching CRM:', e);
      toast({ title: 'Erro ao carregar leads', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const grouped = useMemo(() => {
    const g: Record<CrmStage, CrmLead[]> = {
      ENTRADA: [], EM_ATENDIMENTO: [], VISITA: [], NEGOCIACAO: [], ASSINATURA: [], GANHO: [], PERDIDO: [],
    };
    const validStages = new Set(STAGES.map((s) => s.key));
    leads.forEach((l) => {
      const stage = (l?.stage as CrmStage) || 'ENTRADA';
      if (validStages.has(stage)) {
        g[stage].push(l);
      } else {
        console.warn('[MyLeads] Stage inválido, jogando em ENTRADA:', l?.stage, l);
        g.ENTRADA.push({ ...l, stage: 'ENTRADA' });
      }
    });
    return g;
  }, [leads]);

  const updateCrm = async (crmId: string, patch: { stage?: CrmStage; notes?: string }) => {
    // optimistic
    setLeads((prev) => prev.map((l) => (l.crmId === crmId ? { ...l, ...patch } : l)));
    if (selected?.crmId === crmId) setSelected((s) => (s ? { ...s, ...patch } : s));

    const { error } = await supabase
      .from('lead_crm_status')
      .update(patch)
      .eq('id', crmId);

    if (error) {
      console.error('Update error:', error);
      toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' });
      fetchAll();
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const newStage = over.id as CrmStage;
    if (!STAGES.find((s) => s.key === newStage)) return;
    const lead = leads.find((l) => l.crmId === active.id);
    if (!lead || lead.stage === newStage) return;
    updateCrm(lead.crmId, { stage: newStage });
  };

  const handleCardClick = (lead: CrmLead) => {
    setSelected(lead);
    setModalOpen(true);
  };

  if (loading) {
    return <Layout><div className="text-center py-12">Carregando seu CRM...</div></Layout>;
  }

  return (
    <Layout>
      <div className="max-w-[1600px] mx-auto">
        <div className="mb-4 md:mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">Meus Leads — CRM</h1>
          <p className="text-sm text-muted-foreground">
            Arraste os cards entre as etapas, anote o andamento e fale direto via WhatsApp.
          </p>
        </div>

        {leads.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">Você ainda não comprou nenhum lead</p>
            <Link to="/leads" className="text-primary hover:underline">Explorar Marketplace</Link>
          </div>
        ) : isMobile ? (
          // Mobile: Tabs
          <Tabs defaultValue="ENTRADA" className="w-full">
            <TabsList className="w-full flex overflow-x-auto h-auto scrollbar-hide">
              {STAGES.map((s) => (
                <TabsTrigger key={s.key} value={s.key} className="flex-col gap-0.5 py-2 text-[10px]">
                  <span className="leading-tight">{s.label}</span>
                  <span className="text-[10px] opacity-70">({grouped[s.key].length})</span>
                </TabsTrigger>
              ))}
            </TabsList>
            {STAGES.map((s) => (
              <TabsContent key={s.key} value={s.key} className="mt-3 space-y-2">
                {grouped[s.key].length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">Sem leads aqui</p>
                ) : (
                  grouped[s.key].map((lead) => (
                    <LeadKanbanCard key={lead.crmId} lead={lead} onClick={() => handleCardClick(lead)} />
                  ))
                )}
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          // Desktop: Kanban com drag & drop
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <div className="flex gap-3 overflow-x-auto pb-2 min-w-max">
              {STAGES.map((s) => (
                <LeadKanbanColumn
                  key={s.key}
                  stage={s.key}
                  leads={grouped[s.key]}
                  onCardClick={handleCardClick}
                />
              ))}
            </div>
          </DndContext>
        )}
      </div>

      <LeadCrmDialog
        lead={selected}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onUpdate={updateCrm}
        userName={userName}
        userPhone={userPhone}
      />
    </Layout>
  );
}
