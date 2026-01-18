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
  onAddToCart: () => void;
  onRemoveFromCart: () => void;
  formatPrice: (price: number) => string;
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

  const hasFormData = lead.form_data && Object.keys(lead.form_data).length > 0;
  const intention = lead.form_data?.intention || parseIntentionFromDescription(lead.description);
  const sections = hasFormData ? formatFormDataToSections(intention, lead.form_data) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
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

        <ScrollArea className="flex-1 pr-4">
          {hasFormData && sections.length > 0 ? (
            <div className="py-4 space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b">
                <span className="text-lg font-semibold">📋 Detalhes Completos</span>
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
            </div>
          ) : (
            <div className="py-4">
              <p className="text-sm text-muted-foreground">
                Detalhes adicionais não disponíveis para este lead.
              </p>
            </div>
          )}
        </ScrollArea>

        <div className="flex-shrink-0 pt-4 border-t space-y-4">
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
