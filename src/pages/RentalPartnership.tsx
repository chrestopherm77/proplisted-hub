import { useState, useEffect, useMemo } from 'react';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useIBGELocation } from '@/hooks/useIBGELocation';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Handshake, Loader2, MessageCircle, Building2, User, Plus, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ZONE_OPTIONS } from '@/lib/propertyUtils';

interface ServiceArea { state: string; city: string }

interface RentalPartner {
  id: string;
  name: string;
  logo_url: string | null;
  banner_url: string | null;
  website_url: string | null;
  commission_text: string | null;
  commission_tenant_text: string | null;
  commission_tenant_when: string | null;
  commission_owner_text: string | null;
  commission_owner_when: string | null;
  whatsapp_phone: string;
  state: string;
  city: string;
  service_areas: ServiceArea[] | null;
}

const BECOME_PARTNER_PHONE = '5543996102805';

const PROPERTY_TYPES = [
  'Casa',
  'Apartamento',
  'Sala Comercial',
  'Galpão',
  'Terreno',
  'Outro',
];

const normalizePhone = (raw: string) => {
  const digits = (raw || '').replace(/\D/g, '');
  if (!digits) return '';
  let local = digits;
  if (local.startsWith('55') && local.length >= 12) local = local.slice(2);
  if (local.length === 11) local = local.slice(0, 2) + local.slice(3);
  if (local.length < 10) return '55' + digits;
  return '55' + local;
};

const formatCurrency = (value: string) => {
  const nums = value.replace(/\D/g, '');
  if (!nums) return '';
  const amount = parseInt(nums, 10) / 100;
  return amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const stripAccent = (s: string) =>
  (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

const whenLabel = (v: string | null | undefined) =>
  v === 'FIRST_PAYMENT' ? 'no 1º pagamento' : v === 'RECURRING' ? 'recorrente' : '';

const getAreas = (p: RentalPartner): ServiceArea[] => {
  const arr = Array.isArray(p.service_areas) ? p.service_areas : [];
  if (arr.length > 0) return arr;
  return [{ state: p.state, city: p.city }];
};

export default function RentalPartnership() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const { states, cities, fetchCities, clearCities } = useIBGELocation();
  const { cities: ownerCities, fetchCities: fetchOwnerCities, clearCities: clearOwnerCities } = useIBGELocation();

  const [loading, setLoading] = useState(true);
  const [partners, setPartners] = useState<RentalPartner[]>([]);
  const [filterUf, setFilterUf] = useState<string>('');
  const [filterCity, setFilterCity] = useState<string>('');

  const [broker, setBroker] = useState<{ name: string; phone: string; creci: string; creci_uf: string }>({
    name: '',
    phone: '',
    creci: '',
    creci_uf: '',
  });

  const [ownerDialog, setOwnerDialog] = useState<{ open: boolean; partner: RentalPartner | null }>({
    open: false,
    partner: null,
  });
  const [ownerForm, setOwnerForm] = useState({
    property_type: '',
    uf: '',
    city: '',
    zone: '',
    rent_value: '',
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('rental_partners')
        .select('id,name,logo_url,banner_url,website_url,commission_text,commission_tenant_text,commission_tenant_when,commission_owner_text,commission_owner_when,whatsapp_phone,state,city,service_areas')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });
      setPartners((data as any as RentalPartner[]) || []);
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('name, phone, creci, creci_uf, creci_number')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setBroker({
            name: data.name || '',
            phone: data.phone || '',
            creci: data.creci || data.creci_number || '',
            creci_uf: data.creci_uf || '',
          });
        }
      });
  }, [user]);

  const handleFilterUf = (val: string) => {
    setFilterUf(val);
    setFilterCity('');
    clearCities();
    if (val) fetchCities(val);
  };

  const filtered = useMemo(() => {
    return partners.filter((p) => {
      const areas = getAreas(p);
      if (filterUf && !areas.some((a) => (a.state || '').toUpperCase() === filterUf.toUpperCase())) return false;
      if (filterCity && !areas.some((a) => stripAccent(a.city) === stripAccent(filterCity))) return false;
      return true;
    });
  }, [partners, filterUf, filterCity]);

  const openWhats = (phone: string, message: string) => {
    const normalized = normalizePhone(phone);
    const url = `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const brokerSignature = () => {
    const lines = [
      ``,
      `*Corretor:* ${broker.name || '—'}`,
      `*Telefone:* ${broker.phone || '—'}`,
    ];
    if (broker.creci) {
      lines.push(`*CRECI:* ${broker.creci}${broker.creci_uf ? `/${broker.creci_uf}` : ''}`);
    }
    return lines.join('\n');
  };

  const handleTenantClick = (partner: RentalPartner) => {
    if (!broker.name || !broker.phone) {
      toast({ title: 'Complete seu perfil', description: 'Precisamos do seu nome e telefone.', variant: 'destructive' });
      return;
    }
    const msg = [
      `*Alugue em Parceria — Estou com o LOCATÁRIO*`,
      ``,
      `Olá, ${partner.name}! Tenho um cliente interessado em alugar um imóvel da carteira de vocês.`,
      `Gostaria de conversar sobre a parceria.`,
      brokerSignature(),
    ].join('\n');
    openWhats(partner.whatsapp_phone, msg);
  };

  const openOwnerDialog = (partner: RentalPartner) => {
    if (!broker.name || !broker.phone) {
      toast({ title: 'Complete seu perfil', description: 'Precisamos do seu nome e telefone.', variant: 'destructive' });
      return;
    }
    const firstArea = getAreas(partner)[0];
    setOwnerForm({
      property_type: '',
      uf: firstArea?.state || '',
      city: firstArea?.city || '',
      zone: '',
      rent_value: '',
    });
    clearOwnerCities();
    if (firstArea?.state) fetchOwnerCities(firstArea.state);
    setOwnerDialog({ open: true, partner });
  };

  const handleOwnerUf = (val: string) => {
    setOwnerForm((f) => ({ ...f, uf: val, city: '' }));
    clearOwnerCities();
    if (val) fetchOwnerCities(val);
  };

  const handleOwnerSubmit = () => {
    const { partner } = ownerDialog;
    if (!partner) return;
    if (!ownerForm.property_type || !ownerForm.uf || !ownerForm.city) {
      toast({ title: 'Preencha tipo, UF e cidade', variant: 'destructive' });
      return;
    }
    const msg = [
      `*Alugue em Parceria — Estou com o PROPRIETÁRIO*`,
      ``,
      `Olá, ${partner.name}! Tenho um imóvel para captação de parceria de locação.`,
      ``,
      `*Tipo:* ${ownerForm.property_type}`,
      `*Localização:* ${ownerForm.city}/${ownerForm.uf}${ownerForm.zone ? ` — Zona ${ownerForm.zone}` : ''}`,
      ownerForm.rent_value ? `*Valor pretendido:* ${ownerForm.rent_value}` : '',
      brokerSignature(),
    ].filter(Boolean).join('\n');
    openWhats(partner.whatsapp_phone, msg);
    setOwnerDialog({ open: false, partner: null });
  };

  const handleBecomePartner = () => {
    const msg = [
      `Olá! Tenho interesse em me tornar uma *imobiliária parceira* no módulo "Alugue em Parceria" da plataforma Conecta&Imob.`,
      ``,
      broker.name ? `Meu nome: ${broker.name}` : '',
      broker.phone ? `Telefone: ${broker.phone}` : '',
    ].filter(Boolean).join('\n');
    openWhats(BECOME_PARTNER_PHONE, msg);
  };

  if (!user) {
    return (
      <Layout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Faça login para acessar esta página.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Handshake className="h-6 w-6 text-primary" />
              Alugue em Parceria: Ganhe Dinheiro com Indicações de Locação
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              Indique clientes para imobiliárias que gerenciam carteiras de locação e receba comissões
              (em taxa única ou recorrência mensal), sem se preocupar com a burocracia da administração.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            {isAdmin && (
              <Button asChild variant="secondary">
                <Link to="/admin/rental-partners">
                  <Plus className="h-4 w-4 mr-2" />
                  Publicar aluguel
                </Link>
              </Button>
            )}
            <Button onClick={handleBecomePartner} variant="default">
              <MessageCircle className="h-4 w-4 mr-2" />
              Quero me tornar uma imob parceira
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>UF</Label>
                <Select value={filterUf} onValueChange={handleFilterUf}>
                  <SelectTrigger><SelectValue placeholder="Todas as UFs" /></SelectTrigger>
                  <SelectContent>
                    {states.map((s) => (
                      <SelectItem key={s.sigla} value={s.sigla}>{s.sigla}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Select value={filterCity} onValueChange={setFilterCity} disabled={!filterUf}>
                  <SelectTrigger><SelectValue placeholder={filterUf ? 'Todas' : 'Selecione a UF'} /></SelectTrigger>
                  <SelectContent>
                    {cities.map((c) => (
                      <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  variant="ghost"
                  onClick={() => { setFilterUf(''); setFilterCity(''); clearCities(); }}
                  disabled={!filterUf && !filterCity}
                >
                  Limpar filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Nenhuma imobiliária parceira encontrada{filterUf ? ' para esta região' : ''}.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((p) => {
              const areas = getAreas(p);
              return (
                <Card key={p.id} className="overflow-hidden">
                  {p.banner_url && (
                    <div className="w-full aspect-[4/1] bg-muted">
                      <img src={p.banner_url} alt={`Banner ${p.name}`} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-start gap-4">
                      {p.logo_url ? (
                        <img
                          src={p.logo_url}
                          alt={p.name}
                          className="h-16 w-16 object-contain rounded-md border bg-white p-1 shrink-0"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-md bg-muted flex items-center justify-center shrink-0">
                          <Building2 className="h-7 w-7 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base leading-tight">{p.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {areas.map((a) => `${a.city}/${a.state}`).join(' • ')}
                        </p>
                        {p.website_url && (
                          <a
                            href={p.website_url.startsWith('http') ? p.website_url : `https://${p.website_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-1"
                          >
                            <Globe className="h-3 w-3" /> Site
                          </a>
                        )}
                      </div>
                    </div>

                    {(p.commission_tenant_text || p.commission_owner_text || p.commission_text) && (
                      <div className="space-y-1 text-xs">
                        {p.commission_tenant_text && (
                          <p>
                            <span className="font-medium text-primary">Indicação de Locatário:</span>{' '}
                            {p.commission_tenant_text}
                            {whenLabel(p.commission_tenant_when) && (
                              <span className="text-muted-foreground"> ({whenLabel(p.commission_tenant_when)})</span>
                            )}
                          </p>
                        )}
                        {p.commission_owner_text && (
                          <p>
                            <span className="font-medium text-primary">Indicação de Proprietário:</span>{' '}
                            {p.commission_owner_text}
                            {whenLabel(p.commission_owner_when) && (
                              <span className="text-muted-foreground"> ({whenLabel(p.commission_owner_when)})</span>
                            )}
                          </p>
                        )}
                        {!p.commission_tenant_text && !p.commission_owner_text && p.commission_text && (
                          <p className="text-primary font-medium">{p.commission_text}</p>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <Button variant="outline" onClick={() => handleTenantClick(p)}>
                        <User className="h-4 w-4 mr-2" />
                        Estou com locatário
                      </Button>
                      <Button onClick={() => openOwnerDialog(p)}>
                        <Building2 className="h-4 w-4 mr-2" />
                        Estou com proprietário
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={ownerDialog.open} onOpenChange={(o) => setOwnerDialog({ open: o, partner: o ? ownerDialog.partner : null })}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Dados do imóvel — {ownerDialog.partner?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Tipo de imóvel *</Label>
              <Select value={ownerForm.property_type} onValueChange={(v) => setOwnerForm({ ...ownerForm, property_type: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {PROPERTY_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>UF *</Label>
                <Select value={ownerForm.uf} onValueChange={handleOwnerUf}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {states.map((s) => (
                      <SelectItem key={s.sigla} value={s.sigla}>{s.sigla}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cidade *</Label>
                <Select
                  value={ownerForm.city}
                  onValueChange={(v) => setOwnerForm({ ...ownerForm, city: v })}
                  disabled={!ownerForm.uf}
                >
                  <SelectTrigger><SelectValue placeholder={ownerForm.uf ? 'Selecione' : 'Selecione a UF'} /></SelectTrigger>
                  <SelectContent>
                    {ownerCities.map((c) => (
                      <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Zona</Label>
              <Select value={ownerForm.zone} onValueChange={(v) => setOwnerForm({ ...ownerForm, zone: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {ZONE_OPTIONS.map((z) => <SelectItem key={z} value={z}>{z}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Valor pretendido</Label>
              <Input
                placeholder="R$ 0,00"
                value={ownerForm.rent_value}
                onChange={(e) => setOwnerForm({ ...ownerForm, rent_value: formatCurrency(e.target.value) })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOwnerDialog({ open: false, partner: null })}>
              Cancelar
            </Button>
            <Button onClick={handleOwnerSubmit}>
              <MessageCircle className="h-4 w-4 mr-2" />
              Enviar pelo WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
