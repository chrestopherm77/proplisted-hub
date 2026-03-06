import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Briefcase } from 'lucide-react';
import { useIBGELocation } from '@/hooks/useIBGELocation';

interface ProfileProfessionalCardProps {
  person_type: string;
  profession: string;
  company_type: string;
  creci: string;
  creci_uf: string;
  cau: string;
  cau_uf: string;
  crea: string;
  crea_uf: string;
  creci_pj: string;
  creci_pj_uf: string;
  crea_pj: string;
  crea_pj_uf: string;
  rt_name: string;
  rt_cpf: string;
  rt_crea: string;
  rt_crea_uf: string;
  rt_cau: string;
  rt_cau_uf: string;
  onChange: (updates: Record<string, string>) => void;
}

const UF_OPTIONS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
];

function UFSelect({ value, onValueChange, label }: { value: string; onValueChange: (v: string) => void; label: string }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder="UF" />
        </SelectTrigger>
        <SelectContent>
          {UF_OPTIONS.map((uf) => (
            <SelectItem key={uf} value={uf}>{uf}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function ProfileProfessionalCard(props: ProfileProfessionalCardProps) {
  const { person_type, profession, company_type, onChange } = props;

  const showPFCorretor = person_type === 'PF' && profession === 'corretor';
  const showPFArquiteto = person_type === 'PF' && profession === 'arquiteto';
  const showPFEngenheiro = person_type === 'PF' && profession === 'engenheiro';
  const showPJImobiliaria = person_type === 'PJ' && company_type === 'imobiliaria';
  const showPJConstrutora = person_type === 'PJ' && company_type === 'construtora';

  const hasContent = showPFCorretor || showPFArquiteto || showPFEngenheiro || showPJImobiliaria || showPJConstrutora;

  if (!hasContent) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5" />
          Dados Profissionais
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {showPFCorretor && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>CRECI</Label>
              <Input value={props.creci} onChange={(e) => onChange({ creci: e.target.value })} placeholder="Nº CRECI" />
            </div>
            <UFSelect value={props.creci_uf} onValueChange={(v) => onChange({ creci_uf: v })} label="UF do CRECI" />
          </div>
        )}

        {showPFArquiteto && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>CAU</Label>
              <Input value={props.cau} onChange={(e) => onChange({ cau: e.target.value })} placeholder="Nº CAU" />
            </div>
            <UFSelect value={props.cau_uf} onValueChange={(v) => onChange({ cau_uf: v })} label="UF do CAU" />
          </div>
        )}

        {showPFEngenheiro && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>CREA</Label>
              <Input value={props.crea} onChange={(e) => onChange({ crea: e.target.value })} placeholder="Nº CREA" />
            </div>
            <UFSelect value={props.crea_uf} onValueChange={(v) => onChange({ crea_uf: v })} label="UF do CREA" />
          </div>
        )}

        {showPJImobiliaria && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>CRECI PJ</Label>
                <Input value={props.creci_pj} onChange={(e) => onChange({ creci_pj: e.target.value })} placeholder="Nº CRECI PJ" />
              </div>
              <UFSelect value={props.creci_pj_uf} onValueChange={(v) => onChange({ creci_pj_uf: v })} label="UF do CRECI PJ" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome do RT</Label>
                <Input value={props.rt_name} onChange={(e) => onChange({ rt_name: e.target.value })} placeholder="Responsável Técnico" />
              </div>
              <div className="space-y-2">
                <Label>CPF do RT</Label>
                <Input value={props.rt_cpf} onChange={(e) => onChange({ rt_cpf: e.target.value })} placeholder="000.000.000-00" />
              </div>
            </div>
          </>
        )}

        {showPJConstrutora && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>CREA PJ</Label>
                <Input value={props.crea_pj} onChange={(e) => onChange({ crea_pj: e.target.value })} placeholder="Nº CREA PJ" />
              </div>
              <UFSelect value={props.crea_pj_uf} onValueChange={(v) => onChange({ crea_pj_uf: v })} label="UF do CREA PJ" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome do RT</Label>
                <Input value={props.rt_name} onChange={(e) => onChange({ rt_name: e.target.value })} placeholder="Responsável Técnico" />
              </div>
              <div className="space-y-2">
                <Label>CPF do RT</Label>
                <Input value={props.rt_cpf} onChange={(e) => onChange({ rt_cpf: e.target.value })} placeholder="000.000.000-00" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>CREA do RT</Label>
                <Input value={props.rt_crea} onChange={(e) => onChange({ rt_crea: e.target.value })} placeholder="Nº CREA" />
              </div>
              <UFSelect value={props.rt_crea_uf} onValueChange={(v) => onChange({ rt_crea_uf: v })} label="UF do CREA RT" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>CAU do RT</Label>
                <Input value={props.rt_cau} onChange={(e) => onChange({ rt_cau: e.target.value })} placeholder="Nº CAU" />
              </div>
              <UFSelect value={props.rt_cau_uf} onValueChange={(v) => onChange({ rt_cau_uf: v })} label="UF do CAU RT" />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
