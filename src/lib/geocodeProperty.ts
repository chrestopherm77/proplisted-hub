import { supabase } from '@/integrations/supabase/client';

/**
 * Geocodes a property address using OpenStreetMap Nominatim (free, no API key).
 * Updates the property row in DB with latitude/longitude on success.
 * Fails silently — geocoding is non-critical.
 */
export async function geocodeAndSaveProperty(propertyId: string, parts: {
  address?: string | null;
  neighborhood?: string | null;
  city: string;
  state?: string | null;
}): Promise<{ lat: number; lng: number } | null> {
  try {
    const query = [parts.address, parts.neighborhood, parts.city, parts.state, 'Brasil']
      .filter((p) => p && String(p).trim().length > 0)
      .join(', ');

    if (!query) return null;

    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=br`;
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'pt-BR' },
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;

    const lat = parseFloat(data[0].lat);
    const lng = parseFloat(data[0].lon);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;

    await supabase
      .from('properties')
      .update({ latitude: lat, longitude: lng } as never)
      .eq('id', propertyId);

    return { lat, lng };
  } catch (err) {
    console.warn('[geocode] failed', err);
    return null;
  }
}
