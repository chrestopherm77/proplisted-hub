import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SignupFormData, UF_OPTIONS } from "@/types/signup";
import { formatCPF } from "@/lib/validators";
import { Award, User, CreditCard } from "lucide-react";

interface PJProfessionalDataStepProps {
  formData: SignupFormData;
  onChange: (field: keyof SignupFormData, value: string) => void;
  errors: Record<string, string>;
}

export function PJProfessionalDataStep({ formData, onChange, errors }: PJProfessionalDataStepProps) {
  const companyType = formData.companyType;

  const handleRtCpfChange = (value: string) => {
    onChange('rtCpf', formatCPF(value));
  };

  if (companyType === 'IMOBILIARIA') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground">Dados da Imobiliária</h2>
          <p className="text-muted-foreground mt-2">
            Informe o CRECI e dados do Responsável Técnico
          </p>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="creciPj" className="flex items-center gap-2">
                <Award className="w-4 h-4" />
                CRECI da Imobiliária *
              </Label>
              <Input
                id="creciPj"
                placeholder="Número do CRECI"
                value={formData.creciPj}
                onChange={(e) => onChange('creciPj', e.target.value)}
                className={errors.creciPj ? "border-destructive" : ""}
              />
              {errors.creciPj && <p className="text-sm text-destructive">{errors.creciPj}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="creciPjUf">UF *</Label>
              <Select
                value={formData.creciPjUf}
                onValueChange={(value) => onChange('creciPjUf', value)}
              >
                <SelectTrigger className={errors.creciPjUf ? "border-destructive" : ""}>
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
              {errors.creciPjUf && <p className="text-sm text-destructive">{errors.creciPjUf}</p>}
            </div>
          </div>

          <div className="border-t pt-4 mt-4">
            <h3 className="font-semibold mb-4">Responsável Técnico</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rtName" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Nome do RT *
                </Label>
                <Input
                  id="rtName"
                  placeholder="Nome completo do responsável técnico"
                  value={formData.rtName}
                  onChange={(e) => onChange('rtName', e.target.value)}
                  className={errors.rtName ? "border-destructive" : ""}
                />
                {errors.rtName && <p className="text-sm text-destructive">{errors.rtName}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="rtCpf" className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  CPF do RT *
                </Label>
                <Input
                  id="rtCpf"
                  placeholder="000.000.000-00"
                  value={formData.rtCpf}
                  onChange={(e) => handleRtCpfChange(e.target.value)}
                  className={errors.rtCpf ? "border-destructive" : ""}
                />
                {errors.rtCpf && <p className="text-sm text-destructive">{errors.rtCpf}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (companyType === 'CONSTRUTORA') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground">Dados da Construtora</h2>
          <p className="text-muted-foreground mt-2">
            Informe o CREA e dados do Responsável Técnico
          </p>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="creaPj" className="flex items-center gap-2">
                <Award className="w-4 h-4" />
                CREA da Construtora *
              </Label>
              <Input
                id="creaPj"
                placeholder="Número do CREA"
                value={formData.creaPj}
                onChange={(e) => onChange('creaPj', e.target.value)}
                className={errors.creaPj ? "border-destructive" : ""}
              />
              {errors.creaPj && <p className="text-sm text-destructive">{errors.creaPj}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="creaPjUf">UF *</Label>
              <Select
                value={formData.creaPjUf}
                onValueChange={(value) => onChange('creaPjUf', value)}
              >
                <SelectTrigger className={errors.creaPjUf ? "border-destructive" : ""}>
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
              {errors.creaPjUf && <p className="text-sm text-destructive">{errors.creaPjUf}</p>}
            </div>
          </div>

          <div className="border-t pt-4 mt-4">
            <h3 className="font-semibold mb-4">Responsável Técnico</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rtName" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Nome do RT *
                </Label>
                <Input
                  id="rtName"
                  placeholder="Nome completo do responsável técnico"
                  value={formData.rtName}
                  onChange={(e) => onChange('rtName', e.target.value)}
                  className={errors.rtName ? "border-destructive" : ""}
                />
                {errors.rtName && <p className="text-sm text-destructive">{errors.rtName}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rtCrea" className="flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    CREA ou CAU do RT *
                  </Label>
                  <Input
                    id="rtCrea"
                    placeholder="Número do registro"
                    value={formData.rtCrea || formData.rtCau}
                    onChange={(e) => onChange('rtCrea', e.target.value)}
                    className={errors.rtCrea ? "border-destructive" : ""}
                  />
                  {errors.rtCrea && <p className="text-sm text-destructive">{errors.rtCrea}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rtCreaUf">UF *</Label>
                  <Select
                    value={formData.rtCreaUf || formData.rtCauUf}
                    onValueChange={(value) => onChange('rtCreaUf', value)}
                  >
                    <SelectTrigger className={errors.rtCreaUf ? "border-destructive" : ""}>
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
                  {errors.rtCreaUf && <p className="text-sm text-destructive">{errors.rtCreaUf}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rtCpf" className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  CPF do RT *
                </Label>
                <Input
                  id="rtCpf"
                  placeholder="000.000.000-00"
                  value={formData.rtCpf}
                  onChange={(e) => handleRtCpfChange(e.target.value)}
                  className={errors.rtCpf ? "border-destructive" : ""}
                />
                {errors.rtCpf && <p className="text-sm text-destructive">{errors.rtCpf}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
