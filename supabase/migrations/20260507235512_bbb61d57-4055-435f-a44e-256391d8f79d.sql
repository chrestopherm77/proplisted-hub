
-- FAQ categories and items for the help center
CREATE TABLE public.faq_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.faq_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.faq_categories(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_faq_items_category ON public.faq_items(category_id);

ALTER TABLE public.faq_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq_items ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "FAQ categories are viewable by everyone"
  ON public.faq_categories FOR SELECT USING (true);
CREATE POLICY "FAQ items are viewable by everyone"
  ON public.faq_items FOR SELECT USING (true);

-- Admin write
CREATE POLICY "Admins manage faq categories"
  ON public.faq_categories FOR ALL
  USING (public.has_role(auth.uid(), 'MASTER_ADMIN'))
  WITH CHECK (public.has_role(auth.uid(), 'MASTER_ADMIN'));

CREATE POLICY "Admins manage faq items"
  ON public.faq_items FOR ALL
  USING (public.has_role(auth.uid(), 'MASTER_ADMIN'))
  WITH CHECK (public.has_role(auth.uid(), 'MASTER_ADMIN'));

CREATE TRIGGER update_faq_categories_updated_at
  BEFORE UPDATE ON public.faq_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_faq_items_updated_at
  BEFORE UPDATE ON public.faq_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial categories and items
WITH c AS (
  INSERT INTO public.faq_categories (title, sort_order) VALUES
    ('Conta e cadastro', 1),
    ('Leads e marketplace', 2),
    ('Pagamentos e créditos', 3),
    ('Lançamentos e parcerias', 4),
    ('Portal do corretor (White Label)', 5),
    ('Integrações', 6),
    ('Suporte e segurança', 7)
  RETURNING id, title
)
INSERT INTO public.faq_items (category_id, question, answer, sort_order)
SELECT c.id, x.q, x.a, x.ord FROM c JOIN (VALUES
  ('Conta e cadastro','Como criar minha conta?','Clique em "Entrar" no topo da página e depois em "Criar conta". Preencha seus dados, confirme o email e pronto: você já pode acessar a plataforma.',1),
  ('Conta e cadastro','Posso ter mais de uma conta com o mesmo telefone?','Por segurança, permitimos no máximo 2 contas por número de telefone. Tentativas adicionais serão bloqueadas automaticamente.',2),
  ('Conta e cadastro','Como verificar meu CRECI/CAU/CREA?','Após o cadastro, vá em "Meu Perfil" e informe o número e UF do seu registro profissional. Anexe o comprovante quando solicitado para liberar funcionalidades de corretor/arquiteto/engenheiro.',3),
  ('Conta e cadastro','Esqueci minha senha, como redefinir?','Na tela de login, clique em "Esqueci minha senha". Enviaremos um link por email para você criar uma nova senha em segurança.',4),
  ('Conta e cadastro','Como atualizar meus dados de perfil?','Acesse "Meu Perfil" pelo menu do avatar. Você pode atualizar nome, telefone, foto, especialidades e regiões de atuação a qualquer momento.',5),
  ('Leads e marketplace','O que é o Marketplace de Leads?','É o espaço onde você encontra leads qualificados disponíveis para compra, com filtros por cidade, tipo de imóvel, faixa de preço e intenção (compra, locação ou construção).',1),
  ('Leads e marketplace','Como compro um lead?','Abra o lead desejado em "Leads Disponíveis", revise as informações públicas e clique em "Comprar". O lead vai direto para sua área de "Meus Leads".',2),
  ('Leads e marketplace','Quantos parceiros podem comprar o mesmo lead?','Cada lead pode ser adquirido por até 5 parceiros. Após esse limite o lead aparece como "esgotado" e não pode mais ser comprado.',3),
  ('Leads e marketplace','Por que alguns dados do lead ficam ocultos antes da compra?','Para proteger o cliente final, ocultamos nome completo, telefone e email até a confirmação da compra. Após a compra, todos os dados ficam disponíveis imediatamente.',4),
  ('Leads e marketplace','Como funciona o reembolso/contestação de leads?','Se o lead estiver com dados inválidos ou duplicado, você pode abrir uma contestação em até 72 horas pela tela do lead. Nossa equipe analisa e, se procedente, devolve o crédito.',5),
  ('Leads e marketplace','O que significa "lead esgotado"?','Quer dizer que o lead já atingiu o número máximo de compradores (5) ou foi removido pelo administrador. Ele permanece visível apenas para histórico.',6),
  ('Pagamentos e créditos','Quais formas de pagamento são aceitas?','Aceitamos Pix, cartão de crédito e boleto bancário através do nosso provedor de pagamentos. Compras via Pix e cartão são liberadas em segundos.',1),
  ('Pagamentos e créditos','Como funcionam os créditos da plataforma?','Você pode comprar pacotes de crédito antecipados e usar para adquirir leads sem precisar pagar a cada compra. O saldo fica visível no topo da página.',2),
  ('Pagamentos e créditos','Onde vejo minhas faturas e recibos?','Acesse "Meu Perfil" → "Histórico financeiro" para baixar faturas, ver compras e acompanhar o saldo de créditos.',3),
  ('Lançamentos e parcerias','Como cadastro um lançamento?','Construtoras autorizadas acessam "Lançamentos" → "Novo lançamento", preenchem dados do empreendimento, anexam material e publicam para a rede de parceiros.',1),
  ('Lançamentos e parcerias','Como funciona o "Balcão de Parcerias"?','É o canal onde corretores divulgam parcerias e construtoras anunciam vagas em lançamentos. Notificamos automaticamente os parceiros compatíveis quando há um match.',2),
  ('Lançamentos e parcerias','Posso indicar parceiros para um lançamento?','Sim. Dentro do lançamento, use o botão "Indicar parceiro" para enviar convite por email ou WhatsApp para corretores da sua rede.',3),
  ('Portal do corretor (White Label)','O que é o Portal do Corretor?','É um site personalizado, com seu domínio e identidade visual, para você apresentar imóveis aos seus clientes — totalmente integrado ao seu cadastro na Conectae.',1),
  ('Portal do corretor (White Label)','Posso usar meus imóveis no portal?','Sim. Todos os imóveis cadastrados na sua conta aparecem automaticamente no seu portal, com fotos, descrição e formulário de contato direto.',2),
  ('Portal do corretor (White Label)','Posso anunciar imóveis de outros corretores?','Sim, desde que haja parceria registrada na plataforma. Imóveis de parceiros podem ser exibidos no seu portal com a devida divisão de comissão configurada.',3),
  ('Integrações','Como funcionam as notificações por email?','Enviamos emails transacionais para confirmação de cadastro, compras, novos leads compatíveis e atualizações importantes. Você pode ajustar preferências em "Meu Perfil".',1),
  ('Integrações','Posso integrar com meu CRM?','Sim. Oferecemos webhooks para enviar leads comprados automaticamente ao seu CRM. Configure em "Meu Perfil" → "Integrações".',2),
  ('Suporte e segurança','Como falo com o suporte?','Use o botão "Falar com o suporte" no rodapé desta central de ajuda para abrir um chamado diretamente pela plataforma.',1),
  ('Suporte e segurança','Meus dados estão seguros?','Sim. Utilizamos criptografia em trânsito e em repouso, autenticação segura e seguimos a LGPD. Apenas você acessa seus dados pessoais e financeiros.',2),
  ('Suporte e segurança','Como excluir minha conta?','Solicite a exclusão pelo suporte. Após confirmação, removemos seus dados pessoais conforme a LGPD, mantendo apenas registros fiscais obrigatórios por lei.',3)
) AS x(cat, q, a, ord) ON x.cat = c.title;
