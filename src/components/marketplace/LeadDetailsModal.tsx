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
  form_data?: any;
}

interface LeadDetailsModalProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isInCart: boolean;
  isSoldOut: boolean;
  isPurchased?: boolean;
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
      <DialogContent className="max-w-2xl h-[85vh] flex flex-col overflow-hidden p-0">
        <DialogHeader className="flex-shrink-0 px-6 pt-6">
          <div className="flex items-center justify-between mb-2">
            <DialogTitle className="text-2xl">
              Lead #{lead.id.slice(0, 8).toUpperCase()}
            </DialogTitle>
            <Badge variant={isSoldOut ? 'destructive' : 'default'}>
              {isSoldOut
                ? 'Esgotado'
                : `${lead.max_purchases - lead.purchase_count}/${lead.max_purchases} disponíveis`}
            </Badge>
          </div>
          
          {/* Summary from description */}
          <div className="pt-2 text-muted-foreground text-sm space-y-1">
            {parseDescriptionToDisplay(lead.description)}
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="px-6">
              {hasFormData ? (
                <div className="py-4 space-y-6">
                  {/* Organized Sections (when available) */}
                  {sections.length > 0 && (
                    <>
                      <div className="flex items-center gap-2 pb-2 border-b">
                        <span className="text-lg font-semibold">📋 Detalhes do Lead</span>
                      </div>
                      
                      {sections.map((section, idx) => (
                        <div key={idx} className="space-y-3">
                          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <span>{section.icon}</span>
                            {section.title}
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-6">
                            {section.fields.map((field, fieldIdx) => (
                              <div key={fieldIdx} className="text-sm">
                                <span className="text-muted-foreground">{field.label}:</span>{' '}
                                <span className="font-medium text-foreground">{field.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                  
                  {/* Message when no form data could be extracted */}
                  {sections.length === 0 && (
                    <div className="py-4">
                      <p className="text-sm text-muted-foreground">
                        Nenhuma informação do formulário foi fornecida.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-4">
                  <p className="text-sm text-muted-foreground">
                    Este lead foi criado sem formulário completo. Apenas o resumo está disponível.
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="flex-shrink-0 px-6 pb-6 pt-4 border-t space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Valor do Lead</p>
              <p className="text-3xl font-bold text-primary">{formatPrice(lead.price)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Status</p>
              <p className="text-sm font-medium">{lead.purchase_count} vendidos</p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            {isSoldOut ? (
              <Button disabled className="w-full" variant="secondary" size="lg">
                Esgotado
              </Button>
            ) : isInCart ? (
              <Button
                onClick={onRemoveFromCart}
                variant="outline"
                className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                size="lg"
              >
                <X className="mr-2 h-5 w-5" />
                Remover do Carrinho
              </Button>
            ) : (
              <Button onClick={onAddToCart} className="w-full" size="lg">
                <ShoppingCart className="mr-2 h-5 w-5" />
                Adicionar ao Carrinho
              </Button>
            )}
          </DialogFooter>
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
