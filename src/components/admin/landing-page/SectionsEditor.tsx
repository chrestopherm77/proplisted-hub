import { useState } from 'react';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy,
  useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical, Trash2, Copy, Plus, ChevronDown, ChevronUp,
  ListOrdered, BarChart3, CheckCircle2, HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import {
  createSection, type LPSection, type LPSectionType,
} from '@/components/admin/landing-page/types';

const ICON_OPTIONS = [
  'TrendingUp', 'Shield', 'Zap', 'Users', 'Target', 'Clock',
  'CheckCircle', 'Award', 'Heart', 'Star', 'Rocket', 'Sparkles',
  'BarChart3', 'DollarSign', 'Home', 'Building', 'Phone', 'MapPin',
];

const SECTION_META: Record<LPSectionType, { label: string; icon: typeof ListOrdered }> = {
  how_it_works: { label: 'Como Funciona (passos numerados)', icon: ListOrdered },
  stats: { label: 'Estatísticas (números com ícones)', icon: BarChart3 },
  benefits: { label: 'Benefícios (lista com check)', icon: CheckCircle2 },
  faq: { label: 'FAQ (perguntas e respostas)', icon: HelpCircle },
};

interface Props {
  sections: LPSection[];
  onChange: (next: LPSection[]) => void;
}

export function SectionsEditor({ sections, onChange }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIdx = sections.findIndex((s) => s.id === active.id);
      const newIdx = sections.findIndex((s) => s.id === over.id);
      if (oldIdx >= 0 && newIdx >= 0) onChange(arrayMove(sections, oldIdx, newIdx));
    }
  };

  const updateSection = (id: string, next: LPSection) => {
    onChange(sections.map((s) => (s.id === id ? next : s)));
  };

  const removeSection = (id: string) => {
    onChange(sections.filter((s) => s.id !== id));
  };

  const duplicateSection = (id: string) => {
    const idx = sections.findIndex((s) => s.id === id);
    if (idx < 0) return;
    const original = sections[idx];
    const copy = {
      ...JSON.parse(JSON.stringify(original)),
      id: `${original.type}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    } as LPSection;
    const next = [...sections];
    next.splice(idx + 1, 0, copy);
    onChange(next);
  };

  const addSection = (type: LPSectionType) => {
    onChange([...sections, createSection(type)]);
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Arraste pelo ícone <GripVertical className="inline h-3 w-3" /> para reordenar.
        As seções aparecem entre a Mídia central e a Prova social.
      </p>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {sections.map((section) => (
              <SortableSectionCard
                key={section.id}
                section={section}
                onUpdate={(next) => updateSection(section.id, next)}
                onRemove={() => removeSection(section.id)}
                onDuplicate={() => duplicateSection(section.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {sections.length === 0 && (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          Nenhuma seção adicionada. Use o botão abaixo para criar uma.
        </Card>
      )}

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="w-full">
            <Plus className="h-4 w-4" /> Adicionar seção
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-2">
          <div className="space-y-1">
            {(Object.keys(SECTION_META) as LPSectionType[]).map((type) => {
              const meta = SECTION_META[type];
              const Icon = meta.icon;
              return (
                <button
                  key={type}
                  onClick={() => addSection(type)}
                  className="w-full flex items-center gap-2 p-2 rounded hover:bg-accent text-sm text-left"
                >
                  <Icon className="h-4 w-4 text-primary" />
                  {meta.label}
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

interface CardProps {
  section: LPSection;
  onUpdate: (next: LPSection) => void;
  onRemove: () => void;
  onDuplicate: () => void;
}

function SortableSectionCard({ section, onUpdate, onRemove, onDuplicate }: CardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: section.id });
  const [open, setOpen] = useState(false);

  const meta = SECTION_META[section.type];
  const Icon = meta.icon;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card ref={setNodeRef} style={style} className="overflow-hidden">
      <div className="flex items-center gap-2 p-3 bg-muted/30">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-accent rounded"
          aria-label="Arrastar"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
        <Icon className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold flex-1">{meta.label}</span>
        <Button variant="ghost" size="sm" onClick={() => setOpen((v) => !v)}>
          {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </Button>
        <Button variant="ghost" size="sm" onClick={onDuplicate} title="Duplicar">
          <Copy className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onRemove} title="Remover">
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
      {open && (
        <div className="p-3 border-t space-y-3">
          {section.type === 'how_it_works' && (
            <HowItWorksEditor section={section} onUpdate={onUpdate} />
          )}
          {section.type === 'stats' && <StatsEditor section={section} onUpdate={onUpdate} />}
          {section.type === 'benefits' && (
            <BenefitsEditor section={section} onUpdate={onUpdate} />
          )}
          {section.type === 'faq' && <FaqEditor section={section} onUpdate={onUpdate} />}
        </div>
      )}
    </Card>
  );
}

/* ============== Sub-editores por tipo ============== */

function HowItWorksEditor({
  section, onUpdate,
}: { section: Extract<LPSection, { type: 'how_it_works' }>; onUpdate: (s: LPSection) => void }) {
  return (
    <>
      <div>
        <Label>Título da seção</Label>
        <Input value={section.title} onChange={(e) => onUpdate({ ...section, title: e.target.value })} />
      </div>
      <div>
        <Label>Subtítulo</Label>
        <Input value={section.subtitle}
          onChange={(e) => onUpdate({ ...section, subtitle: e.target.value })} />
      </div>
      {section.steps.map((step, i) => (
        <Card key={i} className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold">Passo {i + 1}</span>
            {section.steps.length > 1 && (
              <Button variant="ghost" size="sm" onClick={() => onUpdate({
                ...section,
                steps: section.steps.filter((_, idx) => idx !== i),
              })}><Trash2 className="h-3 w-3" /></Button>
            )}
          </div>
          <Input value={step.title} placeholder="Título do passo"
            onChange={(e) => {
              const arr = [...section.steps]; arr[i] = { ...step, title: e.target.value };
              onUpdate({ ...section, steps: arr });
            }} />
          <Textarea value={step.description} placeholder="Descrição"
            onChange={(e) => {
              const arr = [...section.steps]; arr[i] = { ...step, description: e.target.value };
              onUpdate({ ...section, steps: arr });
            }} />
        </Card>
      ))}
      {section.steps.length < 6 && (
        <Button variant="outline" size="sm" onClick={() => onUpdate({
          ...section,
          steps: [...section.steps, { title: 'Novo passo', description: 'Descrição' }],
        })}><Plus className="h-3 w-3" /> Adicionar passo</Button>
      )}
    </>
  );
}

function StatsEditor({
  section, onUpdate,
}: { section: Extract<LPSection, { type: 'stats' }>; onUpdate: (s: LPSection) => void }) {
  return (
    <>
      {section.items.map((item, i) => (
        <Card key={i} className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold">Item {i + 1}</span>
            {section.items.length > 1 && (
              <Button variant="ghost" size="sm" onClick={() => onUpdate({
                ...section,
                items: section.items.filter((_, idx) => idx !== i),
              })}><Trash2 className="h-3 w-3" /></Button>
            )}
          </div>
          <div>
            <Label>Ícone</Label>
            <Select value={item.icon}
              onValueChange={(v) => {
                const arr = [...section.items]; arr[i] = { ...item, icon: v };
                onUpdate({ ...section, items: arr });
              }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ICON_OPTIONS.map((ic) => <SelectItem key={ic} value={ic}>{ic}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Input value={item.value} placeholder='Número (ex: "500+")'
            onChange={(e) => {
              const arr = [...section.items]; arr[i] = { ...item, value: e.target.value };
              onUpdate({ ...section, items: arr });
            }} />
          <Input value={item.label} placeholder='Legenda (ex: "Corretores Ativos")'
            onChange={(e) => {
              const arr = [...section.items]; arr[i] = { ...item, label: e.target.value };
              onUpdate({ ...section, items: arr });
            }} />
        </Card>
      ))}
      {section.items.length < 6 && (
        <Button variant="outline" size="sm" onClick={() => onUpdate({
          ...section,
          items: [...section.items, { icon: 'Star', value: '100+', label: 'Novo' }],
        })}><Plus className="h-3 w-3" /> Adicionar número</Button>
      )}
    </>
  );
}

function BenefitsEditor({
  section, onUpdate,
}: { section: Extract<LPSection, { type: 'benefits' }>; onUpdate: (s: LPSection) => void }) {
  return (
    <>
      <div>
        <Label>Título da seção</Label>
        <Input value={section.title}
          onChange={(e) => onUpdate({ ...section, title: e.target.value })} />
      </div>
      {section.items.map((item, i) => (
        <Card key={i} className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold">Benefício {i + 1}</span>
            {section.items.length > 1 && (
              <Button variant="ghost" size="sm" onClick={() => onUpdate({
                ...section,
                items: section.items.filter((_, idx) => idx !== i),
              })}><Trash2 className="h-3 w-3" /></Button>
            )}
          </div>
          <Input value={item.title} placeholder="Título"
            onChange={(e) => {
              const arr = [...section.items]; arr[i] = { ...item, title: e.target.value };
              onUpdate({ ...section, items: arr });
            }} />
          <Textarea value={item.description} placeholder="Descrição"
            onChange={(e) => {
              const arr = [...section.items]; arr[i] = { ...item, description: e.target.value };
              onUpdate({ ...section, items: arr });
            }} />
        </Card>
      ))}
      {section.items.length < 8 && (
        <Button variant="outline" size="sm" onClick={() => onUpdate({
          ...section,
          items: [...section.items, { title: 'Novo benefício', description: 'Descrição' }],
        })}><Plus className="h-3 w-3" /> Adicionar benefício</Button>
      )}
    </>
  );
}

function FaqEditor({
  section, onUpdate,
}: { section: Extract<LPSection, { type: 'faq' }>; onUpdate: (s: LPSection) => void }) {
  return (
    <>
      <div>
        <Label>Título da seção</Label>
        <Input value={section.title}
          onChange={(e) => onUpdate({ ...section, title: e.target.value })} />
      </div>
      {section.items.map((item, i) => (
        <Card key={i} className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold">Pergunta {i + 1}</span>
            {section.items.length > 1 && (
              <Button variant="ghost" size="sm" onClick={() => onUpdate({
                ...section,
                items: section.items.filter((_, idx) => idx !== i),
              })}><Trash2 className="h-3 w-3" /></Button>
            )}
          </div>
          <Input value={item.question} placeholder="Pergunta"
            onChange={(e) => {
              const arr = [...section.items]; arr[i] = { ...item, question: e.target.value };
              onUpdate({ ...section, items: arr });
            }} />
          <Textarea value={item.answer} placeholder="Resposta" rows={3}
            onChange={(e) => {
              const arr = [...section.items]; arr[i] = { ...item, answer: e.target.value };
              onUpdate({ ...section, items: arr });
            }} />
        </Card>
      ))}
      {section.items.length < 12 && (
        <Button variant="outline" size="sm" onClick={() => onUpdate({
          ...section,
          items: [...section.items, { question: 'Nova pergunta?', answer: 'Resposta…' }],
        })}><Plus className="h-3 w-3" /> Adicionar pergunta</Button>
      )}
    </>
  );
}
