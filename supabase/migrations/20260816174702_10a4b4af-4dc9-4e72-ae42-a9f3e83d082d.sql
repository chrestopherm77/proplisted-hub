UPDATE public.subscription_plans
SET feature_list = '["Tudo do Plano Essencial","15 criativos imobiliários","Site Personalizado"]'::jsonb
WHERE slug LIKE 'elite%';

WITH newplans AS (
  SELECT jsonb_agg(
    CASE
      WHEN p->>'slug'='elite' THEN jsonb_set(jsonb_set(p,'{features}','["Tudo do Plano Essencial","15 criativos imobiliários","Site Personalizado"]'::jsonb),'{credits}','"150 créditos Grátis/mês"'::jsonb)
      WHEN p->>'slug'='essencial' THEN jsonb_set(p,'{credits}','"30 créditos Grátis/mês"'::jsonb)
      WHEN p->>'slug'='conexao' THEN jsonb_set(p,'{credits}','"10 créditos Grátis/mês"'::jsonb)
      ELSE p END ORDER BY ord) AS plans
  FROM public.home_page_content h, jsonb_array_elements(h.content->'plans_section'->'plans') WITH ORDINALITY AS t(p, ord)
  WHERE p->>'slug' <> 'partner'
)
UPDATE public.home_page_content
SET content = jsonb_set(content, '{plans_section,plans}', (SELECT plans FROM newplans));