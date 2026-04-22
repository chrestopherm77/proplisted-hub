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
import {
  getPropertyTypeLabel, getOperationLabel, getStatusLabel, formatPrice,
  type PropertyPhoto,
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
  const amenities: string[] = Array.isArray(property.amenities) ? (property.amenities as string[]) : [];
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
      <header className="border-b bg-card/90 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 max-w-5xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            {brandLogo ? (
              <img src={brandLogo} alt={brandName || 'Logo'} className="h-8 w-auto object-contain" />
            ) : (
              <Building2 className="h-6 w-6" style={primaryColor ? { color: primaryColor } : undefined} />
            )}
            <span className="font-bold text-lg">{brandName || 'Imóvel'}</span>
          </div>
          <Badge variant="secondary">Ref: {property.reference_code}</Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-5xl">
        <div className="bg-background/85 backdrop-blur-sm rounded-lg p-3 sm:p-4">
          <PropertyGallery photos={photos} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-card/95 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h1 className="text-2xl font-bold">{property.title}</h1>
                    <p className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
                      <MapPin className="h-4 w-4" />
                      {[property.address, property.neighborhood, property.zone ? `Zona ${property.zone}` : null, property.city].filter(Boolean).join(', ')}
                      {property.state ? `/${property.state}` : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className="text-2xl font-bold"
                      style={primaryColor ? { color: primaryColor } : undefined}
                    >
                      {price ? formatPrice(price) : 'Sob consulta'}
                    </p>
                    <p className="text-xs text-muted-foreground">{getOperationLabel(property.operation_type)}</p>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="flex flex-wrap gap-4 text-sm">
                  <span className="flex items-center gap-1.5"><Home className="h-4 w-4 text-muted-foreground" /> {getPropertyTypeLabel(property.property_type)}</span>
                  {property.bedrooms ? <span className="flex items-center gap-1.5"><BedDouble className="h-4 w-4 text-muted-foreground" /> {property.bedrooms} quartos{property.suites ? ` (${property.suites} suíte${property.suites > 1 ? 's' : ''})` : ''}</span> : null}
                  {property.bathrooms ? <span className="flex items-center gap-1.5"><Bath className="h-4 w-4 text-muted-foreground" /> {property.bathrooms} banheiros</span> : null}
                  {property.parking_spots ? <span className="flex items-center gap-1.5"><Car className="h-4 w-4 text-muted-foreground" /> {property.parking_spots} vagas</span> : null}
                  {property.area_useful ? <span className="flex items-center gap-1.5"><Ruler className="h-4 w-4 text-muted-foreground" /> {property.area_useful}m² útil</span> : null}
                  {property.area_total ? <span className="flex items-center gap-1.5"><Ruler className="h-4 w-4 text-muted-foreground" /> {property.area_total}m² total</span> : null}
                </div>

                {(property.condo_fee || property.iptu) && (
                  <div className="flex flex-wrap gap-4 text-sm mt-3 text-muted-foreground">
                    {property.condo_fee ? <span>Condomínio: {formatPrice(property.condo_fee)}</span> : null}
                    {property.iptu ? <span>IPTU: {formatPrice(property.iptu)}</span> : null}
                  </div>
                )}

                {property.status && (
                  <div className="mt-3"><Badge variant="outline">{getStatusLabel(property.status)}</Badge></div>
                )}
              </CardContent>
            </Card>

            {amenities.length > 0 && (
              <Card className="bg-card/95 backdrop-blur-sm">
                <CardHeader><CardTitle className="text-lg">Comodidades</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {amenities.map((a) => <Badge key={a} variant="secondary">{a}</Badge>)}
                  </div>
                </CardContent>
              </Card>
            )}

            {property.additional_info && (
              <Card className="bg-card/95 backdrop-blur-sm">
                <CardHeader><CardTitle className="text-lg">Informações adicionais</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{property.additional_info}</p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-4">
            <Card
              className="lg:sticky lg:top-4 bg-card/95 backdrop-blur-sm"
              style={primaryColor ? { borderColor: primaryColor, borderWidth: 2 } : undefined}
            >
              <CardHeader>
                <CardTitle className="text-base">Fale com o corretor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(brandLogo || brandName) && (
                  <div className="flex items-center gap-2 pb-3 border-b">
                    {brandLogo && (
                      <img src={brandLogo} alt={brandName || 'Logo'} className="h-10 w-10 object-contain rounded" />
                    )}
                    {brandName && <span className="font-semibold text-sm">{brandName}</span>}
                  </div>
                )}
                <div>
                  <p className="font-semibold">{property.contact.name || 'Anunciante'}</p>
                  {property.contact.creci && (
                    <p className="text-xs text-muted-foreground">
                      CRECI {property.contact.creci}{property.contact.creci_uf ? `/${property.contact.creci_uf}` : ''}
                    </p>
                  )}
                </div>
                {property.contact.phone && (
                  <Button
                    asChild
                    className="w-full text-white hover:opacity-90"
                    size="lg"
                    style={secondaryColor ? { backgroundColor: secondaryColor } : { backgroundColor: '#22c55e' }}
                  >
                    <a href={buildWaLink(property.contact.phone, waMessage)} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="h-4 w-4" /> Falar no WhatsApp
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <footer className="border-t mt-12 py-6 text-center text-xs text-muted-foreground bg-background/70 backdrop-blur-sm">
        Anúncio publicado no Portal de Imóveis
      </footer>
    </div>
  );
};

export default PublicPropertyLP;
