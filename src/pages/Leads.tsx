import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Coins, Filter, Loader2, Bell, Trash2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LeadDetailsModal } from '@/components/marketplace/LeadDetailsModal';

interface Lead {
  id: string;
  description: string;
  price: number;
  purchase_count: number;
  max_purchases: number;
  is_active: boolean;
  is_promotion?: boolean;
  is_exhausted?: boolean;
  form_data?: any;
  created_at?: string;
}

interface ParsedDescription {
  interest: string;
  region: string;
  characteristics: string;
}

// Value range definitions for buy/sell/build
const valueRanges = [
  { value: 'all', label: 'Todos os valores', min: 0, max: Infinity },
  { value: 'up_to_100k', label: 'Até R$ 100.000', min: 0, max: 100000 },
  { value: '100k_to_250k', label: 'R$ 100.000 - R$ 250.000', min: 100000, max: 250000 },
  { value: '250k_to_500k', label: 'R$ 250.000 - R$ 500.000', min: 250000, max: 500000 },
  { value: '500k_to_1m', label: 'R$ 500.000 - R$ 1.000.000', min: 500000, max: 1000000 },
  { value: 'above_1m', label: 'Acima de R$ 1.000.000', min: 1000000, max: Infinity },
];

// Value range definitions for rent
const rentValueRanges = [
  { value: 'all', label: 'Todos os valores', min: 0, max: Infinity },
  { value: 'up_to_1k', label: 'Até R$ 1.000', min: 0, max: 1000 },
  { value: '1k_to_3k', label: 'R$ 1.000 - R$ 3.000', min: 1000, max: 3000 },
  { value: '3k_to_5k', label: 'R$ 3.000 - R$ 5.000', min: 3000, max: 5000 },
  { value: '5k_to_9k', label: 'R$ 5.000 - R$ 9.000', min: 5000, max: 9000 },
  { value: 'above_10k', label: 'Acima de R$ 10.000', min: 10000, max: Infinity },
];

// Objective labels in Portuguese
const objectiveLabels: Record<string, string> = {
  'SELL': 'Vender',
  'BUY': 'Comprar',
  'BUILD': 'Construir',
  'RENT': 'Alugar',
};

// Property condition (Novo / Usado / Ambos)
const propertyConditionLabels: Record<string, string> = {
  'NEW': 'Novo',
  'USED': 'Usado',
  'BOTH': 'Novo ou Usado',
};

// Normalize form_data that might be string or object
function normalizeFormData(raw: any): any {
  if (!raw) return null;
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch { return null; }
  }
  if (typeof raw === 'object') return raw;
  return null;
}

function extractUFFromFormData(formData: any): string {
  if (!formData) return '';
  const intention = formData?.intention;
  const intentionData = formData?.[intention?.toLowerCase?.()] || formData?.[intention];
  if (intentionData?.uf) return intentionData.uf.toUpperCase();
  const region = formData?.region || '';
  return extractUF(region);
}

function extractUF(region: string | undefined): string {
  if (!region) return '';
  const upper = region.toUpperCase();
  const match2 = upper.match(/\/([A-Z]{2})\b/);
  if (match2) return match2[1];
  const match = upper.match(/\b([A-Z]{2})$/);
  return match ? match[1] : '';
}

function extractCityFromFormData(formData: any): string {
  if (!formData) return '';
  const intention = formData?.intention;
  const intentionData = formData?.[intention?.toLowerCase?.()] || formData?.[intention];
  if (intentionData?.city) return intentionData.city.trim();
  const region = formData?.region || '';
  return extractCityFromRegion(region);
}

function extractCityFromRegion(region: string | undefined): string {
  if (!region) return '';
  const dashIndex = region.lastIndexOf(' - ');
  if (dashIndex >= 0) {
    const afterDash = region.substring(dashIndex + 3);
    const slashIndex = afterDash.indexOf('/');
    const city = slashIndex >= 0 ? afterDash.substring(0, slashIndex).trim() : afterDash.trim();
    if (city) return city;
  }
  const slashIdx = region.indexOf('/');
  if (slashIdx > 0) return region.substring(0, slashIdx).trim();
  return '';
}

function extractBairro(formData: any): string {
  if (!formData) return '';
  const intention = formData?.intention;
  const intentionData = formData?.[intention?.toLowerCase?.()] || formData?.[intention];
  return intentionData?.neighborhood || '';
}

function extractZone(formData: any): string {
  if (!formData) return '';
  const intention = formData?.intention;
  const intentionData = formData?.[intention?.toLowerCase?.()] || formData?.[intention];
  return intentionData?.zone || '';
}

function extractPropertyCondition(formData: any): string {
  if (!formData) return '';
  const buy = formData?.buy || formData?.BUY;
  if (!buy) return '';
  const raw = String(buy.propertyCondition || '').toUpperCase();
  return ['NEW', 'USED', 'BOTH'].includes(raw) ? raw : '';
}

function extractObjective(formData: any): string {
  const raw = String(formData?.intention || '').toUpperCase();
  if (['SELL', 'BUY', 'BUILD', 'RENT'].includes(raw)) return raw;
  return '';
}

function extractValue(formData: any): number | null {
  const intention = formData?.intention;
  let valueStr = '';
  switch(intention) {
    case 'SELL': valueStr = formData?.sell?.expectedValue; break;
    case 'BUY': valueStr = formData?.buy?.budgetMax || formData?.buy?.budget; break;
    case 'BUILD': valueStr = formData?.build?.budget; break;
    case 'RENT': valueStr = formData?.rent?.maxRent; break;
  }
  if (!valueStr) return null;
  const numbers = String(valueStr).replace(/\D/g, '');
  return numbers ? parseInt(numbers, 10) / 100 : null;
}

const parseDescription = (description: string): ParsedDescription => {
  const lines = description.split('\n').map(line => line.trim());
  let interest = '';
  let region = '';
  let characteristics = '';
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    if (lowerLine.startsWith('interesse:') || lowerLine.startsWith('interest:')) {
      interest = line.split(':').slice(1).join(':').trim();
    } else if (lowerLine.startsWith('região:') || lowerLine.startsWith('region:') || lowerLine.startsWith('regiao:')) {
      region = line.split(':').slice(1).join(':').trim();
    } else if (lowerLine.startsWith('características:') || lowerLine.startsWith('caracteristicas:') || lowerLine.startsWith('characteristics:')) {
      characteristics = line.split(':').slice(1).join(':').trim();
    }
  }
  if (!interest && !region && !characteristics) characteristics = description;
  return { interest, region, characteristics };
};

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState<string[]>([]);
  const [purchasedLeadIds, setPurchasedLeadIds] = useState<string[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creditBalance, setCreditBalance] = useState<number>(0);
  const [buyingLeadId, setBuyingLeadId] = useState<string | null>(null);
  
  // Alert states
  const [alerts, setAlerts] = useState<any[]>([]);
  const [showAlerts, setShowAlerts] = useState(false);
  const [savingAlert, setSavingAlert] = useState(false);
  
  // Temporary filter states
  const [tempUF, setTempUF] = useState<string>('all');
  const [tempCity, setTempCity] = useState<string>('all');
  const [tempZone, setTempZone] = useState<string>('all');
  const [tempCondition, setTempCondition] = useState<string>('all');
  const [tempObjective, setTempObjective] = useState<string>('all');
  const [tempValueRange, setTempValueRange] = useState<string>('all');
  
  // Applied filter states
  const [filterUF, setFilterUF] = useState<string>('all');
  const [filterCity, setFilterCity] = useState<string>('all');
  const [filterZone, setFilterZone] = useState<string>('all');
  const [filterCondition, setFilterCondition] = useState<string>('all');
  const [filterObjective, setFilterObjective] = useState<string>('all');
  const [filterValueRange, setFilterValueRange] = useState<string>('all');
  
  const { user, loading: authLoading, isAdmin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const leadIdFromUrl = searchParams.get('leadId');
    if (leadIdFromUrl && leads.length > 0) {
      const targetLead = leads.find(l => l.id === leadIdFromUrl);
      if (targetLead) {
        setSelectedLead(targetLead);
        setDialogOpen(true);
        setSearchParams({});
      }
    }
  }, [leads, searchParams, setSearchParams]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/auth'); return; }
    fetchLeads();
    fetchCart();
    fetchPurchases();
    fetchCreditBalance();
    fetchAlerts();
  }, [user, authLoading]);

  const fetchAlerts = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('lead_alerts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    setAlerts(data || []);
  };

  const saveAlert = async () => {
    if (!user) return;
    if (tempUF === 'all' || tempCity === 'all') {
      toast({ title: 'Estado e Cidade são obrigatórios para salvar um alerta', variant: 'destructive' });
      return;
    }
    setSavingAlert(true);
    try {
      const filters: Record<string, string> = { state: tempUF, city: tempCity };
      if (tempZone !== 'all') filters.zone = tempZone;
      if (tempCondition !== 'all') filters.condition = tempCondition;
      if (tempObjective !== 'all') filters.objective = tempObjective;
      if (tempValueRange !== 'all') filters.valueRange = tempValueRange;

      const { error } = await supabase.from('lead_alerts').insert({
        user_id: user.id,
        filters,
      });
      if (error) throw error;
      toast({ title: '✅ Alerta salvo com sucesso!' });
      fetchAlerts();
    } catch (error: any) {
      toast({ title: 'Erro ao salvar alerta', description: error.message, variant: 'destructive' });
    } finally {
      setSavingAlert(false);
    }
  };

  const deleteAlert = async (alertId: string) => {
    try {
      const { error } = await supabase.from('lead_alerts').delete().eq('id', alertId);
      if (error) throw error;
      setAlerts(prev => prev.filter(a => a.id !== alertId));
      toast({ title: 'Alerta removido' });
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  const fetchCreditBalance = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('credit_balance')
      .eq('id', user.id)
      .single();
    if (data) setCreditBalance(data.credit_balance || 0);
  };

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('id, description, price, purchase_count, max_purchases, is_active, is_promotion, is_exhausted, form_data, created_at')
        .or('is_active.eq.true,is_exhausted.eq.true')
        .order('is_promotion', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: true });
      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast({ title: 'Erro ao carregar leads', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchases = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('purchases')
      .select('lead_id')
      .eq('user_id', user.id)
      .eq('status', 'PAID');
    if (!error && data) setPurchasedLeadIds(data.map(p => p.lead_id));
  };

  const fetchCart = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('shopping_cart')
      .select('lead_id')
      .eq('user_id', user.id);
    if (!error) setCartItems(data?.map((item) => item.lead_id) || []);
  };

  const buyWithCredits = async (leadId: string) => {
    if (!user) return;
    setBuyingLeadId(leadId);
    try {
      const { data, error } = await supabase.functions.invoke('purchase-lead-with-credits', {
        body: { leadId },
      });
      if (error) throw error;
      if (!data?.ok) {
        if (data?.needed) {
          toast({
            title: 'Créditos insuficientes',
            description: `Você precisa de ${data.needed} créditos. Seu saldo: ${data.balance}. Recarregue seus créditos!`,
            variant: 'destructive',
          });
          navigate('/comprar-creditos');
          return;
        }
        toast({ title: data?.error || 'Erro ao comprar lead', variant: 'destructive' });
        return;
      }
      toast({ title: '✅ Lead comprado com sucesso!' });
      setCreditBalance(data.new_balance);
      setPurchasedLeadIds(prev => [...prev, leadId]);
      setCartItems(prev => prev.filter(id => id !== leadId));
      fetchLeads();
      setDialogOpen(false);
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } finally {
      setBuyingLeadId(null);
    }
  };

  // Extract unique filter options
  const filterOptions = useMemo(() => {
    const ufs = new Set<string>();
    const cities = new Set<string>();
    const zones = new Set<string>();
    const objectives = new Set<string>();
    leads.forEach(lead => {
      const formData = normalizeFormData(lead.form_data);
      const uf = extractUFFromFormData(formData);
      const city = extractCityFromFormData(formData);
      const zone = extractZone(formData);
      const objective = extractObjective(formData);
      if (uf) ufs.add(uf);
      if (city) cities.add(city);
      if (zone) zones.add(zone);
      if (objective) objectives.add(objective);
    });
    return {
      uniqueUFs: Array.from(ufs).sort(),
      uniqueCities: Array.from(cities).sort(),
      uniqueZones: Array.from(zones).sort(),
      uniqueObjectives: Array.from(objectives).sort(),
    };
  }, [leads]);

  const filteredCities = useMemo(() => {
    if (tempUF === 'all') return filterOptions.uniqueCities;
    const citiesForUF = new Set<string>();
    leads.forEach(lead => {
      const formData = normalizeFormData(lead.form_data);
      const uf = extractUFFromFormData(formData);
      const city = extractCityFromFormData(formData);
      if (uf === tempUF && city) citiesForUF.add(city);
    });
    return Array.from(citiesForUF).sort();
  }, [leads, tempUF, filterOptions.uniqueCities]);

  const applyFilters = () => {
    setFilterUF(tempUF);
    setFilterCity(tempCity);
    setFilterZone(tempZone);
    setFilterCondition(tempCondition);
    setFilterObjective(tempObjective);
    setFilterValueRange(tempValueRange);
  };

  const clearFilters = () => {
    setTempUF('all'); setTempCity('all'); setTempZone('all'); setTempCondition('all');
    setTempObjective('all'); setTempValueRange('all');
    setFilterUF('all'); setFilterCity('all'); setFilterZone('all'); setFilterCondition('all');
    setFilterObjective('all'); setFilterValueRange('all');
  };

  const handleUFChange = (value: string) => { setTempUF(value); setTempCity('all'); };
  const handleObjectiveChange = (value: string) => { setTempObjective(value); setTempValueRange('all'); };

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const formData = normalizeFormData(lead.form_data);
      const leadUF = extractUFFromFormData(formData);
      const leadCity = extractCityFromFormData(formData);
      const leadZone = extractZone(formData);
      const leadCondition = extractPropertyCondition(formData);
      const leadObjective = extractObjective(formData);
      const leadValue = extractValue(formData);
      if (filterUF !== 'all' && leadUF !== filterUF) return false;
      if (filterCity !== 'all' && leadCity !== filterCity) return false;
      if (filterZone !== 'all' && leadZone !== filterZone) return false;
      if (filterCondition !== 'all' && leadCondition !== filterCondition) return false;
      if (filterObjective !== 'all' && leadObjective !== filterObjective) return false;
      if (filterValueRange !== 'all' && leadValue !== null) {
        const ranges = leadObjective === 'RENT' ? rentValueRanges : valueRanges;
        const range = ranges.find(r => r.value === filterValueRange);
        if (range && (leadValue < range.min || leadValue > range.max)) return false;
      }
      return true;
    });
  }, [leads, filterUF, filterCity, filterZone, filterCondition, filterObjective, filterValueRange]);

  const addToCart = async (leadId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('shopping_cart').insert({ user_id: user.id, lead_id: leadId });
      if (error) throw error;
      setCartItems([...cartItems, leadId]);
      toast({ title: 'Adicionado ao carrinho!' });
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  const removeFromCart = async (leadId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('shopping_cart').delete().eq('user_id', user.id).eq('lead_id', leadId);
      if (error) throw error;
      setCartItems(cartItems.filter(id => id !== leadId));
      toast({ title: 'Removido do carrinho' });
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  const openLeadDetails = (lead: Lead) => { setSelectedLead(lead); setDialogOpen(true); };
  
  const formatCredits = (credits: number) => `${credits.toLocaleString('pt-BR')} créditos`;

  const isInCart = (leadId: string) => cartItems.includes(leadId);
  const isSoldOut = (lead: Lead) => lead.purchase_count >= lead.max_purchases || lead.is_exhausted === true;
  const isPurchased = (leadId: string) => purchasedLeadIds.includes(leadId);

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">Carregando leads...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 md:mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Leads Disponíveis</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Explore e compre leads qualificados para seu negócio imobiliário
            </p>
          </div>
          <Button variant="outline" onClick={() => setShowAlerts(true)} className="relative">
            <Bell className="h-4 w-4 mr-2" />
            Meus Alertas
            {alerts.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {alerts.length}
              </span>
            )}
          </Button>
        </div>

        {/* Credit Balance & Buy Credits CTA */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg">
          <div className="flex items-center gap-3">
            <Coins className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            <div>
              <p className="text-xl font-bold text-yellow-700 dark:text-yellow-300">{creditBalance.toLocaleString('pt-BR')} créditos</p>
            </div>
          </div>
          <Button 
            onClick={() => navigate('/comprar-creditos')}
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
            size="lg"
          >
            <Coins className="h-4 w-4 mr-2" />
            Compre Créditos
          </Button>
        </div>

        {/* Filters */}
        <div className="mb-6 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Filtros</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">UF</label>
              <Select value={tempUF} onValueChange={handleUFChange}>
                <SelectTrigger className="bg-background"><SelectValue placeholder="Todos os estados" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os estados</SelectItem>
                  {filterOptions.uniqueUFs.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Cidade</label>
              <Select value={tempCity} onValueChange={setTempCity}>
                <SelectTrigger className="bg-background"><SelectValue placeholder="Todas as cidades" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as cidades</SelectItem>
                  {filteredCities.map(city => <SelectItem key={city} value={city}>{city}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Zona</label>
              <Select value={tempZone} onValueChange={setTempZone}>
                <SelectTrigger className="bg-background"><SelectValue placeholder="Todas as zonas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as zonas</SelectItem>
                  {filterOptions.uniqueZones.map(z => <SelectItem key={z} value={z}>{z}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Tipo de imóvel</label>
              <Select value={tempCondition} onValueChange={setTempCondition}>
                <SelectTrigger className="bg-background"><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="NEW">Novo</SelectItem>
                  <SelectItem value="USED">Usado</SelectItem>
                  <SelectItem value="BOTH">Novo ou Usado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Objetivo</label>
              <Select value={tempObjective} onValueChange={handleObjectiveChange}>
                <SelectTrigger className="bg-background"><SelectValue placeholder="Todos os objetivos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os objetivos</SelectItem>
                  {filterOptions.uniqueObjectives.map(obj => <SelectItem key={obj} value={obj}>{objectiveLabels[obj] || 'Outro'}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Valor</label>
              <Select value={tempValueRange} onValueChange={setTempValueRange}>
                <SelectTrigger className="bg-background"><SelectValue placeholder="Todos os valores" /></SelectTrigger>
                <SelectContent>
                  {(tempObjective === 'RENT' ? rentValueRanges : valueRanges).map(range => (
                    <SelectItem key={range.value} value={range.value}>{range.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-between gap-2 mt-4">
            <Button 
              variant="outline" 
              onClick={saveAlert} 
              disabled={savingAlert}
              className="gap-2"
            >
              {savingAlert ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar Alerta
            </Button>
            <div className="flex gap-2">
              <Button onClick={applyFilters}>Filtrar</Button>
              <Button variant="outline" onClick={clearFilters}>Limpar</Button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredLeads.map((lead) => {
            const parsed = parseDescription(lead.description);
            const leadCredits = Math.round(lead.price);
            const leadFormData = normalizeFormData(lead.form_data);
            const leadCondition = extractPropertyCondition(leadFormData);
            const isLaunch = leadCondition === 'NEW' || leadCondition === 'BOTH';
            return (
              <Card 
                key={lead.id} 
                className={`flex flex-col hover:shadow-lg transition-all duration-200 cursor-pointer border hover:border-primary/40 ${lead.is_promotion ? 'ring-2 ring-orange-400/60' : ''}`}
                onClick={() => openLeadDetails(lead)}
              >
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap gap-1 mb-1">
                    {lead.is_promotion && (
                      <Badge className="animate-pulse bg-orange-500 hover:bg-orange-500 text-white border-transparent text-xs">
                        🔥 PROMOÇÃO
                      </Badge>
                    )}
                  </div>

                  </div>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold">
                      Lead #{lead.id.slice(0, 5).toUpperCase()}
                    </CardTitle>
                    {isPurchased(lead.id) ? (
                      <Badge className="text-xs bg-green-600 hover:bg-green-600 text-white border-transparent">
                        ✓ Já comprado
                      </Badge>
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent className="flex-grow pt-0 space-y-3">
                  <div className="text-sm text-muted-foreground space-y-1">
                    {parsed.region && (
                      <p><span className="font-medium text-foreground">Região:</span> {parsed.region}</p>
                    )}
                    {parsed.interest && (
                      <p><span className="font-medium text-foreground">Interesse:</span> {parsed.interest}</p>
                    )}
                    {parsed.characteristics && (
                      <p><span className="font-medium text-foreground">Características:</span> {parsed.characteristics}</p>
                    )}
                  </div>
                  
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Coins className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                        <span className="text-lg font-bold text-yellow-700 dark:text-yellow-300">{leadCredits}</span>
                        <span className="text-xs text-muted-foreground">créditos</span>
                      </div>
                      <Badge 
                        variant={isSoldOut(lead) ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {isSoldOut(lead)
                          ? `Esgotado ${lead.max_purchases}/${lead.max_purchases}`
                          : `${lead.max_purchases - lead.purchase_count}/${lead.max_purchases} disp.`}
                      </Badge>
                    </div>
                    {!isPurchased(lead.id) && !isSoldOut(lead) && (
                      <Button 
                        className="w-full mt-2" 
                        size="sm"
                        disabled={buyingLeadId === lead.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          buyWithCredits(lead.id);
                        }}
                      >
                        {buyingLeadId === lead.id ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <Coins className="h-4 w-4 mr-1" />
                        )}
                        Comprar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Lead Details Modal */}
        <LeadDetailsModal
          lead={selectedLead}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          isInCart={selectedLead ? isInCart(selectedLead.id) : false}
          isSoldOut={selectedLead ? isSoldOut(selectedLead) : false}
          isPurchased={selectedLead ? isPurchased(selectedLead.id) : false}
          isAdmin={isAdmin === true}
          creditBalance={creditBalance}
          buyingLeadId={buyingLeadId}
          onBuyWithCredits={(leadId) => buyWithCredits(leadId)}
          onAddToCart={() => {
            if (selectedLead) {
              addToCart(selectedLead.id);
              setDialogOpen(false);
            }
          }}
          onRemoveFromCart={() => {
            if (selectedLead) {
              removeFromCart(selectedLead.id);
              setDialogOpen(false);
            }
          }}
          formatPrice={(price) => formatCredits(Math.round(price))}
        />

        {filteredLeads.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {leads.length === 0 
                ? 'Nenhum lead disponível no momento' 
                : 'Nenhum lead encontrado com os filtros selecionados'}
            </p>
          </div>
        )}
        {/* Alerts Dialog */}
        <Dialog open={showAlerts} onOpenChange={setShowAlerts}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Meus Alertas de Leads
              </DialogTitle>
              <DialogDescription>
                Você será notificado quando novos leads compatíveis forem cadastrados.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {alerts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum alerta salvo. Use os filtros acima e clique em "Salvar Alerta".
                </p>
              ) : (
                alerts.map((alert) => {
                  const f = alert.filters as Record<string, string>;
                  return (
                    <div key={alert.id} className="flex items-start justify-between p-3 border rounded-lg">
                      <div className="text-sm space-y-0.5">
                        <p className="font-medium">{f.city} - {f.state}</p>
                        {f.objective && <p className="text-muted-foreground">Objetivo: {objectiveLabels[f.objective] || 'Outro'}</p>}
                        {f.zone && <p className="text-muted-foreground">Zona: {f.zone}</p>}
                        {f.condition && <p className="text-muted-foreground">Tipo: {propertyConditionLabels[f.condition] || f.condition}</p>}
                        {f.valueRange && f.valueRange !== 'all' && (
                          <p className="text-muted-foreground">
                            Valor: {(f.objective === 'RENT' ? rentValueRanges : valueRanges).find(r => r.value === f.valueRange)?.label || f.valueRange}
                          </p>
                        )}
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => deleteAlert(alert.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
