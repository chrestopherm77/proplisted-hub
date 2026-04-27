import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { AdjustCreditsDialog } from './AdjustCreditsDialog';
import {
  Coins, Crown, Mail, Phone, MapPin, User as UserIcon, Building2,
  Trash2, Copy, Loader2, Calendar, ShoppingBag, Home, Gift,
} from 'lucide-react';

interface ProfileFull {
  id: string;
  name: string;
  phone: string;
  person_type: string | null;
  cpf: string | null;
  cnpj: string | null;
  company_name: string | null;
  company_type: string | null;
  profession: string | null;
  creci: string | null;
  creci_uf: string | null;
  cau: string | null;
  cau_uf: string | null;
  crea: string | null;
  crea_uf: string | null;
  creci_pj: string | null;
  creci_pj_uf: string | null;
  crea_pj: string | null;
  crea_pj_uf: string | null;
  rt_name: string | null;
  rt_cpf: string | null;
  rt_crea: string | null;
  rt_crea_uf: string | null;
  rt_cau: string | null;
  rt_cau_uf: string | null;
  address: string | null;
  address_uf: string | null;
  address_city: string | null;
  address_neighborhood: string | null;
  is_active: boolean;
  created_at: string | null;
  credit_balance: number;
  referral_code: string | null;
  referred_by: string | null;
}

interface PlanInfo {
  name: string;
  slug: string;
  status: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string | null;
  email?: string;
  plan?: PlanInfo;
  onUpdated: (patch: Partial<ProfileFull>) => void;
  onDeleted: (id: string) => void;
}

export function UserDetailsDialog({ open, onOpenChange, profileId, email, plan, onUpdated, onDeleted }: Props) {
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProfileFull | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [showAdjust, setShowAdjust] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [stats, setStats] = useState<{ purchases: number; properties: number; lastLogin: string | null }>({
    purchases: 0, properties: 0, lastLogin: null,
  });

  useEffect(() => {
    if (!open || !profileId) return;
    const load = async () => {
      setLoading(true);
      const [profRes, purchRes, propRes, loginRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', profileId).maybeSingle(),
        supabase.from('purchases').select('id', { count: 'exact', head: true }).eq('user_id', profileId).eq('status', 'PAID'),
        supabase.from('properties').select('id', { count: 'exact', head: true }).eq('user_id', profileId),
        supabase.from('login_history').select('logged_in_at').eq('user_id', profileId).order('logged_in_at', { ascending: false }).limit(1).maybeSingle(),
      ]);
      if (profRes.data) setProfile(profRes.data as any);
      setStats({
        purchases: purchRes.count ?? 0,
        properties: propRes.count ?? 0,
        lastLogin: loginRes.data?.logged_in_at ?? null,
      });
      setLoading(false);
    };
    load();
  }, [open, profileId]);

  const copy = (label: string, value: string | null) => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    toast({ title: `${label} copiado` });
  };

  const handleToggleActive = async () => {
    if (!profile) return;
    setToggling(true);
    const newStatus = !profile.is_active;
    const { error } = await supabase.from('profiles').update({ is_active: newStatus } as any).eq('id', profile.id);
    if (error) {
      toast({ title: 'Erro ao alterar status', description: error.message, variant: 'destructive' });
    } else {
      setProfile({ ...profile, is_active: newStatus });
      onUpdated({ is_active: newStatus });
      toast({ title: newStatus ? 'Usuário ativado' : 'Usuário inativado' });
    }
    setToggling(false);
  };

  const handleDelete = async () => {
    if (!profile) return;
    setDeleting(true);
    const { data, error } = await supabase.functions.invoke('admin-delete-user', {
      body: { user_id: profile.id },
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
    toast({ title: 'Usuário excluído', description: 'A conta foi removida. O e-mail e telefone podem ser reutilizados.' });
    setShowDeleteConfirm(false);
    onDeleted(profile.id);
    onOpenChange(false);
  };

  const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="min-w-0">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm font-medium break-words">{value || <span className="text-muted-foreground">—</span>}</p>
    </div>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {profile?.person_type === 'PJ' ? <Building2 className="h-5 w-5" /> : <UserIcon className="h-5 w-5" />}
              {profile?.company_name || profile?.name || 'Usuário'}
            </DialogTitle>
            <DialogDescription>Informações completas e ações de administrador</DialogDescription>
          </DialogHeader>

          {loading || !profile ? (
            <div className="py-12 text-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              Carregando...
            </div>
          ) : (
            <div className="space-y-5">
              {/* Status + plano + créditos */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-lg border p-3 flex items-center gap-3">
                  <Crown className="h-5 w-5 text-primary" />
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Plano</p>
                    <p className="text-sm font-semibold truncate">{plan?.name || 'Sem plano'}</p>
                    {plan && plan.status !== 'ACTIVE' && (
                      <Badge variant="outline" className="mt-1 text-[10px]">{plan.status}</Badge>
                    )}
                  </div>
                </div>
                <div className="rounded-lg border p-3 flex items-center gap-3">
                  <Coins className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Créditos</p>
                    <p className="text-sm font-semibold">{profile.credit_balance ?? 0}</p>
                  </div>
                </div>
                <div className="rounded-lg border p-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Conta</p>
                    <Badge variant={profile.is_active ? 'default' : 'destructive'} className="text-xs mt-1">
                      {profile.is_active ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </div>
                  <Switch checked={profile.is_active} onCheckedChange={handleToggleActive} disabled={toggling} />
                </div>
              </div>

              {/* Estatísticas */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-muted/50 p-3 text-center">
                  <ShoppingBag className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-lg font-bold">{stats.purchases}</p>
                  <p className="text-[11px] text-muted-foreground">Leads comprados</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3 text-center">
                  <Home className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-lg font-bold">{stats.properties}</p>
                  <p className="text-[11px] text-muted-foreground">Imóveis</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3 text-center">
                  <Calendar className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-xs font-semibold">
                    {stats.lastLogin ? new Date(stats.lastLogin).toLocaleDateString('pt-BR') : '—'}
                  </p>
                  <p className="text-[11px] text-muted-foreground">Último login</p>
                </div>
              </div>

              {/* Contato */}
              <section>
                <h3 className="text-sm font-semibold mb-2">Contato</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-2 min-w-0">
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" /> E-mail
                      </p>
                      <p className="text-sm font-medium truncate">{email || '—'}</p>
                    </div>
                    {email && (
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copy('E-mail', email)}>
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  <div className="flex items-start justify-between gap-2 min-w-0">
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" /> Telefone
                      </p>
                      <p className="text-sm font-medium">{profile.phone || '—'}</p>
                    </div>
                    {profile.phone && (
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copy('Telefone', profile.phone)}>
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </section>

              {/* Dados pessoais / empresa */}
              <section>
                <h3 className="text-sm font-semibold mb-2">
                  {profile.person_type === 'PJ' ? 'Dados da Empresa' : 'Dados Pessoais'}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 rounded-lg border p-3">
                  <Field label="Tipo" value={profile.person_type === 'PJ' ? 'Pessoa Jurídica' : 'Pessoa Física'} />
                  {profile.person_type === 'PJ' ? (
                    <>
                      <Field label="Razão social" value={profile.company_name} />
                      <Field label="CNPJ" value={profile.cnpj} />
                      <Field label="Tipo de empresa" value={profile.company_type} />
                      <Field label="CRECI PJ" value={profile.creci_pj ? `${profile.creci_pj}/${profile.creci_pj_uf || ''}` : null} />
                      <Field label="CREA PJ" value={profile.crea_pj ? `${profile.crea_pj}/${profile.crea_pj_uf || ''}` : null} />
                    </>
                  ) : (
                    <>
                      <Field label="Nome" value={profile.name} />
                      <Field label="CPF" value={profile.cpf} />
                      <Field label="Profissão" value={profile.profession} />
                      <Field label="CRECI" value={profile.creci ? `${profile.creci}/${profile.creci_uf || ''}` : null} />
                      <Field label="CAU" value={profile.cau ? `${profile.cau}/${profile.cau_uf || ''}` : null} />
                      <Field label="CREA" value={profile.crea ? `${profile.crea}/${profile.crea_uf || ''}` : null} />
                    </>
                  )}
                </div>
              </section>

              {/* Responsável Técnico (PJ) */}
              {profile.person_type === 'PJ' && (profile.rt_name || profile.rt_cpf) && (
                <section>
                  <h3 className="text-sm font-semibold mb-2">Responsável Técnico</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 rounded-lg border p-3">
                    <Field label="Nome" value={profile.rt_name} />
                    <Field label="CPF" value={profile.rt_cpf} />
                    <Field label="CREA" value={profile.rt_crea ? `${profile.rt_crea}/${profile.rt_crea_uf || ''}` : null} />
                    <Field label="CAU" value={profile.rt_cau ? `${profile.rt_cau}/${profile.rt_cau_uf || ''}` : null} />
                  </div>
                </section>
              )}

              {/* Endereço */}
              <section>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-1">
                  <MapPin className="h-4 w-4" /> Endereço
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-lg border p-3">
                  <Field label="UF" value={profile.address_uf} />
                  <Field label="Cidade" value={profile.address_city} />
                  <Field label="Bairro" value={profile.address_neighborhood} />
                  <div className="col-span-2 sm:col-span-4">
                    <Field label="Endereço" value={profile.address} />
                  </div>
                </div>
              </section>

              {/* Indicação */}
              <section>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-1">
                  <Gift className="h-4 w-4" /> Indicação
                </h3>
                <div className="grid grid-cols-2 gap-3 rounded-lg border p-3">
                  <Field label="Código de indicação" value={profile.referral_code} />
                  <Field label="Indicado por (ID)" value={profile.referred_by ? profile.referred_by.slice(0, 8) + '…' : null} />
                </div>
              </section>

              <Field label="Cadastrado em" value={profile.created_at ? new Date(profile.created_at).toLocaleString('pt-BR') : null} />

              {/* Ações */}
              <div className="flex flex-wrap gap-2 pt-3 border-t">
                <Button variant="outline" onClick={() => setShowAdjust(true)}>
                  <Coins className="mr-2 h-4 w-4" />
                  Ajustar créditos
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={deleting}
                  className="ml-auto"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir usuário
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {profile && (
        <AdjustCreditsDialog
          open={showAdjust}
          onOpenChange={setShowAdjust}
          userId={profile.id}
          userName={profile.company_name || profile.name}
          currentBalance={profile.credit_balance ?? 0}
          onSuccess={(newBalance) => {
            setProfile({ ...profile, credit_balance: newBalance });
            onUpdated({ credit_balance: newBalance });
          }}
        />
      )}

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuário definitivamente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é <strong>irreversível</strong>. A conta será removida do sistema, junto com seus
              imóveis, leads do CRM, alertas e histórico. O e-mail e o telefone ficarão liberados — a pessoa
              poderá se cadastrar novamente como um novo usuário.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDelete(); }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Excluindo...</> : 'Sim, excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
