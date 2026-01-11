import { cn } from "@/lib/utils";

interface LeadFormProgressProps {
  currentStep: number;
  totalSteps: number;
  label?: string;
}

export function LeadFormProgress({ currentStep, totalSteps, label }: LeadFormProgressProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between items-center text-sm">
        <span className="text-muted-foreground">
          {label || `Passo ${currentStep} de ${totalSteps}`}
        </span>
        <span className="text-muted-foreground font-medium">
          {Math.round(progress)}%
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full bg-primary rounded-full transition-all duration-500 ease-out"
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
