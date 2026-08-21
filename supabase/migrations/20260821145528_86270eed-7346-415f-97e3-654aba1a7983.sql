select net.http_post(
  url := 'https://hmcpfedcvkurttyolurv.supabase.co/functions/v1/send-lead-feedback',
  headers := jsonb_build_object('Content-Type','application/json','x-cron-secret','Chrestopher@77'),
  body := jsonb_build_object('limit', 3)
);