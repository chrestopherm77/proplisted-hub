import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Phone, Mail, Calendar, DollarSign } from "lucide-react";
import { formatFormDataToSections, intentionLabelsExport } from "@/lib/formatFormData";

interface PurchasedLeadModalProps {
  purchase: {
    id: string;
    amount: number;
    purchased_at: string;
    lead: {
      id: string;
      name: string;
      phone: string;
      email?: string;
      description: string;
      form_data?: any;
    };
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Normalize form_data that might be string or object
function normalizeFormData(raw: any): any {
  if (!raw) return null;
  
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  
  if (typeof raw === 'object') {
    return raw;
  }
  
  return null;
}

// Infer intention from form_data
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
  
  // Fallback to parsing description
  const lower = description.toLowerCase();
  if (lower.includes('vender')) return 'SELL';
  if (lower.includes('comprar')) return 'BUY';
  if (lower.includes('construir')) return 'BUILD';
  if (lower.includes('alugar')) return 'RENT';
  
  return '';
}

export function PurchasedLeadModal({
  purchase,
  open,
  onOpenChange,
}: PurchasedLeadModalProps) {
  if (!purchase) return null;

  const { lead } = purchase;
  
  // Normalize and process form_data
  const normalizedFormData = normalizeFormData(lead.form_data);
  const hasFormData = normalizedFormData && typeof normalizedFormData === 'object' && Object.keys(normalizedFormData).length > 0;
  const intention = inferIntention(normalizedFormData, lead.description);
  const sections = hasFormData ? formatFormDataToSections(intention, normalizedFormData) : [];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Parse description for display when no form_data
  const parseDescriptionToDisplay = (description: string) => {
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
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[85vh] flex flex-col overflow-hidden p-0">
        <DialogHeader className="flex-shrink-0 px-6 pt-6">
          <div className="flex items-center justify-between mb-2">
            <DialogTitle className="text-2xl">
              {lead.name}
            </DialogTitle>
            <Badge variant="outline" className="bg-success-light text-success">
              Pago
            </Badge>
          </div>
          
          {/* Contact information - unlocked after purchase */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center gap-2 text-foreground">
              <Phone className="h-4 w-4 text-primary" />
              <span className="font-medium">{lead.phone}</span>
            </div>
            {lead.email && (
              <div className="flex items-center gap-2 text-foreground">
                <Mail className="h-4 w-4 text-primary" />
                <span>{lead.email}</span>
              </div>
            )}
          </div>
          
          {/* Summary from description */}
          <div className="pt-3 text-muted-foreground text-sm space-y-1">
            {parseDescriptionToDisplay(lead.description)}
          </div>
        </DialogHeader>

        <Separator />

        <div className="flex-1 min-h-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="px-6">
              {hasFormData ? (
                <div className="py-4 space-y-6">
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
                  
                  {sections.length === 0 && (
                    <div className="py-4">
                      <p className="text-sm text-muted-foreground">
                        Nenhuma informação adicional do formulário foi fornecida.
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

        <div className="flex-shrink-0 px-6 pb-6 pt-4 border-t">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Comprado em: <strong className="text-foreground">{formatDate(purchase.purchased_at)}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">Valor pago:</span>
              <span className="font-bold text-primary">{formatPrice(purchase.amount)}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
