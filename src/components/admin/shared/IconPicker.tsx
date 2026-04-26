import * as LucideIcons from 'lucide-react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

/** Ícones disponíveis para escolha em qualquer card editável da home/LPs. */
export const ICON_LIBRARY: string[] = [
  'Target', 'Handshake', 'Building2', 'Home', 'Banknote', 'Sparkles',
  'Calculator', 'Bot', 'Newspaper', 'GraduationCap', 'Scale', 'Users',
  'Clock', 'TrendingUp', 'Shield', 'Zap', 'CheckCircle', 'Award',
  'Heart', 'Star', 'Rocket', 'BarChart3', 'DollarSign', 'Phone',
  'MapPin', 'MessageCircle', 'Mail', 'Globe', 'Briefcase', 'Lightbulb',
  'Crown', 'Gem', 'Gift', 'Trophy', 'Flame',
];

export function getLucideIcon(name: string) {
  const I = (LucideIcons as Record<string, unknown>)[name];
  return (I as React.ComponentType<{ className?: string }>) ?? LucideIcons.CircleDot;
}

interface Props {
  value: string;
  onChange: (icon: string) => void;
  disabled?: boolean;
}

export function IconPicker({ value, onChange, disabled }: Props) {
  const Current = getLucideIcon(value);
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger>
        <div className="flex items-center gap-2">
          <Current className="h-4 w-4 text-primary" />
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {ICON_LIBRARY.map((name) => {
          const I = getLucideIcon(name);
          return (
            <SelectItem key={name} value={name}>
              <div className="flex items-center gap-2">
                <I className="h-4 w-4" />
                <span>{name}</span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
