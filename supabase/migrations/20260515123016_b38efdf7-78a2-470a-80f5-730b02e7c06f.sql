UPDATE public.subscription_plans
SET features = features 
  || jsonb_build_object('partnership_requests', 5, 'partnership_offers', 7, 'portal_properties', 5),
    feature_list = '["5 solicitações de parceria", "Até 7 ofertas de parceria", "Até 5 imóveis no portal", "Acesso full a lançamentos", "Acesso full a financiamentos", "Acesso full a notícias", "Acesso full Calculadora de emolumentos", "1 criativo imobiliário", "Acesso a treinamentos Básicos"]'::jsonb
WHERE slug = 'conexao';