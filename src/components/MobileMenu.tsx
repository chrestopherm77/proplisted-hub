import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, User, LogOut, Search, Rocket } from 'lucide-react';
import leadbayLogo from '@/assets/leadbay-logo.png';
import { usePartner } from '@/contexts/PartnerContext';
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
  onSignOut: () => void;
}

export const MobileMenu = ({ isAdmin, onSignOut }: MobileMenuProps) => {
  const location = useLocation();
  const { partner, isPartnerSite } = usePartner();
  const isActive = (path: string) => location.pathname === path;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72">
        <SheetHeader>
          <SheetTitle className="text-left">
            {isPartnerSite && partner?.logo_url ? (
              <img src={partner.logo_url} alt={partner.name} className="h-7 max-w-[140px] object-contain" />
            ) : (
              <img src={leadbayLogo} alt="LeadBay" className="h-7" />
            )}
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col space-y-2 mt-8">
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
            <span className="font-medium">Marketplace</span>
          </Link>
          {isAdmin && (
            <Link
              to="/property-searches"
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive('/property-searches')
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              }`}
            >
              <Search className="h-5 w-5" />
              <span className="font-medium">Buscar oferta</span>
            </Link>
          )}
          {isAdmin && (
            <Link
              to="/launches"
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive('/launches')
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              }`}
            >
              <Rocket className="h-5 w-5" />
              <span className="font-medium">Lançamentos</span>
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
          <Link
            to="/profile"
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              isActive('/profile')
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
          >
            <User className="h-5 w-5" />
            <span className="font-medium">Perfil</span>
          </Link>
          <button
            onClick={onSignOut}
            className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-muted text-left w-full transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Sair</span>
          </button>
        </nav>
      </SheetContent>
    </Sheet>
  );
};
