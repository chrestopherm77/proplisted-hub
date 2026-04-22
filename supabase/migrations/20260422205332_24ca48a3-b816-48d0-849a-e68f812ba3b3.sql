-- Remove cron job antigo
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'geocode-pending-properties-every-5min') THEN
    PERFORM cron.unschedule('geocode-pending-properties-every-5min');
  END IF;
END $$;

-- Recria usando service_role JWT (sempre disponível, sem config manual)
SELECT cron.schedule(
  'geocode-pending-properties-every-5min',
  '*/5 * * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://hmcpfedcvkurttyolurv.supabase.co/functions/v1/geocode-properties',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1)
    ),
    body := jsonb_build_object('backfill', true, 'cron_trigger', true)
  );
  $cron$
);