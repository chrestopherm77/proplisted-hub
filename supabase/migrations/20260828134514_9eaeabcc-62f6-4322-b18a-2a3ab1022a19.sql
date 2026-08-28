CREATE OR REPLACE FUNCTION public.list_portal_conectae_properties()
RETURNS SETOF jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'id', p.id,
    'reference_code', p.reference_code,
    'title', p.title,
    'property_type', p.property_type,
    'operation_type', p.operation_type,
    'status', p.status,
    'price_sale', p.price_sale,
    'price_rent', p.price_rent,
    'condo_fee', p.condo_fee,
    'iptu', p.iptu,
    'area_total', p.area_total,
    'area_useful', p.area_useful,
    'bedrooms', p.bedrooms,
    'suites', p.suites,
    'bathrooms', p.bathrooms,
    'parking_spots', p.parking_spots,
    'city', p.city,
    'state', p.state,
    'neighborhood', p.neighborhood,
    'zone', p.zone,
    'address', p.address,
    'latitude', p.latitude,
    'longitude', p.longitude,
    'additional_info', p.additional_info,
    'amenities', p.amenities,
    'photos', p.photos,
    'created_at', p.created_at
  )
  FROM public.properties p
  WHERE p.is_active = true
  ORDER BY p.created_at DESC
$$;

GRANT EXECUTE ON FUNCTION public.list_portal_conectae_properties() TO anon, authenticated;