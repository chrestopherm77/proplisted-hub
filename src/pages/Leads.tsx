import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ShoppingCart, X, Info } from 'lucide-react';
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

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState<string[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
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

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {leads.map((lead) => (
            <Card 
              key={lead.id} 
              className="flex flex-col hover:shadow-lg transition-all duration-200 cursor-pointer border hover:border-primary/40"
              onClick={() => openLeadDetails(lead)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-2">
                  <Badge 
                    variant={isSoldOut(lead) ? 'destructive' : 'default'}
                    className="text-xs"
                  >
                    {isSoldOut(lead)
                      ? 'Esgotado'
                      : `${lead.max_purchases - lead.purchase_count} disponíveis`}
                  </Badge>
                  {isInCart(lead.id) && (
                    <Badge variant="outline" className="text-xs">
                      <ShoppingCart className="h-3 w-3 mr-1" />
                      No carrinho
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-base line-clamp-2">
                  Lead #{lead.id.slice(0, 6)}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-grow pt-0">
                <CardDescription className="line-clamp-2 text-xs mb-3">
                  {lead.description}
                </CardDescription>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-primary">{formatPrice(lead.price)}</span>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <Info className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
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
                  <DialogDescription className="text-base pt-4">
                    {selectedLead.description}
                  </DialogDescription>
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

        {leads.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum lead disponível no momento</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
