import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { CONDO_AMENITIES } from '@/lib/propertyUtils';
import { Check, Plus, X } from 'lucide-react';

export type CondoAmenitiesValue = Record<string, string[]>;

interface AmenitiesPickerProps {
  value: CondoAmenitiesValue;
  onChange: (next: CondoAmenitiesValue) => void;
}

export function AmenitiesPicker({ value, onChange }: AmenitiesPickerProps) {
  const [customInput, setCustomInput] = useState('');

  const toggle = (groupKey: string, item: string) => {
    const current = value[groupKey] || [];
    const next = current.includes(item)
      ? current.filter((i) => i !== item)
      : [...current, item];
    const newValue = { ...value };
    if (next.length) newValue[groupKey] = next;
    else delete newValue[groupKey];
    onChange(newValue);
  };

  const addCustom = () => {
    const v = customInput.trim();
    if (!v) return;
    const current = value.others || [];
    if (current.some((i) => i.toLowerCase() === v.toLowerCase())) {
      setCustomInput('');
      return;
    }
    onChange({ ...value, others: [...current, v] });
    setCustomInput('');
  };

  const removeCustom = (item: string) => {
    const next = (value.others || []).filter((i) => i !== item);
    const newValue = { ...value };
    if (next.length) newValue.others = next;
    else delete newValue.others;
    onChange(newValue);
  };

  const groupCount = (groupKey: string) => (value[groupKey] || []).length;

  return (
    <Accordion type="multiple" className="w-full">
      {CONDO_AMENITIES.map((group) => (
        <AccordionItem key={group.key} value={group.key}>
          <AccordionTrigger className="text-sm">
            <span className="flex items-center gap-2">
              {group.label}
              {groupCount(group.key) > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {groupCount(group.key)}
                </Badge>
              )}
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-wrap gap-2 pt-1">
              {group.items.map((item) => {
                const selected = (value[group.key] || []).includes(item);
                return (
                  <Badge
                    key={item}
                    variant={selected ? 'default' : 'outline'}
                    className="cursor-pointer select-none px-3 py-1.5 text-sm"
                    onClick={() => toggle(group.key, item)}
                  >
                    {selected && <Check className="h-3 w-3 mr-1" />}
                    {item}
                  </Badge>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}

      <AccordionItem value="others">
        <AccordionTrigger className="text-sm">
          <span className="flex items-center gap-2">
            Outros
            {groupCount('others') > 0 && (
              <Badge variant="secondary" className="ml-1">
                {groupCount('others')}
              </Badge>
            )}
          </span>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-3 pt-1">
            <div className="flex gap-2">
              <Input
                placeholder="Adicionar item personalizado"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustom();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addCustom}>
                <Plus className="h-4 w-4" /> Adicionar
              </Button>
            </div>
            {(value.others || []).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {(value.others || []).map((item) => (
                  <Badge key={item} variant="default" className="px-3 py-1.5 text-sm gap-1">
                    {item}
                    <button
                      type="button"
                      onClick={() => removeCustom(item)}
                      className="ml-1 hover:opacity-70"
                      aria-label={`Remover ${item}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
