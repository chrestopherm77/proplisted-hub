import { StepProps } from "../types";
import { StepContainer } from "../StepContainer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPhone } from "@/lib/validators";
import { User, Phone, Mail } from "lucide-react";

export function ContactStep({ data, updateData }: StepProps) {
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    updateData({ phone: formatted });
  };

  return (
    <StepContainer
      title="Seus dados de contato"
      subtitle="Preencha suas informações para que possamos entrar em contato"
    >
      <div className="space-y-6 max-w-md mx-auto">
        <div className="space-y-2">
          <Label htmlFor="name" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Nome completo *
          </Label>
          <Input
            id="name"
            value={data.name}
            onChange={(e) => updateData({ name: e.target.value })}
            placeholder="Digite seu nome completo"
            className="h-12"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Telefone / WhatsApp *
          </Label>
          <Input
            id="phone"
            value={data.phone}
            onChange={handlePhoneChange}
            placeholder="(00) 00000-0000"
            className="h-12"
            maxLength={15}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            E-mail (opcional)
          </Label>
          <Input
            id="email"
            type="email"
            value={data.email}
            onChange={(e) => updateData({ email: e.target.value })}
            placeholder="seu@email.com"
            className="h-12"
          />
        </div>
      </div>
    </StepContainer>
  );
}
