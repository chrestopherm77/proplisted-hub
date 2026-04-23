import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MessageCircle, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { PlanLimitDialog } from '@/components/plans/PlanLimitDialog';

const typeLabels: Record<string, string> = {
  CASA: 'Casa',
  APARTAMENTO: 'Apartamento',
  SALA_COMERCIAL: 'Sala Comercial',
  LOTE: 'Lote',
  RURAL: 'Rural',
  PREDIO_COMERCIAL: 'Prédio Comercial',
};
const opLabels: Record<string, string> = {
  VENDA: 'Venda',
  COMPRA: 'Compra',
  ALUGUEL: 'Aluguel',
};
const houseLabels: Record<string, string> = { RUA: 'Rua', CONDOMINIO: 'Condomínio' };
const ruralLabels: Record<string, string> = {
  FAZENDA: 'Fazenda',
  SITIO: 'Sítio',
  RANCHO: 'Rancho',
  CHACARA: 'Chácara',
};

interface PropertySearch {
  id: string;
  user_id: string;
  title: string | null;
  property_type: string;
  operation_type: string;
  city: string;
  state: string | null;
  neighborhood: string | null;
  zone: string | null;
  size_m2: string | null;
  bedrooms: string | null;
  value: string | null;
  parking_spots: string | null;
  observation: string | null;
  house_type: string | null;
  rural_type: string | null;
  is_active: boolean;
  offer_count: number;
  created_at: string;
}

interface OfferRecord {
  id: string;
  user_id: string;
  offer_name: string | null;
  offer_link: string | null;
  created_at: string | null;
}

const PropertySearchDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { can: canResource } = useSubscriptionLimits();
  const offersGate = canResource('partnership_offers');
  const [showOffersLimitDialog, setShowOffersLimitDialog] = useState(false);
  const [search, setSearch] = useState<PropertySearch | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingOffer, setSendingOffer] = useState(false);
  const [offers, setOffers] = useState<OfferRecord[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) { navigate('/auth'); return; }
      if (isAdmin === false) { navigate('/'); return; }
    }
  }, [user, authLoading, isAdmin, navigate]);

  useEffect(() => {
    if (user && id) {
      fetchData();
      fetchOffers();
    }
  }, [user, id]);

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('property_searches')
      .select('*')
      .eq('id', id!)
      .single();

    if (!error && data) {
      setSearch(data as unknown as PropertySearch);
    }
    setLoading(false);
  };

  const fetchOffers = async () => {
    if (!id) return;
    setLoadingOffers(true);
    const { data } = await supabase
      .from('property_search_offers')
      .select('id, user_id, offer_name, offer_link, created_at')
      .eq('search_id', id)
      .order('created_at', { ascending: false });

    setOffers((data ?? []) as OfferRecord[]);
    setLoadingOffers(false);
  };

  const handleSendOffer = async () => {
    if (!search || !user) return;
    if (!offersGate.allowed) {
      setShowOffersLimitDialog(true);
      return;
    }
    setSendingOffer(true);

    await supabase.rpc('increment_offer_count', { p_search_id: search.id });

    await supabase.from('property_search_offers').upsert(
      { search_id: search.id, user_id: user.id },
      { onConflict: 'search_id,user_id' }
    );

    const { data: phone } = await supabase.rpc('get_profile_phone', { p_user_id: search.user_id });

    if (!phone) {
      toast({ title: 'Erro', description: 'Não foi possível obter o contato do anunciante.', variant: 'destructive' });
      setSendingOffer(false);
      return;
    }

    const clean = (phone as string).replace(/\D/g, '');
    const fullPhone = clean.startsWith('55') ? clean : `55${clean}`;
    const msg = encodeURIComponent(
      `Olá! Vi sua procura de ${typeLabels[search.property_type] ?? search.property_type} em ${search.city} e gostaria de enviar uma oferta.`
    );
    window.open(`https://wa.me/${fullPhone}?text=${msg}`, '_blank');

    setSearch(prev => prev ? { ...prev, offer_count: (prev.offer_count ?? 0) + 1 } : prev);
    setSendingOffer(false);
  };

  if (authLoading || !user) return null;

  if (loading) {
    return (
      <Layout>
        <p className="text-center py-12 text-muted-foreground">Carregando...</p>
      </Layout>
    );
  }

  if (!search) {
    return (
      <Layout>
        <p className="text-center py-12 text-muted-foreground">Procura não encontrada.</p>
      </Layout>
    );
  }

  const formatDisplayValue = (raw: string | null): string => {
    if (!raw) return '';
    const digits = raw.replace(/\D/g, '');
    if (!digits) return '';
    const num = parseInt(digits, 10);
    return `R$ ${num.toLocaleString('pt-BR')}`;
  };

  const details: { label: string; value: string | null }[] = [
    { label: 'Operação', value: opLabels[search.operation_type] ?? search.operation_type },
    { label: 'Tipo', value: typeLabels[search.property_type] ?? search.property_type },
    ...(search.house_type ? [{ label: 'Tipo de Casa', value: houseLabels[search.house_type] ?? search.house_type }] : []),
    ...(search.rural_type ? [{ label: 'Tipo Rural', value: ruralLabels[search.rural_type] ?? search.rural_type }] : []),
    { label: 'Estado', value: search.state },
    { label: 'Cidade', value: search.city },
    { label: 'Bairro/Condomínio', value: search.neighborhood },
    { label: 'Zona', value: search.zone },
    { label: 'Tamanho (m²)', value: search.size_m2 },
    { label: 'Quartos', value: search.bedrooms },
    { label: 'Valor (R$)', value: search.value ? formatDisplayValue(search.value) : null },
    { label: 'Vagas de Garagem', value: search.parking_spots },
    { label: 'Ofertas', value: String(search.offer_count ?? 0) },
    { label: 'Data de Criação', value: format(new Date(search.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) },
  ];

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate('/property-searches')} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 flex-wrap">
              <CardTitle className="text-xl">
                {search.title || typeLabels[search.property_type] || search.property_type}
              </CardTitle>
              <Badge variant="secondary">
                {opLabels[search.operation_type] ?? search.operation_type}
              </Badge>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Ativa
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {details.map(
                (d) =>
                  d.value && (
                    <div key={d.label}>
                      <p className="text-xs text-muted-foreground">{d.label}</p>
                      <p className="font-medium text-foreground">{d.value}</p>
                    </div>
                  )
              )}
            </div>

            {search.observation && (
              <div>
                <p className="text-xs text-muted-foreground">Observação</p>
                <p className="text-foreground">{search.observation}</p>
              </div>
            )}

            {/* Ofertas Recebidas — visible to ALL */}
            <div className="pt-4 border-t border-border">
              <h3 className="text-sm font-semibold text-foreground mb-3">Ofertas Recebidas</h3>
              {loadingOffers ? (
                <p className="text-xs text-muted-foreground">Carregando...</p>
              ) : offers.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhuma oferta recebida ainda.</p>
              ) : (
                <div className="space-y-2">
                  {offers.map((offer) => (
                    <div key={offer.id} className="flex items-center gap-3 p-2 rounded-md bg-muted/50 border border-border/50">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {offer.offer_name ?? 'Corretor'}
                        </p>
                        {offer.created_at && (
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(offer.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        )}
                      </div>
                      {offer.offer_link && (
                        <a
                          href={offer.offer_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 text-primary hover:text-primary/80 flex items-center gap-1 text-xs"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Ver anúncio
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {search.user_id !== user.id && (
              <Button
                onClick={handleSendOffer}
                disabled={sendingOffer}
                className="w-full gap-2 mt-4"
                size="lg"
              >
                <MessageCircle className="h-5 w-5" />
                {sendingOffer ? 'Enviando...' : 'Enviar Oferta'}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <PlanLimitDialog
        open={showOffersLimitDialog}
        onOpenChange={setShowOffersLimitDialog}
        description={offersGate.reason ?? 'Faça upgrade do seu plano para enviar mais ofertas neste mês.'}
      />
    </Layout>
  );
};

export default PropertySearchDetail;
