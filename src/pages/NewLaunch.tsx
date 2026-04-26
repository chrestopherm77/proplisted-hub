import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2, Upload, Link as LinkIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIBGELocation } from '@/hooks/useIBGELocation';

const NewLaunch = () => {
  const { user, loading: authLoading, canPublishLaunches, permissionsLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { id: editId } = useParams<{ id: string }>();
  const isEditMode = !!editId;
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [loadingLaunch, setLoadingLaunch] = useState(isEditMode);
  const { states: ibgeStates, cities: ibgeCities, fetchCities, clearCities } = useIBGELocation();

  useEffect(() => {
    if (authLoading || permissionsLoading) return;
    if (!user) { navigate('/auth'); return; }
    if (!canPublishLaunches) { navigate('/launches'); return; }
  }, [user, authLoading, permissionsLoading, canPublishLaunches, navigate]);

  const [name, setName] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [zone, setZone] = useState('');
  const [launchDate, setLaunchDate] = useState<Date>();
  const [deliveryDate, setDeliveryDate] = useState<Date>();
  const [priceFrom, setPriceFrom] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [commission, setCommission] = useState('');
  const [floors, setFloors] = useState('');
  const [totalUnits, setTotalUnits] = useState('');
  const [associative, setAssociative] = useState('');
  const [coordinatorName, setCoordinatorName] = useState('');
  const [coordinatorPhone, setCoordinatorPhone] = useState('');
  const [coordinatorPhone2, setCoordinatorPhone2] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [sizeM2Min, setSizeM2Min] = useState('');
  const [sizeM2Max, setSizeM2Max] = useState('');
  const [launchStatus, setLaunchStatus] = useState('');
  const [tableExpiresAt, setTableExpiresAt] = useState<Date>();

  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Book & Table: PDF or Link
  const [bookMode, setBookMode] = useState<'pdf' | 'link'>('pdf');
  const [bookFile, setBookFile] = useState<File | null>(null);
  const [bookLink, setBookLink] = useState('');
  const [tableMode, setTableMode] = useState<'pdf' | 'link'>('pdf');
  const [tableFile, setTableFile] = useState<File | null>(null);
  const [tableLink, setTableLink] = useState('');
  // Drive: Link only
  const [driveLink, setDriveLink] = useState('');

  // URLs já salvas (modo edição) — preservadas se o usuário não trocar o arquivo
  const [existingBannerUrl, setExistingBannerUrl] = useState<string | null>(null);
  const [existingLogoUrl, setExistingLogoUrl] = useState<string | null>(null);
  const [existingBookUrl, setExistingBookUrl] = useState<string | null>(null);
  const [existingTableUrl, setExistingTableUrl] = useState<string | null>(null);

  // Carrega lançamento em modo edição
  useEffect(() => {
    if (!isEditMode || !editId || !user) return;
    (async () => {
      const { data, error } = await supabase.from('launches').select('*').eq('id', editId).single();
      if (error || !data) {
        toast({ title: 'Erro ao carregar lançamento', description: error?.message, variant: 'destructive' });
        navigate('/launches');
        return;
      }
      // Permissão: dono ou admin
      if (data.user_id !== user.id && !isAdmin) {
        toast({ title: 'Sem permissão para editar este lançamento', variant: 'destructive' });
        navigate('/launches');
        return;
      }
      setName(data.name || '');
      setState(data.state || '');
      if (data.state) await fetchCities(data.state);
      setCity(data.city || '');
      setNeighborhood(data.neighborhood || '');
      setZone(data.zone || '');
      setLaunchDate(data.launch_date ? new Date(data.launch_date + 'T00:00:00') : undefined);
      setDeliveryDate(data.delivery_date ? new Date(data.delivery_date + 'T00:00:00') : undefined);
      const fmtMoney = (raw: string | null) => {
        if (!raw) return '';
        const num = parseInt(raw, 10);
        if (isNaN(num)) return '';
        return `R$ ${(num / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      };
      setPriceFrom(fmtMoney(data.price_from));
      setPriceMax(fmtMoney(data.price_max));
      setCommission(data.commission || '');
      setFloors(data.floors || '');
      setTotalUnits(data.total_units || '');
      setAssociative(data.associative || '');
      setCoordinatorName(data.coordinator_name || '');
      setCoordinatorPhone(data.coordinator_phone || '');
      setCoordinatorPhone2(data.coordinator_phone2 || '');
      setPropertyType(data.property_type || '');
      setSizeM2Min(data.size_m2_min || '');
      setSizeM2Max(data.size_m2_max || '');
      setLaunchStatus(data.status || '');
      const tea = (data as any).table_expires_at;
      setTableExpiresAt(tea ? new Date(tea + 'T00:00:00') : undefined);
      setExistingBannerUrl(data.banner_url || null);
      setExistingLogoUrl(data.logo_url || null);
      setBannerPreview(data.banner_url || null);
      setLogoPreview(data.logo_url || null);
      setExistingBookUrl(data.book_url || null);
      setExistingTableUrl(data.table_url || null);
      // Heurística: se a URL existente NÃO contém o storage path, é link externo
      if (data.book_url) {
        setBookMode(data.book_url.includes('/storage/') ? 'pdf' : 'link');
        if (!data.book_url.includes('/storage/')) setBookLink(data.book_url);
      }
      if (data.table_url) {
        setTableMode(data.table_url.includes('/storage/') ? 'pdf' : 'link');
        if (!data.table_url.includes('/storage/')) setTableLink(data.table_url);
      }
      setDriveLink(data.drive_link || data.drive_url || '');
      setLoadingLaunch(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, editId, user, isAdmin]);

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setBannerFile(file); setBannerPreview(URL.createObjectURL(file)); }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setLogoFile(file); setLogoPreview(URL.createObjectURL(file)); }
  };

  const handlePriceChange = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, '');
    if (!v) { setter(''); return; }
    const num = parseInt(v, 10);
    setter(`R$ ${(num / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
  };

  const handleStateChange = (uf: string) => {
    setState(uf);
    setCity('');
    if (uf) fetchCities(uf);
    else clearCities();
  };

  const uploadFile = async (file: File, path: string): Promise<string | null> => {
    const { error } = await supabase.storage.from('launches').upload(path, file, { upsert: true });
    if (error) { console.error('Upload error:', error); return null; }
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
      const launchId = isEditMode && editId ? editId : crypto.randomUUID();

      // Em modo edição, parte das URLs já existe; só substituímos se houver arquivo novo
      let banner_url: string | null = isEditMode ? existingBannerUrl : null;
      let logo_url: string | null = isEditMode ? existingLogoUrl : null;
      let book_url: string | null = isEditMode ? existingBookUrl : null;
      let table_url: string | null = isEditMode ? existingTableUrl : null;

      if (bannerFile) {
        const ext = bannerFile.name.split('.').pop();
        banner_url = await uploadFile(bannerFile, `banners/${launchId}.${ext}`);
      }
      if (logoFile) {
        const ext = logoFile.name.split('.').pop();
        logo_url = await uploadFile(logoFile, `logos/${launchId}.${ext}`);
      }

      if (bookMode === 'pdf' && bookFile) {
        book_url = await uploadFile(bookFile, `docs/${launchId}/book.pdf`);
      } else if (bookMode === 'link') {
        book_url = bookLink.trim() || null;
      }

      if (tableMode === 'pdf' && tableFile) {
        table_url = await uploadFile(tableFile, `docs/${launchId}/tabela.pdf`);
      } else if (tableMode === 'link') {
        table_url = tableLink.trim() || null;
      }

      const priceFromRaw = priceFrom.replace(/\D/g, '') || null;
      const priceMaxRaw = priceMax.replace(/\D/g, '') || null;
      const zoneValue = zone && zone !== '__none__' ? zone : null;

      const payload = {
        name: name.trim(),
        state: state || null,
        city: city.trim(),
        neighborhood: neighborhood || null,
        zone: zoneValue,
        launch_date: launchDate ? format(launchDate, 'yyyy-MM-dd') : null,
        delivery_date: deliveryDate ? format(deliveryDate, 'yyyy-MM-dd') : null,
        price_from: priceFromRaw,
        price_max: priceMaxRaw,
        commission: commission || null,
        floors: floors || null,
        total_units: totalUnits || null,
        associative: associative || null,
        book_url,
        table_url,
        drive_link: driveLink.trim() || null,
        coordinator_name: coordinatorName || null,
        coordinator_phone: coordinatorPhone || null,
        coordinator_phone2: coordinatorPhone2 || null,
        banner_url,
        logo_url,
        property_type: propertyType || null,
        size_m2_min: sizeM2Min || null,
        size_m2_max: sizeM2Max || null,
        status: launchStatus || null,
        table_expires_at: tableExpiresAt ? format(tableExpiresAt, 'yyyy-MM-dd') : null,
      };

      if (isEditMode && editId) {
        const { error } = await supabase.from('launches').update(payload as any).eq('id', editId);
        if (error) throw error;
        toast({ title: 'Lançamento atualizado com sucesso!' });
        navigate(`/launches/${editId}`);
        return;
      }

      const { error } = await supabase.from('launches').insert({
        id: launchId,
        user_id: user.id,
        drive_url: null,
        ...payload,
      } as any);

      if (error) throw error;

      // Fire-and-forget: notify users with matching launch alerts
      try {
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        fetch(`https://${projectId}.supabase.co/functions/v1/notify-launch-alert-match`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}` },
          body: JSON.stringify({
            launchId,
            state: state || null,
            city: city.trim(),
            zone: zoneValue,
            property_type: propertyType || null,
            status: launchStatus || null,
            price_from: priceFromRaw,
            price_max: priceMaxRaw,
            name: name.trim(),
            creatorUserId: user.id,
          }),
        }).catch(err => console.error('notify-launch-alert-match error:', err));
      } catch {}

      toast({ title: 'Lançamento publicado com sucesso!' });
      navigate('/launches');
    } catch (err: any) {
      toast({ title: isEditMode ? 'Erro ao salvar' : 'Erro ao publicar', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (isEditMode && loadingLaunch) {
    return <Layout><div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></Layout>;
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate(isEditMode && editId ? `/launches/${editId}` : '/launches')} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>

        <h1 className="text-2xl font-bold text-foreground">{isEditMode ? 'Editar Lançamento' : 'Novo Lançamento'}</h1>

        {/* Banner & Logo */}
        <Card>
          <CardHeader><CardTitle>Imagens</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-1 block">Banner</Label>
              {bannerPreview && (
                <div className="mb-2 rounded-lg overflow-hidden aspect-[16/7] bg-muted">
                  <img src={bannerPreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
              <Label htmlFor="banner" className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-md border border-input bg-background hover:bg-accent text-sm">
                <Upload className="h-4 w-4" /> Selecionar banner
              </Label>
              <input id="banner" type="file" accept="image/*" className="hidden" onChange={handleBannerChange} />
            </div>
            <div>
              <Label className="text-sm font-medium mb-1 block">Logo do Empreendimento</Label>
              {logoPreview && (
                <div className="mb-2 w-20 h-20 rounded-lg overflow-hidden bg-muted">
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                </div>
              )}
              <Label htmlFor="logo" className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-md border border-input bg-background hover:bg-accent text-sm">
                <Upload className="h-4 w-4" /> Selecionar logo
              </Label>
              <input id="logo" type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
            </div>
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
              <Select value={state} onValueChange={handleStateChange}>
                <SelectTrigger><SelectValue placeholder="Selecionar estado" /></SelectTrigger>
                <SelectContent>
                  {ibgeStates.map(s => <SelectItem key={s.sigla} value={s.sigla}>{s.sigla} - {s.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Cidade</Label>
              <Select value={city} onValueChange={setCity} disabled={!state}>
                <SelectTrigger><SelectValue placeholder="Selecionar cidade" /></SelectTrigger>
                <SelectContent>
                  {ibgeCities.map(c => <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Bairro</Label>
              <Input value={neighborhood} onChange={e => setNeighborhood(e.target.value)} />
            </div>
            <div>
              <Label>Zona</Label>
              <Select value={zone} onValueChange={setZone}>
                <SelectTrigger><SelectValue placeholder="Selecionar zona" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Norte">Norte</SelectItem>
                  <SelectItem value="Sul">Sul</SelectItem>
                  <SelectItem value="Leste">Leste</SelectItem>
                  <SelectItem value="Oeste">Oeste</SelectItem>
                  <SelectItem value="Centro">Centro</SelectItem>
                  <SelectItem value="Rural">Rural</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={launchStatus} onValueChange={setLaunchStatus}>
                <SelectTrigger><SelectValue placeholder="Selecionar status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Lançamento">Lançamento</SelectItem>
                  <SelectItem value="Em construção">Em construção</SelectItem>
                  <SelectItem value="Entregue">Entregue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={propertyType} onValueChange={setPropertyType}>
                <SelectTrigger><SelectValue placeholder="Selecionar tipo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Casa">Casa</SelectItem>
                  <SelectItem value="Apartamento">Apartamento</SelectItem>
                  <SelectItem value="Terreno">Terreno</SelectItem>
                </SelectContent>
              </Select>
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
              <Label>A partir de (R$)</Label>
              <Input value={priceFrom} onChange={handlePriceChange(setPriceFrom)} placeholder="R$ 0,00" />
            </div>
            <div>
              <Label>Até (R$)</Label>
              <Input value={priceMax} onChange={handlePriceChange(setPriceMax)} placeholder="R$ 0,00" />
            </div>
            <div>
              <Label>Comissão</Label>
              <Input value={commission} onChange={e => setCommission(e.target.value)} placeholder="Ex: 5%" />
            </div>
            <div>
              <Label>Validade da Tabela/Valores</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !tableExpiresAt && 'text-muted-foreground')}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {tableExpiresAt ? format(tableExpiresAt, 'dd/MM/yyyy') : 'Selecionar data'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={tableExpiresAt} onSelect={setTableExpiresAt} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
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
            <div>
              <Label>Tamanho mín (m²)</Label>
              <Input type="number" value={sizeM2Min} onChange={e => setSizeM2Min(e.target.value)} placeholder="Ex: 45" />
            </div>
            <div>
              <Label>Tamanho máx (m²)</Label>
              <Input type="number" value={sizeM2Max} onChange={e => setSizeM2Max(e.target.value)} placeholder="Ex: 120" />
            </div>
          </CardContent>
        </Card>

        {/* Arquivos */}
        <Card>
          <CardHeader><CardTitle>Arquivos e Links</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {/* Book */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Label>Book</Label>
                <div className="flex gap-1">
                  <Button type="button" size="sm" variant={bookMode === 'pdf' ? 'default' : 'outline'} onClick={() => setBookMode('pdf')} className="h-7 text-xs">PDF</Button>
                  <Button type="button" size="sm" variant={bookMode === 'link' ? 'default' : 'outline'} onClick={() => setBookMode('link')} className="h-7 text-xs"><LinkIcon className="h-3 w-3 mr-1" />Link</Button>
                </div>
              </div>
              {bookMode === 'pdf' ? (
                <Input type="file" accept=".pdf" onChange={e => setBookFile(e.target.files?.[0] || null)} />
              ) : (
                <Input value={bookLink} onChange={e => setBookLink(e.target.value)} placeholder="https://..." />
              )}
            </div>
            {/* Tabela */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Label>Tabela</Label>
                <div className="flex gap-1">
                  <Button type="button" size="sm" variant={tableMode === 'pdf' ? 'default' : 'outline'} onClick={() => setTableMode('pdf')} className="h-7 text-xs">PDF</Button>
                  <Button type="button" size="sm" variant={tableMode === 'link' ? 'default' : 'outline'} onClick={() => setTableMode('link')} className="h-7 text-xs"><LinkIcon className="h-3 w-3 mr-1" />Link</Button>
                </div>
              </div>
              {tableMode === 'pdf' ? (
                <Input type="file" accept=".pdf" onChange={e => setTableFile(e.target.files?.[0] || null)} />
              ) : (
                <Input value={tableLink} onChange={e => setTableLink(e.target.value)} placeholder="https://..." />
              )}
            </div>
            {/* Drive */}
            <div>
              <Label>Drive (Link)</Label>
              <Input value={driveLink} onChange={e => setDriveLink(e.target.value)} placeholder="https://drive.google.com/..." />
            </div>
          </CardContent>
        </Card>

        {/* Coordenador de Vendas */}
        <Card>
          <CardHeader><CardTitle>Coordenador de Vendas</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Nome</Label>
              <Input value={coordinatorName} onChange={e => setCoordinatorName(e.target.value)} />
            </div>
            <div>
              <Label>Telefone 1 (WhatsApp)</Label>
              <Input value={coordinatorPhone} onChange={e => setCoordinatorPhone(e.target.value)} placeholder="(41) 99999-9999" />
            </div>
            <div>
              <Label>Telefone 2 (WhatsApp)</Label>
              <Input value={coordinatorPhone2} onChange={e => setCoordinatorPhone2(e.target.value)} placeholder="(41) 99999-9999" />
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
