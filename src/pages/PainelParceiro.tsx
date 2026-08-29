import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import BrandLogo from '@/components/BrandLogo';
import { Loader2, LogOut, Plus, Ticket, CheckCircle2, XCircle } from 'lucide-react';

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Em análise',
  APPROVED: 'Aprovado',
  REJECTED: 'Recusado',
};

interface Partner {
  id: string;
  company_name: string;
  contact_name: string;
  logo_url: string | null;
  status: string;
  admin_notes: string | null;
}

interface Benefit {
  id: string;
  title: string;
  description: string | null;
  rules: string | null;
  discount_percent: number | null;
  discount_label: string | null;
  banner_url: string | null;
  state: string | null;
  city: string | null;
  address: string | null;
  link_url: string | null;
  status: string;
  is_active: boolean;
}

const emptyBenefit = {
  title: '',
  description: '',
  discount_percent: '15',
  state: '',
  city: '',
  address: '',
  link_url: '',
  banner_url: '',
  is_online: false,
  usage_limit: 'MONTHLY_1',
};


const USAGE_LIMIT_LABEL: Record<string, string> = {
  MONTHLY_1: '1 uso por mês',
  MONTHLY_2: '2 usos por mês',
  UNLIMITED: 'Uso ilimitado (toda compra)',
};

export default function PainelParceiro() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { toast } = useToast();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyBenefit);

  const [code, setCode] = useState('');
  const [lookup, setLookup] = useState<any>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/parceiro-beneficios'); return; }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data: p } = await supabase
      .from('benefit_partners' as any)
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    if (!p) { setLoading(false); navigate('/parceiro-beneficios'); return; }
    const partnerRow = p as any as Partner;
    setPartner(partnerRow);

    const { data: b } = await supabase
      .from('benefits' as any)
      .select('*')
      .eq('partner_id', partnerRow.id)
      .order('created_at', { ascending: false });
    setBenefits((b as any as Benefit[]) || []);

    const { data: r } = await supabase
      .from('benefit_redemptions' as any)
      .select('*, benefits(title)')
      .eq('partner_id', partnerRow.id)
      .order('redeemed_at', { ascending: false })
      .limit(100);
    setRedemptions((r as any[]) || []);
    setLoading(false);
  };

  const uploadBanner = async (file: File) => {
    if (!user) { toast({ title: 'Sessão expirada', description: 'Entre novamente para enviar imagens.', variant: 'destructive' }); return; }
    const ext = file.name.split('.').pop() || 'png';
    // A policy do bucket exige que o primeiro nível da pasta seja o ID do usuário.
    const path = `${user.id}/benefits/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from('brand-logos').upload(path, file, { upsert: true });
    if (error) { toast({ title: 'Erro no upload', description: error.message, variant: 'destructive' }); return; }
    const { data } = supabase.storage.from('brand-logos').getPublicUrl(path);
    setForm((f) => ({ ...f, banner_url: data.publicUrl }));
  };

  const saveBenefit = async () => {
    if (!partner || !form.title.trim()) {
      toast({ title: 'Informe o título do benefício', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('benefits' as any).insert({
      partner_id: partner.id,
      title: form.title.trim(),
      description: form.description || null,
      rules: null,
      discount_percent: form.discount_percent ? Number(form.discount_percent) : null,
      discount_label: form.discount_percent ? `${Number(form.discount_percent)}% OFF` : null,

      banner_url: form.banner_url || null,
      state: form.is_online ? null : (form.state || null),
      city: form.is_online ? null : (form.city || null),
      address: form.is_online ? null : (form.address || null),
      link_url: form.link_url || null,
      is_online: form.is_online,
      usage_limit: form.usage_limit,
    });
    setSaving(false);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Benefício enviado para aprovação' });
    setForm(emptyBenefit);
    setDialogOpen(false);
    load();
  };

  const handleLookup = async () => {
    if (!code.trim()) return;
    setChecking(true);
    setLookup(null);
    const { data, error } = await supabase.rpc('lookup_benefit_voucher' as any, { p_code: code.trim().toUpperCase() });
    setChecking(false);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    setLookup(data);
  };

  const handleRedeem = async () => {
    setChecking(true);
    const { data, error } = await supabase.rpc('redeem_benefit_voucher' as any, { p_code: code.trim().toUpperCase() });
    setChecking(false);
    const result = data as any;
    if (error || result?.error) {
      toast({ title: 'Não foi possível validar', description: result?.error || error?.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Voucher validado com sucesso!' });
    setLookup(null);
    setCode('');
    load();
  };

  if (loading || authLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  if (!partner) return null;

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-background border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <BrandLogo size="sm" />
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium hidden sm:inline">{partner.company_name}</span>
            <Button variant="outline" size="sm" onClick={async () => { await signOut(); navigate('/parceiro-beneficios'); }}>
              <LogOut className="h-4 w-4 mr-2" /> Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {partner.status !== 'APPROVED' && (
          <Card className="border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20">
            <CardContent className="py-4">
              <p className="font-medium">Status do cadastro: {STATUS_LABEL[partner.status] || partner.status}</p>
              <p className="text-sm text-muted-foreground">
                {partner.status === 'PENDING'
                  ? 'Sua empresa está em análise. Você poderá publicar benefícios após a aprovação.'
                  : partner.admin_notes || 'Entre em contato com nossa equipe.'}
              </p>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="benefits">
          <TabsList>
            <TabsTrigger value="benefits">Meus benefícios</TabsTrigger>
            <TabsTrigger value="validate">Validar voucher</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="benefits" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button disabled={partner.status !== 'APPROVED'}>
                    <Plus className="h-4 w-4 mr-2" /> Novo benefício
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                  <DialogHeader><DialogTitle>Novo benefício</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label>Título</Label>
                      <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                    <div><Label>Descrição</Label>
                      <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Desconto (%)</Label>
                        <Input type="number" value={form.discount_percent} onChange={(e) => setForm({ ...form, discount_percent: e.target.value })} /></div>
                      <div><Label>Rótulo (opcional)</Label>
                        <Input value={form.discount_label} onChange={(e) => setForm({ ...form, discount_label: e.target.value })} placeholder="Ex: 15% OFF" /></div>
                    </div>
                    <div><Label>Regras de uso</Label>
                      <Textarea value={form.rules} onChange={(e) => setForm({ ...form, rules: e.target.value })} /></div>
                    <div>
                      <Label>Limite de uso por corretor</Label>
                      <Select value={form.usage_limit} onValueChange={(v) => setForm({ ...form, usage_limit: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MONTHLY_1">1 uso por mês</SelectItem>
                          <SelectItem value="MONTHLY_2">2 usos por mês</SelectItem>
                          <SelectItem value="UNLIMITED">Uso ilimitado (toda compra)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between rounded-md border p-3">
                      <div>
                        <Label>Atendimento online</Label>
                        <p className="text-xs text-muted-foreground">Benefício válido pelo site, sem loja física</p>
                      </div>
                      <Switch checked={form.is_online} onCheckedChange={(v) => setForm({ ...form, is_online: v })} />
                    </div>
                    {!form.is_online && (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div><Label>UF (opcional)</Label>
                            <Input maxLength={2} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })} /></div>
                          <div><Label>Cidade (opcional)</Label>
                            <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
                        </div>
                        <div><Label>Endereço (opcional)</Label>
                          <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
                      </>
                    )}
                    <div><Label>Link (site / Instagram)</Label>
                      <Input value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} /></div>
                    <div><Label>Imagem</Label>
                      <Input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && uploadBanner(e.target.files[0])} />
                      {form.banner_url && <img src={form.banner_url} alt="" className="mt-2 h-24 object-contain" />}
                    </div>
                    <Button className="w-full" onClick={saveBenefit} disabled={saving}>
                      {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Enviar para aprovação
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {benefits.length === 0 ? (
              <Card><CardContent className="py-10 text-center text-muted-foreground">Nenhum benefício cadastrado.</CardContent></Card>
            ) : benefits.map((b) => (
              <Card key={b.id}>
                <CardContent className="py-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">{b.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {b.discount_label || (b.discount_percent ? `${Number(b.discount_percent)}% OFF` : '')}
                      {b.city ? ` · ${b.city}${b.state ? ' - ' + b.state : ''}` : ''}
                    </p>
                  </div>
                  <Badge variant={b.status === 'APPROVED' ? 'default' : b.status === 'REJECTED' ? 'destructive' : 'secondary'}>
                    {STATUS_LABEL[b.status] || b.status}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="validate">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Ticket className="h-5 w-5" /> Validar voucher</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Código do voucher" />
                  <Button onClick={handleLookup} disabled={checking}>Consultar</Button>
                </div>

                {lookup && (
                  lookup.error ? (
                    <div className="flex items-center gap-2 text-destructive">
                      <XCircle className="h-5 w-5" /> {lookup.error}
                    </div>
                  ) : (
                    <div className="rounded-lg border p-4 space-y-2">
                      <p className="flex items-center gap-2 text-green-600 font-medium">
                        <CheckCircle2 className="h-5 w-5" /> Voucher válido
                      </p>
                      <p className="text-sm"><strong>Corretor:</strong> {lookup.broker_name}</p>
                      <p className="text-sm"><strong>Benefício:</strong> {lookup.benefit_title}</p>
                      {lookup.used_this_month ? (
                        <p className="text-sm text-destructive">Este corretor já utilizou este benefício neste mês.</p>
                      ) : (
                        <Button onClick={handleRedeem} disabled={checking} className="w-full">
                          {checking && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Confirmar uso
                        </Button>
                      )}
                    </div>
                  )
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardContent className="py-4 space-y-2">
                {redemptions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-6">Nenhuma validação registrada.</p>
                ) : redemptions.map((r) => (
                  <div key={r.id} className="flex items-center justify-between border-b last:border-0 py-2 text-sm">
                    <span>{r.benefits?.title}</span>
                    <span className="text-muted-foreground">
                      {new Date(r.redeemed_at).toLocaleString('pt-BR')}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
