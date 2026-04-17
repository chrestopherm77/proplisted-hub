export type CrmStage = 'NOVO' | 'EM_CONVERSA' | 'AGENDADO' | 'VENDIDO' | 'PERDIDO';

export interface CrmLead {
  // crm row
  crmId: string;
  stage: CrmStage;
  notes: string | null;
  // purchase
  purchaseId: string;
  amount: number;
  purchasedAt: string;
  // lead
  leadId: string;
  name: string;
  phone: string;
  email?: string;
  description: string;
  formData?: any;
}

export const STAGES: { key: CrmStage; label: string; accent: string }[] = [
  { key: 'NOVO', label: 'Lead Novo', accent: 'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-900' },
  { key: 'EM_CONVERSA', label: 'Em conversa', accent: 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900' },
  { key: 'AGENDADO', label: 'Agendado', accent: 'bg-purple-50 border-purple-200 dark:bg-purple-950/30 dark:border-purple-900' },
  { key: 'VENDIDO', label: 'Vendido', accent: 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-900' },
  { key: 'PERDIDO', label: 'Perdido', accent: 'bg-gray-100 border-gray-200 dark:bg-gray-900/40 dark:border-gray-800' },
];

export const STAGE_LABEL: Record<CrmStage, string> = STAGES.reduce(
  (acc, s) => ({ ...acc, [s.key]: s.label }),
  {} as Record<CrmStage, string>
);
