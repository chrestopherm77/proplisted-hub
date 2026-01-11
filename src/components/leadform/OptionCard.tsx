import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface OptionCardProps {
  label: string;
  icon?: React.ReactNode;
  isSelected: boolean;
  onClick: () => void;
  className?: string;
}

export function OptionCard({ label, icon, isSelected, onClick, className }: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 transition-all duration-200",
        "hover:border-primary/50 hover:bg-primary/5",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        isSelected
          ? "border-primary bg-primary/10 shadow-md"
          : "border-border bg-card",
        className
      )}
    >
      {isSelected && (
        <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
          <Check className="h-3 w-3 text-primary-foreground" />
        </div>
      )}
      {icon && (
        <div className={cn(
          "text-2xl",
          isSelected ? "text-primary" : "text-muted-foreground"
        )}>
          {icon}
        </div>
      )}
      <span className={cn(
        "text-sm font-medium text-center",
        isSelected ? "text-primary" : "text-foreground"
      )}>
        {label}
      </span>
    </button>
  );
}

interface MultiOptionCardProps extends Omit<OptionCardProps, 'isSelected' | 'onClick'> {
  value: string;
  selectedValues: string[];
  onToggle: (value: string) => void;
}

export function MultiOptionCard({ 
  value, 
  label, 
  icon, 
  selectedValues, 
  onToggle,
  className 
}: MultiOptionCardProps) {
  const isSelected = selectedValues.includes(value);
  
  return (
    <OptionCard
      label={label}
      icon={icon}
      isSelected={isSelected}
      onClick={() => onToggle(value)}
      className={className}
    />
  );
}
