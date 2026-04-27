import conectaeLogo from '@/assets/conectae-logo.png';
import { cn } from '@/lib/utils';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  /** Mantido por compatibilidade — não tem efeito na nova logo em imagem. */
  hideIcon?: boolean;
}

const SIZE_MAP: Record<NonNullable<BrandLogoProps['size']>, string> = {
  sm: 'h-8',
  md: 'h-12',
  lg: 'h-16',
  xl: 'h-20 md:h-24',
};

/**
 * Logo oficial da Conectae renderizada como imagem.
 * Substitui o ícone + texto legado em todos os cabeçalhos visíveis.
 */
export const BrandLogo = ({ size = 'md', className }: BrandLogoProps) => {
  return (
    <img
      src={conectaeLogo}
      alt="Conectae"
      className={cn('w-auto object-contain select-none', SIZE_MAP[size], className)}
      draggable={false}
    />
  );
};

export default BrandLogo;
