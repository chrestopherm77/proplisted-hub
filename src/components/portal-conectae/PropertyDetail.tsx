import { useMemo, useState } from 'react';
import { PropertyGallery } from '@/components/portal/PropertyGallery';
import { PropertyMap } from '@/components/portal/PropertyMap';
import { formatPrice, getOperationLabel } from '@/lib/propertyUtils';
import { statusLabel, typeLabel } from './types';
import { PropertyCard } from './PropertyCard';
import { InterestDialog } from './InterestDialog';
import { useFavorites } from './useFavorites';
import { ArrowLeft, MapPin, Share2, Facebook, Link2, MessageCircle, Heart } from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

export function PropertyDetail({ property, all, onBack, onOpen }: { property: any; all: any[]; onBack: () => void; onOpen: (id: string) => void }) {
  const fav = useFavorites();
  const [openInterest, setOpenInterest] = useState(false);
  const price = property.price_sale ?? property.price_rent;

  const similar = useMemo(
    () => all.filter((p) => p.id !== property.id && p.property_type === property.property_type).slice(0, 4),
    [all, property]
  );

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/portal-conectae?imovel=${property.id}` : '';
  const shareTitle = `${typeLabel(property.property_type)} - ${formatPrice(price)} - Ref. ${property.reference_code ?? ''}`.trim();

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copiado!');
    } catch {
      toast.error('Não foi possível copiar');
    }
  };

  return (
    <div className="bg-[#fafaf5] min-h-screen">
      <div className="container mx-auto px-4 py-4">
        <button onClick={onBack} className="text-sm flex items-center gap-1 mb-3 hover:text-[var(--pc-accent-strong)]">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>

        <div className="relative max-w-4xl mx-auto">
          <div className="[&_.aspect-video]:max-h-[60vh] [&_.aspect-video]:md:max-h-[480px]">
            <PropertyGallery photos={property.photos || []} />
          </div>
          <div className="absolute top-3 left-3 flex flex-col gap-1">
            <span className="bg-black/80 text-white text-xs px-2 py-1 rounded">Ref.: {property.reference_code}</span>
            <span className="bg-black/80 text-white text-xs px-2 py-1 rounded">{(property.photos || []).length} fotos</span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-6">
          <div className="space-y-4">
            <div className="p-4 bg-white rounded shadow-sm flex items-center gap-6">
              <div>
                <p className="text-xs text-neutral-500">{getOperationLabel(property.operation_type)}</p>
                <p className="text-2xl font-bold text-[var(--pc-accent-strong)]">{formatPrice(price)}</p>
              </div>
              {property.area_total && (
                <div>
                  <p className="text-xs text-neutral-500">Área Total</p>
                  <p className="font-semibold">{property.area_total} m²</p>
                </div>
              )}
              <div>
                <p className="text-xs text-neutral-500">Situação</p>
                <p className="font-semibold">{statusLabel(property.status)}</p>
              </div>
            </div>

            <div className="hidden md:block bg-white rounded shadow-sm p-4">
              <p className="font-semibold">Gostou deste imóvel?</p>
              <p className="text-sm text-neutral-600 mt-1">
                Deixe seu nome e WhatsApp que um parceiro entra em contato com você sobre este imóvel.
              </p>
              <button
                onClick={() => setOpenInterest(true)}
                className="mt-3 w-full py-3 bg-[var(--pc-accent)] text-black font-semibold rounded"
              >
                Tenho interesse neste imóvel
              </button>
              <button
                onClick={() => fav.toggle(property.id)}
                className="mt-2 w-full py-2 border rounded text-sm flex items-center justify-center gap-2"
              >
                <Heart className={`h-4 w-4 text-red-500 ${fav.has(property.id) ? 'fill-red-500' : ''}`} />
                {fav.has(property.id) ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" className="mt-2 w-full py-2 border rounded text-sm flex items-center justify-center gap-2 hover:bg-neutral-50">
                    <Share2 className="h-4 w-4" /> Compartilhar
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank', 'noopener,noreferrer')}>
                    <Facebook className="h-4 w-4 mr-2" /> Facebook
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`${shareTitle}\n${shareUrl}`)}`, '_blank', 'noopener,noreferrer')}>
                    <MessageCircle className="h-4 w-4 mr-2" /> WhatsApp
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={copyLink}>
                    <Link2 className="h-4 w-4 mr-2" /> Copiar link
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="bg-white rounded shadow-sm p-4">
              <h3 className="font-semibold mb-2 border-b pb-2">Ficha do imóvel</h3>
              <dl className="text-sm space-y-1">
                <Row label="Perfil" value={typeLabel(property.property_type)} />
                <Row label="Situação" value={statusLabel(property.status)} />
                {property.bedrooms != null && <Row label="Quartos" value={property.bedrooms} />}
                {property.suites != null && <Row label="Suítes" value={property.suites} />}
                {property.bathrooms != null && <Row label="Banheiros" value={property.bathrooms} />}
                {property.parking_spots != null && <Row label="Vagas" value={property.parking_spots} />}
                {property.area_total && <Row label="Área Total" value={`${property.area_total} m²`} />}
                {property.area_useful && <Row label="Área Útil" value={`${property.area_useful} m²`} />}
              </dl>
            </div>
          </div>

          <div className="md:col-span-2 space-y-4">
            <div className="bg-white rounded shadow-sm p-4">
              <h3 className="font-semibold mb-2">Descrição do imóvel</h3>
              <p className="text-sm whitespace-pre-line text-neutral-700">{property.additional_info || property.title || 'Sem descrição.'}</p>
            </div>
            <div className="bg-white rounded shadow-sm p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-1"><MapPin className="h-4 w-4" /> Localização</h3>
              <p className="text-sm text-neutral-700">{[property.neighborhood, `${property.city}/${property.state}`].filter(Boolean).join(' - ')}</p>
              {property.latitude && property.longitude && (
                <div className="mt-3 h-72 rounded overflow-hidden">
                  <PropertyMap properties={[property]} />
                </div>
              )}
            </div>
          </div>
        </div>

        {similar.length > 0 && (
          <div className="mt-12 pb-28 md:pb-12">
            <h2 className="text-2xl font-light text-center mb-6">Imóveis similares</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {similar.map((p) => (
                <PropertyCard key={p.id} property={p} isFav={fav.has(p.id)} onFav={() => fav.toggle(p.id)} onOpen={() => onOpen(p.id)} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Barra fixa mobile */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t p-3 flex gap-2">
        <button onClick={() => fav.toggle(property.id)} className="px-4 border rounded" aria-label="Favoritar">
          <Heart className={`h-5 w-5 text-red-500 ${fav.has(property.id) ? 'fill-red-500' : ''}`} />
        </button>
        <button onClick={() => setOpenInterest(true)} className="flex-1 py-3 bg-[var(--pc-accent)] text-black font-bold rounded">
          Tenho interesse neste imóvel
        </button>
      </div>

      <InterestDialog open={openInterest} onOpenChange={setOpenInterest} property={property} onExplore={onBack} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex justify-between border-b py-1">
      <dt className="text-neutral-500">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
