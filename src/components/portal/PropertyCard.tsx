import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Home, BedDouble, Car, Ruler, ImageIcon } from 'lucide-react';
import {
  getPropertyTypeLabel,
  getOperationLabel,
  formatPrice,
  getCoverPhoto,
  type PropertyPhoto,
} from '@/lib/propertyUtils';

interface PropertyCardProps {
  property: {
    id: string;
    reference_code: string;
    title: string | null;
    property_type: string;
    operation_type: string;
    city: string;
    state: string | null;
    neighborhood: string | null;
    zone?: string | null;
    bedrooms: number | null;
    parking_spots: number | null;
    area_useful: number | null;
    price_sale: number | null;
    price_rent: number | null;
    photos: PropertyPhoto[] | unknown;
  };
}

export function PropertyCard({ property }: PropertyCardProps) {
  const photos = Array.isArray(property.photos) ? (property.photos as PropertyPhoto[]) : [];
  const cover = getCoverPhoto(photos);
  const price = property.operation_type === 'RENT' ? property.price_rent : property.price_sale;
  const priceLabel = property.operation_type === 'RENT' ? '/mês' : '';

  const typeLabel = getPropertyTypeLabel(property.property_type);
  const cityLabel = `${property.city}${property.state ? `/${property.state}` : ''}`;
  const cardTitle = `${typeLabel} em ${cityLabel}`;

  return (
    <Link to={`/portal-imoveis/${property.id}`}>
      <Card className="overflow-hidden hover:shadow-xl transition-shadow cursor-pointer h-full flex flex-col">
        <div className="relative aspect-[4/3] bg-muted overflow-hidden">
          {cover ? (
            <img
              src={cover}
              alt={cardTitle}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <ImageIcon className="h-12 w-12" />
            </div>
          )}
          <Badge className="absolute top-2 left-2 bg-background/90 text-foreground hover:bg-background/90">
            Ref: {property.reference_code}
          </Badge>
          <Badge className="absolute top-2 right-2" variant="secondary">
            {getOperationLabel(property.operation_type)}
          </Badge>
        </div>

        <div className="p-4 flex flex-col flex-1 gap-2">
          <h3 className="font-bold text-base sm:text-lg line-clamp-2 leading-tight">
            {cardTitle}
          </h3>

          <div className="flex items-start gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span className="line-clamp-2">
              {property.neighborhood ? `${property.neighborhood}` : ''}
              {property.neighborhood && property.zone ? ' · ' : ''}
              {property.zone ? `Zona ${property.zone}` : ''}
              {(property.neighborhood || property.zone) ? ' · ' : ''}
              {cityLabel}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1 mt-1 py-2 border-y border-border/60 bg-muted/30 rounded-md">
            <div className="flex flex-col items-center gap-0.5">
              <BedDouble className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold">{property.bedrooms ?? '—'}</span>
              <span className="text-[10px] text-muted-foreground leading-none">quartos</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 border-x border-border/60">
              <Car className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold">{property.parking_spots ?? '—'}</span>
              <span className="text-[10px] text-muted-foreground leading-none">vagas</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <Ruler className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold">{property.area_useful ? `${property.area_useful}` : '—'}</span>
              <span className="text-[10px] text-muted-foreground leading-none">m² úteis</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Home className="h-3.5 w-3.5" />
            <span className="font-medium">{typeLabel}</span>
          </div>

          <div className="mt-auto pt-2 border-t border-border/60">
            <p className="text-xl font-bold text-primary leading-tight">
              {price ? formatPrice(price) : 'Sob consulta'}
              {price && priceLabel ? (
                <span className="text-xs font-normal text-muted-foreground"> {priceLabel}</span>
              ) : null}
            </p>
          </div>
        </div>
      </Card>
    </Link>
  );
}
