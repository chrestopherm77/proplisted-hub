import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SignupFormData } from "@/types/signup";
import { formatCPF, formatPhone, validateCPF, validateEmail, validatePhone } from "@/lib/validators";
import { User, CreditCard, MapPin, Mail, Phone, CheckCircle } from "lucide-react";

interface PFGeneralDataStepProps {
  formData: SignupFormData;
  onChange: (field: keyof SignupFormData, value: string) => void;
  errors: Record<string, string>;
  emailVerified?: boolean;
}

export function PFGeneralDataStep({ formData, onChange, errors, emailVerified }: PFGeneralDataStepProps) {
  const handleCPFChange = (value: string) => {
    onChange('cpf', formatCPF(value));
  };

  const handlePhoneChange = (value: string) => {
    onChange('phone', formatPhone(value));
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">Dados Pessoais</h2>
        <p className="text-muted-foreground mt-2">
          Preencha seus dados pessoais
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Nome Completo *
          </Label>
          <Input
            id="name"
            placeholder="Seu nome completo"
            value={formData.name}
            onChange={(e) => onChange('name', e.target.value)}
            className={errors.name ? "border-destructive" : ""}
          />
          {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="cpf" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            CPF *
          </Label>
          <Input
            id="cpf"
            placeholder="000.000.000-00"
            value={formData.cpf}
            onChange={(e) => handleCPFChange(e.target.value)}
            className={errors.cpf ? "border-destructive" : ""}
          />
          {errors.cpf && <p className="text-sm text-destructive">{errors.cpf}</p>}
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
            {emailVerified && (
              <span className="ml-auto flex items-center gap-1 text-xs text-green-600">
                <CheckCircle className="w-3 h-3" />
                Verificado
              </span>
            )}
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            value={formData.email}
            onChange={(e) => onChange('email', e.target.value)}
            className={errors.email ? "border-destructive" : emailVerified ? "border-green-500" : ""}
            disabled={emailVerified}
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
