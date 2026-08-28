import { useEffect, useMemo, useState } from 'react';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Gift, Loader2, MapPin, ExternalLink, Copy, Ticket, Globe } from 'lucide-react';

const USAGE_LIMIT_LABEL: Record<string, string> = {
  MONTHLY_1: 'Válido para 1 uso por mês.',
  MONTHLY_2: 'Válido para 2 usos por mês.',
  UNLIMITED: 'Uso ilimitado — válido em toda compra.',
};

interface BenefitRow {
  id: string;
  partner_id: string;
  title: string;
  description: string | null;
  rules: string | null;
  discount_percent: number | null;
  discount_label: string | null;
  banner_url: string | null;
  state: string | null;
  city: string | null;
  link_url: string | null;
  address: string | null;
  is_online?: boolean | null;
  usage_limit?: string | null;
  benefit_partners?: { company_name: string; logo_url: string | null } | null;
}

export default function Beneficios() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [benefits, setBenefits] = useState<BenefitRow[]>([]);
  const [filterUf, setFilterUf] = useState('all');
  const [filterCity, setFilterCity] = useState('');
  const [selected, setSelected] = useState<BenefitRow | null>(null);
  const [voucherCode, setVoucherCode] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('benefits' as any)
        .select('*, benefit_partners(company_name, logo_url)')
        .eq('status', 'APPROVED')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });
      setBenefits((data as any as BenefitRow[]) || []);
      setLoading(false);
    };
    load();
  }, []);

  const ufs = useMemo(
    () => Array.from(new Set(benefits.map((b) => b.state).filter(Boolean))) as string[],
    [benefits]
  );

  const filtered = useMemo(() => {
    return benefits.filter((b) => {
      if (filterUf !== 'all' && b.state !== filterUf) return false;
      if (filterCity.trim() && !(b.city || '').toLowerCase().includes(filterCity.trim().toLowerCase())) return false;
      return true;
    });
  }, [benefits, filterUf, filterCity]);

  const openBenefit = async (benefit: BenefitRow) => {
    setSelected(benefit);
    setVoucherCode(null);
    if (!user) return;
    const { data } = await supabase
      .from('benefit_vouchers' as any)
      .select('code')
      .eq('benefit_id', benefit.id)
      .eq('user_id', user.id)
      .maybeSingle();
    if (data) setVoucherCode((data as any).code);
  };

  const generateVoucher = async () => {
    if (!selected) return;
    setGenerating(true);
    const { data, error } = await supabase.rpc('generate_benefit_voucher' as any, {
      p_benefit_id: selected.id,
    });
    setGenerating(false);
    const result = data as any;
    if (error || result?.error) {
      toast({
        title: 'Erro',
        description: result?.error || error?.message || 'Não foi possível gerar o voucher',
        variant: 'destructive',
      });
      return;
    }
    setVoucherCode(result.code);
  };

  const discountText = (b: BenefitRow) =>
    b.discount_label || (b.discount_percent ? `${Number(b.discount_percent)}% OFF` : 'Benefício');

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Gift className="h-7 w-7 text-primary" />
            Portal de Benefícios
          </h1>
          <p className="text-muted-foreground mt-1">
            Descontos exclusivos dos nossos parceiros para você. Gere o seu voucher e apresente na loja.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 mb-8">
          <div>
            <Label>Estado</Label>
            <Select value={filterUf} onValueChange={setFilterUf}>
              <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {ufs.map((uf) => (
                  <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Cidade</Label>
            <Input value={filterCity} onChange={(e) => setFilterCity(e.target.value)} placeholder="Buscar cidade" />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">
            Nenhum benefício disponível no momento.
          </CardContent></Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((b) => (
              <Card key={b.id} className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
                <div className="relative h-40 bg-muted flex items-center justify-center">
                  {b.banner_url ? (
                    <img src={b.banner_url} alt={b.title} className="h-full w-full object-cover" loading="lazy" />
                  ) : b.benefit_partners?.logo_url ? (
                    <img src={b.benefit_partners.logo_url} alt={b.benefit_partners.company_name} className="max-h-24 object-contain" loading="lazy" />
                  ) : (
                    <Gift className="h-10 w-10 text-muted-foreground" />
                  )}
                  <Badge className="absolute top-3 right-3 text-sm">{discountText(b)}</Badge>
                </div>
                <CardContent className="p-4 flex-1 flex flex-col gap-2">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {b.benefit_partners?.company_name}
                  </p>
                  <h2 className="font-semibold leading-tight">{b.title}</h2>
                  {b.description && (
                    <p className="text-sm text-muted-foreground line-clamp-3">{b.description}</p>
                  )}
                  {b.is_online && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Globe className="h-3 w-3" /> Online
                    </p>
                  )}
                  {(b.city || b.state) && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {[b.city, b.state].filter(Boolean).join(' - ')}
                    </p>
                  )}
                  <Button className="mt-auto w-full" onClick={() => openBenefit(b)}>
                    <Ticket className="h-4 w-4 mr-2" /> Pegar meu voucher
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selected?.title}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {selected.benefit_partners?.logo_url && (
                  <img src={selected.benefit_partners.logo_url} alt="" className="h-12 w-12 object-contain rounded" />
                )}
                <div>
                  <p className="font-medium">{selected.benefit_partners?.company_name}</p>
                  <Badge variant="secondary">{discountText(selected)}</Badge>
                </div>
              </div>
              {selected.description && <p className="text-sm">{selected.description}</p>}
              {selected.rules && (
                <div className="rounded-md bg-muted p-3 text-xs whitespace-pre-wrap">
                  <strong>Regras:</strong>{'\n'}{selected.rules}
                </div>
              )}
              {selected.address && (
                <p className="text-sm flex items-center gap-1"><MapPin className="h-4 w-4" /> {selected.address}</p>
              )}
              {selected.link_url && (
                <a href={selected.link_url} target="_blank" rel="noreferrer"
                   className="text-sm text-primary inline-flex items-center gap-1">
                  Ver mais <ExternalLink className="h-3 w-3" />
                </a>
              )}

              {!user ? (
                <p className="text-sm text-muted-foreground">Entre na sua conta para gerar o voucher.</p>
              ) : voucherCode ? (
                <div className="rounded-lg border-2 border-dashed border-primary p-4 text-center space-y-2">
                  <p className="text-xs text-muted-foreground">Seu código de voucher</p>
                  <p className="text-2xl font-bold tracking-widest">{voucherCode}</p>
                  <Button variant="outline" size="sm" onClick={() => {
                    navigator.clipboard.writeText(voucherCode);
                    toast({ title: 'Código copiado!' });
                  }}>
                    <Copy className="h-4 w-4 mr-2" /> Copiar código
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Apresente este código no parceiro. {USAGE_LIMIT_LABEL[selected?.usage_limit || 'MONTHLY_1']}
                  </p>
                </div>
              ) : (
                <Button className="w-full" onClick={generateVoucher} disabled={generating}>
                  {generating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Gerar meu voucher
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
