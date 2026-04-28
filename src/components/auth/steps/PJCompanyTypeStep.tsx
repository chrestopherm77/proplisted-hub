import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CompanyType } from "@/types/signup";
import { Home, Building } from "lucide-react";

interface PJCompanyTypeStepProps {
  value: CompanyType | null;
  onChange: (value: CompanyType) => void;
}

const companyTypes = [
  {
    value: 'IMOBILIARIA' as CompanyType,
    label: 'Imobiliária',
    description: 'Empresa de intermediação imobiliária com CRECI',
    icon: Home,
  },
  {
    value: 'CONSTRUTORA' as CompanyType,
    label: 'Construtora',
    description: 'Empresa de construção civil com CREA',
    icon: Building,
  },
];

export function PJCompanyTypeStep({ value, onChange }: PJCompanyTypeStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">Tipo de Empresa</h2>
        <p className="text-muted-foreground mt-2">
          Selecione o tipo da empresa (obrigatório)
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {companyTypes.map((company) => {
          const Icon = company.icon;
          return (
            <Card
              key={company.value}
              className={cn(
                "cursor-pointer transition-all hover:border-primary",
                value === company.value && "border-primary ring-2 ring-primary/20"
              )}
              onClick={() => onChange(company.value)}
            >
              <CardContent className="flex flex-col items-center justify-center p-8">
                <div className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center mb-4",
                  value === company.value ? "bg-primary text-primary-foreground" : "bg-muted"
                )}>
                  <Icon className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-semibold">{company.label}</h3>
                <p className="text-sm text-muted-foreground text-center mt-2">
                  {company.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
