import { useDraggable } from '@dnd-kit/core';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, MessageCircle, StickyNote, Calendar } from 'lucide-react';
import { CrmLead, STAGE_LABEL } from './types';
import { buildWaLink } from '@/lib/whatsapp';

interface Props {
  lead: CrmLead;
  onClick: () => void;
}

export function LeadKanbanCard({ lead, onClick }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.crmId,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 50 }
    : undefined;

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(buildWaLink(lead.phone), '_blank');
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow bg-card ${
        isDragging ? 'opacity-50 shadow-xl' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-semibold text-sm leading-tight flex-1 truncate">{lead.name}</h4>
        {lead.notes && (
          <StickyNote className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" aria-label="Tem anotação" />
        )}
      </div>

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
        <Phone className="h-3 w-3" />
        <span className="truncate">{lead.phone}</span>
      </div>

      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{lead.description}</p>

      <div className="flex items-center justify-between mb-2">
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
          <Calendar className="h-2.5 w-2.5 mr-1" />
          {formatDate(lead.purchasedAt)}
        </Badge>
      </div>

      <Button
        size="sm"
        variant="outline"
        className="w-full h-8 text-xs text-green-700 border-green-300 hover:bg-green-50 dark:hover:bg-green-950/40"
        onClick={handleWhatsApp}
      >
        <MessageCircle className="h-3.5 w-3.5 mr-1" />
        WhatsApp
      </Button>
    </Card>
  );
}
