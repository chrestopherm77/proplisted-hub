import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const NewLaunch = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [zone, setZone] = useState('');
  const [launchDate, setLaunchDate] = useState<Date>();
  const [deliveryDate, setDeliveryDate] = useState<Date>();
  const [priceFrom, setPriceFrom] = useState('');
  const [commission, setCommission] = useState('');
  const [floors, setFloors] = useState('');
  const [totalUnits, setTotalUnits] = useState('');
  const [associative, setAssociative] = useState('');
  const [coordinatorName, setCoordinatorName] = useState('');
  const [coordinatorPhone, setCoordinatorPhone] = useState('');

  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bookFile, setBookFile] = useState<File | null>(null);
  const [tableFile, setTableFile] = useState<File | null>(null);
  const [driveFile, setDriveFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, '');
    if (!v) { setPriceFrom(''); return; }
    const num = parseInt(v, 10);
    const formatted = (num / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    setPriceFrom(`R$ ${formatted}`);
  };

  const uploadFile = async (file: File, path: string): Promise<string | null> => {
    const { error } = await supabase.storage.from('launches').upload(path, file, { upsert: true });
    if (error) {
      console.error('Upload error:', error);
      return null;
    }
    const { data: urlData } = supabase.storage.from('launches').getPublicUrl(path);
    return urlData.publicUrl;
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!name.trim() || !city.trim()) {
      toast({ title: 'Preencha o nome e a cidade', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const launchId = crypto.randomUUID();

      let banner_url: string | null = null;
      let book_url: string | null = null;
      let table_url: string | null = null;
      let drive_url: string | null = null;

      if (bannerFile) {
        const ext = bannerFile.name.split('.').pop();
        banner_url = await uploadFile(bannerFile, `banners/${launchId}.${ext}`);
      }
      if (bookFile) {
        book_url = await uploadFile(bookFile, `docs/${launchId}/book.pdf`);
      }
      if (tableFile) {
        table_url = await uploadFile(tableFile, `docs/${launchId}/tabela.pdf`);
      }
      if (driveFile) {
        drive_url = await uploadFile(driveFile, `docs/${launchId}/drive.pdf`);
      }

      const priceRaw = priceFrom.replace(/\D/g, '') || null;

      const { error } = await supabase.from('launches').insert({
        id: launchId,
        user_id: user.id,
        name: name.trim(),
        state: state || null,
        city: city.trim(),
        neighborhood: neighborhood || null,
        zone: zone || null,
        launch_date: launchDate ? format(launchDate, 'yyyy-MM-dd') : null,
        delivery_date: deliveryDate ? format(deliveryDate, 'yyyy-MM-dd') : null,
        price_from: priceRaw,
        commission: commission || null,
        floors: floors || null,
        total_units: totalUnits || null,
        associative: associative || null,
        book_url,
        table_url,
        drive_url,
        coordinator_name: coordinatorName || null,
        coordinator_phone: coordinatorPhone || null,
        banner_url,
      });

      if (error) throw error;

      toast({ title: 'Lançamento publicado com sucesso!' });
      navigate('/launches');
    } catch (err: any) {
      toast({ title: 'Erro ao publicar', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate('/launches')} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>

        <h1 className="text-2xl font-bold text-foreground">Novo Lançamento</h1>

        {/* Banner */}
        <Card>
          <CardHeader><CardTitle>Imagem de Banner</CardTitle></CardHeader>
          <CardContent>
            {bannerPreview && (
              <div className="mb-4 rounded-lg overflow-hidden aspect-[16/7] bg-muted">
                <img src={bannerPreview} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
            <Label htmlFor="banner" className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-md border border-input bg-background hover:bg-accent text-sm">
              <Upload className="h-4 w-4" /> Selecionar imagem
            </Label>
            <input id="banner" type="file" accept="image/*" className="hidden" onChange={handleBannerChange} />
          </CardContent>
        </Card>

        {/* Nome */}
        <Card>
          <CardHeader><CardTitle>Nome do Empreendimento</CardTitle></CardHeader>
          <CardContent>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Magnólia Jardim Botânico" />
          </CardContent>
        </Card>

        {/* Informações Gerais */}
        <Card>
          <CardHeader><CardTitle>Informações Gerais</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Estado</Label>
              <Input value={state} onChange={e => setState(e.target.value)} placeholder="PR" />
            </div>
            <div>
              <Label>Cidade</Label>
              <Input value={city} onChange={e => setCity(e.target.value)} placeholder="Curitiba" />
            </div>
            <div>
              <Label>Bairro</Label>
              <Input value={neighborhood} onChange={e => setNeighborhood(e.target.value)} />
            </div>
            <div>
              <Label>Zona</Label>
              <Input value={zone} onChange={e => setZone(e.target.value)} placeholder="Sul" />
            </div>
            <div>
              <Label>Data de Lançamento</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !launchDate && 'text-muted-foreground')}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {launchDate ? format(launchDate, 'dd/MM/yyyy') : 'Selecionar'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={launchDate} onSelect={setLaunchDate} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>Data de Entrega</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !deliveryDate && 'text-muted-foreground')}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {deliveryDate ? format(deliveryDate, 'dd/MM/yyyy') : 'Selecionar'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={deliveryDate} onSelect={setDeliveryDate} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>

        {/* Valores */}
        <Card>
          <CardHeader><CardTitle>Valores</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>A partir de</Label>
              <Input value={priceFrom} onChange={handlePriceChange} placeholder="R$ 0,00" />
            </div>
            <div>
              <Label>Comissão</Label>
              <Input value={commission} onChange={e => setCommission(e.target.value)} placeholder="Ex: 5%" />
            </div>
          </CardContent>
        </Card>

        {/* Estrutura */}
        <Card>
          <CardHeader><CardTitle>Estrutura</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Andares</Label>
              <Input value={floors} onChange={e => setFloors(e.target.value)} />
            </div>
            <div>
              <Label>Total de Unidades</Label>
              <Input value={totalUnits} onChange={e => setTotalUnits(e.target.value)} />
            </div>
            <div>
              <Label>Associativo</Label>
              <Input value={associative} onChange={e => setAssociative(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* PDFs */}
        <Card>
          <CardHeader><CardTitle>Arquivos PDF</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Book</Label>
              <Input type="file" accept=".pdf" onChange={e => setBookFile(e.target.files?.[0] || null)} />
            </div>
            <div>
              <Label>Tabela</Label>
              <Input type="file" accept=".pdf" onChange={e => setTableFile(e.target.files?.[0] || null)} />
            </div>
            <div>
              <Label>Drive</Label>
              <Input type="file" accept=".pdf" onChange={e => setDriveFile(e.target.files?.[0] || null)} />
            </div>
          </CardContent>
        </Card>

        {/* Coordenador */}
        <Card>
          <CardHeader><CardTitle>Coordenador</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Nome</Label>
              <Input value={coordinatorName} onChange={e => setCoordinatorName(e.target.value)} />
            </div>
            <div>
              <Label>Telefone (WhatsApp)</Label>
              <Input value={coordinatorPhone} onChange={e => setCoordinatorPhone(e.target.value)} placeholder="(41) 99999-9999" />
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSubmit} disabled={saving} className="w-full gap-2" size="lg">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Publicar Lançamento
        </Button>
      </div>
    </Layout>
  );
};

export default NewLaunch;
