import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Coins, Loader2, X, Users, Webhook } from "lucide-react";
import { formatFormDataToSections } from "@/lib/formatFormData";
import { LeadPreferencesView } from "./LeadPreferencesView";
import { splitFormDataIntoPreferences } from "@/lib/leadPreferences";
import { supabase } from "@/integrations/supabase/client";

interface Lead {
  id: string;
  description: string;
  price: number;
  purchase_count: number;
  max_purchases: number;
  is_active: boolean;
  is_promotion?: boolean;
  is_exhausted?: boolean;
  form_data?: any;
  created_at?: string;
}

interface LeadDetailsModalProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isInCart: boolean;
  isSoldOut: boolean;
  isPurchased?: boolean;
  isAdmin?: boolean;
  isPaidSubscriber?: boolean;
  creditBalance?: number;
  buyingLeadId?: string | null;
  onBuyWithCredits?: (leadId: string) => void;
  onAddToCart: () => void;
  onRemoveFromCart: () => void;
  formatPrice: (price: number) => string;
}

function normalizeFormData(raw: any): any {
  if (!raw) return null;
  if (typeof raw === 'string') { try { return JSON.parse(raw); } catch { return null; } }
  if (typeof raw === 'object') return raw;
  return null;
}

function inferIntention(formData: any, description: string): string {
  if (formData?.intention) {
    const raw = String(formData.intention).trim().toUpperCase();
    const map: Record<string, string> = {
      'VENDER': 'SELL', 'SELL': 'SELL',
      'COMPRAR': 'BUY', 'BUY': 'BUY',
      'CONSTRUIR': 'BUILD', 'BUILD': 'BUILD',
      'ALUGAR': 'RENT', 'RENT': 'RENT',
    };
    if (map[raw]) return map[raw];
  }
  if (formData?.sell && Object.keys(formData.sell).length > 0) return 'SELL';
  if (formData?.buy && Object.keys(formData.buy).length > 0) return 'BUY';
  if (formData?.build && Object.keys(formData.build).length > 0) return 'BUILD';
  if (formData?.rent && Object.keys(formData.rent).length > 0) return 'RENT';
  return parseIntentionFromDescription(description);
}

export function LeadDetailsModal({
  lead,
  open,
  onOpenChange,
  isInCart,
  isSoldOut,
  isPurchased = false,
  isAdmin = false,
  isPaidSubscriber = false,
  creditBalance = 0,
  buyingLeadId = null,
  onBuyWithCredits,
  onAddToCart,
  onRemoveFromCart,
  formatPrice,
}: LeadDetailsModalProps) {
  if (!lead) return null;

  const normalizedFormData = normalizeFormData(lead.form_data);
  const hasFormData = normalizedFormData && typeof normalizedFormData === 'object' && Object.keys(normalizedFormData).length > 0;
  const basePrice = Math.round(lead.price);
  const leadCredits = isPaidSubscriber ? basePrice : basePrice * 2;
  const canAfford = creditBalance >= leadCredits;
  const buyCondition = String(normalizedFormData?.buy?.propertyCondition || '').toUpperCase();
  const isLaunch = buyCondition === 'NEW' || buyCondition === 'BOTH';

  const [buyers, setBuyers] = useState<Array<{ buyer_name: string; purchased_at: string }>>([]);
  const [buyersLoading, setBuyersLoading] = useState(false);

  useEffect(() => {
    if (!open || !lead?.id) return;
    let cancelled = false;
    setBuyersLoading(true);
    supabase
      .rpc('get_lead_buyers', { p_lead_id: lead.id })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error && Array.isArray(data)) {
          setBuyers(data as any);
        } else {
          setBuyers([]);
        }
        setBuyersLoading(false);
      });
    return () => { cancelled = true; };
  }, [open, lead?.id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[90vh] flex flex-col overflow-hidden p-0">
        <DialogHeader className="flex-shrink-0 px-6 pt-5 pb-2">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              {lead.is_promotion && (
                <Badge className="animate-pulse bg-orange-500 hover:bg-orange-500 text-white border-transparent text-sm">
                  🔥 PROMOÇÃO
                </Badge>
              )}
              <div>
                <DialogTitle className="text-2xl">
                  Lead #{lead.id.slice(0, 8).toUpperCase()}
                </DialogTitle>
                {isAdmin === true && lead.created_at && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Cadastrado em {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                  </p>
                )}
              </div>
            </div>
            <Badge variant={isSoldOut ? 'destructive' : 'default'}>
              {isSoldOut
                ? `Esgotado ${lead.max_purchases}/${lead.max_purchases}`
                : `${lead.max_purchases - lead.purchase_count}/${lead.max_purchases} disponíveis`}
            </Badge>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="px-6">
              <div className="py-3">
                <div className="rounded-lg border bg-muted/40 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">
                      Quem já comprou este lead {buyers.length > 0 && `(${buyers.length})`}
                    </span>
                  </div>
                  {buyersLoading ? (
                    <p className="text-sm text-muted-foreground">Carregando...</p>
                  ) : buyers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Ninguém comprou este lead ainda. Seja o primeiro!
                    </p>
                  ) : (
                    <ul className="space-y-1">
                      {buyers.map((b, i) => (
                        <li key={i} className="text-sm">
                          <span className="font-medium">{b.buyer_name}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Verifique se sua imobiliária já comprou este lead para evitar duplicidade.
                  </p>
                </div>
              </div>
              {hasFormData ? (
                <div className="py-3">
                  <LeadPreferencesView
                    formData={normalizedFormData}
                    fieldTextClass="text-base"
                    sectionTitleClass="text-base"
                  />
                </div>
              ) : (
                <div className="py-3">
                  <p className="text-base text-muted-foreground">Este lead foi criado sem formulário completo.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="flex-shrink-0 px-6 py-3 border-t flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <Coins className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{leadCredits}</p>
                <span className="text-sm text-muted-foreground">créditos</span>
              </div>
              {!isPaidSubscriber && (
                <a
                  href="/planos"
                  className="text-[11px] text-yellow-700 dark:text-yellow-400 underline hover:opacity-80"
                >
                  Assine o plano Essencial e ganhe 50% de desconto nos leads
                </a>
              )}
            </div>
            <span className="text-sm text-muted-foreground">· {lead.purchase_count} vendidos</span>
          </div>

          {isPurchased ? (
            <Button disabled className="bg-green-600 hover:bg-green-600 text-white" size="lg">
              ✓ Já comprado
            </Button>
          ) : isSoldOut ? (
            <Button disabled variant="secondary" size="lg">Esgotado ({lead.max_purchases}/{lead.max_purchases})</Button>
          ) : onBuyWithCredits ? (
            <Button
              onClick={() => onBuyWithCredits(lead.id)}
              disabled={buyingLeadId === lead.id}
              size="lg"
              className={canAfford ? '' : 'bg-yellow-500 hover:bg-yellow-600 text-black'}
            >
              {buyingLeadId === lead.id ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Coins className="h-4 w-4 mr-2" />
              )}
              {canAfford ? 'Comprar com Créditos' : 'Comprar Créditos'}
            </Button>
          ) : (
            <Button onClick={onAddToCart} size="lg">
              Comprar
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function parseIntentionFromDescription(description: string): string {
  const lower = description.toLowerCase();
  if (lower.includes('vender')) return 'SELL';
  if (lower.includes('comprar')) return 'BUY';
  if (lower.includes('construir')) return 'BUILD';
  if (lower.includes('alugar')) return 'RENT';
  return '';
}
