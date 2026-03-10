import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Plus, Ticket, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

interface Voucher {
  id: string;
  code: string;
  is_active: boolean;
  max_uses: number;
  created_at: string;
  redemption_count?: number;
}

interface Redemption {
  id: string;
  user_id: string;
  lead_id: string;
  redeemed_at: string;
  user_name?: string;
  lead_name?: string;
}

export function VouchersManagement() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCode, setNewCode] = useState('');
  const [newMaxUses, setNewMaxUses] = useState(1);
  const [creating, setCreating] = useState(false);
  const [expandedVoucher, setExpandedVoucher] = useState<string | null>(null);
  const [redemptions, setRedemptions] = useState<Record<string, Redemption[]>>({});
  const [loadingRedemptions, setLoadingRedemptions] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    try {
      const { data: vouchersData, error } = await supabase
        .from('vouchers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get redemption counts
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
    } finally {
      setLoading(false);
    }
  };

  const createVoucher = async () => {
    if (!newCode.trim()) {
      toast({ title: 'Informe o código do voucher', variant: 'destructive' });
      return;
    }

    setCreating(true);
    try {
      const { error } = await supabase.from('vouchers').insert({
        code: newCode.trim().toUpperCase(),
        max_uses: newMaxUses,
      });

      if (error) {
        if (error.code === '23505') {
          toast({ title: 'Já existe um voucher com este código', variant: 'destructive' });
        } else {
          throw error;
        }
        return;
      }

      toast({ title: 'Voucher criado com sucesso!' });
      setNewCode('');
      setNewMaxUses(1);
      fetchVouchers();
    } catch (error) {
      console.error('Error creating voucher:', error);
      toast({ title: 'Erro ao criar voucher', variant: 'destructive' });
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
      setVouchers((prev) =>
        prev.map((v) => (v.id === id ? { ...v, is_active: !currentActive } : v))
      );
    } catch (error) {
      console.error('Error toggling voucher:', error);
      toast({ title: 'Erro ao atualizar voucher', variant: 'destructive' });
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

      // Enrich with user and lead names
      const enriched = await Promise.all(
        (data || []).map(async (r) => {
          const [{ data: profile }, { data: lead }] = await Promise.all([
            supabase.from('profiles').select('name').eq('id', r.user_id).single(),
            supabase.from('leads').select('name').eq('id', r.lead_id).single(),
          ]);
          return {
            ...r,
            user_name: profile?.name || 'Desconhecido',
            lead_name: lead?.name || 'Lead removido',
          };
        })
      );

      setRedemptions((prev) => ({ ...prev, [voucherId]: enriched }));
    } catch (error) {
      console.error('Error fetching redemptions:', error);
    } finally {
      setLoadingRedemptions(null);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Criar Novo Voucher
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="voucherCode">Código do Voucher</Label>
              <Input
                id="voucherCode"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                placeholder="EX: LEADGRATIS2026"
                className="mt-1"
              />
            </div>
            <div className="w-32">
              <Label htmlFor="maxUses">Máx. Usos</Label>
              <Input
                id="maxUses"
                type="number"
                min={1}
                value={newMaxUses}
                onChange={(e) => setNewMaxUses(parseInt(e.target.value) || 1)}
                className="mt-1"
              />
            </div>
            <Button onClick={createVoucher} disabled={creating}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Criar
            </Button>
          </div>
        </CardContent>
      </Card>

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
                    <div className="flex items-center gap-3">
                      <code className="text-lg font-bold bg-muted px-3 py-1 rounded">
                        {voucher.code}
                      </code>
                      <Badge variant={voucher.is_active ? 'default' : 'secondary'}>
                        {voucher.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {voucher.redemption_count}/{voucher.max_uses} usos
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={voucher.is_active}
                        onCheckedChange={() => toggleVoucher(voucher.id, voucher.is_active)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => fetchRedemptions(voucher.id)}
                      >
                        {expandedVoucher === voucher.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground mt-1">
                    Criado em {new Date(voucher.created_at).toLocaleDateString('pt-BR')}
                  </p>

                  {expandedVoucher === voucher.id && (
                    <div className="mt-4 border-t pt-3">
                      {loadingRedemptions === voucher.id ? (
                        <div className="flex justify-center py-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      ) : (redemptions[voucher.id] || []).length === 0 ? (
                        <p className="text-sm text-muted-foreground">Nenhum uso registrado</p>
                      ) : (
                        <div className="space-y-2">
                          {(redemptions[voucher.id] || []).map((r) => (
                            <div
                              key={r.id}
                              className="flex justify-between items-center text-sm bg-muted/50 rounded p-2"
                            >
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
    </div>
  );
}
