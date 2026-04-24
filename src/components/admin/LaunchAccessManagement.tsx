import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Loader2, Trash2 } from 'lucide-react';

interface Profile {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  company_name: string | null;
  company_type: string | null;
}

interface Permission {
  id: string;
  user_id: string;
  notes: string | null;
  created_at: string;
  profile?: Profile;
}

export function LaunchAccessManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<Profile[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  const [notesByUser, setNotesByUser] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    setLoadingPermissions(true);
    const { data: perms, error } = await supabase
      .from('launch_permissions')
      .select('id, user_id, notes, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Erro ao carregar liberações', description: error.message, variant: 'destructive' });
      setLoadingPermissions(false);
      return;
    }

    const userIds = (perms || []).map((p) => p.user_id);
    let profilesMap: Record<string, Profile> = {};
    if (userIds.length > 0) {
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, name, email, phone, company_name, company_type')
        .in('id', userIds);
      (profs || []).forEach((p) => {
        profilesMap[p.id] = p as Profile;
      });
    }

    setPermissions(
      (perms || []).map((p) => ({
        ...p,
        profile: profilesMap[p.user_id],
      })),
    );
    setLoadingPermissions(false);
  };

  const runSearch = async () => {
    const term = search.trim();
    if (term.length < 2) {
      toast({ title: 'Digite ao menos 2 caracteres' });
      return;
    }
    setSearching(true);
    const digits = term.replace(/\D/g, '');
    const like = `%${term}%`;

    const filters = [`name.ilike.${like}`, `email.ilike.${like}`, `company_name.ilike.${like}`];
    if (digits.length >= 3) filters.push(`phone.ilike.%${digits}%`);

    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email, phone, company_name, company_type')
      .or(filters.join(','))
      .limit(20);

    if (error) {
      toast({ title: 'Erro na busca', description: error.message, variant: 'destructive' });
    } else {
      setResults((data || []) as Profile[]);
    }
    setSearching(false);
  };

  const isGranted = (userId: string) => permissions.some((p) => p.user_id === userId);

  const grantAccess = async (userId: string) => {
    if (!user) return;
    setBusy(userId);
    const { error } = await supabase.from('launch_permissions').insert({
      user_id: userId,
      granted_by: user.id,
      notes: notesByUser[userId]?.trim() || null,
    });
    if (error) {
      toast({ title: 'Erro ao liberar', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Acesso liberado' });
      setNotesByUser((prev) => ({ ...prev, [userId]: '' }));
      fetchPermissions();
    }
    setBusy(null);
  };

  const revokeAccess = async (userId: string) => {
    setBusy(userId);
    const { error } = await supabase.from('launch_permissions').delete().eq('user_id', userId);
    if (error) {
      toast({ title: 'Erro ao revogar', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Acesso revogado' });
      fetchPermissions();
    }
    setBusy(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Liberar acesso a lançamentos</h2>
        <p className="text-sm text-muted-foreground">
          Busque um corretor e libere a permissão para publicar novos lançamentos.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Buscar corretor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Nome, telefone, e-mail ou empresa"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && runSearch()}
                className="pl-9"
              />
            </div>
            <Button onClick={runSearch} disabled={searching}>
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Buscar'}
            </Button>
          </div>

          {results.length > 0 && (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Observações</TableHead>
                    <TableHead className="w-32 text-right">Liberado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((p) => {
                    const granted = isGranted(p.id);
                    return (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div className="font-medium">{p.name}</div>
                          {p.company_name && (
                            <div className="text-xs text-muted-foreground">{p.company_name}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{p.phone}</div>
                          {p.email && (
                            <div className="text-xs text-muted-foreground">{p.email}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          {!granted ? (
                            <Textarea
                              rows={2}
                              placeholder="Observações (opcional)"
                              value={notesByUser[p.id] || ''}
                              onChange={(e) =>
                                setNotesByUser((prev) => ({ ...prev, [p.id]: e.target.value }))
                              }
                              className="text-sm"
                            />
                          ) : (
                            <span className="text-xs text-muted-foreground">Já liberado</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Switch
                            checked={granted}
                            disabled={busy === p.id}
                            onCheckedChange={(checked) =>
                              checked ? grantAccess(p.id) : revokeAccess(p.id)
                            }
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Corretores liberados ({permissions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingPermissions ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : permissions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nenhum corretor liberado até o momento.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Observações</TableHead>
                  <TableHead>Liberado em</TableHead>
                  <TableHead className="w-20 text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissions.map((perm) => (
                  <TableRow key={perm.id}>
                    <TableCell>
                      <div className="font-medium">{perm.profile?.name || '—'}</div>
                      {perm.profile?.company_name && (
                        <div className="text-xs text-muted-foreground">
                          {perm.profile.company_name}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{perm.profile?.phone || '—'}</div>
                      {perm.profile?.email && (
                        <div className="text-xs text-muted-foreground">{perm.profile.email}</div>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <span className="text-sm text-muted-foreground">{perm.notes || '—'}</span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(perm.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => revokeAccess(perm.user_id)}
                        disabled={busy === perm.user_id}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
