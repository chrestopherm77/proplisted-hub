import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SignupFormData } from "@/types/signup";
import { formatCNPJ, formatPhone } from "@/lib/validators";
import { Building2, CreditCard, MapPin, Mail, Phone } from "lucide-react";

interface PJGeneralDataStepProps {
  formData: SignupFormData;
  onChange: (field: keyof SignupFormData, value: string) => void;
  errors: Record<string, string>;
}

export function PJGeneralDataStep({ formData, onChange, errors }: PJGeneralDataStepProps) {
  const handleCNPJChange = (value: string) => {
    onChange('cnpj', formatCNPJ(value));
  };

  const handlePhoneChange = (value: string) => {
    onChange('phone', formatPhone(value));
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">Dados da Empresa</h2>
        <p className="text-muted-foreground mt-2">
          Preencha os dados da pessoa jurídica
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="companyName" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Razão Social *
          </Label>
          <Input
            id="companyName"
            placeholder="Nome da empresa"
            value={formData.companyName}
            onChange={(e) => onChange('companyName', e.target.value)}
            className={errors.companyName ? "border-destructive" : ""}
          />
          {errors.companyName && <p className="text-sm text-destructive">{errors.companyName}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="cnpj" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            CNPJ *
          </Label>
          <Input
            id="cnpj"
            placeholder="00.000.000/0000-00"
            value={formData.cnpj}
            onChange={(e) => handleCNPJChange(e.target.value)}
            className={errors.cnpj ? "border-destructive" : ""}
          />
          {errors.cnpj && <p className="text-sm text-destructive">{errors.cnpj}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="address" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Endereço *
          </Label>
          <Input
            id="address"
            placeholder="Rua, número, bairro, cidade - UF"
            value={formData.address}
            onChange={(e) => onChange('address', e.target.value)}
            className={errors.address ? "border-destructive" : ""}
          />
          {errors.address && <p className="text-sm text-destructive">{errors.address}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            E-mail *
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="empresa@email.com"
            value={formData.email}
            onChange={(e) => onChange('email', e.target.value)}
            className={errors.email ? "border-destructive" : ""}
          />
          {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            Telefone *
          </Label>
          <Input
            id="phone"
            placeholder="(00) 00000-0000"
            value={formData.phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            className={errors.phone ? "border-destructive" : ""}
          />
          {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
        </div>
      </div>
    </div>
  );
}
