import React from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShoppingCart, X } from "lucide-react";
import { formatFormDataToSections, intentionLabelsExport } from "@/lib/formatFormData";

interface Lead {
  id: string;
  description: string;
  price: number;
  purchase_count: number;
  max_purchases: number;
  is_active: boolean;
  is_promotion?: boolean;
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
  onAddToCart: () => void;
  onRemoveFromCart: () => void;
  formatPrice: (price: number) => string;
}

// Normalize form_data that might be string or object
function normalizeFormData(raw: any): any {
  if (!raw) return null;
  
  // If it's a string, try to parse it
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  
  // If it's already an object, return it
  if (typeof raw === 'object') {
    return raw;
  }
  
  return null;
}

// Infer intention from form_data if not explicit
function inferIntention(formData: any, description: string): string {
  // Try explicit intention field first
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
  
  // Infer from existing flow keys
  if (formData?.sell && Object.keys(formData.sell).length > 0) return 'SELL';
  if (formData?.buy && Object.keys(formData.buy).length > 0) return 'BUY';
  if (formData?.build && Object.keys(formData.build).length > 0) return 'BUILD';
  if (formData?.rent && Object.keys(formData.rent).length > 0) return 'RENT';
  
  // Fallback to parsing description
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
  onAddToCart,
  onRemoveFromCart,
  formatPrice,
}: LeadDetailsModalProps) {
  if (!lead) return null;

  // Normalize and process form_data
  const normalizedFormData = normalizeFormData(lead.form_data);
  const hasFormData = normalizedFormData && typeof normalizedFormData === 'object' && Object.keys(normalizedFormData).length > 0;
  const intention = inferIntention(normalizedFormData, lead.description);
  const sections = hasFormData ? formatFormDataToSections(intention, normalizedFormData) : [];



  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[90vh] flex flex-col overflow-hidden p-0">
        <DialogHeader className="flex-shrink-0 px-6 pt-5 pb-3">
          <div className="flex items-center justify-between mb-1">
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
            <Badge variant={isSoldOut ? 'destructive' : 'default'}>
              {isSoldOut
                ? 'Esgotado'
                : `${lead.max_purchases - lead.purchase_count}/${lead.max_purchases} disponíveis`}
            </Badge>
          </div>
          
          {/* Summary from description */}
          <div className="pt-1 text-muted-foreground text-base space-y-1">
            {parseDescriptionToDisplay(lead.description)}
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="px-6">
              {hasFormData ? (
                <div className="py-3 space-y-5">
                  {sections.length > 0 && (
                    <>
                      <div className="flex items-center gap-2 pb-2 border-b">
                        <span className="text-lg font-semibold">📋 Detalhes do Lead</span>
                      </div>
                      
                      {sections.map((section, idx) => (
                        <div key={idx} className="space-y-2">
                          <h4 className="text-base font-semibold text-foreground flex items-center gap-2">
                            <span>{section.icon}</span>
                            {section.title}
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-6">
                            {section.fields.map((field, fieldIdx) => (
                              <div key={fieldIdx} className="text-base">
                                <span className="text-muted-foreground">{field.label}:</span>{' '}
                                <span className="font-medium text-foreground">{field.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                  
                  {sections.length === 0 && (
                    <div className="py-3">
                      <p className="text-base text-muted-foreground">
                        Nenhuma informação do formulário foi fornecida.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-3">
                  <p className="text-base text-muted-foreground">
                    Este lead foi criado sem formulário completo. Apenas o resumo está disponível.
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="flex-shrink-0 px-6 py-3 border-t flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <p className="text-2xl font-bold text-primary">{formatPrice(lead.price)}</p>
            <span className="text-sm text-muted-foreground">· {lead.purchase_count} vendidos</span>
          </div>

          {isPurchased ? (
            <Button disabled className="bg-green-600 hover:bg-green-600 text-white" size="lg">
              ✓ Já comprado
            </Button>
          ) : isSoldOut ? (
            <Button disabled variant="secondary" size="lg">
              Esgotado
            </Button>
          ) : isInCart ? (
            <Button
              onClick={onRemoveFromCart}
              variant="outline"
              className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              size="lg"
            >
              <X className="mr-2 h-5 w-5" />
              Remover
            </Button>
          ) : (
            <Button onClick={onAddToCart} size="lg">
              <ShoppingCart className="mr-2 h-5 w-5" />
              Adicionar ao Carrinho
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

function parseDescriptionToDisplay(description: string) {
  const lines = description.split('\n').map(line => line.trim()).filter(Boolean);
  
  return lines.map((line, idx) => {
    const [label, ...valueParts] = line.split(':');
    const value = valueParts.join(':').trim();
    
    if (value) {
      return (
        <p key={idx}>
          <span className="font-medium text-foreground">{label}:</span> {value}
        </p>
      );
    }
    return <p key={idx}>{line}</p>;
  });
}
