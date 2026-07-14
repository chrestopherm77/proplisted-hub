import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { PartnerProvider } from "./contexts/PartnerContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Cadastro from "./pages/Cadastro";
import Leads from "./pages/Leads";
import MyLeads from "./pages/MyLeads";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import CheckoutError from "./pages/CheckoutError";
import CheckoutExpired from "./pages/CheckoutExpired";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import LeadForm from "./pages/LeadForm";
import LeadForm01 from "./pages/LeadForm01";
import ResetPassword from "./pages/ResetPassword";
import ThankYou from "./pages/ThankYou";
import ThankYou01 from "./pages/ThankYou01";
import PropertySearches from "./pages/PropertySearches";
import PropertySearchDetail from "./pages/PropertySearchDetail";
import NewPropertySearch from "./pages/NewPropertySearch";
import Launches from "./pages/Launches";
import LaunchDetail from "./pages/LaunchDetail";
import NewLaunch from "./pages/NewLaunch";
import Financing from "./pages/Financing";
import RentalPartnership from "./pages/RentalPartnership";
import MarketNews from "./pages/MarketNews";
import NossaIA from "./pages/NossaIA";
import BuyCredits from "./pages/BuyCredits";
import Calculadora from "./pages/Calculadora";
import Criativos from "./pages/Criativos";
import PortalImoveis from "./pages/PortalImoveis";
import NewProperty from "./pages/NewProperty";
import PropertyDetail from "./pages/PropertyDetail";
import PublicPropertyLP from "./pages/PublicPropertyLP";
import Planos from "./pages/Planos";
import CustomLandingPage from "./pages/CustomLandingPage";
import PrimeirosPassos from "./pages/PrimeirosPassos";
import CadastroRealizado from "./pages/CadastroRealizado";
import Indicar from "./pages/Indicar";
import PublicVideo from "./pages/PublicVideo";
import NotFound from "./pages/NotFound";
import ConectaEImobPortal from "./pages/ConectaEImobPortal";
import LandSearches from "./pages/LandSearches";
import MyLandSearches from "./pages/MyLandSearches";
import ConectaEImobNews from "./pages/ConectaEImobNews";
import Events from "./pages/Events";
import ObrigadoGrupo from "./pages/ObrigadoGrupo";
import ObrigadoLiveConectae from "./pages/ObrigadoLiveConectae";
import { PageViewTracker } from "./components/PageViewTracker";
import { AffiliateRefCapture } from "./components/AffiliateRefCapture";
import AffiliateDashboard from "./pages/AffiliateDashboard";
import BrokerPortal from "./pages/BrokerPortal";
import SolicitarPortal from "./pages/SolicitarPortal";
import PortalTemplatePreview from "./pages/PortalTemplatePreview";
import { BrokerDomainGate } from "./components/broker-portal/BrokerDomainGate";
import { MegaApiAlertModal } from "./components/admin/MegaApiAlertModal";


const queryClient = new QueryClient();

// Component to handle SPA redirects from 404.html
const RedirectHandler = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    const redirect = sessionStorage.getItem('redirect');
    if (redirect) {
      sessionStorage.removeItem('redirect');
      navigate(redirect, { replace: true });
    }
  }, [navigate]);
  
  return null;
};

const App = () => {
  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <PartnerProvider>
        <RedirectHandler />
        <AffiliateRefCapture />
        <PageViewTracker />
        <MegaApiAlertModal />
        <Routes>
          <Route path="/" element={<BrokerDomainGate><ConectaEImobPortal /></BrokerDomainGate>} />
          <Route path="/corretor" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/my-leads" element={<MyLeads />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/checkout-success" element={<CheckoutSuccess />} />
          <Route path="/checkout-error" element={<CheckoutError />} />
          <Route path="/checkout-expired" element={<CheckoutExpired />} />
          <Route path="/admin" element={<Admin section="dashboard" />} />
          <Route path="/admin/leads" element={<Admin section="leads" />} />
          <Route path="/admin/tracking" element={<Admin section="tracking" />} />
          <Route path="/admin/signup-progress" element={<Admin section="signup-progress" />} />
          <Route path="/admin/user-activity" element={<Admin section="user-activity" />} />
          <Route path="/admin/purchases" element={<Admin section="purchases" />} />
          <Route path="/admin/lead-purchases" element={<Admin section="lead-purchases" />} />
          <Route path="/admin/lead-contact-tracking" element={<Admin section="lead-contact-tracking" />} />
          <Route path="/admin/lead-feedback" element={<Admin section="lead-feedback" />} />
          <Route path="/admin/subscriptions" element={<Admin section="subscriptions" />} />
          <Route path="/admin/pending" element={<Admin section="pending" />} />
          <Route path="/admin/vouchers" element={<Admin section="vouchers" />} />
          <Route path="/admin/users" element={<Admin section="users" />} />
          <Route path="/admin/access" element={<Admin section="access" />} />
          <Route path="/admin/launch-access" element={<Admin section="launch-access" />} />
          <Route path="/admin/partners" element={<Admin section="partners" />} />
          <Route path="/admin/creatives" element={<Admin section="creatives" />} />
          <Route path="/admin/landing-pages" element={<Admin section="landing-pages" />} />
          <Route path="/admin/landing-pages/:id" element={<Admin section="landing-page-editor" />} />
          <Route path="/admin/home-page" element={<Admin section="home-page" />} />
          <Route path="/admin/onboarding-video" element={<Admin section="onboarding-video" />} />
          <Route path="/admin/public-videos" element={<Admin section="public-videos" />} />
          <Route path="/admin/support" element={<Admin section="support" />} />
          <Route path="/admin/whatsapp-groups" element={<Admin section="whatsapp-groups" />} />
          <Route path="/admin/affiliates" element={<Admin section="affiliates" />} />
          <Route path="/admin/broker-portals" element={<Admin section="broker-portals" />} />
          <Route path="/admin/broker-portal-requests" element={<Admin section="broker-portal-requests" />} />
          <Route path="/solicitar-portal" element={<SolicitarPortal />} />
          <Route path="/admin/email-marketing" element={<Admin section="email-marketing" />} />
          <Route path="/admin/faq" element={<Admin section="faq" />} />
          <Route path="/admin/alert-banners" element={<Admin section="alert-banners" />} />
          <Route path="/admin/lead-form-intentions" element={<Admin section="lead-form-intentions" />} />
          <Route path="/admin/rental-partners" element={<Admin section="rental-partners" />} />
          <Route path="/admin/financing-leads" element={<Admin section="financing-leads" />} />
          <Route path="/admin/land-searches" element={<Admin section="land-searches" />} />
          <Route path="/admin/land-search-access" element={<Admin section="land-search-access" />} />
          <Route path="/procura-se-terrenos" element={<LandSearches />} />
          <Route path="/meus-terrenos-procurados" element={<MyLandSearches />} />
          <Route path="/admin/events" element={<Admin section="events" />} />
          <Route path="/eventos" element={<Events />} />
          <Route path="/obrigado-grupo" element={<ObrigadoGrupo />} />

          <Route path="/afiliado" element={<AffiliateDashboard />} />
          <Route path="/portal/:slug" element={<BrokerPortal />} />
          <Route path="/portal-modelo/:id" element={<PortalTemplatePreview />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/lp" element={<LeadForm />} />
          <Route path="/lp-01" element={<LeadForm01 />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/lp-obrigado" element={<ThankYou />} />
          <Route path="/lp-obrigado-01" element={<ThankYou01 />} />
          <Route path="/property-searches" element={<PropertySearches />} />
          <Route path="/property-searches/new" element={<NewPropertySearch />} />
          <Route path="/property-searches/:id" element={<PropertySearchDetail />} />
          <Route path="/launches" element={<Launches />} />
          <Route path="/launches/new" element={<NewLaunch />} />
          <Route path="/launches/:id/edit" element={<NewLaunch />} />
          <Route path="/launches/:id" element={<LaunchDetail />} />
          <Route path="/financiamento" element={<Financing />} />
          <Route path="/alugue-em-parceria" element={<RentalPartnership />} />
          <Route path="/giro-do-mercado" element={<MarketNews />} />
          <Route path="/nossa-ia" element={<NossaIA />} />
          <Route path="/comprar-creditos" element={<BuyCredits />} />
          <Route path="/calculadora" element={<Calculadora />} />
          <Route path="/criativos" element={<Criativos />} />
          <Route path="/portal-imoveis" element={<PortalImoveis />} />
          <Route path="/portal-imoveis/novo" element={<NewProperty />} />
          <Route path="/portal-imoveis/:id/editar" element={<NewProperty />} />
          <Route path="/portal-imoveis/:id" element={<PropertyDetail />} />
          <Route path="/imovel/:slug" element={<PublicPropertyLP />} />
          <Route path="/planos" element={<Planos />} />
          <Route path="/primeiros-passos" element={<PrimeirosPassos />} />
          <Route path="/cadastro-realizado" element={<CadastroRealizado />} />
          <Route path="/indicar" element={<Indicar />} />
          <Route path="/conectaeimob" element={<ConectaEImobPortal />} />
          <Route path="/conectaeimob/noticias" element={<ConectaEImobNews />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          {/* Catch-slug for custom landing pages — MUST be last before "*" */}
          <Route path="/:customSlug" element={<CustomLandingPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </PartnerProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
