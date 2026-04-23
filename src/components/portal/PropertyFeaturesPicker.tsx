import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { PROPERTY_FEATURES } from '@/lib/propertyUtils';
import { Check } from 'lucide-react';

export type PropertyFeaturesValue = Record<string, string[]>;

interface PropertyFeaturesPickerProps {
  value: PropertyFeaturesValue;
  onChange: (next: PropertyFeaturesValue) => void;
}

export function PropertyFeaturesPicker({ value, onChange }: PropertyFeaturesPickerProps) {
  const toggle = (questionKey: string, item: string) => {
    const current = value[questionKey] || [];
    const next = current.includes(item)
      ? current.filter((i) => i !== item)
      : [...current, item];
    const newValue = { ...value };
    if (next.length) newValue[questionKey] = next;
    else delete newValue[questionKey];
    onChange(newValue);
  };

  const groupCount = (questionKeys: string[]) =>
    questionKeys.reduce((sum, k) => sum + (value[k]?.length || 0), 0);

  return (
    <Accordion type="multiple" className="w-full">
      {PROPERTY_FEATURES.map((group) => {
        const questionKeys = group.questions.map((q) => q.key);
        const total = groupCount(questionKeys);
        return (
          <AccordionItem key={group.key} value={group.key}>
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                {group.label}
                {total > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {total}
                  </Badge>
                )}
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-1">
                {group.questions.map((q) => (
                  <div key={q.key}>
                    <p className="text-sm font-medium mb-2">{q.label}</p>
                    <div className="flex flex-wrap gap-2">
                      {q.options.map((opt) => {
                        const selected = (value[q.key] || []).includes(opt);
                        return (
                          <Badge
                            key={opt}
                            variant={selected ? 'default' : 'outline'}
                            className="cursor-pointer select-none px-3 py-1.5 text-sm"
                            onClick={() => toggle(q.key, opt)}
                          >
                            {selected && <Check className="h-3 w-3 mr-1" />}
                            {opt}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
