-- ============================================================
-- Tabela singleton para conteúdo editável da Página Principal (/)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.home_page_content (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton    boolean NOT NULL DEFAULT true,
  content      jsonb   NOT NULL DEFAULT '{}'::jsonb,
  updated_by   uuid,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT home_page_content_singleton_unique UNIQUE (singleton),
  CONSTRAINT home_page_content_singleton_true CHECK (singleton = true)
);

ALTER TABLE public.home_page_content ENABLE ROW LEVEL SECURITY;

-- SELECT público (a home é pública)
CREATE POLICY "Anyone can read home page content"
ON public.home_page_content
FOR SELECT
TO anon, authenticated
USING (true);

-- Apenas MASTER_ADMIN pode escrever
CREATE POLICY "Admins can insert home page content"
ON public.home_page_content
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'MASTER_ADMIN'::public.app_role));

CREATE POLICY "Admins can update home page content"
ON public.home_page_content
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'MASTER_ADMIN'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'MASTER_ADMIN'::public.app_role));

CREATE POLICY "Admins can delete home page content"
ON public.home_page_content
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'MASTER_ADMIN'::public.app_role));

-- Trigger para updated_at
CREATE TRIGGER set_home_page_content_updated_at
BEFORE UPDATE ON public.home_page_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed: insere o conteúdo atual hard-coded da Index.tsx
INSERT INTO public.home_page_content (singleton, content) VALUES (
  true,
  '{
    "header": {
      "brand_logo_url": "",
      "show_login_button": true,
      "login_label": "Entrar",
      "signup_label": "Cadastre-se"
    },
    "hero": {
      "badge_text": "✨ Plano grátis disponível • Sem cartão de crédito",
      "title_line1": "O hub completo do",
      "title_line2": "corretor de imóveis moderno",
      "subtitle": "Leads qualificados, parcerias, lançamentos, portal de imóveis, IA, criativos e muito mais — tudo em uma única plataforma feita para você vender mais.",
      "cta_primary_label": "Começar grátis",
      "cta_secondary_label": "Ver planos"
    },
    "features_section": {
      "badge": "Funcionalidades",
      "title": "Tudo que você precisa para vender mais",
      "subtitle": "9 ferramentas completas integradas + serviços extras para o corretor moderno operar com autonomia.",
      "items": [
        {"icon": "Target", "title": "Leads Disponíveis", "desc": "Compre leads de clientes prontos para fechar. Pague só pelo lead que escolher."},
        {"icon": "Handshake", "title": "Balcão de Parcerias", "desc": "Tem cliente sem imóvel? Publique e encontre o corretor que tem o match perfeito."},
        {"icon": "Building2", "title": "Lançamentos", "desc": "Acesso direto aos lançamentos das construtoras parceiras para você vender."},
        {"icon": "Home", "title": "Portal de Imóveis", "desc": "Publique seus imóveis e deixe outros corretores se afiliarem para vender em parceria."},
        {"icon": "Banknote", "title": "Financiamento", "desc": "Suporte completo no financiamento dos seus clientes do início ao fim."},
        {"icon": "Sparkles", "title": "Criativos com IA", "desc": "Gere criativos profissionais para suas redes sociais em segundos com IA."},
        {"icon": "Calculator", "title": "Calculadora de Emolumentos", "desc": "Calcule emolumentos por estado com precisão antes de fechar negócio."},
        {"icon": "Bot", "title": "IA de Atendimento", "desc": "Sua IA exclusiva para atender clientes 24/7 sem perder uma oportunidade."},
        {"icon": "Newspaper", "title": "Notícias do Mercado", "desc": "Fique por dentro das tendências e dados do mercado imobiliário diariamente."}
      ]
    },
    "extras": [
      {"icon": "GraduationCap", "title": "Educação Conectaae", "desc": "Treinamentos básicos, intermediários e Hot Seats com especialistas para você evoluir no mercado imobiliário."},
      {"icon": "Scale", "title": "Suporte Jurídico", "desc": "Serviços jurídicos sob demanda para você operar com segurança total em contratos e negociações."}
    ],
    "how_it_works": {
      "title": "Como funciona",
      "subtitle": "3 passos simples para começar a fechar negócios hoje",
      "steps": [
        {"title": "Cadastre-se grátis", "desc": "Crie sua conta em menos de 1 minuto. Plano grátis disponível, sem cartão."},
        {"title": "Escolha seu plano", "desc": "Selecione o plano ideal para o volume de negócios que você quer fechar."},
        {"title": "Use todas as ferramentas", "desc": "Leads, parcerias, IA, criativos, lançamentos — tudo na palma da mão."}
      ]
    },
    "stats": {
      "items": [
        {"icon": "Users", "value": "500+", "label": "Corretores ativos"},
        {"icon": "TrendingUp", "value": "2.000+", "label": "Negócios viabilizados"},
        {"icon": "Clock", "value": "24/7", "label": "Suporte disponível"}
      ]
    },
    "plans_section": {
      "badge": "Planos",
      "title": "Escolha seu plano",
      "subtitle": "Mais créditos, mais funcionalidades, mais resultado. Cancele quando quiser.",
      "footer_note": "Cobrança mensal recorrente • Cancele quando quiser • Pagamento seguro via Asaas",
      "plans": [
        {
          "slug": "conexao",
          "name": "Conexão",
          "price": "Grátis",
          "priceSuffix": "",
          "credits": "10 créditos/mês",
          "cta": "Começar grátis",
          "features": [
            "1 solicitação de parceria",
            "Até 5 ofertas de parceria",
            "Até 3 imóveis no portal",
            "Acesso full a lançamentos",
            "Acesso full a financiamentos",
            "1 criativo imobiliário",
            "Treinamentos básicos"
          ]
        },
        {
          "slug": "essencial",
          "name": "Essencial",
          "price": "R$ 39,90",
          "priceSuffix": "/mês",
          "credits": "30 créditos/mês",
          "cta": "Assinar Essencial",
          "features": [
            "5 solicitações de parceria",
            "Até 10 ofertas de parceria",
            "Até 10 imóveis no portal",
            "Acesso full a lançamentos",
            "Acesso full a financiamentos",
            "3 criativos imobiliários",
            "Treinamentos básicos e intermediários"
          ]
        },
        {
          "slug": "performance",
          "name": "Performance",
          "price": "R$ 79,90",
          "priceSuffix": "/mês",
          "credits": "430 créditos/mês",
          "cta": "Assinar Performance",
          "features": [
            "Solicitações de parceria ilimitadas",
            "Ofertas de parceria ilimitadas",
            "Imóveis no portal ilimitados",
            "Acesso full a lançamentos",
            "15 criativos imobiliários",
            "Hot Seat 2x mês",
            "2 leads inclusos"
          ]
        },
        {
          "slug": "elite",
          "name": "Elite",
          "price": "R$ 149,90",
          "priceSuffix": "/mês",
          "credits": "1.000 créditos/mês",
          "cta": "Assinar Elite",
          "features": [
            "Tudo do Performance, e mais:",
            "Imóveis no portal ilimitados",
            "30 criativos imobiliários",
            "Treinamentos básicos e intermediários",
            "Hot Seat 2x mês",
            "5 leads inclusos",
            "Suporte prioritário"
          ]
        }
      ]
    },
    "final_cta": {
      "title": "Pronto para vender mais imóveis?",
      "subtitle": "Comece grátis hoje. Sem cartão de crédito.",
      "cta_label": "Criar minha conta grátis",
      "secondary_text": "Já tem cadastro? Acesse agora"
    }
  }'::jsonb
);