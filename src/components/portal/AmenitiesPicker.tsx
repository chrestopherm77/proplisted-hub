import { Badge } from '@/components/ui/badge';
import { AMENITIES } from '@/lib/propertyUtils';
import { Check } from 'lucide-react';

interface AmenitiesPickerProps {
  value: string[];
  onChange: (next: string[]) => void;
}

export function AmenitiesPicker({ value, onChange }: AmenitiesPickerProps) {
  const toggle = (a: string) => {
    if (value.includes(a)) {
      onChange(value.filter((v) => v !== a));
    } else {
      onChange([...value, a]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {AMENITIES.map((a) => {
        const selected = value.includes(a);
        return (
          <Badge
            key={a}
            variant={selected ? 'default' : 'outline'}
            className="cursor-pointer select-none px-3 py-1.5 text-sm"
            onClick={() => toggle(a)}
          >
            {selected && <Check className="h-3 w-3 mr-1" />}
            {a}
          </Badge>
        );
      })}
    </div>
  );
}
