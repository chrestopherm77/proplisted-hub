import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User } from 'lucide-react';

interface ProfileData {
  person_type: string;
  name: string;
  cpf: string;
  profession: string;
  company_name: string;
  cnpj: string;
  company_type: string;
}

interface ProfilePersonalCardProps {
  profile: ProfileData;
  onChange: (updates: Partial<ProfileData>) => void;
}

export function ProfilePersonalCard({ profile, onChange }: ProfilePersonalCardProps) {
  const isPF = profile.person_type === 'PF';
  const isPJ = profile.person_type === 'PJ';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          {isPJ ? 'Dados da Empresa' : 'Dados Pessoais'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Tipo de Pessoa</Label>
          <Select value={profile.person_type} onValueChange={(v) => onChange({ person_type: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PF">Pessoa Física</SelectItem>
              <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isPF && (
          <>
            <div className="space-y-2">
              <Label>Nome Completo</Label>
              <Input
                value={profile.name}
                onChange={(e) => onChange({ name: e.target.value })}
                placeholder="Seu nome completo"
              />
            </div>
            <div className="space-y-2">
              <Label>CPF</Label>
              <Input
                value={profile.cpf}
                onChange={(e) => onChange({ cpf: e.target.value })}
                placeholder="000.000.000-00"
              />
            </div>
            <div className="space-y-2">
              <Label>Profissão</Label>
              <Select value={profile.profession} onValueChange={(v) => onChange({ profession: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a profissão" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="corretor">Corretor(a) de Imóveis</SelectItem>
                  <SelectItem value="arquiteto">Arquiteto(a)</SelectItem>
                  <SelectItem value="engenheiro">Engenheiro(a)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {isPJ && (
          <>
            <div className="space-y-2">
              <Label>Razão Social</Label>
              <Input
                value={profile.company_name}
                onChange={(e) => onChange({ company_name: e.target.value })}
                placeholder="Nome da empresa"
              />
            </div>
            <div className="space-y-2">
              <Label>CNPJ</Label>
              <Input
                value={profile.cnpj}
                onChange={(e) => onChange({ cnpj: e.target.value })}
                placeholder="00.000.000/0000-00"
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Empresa</Label>
              <Select value={profile.company_type} onValueChange={(v) => onChange({ company_type: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="imobiliaria">Imobiliária</SelectItem>
                  <SelectItem value="construtora">Construtora</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
