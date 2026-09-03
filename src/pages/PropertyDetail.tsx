import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft, MapPin, Loader2, Download, Megaphone, Link as LinkIcon,
  MessageCircle, BedDouble, Bath, Car, Ruler, Home, Trash2, Pencil,
  ExternalLink, Copy, ShieldCheck,
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { PropertyGallery } from '@/components/portal/PropertyGallery';
import { AmenitiesDisplay } from '@/components/portal/AmenitiesDisplay';
import {
  getPropertyTypeLabel, getOperationLabel, getStatusLabel, formatPrice,
  generateAffiliateToken, sortPhotos, normalizeAmenities, type PropertyPhoto,
} from '@/lib/propertyUtils';
import { buildWaLink } from '@/lib/whatsapp';
import JSZip from 'jszip';

interface Property {
  id: string;
  user_id: string;
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
  accept_affiliation: boolean;
  is_active: boolean;
}

interface OwnerProfile {
  name: string | null;
  email: string | null;
  phone: string | null;
  creci_number: string | null;
  creci: string | null;
  creci_uf: string | null;
  company_name: string | null;
}

const PropertyDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [property, setProperty] = useState<Property | null>(null);
  const [owner, setOwner] = useState<OwnerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [creatingLink, setCreatingLink] = useState(false);
  const [adminLinkOpen, setAdminLinkOpen] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/auth'); return; }
    if (!id) return;
    fetchProperty();
  }, [authLoading, user, id]);

  const fetchProperty = async () => {
    if (!id) return;
    setLoading(true);
    const { data, error } = await supabase.from('properties').select('*').eq('id', id).maybeSingle();
    if (error || !data) {
      toast({ title: 'Imóvel não encontrado', variant: 'destructive' });
      navigate('/portal-imoveis');
      return;
    }
    setProperty(data as Property);

    const { data: profile } = await supabase
      .from('profiles')
      .select('name, email, phone, creci_number, creci, creci_uf, company_name')
      .eq('id', data.user_id)
      .maybeSingle();
    if (profile) setOwner(profile as OwnerProfile);
    setLoading(false);
  };

  const isOwner = property?.user_id === user?.id;
  const photos: PropertyPhoto[] = Array.isArray(property?.photos) ? (property!.photos as PropertyPhoto[]) : [];
  const amenitiesNorm = normalizeAmenities(property?.amenities);
  const hasAmenities =
    !!amenitiesNorm.legacy?.length ||
    !!(amenitiesNorm.condo && Object.keys(amenitiesNorm.condo).length) ||
    !!(amenitiesNorm.property && Object.keys(amenitiesNorm.property).length);

  const handleDownloadPhotos = async () => {
    if (photos.length === 0) {
      toast({ title: 'Sem fotos para baixar', variant: 'destructive' });
      return;
    }
    setDownloading(true);
    try {
      const zip = new JSZip();
      const sorted = sortPhotos(photos);
      for (let i = 0; i < sorted.length; i++) {
        const res = await fetch(sorted[i].url);
        const blob = await res.blob();
        const ext = blob.type.split('/')[1] || 'jpg';
        zip.file(`foto-${String(i + 1).padStart(2, '0')}.${ext}`, blob);
      }
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${property?.reference_code || 'imovel'}-fotos.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({ title: 'Download iniciado!' });
    } catch (e) {
      console.error(e);
      toast({ title: 'Erro ao baixar fotos', variant: 'destructive' });
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyPublicLink = async () => {
    if (!property) return;
    let slug = property.reference_code;

    if (!isOwner && property.accept_affiliation && user) {
      // Get or create affiliate token for the current user
      const { data: existing } = await supabase
        .from('property_affiliates')
        .select('token')
        .eq('property_id', property.id)
        .eq('affiliate_user_id', user.id)
        .maybeSingle();

      let token = existing?.token;
      if (!token) {
        token = generateAffiliateToken();
        const { error } = await supabase.from('property_affiliates').insert({
          property_id: property.id,
          affiliate_user_id: user.id,
          token,
        });
        if (error) {
          console.error(error);
          toast({ title: 'Erro ao gerar link', variant: 'destructive' });
          return;
        }
      }
      slug = `${property.reference_code}-aff-${token}`;
    }

    const url = `${window.location.origin}/imovel/${slug}`;
    await navigator.clipboard.writeText(url);
    toast({ title: 'Link copiado!', description: url });
  };

  const publicOwnerLink = property
    ? `${window.location.origin}/imovel/${property.reference_code}`
    : '';

  const copyText = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    toast({ title: `${label} copiado!`, description: text });
  };

  // Mensagem formatada para compartilhar o imóvel no WhatsApp (modelo de grupo)
  const waShareMessage = property
    ? (() => {
        const price = property.price_sale ?? property.price_rent;
        const titleLine = property.title || `${getPropertyTypeLabel(property.property_type)} ${getOperationLabel(property.operation_type)}`;
        const locationParts = [property.neighborhood, property.city, property.state].filter(Boolean).join(' - ');
        const lines: string[] = [
          `*${titleLine}*`,
          publicOwnerLink,
          '',
        ];
        if (price) lines.push(`💰 *${formatPrice(price)}*`);
        lines.push(`📍 ${getPropertyTypeLabel(property.property_type)} ${getOperationLabel(property.operation_type).toLowerCase()} ${locationParts}`);
        if (property.bedrooms != null) lines.push(`🛏️ ${property.bedrooms} quartos${property.suites ? `, ${property.suites} suíte${property.suites > 1 ? 's' : ''}` : ''}`);
        if (property.bathrooms != null) lines.push(`🚿 ${property.bathrooms} banheiro${property.bathrooms > 1 ? 's' : ''}`);
        if (property.parking_spots != null) lines.push(`🚗 ${property.parking_spots} vaga${property.parking_spots > 1 ? 's' : ''}`);
        if (property.area_useful) lines.push(`📐 ${property.area_useful}m² área útil`);
        if (property.area_total) lines.push(`📏 ${property.area_total}m² área total`);
        if (property.condo_fee) lines.push(`🏢 Condomínio: ${formatPrice(property.condo_fee)}`);
        if (property.iptu) lines.push(`🧾 IPTU: ${formatPrice(property.iptu)}`);
        if (property.additional_info) {
          lines.push('', property.additional_info);
        }
        if (owner?.name) {
          lines.push('', `👤 *${owner.name}${owner.company_name ? ` — ${owner.company_name}` : ''}*`);
          const creci = owner.creci_number || owner.creci;
          if (creci) lines.push(`CRECI: ${creci}${owner.creci_uf ? `/${owner.creci_uf}` : ''}`);
          if (owner.phone) lines.push(`📞 ${owner.phone}`);
        }
        lines.push('', `Ref.: ${property.reference_code}`);
        return lines.join('\n');
      })()
    : '';

  const handleAnnounce = async () => {
    if (!property || !user) return;
    if (!property.accept_affiliation) {
      toast({ title: 'Este anúncio não aceita afiliação', variant: 'destructive' });
      return;
    }
    setCreatingLink(true);
    try {
      const { data: existing } = await supabase
        .from('property_affiliates')
        .select('token')
        .eq('property_id', property.id)
        .eq('affiliate_user_id', user.id)
        .maybeSingle();

      let token = existing?.token;
      if (!token) {
        token = generateAffiliateToken();
        const { error } = await supabase.from('property_affiliates').insert({
          property_id: property.id,
          affiliate_user_id: user.id,
          token,
        });
        if (error) {
          toast({ title: 'Erro ao criar afiliação', variant: 'destructive' });
          return;
        }
      }

      const url = `${window.location.origin}/imovel/${property.reference_code}-aff-${token}`;
      window.open(url, '_blank');
    } finally {
      setCreatingLink(false);
    }
  };

  const handleDelete = async () => {
    if (!property) return;
    if (!confirm('Tem certeza que deseja excluir este anúncio?')) return;
    const { error } = await supabase.from('properties').delete().eq('id', property.id);
    if (error) {
      toast({ title: 'Erro ao excluir', variant: 'destructive' });
      return;
    }
    toast({ title: 'Anúncio excluído' });
    navigate('/portal-imoveis');
  };

  if (loading || !property) {
    return (
      <Layout>
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  const price = property.operation_type === 'RENT' ? property.price_rent : property.price_sale;
  const waMessage = `Olá! Tenho interesse no imóvel Ref: ${property.reference_code}`;

  return (
    <Layout>
      <div
        className="min-h-screen bg-fixed bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/images/portal-bg.jpg)' }}
      >
        <div className="container mx-auto px-4 py-6 max-w-5xl">
          <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
            <Button variant="ghost" onClick={() => navigate('/portal-imoveis')} className="bg-background/80 backdrop-blur-sm">
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Button>
            <div className="flex items-center gap-2">
              {isOwner && (
                <Button
                  onClick={() => navigate(`/portal-imoveis/${property.id}/editar`)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Pencil className="h-4 w-4" /> Editar
                </Button>
              )}

              <Badge className="text-sm bg-foreground/80 text-background backdrop-blur-sm border-0">Ref: {property.reference_code}</Badge>
            </div>
          </div>

        <PropertyGallery photos={photos} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
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
                    <p className="text-2xl font-bold text-primary">{price ? formatPrice(price) : 'Sob consulta'}</p>
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

            {hasAmenities && (
              <Card>
                <CardHeader><CardTitle className="text-lg">Comodidades e Características</CardTitle></CardHeader>
                <CardContent>
                  <AmenitiesDisplay value={property.amenities} />
                </CardContent>
              </Card>
            )}

            {property.additional_info && (
              <Card>
                <CardHeader><CardTitle className="text-lg">Informações adicionais</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{property.additional_info}</p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Anunciado por</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-semibold">{owner?.name || owner?.company_name || 'Anunciante'}</p>
                  {(owner?.creci_number || owner?.creci) && (
                    <p className="text-xs text-muted-foreground">
                      CRECI {owner?.creci_number || owner?.creci}{owner?.creci_uf ? `/${owner.creci_uf}` : ''}
                    </p>
                  )}
                </div>
                {owner?.phone && (
                  <Button asChild className="w-full" size="lg">
                    <a href={buildWaLink(owner.phone, waMessage)} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="h-4 w-4" /> Falar no WhatsApp
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Ações</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" onClick={handleDownloadPhotos} disabled={downloading || photos.length === 0}>
                  {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Baixar fotos (.zip)
                </Button>
                {!isOwner && property.accept_affiliation && (
                  <Button variant="default" className="w-full justify-start" onClick={handleAnnounce} disabled={creatingLink}>
                    {creatingLink ? <Loader2 className="h-4 w-4 animate-spin" /> : <Megaphone className="h-4 w-4" />}
                    Anunciar este imóvel
                  </Button>
                )}
                <Button variant="outline" className="w-full justify-start" onClick={handleCopyPublicLink}>
                  <LinkIcon className="h-4 w-4" /> Copiar link público
                </Button>
                {isAdmin && (
                  <Button variant="secondary" className="w-full justify-start" onClick={() => setAdminLinkOpen(true)}>
                    <ShieldCheck className="h-4 w-4" /> Link público + dados do corretor
                  </Button>
                )}
                {isOwner && (
                  <Button variant="destructive" className="w-full justify-start" onClick={handleDelete}>
                    <Trash2 className="h-4 w-4" /> Excluir anúncio
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        </div>
      </div>

      <Dialog open={adminLinkOpen} onOpenChange={setAdminLinkOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Link público do imóvel</DialogTitle>
            <DialogDescription>
              Visível apenas para administradores. O link abaixo abre a página pública do imóvel com os dados do corretor que publicou.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Link público (Ref. {property.reference_code})</p>
              <div className="flex gap-2">
                <div className="flex-1 rounded-md border bg-muted/40 px-3 py-2 text-xs break-all">{publicOwnerLink}</div>
                <Button size="icon" variant="outline" onClick={() => copyText(publicOwnerLink, 'Link')} aria-label="Copiar link">
                  <Copy className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="outline" asChild aria-label="Abrir link">
                  <a href={publicOwnerLink} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Corretor que publicou</p>
              <div className="rounded-md border p-3 space-y-1.5 text-sm">
                <p><span className="text-muted-foreground">Nome: </span>{owner?.name || '—'}</p>
                {owner?.company_name && (
                  <p><span className="text-muted-foreground">Empresa: </span>{owner.company_name}</p>
                )}
                <p><span className="text-muted-foreground">WhatsApp: </span>{owner?.phone || '—'}</p>
                <p className="break-all"><span className="text-muted-foreground">E-mail: </span>{owner?.email || '—'}</p>
                <p>
                  <span className="text-muted-foreground">CRECI: </span>
                  {(owner?.creci_number || owner?.creci)
                    ? `${owner?.creci_number || owner?.creci}${owner?.creci_uf ? `/${owner.creci_uf}` : ''}`
                    : '—'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {owner?.phone && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => copyText(owner.phone!, 'Telefone')}>
                      <Copy className="h-4 w-4" /> Copiar telefone
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <a href={buildWaLink(owner.phone, waMessage)} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="h-4 w-4" /> WhatsApp do corretor
                      </a>
                    </Button>
                  </>
                )}
                {owner?.email && (
                  <Button size="sm" variant="outline" onClick={() => copyText(owner.email!, 'E-mail')}>
                    <Copy className="h-4 w-4" /> Copiar e-mail
                  </Button>
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Mensagem formatada para WhatsApp</p>
              <div className="rounded-md border bg-muted/40 p-3 max-h-56 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-xs font-sans">{waShareMessage}</pre>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => copyText(waShareMessage, 'Mensagem')}>
                  <Copy className="h-4 w-4" /> Copiar mensagem
                </Button>
                <Button size="sm" variant="default" asChild>
                  <a href={`https://wa.me/?text=${encodeURIComponent(waShareMessage)}`} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-4 w-4" /> Enviar no WhatsApp
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default PropertyDetail;
