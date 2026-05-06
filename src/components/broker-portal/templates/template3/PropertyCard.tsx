import { Heart, MapPin, BedDouble, Car, Ruler } from 'lucide-react';
import { getCoverPhoto, formatPrice } from '@/lib/propertyUtils';
import { statusLabel } from '../template1/types';

export function PropertyCard({ property, isFav, onFav, onOpen }: { property: any; isFav: boolean; onFav: () => void; onOpen: () => void }) {
  const cover = getCoverPhoto(property.photos || []);
  const price = property.price_sale ?? property.price_rent;
  return (
    <div className="bg-white rounded-md shadow-sm border border-neutral-200 overflow-hidden flex flex-col cursor-pointer hover:shadow-lg transition-shadow" onClick={onOpen}>
      <div className="relative aspect-[4/3] bg-muted">
        {cover ? <img src={cover} alt={property.title || ''} className="w-full h-full object-cover" /> : null}
        <div className="absolute top-2 left-2">
          <span className="text-white text-[11px] font-semibold px-2.5 py-1 rounded" style={{ background: 'var(--bp-accent)' }}>{statusLabel(property.status)}</span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onFav(); }}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:scale-110 transition"
          aria-label="favoritar"
        >
          <Heart className={`h-4 w-4 ${isFav ? 'fill-red-500 text-red-500' : 'text-neutral-500'}`} />
        </button>
      </div>
      <div className="p-3 flex-1 flex flex-col text-neutral-800">
        <h3 className="font-semibold text-sm line-clamp-2">{property.title || `Ref. ${property.reference_code}`}</h3>
        <p className="text-xs text-neutral-500 flex items-center gap-1 mt-1"><MapPin className="h-3 w-3" />{property.neighborhood ? `${property.neighborhood} · ` : ''}{property.city}/{property.state}</p>
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-neutral-600">
          {property.bedrooms != null && (
            <span className="flex items-center gap-1"><BedDouble className="h-3 w-3" />{property.bedrooms}{property.suites ? ` suítes` : ''}</span>
          )}
          {property.parking_spots != null && (
            <span className="flex items-center gap-1"><Car className="h-3 w-3" />{property.parking_spots}</span>
          )}
          {property.area_total && (
            <span className="flex items-center gap-1"><Ruler className="h-3 w-3" />{property.area_total} m²</span>
          )}
        </div>
        <div className="mt-3">
          <span className="font-bold text-base" style={{ color: 'var(--bp-accent)' }}>{formatPrice(price)}</span>
        </div>
      </div>
    </div>
  );
}
