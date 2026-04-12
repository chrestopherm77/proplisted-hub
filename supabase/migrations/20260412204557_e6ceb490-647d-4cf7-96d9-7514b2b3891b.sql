ALTER TABLE public.launches
  ADD COLUMN logo_url text,
  ADD COLUMN property_type text,
  ADD COLUMN size_m2_min text,
  ADD COLUMN size_m2_max text,
  ADD COLUMN status text,
  ADD COLUMN price_max text,
  ADD COLUMN coordinator_phone2 text,
  ADD COLUMN drive_link text;