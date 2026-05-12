import { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePartner } from '@/contexts/PartnerContext';
import { Button } from '@/components/ui/button';
import { BrandLogo } from '@/components/BrandLogo';
import { MobileMenu } from '@/components/MobileMenu';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { UserAvatarMenu } from '@/components/UserAvatarMenu';
import { FaqButton } from '@/components/FaqButton';
import { SupportChatWidget } from '@/components/support/SupportChatWidget';
import { CompleteProfileReminder } from '@/components/profile/CompleteProfileReminder';
import { AlertBanner } from '@/components/AlertBanner';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { user, isAdmin, isConstrutora, signOut } = useAuth();
  const { partner, isPartnerSite } = usePartner();
  const navigate = useNavigate();

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
                  <BrandLogo size="md" />
                )}
              </Link>
              <div className="flex items-center gap-1">
                <FaqButton />
                <Link to="/auth">
                  <Button size="sm" className="text-sm">Entrar</Button>
                </Link>
              </div>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-4 md:py-8">{children}</main>
        <footer className="bg-white border-t border-border mt-auto">
          <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
            © 2025 {isPartnerSite && partner ? partner.name : 'Conectae Imob'}. Todos os direitos reservados.
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
            <div className="flex items-center gap-1">
              <FaqButton />
              <UserAvatarMenu />
            </div>
          </header>

          <AlertBanner />
          <main className="flex-1 container mx-auto px-4 py-4 md:py-8">{children}</main>

          <footer className="bg-white border-t border-border mt-auto">
            <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
              © 2025 {isPartnerSite && partner ? partner.name : 'Conectae Imob'}. Todos os direitos reservados.
            </div>
          </footer>
        </div>
      </div>
      <SupportChatWidget />
      <CompleteProfileReminder />
    </SidebarProvider>
  );
};
