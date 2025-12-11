import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart, X, Info, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface Lead {
  id: string;
  description: string;
  price: number;
  purchase_count: number;
  max_purchases: number;
  is_active: boolean;
}

interface ParsedDescription {
  interest: string;
  region: string;
  characteristics: string;
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
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  // Temporary filter states (before clicking "Filtrar")
  const [tempInterest, setTempInterest] = useState<string>('all');
  const [tempRegion, setTempRegion] = useState<string>('all');
  // Applied filter states
  const [filterInterest, setFilterInterest] = useState<string>('all');
  const [filterRegion, setFilterRegion] = useState<string>('all');
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchLeads();
    fetchCart();
  }, [user, authLoading]);

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('id, description, price, purchase_count, max_purchases, is_active')
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

  // Extract unique interests and regions for filters
  const { uniqueInterests, uniqueRegions } = useMemo(() => {
    const interests = new Set<string>();
    const regions = new Set<string>();

    leads.forEach(lead => {
      const parsed = parseDescription(lead.description);
      if (parsed.interest) interests.add(parsed.interest);
      if (parsed.region) regions.add(parsed.region);
    });

    return {
      uniqueInterests: Array.from(interests).sort(),
      uniqueRegions: Array.from(regions).sort(),
    };
  }, [leads]);

  // Apply filters when button is clicked
  const applyFilters = () => {
    setFilterInterest(tempInterest);
    setFilterRegion(tempRegion);
  };

  // Clear all filters
  const clearFilters = () => {
    setTempInterest('all');
    setTempRegion('all');
    setFilterInterest('all');
    setFilterRegion('all');
  };

  // Filter leads based on applied filters
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const parsed = parseDescription(lead.description);
      
      if (filterInterest !== 'all' && parsed.interest !== filterInterest) {
        return false;
      }
      if (filterRegion !== 'all' && parsed.region !== filterRegion) {
        return false;
      }
      return true;
    });
  }, [leads, filterInterest, filterRegion]);

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

  const renderFormattedDescription = (description: string) => {
    const parsed = parseDescription(description);
    return (
      <div className="space-y-1 text-sm">
        {parsed.interest && (
          <p><span className="font-medium text-foreground">Interesse:</span> {parsed.interest}</p>
        )}
        {parsed.region && (
          <p><span className="font-medium text-foreground">Região:</span> {parsed.region}</p>
        )}
        {parsed.characteristics && (
          <p><span className="font-medium text-foreground">Características:</span> {parsed.characteristics}</p>
        )}
      </div>
    );
  };

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
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-1.5 min-w-[180px]">
              <label className="text-xs text-muted-foreground">Região</label>
              <Select value={tempRegion} onValueChange={setTempRegion}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Todas as regiões" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as regiões</SelectItem>
                  {uniqueRegions.map(region => (
                    <SelectItem key={region} value={region}>{region}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5 min-w-[180px]">
              <label className="text-xs text-muted-foreground">Interesse</label>
              <Select value={tempInterest} onValueChange={setTempInterest}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Todos os interesses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os interesses</SelectItem>
                  {uniqueInterests.map(interest => (
                    <SelectItem key={interest} value={interest}>{interest}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
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

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            {selectedLead && (
              <>
                <DialogHeader>
                  <div className="flex items-center justify-between mb-2">
                    <DialogTitle className="text-2xl">
                      Lead #{selectedLead.id.slice(0, 8)}
                    </DialogTitle>
                    <Badge 
                      variant={isSoldOut(selectedLead) ? 'destructive' : 'default'}
                    >
                      {isSoldOut(selectedLead)
                        ? 'Esgotado'
                        : `${selectedLead.max_purchases - selectedLead.purchase_count}/${selectedLead.max_purchases} disponíveis`}
                    </Badge>
                  </div>
                  <div className="pt-4 text-muted-foreground">
                    {renderFormattedDescription(selectedLead.description)}
                  </div>
                </DialogHeader>

                <div className="py-6 space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Valor do Lead</p>
                      <p className="text-3xl font-bold text-primary">{formatPrice(selectedLead.price)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground mb-1">Status</p>
                      <p className="text-sm font-medium">{selectedLead.purchase_count} vendidos</p>
                    </div>
                  </div>
                </div>

                <DialogFooter className="gap-2">
                  {isSoldOut(selectedLead) ? (
                    <Button disabled className="w-full" variant="secondary" size="lg">
                      Esgotado
                    </Button>
                  ) : isInCart(selectedLead.id) ? (
                    <Button 
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromCart(selectedLead.id);
                        setDialogOpen(false);
                      }}
                      variant="outline" 
                      className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      size="lg"
                    >
                      <X className="mr-2 h-5 w-5" />
                      Remover do Carrinho
                    </Button>
                  ) : (
                    <Button 
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(selectedLead.id);
                        setDialogOpen(false);
                      }}
                      className="w-full"
                      size="lg"
                    >
                      <ShoppingCart className="mr-2 h-5 w-5" />
                      Adicionar ao Carrinho
                    </Button>
                  )}
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

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