import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Profession } from "@/types/signup";
import { UserCheck, Compass, HardHat } from "lucide-react";

interface PFProfessionStepProps {
  value: Profession | null;
  onChange: (value: Profession) => void;
}

const professions = [
  {
    value: 'CORRETOR' as Profession,
    label: 'Corretor',
    description: 'Corretor de imóveis com CRECI',
    icon: UserCheck,
  },
  {
    value: 'ARQUITETO' as Profession,
    label: 'Arquiteto',
    description: 'Profissional com CAU',
    icon: Compass,
  },
  {
    value: 'ENGENHEIRO' as Profession,
    label: 'Engenheiro',
    description: 'Profissional com CREA',
    icon: HardHat,
  },
];

export function PFProfessionStep({ value, onChange }: PFProfessionStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">Atuação Profissional</h2>
        <p className="text-muted-foreground mt-2">
          Você atua como algum profissional regulamentado?
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {professions.map((profession) => {
          const Icon = profession.icon;
          return (
            <Card
              key={profession.value}
              className={cn(
                "cursor-pointer transition-all hover:border-primary",
                value === profession.value && "border-primary ring-2 ring-primary/20"
              )}
              onClick={() => onChange(profession.value)}
            >
              <CardContent className="flex flex-col items-center justify-center p-6">
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center mb-3",
                  value === profession.value ? "bg-primary text-primary-foreground" : "bg-muted"
                )}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold">{profession.label}</h3>
                <p className="text-xs text-muted-foreground text-center mt-1">
                  {profession.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
