import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

const PropertySearchDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [search, setSearch] = useState<PropertySearch | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingOffer, setSendingOffer] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && id) fetchData();
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

  const handleSendOffer = async () => {
    if (!search || !user) return;
    setSendingOffer(true);

    // Increment offer count
    await supabase.rpc('increment_offer_count', { p_search_id: search.id });

    // Get owner phone via security definer function
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

    // Update local state
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
    { label: 'Valor (R$)', value: search.value },
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
                {typeLabels[search.property_type] ?? search.property_type}
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
    </Layout>
  );
};

export default PropertySearchDetail;
