import { Heart, MapPin } from 'lucide-react';
import { getCoverPhoto, formatPrice, getOperationLabel } from '@/lib/propertyUtils';
import { statusLabel } from './types';

export function PropertyCard({ property, isFav, onFav, onOpen }: { property: any; isFav: boolean; onFav: () => void; onOpen: () => void }) {
  const cover = getCoverPhoto(property.photos || []);
  const price = property.price_sale ?? property.price_rent;
  return (
    <div className="bg-white text-neutral-800 rounded shadow-sm overflow-hidden flex flex-col cursor-pointer hover:shadow-lg transition-shadow" onClick={onOpen}>
      <div className="relative">
        <div className="bg-black text-white text-xs text-center py-1.5">{statusLabel(property.status)}</div>
        <div className="aspect-[4/3] bg-muted">
          {cover ? <img src={cover} alt={property.title || 'Imóvel'} loading="lazy" className="w-full h-full object-cover" /> : null}
        </div>
        <div className="absolute bottom-2 left-2 flex gap-1">
          <span className="bg-black/80 text-white text-xs px-2 py-0.5 rounded">Ref.: {property.reference_code}</span>
          <span className="bg-[var(--pc-accent)] text-black text-xs font-semibold px-2 py-0.5 rounded">{getOperationLabel(property.operation_type)}</span>
        </div>
      </div>
      <div className="p-3 flex-1 flex flex-col">
        <p className="text-xs text-neutral-500 flex items-center gap-1"><MapPin className="h-3 w-3" />{property.neighborhood ? `${property.neighborhood} - ` : ''}{property.city}/{property.state}</p>
        <h3 className="font-semibold text-sm mt-1 line-clamp-2 uppercase">{property.title || `Ref. ${property.reference_code}`}</h3>
        {property.area_total && (
          <p className="text-xs text-neutral-500 mt-2">Área Total <span className="font-semibold text-neutral-800">{property.area_total}m²</span></p>
        )}
        <div className="border-t mt-3 pt-2 flex items-center justify-between">
          <span className="font-bold text-[var(--pc-accent-strong)]">{formatPrice(price)}</span>
          <button
            onClick={(e) => { e.stopPropagation(); onFav(); }}
            className="text-red-500 hover:scale-110 transition"
            aria-label="favoritar"
          >
            <Heart className={`h-5 w-5 ${isFav ? 'fill-red-500' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
