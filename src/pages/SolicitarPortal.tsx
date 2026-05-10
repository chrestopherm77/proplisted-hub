import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { PublicImageUpload } from '@/components/portal-request/PublicImageUpload';
import { PORTAL_TEMPLATES } from '@/lib/portalTemplatesCatalog';

type Branding = {
  logo_url: string; about: string;
  instagram: string; facebook: string; tiktok: string; youtube: string; linkedin: string;
  address: string; primary_color: string; accent_color: string; bg_color: string;
  cnpj: string; creci: string; about_image_url: string; about_text: string;
};

const emptyBranding = (): Branding => ({
  logo_url: '', about: '',
  instagram: '', facebook: '', tiktok: '', youtube: '', linkedin: '',
  address: '', primary_color: '#1c1c1c', accent_color: '#c9a44c', bg_color: '#1c1c1c',
  cnpj: '', creci: '', about_image_url: '', about_text: '',
});

export default function SolicitarPortal() {
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  // Contato
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  // Portal
  const [slug, setSlug] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [templateId, setTemplateId] = useState(1);
  const [propertiesSource, setPropertiesSource] = useState<'OWN' | 'CITY'>('OWN');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');

  const [branding, setBranding] = useState<Branding>(emptyBranding());

  const upd = <K extends keyof Branding>(k: K, v: Branding[K]) => setBranding((b) => ({ ...b, [k]: v }));

  const submit = async () => {
    if (!contactName.trim() || !contactEmail.trim() || !contactPhone.trim()) {
      toast.error('Preencha nome, e-mail e telefone');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('broker_portal_requests').insert({
      contact_name: contactName.trim(),
      contact_email: contactEmail.trim(),
      contact_phone: contactPhone.trim(),
      slug: slug.trim().toLowerCase() || null,
      custom_domain: customDomain.trim().toLowerCase() || null,
      template_id: templateId,
      properties_source: propertiesSource,
      city: city || null,
      state: state || null,
      branding,
    });
    setSaving(false);
    if (error) {
      toast.error('Erro ao enviar: ' + error.message);
      return;
    }
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4" lang="pt-BR" translate="no">
        <Card className="max-w-lg w-full p-8 text-center space-y-4">
          <CheckCircle2 className="h-16 w-16 mx-auto text-green-500" />
          <h1 className="text-2xl font-bold">Solicitação enviada!</h1>
          <p className="text-muted-foreground">
            Recebemos seus dados e em breve entraremos em contato para criar seu portal personalizado.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4" lang="pt-BR" translate="no">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Solicite seu Portal de Imóveis personalizado</h1>
          <p className="text-muted-foreground">Preencha os dados abaixo para criarmos seu site.</p>
        </div>

        {/* Seus dados */}
        <Card className="p-6 space-y-4">
          <h2 className="text-xl font-semibold">Seus dados</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Nome completo *</Label>
              <Input value={contactName} onChange={(e) => setContactName(e.target.value)} />
            </div>
            <div>
              <Label>E-mail *</Label>
              <Input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <Label>WhatsApp / Telefone *</Label>
              <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="(00) 00000-0000" />
            </div>
          </div>
        </Card>

        {/* Configuração do Portal */}
        <Card className="p-6 space-y-4">
          <h2 className="text-xl font-semibold">Configuração do Portal</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Modelo de site (Template)</Label>
              <Select value={String(templateId)} onValueChange={(v) => setTemplateId(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PORTAL_TEMPLATES.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)} disabled={!t.available}>
                      {t.name}{!t.available ? ' (em breve)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Endereço desejado (slug)</Label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="imoveis-joao" />
              <p className="text-xs text-muted-foreground mt-1">Aparecerá em /portal/{slug || 'seu-slug'}</p>
            </div>
            <div className="md:col-span-2">
              <Label>Domínio próprio (opcional)</Label>
              <Input value={customDomain} onChange={(e) => setCustomDomain(e.target.value)} placeholder="imoveisjoao.com.br" />
            </div>
            <div>
              <Label>Quais imóveis aparecem no site?</Label>
              <Select value={propertiesSource} onValueChange={(v: 'OWN' | 'CITY') => setPropertiesSource(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="OWN">Apenas os meus imóveis</SelectItem>
                  <SelectItem value="CITY">Todos os imóveis de uma cidade</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {propertiesSource === 'CITY' && (
              <div className="grid grid-cols-3 gap-2 md:col-span-1">
                <div className="col-span-2">
                  <Label>Cidade</Label>
                  <Input value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
                <div>
                  <Label>UF</Label>
                  <Input value={state} onChange={(e) => setState(e.target.value.toUpperCase())} maxLength={2} />
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Marca */}
        <Card className="p-6 space-y-4">
          <h2 className="text-xl font-semibold">Sua marca</h2>
          <PublicImageUpload label="Logo" value={branding.logo_url} onChange={(v) => upd('logo_url', v)} folder="logos" />
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>CNPJ</Label>
              <Input value={branding.cnpj} onChange={(e) => upd('cnpj', e.target.value)} />
            </div>
            <div>
              <Label>CRECI</Label>
              <Input value={branding.creci} onChange={(e) => upd('creci', e.target.value)} />
            </div>
            <div>
              <Label>Cor principal</Label>
              <Input type="color" value={branding.primary_color} onChange={(e) => upd('primary_color', e.target.value)} />
            </div>
            <div>
              <Label>Cor de destaque</Label>
              <Input type="color" value={branding.accent_color} onChange={(e) => upd('accent_color', e.target.value)} />
            </div>
            <div>
              <Label>Cor de fundo</Label>
              <Input type="color" value={branding.bg_color} onChange={(e) => upd('bg_color', e.target.value)} />
            </div>
          </div>
        </Card>

        {/* Capa (Hero) */}
        <Card className="p-6 space-y-4">
          <h2 className="text-xl font-semibold">Capa do site (Hero)</h2>
          <div>
            <Label>Título principal</Label>
            <Input value={branding.hero_title} onChange={(e) => upd('hero_title', e.target.value)} />
          </div>
          <div>
            <Label>Subtítulo</Label>
            <Input value={branding.hero_subtitle} onChange={(e) => upd('hero_subtitle', e.target.value)} />
          </div>
          <PublicImageUpload label="Imagem de fundo da capa" value={branding.hero_bg_url} onChange={(v) => upd('hero_bg_url', v)} folder="hero" />
        </Card>

        {/* Sobre */}
        <Card className="p-6 space-y-4">
          <h2 className="text-xl font-semibold">Sobre você / sua imobiliária</h2>
          <div>
            <Label>Texto sobre</Label>
            <Textarea rows={4} value={branding.about_text} onChange={(e) => upd('about_text', e.target.value)} />
          </div>
          <PublicImageUpload label="Imagem da seção Sobre" value={branding.about_image_url} onChange={(v) => upd('about_image_url', v)} folder="about" />
        </Card>

        {/* Contato e Redes */}
        <Card className="p-6 space-y-4">
          <h2 className="text-xl font-semibold">Contato e redes sociais</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>WhatsApp do site</Label>
              <Input value={branding.whatsapp} onChange={(e) => upd('whatsapp', e.target.value)} />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input value={branding.phone} onChange={(e) => upd('phone', e.target.value)} />
            </div>
            <div>
              <Label>E-mail</Label>
              <Input value={branding.email} onChange={(e) => upd('email', e.target.value)} />
            </div>
            <div>
              <Label>Endereço</Label>
              <Input value={branding.address} onChange={(e) => upd('address', e.target.value)} />
            </div>
            <div>
              <Label>Instagram (URL)</Label>
              <Input value={branding.instagram} onChange={(e) => upd('instagram', e.target.value)} />
            </div>
            <div>
              <Label>Facebook (URL)</Label>
              <Input value={branding.facebook} onChange={(e) => upd('facebook', e.target.value)} />
            </div>
            <div>
              <Label>TikTok (URL)</Label>
              <Input value={branding.tiktok} onChange={(e) => upd('tiktok', e.target.value)} />
            </div>
            <div>
              <Label>YouTube (URL)</Label>
              <Input value={branding.youtube} onChange={(e) => upd('youtube', e.target.value)} />
            </div>
            <div>
              <Label>LinkedIn (URL)</Label>
              <Input value={branding.linkedin} onChange={(e) => upd('linkedin', e.target.value)} />
            </div>
          </div>
        </Card>

        {/* Menu */}
        <Card className="p-6 space-y-4">
          <h2 className="text-xl font-semibold">Rótulos do menu</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {(['home','sobre','contato','financie','negociar'] as const).map((k) => (
              <div key={k}>
                <Label className="capitalize">{k}</Label>
                <Input value={branding.menu_labels[k]} onChange={(e) => updMenu(k, e.target.value)} />
              </div>
            ))}
          </div>
        </Card>

        {/* SEO */}
        <Card className="p-6 space-y-4">
          <h2 className="text-xl font-semibold">SEO</h2>
          <div>
            <Label>Título do site</Label>
            <Input value={seo.title} onChange={(e) => setSeo({ ...seo, title: e.target.value })} />
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea rows={3} value={seo.description} onChange={(e) => setSeo({ ...seo, description: e.target.value })} />
          </div>
          <PublicImageUpload label="Favicon" value={seo.favicon_url} onChange={(v) => setSeo({ ...seo, favicon_url: v })} folder="favicon" />
        </Card>

        {/* Rodapé */}
        <Card className="p-6 space-y-4">
          <h2 className="text-xl font-semibold">Rodapé</h2>
          <div>
            <Label>Texto do rodapé</Label>
            <Input value={branding.footer_text} onChange={(e) => upd('footer_text', e.target.value)} />
          </div>
        </Card>

        <Button size="lg" className="w-full" onClick={submit} disabled={saving}>
          {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Enviando...</> : 'Enviar solicitação'}
        </Button>
      </div>
    </div>
  );
}
