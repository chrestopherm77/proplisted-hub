import { Heart, MapPin } from 'lucide-react';
import { getCoverPhoto, formatPrice, getOperationLabel } from '@/lib/propertyUtils';
import { statusLabel } from '@/components/portal-conectae/types';

export function PropertyCardV2({
  property,
  isFav,
  onFav,
  onOpen,
}: {
  property: any;
  isFav: boolean;
  onFav: () => void;
  onOpen: () => void;
}) {
  const cover = getCoverPhoto(property.photos || []);
  const price = property.price_sale ?? property.price_rent;

  return (
    <article
      onClick={onOpen}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-[18px] bg-white shadow-[var(--v2-shadow-card)] transition-shadow hover:shadow-[0_18px_40px_hsl(var(--v2-navy)/0.14)]"
    >
      <div className="relative h-[200px] bg-[hsl(var(--v2-bg-2))]">
        {cover && (
          <img
            src={cover}
            alt={property.title || `Imóvel em ${property.city}`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        )}
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-[hsl(var(--v2-green))] px-3 py-1 text-[11px] font-bold text-white">
            {statusLabel(property.status)}
          </span>
          <span className="rounded-full bg-[hsl(var(--v2-navy)/0.75)] px-3 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
            {getOperationLabel(property.operation_type)}
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFav();
          }}
          aria-label="Favoritar imóvel"
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-[hsl(var(--v2-blue))] transition hover:scale-105"
        >
          <Heart className={`h-4 w-4 ${isFav ? 'fill-[hsl(var(--v2-green))] text-[hsl(var(--v2-green))]' : ''}`} strokeWidth={2} />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <span className="text-[11px] font-bold uppercase tracking-wide text-[hsl(var(--v2-meta))]">
          Ref. {property.reference_code}
        </span>
        <p className="mt-1.5 flex items-center gap-1.5 text-[13px] text-[hsl(var(--v2-body))]">
          <MapPin className="h-3.5 w-3.5 text-[hsl(var(--v2-cyan))]" strokeWidth={2} />
          {property.neighborhood ? `${property.neighborhood} · ` : ''}
          {property.city}/{property.state}
        </p>
        <h3 className="mt-2 line-clamp-2 font-display text-[15px] font-bold text-[hsl(var(--v2-ink))]">
          {property.title || `Imóvel ref. ${property.reference_code}`}
        </h3>

        <div className="mt-3 flex flex-wrap gap-3 text-[12px] text-[hsl(var(--v2-body))]">
          {property.area_total ? <span>{property.area_total} m²</span> : null}
          {property.bedrooms ? <span>{property.bedrooms} quartos</span> : null}
          {property.parking_spaces ? <span>{property.parking_spaces} vagas</span> : null}
        </div>

        <div className="mt-auto pt-4">
          <span className="font-display text-[20px] font-extrabold text-[hsl(var(--v2-blue))]">
            {formatPrice(price)}
          </span>
        </div>
      </div>
    </article>
  );
}
