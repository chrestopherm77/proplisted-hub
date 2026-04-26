import { Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  /** Quando true, oculta o ícone (útil para footers compactos) */
  hideIcon?: boolean;
}

const SIZE_MAP = {
  sm: { text: 'text-base', icon: 'h-4 w-4' },
  md: { text: 'text-xl', icon: 'h-5 w-5' },
  lg: { text: 'text-2xl', icon: 'h-6 w-6' },
  xl: { text: 'text-3xl md:text-4xl', icon: 'h-8 w-8' },
};

/**
 * Logo textual da marca "Conectaae imob".
 * Substitui o PNG legado em todos os cabeçalhos visíveis (LP, Auth, Sidebar, etc.).
 */
export const BrandLogo = ({ size = 'md', className, hideIcon = false }: BrandLogoProps) => {
  const s = SIZE_MAP[size];
  return (
    <div className={cn('inline-flex items-center gap-1.5 select-none', className)}>
      {!hideIcon && (
        <span className="inline-flex items-center justify-center rounded-md bg-primary/10 p-1.5">
          <Building2 className={cn('text-primary', s.icon)} strokeWidth={2.4} />
        </span>
      )}
      <span className={cn('font-bold tracking-tight leading-none', s.text)}>
        <span className="text-primary">Conectaae</span>
        <span className="font-light text-muted-foreground ml-0.5">imob</span>
      </span>
    </div>
  );
};

export default BrandLogo;
