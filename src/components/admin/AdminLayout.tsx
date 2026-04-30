import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { BrandLogo } from '@/components/BrandLogo';
import { UserAvatarMenu } from '@/components/UserAvatarMenu';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Package,
  CreditCard,
  ShoppingCart,
  Repeat,
  Clock,
  Users,
  History,
  Activity,
  Ticket,
  Handshake,
  Sparkles,
  KeyRound,
  ArrowLeft,
  Globe,
  PlayCircle,
  Video,
  LifeBuoy,
  MessageSquare,
  ListChecks,
} from 'lucide-react';

interface AdminNavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  group: 'Visão Geral' | 'Financeiro' | 'Pessoas' | 'Conteúdo';
}

export const ADMIN_NAV: AdminNavItem[] = [
  { title: 'Dashboard', url: '/admin', icon: LayoutDashboard, group: 'Visão Geral' },
  { title: 'Leads', url: '/admin/leads', icon: Package, group: 'Visão Geral' },
  { title: 'Rastreamento', url: '/admin/tracking', icon: Activity, group: 'Visão Geral' },
  { title: 'Etapas de Cadastro', url: '/admin/signup-progress', icon: ListChecks, group: 'Visão Geral' },

  { title: 'Compras (Créditos)', url: '/admin/purchases', icon: CreditCard, group: 'Financeiro' },
  { title: 'Compra de Leads', url: '/admin/lead-purchases', icon: ShoppingCart, group: 'Financeiro' },
  { title: 'Assinaturas', url: '/admin/subscriptions', icon: Repeat, group: 'Financeiro' },
  { title: 'Pendentes', url: '/admin/pending', icon: Clock, group: 'Financeiro' },
  { title: 'Vouchers', url: '/admin/vouchers', icon: Ticket, group: 'Financeiro' },

  { title: 'Usuários', url: '/admin/users', icon: Users, group: 'Pessoas' },
  { title: 'Chamados', url: '/admin/support', icon: LifeBuoy, group: 'Pessoas' },
  { title: 'Acessos', url: '/admin/access', icon: History, group: 'Pessoas' },
  { title: 'Liberar acesso', url: '/admin/launch-access', icon: KeyRound, group: 'Pessoas' },
  { title: 'Parceiros', url: '/admin/partners', icon: Handshake, group: 'Pessoas' },

  { title: 'Criativos', url: '/admin/creatives', icon: Sparkles, group: 'Conteúdo' },
  { title: 'Landing Pages', url: '/admin/landing-pages', icon: Globe, group: 'Conteúdo' },
  { title: 'Primeiros Passos', url: '/admin/onboarding-video', icon: PlayCircle, group: 'Conteúdo' },
  { title: 'Link Público', url: '/admin/public-videos', icon: Video, group: 'Conteúdo' },
  { title: 'Grupos WhatsApp', url: '/admin/whatsapp-groups', icon: MessageSquare, group: 'Conteúdo' },
];

const GROUPS: AdminNavItem['group'][] = ['Visão Geral', 'Financeiro', 'Pessoas', 'Conteúdo'];

function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const isActive = (url: string) =>
    url === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(url);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <Link to="/admin" className="flex items-center gap-2">
          <BrandLogo size={collapsed ? 'sm' : 'md'} />
          {!collapsed && (
            <span className="text-xs font-semibold uppercase tracking-wide text-primary">
              Admin
            </span>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {GROUPS.map((group) => (
          <SidebarGroup key={group}>
            {!collapsed && <SidebarGroupLabel>{group}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {ADMIN_NAV.filter((i) => i.group === group).map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
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
        ))}

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Voltar ao app">
                  <Link to="/leads">
                    <ArrowLeft className="h-4 w-4" />
                    <span>Voltar ao app</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (authLoading || isAdmin === null) return;
    if (!user) {
      navigate('/auth');
      return;
    }
    if (isAdmin === false) {
      navigate('/leads');
    }
  }, [user, authLoading, isAdmin, navigate]);

  if (authLoading || isAdmin === null || isAdmin === false) {
    return <div className="p-12 text-center text-muted-foreground">Carregando...</div>;
  }

  const current = ADMIN_NAV.find((i) =>
    i.url === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(i.url),
  );

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted/30">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="bg-white border-b border-border shadow-sm sticky top-0 z-50 h-14 flex items-center px-4 justify-between">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <h1 className="text-sm font-semibold text-foreground">
                {current?.title ?? 'Admin'}
              </h1>
            </div>
            <UserAvatarMenu />
          </header>
          <main className="flex-1 p-4 md:p-6">
            <div className="max-w-7xl mx-auto">{children}</div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
