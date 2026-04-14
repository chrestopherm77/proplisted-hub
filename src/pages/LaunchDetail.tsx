import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ArrowLeft, Info, DollarSign, Building2, User, MessageCircle, Download, FileText, FolderOpen, Loader2, MapPin, TrendingUp, Calendar, Trash2, Ruler, Home } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface Launch {
  id: string;
  user_id: string;
  name: string;
  banner_url: string | null;
  logo_url: string | null;
  state: string | null;
  city: string;
  neighborhood: string | null;
  zone: string | null;
  launch_date: string | null;
  delivery_date: string | null;
  price_from: string | null;
  price_max: string | null;
  commission: string | null;
  floors: string | null;
  total_units: string | null;
  associative: string | null;
  book_url: string | null;
  table_url: string | null;
  drive_url: string | null;
  drive_link: string | null;
  coordinator_name: string | null;
  coordinator_phone: string | null;
  coordinator_phone2: string | null;
  property_type: string | null;
  size_m2_min: string | null;
  size_m2_max: string | null;
  status: string | null;
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
  try { return format(new Date(d), 'dd/MM/yyyy'); } catch { return '—'; }
};

const whatsLink = (phone: string | null) =>
  phone ? `https://wa.me/55${phone.replace(/\D/g, '')}` : '#';

const LaunchDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading, isAdmin, isConstrutora } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [launch, setLaunch] = useState<Launch | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/auth'); return; }
    if (isAdmin === false && !isConstrutora) { navigate('/'); return; }
    if (isAdmin || isConstrutora) fetchLaunch();
  }, [id, user, authLoading, isAdmin]);

  const fetchLaunch = async () => {
    if (!id) return;
    const { data, error } = await supabase.from('launches').select('*').eq('id', id).single();
    if (!error && data) setLaunch(data as Launch);
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    const { error } = await supabase.from('launches').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
      setDeleting(false);
    } else {
      toast({ title: 'Empreendimento excluído' });
      navigate('/launches');
    }
  };

  const driveHref = launch?.drive_link || launch?.drive_url || '#';

  if (authLoading || loading) {
    return <Layout><div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></Layout>;
  }

  if (!launch) {
    return <Layout><div className="text-center py-20 text-muted-foreground">Lançamento não encontrado.</div></Layout>;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/launches')} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="gap-2">
                <Trash2 className="h-4 w-4" /> Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir empreendimento?</AlertDialogTitle>
                <AlertDialogDescription>Essa ação não pode ser desfeita. O lançamento "{launch.name}" será removido permanentemente.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground">
                  {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Excluir'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Banner + Logo */}
            <div className="relative">
              {launch.banner_url && (
                <div className="rounded-xl overflow-hidden aspect-[16/7] bg-muted">
                  <img src={launch.banner_url} alt={launch.name} className="w-full h-full object-cover" />
                </div>
              )}
              {launch.logo_url && (
                <img src={launch.logo_url} alt="Logo" className="absolute bottom-3 left-3 h-16 w-16 rounded-lg bg-white object-contain shadow-md border border-border" />
              )}
            </div>

            <h1 className="text-2xl font-bold text-foreground">{launch.name}</h1>

            {/* Informações Gerais */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2"><Info className="h-5 w-5" /> Informações Gerais</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <InfoRow icon={<MapPin className="h-4 w-4" />} label="Bairro" value={launch.neighborhood || '—'} />
                  <InfoRow icon={<TrendingUp className="h-4 w-4" />} label="Zona" value={launch.zone || '—'} />
                  <InfoRow icon={<Home className="h-4 w-4" />} label="Tipo" value={launch.property_type || '—'} />
                  <InfoRow icon={<Info className="h-4 w-4" />} label="Status" value={launch.status || '—'} />
                  <InfoRow icon={<Calendar className="h-4 w-4" />} label="Data Lançamento" value={formatDate(launch.launch_date)} />
                  <InfoRow icon={<Calendar className="h-4 w-4" />} label="Data Entrega" value={formatDate(launch.delivery_date)} />
                  {(launch.size_m2_min || launch.size_m2_max) && (
                    <InfoRow icon={<Ruler className="h-4 w-4" />} label="Tamanho (m²)" value={`${launch.size_m2_min || '?'} – ${launch.size_m2_max || '?'} m²`} />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Valores e Bônus */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2"><DollarSign className="h-5 w-5" /> Valores e Bônus</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <InfoRow icon={<DollarSign className="h-4 w-4" />} label="A partir de" value={formatCurrency(launch.price_from)} valueClass="text-primary font-semibold" />
                  <InfoRow icon={<DollarSign className="h-4 w-4" />} label="Até" value={formatCurrency(launch.price_max)} valueClass="text-primary font-semibold" />
                  <InfoRow icon={<DollarSign className="h-4 w-4" />} label="Comissão" value={launch.commission || '—'} />
                  <InfoRow icon={<Calendar className="h-4 w-4" />} label="Validade da Tabela" value={formatDate((launch as any).table_expires_at)} />
                </div>
              </CardContent>
            </Card>

            {/* Estrutura */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2"><Building2 className="h-5 w-5" /> Estrutura</CardTitle>
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
            {/* Coordenador de Vendas */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2"><User className="h-5 w-5" /> Coordenador de Vendas</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-3">
                <p className="font-medium text-foreground">{launch.coordinator_name || '—'}</p>
                {launch.coordinator_phone && (
                  <a href={whatsLink(launch.coordinator_phone)} target="_blank" rel="noopener noreferrer">
                    <Button className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white">
                      <MessageCircle className="h-4 w-4" /> WhatsApp 1
                    </Button>
                  </a>
                )}
                {launch.coordinator_phone2 && (
                  <a href={whatsLink(launch.coordinator_phone2)} target="_blank" rel="noopener noreferrer">
                    <Button className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white mt-2">
                      <MessageCircle className="h-4 w-4" /> WhatsApp 2
                    </Button>
                  </a>
                )}
              </CardContent>
            </Card>

            {/* Downloads */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2"><Download className="h-5 w-5" /> Downloads</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {launch.book_url && (
                  <a href={launch.book_url} target="_blank" rel="noopener noreferrer">
                    <Button className="w-full gap-2" variant="default"><FileText className="h-4 w-4" /> Book</Button>
                  </a>
                )}
                {launch.table_url && (
                  <a href={launch.table_url} target="_blank" rel="noopener noreferrer">
                    <Button className="w-full gap-2 mt-2" variant="default"><FileText className="h-4 w-4" /> Tabela</Button>
                  </a>
                )}
                {(launch.drive_link || launch.drive_url) && (
                  <a href={driveHref} target="_blank" rel="noopener noreferrer">
                    <Button className="w-full gap-2 mt-2" variant="default"><FolderOpen className="h-4 w-4" /> Drive</Button>
                  </a>
                )}
                {!launch.book_url && !launch.table_url && !launch.drive_link && !launch.drive_url && (
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
