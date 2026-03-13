import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search } from 'lucide-react';

interface LoginEntry {
  id: string;
  user_id: string;
  logged_in_at: string;
}

export function AccessHistory() {
  const [entries, setEntries] = useState<LoginEntry[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [emailMap, setEmailMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    const [historyRes, profilesRes, emailsRes] = await Promise.all([
      supabase
        .from('login_history')
        .select('id, user_id, logged_in_at')
        .order('logged_in_at', { ascending: false })
        .limit(500),
      supabase
        .from('profiles')
        .select('id, name, company_name'),
      supabase.functions.invoke('list-users'),
    ]);

    if (historyRes.data) {
      setEntries(historyRes.data);
    }

    if (profilesRes.data) {
      const map: Record<string, string> = {};
      for (const p of profilesRes.data) {
        map[p.id] = p.company_name || p.name;
      }
      setProfiles(map);
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

  const filtered = entries.filter((e) => {
    const q = search.toLowerCase();
    const name = profiles[e.user_id] || '';
    const email = emailMap[e.user_id] || '';
    return name.toLowerCase().includes(q) || email.toLowerCase().includes(q);
  });

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Carregando histórico de acessos...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou e-mail..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[180px]">Nome</TableHead>
              <TableHead className="min-w-[200px]">E-mail</TableHead>
              <TableHead className="min-w-[180px]">Data/Hora do Acesso</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="font-medium">{profiles[e.user_id] || '-'}</TableCell>
                <TableCell className="text-xs">{emailMap[e.user_id] || '-'}</TableCell>
                <TableCell>
                  {new Date(e.logged_in_at).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                  Nenhum acesso encontrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
