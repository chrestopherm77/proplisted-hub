import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { PartnerProvider } from "./contexts/PartnerContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
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
import MarketNews from "./pages/MarketNews";
import NossaIA from "./pages/NossaIA";
import BuyCredits from "./pages/BuyCredits";
import NotFound from "./pages/NotFound";

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
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/my-leads" element={<MyLeads />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/checkout-success" element={<CheckoutSuccess />} />
          <Route path="/checkout-error" element={<CheckoutError />} />
          <Route path="/checkout-expired" element={<CheckoutExpired />} />
          <Route path="/admin" element={<Admin />} />
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
          <Route path="/launches/:id" element={<LaunchDetail />} />
          <Route path="/financiamento" element={<Financing />} />
          <Route path="/giro-do-mercado" element={<MarketNews />} />
          <Route path="/nossa-ia" element={<NossaIA />} />
          <Route path="/comprar-creditos" element={<BuyCredits />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </PartnerProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
