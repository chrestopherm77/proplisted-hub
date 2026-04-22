-- Remove cron job antigo se existir
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'geocode-pending-properties-every-5min') THEN
    PERFORM cron.unschedule('geocode-pending-properties-every-5min');
  END IF;
END $$;

-- Recria cron job com CRON_SECRET embutido no header
SELECT cron.schedule(
  'geocode-pending-properties-every-5min',
  '*/5 * * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://hmcpfedcvkurttyolurv.supabase.co/functions/v1/geocode-properties',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', 'Chrestopher@77'
    ),
    body := jsonb_build_object('backfill', true, 'cron_trigger', true)
  );
  $cron$
);