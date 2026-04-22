ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS zone TEXT;

CREATE OR REPLACE FUNCTION public.get_public_property(p_slug text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_property RECORD;
  v_owner RECORD;
  v_brand RECORD;
  v_affiliate RECORD;
  v_contact_user_id UUID;
  v_token TEXT;
  v_ref TEXT;
  v_dash_pos INTEGER;
BEGIN
  IF p_slug ~ '-aff-' THEN
    v_dash_pos := POSITION('-aff-' IN p_slug);
    v_ref := SUBSTRING(p_slug FROM 1 FOR v_dash_pos - 1);
    v_token := SUBSTRING(p_slug FROM v_dash_pos + 5);
  ELSE
    v_ref := p_slug;
    v_token := NULL;
  END IF;

  SELECT * INTO v_property
  FROM public.properties
  WHERE reference_code = v_ref AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  v_contact_user_id := v_property.user_id;
  
  IF v_token IS NOT NULL THEN
    SELECT * INTO v_affiliate
    FROM public.property_affiliates
    WHERE token = v_token AND property_id = v_property.id;
    
    IF FOUND THEN
      v_contact_user_id := v_affiliate.affiliate_user_id;
    END IF;
  END IF;

  SELECT name, phone, creci_number, creci, creci_uf, company_name, profession
  INTO v_owner
  FROM public.profiles
  WHERE id = v_contact_user_id;

  SELECT company_name, logo_url, primary_color, secondary_color
  INTO v_brand
  FROM public.user_brands
  WHERE user_id = v_contact_user_id;

  RETURN jsonb_build_object(
    'id', v_property.id,
    'reference_code', v_property.reference_code,
    'title', v_property.title,
    'property_type', v_property.property_type,
    'operation_type', v_property.operation_type,
    'status', v_property.status,
    'state', v_property.state,
    'city', v_property.city,
    'neighborhood', v_property.neighborhood,
    'zone', v_property.zone,
    'address', v_property.address,
    'bedrooms', v_property.bedrooms,
    'suites', v_property.suites,
    'bathrooms', v_property.bathrooms,
    'parking_spots', v_property.parking_spots,
    'area_useful', v_property.area_useful,
    'area_total', v_property.area_total,
    'price_sale', v_property.price_sale,
    'price_rent', v_property.price_rent,
    'condo_fee', v_property.condo_fee,
    'iptu', v_property.iptu,
    'amenities', v_property.amenities,
    'additional_info', v_property.additional_info,
    'photos', v_property.photos,
    'is_affiliate_view', v_token IS NOT NULL,
    'contact', jsonb_build_object(
      'name', COALESCE(v_owner.name, v_owner.company_name),
      'phone', v_owner.phone,
      'creci', COALESCE(v_owner.creci_number, v_owner.creci),
      'creci_uf', v_owner.creci_uf,
      'profession', v_owner.profession
    ),
    'brand', CASE WHEN v_brand IS NULL THEN NULL ELSE jsonb_build_object(
      'company_name', v_brand.company_name,
      'logo_url', v_brand.logo_url,
      'primary_color', v_brand.primary_color,
      'secondary_color', v_brand.secondary_color
    ) END
  );
END;
$function$;