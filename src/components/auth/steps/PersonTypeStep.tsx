import { Building2, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PersonType } from "@/types/signup";

interface PersonTypeStepProps {
  value: PersonType | null;
  onChange: (value: PersonType) => void;
}

export function PersonTypeStep({ value, onChange }: PersonTypeStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">Tipo de Cadastro</h2>
        <p className="text-muted-foreground mt-2">
          O comprador é Pessoa Física (PF) ou Pessoa Jurídica (PJ)?
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card
          className={cn(
            "cursor-pointer transition-all hover:border-primary",
            value === 'PF' && "border-primary ring-2 ring-primary/20"
          )}
          onClick={() => onChange('PF')}
        >
          <CardContent className="flex flex-col items-center justify-center p-8">
            <div className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center mb-4",
              value === 'PF' ? "bg-primary text-primary-foreground" : "bg-muted"
            )}>
              <User className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold">Pessoa Física</h3>
            <p className="text-sm text-muted-foreground text-center mt-2">
              Cadastro individual com CPF
            </p>
          </CardContent>
        </Card>
        
        <Card
          className={cn(
            "cursor-pointer transition-all hover:border-primary",
            value === 'PJ' && "border-primary ring-2 ring-primary/20"
          )}
          onClick={() => onChange('PJ')}
        >
          <CardContent className="flex flex-col items-center justify-center p-8">
            <div className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center mb-4",
              value === 'PJ' ? "bg-primary text-primary-foreground" : "bg-muted"
            )}>
              <Building2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold">Pessoa Jurídica</h3>
            <p className="text-sm text-muted-foreground text-center mt-2">
              Cadastro empresarial com CNPJ
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
