
UPDATE public.credit_packages SET is_active = false;

INSERT INTO public.credit_packages (name, price, credits, lead_count, is_active) VALUES
('1 Lead', 14.00, 70, 1, true),
('5 Leads', 65.00, 350, 5, true),
('10 Leads', 115.00, 700, 10, true),
('25 Leads', 250.00, 1750, 25, true);

UPDATE public.leads SET price = 70 WHERE is_active = true;
