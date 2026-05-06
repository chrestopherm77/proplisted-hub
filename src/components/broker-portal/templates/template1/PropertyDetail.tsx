import { useState, useMemo } from 'react';
import { BrokerPortal } from '@/hooks/useBrokerPortal';
import { PropertyGallery } from '@/components/portal/PropertyGallery';
import { PropertyMap } from '@/components/portal/PropertyMap';
import { formatPrice, getOperationLabel } from '@/lib/propertyUtils';
import { statusLabel } from './types';
import { PropertyCard } from './PropertyCard';
import { useFavorites } from './useFavorites';
import { ArrowLeft, Phone, Copy, MapPin } from 'lucide-react';
import { toast } from 'sonner';

export function PropertyDetail({ portal, property, all, onBack, onOpen }: { portal: BrokerPortal; property: any; all: any[]; onBack: () => void; onOpen: (id: string) => void }) {
  const b = portal.branding ?? {};
  const fav = useFavorites(portal.slug);
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: 'Olá, estou interessado nesse imóvel que encontrei no site. Aguardo seu retorno.' });

  const price = property.price_sale ?? property.price_rent;

  const similar = useMemo(
    () => all.filter((p) => p.id !== property.id && p.property_type === property.property_type).slice(0, 4),
    [all, property]
  );

  const sendWhats = () => {
    if (!b.whatsapp) return toast.error('WhatsApp não configurado');
    const text = `${form.message}\n\nImóvel Ref: ${property.reference_code}\nNome: ${form.name}\nTelefone: ${form.phone}`;
    window.open(`https://wa.me/${String(b.whatsapp).replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const sendEmail = () => {
    if (!b.email) return toast.error('E-mail não configurado');
    const subject = `Interesse no imóvel Ref: ${property.reference_code}`;
    const body = `${form.message}\n\nNome: ${form.name}\nTelefone: ${form.phone}\nEmail: ${form.email}`;
    window.open(`mailto:${b.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const copyEmail = () => { if (b.email) { navigator.clipboard.writeText(b.email); toast.success('E-mail copiado'); } };

  return (
    <div className="bg-[#fafaf5]">
      <div className="container mx-auto px-4 py-4">
        <button onClick={onBack} className="text-sm flex items-center gap-1 mb-3 hover:text-[var(--bp-accent-strong)]">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>
        <div className="relative">
          <PropertyGallery photos={property.photos || []} />
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
                <p className="text-2xl font-bold text-[var(--bp-accent-strong)]">{formatPrice(price)}</p>
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

            <button className="w-full py-3 bg-[var(--bp-accent)] text-black font-semibold rounded">Agendar visita</button>

            <div className="bg-white rounded shadow-sm p-4">
              <h3 className="font-semibold mb-2 border-b pb-2">Ficha do imóvel</h3>
              <dl className="text-sm space-y-1">
                <Row label="Perfil" value={property.property_type} />
                <Row label="Situação" value={statusLabel(property.status)} />
                {property.bedrooms != null && <Row label="Quartos" value={property.bedrooms} />}
                {property.bathrooms != null && <Row label="Banheiros" value={property.bathrooms} />}
                {property.parking_spots != null && <Row label="Vagas" value={property.parking_spots} />}
                {property.area_total && <Row label="Área Total" value={`${property.area_total} m²`} />}
                {property.area_useful && <Row label="Área Útil" value={`${property.area_useful} m²`} />}
              </dl>
            </div>

            <div className="bg-white rounded shadow-sm p-4">
              <p className="font-semibold">{portal.seo?.title || 'Imobiliária'}</p>
              {b.creci && <p className="text-xs text-neutral-500">CRECI - {b.creci}</p>}
              {b.whatsapp && (
                <a href={`https://wa.me/${String(b.whatsapp).replace(/\D/g, '')}`} className="flex items-center gap-2 text-[var(--bp-accent-strong)] mt-2 text-sm">
                  <Phone className="h-4 w-4" /> {b.whatsapp}
                </a>
              )}
              {b.email && (
                <button onClick={copyEmail} className="flex items-center gap-1 text-sm mt-1"><Copy className="h-3 w-3" /> {b.email}</button>
              )}

              <div className="mt-4 space-y-2">
                <input className="w-full border rounded px-3 py-2 text-sm" placeholder="Seu nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <input className="w-full border rounded px-3 py-2 text-sm" placeholder="Seu telefone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                <input className="w-full border rounded px-3 py-2 text-sm" placeholder="Seu email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                <textarea className="w-full border rounded px-3 py-2 text-sm" rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={sendWhats} className="py-2 bg-green-500 text-white font-semibold rounded text-sm">WhatsApp</button>
                  <button onClick={sendEmail} className="py-2 bg-[var(--bp-accent)] text-black font-semibold rounded text-sm">E-mail</button>
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 space-y-4">
            <div className="bg-white rounded shadow-sm p-4">
              <h3 className="font-semibold mb-2">Descrição do imóvel</h3>
              <p className="text-sm whitespace-pre-line text-neutral-700">{property.additional_info || 'Sem descrição.'}</p>
            </div>
            <div className="bg-white rounded shadow-sm p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-1"><MapPin className="h-4 w-4" /> Localização</h3>
              <p className="text-sm text-neutral-700">{[property.address, property.neighborhood, `${property.city}/${property.state}`].filter(Boolean).join(' - ')}</p>
              {property.latitude && property.longitude && (
                <div className="mt-3 h-72 rounded overflow-hidden">
                  <PropertyMap properties={[property]} height="100%" />
                </div>
              )}
            </div>
          </div>
        </div>

        {similar.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-light text-center mb-6">Imóveis similares</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {similar.map((p) => (
                <PropertyCard key={p.id} property={p} isFav={fav.has(p.id)} onFav={() => fav.toggle(p.id)} onOpen={() => onOpen(p.id)} />
              ))}
            </div>
          </div>
        )}
      </div>
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
