insert into public.lead_feedback_queue (lead_id, scheduled_at, status)
select id, now(), 'PENDING' from public.leads
where id in ('d208f7ee-8005-4850-891b-2ca7a959dfde','96061065-b445-4ce0-ba02-fd1a37ea080e','70603241-3cd6-4106-b8ea-d41e1396740b');

select net.http_post(
  url := 'https://hmcpfedcvkurttyolurv.supabase.co/functions/v1/send-lead-feedback',
  headers := jsonb_build_object('Content-Type','application/json','x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'CRON_SECRET_FOR_DB' limit 1)),
  body := jsonb_build_object('limit', 3)
);