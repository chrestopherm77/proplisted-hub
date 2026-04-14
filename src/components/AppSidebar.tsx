import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePartner } from '@/contexts/PartnerContext';
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
  ShoppingCart,
  Bot,
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

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (!user) return null;

  const navItems = [
    { title: 'Meus Leads', url: '/my-leads', icon: ShoppingBag, show: true },
    { title: 'Leads Disponíveis', url: '/leads', icon: Package, show: true },
    { title: 'Balcão de Parcerias', url: '/property-searches', icon: Search, show: isAdmin && !isPartnerSite },
    { title: 'Lançamentos', url: '/launches', icon: Rocket, show: (isAdmin || isConstrutora) && !isPartnerSite },
    { title: 'Financiamento', url: '/financiamento', icon: DollarSign, show: true },
    { title: 'Giro do Mercado', url: '/giro-do-mercado', icon: Newspaper, show: true },
    { title: 'Nossa IA', url: '/nossa-ia', icon: Bot, show: true },
    { title: 'Admin', url: '/admin', icon: LayoutDashboard, show: isAdmin && !isPartnerSite },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <Link to="/" className="flex items-center">
          {isPartnerSite && partner?.logo_url ? (
            <img src={partner.logo_url} alt={partner.name} className="h-8 max-w-[140px] object-contain" />
          ) : (
            <img src={leadbayLogo} alt="LeadBay" className={collapsed ? 'h-6' : 'h-8'} />
          )}
        </Link>
      </SidebarHeader>

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
            <SidebarMenuButton asChild tooltip="Carrinho">
              <Link to="/cart">
                <ShoppingCart className="h-4 w-4" />
                <span>Carrinho</span>
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
