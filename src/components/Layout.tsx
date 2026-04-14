import { ReactNode, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePartner } from '@/contexts/PartnerContext';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import leadbayLogo from '@/assets/leadbay-logo.png';
import { MobileMenu } from '@/components/MobileMenu';
import { FloatingCart } from '@/components/FloatingCart';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { supabase } from '@/integrations/supabase/client';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { user, isAdmin, isConstrutora, signOut } = useAuth();
  const { partner, isPartnerSite } = usePartner();
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const fetchCartCount = async () => {
      if (!user) {
        setCartCount(0);
        return;
      }
      try {
        const { count, error } = await supabase
          .from('shopping_cart')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        if (!error && count !== null) {
          setCartCount(count);
        }
      } catch (err) {
        console.error('Error fetching cart count:', err);
      }
    };

    fetchCartCount();

    if (user) {
      const channel = supabase
        .channel('cart-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'shopping_cart',
            filter: `user_id=eq.${user.id}`,
          },
          () => fetchCartCount()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  // Logged-out layout: simple header
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-light to-background">
        <header className="bg-white border-b border-border shadow-sm sticky top-0 z-50">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <Link to="/" className="flex items-center">
                {isPartnerSite && partner?.logo_url ? (
                  <img src={partner.logo_url} alt={partner.name} className="h-8 md:h-10 max-w-[160px] object-contain" />
                ) : (
                  <img src={leadbayLogo} alt="LeadBay" className="h-8 md:h-10" />
                )}
              </Link>
              <Link to="/auth">
                <Button size="sm" className="text-sm">Entrar</Button>
              </Link>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-4 md:py-8">{children}</main>
        <footer className="bg-white border-t border-border mt-auto">
          <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
            © 2025 {isPartnerSite && partner ? partner.name : 'LeadBay'}. Todos os direitos reservados.
          </div>
        </footer>
      </div>
    );
  }

  // Logged-in layout: sidebar
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-primary-light to-background">
        <AppSidebar />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar for mobile menu + sidebar trigger */}
          <header className="bg-white border-b border-border shadow-sm sticky top-0 z-50 h-14 flex items-center px-4 justify-between">
            <div className="flex items-center gap-2">
              <MobileMenu isAdmin={isAdmin ?? false} isConstrutora={isConstrutora} onSignOut={handleSignOut} />
              <SidebarTrigger className="hidden md:flex" />
            </div>
            <div className="flex items-center gap-2">
              <Link to="/cart">
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <ShoppingCart className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </header>

          <main className="flex-1 container mx-auto px-4 py-4 md:py-8">{children}</main>

          <footer className="bg-white border-t border-border mt-auto">
            <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
              © 2025 {isPartnerSite && partner ? partner.name : 'LeadBay'}. Todos os direitos reservados.
            </div>
          </footer>
        </div>
      </div>

      {user && <FloatingCart itemCount={cartCount} />}
    </SidebarProvider>
  );
};
