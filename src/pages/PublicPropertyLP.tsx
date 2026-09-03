import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  MapPin, Loader2, MessageCircle, BedDouble, Bath, Car, Ruler, Home, Building2,
} from 'lucide-react';
import { PropertyGallery } from '@/components/portal/PropertyGallery';
import { AmenitiesDisplay } from '@/components/portal/AmenitiesDisplay';
import {
  getPropertyTypeLabel, getOperationLabel, getStatusLabel, formatPrice,
  normalizeAmenities, type PropertyPhoto,
} from '@/lib/propertyUtils';
import { buildWaLink } from '@/lib/whatsapp';

interface PublicProperty {
  id: string;
  reference_code: string;
  title: string | null;
  property_type: string;
  operation_type: string;
  status: string | null;
  state: string | null;
  city: string;
  neighborhood: string | null;
  zone: string | null;
  address: string | null;
  bedrooms: number | null;
  suites: number | null;
  bathrooms: number | null;
  parking_spots: number | null;
  area_useful: number | null;
  area_total: number | null;
  price_sale: number | null;
  price_rent: number | null;
  condo_fee: number | null;
  iptu: number | null;
  amenities: unknown;
  additional_info: string | null;
  photos: unknown;
  is_affiliate_view: boolean;
  contact: {
    name: string | null;
    phone: string | null;
    creci: string | null;
    creci_uf: string | null;
    profession: string | null;
  };
  brand: {
    company_name: string | null;
    logo_url: string | null;
    primary_color: string | null;
    secondary_color: string | null;
  } | null;
}

const PublicPropertyLP = () => {
  const { slug } = useParams<{ slug: string }>();
  const [property, setProperty] = useState<PublicProperty | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_public_property', { p_slug: slug });
      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setProperty(data as unknown as PublicProperty);
      setLoading(false);

      supabase.from('property_views').insert({
        property_id: (data as any).id,
      });
    };
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound || !property) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <Building2 className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">Imóvel não encontrado</h1>
          <p className="text-muted-foreground">Este anúncio não está mais disponível.</p>
        </div>
      </div>
    );
  }

  const photos: PropertyPhoto[] = Array.isArray(property.photos) ? (property.photos as PropertyPhoto[]) : [];
  const amenitiesNorm = normalizeAmenities(property.amenities);
  const hasAmenities =
    !!amenitiesNorm.legacy?.length ||
    !!(amenitiesNorm.condo && Object.keys(amenitiesNorm.condo).length) ||
    !!(amenitiesNorm.property && Object.keys(amenitiesNorm.property).length);
  const price = property.operation_type === 'RENT' ? property.price_rent : property.price_sale;
  const waMessage = `Olá! Tenho interesse no imóvel Ref: ${property.reference_code}`;

  const primaryColor = property.brand?.primary_color || null;
  const secondaryColor = property.brand?.secondary_color || null;
  const brandName = property.brand?.company_name || null;
  const brandLogo = property.brand?.logo_url || null;

  return (
    <div
      className="min-h-screen bg-fixed bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: 'url(/images/portal-bg.jpg)' }}
    >
      <main className="container mx-auto px-4 py-6 md:py-8 max-w-6xl">


        <div className="bg-background/85 backdrop-blur-sm rounded-2xl shadow-lg p-3 sm:p-4 border border-border/50">
          <PropertyGallery photos={photos} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-card/95 backdrop-blur-md rounded-2xl shadow-xl border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <h1 className="text-2xl md:text-4xl font-bold leading-tight">{property.title}</h1>
                    <p className="flex items-start gap-1.5 text-muted-foreground text-sm mt-2">
                      <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>
                        {[property.address, property.neighborhood, property.zone ? `Zona ${property.zone}` : null, property.city].filter(Boolean).join(', ')}
                        {property.state ? `/${property.state}` : ''}
                      </span>
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className="text-2xl md:text-4xl font-bold"
                      style={primaryColor ? { color: primaryColor } : undefined}
                    >
                      {price ? formatPrice(price) : 'Sob consulta'}
                    </p>
                    <Badge variant="outline" className="mt-1 text-xs">
                      {getOperationLabel(property.operation_type)}
                    </Badge>
                  </div>
                </div>

                <Separator className="my-5" />

                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-sm font-medium">
                    <Home className="h-4 w-4 text-muted-foreground" /> {getPropertyTypeLabel(property.property_type)}
                  </span>
                  {property.bedrooms ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-sm font-medium">
                      <BedDouble className="h-4 w-4 text-muted-foreground" />
                      {property.bedrooms} quartos{property.suites ? ` (${property.suites} suíte${property.suites > 1 ? 's' : ''})` : ''}
                    </span>
                  ) : null}
                  {property.bathrooms ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-sm font-medium">
                      <Bath className="h-4 w-4 text-muted-foreground" /> {property.bathrooms} banheiros
                    </span>
                  ) : null}
                  {property.parking_spots ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-sm font-medium">
                      <Car className="h-4 w-4 text-muted-foreground" /> {property.parking_spots} vagas
                    </span>
                  ) : null}
                  {property.area_useful ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-sm font-medium">
                      <Ruler className="h-4 w-4 text-muted-foreground" /> {property.area_useful}m² útil
                    </span>
                  ) : null}
                  {property.area_total ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-sm font-medium">
                      <Ruler className="h-4 w-4 text-muted-foreground" /> {property.area_total}m² total
                    </span>
                  ) : null}
                </div>

                {(property.condo_fee || property.iptu) && (
                  <div className="flex flex-wrap gap-4 text-sm mt-4 text-muted-foreground">
                    {property.condo_fee ? <span>Condomínio: <strong className="text-foreground">{formatPrice(property.condo_fee)}</strong></span> : null}
                    {property.iptu ? <span>IPTU: <strong className="text-foreground">{formatPrice(property.iptu)}</strong></span> : null}
                  </div>
                )}

                {property.status && (
                  <div className="mt-4"><Badge variant="outline">{getStatusLabel(property.status)}</Badge></div>
                )}
              </CardContent>
            </Card>

            {hasAmenities && (
              <Card className="bg-card/95 backdrop-blur-md rounded-2xl shadow-xl border-border/50">
                <CardHeader><CardTitle className="text-lg md:text-xl">Comodidades e Características</CardTitle></CardHeader>
                <CardContent>
                  <AmenitiesDisplay value={property.amenities} />
                </CardContent>
              </Card>
            )}

            {property.additional_info && (
              <Card className="bg-card/95 backdrop-blur-md rounded-2xl shadow-xl border-border/50">
                <CardHeader><CardTitle className="text-lg md:text-xl">Informações adicionais</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{property.additional_info}</p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-4">
            <Card
              className="lg:sticky lg:top-24 bg-card/95 backdrop-blur-md rounded-2xl shadow-xl"
              style={primaryColor ? { borderColor: primaryColor, borderWidth: 2 } : undefined}
            >
              <CardHeader>
                <CardTitle className="text-base md:text-lg">Fale com o corretor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(brandLogo || brandName) && (
                  <div className="flex flex-col items-center gap-2 pb-4 border-b">
                    {brandLogo && (
                      <div className="bg-white rounded-xl p-2 shadow-sm ring-1 ring-border/50">
                        <img
                          src={brandLogo}
                          alt={brandName || 'Logo'}
                          className="h-16 w-auto max-w-[180px] object-contain"
                        />
                      </div>
                    )}
                    {brandName && <span className="font-bold text-base text-center">{brandName}</span>}
                  </div>
                )}
                <div className="text-center">
                  <p className="font-semibold text-base">{property.contact.name || 'Anunciante'}</p>
                  {property.contact.creci && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      CRECI {property.contact.creci}{property.contact.creci_uf ? `/${property.contact.creci_uf}` : ''}
                    </p>
                  )}
                </div>
                {property.contact.phone && (
                  <Button
                    asChild
                    className="w-full text-white hover:opacity-90 shadow-md gap-2"
                    size="lg"
                    style={secondaryColor ? { backgroundColor: secondaryColor } : { backgroundColor: '#22c55e' }}
                  >
                    <a href={buildWaLink(property.contact.phone, waMessage)} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="h-5 w-5" /> Falar no WhatsApp
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <footer className="border-t mt-12 py-6 bg-background/70 backdrop-blur-sm">
        <div className="container mx-auto px-4 max-w-6xl flex items-center justify-center gap-3 text-xs text-muted-foreground">
          {brandLogo && (
            <img src={brandLogo} alt={brandName || 'Logo'} className="h-6 w-auto object-contain opacity-70" />
          )}
          <span>Anúncio publicado no Portal de Imóveis</span>
        </div>
      </footer>
    </div>
  );
};

export default PublicPropertyLP;
