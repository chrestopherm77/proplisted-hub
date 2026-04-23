import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ImageIcon, MapPin } from 'lucide-react';
import {
  getPropertyTypeLabel,
  getOperationLabel,
  formatPrice,
  getCoverPhoto,
  type PropertyPhoto,
} from '@/lib/propertyUtils';

// Fix default leaflet marker icons (Vite path issue)
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: () => string })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export interface MapProperty {
  id: string;
  reference_code: string;
  title: string | null;
  property_type: string;
  operation_type: string;
  city: string;
  state: string | null;
  neighborhood: string | null;
  zone?: string | null;
  price_sale: number | null;
  price_rent: number | null;
  photos: unknown;
  latitude: number | null;
  longitude: number | null;
}

interface PropertyMapProps {
  properties: MapProperty[];
}

// Cluster wrapper using leaflet.markercluster directly
function ClusterLayer({ properties }: { properties: MapProperty[] }) {
  const map = useMap();
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);

  useEffect(() => {
    const cluster = (L as unknown as {
      markerClusterGroup: (opts: Record<string, unknown>) => L.MarkerClusterGroup;
    }).markerClusterGroup({
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      maxClusterRadius: 50,
    });

    properties.forEach((p) => {
      if (p.latitude == null || p.longitude == null) return;
      const photos = Array.isArray(p.photos) ? (p.photos as PropertyPhoto[]) : [];
      const cover = getCoverPhoto(photos);
      const typeLabel = getPropertyTypeLabel(p.property_type);
      const cityLabel = `${p.city}${p.state ? `/${p.state}` : ''}`;
      const title = `${typeLabel} em ${cityLabel}`;
      const price = p.operation_type === 'RENT' ? p.price_rent : p.price_sale;
      const priceSuffix = p.operation_type === 'RENT' ? '/mês' : '';

      const marker = L.marker([p.latitude, p.longitude]);
      const popupHtml = `
        <div style="width:220px;font-family:inherit">
          ${cover ? `<img src="${cover}" alt="${title}" style="width:100%;height:120px;object-fit:cover;border-radius:6px;margin-bottom:8px"/>` : ''}
          <div style="font-weight:700;font-size:14px;line-height:1.2;margin-bottom:4px">${title}</div>
          <div style="font-size:11px;color:#6b7280;margin-bottom:6px">
            ${p.neighborhood ? p.neighborhood : ''}${p.neighborhood && p.zone ? ' · ' : ''}${p.zone ? `Zona ${p.zone}` : ''}
          </div>
          <div style="font-size:16px;font-weight:700;color:hsl(var(--primary, 0 0% 9%));margin-bottom:8px">
            ${price ? formatPrice(price) : 'Sob consulta'}<span style="font-size:11px;font-weight:400;color:#6b7280"> ${priceSuffix}</span>
          </div>
          <a href="/portal-imoveis/${p.id}" style="display:block;text-align:center;background:hsl(var(--primary));color:hsl(var(--primary-foreground));padding:6px 10px;border-radius:6px;font-size:12px;font-weight:600;text-decoration:none">Ver detalhes</a>
        </div>
      `;
      marker.bindPopup(popupHtml);
      cluster.addLayer(marker);
    });

    map.addLayer(cluster);
    clusterRef.current = cluster;

    return () => {
      map.removeLayer(cluster);
      clusterRef.current = null;
    };
  }, [map, properties]);

  return null;
}

// Tracks viewport bounds to display "X imóveis nesta área"
function ViewportCounter({
  properties,
  onCountChange,
}: {
  properties: MapProperty[];
  onCountChange: (n: number) => void;
}) {
  const map = useMap();

  useEffect(() => {
    const update = () => {
      const bounds = map.getBounds();
      const visible = properties.filter(
        (p) => p.latitude != null && p.longitude != null && bounds.contains([p.latitude, p.longitude]),
      );
      onCountChange(visible.length);
    };
    update();
    map.on('moveend', update);
    map.on('zoomend', update);
    return () => {
      map.off('moveend', update);
      map.off('zoomend', update);
    };
  }, [map, properties, onCountChange]);

  return null;
}

export function PropertyMap({ properties }: PropertyMapProps) {
  const geocoded = useMemo(
    () => properties.filter((p) => p.latitude != null && p.longitude != null),
    [properties],
  );

  const [visibleCount, setVisibleCount] = useState(geocoded.length);

  const center = useMemo<[number, number]>(() => {
    if (geocoded.length === 0) return [-15.78, -47.93]; // Brasília
    const lat = geocoded.reduce((s, p) => s + (p.latitude ?? 0), 0) / geocoded.length;
    const lng = geocoded.reduce((s, p) => s + (p.longitude ?? 0), 0) / geocoded.length;
    return [lat, lng];
  }, [geocoded]);

  const zoom = geocoded.length === 0 ? 4 : geocoded.length === 1 ? 14 : 11;

  const missing = properties.length - geocoded.length;

  return (
    <div className="relative z-0">
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] flex flex-col items-center gap-1 pointer-events-none">
        <Badge className="bg-background/95 text-foreground border shadow-md pointer-events-auto">
          <MapPin className="h-3.5 w-3.5 mr-1 text-primary" />
          {visibleCount} {visibleCount === 1 ? 'imóvel' : 'imóveis'} nesta área
        </Badge>
        {missing > 0 && (
          <Badge variant="secondary" className="text-[10px] pointer-events-auto">
            {missing} sem localização exata
          </Badge>
        )}
      </div>

      <Card className="overflow-hidden">
        <div style={{ height: '70vh', minHeight: 480, width: '100%' }}>
          <MapContainer
            center={center}
            zoom={zoom}
            scrollWheelZoom
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ClusterLayer properties={geocoded} />
            <ViewportCounter properties={geocoded} onCountChange={setVisibleCount} />
          </MapContainer>
        </div>
      </Card>

      {geocoded.length === 0 && (
        <div className="text-center text-sm text-muted-foreground mt-3">
          Nenhum imóvel com localização cadastrada ainda.{' '}
          <span className="block text-xs mt-1">
            Imóveis recém-publicados podem levar alguns segundos para aparecer no mapa.
          </span>
        </div>
      )}
    </div>
  );
}
