import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SignupFormData, UF_OPTIONS, Profession } from "@/types/signup";
import { Award } from "lucide-react";

interface PFProfessionalDataStepProps {
  formData: SignupFormData;
  onChange: (field: keyof SignupFormData, value: string) => void;
  errors: Record<string, string>;
}

export function PFProfessionalDataStep({ formData, onChange, errors }: PFProfessionalDataStepProps) {
  const profession = formData.profession;

  if (!profession) {
    return null;
  }

  const getTitle = () => {
    switch (profession) {
      case 'CORRETOR':
        return 'Dados do CRECI';
      case 'ARQUITETO':
        return 'Dados do CAU';
      case 'ENGENHEIRO':
        return 'Dados do CREA';
      default:
        return 'Dados Profissionais';
    }
  };

  const getRegisterLabel = () => {
    switch (profession) {
      case 'CORRETOR':
        return 'CRECI';
      case 'ARQUITETO':
        return 'CAU';
      case 'ENGENHEIRO':
        return 'CREA';
      default:
        return 'Registro';
    }
  };

  const getFieldName = (): keyof SignupFormData => {
    switch (profession) {
      case 'CORRETOR':
        return 'creci';
      case 'ARQUITETO':
        return 'cau';
      case 'ENGENHEIRO':
        return 'crea';
      default:
        return 'creci';
    }
  };

  const getUfFieldName = (): keyof SignupFormData => {
    switch (profession) {
      case 'CORRETOR':
        return 'creciUf';
      case 'ARQUITETO':
        return 'cauUf';
      case 'ENGENHEIRO':
        return 'creaUf';
      default:
        return 'creciUf';
    }
  };

  const fieldName = getFieldName();
  const ufFieldName = getUfFieldName();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">{getTitle()}</h2>
        <p className="text-muted-foreground mt-2">
          Informe seu registro profissional
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="register" className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              {getRegisterLabel()} *
            </Label>
            <Input
              id="register"
              placeholder={`Número do ${getRegisterLabel()}`}
              value={formData[fieldName] as string}
              onChange={(e) => onChange(fieldName, e.target.value)}
              className={errors[fieldName] ? "border-destructive" : ""}
            />
            {errors[fieldName] && <p className="text-sm text-destructive">{errors[fieldName]}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="uf">UF *</Label>
            <Select
              value={formData[ufFieldName] as string}
              onValueChange={(value) => onChange(ufFieldName, value)}
            >
              <SelectTrigger className={errors[ufFieldName] ? "border-destructive" : ""}>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {UF_OPTIONS.map((uf) => (
                  <SelectItem key={uf} value={uf}>
                    {uf}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors[ufFieldName] && <p className="text-sm text-destructive">{errors[ufFieldName]}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
