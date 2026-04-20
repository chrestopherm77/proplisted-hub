INSERT INTO public.creative_styles (slug, name, description, prompt, is_active)
VALUES (
  '__general__',
  'Prompt Geral (base de toda geração)',
  'Instruções globais aplicadas a TODA geração de criativo. Sempre concatenado antes do prompt do estilo escolhido pelo cliente. Não aparece para o usuário final.',
  'Você é um designer especialista em criativos imobiliários para redes sociais. Gere uma imagem profissional, fotorrealista, com alta qualidade visual, composição equilibrada e iluminação natural. Mantenha fidelidade à imagem de referência do imóvel. Textos em português brasileiro, mínimos e legíveis. Sem watermarks, logos genéricos ou marcas de terceiros.',
  false
)
ON CONFLICT (slug) DO NOTHING;