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
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Search, Loader2, Trash2 } from 'lucide-react';

interface Profile {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  company_name: string | null;
}

interface Permission {
  id: string;
  user_id: string;
  notes: string | null;
  created_at: string;
  profile?: Profile;
}

export function LandSearchAccessManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<Profile[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [notesByUser, setNotesByUser] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const fetchPermissions = async () => {
    setLoading(true);
    const { data: perms, error } = await supabase
      .from('land_search_publish_permissions' as any)
      .select('id, user_id, notes, created_at')
      .order('created_at', { ascending: false });
    if (error) {
      toast({ title: 'Erro ao carregar', description: error.message, variant: 'destructive' });
      setLoading(false);
      return;
    }
    const list = (perms as any) || [];
    const userIds = list.map((p: any) => p.user_id);
    let profilesMap: Record<string, Profile> = {};
    if (userIds.length > 0) {
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, name, email, phone, company_name')
        .in('id', userIds);
      (profs || []).forEach((p: any) => { profilesMap[p.id] = p as Profile; });
    }
    setPermissions(list.map((p: any) => ({ ...p, profile: profilesMap[p.user_id] })));
    setLoading(false);
  };

  useEffect(() => { fetchPermissions(); }, []);

  const runSearch = async () => {
    const term = search.trim();
    if (term.length < 2) { toast({ title: 'Digite ao menos 2 caracteres' }); return; }
    setSearching(true);
    const digits = term.replace(/\D/g, '');
    const like = `%${term}%`;
    const filters = [`name.ilike.${like}`, `email.ilike.${like}`, `company_name.ilike.${like}`];
    if (digits.length >= 3) filters.push(`phone.ilike.%${digits}%`);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email, phone, company_name')
      .or(filters.join(','))
      .limit(20);
    if (error) toast({ title: 'Erro na busca', description: error.message, variant: 'destructive' });
    else setResults((data || []) as Profile[]);
    setSearching(false);
  };

  const isGranted = (userId: string) => permissions.some((p) => p.user_id === userId);

  const grant = async (userId: string) => {
    if (!user) return;
    setBusy(userId);
    const { error } = await supabase.from('land_search_publish_permissions' as any).insert({
      user_id: userId, granted_by: user.id, notes: notesByUser[userId]?.trim() || null,
    });
    if (error) toast({ title: 'Erro ao liberar', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Liberado' }); setNotesByUser((p) => ({ ...p, [userId]: '' })); fetchPermissions(); }
    setBusy(null);
  };

  const revoke = async (userId: string) => {
    setBusy(userId);
    const { error } = await supabase.from('land_search_publish_permissions' as any).delete().eq('user_id', userId);
    if (error) toast({ title: 'Erro ao revogar', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Revogado' }); fetchPermissions(); }
    setBusy(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Liberar publicação de Procura-se de Terrenos</h2>
        <p className="text-sm text-muted-foreground">Busque um usuário e libere para que ele possa publicar seus próprios anúncios.</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Buscar usuário</CardTitle></CardHeader>
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
            <Table>
              <TableHeader><TableRow>
                <TableHead>Nome</TableHead><TableHead>Contato</TableHead>
                <TableHead>Observações</TableHead><TableHead className="w-32 text-right">Liberado</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {results.map((p) => {
                  const granted = isGranted(p.id);
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="font-medium">{p.name}</div>
                        {p.company_name && <div className="text-xs text-muted-foreground">{p.company_name}</div>}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{p.phone}</div>
                        {p.email && <div className="text-xs text-muted-foreground">{p.email}</div>}
                      </TableCell>
                      <TableCell>
                        {!granted ? (
                          <Textarea
                            rows={2}
                            placeholder="Observações (opcional)"
                            value={notesByUser[p.id] || ''}
                            onChange={(e) => setNotesByUser((prev) => ({ ...prev, [p.id]: e.target.value }))}
                            className="text-sm"
                          />
                        ) : <span className="text-xs text-muted-foreground">Já liberado</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <Switch
                          checked={granted}
                          disabled={busy === p.id}
                          onCheckedChange={(checked) => (checked ? grant(p.id) : revoke(p.id))}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Usuários liberados ({permissions.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : permissions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhum usuário liberado até o momento.</p>
          ) : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Nome</TableHead><TableHead>Contato</TableHead>
                <TableHead>Observações</TableHead><TableHead>Liberado em</TableHead>
                <TableHead className="w-20 text-right">Ação</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {permissions.map((perm) => (
                  <TableRow key={perm.id}>
                    <TableCell>
                      <div className="font-medium">{perm.profile?.name || '—'}</div>
                      {perm.profile?.company_name && <div className="text-xs text-muted-foreground">{perm.profile.company_name}</div>}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{perm.profile?.phone || '—'}</div>
                      {perm.profile?.email && <div className="text-xs text-muted-foreground">{perm.profile.email}</div>}
                    </TableCell>
                    <TableCell className="max-w-xs"><span className="text-sm text-muted-foreground">{perm.notes || '—'}</span></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(perm.created_at).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => revoke(perm.user_id)} disabled={busy === perm.user_id}>
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
