import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, User, LogOut } from 'lucide-react';
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
          <SheetTitle className="flex items-center space-x-2 text-left">
            <Package className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold text-primary">LeadMarket</span>
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
