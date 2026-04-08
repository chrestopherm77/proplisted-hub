import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Info, DollarSign, Building2, User, MessageCircle, Download, FileText, FolderOpen, Loader2, MapPin, TrendingUp, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Launch {
  id: string;
  user_id: string;
  name: string;
  banner_url: string | null;
  state: string | null;
  city: string;
  neighborhood: string | null;
  zone: string | null;
  launch_date: string | null;
  delivery_date: string | null;
  price_from: string | null;
  commission: string | null;
  floors: string | null;
  total_units: string | null;
  associative: string | null;
  book_url: string | null;
  table_url: string | null;
  drive_url: string | null;
  coordinator_name: string | null;
  coordinator_phone: string | null;
}

const formatCurrency = (raw: string | null): string => {
  if (!raw) return '—';
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '—';
  const num = parseInt(digits, 10);
  return `R$ ${(num / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
};

const formatDate = (d: string | null): string => {
  if (!d) return '—';
  try {
    return format(new Date(d), 'dd/MM/yyyy');
  } catch {
    return '—';
  }
};

const LaunchDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [launch, setLaunch] = useState<Launch | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/auth'); return; }
    fetchLaunch();
  }, [id, user, authLoading]);

  const fetchLaunch = async () => {
    if (!id) return;
    const { data, error } = await supabase
      .from('launches')
      .select('*')
      .eq('id', id)
      .single();
    if (!error && data) setLaunch(data as Launch);
    setLoading(false);
  };

  const whatsappLink = launch?.coordinator_phone
    ? `https://wa.me/55${launch.coordinator_phone.replace(/\D/g, '')}`
    : '#';

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!launch) {
    return (
      <Layout>
        <div className="text-center py-20 text-muted-foreground">Lançamento não encontrado.</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/launches')} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Banner */}
            {launch.banner_url && (
              <div className="rounded-xl overflow-hidden aspect-[16/7] bg-muted">
                <img src={launch.banner_url} alt={launch.name} className="w-full h-full object-cover" />
              </div>
            )}

            <h1 className="text-2xl font-bold text-foreground">{launch.name}</h1>

            {/* Informações Gerais */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Info className="h-5 w-5" /> Informações Gerais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <InfoRow icon={<MapPin className="h-4 w-4" />} label="Bairro" value={launch.neighborhood || '—'} />
                  <InfoRow icon={<TrendingUp className="h-4 w-4" />} label="Zona" value={launch.zone || '—'} />
                  <InfoRow icon={<Calendar className="h-4 w-4" />} label="Data Lançamento" value={formatDate(launch.launch_date)} />
                  <InfoRow icon={<Calendar className="h-4 w-4" />} label="Data Entrega" value={formatDate(launch.delivery_date)} />
                </div>
              </CardContent>
            </Card>

            {/* Valores e Bônus */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5" /> Valores e Bônus
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <InfoRow icon={<DollarSign className="h-4 w-4" />} label="A partir de" value={formatCurrency(launch.price_from)} valueClass="text-primary font-semibold" />
                  <InfoRow icon={<DollarSign className="h-4 w-4" />} label="Comissão" value={launch.commission || '—'} />
                </div>
              </CardContent>
            </Card>

            {/* Estrutura */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5" /> Estrutura
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <InfoRow icon={<Building2 className="h-4 w-4" />} label="Andares" value={launch.floors || '—'} />
                  <InfoRow icon={<Building2 className="h-4 w-4" />} label="Total de Unidades" value={launch.total_units || '—'} />
                  <InfoRow icon={<Building2 className="h-4 w-4" />} label="Associativo" value={launch.associative || '—'} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Coordenador */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" /> Coordenador
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-3">
                <p className="font-medium text-foreground">{launch.coordinator_name || '—'}</p>
                {launch.coordinator_phone && (
                  <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                    <Button className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white">
                      <MessageCircle className="h-4 w-4" /> Whatsapp
                    </Button>
                  </a>
                )}
              </CardContent>
            </Card>

            {/* Downloads */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Download className="h-5 w-5" /> Downloads
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {launch.book_url && (
                  <a href={launch.book_url} target="_blank" rel="noopener noreferrer">
                    <Button className="w-full gap-2" variant="default">
                      <FileText className="h-4 w-4" /> Book
                    </Button>
                  </a>
                )}
                {launch.table_url && (
                  <a href={launch.table_url} target="_blank" rel="noopener noreferrer">
                    <Button className="w-full gap-2" variant="default">
                      <FileText className="h-4 w-4" /> Tabela
                    </Button>
                  </a>
                )}
                {launch.drive_url && (
                  <a href={launch.drive_url} target="_blank" rel="noopener noreferrer">
                    <Button className="w-full gap-2" variant="default">
                      <FolderOpen className="h-4 w-4" /> Drive
                    </Button>
                  </a>
                )}
                {!launch.book_url && !launch.table_url && !launch.drive_url && (
                  <p className="text-muted-foreground text-sm text-center">Nenhum arquivo disponível</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

const InfoRow = ({ icon, label, value, valueClass }: { icon: React.ReactNode; label: string; value: string; valueClass?: string }) => (
  <div className="flex items-start gap-2">
    <span className="text-muted-foreground mt-0.5">{icon}</span>
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-sm font-medium text-foreground truncate ${valueClass || ''}`}>{value}</p>
    </div>
  </div>
);

export default LaunchDetail;
