CREATE TABLE public.launch_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  granted_by UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.launch_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage launch permissions"
ON public.launch_permissions
FOR ALL
USING (public.has_role(auth.uid(), 'MASTER_ADMIN'))
WITH CHECK (public.has_role(auth.uid(), 'MASTER_ADMIN'));

CREATE POLICY "Users view own launch permission"
ON public.launch_permissions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX idx_launch_permissions_user_id ON public.launch_permissions(user_id);