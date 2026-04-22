-- Recria o cron job de geocoding usando current_setting (sem vault)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'geocode-pending-properties-every-5min') THEN
    PERFORM cron.unschedule('geocode-pending-properties-every-5min');
  END IF;
END $$;

SELECT cron.schedule(
  'geocode-pending-properties-every-5min',
  '*/5 * * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://hmcpfedcvkurttyolurv.supabase.co/functions/v1/geocode-properties',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', current_setting('app.cron_secret', true)
    ),
    body := '{"backfill": true}'::jsonb
  );
  $cron$
);