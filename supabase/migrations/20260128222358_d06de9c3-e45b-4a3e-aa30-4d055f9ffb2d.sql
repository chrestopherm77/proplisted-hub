-- =====================================================
-- Correção de Segurança: Política INSERT explícita para user_roles
-- =====================================================

-- Adicionar política INSERT explícita para garantir que apenas admins possam atribuir roles
-- Isso fornece defense-in-depth mesmo com o default-deny do RLS
CREATE POLICY "Only admins can insert roles"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'MASTER_ADMIN'));