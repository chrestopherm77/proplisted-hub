import { cn } from "@/lib/utils";

interface StepContainerProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

export function StepContainer({ title, subtitle, children, className }: StepContainerProps) {
  return (
    <div className={cn("space-y-6 animate-in fade-in-50 slide-in-from-right-5 duration-300", className)}>
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold text-foreground">
          {title}
        </h2>
        {subtitle && (
          <p className="text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>
      <div className="pt-4">
        {children}
      </div>
    </div>
  );
}
