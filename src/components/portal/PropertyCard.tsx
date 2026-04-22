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

  return (
    <Link to={`/portal-imoveis/${property.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col">
        <div className="relative aspect-[4/3] bg-muted overflow-hidden">
          {cover ? (
            <img
              src={cover}
              alt={property.title || 'Imóvel'}
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

        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-semibold text-base line-clamp-1">
            {property.title || getPropertyTypeLabel(property.property_type)}
          </h3>

          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">
              {property.neighborhood ? `${property.neighborhood}, ` : ''}
              {property.zone ? `Zona ${property.zone}, ` : ''}
              {property.city}
              {property.state ? `/${property.state}` : ''}
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <Home className="h-3 w-3" />
            <span>{getPropertyTypeLabel(property.property_type)}</span>
          </div>

          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-2">
            {property.bedrooms ? (
              <span className="flex items-center gap-1">
                <BedDouble className="h-3 w-3" />
                {property.bedrooms}
              </span>
            ) : null}
            {property.parking_spots ? (
              <span className="flex items-center gap-1">
                <Car className="h-3 w-3" />
                {property.parking_spots}
              </span>
            ) : null}
            {property.area_useful ? (
              <span className="flex items-center gap-1">
                <Ruler className="h-3 w-3" />
                {property.area_useful}m²
              </span>
            ) : null}
          </div>

          <div className="mt-auto pt-3">
            <p className="text-lg font-bold text-primary">
              {price ? formatPrice(price) : 'Sob consulta'}
              {price && priceLabel ? <span className="text-xs font-normal text-muted-foreground"> {priceLabel}</span> : null}
            </p>
          </div>
        </div>
      </Card>
    </Link>
  );
}
