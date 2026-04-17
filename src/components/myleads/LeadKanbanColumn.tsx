import { useDroppable } from '@dnd-kit/core';
import { CrmLead, CrmStage, STAGES } from './types';
import { LeadKanbanCard } from './LeadKanbanCard';

interface Props {
  stage: CrmStage;
  leads: CrmLead[];
  onCardClick: (lead: CrmLead) => void;
}

export function LeadKanbanColumn({ stage, leads, onCardClick }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const meta = STAGES.find((s) => s.key === stage)!;

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-lg border-2 transition-colors w-[260px] min-w-[260px] ${meta.accent} ${
        isOver ? 'ring-2 ring-primary ring-offset-2' : ''
      }`}
    >
      <div className="px-3 py-2.5 border-b border-current/10 flex items-center justify-between">
        <h3 className="font-semibold text-sm text-foreground">{meta.label}</h3>
        <span className="text-xs font-medium bg-background/60 text-foreground px-2 py-0.5 rounded-full">
          {leads.length}
        </span>
      </div>
      <div className="flex-1 p-2 space-y-2 min-h-[200px] max-h-[calc(100vh-280px)] overflow-y-auto">
        {leads.length === 0 ? (
          <div className="text-center text-xs text-muted-foreground py-8">
            Sem leads aqui
          </div>
        ) : (
          leads.map((lead) => (
            <LeadKanbanCard key={lead.crmId} lead={lead} onClick={() => onCardClick(lead)} />
          ))
        )}
      </div>
    </div>
  );
}
