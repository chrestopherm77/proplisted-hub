import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  name: string;
  phone: string;
  person_type: string | null;
  cpf: string | null;
  cnpj: string | null;
  company_name: string | null;
  profession: string | null;
  creci: string | null;
  creci_uf: string | null;
  cau: string | null;
  cau_uf: string | null;
  crea: string | null;
  crea_uf: string | null;
  address_uf: string | null;
  address_city: string | null;
  address_neighborhood: string | null;
  is_active: boolean;
  created_at: string | null;
}

const professionLabels: Record<string, string> = {
  CORRETOR: 'Corretor',
  ARQUITETO: 'Arquiteto',
  ENGENHEIRO: 'Engenheiro',
};

export function UsersManagement() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [emailMap, setEmailMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    const [profilesRes, emailsRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, name, phone, person_type, cpf, cnpj, company_name, profession, creci, creci_uf, cau, cau_uf, crea, crea_uf, address_uf, address_city, address_neighborhood, is_active, created_at')
        .order('created_at', { ascending: false }),
      supabase.functions.invoke('list-users'),
    ]);

    if (profilesRes.data) {
      setProfiles(profilesRes.data);
    }

    if (emailsRes.data?.users) {
      const map: Record<string, string> = {};
      for (const u of emailsRes.data.users) {
        map[u.id] = u.email;
      }
      setEmailMap(map);
    }

    setLoading(false);
  };

  const toggleActive = async (profile: Profile) => {
    setTogglingId(profile.id);
    const newStatus = !profile.is_active;

    const { error } = await supabase
      .from('profiles')
      .update({ is_active: newStatus } as any)
      .eq('id', profile.id);

    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível alterar o status', variant: 'destructive' });
    } else {
      setProfiles((prev) => prev.map((p) => (p.id === profile.id ? { ...p, is_active: newStatus } : p)));
      toast({ title: newStatus ? 'Usuário ativado' : 'Usuário inativado' });
    }
    setTogglingId(null);
  };

  const getRegistration = (p: Profile) => {
    if (p.creci) return `CRECI ${p.creci}/${p.creci_uf || ''}`;
    if (p.cau) return `CAU ${p.cau}/${p.cau_uf || ''}`;
    if (p.crea) return `CREA ${p.crea}/${p.crea_uf || ''}`;
    return '-';
  };

  const filtered = profiles.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.phone?.includes(q) ||
      p.company_name?.toLowerCase().includes(q) ||
      emailMap[p.id]?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Carregando usuários...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, e-mail ou telefone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[150px]">Nome</TableHead>
              <TableHead className="min-w-[100px]">Cadastro</TableHead>
              <TableHead className="min-w-[180px]">E-mail</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="min-w-[130px]">Telefone</TableHead>
              <TableHead>CPF/CNPJ</TableHead>
              <TableHead>Profissão</TableHead>
              <TableHead>Registro</TableHead>
              <TableHead>UF/Cidade</TableHead>
              <TableHead>Bairro</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.company_name || p.name}</TableCell>
                <TableCell>
                  {p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR') : '-'}
                </TableCell>
                <TableCell className="text-xs">{emailMap[p.id] || '-'}</TableCell>
                <TableCell>{p.person_type === 'PJ' ? 'PJ' : 'PF'}</TableCell>
                <TableCell>{p.phone}</TableCell>
                <TableCell>{p.person_type === 'PJ' ? p.cnpj : p.cpf || '-'}</TableCell>
                <TableCell>{professionLabels[p.profession || ''] || p.profession || '-'}</TableCell>
                <TableCell>{getRegistration(p)}</TableCell>
                <TableCell>{p.address_uf ? `${p.address_uf}/${p.address_city || ''}` : '-'}</TableCell>
                <TableCell>{p.address_neighborhood || '-'}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={p.is_active}
                      onCheckedChange={() => toggleActive(p)}
                      disabled={togglingId === p.id}
                    />
                    <Badge variant={p.is_active ? 'default' : 'destructive'} className="text-xs">
                      {p.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={11} className="text-center text-muted-foreground py-8">
                  Nenhum usuário encontrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
