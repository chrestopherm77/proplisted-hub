import { Heart, MapPin, BedDouble, Car, Ruler } from 'lucide-react';
import { getCoverPhoto, formatPrice, getOperationLabel } from '@/lib/propertyUtils';
import { statusLabel } from '../template1/types';

export function PropertyCard({ property, isFav, onFav, onOpen }: { property: any; isFav: boolean; onFav: () => void; onOpen: () => void }) {
  const cover = getCoverPhoto(property.photos || []);
  const price = property.price_sale ?? property.price_rent;
  return (
    <div className="bg-white rounded-md shadow border border-neutral-200 overflow-hidden flex flex-col cursor-pointer hover:shadow-lg transition-shadow" onClick={onOpen}>
      <div className="text-white text-xs text-center py-1.5 font-semibold tracking-wider" style={{ background: 'var(--bp-accent)' }}>
        {statusLabel(property.status)}
      </div>
      <div className="relative aspect-[4/3] bg-muted">
        {cover ? <img src={cover} alt={property.title || ''} className="w-full h-full object-cover" /> : null}
        <div className="absolute bottom-2 left-2 flex gap-1">
          <span className="bg-black/80 text-white text-[10px] px-2 py-0.5 rounded">Ref.: {property.reference_code}</span>
          <span className="text-white text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: 'var(--bp-accent-strong)' }}>{getOperationLabel(property.operation_type)?.toUpperCase()}</span>
        </div>
      </div>
      <div className="p-3 flex-1 flex flex-col text-neutral-800">
        <p className="text-xs text-neutral-500 flex items-center gap-1"><MapPin className="h-3 w-3" style={{ color: 'var(--bp-accent)' }} />{property.neighborhood ? `${property.neighborhood} - ` : ''}{property.city}/{property.state}</p>
        <h3 className="font-semibold text-sm mt-1 line-clamp-2">{property.title || `Ref. ${property.reference_code}`}</h3>
        <div className="mt-3 space-y-1 text-xs text-neutral-600">
          {property.bedrooms != null && (
            <div className="flex justify-between"><span className="flex items-center gap-1"><BedDouble className="h-3 w-3" />Dormitórios</span><span className="font-semibold text-neutral-800">{property.bedrooms}{property.suites ? `, sendo ${property.suites} suíte${property.suites > 1 ? 's' : ''}` : ''}</span></div>
          )}
          {property.parking_spots != null && (
            <div className="flex justify-between"><span className="flex items-center gap-1"><Car className="h-3 w-3" />Garagens</span><span className="font-semibold text-neutral-800">{property.parking_spots}</span></div>
          )}
          {property.area_total && (
            <div className="flex justify-between"><span className="flex items-center gap-1"><Ruler className="h-3 w-3" />Área Privativa</span><span className="font-semibold text-neutral-800">{property.area_total}m²</span></div>
          )}
        </div>
        <div className="border-t mt-3 pt-2 flex items-center justify-between">
          <span className="font-bold text-base" style={{ color: 'var(--bp-accent-strong)' }}>{formatPrice(price)}</span>
          <button onClick={(e) => { e.stopPropagation(); onFav(); }} className="text-red-500 hover:scale-110 transition" aria-label="favoritar">
            <Heart className={`h-5 w-5 ${isFav ? 'fill-red-500' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
