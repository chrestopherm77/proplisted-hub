-- =========================================
-- SUPPORT TICKETS (Chamados de suporte)
-- =========================================

CREATE TABLE public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subject TEXT,
  category TEXT NOT NULL DEFAULT 'DUVIDA' CHECK (category IN ('RECLAMACAO','SUGESTAO','DUVIDA','OUTRO')),
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','IN_PROGRESS','RESOLVED','CLOSED')),
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  unread_by_admin BOOLEAN NOT NULL DEFAULT false,
  unread_by_user BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX idx_support_tickets_last_message_at ON public.support_tickets(last_message_at DESC);
CREATE INDEX idx_support_tickets_unread_admin ON public.support_tickets(unread_by_admin) WHERE unread_by_admin = true;

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own tickets"
  ON public.support_tickets FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users create own tickets"
  ON public.support_tickets FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own tickets"
  ON public.support_tickets FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage all tickets"
  ON public.support_tickets FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'MASTER_ADMIN'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'MASTER_ADMIN'::app_role));

CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- SUPPORT MESSAGES (Mensagens do chat)
-- =========================================

CREATE TABLE public.support_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('USER','ADMIN')),
  body TEXT NOT NULL DEFAULT '',
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_support_messages_ticket_id ON public.support_messages(ticket_id, created_at);

ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view messages of own tickets"
  ON public.support_messages FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.support_tickets t
    WHERE t.id = support_messages.ticket_id AND t.user_id = auth.uid()
  ));

CREATE POLICY "Users insert messages on own tickets"
  ON public.support_messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_role = 'USER'
    AND auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = support_messages.ticket_id AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins manage all messages"
  ON public.support_messages FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'MASTER_ADMIN'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'MASTER_ADMIN'::app_role));

-- =========================================
-- TRIGGER: ao inserir mensagem, atualiza ticket
-- =========================================

CREATE OR REPLACE FUNCTION public.handle_support_message_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_subject TEXT;
  v_auto_subject TEXT;
BEGIN
  SELECT subject INTO v_existing_subject FROM public.support_tickets WHERE id = NEW.ticket_id;

  IF v_existing_subject IS NULL OR length(trim(v_existing_subject)) = 0 THEN
    v_auto_subject := NULLIF(trim(NEW.body), '');
    IF v_auto_subject IS NOT NULL THEN
      v_auto_subject := substring(v_auto_subject FROM 1 FOR 80);
    ELSE
      v_auto_subject := 'Anexo';
    END IF;
  ELSE
    v_auto_subject := v_existing_subject;
  END IF;

  UPDATE public.support_tickets
  SET
    subject = v_auto_subject,
    last_message_at = NEW.created_at,
    unread_by_admin = CASE WHEN NEW.sender_role = 'USER' THEN true ELSE unread_by_admin END,
    unread_by_user  = CASE WHEN NEW.sender_role = 'ADMIN' THEN true ELSE unread_by_user END,
    status = CASE
      WHEN NEW.sender_role = 'USER' AND status IN ('RESOLVED','CLOSED') THEN 'OPEN'
      ELSE status
    END,
    updated_at = now()
  WHERE id = NEW.ticket_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_support_message_insert
  AFTER INSERT ON public.support_messages
  FOR EACH ROW EXECUTE FUNCTION public.handle_support_message_insert();

-- =========================================
-- REALTIME
-- =========================================

ALTER TABLE public.support_tickets REPLICA IDENTITY FULL;
ALTER TABLE public.support_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;

-- =========================================
-- STORAGE BUCKET: support-attachments
-- =========================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'support-attachments',
  'support-attachments',
  true,
  5242880,
  ARRAY['image/jpeg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read support attachments"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'support-attachments');

CREATE POLICY "Users upload own support attachments"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'support-attachments'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users delete own support attachments"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'support-attachments'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins manage all support attachments"
  ON storage.objects FOR ALL TO authenticated
  USING (
    bucket_id = 'support-attachments'
    AND public.has_role(auth.uid(), 'MASTER_ADMIN'::app_role)
  )
  WITH CHECK (
    bucket_id = 'support-attachments'
    AND public.has_role(auth.uid(), 'MASTER_ADMIN'::app_role)
  );