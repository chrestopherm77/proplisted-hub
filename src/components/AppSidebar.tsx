import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePartner } from '@/contexts/PartnerContext';
import { supabase } from '@/integrations/supabase/client';
import leadbayLogo from '@/assets/leadbay-logo.png';
import {
  ShoppingBag,
  Package,
  Search,
  Rocket,
  DollarSign,
  Newspaper,
  LayoutDashboard,
  User,
  LogOut,
  Bot,
  Coins,
  Calculator,
  Sparkles,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';

export function AppSidebar() {
  const { user, isAdmin, isConstrutora, signOut } = useAuth();
  const { partner, isPartnerSite } = usePartner();
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
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

    // Listen for realtime changes
    const channel = supabase
      .channel('credit-balance')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${user.id}`,
      }, (payload: any) => {
        const next = payload?.new?.credit_balance;
        if (typeof next === 'number') {
          setCreditBalance(next);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (!user) return null;

  const navItems = [
    { title: 'Meus Leads - CRM', url: '/my-leads', icon: ShoppingBag, show: true },
    { title: 'Leads Disponíveis', url: '/leads', icon: Package, show: true },
    { title: 'Balcão de Parcerias', url: '/property-searches', icon: Search, show: !isPartnerSite },
    { title: 'Lançamentos', url: '/launches', icon: Rocket, show: !isPartnerSite },
    { title: 'Financiamento', url: '/financiamento', icon: DollarSign, show: true },
    { title: 'Giro do Mercado', url: '/giro-do-mercado', icon: Newspaper, show: true },
    { title: 'Nossa IA', url: '/nossa-ia', icon: Bot, show: isAdmin },
    { title: 'Calculadora', url: '/calculadora', icon: Calculator, show: !isPartnerSite },
    { title: 'Criativos', url: '/criativos', icon: Sparkles, show: isAdmin },
    { title: 'Admin', url: '/admin', icon: LayoutDashboard, show: isAdmin && !isPartnerSite },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <Link to="/" className="flex items-center">
          {isPartnerSite && partner?.logo_url ? (
            <img
              src={partner.logo_url}
              alt={partner.name || 'Parceiro'}
              className="h-12 max-w-[180px] object-contain"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = leadbayLogo; }}
            />
          ) : (
            <img
              src={leadbayLogo}
              alt="LeadBay"
              className={collapsed ? 'h-10' : 'h-12'}
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          )}
        </Link>
      </SidebarHeader>

      {/* Credit Balance */}
      <div className="px-3 pb-2">
        <Link
          to="/comprar-creditos"
          className="flex items-center gap-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 p-2.5 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
        >
          <Coins className="h-4 w-4 text-yellow-600 dark:text-yellow-400 shrink-0" />
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-xs text-muted-foreground">Créditos</span>
              <span className="text-sm font-bold text-yellow-700 dark:text-yellow-300 truncate">
                {(creditBalance ?? 0).toLocaleString('pt-BR')}
              </span>
            </div>
          )}
        </Link>
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems
                .filter((item) => item.show)
                .map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                      tooltip={item.title}
                    >
                      <Link to={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive('/comprar-creditos')} tooltip="Comprar Créditos">
              <Link to="/comprar-creditos">
                <Coins className="h-4 w-4" />
                <span>Comprar Créditos</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive('/profile')} tooltip="Perfil">
              <Link to="/profile">
                <User className="h-4 w-4" />
                <span>Perfil</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut} tooltip="Sair">
              <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
