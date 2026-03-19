import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Ticket, ChevronDown, ChevronUp, Loader2, Percent, Clock } from 'lucide-react';

interface Voucher {
  id: string;
  code: string;
  is_active: boolean;
  max_uses: number;
  max_uses_per_user: number;
  expires_at: string | null;
  created_at: string;
  redemption_count?: number;
}

interface Coupon {
  id: string;
  code: string;
  discount_percent: number;
  is_active: boolean;
  max_uses: number;
  max_uses_per_user: number;
  expires_at: string | null;
  created_at: string;
  usage_count?: number;
}

interface Redemption {
  id: string;
  user_id: string;
  lead_id: string;
  redeemed_at: string;
  user_name?: string;
  lead_name?: string;
}

interface CouponUsage {
  id: string;
  user_id: string;
  used_at: string;
  user_name?: string;
}

const EXPIRATION_OPTIONS = [
  { value: 'none', label: 'Sem expiração' },
  { value: '1h', label: '1 hora' },
  { value: '6h', label: '6 horas' },
  { value: '12h', label: '12 horas' },
  { value: '1d', label: '1 dia' },
  { value: '3d', label: '3 dias' },
  { value: '7d', label: '7 dias' },
  { value: '15d', label: '15 dias' },
  { value: '30d', label: '30 dias' },
  { value: '60d', label: '60 dias' },
  { value: '90d', label: '90 dias' },
];

function getExpiresAt(option: string): string | null {
  if (option === 'none') return null;
  const now = new Date();
  const match = option.match(/^(\d+)(h|d)$/);
  if (!match) return null;
  const amount = parseInt(match[1]);
  const unit = match[2];
  if (unit === 'h') now.setHours(now.getHours() + amount);
  else now.setDate(now.getDate() + amount);
  return now.toISOString();
}

function formatExpiration(expiresAt: string | null): string {
  if (!expiresAt) return 'Sem expiração';
  const date = new Date(expiresAt);
  if (date < new Date()) return 'Expirado';
  return `Expira em ${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}

function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

export function VouchersManagement() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCode, setNewCode] = useState('');
  const [newMaxUses, setNewMaxUses] = useState(1);
  const [newMaxUsesPerUser, setNewMaxUsesPerUser] = useState(1);
  const [newExpiration, setNewExpiration] = useState('none');
  const [newType, setNewType] = useState<'voucher' | 'coupon'>('voucher');
  const [newDiscountPercent, setNewDiscountPercent] = useState(10);
  const [creating, setCreating] = useState(false);
  const [expandedVoucher, setExpandedVoucher] = useState<string | null>(null);
  const [expandedCoupon, setExpandedCoupon] = useState<string | null>(null);
  const [redemptions, setRedemptions] = useState<Record<string, Redemption[]>>({});
  const [couponUsages, setCouponUsages] = useState<Record<string, CouponUsage[]>>({});
  const [loadingRedemptions, setLoadingRedemptions] = useState<string | null>(null);
  const [loadingCouponUsages, setLoadingCouponUsages] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchVouchers(), fetchCoupons()]);
    setLoading(false);
  };

  const fetchVouchers = async () => {
    try {
      const { data: vouchersData, error } = await supabase
        .from('vouchers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const vouchersWithCounts = await Promise.all(
        (vouchersData || []).map(async (v) => {
          const { count } = await supabase
            .from('voucher_redemptions')
            .select('id', { count: 'exact', head: true })
            .eq('voucher_id', v.id);
          return { ...v, redemption_count: count || 0 };
        })
      );

      setVouchers(vouchersWithCounts);
    } catch (error) {
      console.error('Error fetching vouchers:', error);
    }
  };

  const fetchCoupons = async () => {
    try {
      const { data: couponsData, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const couponsWithCounts = await Promise.all(
        (couponsData || []).map(async (c) => {
          const { count } = await supabase
            .from('coupon_usages')
            .select('id', { count: 'exact', head: true })
            .eq('coupon_id', c.id);
          return { ...c, usage_count: count || 0 };
        })
      );

      setCoupons(couponsWithCounts);
    } catch (error) {
      console.error('Error fetching coupons:', error);
    }
  };

  const createItem = async () => {
    if (!newCode.trim()) {
      toast({ title: 'Informe o código', variant: 'destructive' });
      return;
    }

    setCreating(true);
    try {
      const expiresAt = getExpiresAt(newExpiration);

      if (newType === 'voucher') {
        const { error } = await supabase.from('vouchers').insert({
          code: newCode.trim().toUpperCase(),
          max_uses: newMaxUses,
          max_uses_per_user: newMaxUsesPerUser,
          expires_at: expiresAt,
        });
        if (error) {
          if (error.code === '23505') {
            toast({ title: 'Já existe um voucher com este código', variant: 'destructive' });
          } else throw error;
          return;
        }
      } else {
        if (newDiscountPercent < 1 || newDiscountPercent > 100) {
          toast({ title: 'Desconto deve ser entre 1% e 100%', variant: 'destructive' });
          return;
        }
        const { error } = await supabase.from('coupons').insert({
          code: newCode.trim().toUpperCase(),
          discount_percent: newDiscountPercent,
          max_uses: newMaxUses,
          max_uses_per_user: newMaxUsesPerUser,
          expires_at: expiresAt,
        });
        if (error) {
          if (error.code === '23505') {
            toast({ title: 'Já existe um cupom com este código', variant: 'destructive' });
          } else throw error;
          return;
        }
      }

      toast({ title: `${newType === 'voucher' ? 'Voucher' : 'Cupom'} criado com sucesso!` });
      setNewCode('');
      setNewMaxUses(1);
      setNewMaxUsesPerUser(1);
      setNewDiscountPercent(10);
      setNewExpiration('none');
      fetchAll();
    } catch (error) {
      console.error('Error creating:', error);
      toast({ title: 'Erro ao criar', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const toggleVoucher = async (id: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from('vouchers')
        .update({ is_active: !currentActive })
        .eq('id', id);
      if (error) throw error;
      setVouchers((prev) => prev.map((v) => (v.id === id ? { ...v, is_active: !currentActive } : v)));
    } catch (error) {
      console.error('Error toggling voucher:', error);
      toast({ title: 'Erro ao atualizar', variant: 'destructive' });
    }
  };

  const toggleCoupon = async (id: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from('coupons')
        .update({ is_active: !currentActive })
        .eq('id', id);
      if (error) throw error;
      setCoupons((prev) => prev.map((c) => (c.id === id ? { ...c, is_active: !currentActive } : c)));
    } catch (error) {
      console.error('Error toggling coupon:', error);
      toast({ title: 'Erro ao atualizar', variant: 'destructive' });
    }
  };

  const fetchRedemptions = async (voucherId: string) => {
    if (expandedVoucher === voucherId) {
      setExpandedVoucher(null);
      return;
    }
    setLoadingRedemptions(voucherId);
    setExpandedVoucher(voucherId);
    try {
      const { data, error } = await supabase
        .from('voucher_redemptions')
        .select('*')
        .eq('voucher_id', voucherId)
        .order('redeemed_at', { ascending: false });
      if (error) throw error;
      const enriched = await Promise.all(
        (data || []).map(async (r) => {
          const [{ data: profile }, { data: lead }] = await Promise.all([
            supabase.from('profiles').select('name').eq('id', r.user_id).single(),
            supabase.from('leads').select('name').eq('id', r.lead_id).single(),
          ]);
          return { ...r, user_name: profile?.name || 'Desconhecido', lead_name: lead?.name || 'Lead removido' };
        })
      );
      setRedemptions((prev) => ({ ...prev, [voucherId]: enriched }));
    } catch (error) {
      console.error('Error fetching redemptions:', error);
    } finally {
      setLoadingRedemptions(null);
    }
  };

  const fetchCouponUsages = async (couponId: string) => {
    if (expandedCoupon === couponId) {
      setExpandedCoupon(null);
      return;
    }
    setLoadingCouponUsages(couponId);
    setExpandedCoupon(couponId);
    try {
      const { data, error } = await supabase
        .from('coupon_usages')
        .select('*')
        .eq('coupon_id', couponId)
        .order('used_at', { ascending: false });
      if (error) throw error;
      const enriched = await Promise.all(
        (data || []).map(async (u) => {
          const { data: profile } = await supabase.from('profiles').select('name').eq('id', u.user_id).single();
          return { ...u, user_name: profile?.name || 'Desconhecido' };
        })
      );
      setCouponUsages((prev) => ({ ...prev, [couponId]: enriched }));
    } catch (error) {
      console.error('Error fetching coupon usages:', error);
    } finally {
      setLoadingCouponUsages(null);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Create Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Criar Novo Voucher ou Cupom
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="mb-2 block">Tipo</Label>
            <RadioGroup value={newType} onValueChange={(v) => setNewType(v as 'voucher' | 'coupon')} className="flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="voucher" id="type-voucher" />
                <Label htmlFor="type-voucher" className="cursor-pointer">Voucher (lead grátis)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="coupon" id="type-coupon" />
                <Label htmlFor="type-coupon" className="cursor-pointer">Cupom (desconto %)</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="code">Código</Label>
              <Input
                id="code"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                placeholder={newType === 'voucher' ? 'EX: LEADGRATIS2026' : 'EX: DESCONTO20'}
                className="mt-1"
              />
            </div>
            {newType === 'coupon' && (
              <div>
                <Label htmlFor="discountPercent">Desconto (%)</Label>
                <Input
                  id="discountPercent"
                  type="number"
                  min={1}
                  max={100}
                  value={newDiscountPercent}
                  onChange={(e) => setNewDiscountPercent(parseInt(e.target.value) || 1)}
                  className="mt-1"
                />
              </div>
            )}
            <div>
              <Label htmlFor="maxUses">Máx. Usos (Total)</Label>
              <Input
                id="maxUses"
                type="number"
                min={1}
                value={newMaxUses}
                onChange={(e) => setNewMaxUses(parseInt(e.target.value) || 1)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="maxUsesPerUser">Máx. Usos por Usuário</Label>
              <Input
                id="maxUsesPerUser"
                type="number"
                min={1}
                value={newMaxUsesPerUser}
                onChange={(e) => setNewMaxUsesPerUser(parseInt(e.target.value) || 1)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Expiração</Label>
              <Select value={newExpiration} onValueChange={setNewExpiration}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPIRATION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={createItem} disabled={creating}>
            {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Criar {newType === 'voucher' ? 'Voucher' : 'Cupom'}
          </Button>
        </CardContent>
      </Card>

      {/* Vouchers List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            Vouchers ({vouchers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {vouchers.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Nenhum voucher criado</p>
          ) : (
            <div className="space-y-3">
              {vouchers.map((voucher) => (
                <div key={voucher.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-wrap">
                      <code className="text-lg font-bold bg-muted px-3 py-1 rounded">{voucher.code}</code>
                      <Badge variant="outline">Voucher</Badge>
                      <Badge variant={voucher.is_active && !isExpired(voucher.expires_at) ? 'default' : 'secondary'}>
                        {isExpired(voucher.expires_at) ? 'Expirado' : voucher.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {voucher.redemption_count}/{voucher.max_uses} usos
                      </span>
                      <span className="text-sm text-muted-foreground">
                        (máx {voucher.max_uses_per_user}/usuário)
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch checked={voucher.is_active} onCheckedChange={() => toggleVoucher(voucher.id, voucher.is_active)} />
                      <Button variant="ghost" size="sm" onClick={() => fetchRedemptions(voucher.id)}>
                        {expandedVoucher === voucher.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    <p className="text-xs text-muted-foreground">
                      Criado em {new Date(voucher.created_at).toLocaleDateString('pt-BR')}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatExpiration(voucher.expires_at)}
                    </p>
                  </div>
                  {expandedVoucher === voucher.id && (
                    <div className="mt-4 border-t pt-3">
                      {loadingRedemptions === voucher.id ? (
                        <div className="flex justify-center py-2"><Loader2 className="h-4 w-4 animate-spin" /></div>
                      ) : (redemptions[voucher.id] || []).length === 0 ? (
                        <p className="text-sm text-muted-foreground">Nenhum uso registrado</p>
                      ) : (
                        <div className="space-y-2">
                          {(redemptions[voucher.id] || []).map((r) => (
                            <div key={r.id} className="flex justify-between items-center text-sm bg-muted/50 rounded p-2">
                              <div>
                                <span className="font-medium">{r.user_name}</span>
                                <span className="text-muted-foreground"> → {r.lead_name}</span>
                              </div>
                              <span className="text-muted-foreground text-xs">
                                {new Date(r.redeemed_at).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Coupons List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5" />
            Cupons de Desconto ({coupons.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {coupons.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Nenhum cupom criado</p>
          ) : (
            <div className="space-y-3">
              {coupons.map((coupon) => (
                <div key={coupon.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-wrap">
                      <code className="text-lg font-bold bg-muted px-3 py-1 rounded">{coupon.code}</code>
                      <Badge variant="outline" className="text-primary border-primary">
                        Cupom {coupon.discount_percent}%
                      </Badge>
                      <Badge variant={coupon.is_active && !isExpired(coupon.expires_at) ? 'default' : 'secondary'}>
                        {isExpired(coupon.expires_at) ? 'Expirado' : coupon.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {coupon.usage_count}/{coupon.max_uses} usos
                      </span>
                      <span className="text-sm text-muted-foreground">
                        (máx {coupon.max_uses_per_user}/usuário)
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch checked={coupon.is_active} onCheckedChange={() => toggleCoupon(coupon.id, coupon.is_active)} />
                      <Button variant="ghost" size="sm" onClick={() => fetchCouponUsages(coupon.id)}>
                        {expandedCoupon === coupon.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    <p className="text-xs text-muted-foreground">
                      Criado em {new Date(coupon.created_at).toLocaleDateString('pt-BR')}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatExpiration(coupon.expires_at)}
                    </p>
                  </div>
                  {expandedCoupon === coupon.id && (
                    <div className="mt-4 border-t pt-3">
                      {loadingCouponUsages === coupon.id ? (
                        <div className="flex justify-center py-2"><Loader2 className="h-4 w-4 animate-spin" /></div>
                      ) : (couponUsages[coupon.id] || []).length === 0 ? (
                        <p className="text-sm text-muted-foreground">Nenhum uso registrado</p>
                      ) : (
                        <div className="space-y-2">
                          {(couponUsages[coupon.id] || []).map((u) => (
                            <div key={u.id} className="flex justify-between items-center text-sm bg-muted/50 rounded p-2">
                              <span className="font-medium">{u.user_name}</span>
                              <span className="text-muted-foreground text-xs">
                                {new Date(u.used_at).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
