import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Phone, Mail, Calendar, DollarSign, MessageCircle, Loader2, Check, CheckCircle2 } from 'lucide-react';
import { formatFormDataToSections } from '@/lib/formatFormData';
import { LeadPreferencesView } from '@/components/marketplace/LeadPreferencesView';
import { buildWaLink } from '@/lib/whatsapp';
import { registerLeadContact } from '@/lib/leadContact';
import { CrmLead, CrmStage, STAGES, STAGE_LABEL } from './types';
import { RefundPolicyDialog } from './RefundPolicyDialog';

interface Props {
  lead: CrmLead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (crmId: string, patch: { stage?: CrmStage; notes?: string }) => Promise<void>;
  userName?: string;
  userPhone?: string;
}

function normalizeFormData(raw: any): any {
  if (!raw) return null;
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch { return null; }
  }
  return typeof raw === 'object' ? raw : null;
}

function inferIntention(formData: any, description: string): string {
  if (formData?.intention) {
    const raw = String(formData.intention).trim().toUpperCase();
    const map: Record<string, string> = {
      VENDER: 'SELL', SELL: 'SELL',
      COMPRAR: 'BUY', BUY: 'BUY',
      CONSTRUIR: 'BUILD', BUILD: 'BUILD',
      ALUGAR: 'RENT', RENT: 'RENT',
    };
    if (map[raw]) return map[raw];
  }
  if (formData?.sell && Object.keys(formData.sell).length > 0) return 'SELL';
  if (formData?.buy && Object.keys(formData.buy).length > 0) return 'BUY';
  if (formData?.build && Object.keys(formData.build).length > 0) return 'BUILD';
  if (formData?.rent && Object.keys(formData.rent).length > 0) return 'RENT';
  const lower = description.toLowerCase();
  if (lower.includes('vender')) return 'SELL';
  if (lower.includes('comprar')) return 'BUY';
  if (lower.includes('construir')) return 'BUILD';
  if (lower.includes('alugar')) return 'RENT';
  return '';
}

export function LeadCrmDialog({ lead, open, onOpenChange, onUpdate, userName, userPhone }: Props) {
  const [notes, setNotes] = useState('');
  const [stage, setStage] = useState<CrmStage>('ENTRADA');
  const [savingNotes, setSavingNotes] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialNotesRef = useRef('');
  const [policyOpen, setPolicyOpen] = useState(false);

  useEffect(() => {
    if (lead) {
      setNotes(lead.notes || '');
      setStage(lead.stage);
      initialNotesRef.current = lead.notes || '';
      setSavedAt(null);
    }
  }, [lead?.crmId]);

  // Debounced autosave for notes
  useEffect(() => {
    if (!lead) return;
    if (notes === initialNotesRef.current) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSavingNotes(true);
      try {
        await onUpdate(lead.crmId, { notes });
        initialNotesRef.current = notes;
        setSavedAt(Date.now());
      } finally {
        setSavingNotes(false);
      }
    }, 800);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [notes, lead?.crmId]);

  if (!lead) return null;

  const handleStageChange = async (newStage: CrmStage) => {
    setStage(newStage);
    await onUpdate(lead.crmId, { stage: newStage });
  };

  const formatPrice = (p: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p);
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const normalizedFormData = normalizeFormData(lead.formData);
  const hasFormData = normalizedFormData && Object.keys(normalizedFormData).length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[90vh] flex flex-col overflow-hidden p-0">
        <DialogHeader className="flex-shrink-0 px-6 pt-6">
          <div className="flex items-center justify-between mb-2 gap-3">
            <DialogTitle className="text-2xl truncate">{lead.name}</DialogTitle>
            <Badge variant="outline" className="bg-success-light text-success flex-shrink-0">
              {STAGE_LABEL[stage]}
            </Badge>
          </div>

          <div className="space-y-2 pt-2">
            <div className="flex items-center gap-2 text-foreground flex-wrap">
              {lead.firstContactAt ? (
                <span className="text-xs text-green-700 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Contato em {new Date(lead.firstContactAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">Ainda sem contato registrado</span>
              )}
              <Button
                size="sm"
                variant="outline"
                className="ml-auto h-7 text-xs text-green-700 border-green-300 hover:bg-green-50"
                onClick={async () => {
                  window.open(buildWaLink(lead.phone), '_blank');
                  if (!lead.isManual && lead.purchaseId) await registerLeadContact(lead.purchaseId);
                }}
              >
                <MessageCircle className="h-3.5 w-3.5 mr-1" /> WhatsApp
              </Button>
            </div>
            {lead.email && (
              <div className="flex items-center gap-2 text-foreground">
                <Mail className="h-4 w-4 text-primary" />
                <span>{lead.email}</span>
              </div>
            )}
          </div>

        </DialogHeader>

        <Separator />

        <div className="flex-1 min-h-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="px-6 py-4 space-y-5">
              {/* Stage selector */}
              <div className="space-y-2">
                <label className="text-sm font-semibold">Etapa do CRM</label>
                <Select value={stage} onValueChange={(v) => handleStageChange(v as CrmStage)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STAGES.map((s) => (
                      <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold">Anotações</label>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    {savingNotes ? (
                      <><Loader2 className="h-3 w-3 animate-spin" /> Salvando...</>
                    ) : savedAt ? (
                      <><Check className="h-3 w-3 text-green-600" /> Salvo</>
                    ) : null}
                  </span>
                </div>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Adicione observações sobre este lead, follow-ups, próximos passos..."
                  className="min-h-[120px]"
                />
              </div>

              {/* Form data details */}
              {hasFormData && (
                <LeadPreferencesView formData={normalizedFormData} />
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="flex-shrink-0 px-6 pb-6 pt-4 border-t space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Comprado: <strong className="text-foreground">{formatDate(lead.purchasedAt)}</strong></span>
            </div>
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="font-bold text-primary">{formatPrice(lead.amount)}</span>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full text-green-700 border-green-300 hover:bg-green-50"
            onClick={() => {
              const msg = `Olá, sou o corretor ${userName || ''} (${userPhone || ''}) e não consegui contato com o Lead ${lead.name}.`;
              window.open(`https://wa.me/553192472750?text=${encodeURIComponent(msg)}`, '_blank');
            }}
          >
            <MessageCircle className="h-4 w-4 mr-1" />
            Não consegui contato com o lead
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
