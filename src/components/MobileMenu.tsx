import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { LayoutDashboard, Package, ShoppingBag, User, LogOut, Search, Rocket, DollarSign, Newspaper, Bot, Calculator, Building2, Crown, Sparkles, Coins, Handshake, CalendarDays } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { usePartner } from '@/contexts/PartnerContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

interface MobileMenuProps {
  isAdmin: boolean;
  isConstrutora: boolean;
  onSignOut: () => void;
}

export const MobileMenu = ({ isAdmin, isConstrutora, onSignOut }: MobileMenuProps) => {
  const location = useLocation();
  const { partner, isPartnerSite } = usePartner();
  const { user } = useAuth();
  const [creditBalance, setCreditBalance] = useState(0);
  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    if (!user) return;
    const fetchBalance = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('credit_balance')
        .eq('id', user.id)
        .single();
      if (data) setCreditBalance(data.credit_balance || 0);
    };
    fetchBalance();

    const channel = supabase
      .channel('mobile-credit-balance')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${user.id}`,
      }, (payload: any) => {
        const next = payload?.new?.credit_balance;
        if (typeof next === 'number') setCreditBalance(next);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 overflow-y-auto max-h-screen">
        <SheetHeader>
          <SheetTitle className="text-left">
            {isPartnerSite && partner?.logo_url ? (
              <img src={partner.logo_url} alt={partner.name} className="h-7 max-w-[140px] object-contain" />
            ) : (
              <BrandLogo size="sm" />
            )}
          </SheetTitle>
        </SheetHeader>
        <Link
          to="/comprar-creditos"
          className="mt-6 flex items-center justify-between gap-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 px-3 py-2 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <span className="text-xs text-muted-foreground">Créditos disponíveis</span>
          </div>
          <span className="text-sm font-bold text-yellow-700 dark:text-yellow-300">
            {(creditBalance ?? 0).toLocaleString('pt-BR')}
          </span>
        </Link>
        <nav className="flex flex-col space-y-2 mt-4">
          <Link
            to="/my-leads"
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              isActive('/my-leads')
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
          >
            <ShoppingBag className="h-5 w-5" />
            <span className="font-medium">Meus Leads</span>
          </Link>
          <Link
            to="/leads"
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              isActive('/leads')
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
          >
            <Package className="h-5 w-5" />
            <span className="font-medium">Leads Disponíveis</span>
          </Link>
          {true && (
            <Link
              to="/property-searches"
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive('/property-searches')
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              }`}
            >
              <Search className="h-5 w-5" />
              <span className="font-medium">Venda em Parceria</span>
            </Link>
          )}
          {!isPartnerSite && (
            <Link
              to="/portal-imoveis"
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive('/portal-imoveis')
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              }`}
            >
              <Building2 className="h-5 w-5" />
              <span className="font-medium">Portal de Imóveis</span>
            </Link>
          )}
          {true && (
            <Link
              to="/launches"
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive('/launches')
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              }`}
            >
              <Rocket className="h-5 w-5" />
              <span className="font-medium">Construtoras</span>
            </Link>
          )}
          <Link
            to="/financiamento"
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              isActive('/financiamento')
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
          >
            <DollarSign className="h-5 w-5" />
            <span className="font-medium">Financiamento</span>
          </Link>
          {!isPartnerSite && (
            <Link
              to="/alugue-em-parceria"
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive('/alugue-em-parceria')
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              }`}
            >
              <Handshake className="h-5 w-5" />
              <span className="font-medium">Alugue em Parceria</span>
            </Link>
          )}
          {!isPartnerSite && (
            <Link
              to="/eventos"
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive('/eventos')
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              }`}
            >
              <CalendarDays className="h-5 w-5" />
              <span className="font-medium">Eventos</span>
            </Link>
          )}
          <Link
            to="/giro-do-mercado"
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              isActive('/giro-do-mercado')
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
          >
            <Newspaper className="h-5 w-5" />
            <span className="font-medium">Giro do Mercado</span>
          </Link>
          {isAdmin && (
            <Link
              to="/nossa-ia"
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive('/nossa-ia')
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              }`}
            >
              <Bot className="h-5 w-5" />
              <span className="font-medium">Nossa IA</span>
            </Link>
          )}
          <Link
            to="/criativos"
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              isActive('/criativos')
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
          >
            <Sparkles className="h-5 w-5" />
            <span className="font-medium">Criativos</span>
          </Link>
          {!isPartnerSite && (
            <Link
              to="/calculadora"
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive('/calculadora')
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              }`}
            >
              <Calculator className="h-5 w-5" />
              <span className="font-medium">Calculadora</span>
            </Link>
          )}
          {!isPartnerSite && (
            <Link
              to="/planos"
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive('/planos')
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              }`}
            >
              <Crown className="h-5 w-5" />
              <span className="font-medium">Planos</span>
            </Link>
          )}
          {isAdmin && !isPartnerSite && (
            <Link
              to="/admin"
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive('/admin')
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              }`}
            >
              <LayoutDashboard className="h-5 w-5" />
              <span className="font-medium">Admin</span>
            </Link>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
};
