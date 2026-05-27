import { useState, useEffect, useMemo } from 'react';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useIBGELocation } from '@/hooks/useIBGELocation';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Handshake, Loader2, MessageCircle, Building2, User } from 'lucide-react';

interface RentalPartner {
  id: string;
  name: string;
  logo_url: string | null;
  description: string | null;
  commission_text: string | null;
  whatsapp_phone: string;
  state: string;
  city: string;
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
  // Aceita 10, 11, 12, 13 dígitos — devolve sempre 55 + DDD + número (drop 9 se 11 dígitos locais)
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

export default function RentalPartnership() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { states, cities, fetchCities, clearCities } = useIBGELocation();

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
    neighborhood: '',
    rent_value: '',
    bedrooms: '',
    notes: '',
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('rental_partners')
        .select('id,name,logo_url,description,commission_text,whatsapp_phone,state,city')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });
      setPartners((data as RentalPartner[]) || []);
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
      if (filterUf && p.state.toUpperCase() !== filterUf.toUpperCase()) return false;
      if (filterCity && stripAccent(p.city) !== stripAccent(filterCity)) return false;
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
    setOwnerForm({
      property_type: '',
      uf: partner.state || '',
      city: partner.city || '',
      neighborhood: '',
      rent_value: '',
      bedrooms: '',
      notes: '',
    });
    setOwnerDialog({ open: true, partner });
  };

  const handleOwnerSubmit = () => {
    const { partner } = ownerDialog;
    if (!partner) return;
    if (!ownerForm.property_type || !ownerForm.uf || !ownerForm.city || !ownerForm.rent_value) {
      toast({ title: 'Preencha os campos obrigatórios', variant: 'destructive' });
      return;
    }
    const msg = [
      `*Alugue em Parceria — Estou com o PROPRIETÁRIO*`,
      ``,
      `Olá, ${partner.name}! Tenho um imóvel para captação de parceria de locação.`,
      ``,
      `*Tipo:* ${ownerForm.property_type}`,
      `*Localização:* ${ownerForm.city}/${ownerForm.uf}${ownerForm.neighborhood ? ` — ${ownerForm.neighborhood}` : ''}`,
      `*Valor pretendido:* ${ownerForm.rent_value}`,
      ownerForm.bedrooms ? `*Dormitórios:* ${ownerForm.bedrooms}` : '',
      ownerForm.notes ? `*Observações:* ${ownerForm.notes}` : '',
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Handshake className="h-6 w-6 text-primary" />
              Alugue em Parceria
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              Encontre imobiliárias parceiras para formar parcerias de locação.
              Escolha a imob pela cidade, indique se você está com o locatário ou com o proprietário,
              e nós abrimos o WhatsApp dela já com seus dados.
            </p>
          </div>
          <Button onClick={handleBecomePartner} variant="default" className="shrink-0">
            <MessageCircle className="h-4 w-4 mr-2" />
            Quero me tornar uma imob parceira
          </Button>
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
            {filtered.map((p) => (
              <Card key={p.id} className="overflow-hidden">
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
                      <p className="text-xs text-muted-foreground mt-0.5">{p.city}/{p.state}</p>
                      {p.commission_text && (
                        <p className="text-xs font-medium text-primary mt-1">{p.commission_text}</p>
                      )}
                    </div>
                  </div>

                  {p.description && (
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {p.description}
                    </p>
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
            ))}
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
                <Input value={ownerForm.uf} onChange={(e) => setOwnerForm({ ...ownerForm, uf: e.target.value.toUpperCase().slice(0, 2) })} />
              </div>
              <div className="space-y-2">
                <Label>Cidade *</Label>
                <Input value={ownerForm.city} onChange={(e) => setOwnerForm({ ...ownerForm, city: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Bairro</Label>
              <Input value={ownerForm.neighborhood} onChange={(e) => setOwnerForm({ ...ownerForm, neighborhood: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Valor pretendido *</Label>
                <Input
                  placeholder="R$ 0,00"
                  value={ownerForm.rent_value}
                  onChange={(e) => setOwnerForm({ ...ownerForm, rent_value: formatCurrency(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Dormitórios</Label>
                <Input
                  type="number"
                  min={0}
                  value={ownerForm.bedrooms}
                  onChange={(e) => setOwnerForm({ ...ownerForm, bedrooms: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                rows={3}
                value={ownerForm.notes}
                onChange={(e) => setOwnerForm({ ...ownerForm, notes: e.target.value })}
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
