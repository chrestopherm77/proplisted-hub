-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('MASTER_ADMIN', 'USER');

-- Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  creci_number TEXT NOT NULL,
  accepted_terms BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'USER',
  UNIQUE (user_id, role)
);

-- Create leads table
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  purchase_count INTEGER DEFAULT 0,
  max_purchases INTEGER DEFAULT 3,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create purchases table
CREATE TABLE public.purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  asaas_payment_id TEXT,
  asaas_customer_id TEXT,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'PENDING',
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  payment_confirmed_at TIMESTAMPTZ
);

-- Create shopping_cart table
CREATE TABLE public.shopping_cart (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, lead_id)
);

-- Create asaas_webhook_events table
CREATE TABLE public.asaas_webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asaas_event_id TEXT UNIQUE,
  event_type TEXT NOT NULL,
  payment_id TEXT,
  payload JSONB NOT NULL,
  received_at TIMESTAMPTZ DEFAULT NOW(),
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  error_message TEXT
);

-- Create indexes for better performance
CREATE INDEX idx_profiles_user_id ON public.profiles(id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);
CREATE INDEX idx_leads_active ON public.leads(is_active);
CREATE INDEX idx_leads_available ON public.leads(purchase_count) WHERE purchase_count < max_purchases;
CREATE INDEX idx_purchases_user ON public.purchases(user_id);
CREATE INDEX idx_purchases_lead ON public.purchases(lead_id);
CREATE INDEX idx_purchases_status ON public.purchases(status);
CREATE INDEX idx_purchases_payment ON public.purchases(asaas_payment_id);
CREATE INDEX idx_cart_user ON public.shopping_cart(user_id);
CREATE INDEX idx_webhook_event_id ON public.asaas_webhook_events(asaas_event_id);
CREATE INDEX idx_webhook_processed ON public.asaas_webhook_events(processed);

-- Security definer function to check user roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to handle new user signup (creates profile and default role)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, phone, creci_number, accepted_terms)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'creci_number',
    (NEW.raw_user_meta_data->>'accepted_terms')::BOOLEAN
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'USER');
  
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asaas_webhook_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'MASTER_ADMIN'));

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'MASTER_ADMIN'));

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'MASTER_ADMIN'));

-- RLS Policies for leads (marketplace)
CREATE POLICY "Anyone authenticated can view active leads"
  ON public.leads FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_active = true);

CREATE POLICY "Admins can view all leads"
  ON public.leads FOR SELECT
  USING (public.has_role(auth.uid(), 'MASTER_ADMIN'));

CREATE POLICY "Admins can manage leads"
  ON public.leads FOR ALL
  USING (public.has_role(auth.uid(), 'MASTER_ADMIN'));

-- RLS Policies for purchases
CREATE POLICY "Users can view their own purchases"
  ON public.purchases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create purchases"
  ON public.purchases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all purchases"
  ON public.purchases FOR SELECT
  USING (public.has_role(auth.uid(), 'MASTER_ADMIN'));

CREATE POLICY "Admins can manage all purchases"
  ON public.purchases FOR ALL
  USING (public.has_role(auth.uid(), 'MASTER_ADMIN'));

-- RLS Policies for shopping_cart
CREATE POLICY "Users can manage their own cart"
  ON public.shopping_cart FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all carts"
  ON public.shopping_cart FOR SELECT
  USING (public.has_role(auth.uid(), 'MASTER_ADMIN'));

-- RLS Policies for webhook events (admin only)
CREATE POLICY "Admins can view webhook events"
  ON public.asaas_webhook_events FOR SELECT
  USING (public.has_role(auth.uid(), 'MASTER_ADMIN'));

-- Insert some sample leads for testing
INSERT INTO public.leads (name, phone, description, price) VALUES
('João Silva', '11999998888', 'Interessado em apartamento de 2 quartos, até R$500.000, região Sul de São Paulo', 25.00),
('Maria Santos', '21988887777', 'Procura casa com 3 quartos e quintal, orçamento até R$800.000, Barra da Tijuca/RJ', 30.00),
('Pedro Costa', '11977776666', 'Investidor buscando imóvel comercial para locação, até R$1.200.000, Paulista', 50.00),
('Ana Oliveira', '85966665555', 'Quer apartamento na planta, 2 ou 3 quartos, até R$400.000, Fortaleza', 25.00),
('Carlos Ferreira', '31955554444', 'Procura terreno para construção, mínimo 300m², até R$300.000, Belo Horizonte', 35.00);