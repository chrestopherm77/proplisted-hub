import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Search, Download, Coins, Crown, RefreshCw, Eye, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { AdjustCreditsDialog } from './AdjustCreditsDialog';
import { UserDetailsDialog } from './UserDetailsDialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  credit_balance: number;
}

interface PlanInfo {
  name: string;
  slug: string;
  status: string;
}

const professionLabels: Record<string, string> = {
  CORRETOR: 'Corretor',
  ARQUITETO: 'Arquiteto',
  ENGENHEIRO: 'Engenheiro',
};

export function UsersManagement() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [emailMap, setEmailMap] = useState<Record<string, string>>({});
  const [planMap, setPlanMap] = useState<Record<string, PlanInfo>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [adjustingProfile, setAdjustingProfile] = useState<Profile | null>(null);
  const [detailsProfileId, setDetailsProfileId] = useState<string | null>(null);
  const [deletingProfile, setDeletingProfile] = useState<Profile | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  const handleDeleteUser = async () => {
    if (!deletingProfile) return;
    setDeleting(true);
    const { data, error } = await supabase.functions.invoke('admin-delete-user', {
      body: { user_id: deletingProfile.id },
    });
    setDeleting(false);
    if (error || (data as any)?.error) {
      toast({
        title: 'Erro ao excluir',
        description: (data as any)?.error || error?.message || 'Falha desconhecida',
        variant: 'destructive',
      });
      return;
    }
    setProfiles((prev) => prev.filter((p) => p.id !== deletingProfile.id));
    toast({ title: 'Usuário excluído', description: 'A conta foi removida. O e-mail e telefone ficam liberados para novo cadastro.' });
    setDeletingProfile(null);
  };

  useEffect(() => {
    fetchData();
    const onFocus = () => fetchData();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const fetchData = async () => {
    setLoading(true);

    const [profilesRes, emailsRes, subsRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, name, phone, person_type, cpf, cnpj, company_name, profession, creci, creci_uf, cau, cau_uf, crea, crea_uf, address_uf, address_city, address_neighborhood, is_active, created_at, credit_balance')
        .order('created_at', { ascending: false }),
      supabase.functions.invoke('list-users'),
      supabase
        .from('user_subscriptions')
        .select('user_id, status, created_at, plan:subscription_plans(name, slug, price)')
        .in('status', ['ACTIVE', 'PENDING', 'OVERDUE'])
        .order('created_at', { ascending: false }),
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

    if (subsRes.data) {
      const map: Record<string, PlanInfo> = {};
      // Prioriza ACTIVE > OVERDUE > PENDING. Como ordenado por created_at DESC,
      // só guardamos o ACTIVE/OVERDUE; PENDING só se nada melhor existir.
      for (const s of subsRes.data as any[]) {
        const planName = s.plan?.name ?? '—';
        const planSlug = s.plan?.slug ?? '';
        const existing = map[s.user_id];
        if (!existing || (existing.status === 'PENDING' && s.status !== 'PENDING')) {
          map[s.user_id] = { name: planName, slug: planSlug, status: s.status };
        }
      }
      setPlanMap(map);
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

  // Lista única de planos presentes (para o select)
  const planOptions = useMemo(() => {
    const set = new Map<string, string>();
    for (const info of Object.values(planMap)) {
      if (info.slug) set.set(info.slug, info.name);
    }
    // Garante que "Sem plano" esteja como opção se houver perfis sem assinatura
    const hasNone = profiles.some((p) => !planMap[p.id]);
    const arr = Array.from(set.entries()).map(([slug, name]) => ({ slug, name }));
    arr.sort((a, b) => a.name.localeCompare(b.name));
    if (hasNone) arr.push({ slug: '__none__', name: 'Sem plano' });
    return arr;
  }, [planMap, profiles]);

  const filtered = profiles.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      p.name?.toLowerCase().includes(q) ||
      p.phone?.includes(q) ||
      p.company_name?.toLowerCase().includes(q) ||
      emailMap[p.id]?.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (planFilter === 'all') return true;
    const plan = planMap[p.id];
    if (planFilter === '__none__') return !plan;
    return plan?.slug === planFilter;
  });

  const exportCsv = () => {
    const headers = ['Nome', 'E-mail', 'Telefone', 'Tipo', 'CPF/CNPJ', 'Profissão', 'Registro', 'UF', 'Cidade', 'Bairro', 'Plano', 'Status Plano', 'Status', 'Data Cadastro'];
    const rows = filtered.map((p) => {
      const plan = planMap[p.id];
      return [
        p.company_name || p.name,
        emailMap[p.id] || '',
        p.phone,
        p.person_type === 'PJ' ? 'PJ' : 'PF',
        p.person_type === 'PJ' ? (p.cnpj || '') : (p.cpf || ''),
        professionLabels[p.profession || ''] || p.profession || '',
        getRegistration(p),
        p.address_uf || '',
        p.address_city || '',
        p.address_neighborhood || '',
        plan?.name || 'Sem plano',
        plan?.status || '',
        p.is_active ? 'Ativo' : 'Inativo',
        p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR') : '',
      ];
    });
    const csvContent = '\uFEFF' + [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `corretores_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: `${filtered.length} corretores exportados` });
  };

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Carregando usuários...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, e-mail ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filtrar por plano" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os planos</SelectItem>
            {planOptions.map((opt) => (
              <SelectItem key={opt.slug} value={opt.slug}>{opt.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" onClick={() => fetchData()} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
        <Button size="sm" variant="outline" onClick={exportCsv} disabled={filtered.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      <div className="admin-users-scroll overflow-x-scroll overflow-y-auto border rounded-md" style={{ scrollbarGutter: 'stable' }}>
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
              <TableHead className="min-w-[140px]">Plano</TableHead>
              <TableHead className="min-w-[160px]">Créditos</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="min-w-[140px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p) => {
              const plan = planMap[p.id];
              return (
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
                    {plan ? (
                      <div className="flex flex-col gap-0.5">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold">
                          <Crown className="h-3 w-3 text-primary" />
                          {plan.name}
                        </span>
                        {plan.status !== 'ACTIVE' && (
                          <Badge variant="outline" className="text-[10px] w-fit">
                            {plan.status === 'PENDING' ? 'Aguardando pgto' : plan.status}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Sem plano</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 font-semibold text-yellow-600 dark:text-yellow-500">
                        <Coins className="h-3.5 w-3.5" />
                        {p.credit_balance ?? 0}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs"
                        onClick={() => setAdjustingProfile(p)}
                      >
                        Ajustar
                      </Button>
                    </div>
                  </TableCell>
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
              );
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={13} className="text-center text-muted-foreground py-8">
                  Nenhum usuário encontrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {adjustingProfile && (
        <AdjustCreditsDialog
          open={!!adjustingProfile}
          onOpenChange={(open) => !open && setAdjustingProfile(null)}
          userId={adjustingProfile.id}
          userName={adjustingProfile.company_name || adjustingProfile.name}
          currentBalance={adjustingProfile.credit_balance ?? 0}
          onSuccess={(newBalance) => {
            setProfiles((prev) =>
              prev.map((p) => (p.id === adjustingProfile.id ? { ...p, credit_balance: newBalance } : p)),
            );
          }}
        />
      )}
    </div>
  );
}
