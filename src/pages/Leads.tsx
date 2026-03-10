import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart, Filter } from 'lucide-react';
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
  form_data?: any;
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

// Normalize form_data that might be string or object
function normalizeFormData(raw: any): any {
  if (!raw) return null;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (typeof raw === 'object') {
    return raw;
  }
  return null;
}

// Extract UF from form_data (direct fields first, then region fallback)
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

// Extract city from form_data (direct fields first, then region fallback)
function extractCityFromFormData(formData: any): string {
  if (!formData) return '';
  const intention = formData?.intention;
  const intentionData = formData?.[intention?.toLowerCase?.()] || formData?.[intention];
  if (intentionData?.city) {
    const city = intentionData.city.trim();
    return city;
  }
  const region = formData?.region || '';
  return extractCityFromRegion(region);
}

function extractCityFromRegion(region: string | undefined): string {
  if (!region) return '';
  // Format: "indiferente - Ribeirão Preto/SP"
  const dashIndex = region.lastIndexOf(' - ');
  if (dashIndex >= 0) {
    const afterDash = region.substring(dashIndex + 3);
    const slashIndex = afterDash.indexOf('/');
    const city = slashIndex >= 0 ? afterDash.substring(0, slashIndex).trim() : afterDash.trim();
    if (city) return city;
  }
  const slashIdx = region.indexOf('/');
  if (slashIdx > 0) {
    return region.substring(0, slashIdx).trim();
  }
  return '';
}

// Extract neighborhood from form_data based on intention
function extractBairro(formData: any): string {
  if (!formData) return '';
  const intention = formData?.intention;
  const intentionData = formData?.[intention?.toLowerCase?.()] || formData?.[intention];
  return intentionData?.neighborhood || '';
}

// Extract objective from form_data
function extractObjective(formData: any): string {
  return formData?.intention || '';
}

// Extract value and convert to number
function extractValue(formData: any): number | null {
  const intention = formData?.intention;
  let valueStr = '';
  
  switch(intention) {
    case 'SELL':
      valueStr = formData?.sell?.expectedValue;
      break;
    case 'BUY':
      valueStr = formData?.buy?.budgetMax || formData?.buy?.budget;
      break;
    case 'BUILD':
      valueStr = formData?.build?.budget;
      break;
    case 'RENT':
      valueStr = formData?.rent?.maxRent;
      break;
  }
  
  if (!valueStr) return null;
  // Parse "R$ 250.000,00" → 250000
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

  // If no structured format found, use the whole description as characteristics
  if (!interest && !region && !characteristics) {
    characteristics = description;
  }

  return { interest, region, characteristics };
};

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState<string[]>([]);
  const [purchasedLeadIds, setPurchasedLeadIds] = useState<string[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Temporary filter states (before clicking "Filtrar")
  const [tempUF, setTempUF] = useState<string>('all');
  const [tempCity, setTempCity] = useState<string>('all');
  const [tempBairro, setTempBairro] = useState<string>('all');
  const [tempObjective, setTempObjective] = useState<string>('all');
  const [tempValueRange, setTempValueRange] = useState<string>('all');
  
  // Applied filter states
  const [filterUF, setFilterUF] = useState<string>('all');
  const [filterCity, setFilterCity] = useState<string>('all');
  const [filterBairro, setFilterBairro] = useState<string>('all');
  const [filterObjective, setFilterObjective] = useState<string>('all');
  const [filterValueRange, setFilterValueRange] = useState<string>('all');
  
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Handle deep linking from email notifications
  useEffect(() => {
    const leadIdFromUrl = searchParams.get('leadId');
    if (leadIdFromUrl && leads.length > 0) {
      const targetLead = leads.find(l => l.id === leadIdFromUrl);
      if (targetLead) {
        setSelectedLead(targetLead);
        setDialogOpen(true);
        // Clear the URL parameter after opening the modal
        setSearchParams({});
      }
    }
  }, [leads, searchParams, setSearchParams]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchLeads();
    fetchCart();
    fetchPurchases();
  }, [user, authLoading]);

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('id, description, price, purchase_count, max_purchases, is_active, form_data')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast({
        title: 'Erro ao carregar leads',
        description: 'Não foi possível carregar os leads disponíveis',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchases = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select('lead_id')
        .eq('user_id', user.id)
        .eq('status', 'PAID');
      if (!error && data) {
        setPurchasedLeadIds(data.map(p => p.lead_id));
      }
    } catch (error) {
      console.error('Error fetching purchases:', error);
    }
  };

  const fetchCart = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('shopping_cart')
        .select('lead_id')
        .eq('user_id', user.id);

      if (error) throw error;
      setCartItems(data?.map((item) => item.lead_id) || []);
    } catch (error) {
      console.error('Error fetching cart:', error);
    }
  };

  // Extract unique filter options from leads
  const filterOptions = useMemo(() => {
    const ufs = new Set<string>();
    const cities = new Set<string>();
    const bairros = new Set<string>();
    const objectives = new Set<string>();

    leads.forEach(lead => {
      const formData = normalizeFormData(lead.form_data);
      
      const uf = extractUFFromFormData(formData);
      const city = extractCityFromFormData(formData);
      const bairro = extractBairro(formData);
      const objective = extractObjective(formData);
      
      if (uf) ufs.add(uf);
      if (city) cities.add(city);
      if (bairro) bairros.add(bairro);
      if (objective) objectives.add(objective);
    });

    return {
      uniqueUFs: Array.from(ufs).sort(),
      uniqueCities: Array.from(cities).sort(),
      uniqueBairros: Array.from(bairros).sort(),
      uniqueObjectives: Array.from(objectives).sort(),
    };
  }, [leads]);

  // Get cities filtered by selected UF
  const filteredCities = useMemo(() => {
    if (tempUF === 'all') {
      return filterOptions.uniqueCities;
    }
    
    const citiesForUF = new Set<string>();
    leads.forEach(lead => {
      const formData = normalizeFormData(lead.form_data);
      
      const uf = extractUFFromFormData(formData);
      const city = extractCityFromFormData(formData);
      
      if (uf === tempUF && city) {
        citiesForUF.add(city);
      }
    });
    
    return Array.from(citiesForUF).sort();
  }, [leads, tempUF, filterOptions.uniqueCities]);

  // Apply filters when button is clicked
  const applyFilters = () => {
    setFilterUF(tempUF);
    setFilterCity(tempCity);
    setFilterBairro(tempBairro);
    setFilterObjective(tempObjective);
    setFilterValueRange(tempValueRange);
  };

  // Clear all filters
  const clearFilters = () => {
    setTempUF('all');
    setTempCity('all');
    setTempBairro('all');
    setTempObjective('all');
    setTempValueRange('all');
    setFilterUF('all');
    setFilterCity('all');
    setFilterBairro('all');
    setFilterObjective('all');
    setFilterValueRange('all');
  };

  // Reset city when UF changes
  const handleUFChange = (value: string) => {
    setTempUF(value);
    setTempCity('all');
  };

  // Reset value range when objective changes
  const handleObjectiveChange = (value: string) => {
    setTempObjective(value);
    setTempValueRange('all');
  };

  // Filter leads based on applied filters
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const formData = normalizeFormData(lead.form_data);
      
      const leadUF = extractUFFromFormData(formData);
      const leadCity = extractCityFromFormData(formData);
      const leadBairro = extractBairro(formData);
      const leadObjective = extractObjective(formData);
      const leadValue = extractValue(formData);
      
      // Filter by UF
      if (filterUF !== 'all' && leadUF !== filterUF) {
        return false;
      }
      
      // Filter by City
      if (filterCity !== 'all' && leadCity !== filterCity) {
        return false;
      }
      
      // Filter by Bairro
      if (filterBairro !== 'all' && leadBairro !== filterBairro) {
        return false;
      }
      
      // Filter by Objective
      if (filterObjective !== 'all' && leadObjective !== filterObjective) {
        return false;
      }
      
      // Filter by Value Range
      if (filterValueRange !== 'all' && leadValue !== null) {
        const ranges = leadObjective === 'RENT' ? rentValueRanges : valueRanges;
        const range = ranges.find(r => r.value === filterValueRange);
        if (range && (leadValue < range.min || leadValue > range.max)) {
          return false;
        }
      }
      
      return true;
    });
  }, [leads, filterUF, filterCity, filterBairro, filterObjective, filterValueRange]);

  const addToCart = async (leadId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('shopping_cart')
        .insert({ user_id: user.id, lead_id: leadId });

      if (error) throw error;

      setCartItems([...cartItems, leadId]);
      toast({
        title: 'Adicionado ao carrinho!',
        description: 'Lead adicionado com sucesso',
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível adicionar ao carrinho',
        variant: 'destructive',
      });
    }
  };

  const removeFromCart = async (leadId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('shopping_cart')
        .delete()
        .eq('user_id', user.id)
        .eq('lead_id', leadId);

      if (error) throw error;

      setCartItems(cartItems.filter(id => id !== leadId));
      toast({
        title: 'Removido do carrinho',
        description: 'Lead removido com sucesso',
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível remover do carrinho',
        variant: 'destructive',
      });
    }
  };

  const openLeadDetails = (lead: Lead) => {
    setSelectedLead(lead);
    setDialogOpen(true);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const isInCart = (leadId: string) => cartItems.includes(leadId);
  const isSoldOut = (lead: Lead) => lead.purchase_count >= lead.max_purchases;

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
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Marketplace de Leads</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Explore e compre leads qualificados para seu negócio imobiliário
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Filtros</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* UF Filter */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">UF</label>
              <Select value={tempUF} onValueChange={handleUFChange}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Todos os estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os estados</SelectItem>
                  {filterOptions.uniqueUFs.map(uf => (
                    <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* City Filter */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Cidade</label>
              <Select value={tempCity} onValueChange={setTempCity}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Todas as cidades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as cidades</SelectItem>
                  {filteredCities.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Bairro Filter */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Bairro</label>
              <Select value={tempBairro} onValueChange={setTempBairro}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Todos os bairros" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os bairros</SelectItem>
                  {filterOptions.uniqueBairros.map(bairro => (
                    <SelectItem key={bairro} value={bairro}>{bairro}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Objective Filter */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Objetivo</label>
              <Select value={tempObjective} onValueChange={handleObjectiveChange}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Todos os objetivos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os objetivos</SelectItem>
                  {filterOptions.uniqueObjectives.map(obj => (
                    <SelectItem key={obj} value={obj}>{objectiveLabels[obj] || obj}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Value Range Filter */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Valor</label>
              <Select value={tempValueRange} onValueChange={setTempValueRange}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Todos os valores" />
                </SelectTrigger>
                <SelectContent>
                  {(tempObjective === 'RENT' ? rentValueRanges : valueRanges).map(range => (
                    <SelectItem key={range.value} value={range.value}>{range.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Filter Buttons */}
          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={applyFilters}>
              Filtrar
            </Button>
            <Button 
              variant="outline" 
              onClick={clearFilters}
            >
              Limpar
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredLeads.map((lead) => {
            const parsed = parseDescription(lead.description);
            return (
              <Card 
                key={lead.id} 
                className="flex flex-col hover:shadow-lg transition-all duration-200 cursor-pointer border hover:border-primary/40"
                onClick={() => openLeadDetails(lead)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold">
                      Lead #{lead.id.slice(0, 5).toUpperCase()}
                    </CardTitle>
                    {isInCart(lead.id) && (
                      <Badge variant="outline" className="text-xs">
                        <ShoppingCart className="h-3 w-3 mr-1" />
                        No carrinho
                      </Badge>
                    )}
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
                      <span className="text-xl font-bold text-primary">{formatPrice(lead.price)}</span>
                      <Badge 
                        variant={isSoldOut(lead) ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {isSoldOut(lead)
                          ? 'Esgotado'
                          : `${lead.max_purchases - lead.purchase_count}/${lead.max_purchases} disponíveis`}
                      </Badge>
                    </div>
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
          formatPrice={formatPrice}
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
      </div>
    </Layout>
  );
}
