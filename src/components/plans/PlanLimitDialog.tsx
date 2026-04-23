import { useNavigate } from 'react-router-dom';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown, ArrowUpRight } from 'lucide-react';

interface PlanLimitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description: string;
  ctaLabel?: string;
  ctaPath?: string;
  secondaryCtaLabel?: string;
  secondaryCtaPath?: string;
}

export const PlanLimitDialog = ({
  open,
  onOpenChange,
  title = 'Limite do plano atingido',
  description,
  ctaLabel = 'Ver planos disponíveis',
  ctaPath = '/planos',
  secondaryCtaLabel,
  secondaryCtaPath,
}: PlanLimitDialogProps) => {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Crown className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center">{title}</DialogTitle>
          <DialogDescription className="text-center pt-2">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-col gap-2">
          <Button
            className="w-full"
            onClick={() => {
              onOpenChange(false);
              navigate(ctaPath);
            }}
          >
            <ArrowUpRight className="h-4 w-4 mr-2" />
            {ctaLabel}
          </Button>
          {secondaryCtaLabel && secondaryCtaPath && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                onOpenChange(false);
                navigate(secondaryCtaPath);
              }}
            >
              {secondaryCtaLabel}
            </Button>
          )}
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
