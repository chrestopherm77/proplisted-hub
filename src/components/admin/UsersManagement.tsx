import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search } from 'lucide-react';

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
  created_at: string | null;
}

const professionLabels: Record<string, string> = {
  CORRETOR: 'Corretor',
  ARQUITETO: 'Arquiteto',
  ENGENHEIRO: 'Engenheiro',
};

interface UsersManagementProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UsersManagement({ open, onOpenChange }: UsersManagementProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (open) {
      fetchProfiles();
    }
  }, [open]);

  const fetchProfiles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, phone, person_type, cpf, cnpj, company_name, profession, creci, creci_uf, cau, cau_uf, crea, crea_uf, address_uf, address_city, address_neighborhood, created_at')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setProfiles(data);
    }
    setLoading(false);
  };

  const filtered = profiles.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.phone?.includes(q) ||
      p.company_name?.toLowerCase().includes(q)
    );
  });

  const getRegistration = (p: Profile) => {
    if (p.creci) return `CRECI ${p.creci}/${p.creci_uf || ''}`;
    if (p.cau) return `CAU ${p.cau}/${p.cau_uf || ''}`;
    if (p.crea) return `CREA ${p.crea}/${p.crea_uf || ''}`;
    return '-';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Corretores Cadastrados</DialogTitle>
          <DialogDescription>Lista completa de todos os parceiros cadastrados na plataforma</DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="overflow-auto flex-1 -mx-6 px-6">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[150px]">Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="min-w-[130px]">Telefone</TableHead>
                  <TableHead>CPF/CNPJ</TableHead>
                  <TableHead>Profissão</TableHead>
                  <TableHead>Registro</TableHead>
                  <TableHead>UF/Cidade</TableHead>
                  <TableHead>Bairro</TableHead>
                  <TableHead className="min-w-[100px]">Cadastro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.company_name || p.name}</TableCell>
                    <TableCell>{p.person_type === 'PJ' ? 'PJ' : 'PF'}</TableCell>
                    <TableCell>{p.phone}</TableCell>
                    <TableCell>{p.person_type === 'PJ' ? p.cnpj : p.cpf || '-'}</TableCell>
                    <TableCell>{professionLabels[p.profession || ''] || p.profession || '-'}</TableCell>
                    <TableCell>{getRegistration(p)}</TableCell>
                    <TableCell>{p.address_uf ? `${p.address_uf}/${p.address_city || ''}` : '-'}</TableCell>
                    <TableCell>{p.address_neighborhood || '-'}</TableCell>
                    <TableCell>
                      {p.created_at
                        ? new Date(p.created_at).toLocaleDateString('pt-BR')
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      Nenhum corretor encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
