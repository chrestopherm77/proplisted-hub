import { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePartner } from '@/contexts/PartnerContext';
import { Button } from '@/components/ui/button';
import { ShoppingCart, User, Settings, LogOut, LayoutDashboard } from 'lucide-react';
import leadbayLogo from '@/assets/leadbay-logo.png';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MobileMenu } from '@/components/MobileMenu';
import { FloatingCart } from '@/components/FloatingCart';
import { supabase } from '@/integrations/supabase/client';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { user, isAdmin, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState(0);

  // Fetch cart count when user is logged in
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

    // Subscribe to cart changes for realtime updates
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
          () => {
            fetchCartCount();
          }
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

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light to-background">
      <header className="bg-white border-b border-border shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {user && <MobileMenu isAdmin={isAdmin} onSignOut={handleSignOut} />}
            
            <Link to="/" className="flex items-center">
              <img src={leadbayLogo} alt="LeadBay" className="h-8 md:h-10" />
            </Link>

            {user && (
              <nav className="hidden md:flex items-center space-x-6">
                <Link
                  to="/my-leads"
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    isActive('/my-leads') ? 'text-primary' : 'text-foreground'
                  }`}
                >
                  Meus Leads
                </Link>
                <Link
                  to="/leads"
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    isActive('/leads') ? 'text-primary' : 'text-foreground'
                  }`}
                >
                  Marketplace
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className={`text-sm font-medium transition-colors hover:text-primary ${
                      isActive('/admin') ? 'text-primary' : 'text-foreground'
                    }`}
                  >
                    <LayoutDashboard className="inline h-4 w-4 mr-1" />
                    Admin
                  </Link>
                )}
              </nav>
            )}

            <div className="flex items-center space-x-2 md:space-x-4">
              {user ? (
                <>
                  <Link to="/cart">
                    <Button variant="ghost" size="icon" className="h-9 w-9 md:h-10 md:w-10">
                      <ShoppingCart className="h-5 w-5" />
                    </Button>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild className="hidden md:flex">
                      <Button variant="ghost" size="icon">
                        <User className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate('/profile')}>
                        <Settings className="mr-2 h-4 w-4" />
                        Perfil
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleSignOut}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Sair
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <Link to="/auth">
                  <Button size="sm" className="text-sm">Entrar</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 md:py-8">{children}</main>

      <footer className="bg-white border-t border-border mt-auto">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          © 2025 LeadBay. Todos os direitos reservados.
        </div>
      </footer>

      {/* Floating Cart Button */}
      {user && <FloatingCart itemCount={cartCount} />}
    </div>
  );
};
