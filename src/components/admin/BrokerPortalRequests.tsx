import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Copy, Eye, Loader2, Trash2, ExternalLink } from 'lucide-react';

type Request = {
  id: string;
  status: 'NEW' | 'REVIEWED' | 'CREATED' | 'REJECTED';
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  slug: string | null;
  custom_domain: string | null;
  template_id: number;
  properties_source: string;
  city: string | null;
  state: string | null;
  branding: Record<string, any>;
  seo: Record<string, any>;
  admin_notes: string | null;
  created_at: string;
};

const STATUS_LABELS: Record<Request['status'], string> = {
  NEW: 'Nova',
  REVIEWED: 'Em análise',
  CREATED: 'Criada',
  REJECTED: 'Rejeitada',
};

export function BrokerPortalRequests() {
  const [items, setItems] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<Request | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('broker_portal_requests')
      .select('*')
      .order('created_at', { ascending: false });
    setItems((data as Request[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: Request['status']) => {
    const { error } = await supabase.from('broker_portal_requests').update({ status }).eq('id', id);
    if (error) toast.error('Erro: ' + error.message);
    else { toast.success('Status atualizado'); load(); }
  };

  const updateNotes = async (id: string, admin_notes: string) => {
    const { error } = await supabase.from('broker_portal_requests').update({ admin_notes }).eq('id', id);
    if (error) toast.error('Erro: ' + error.message);
  };

  const remove = async (id: string) => {
    if (!confirm('Excluir esta solicitação?')) return;
    const { error } = await supabase.from('broker_portal_requests').delete().eq('id', id);
    if (error) toast.error('Erro: ' + error.message);
    else { toast.success('Excluída'); load(); }
  };

  const formUrl = `${window.location.origin}/solicitar-portal`;
  const copyForm = () => { navigator.clipboard.writeText(formUrl); toast.success('Link do formulário copiado'); };

  const newCount = items.filter((i) => i.status === 'NEW').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-2xl font-bold">Solicitações de Portal</h2>
          <p className="text-sm text-muted-foreground">
            Formulários enviados por corretores pedindo um portal personalizado.
            {newCount > 0 && <Badge className="ml-2">{newCount} nova(s)</Badge>}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={copyForm}><Copy className="h-4 w-4" /> Copiar link do formulário</Button>
          <Button variant="outline" asChild><a href={formUrl} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /> Abrir formulário</a></Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : items.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">Nenhuma solicitação recebida ainda.</Card>
      ) : (
        <div className="grid gap-3">
          {items.map((r) => (
            <Card key={r.id} className="p-4 flex items-center justify-between gap-4 flex-wrap">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold">{r.contact_name}</h3>
                  <Badge variant={r.status === 'NEW' ? 'default' : 'secondary'}>{STATUS_LABELS[r.status]}</Badge>
                  {r.slug && <Badge variant="outline">/{r.slug}</Badge>}
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {r.contact_email} · {r.contact_phone} · {new Date(r.created_at).toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Select value={r.status} onValueChange={(v) => updateStatus(r.id, v as Request['status'])}>
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABELS).map(([k, l]) => (
                      <SelectItem key={k} value={k}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={() => setViewing(r)}><Eye className="h-4 w-4" /></Button>
                <Button variant="outline" size="sm" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Solicitação de {viewing?.contact_name}</DialogTitle>
          </DialogHeader>
          {viewing && <RequestDetail r={viewing} onSaveNotes={(n) => updateNotes(viewing.id, n)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RequestDetail({ r, onSaveNotes }: { r: Request; onSaveNotes: (n: string) => void }) {
  const [notes, setNotes] = useState(r.admin_notes ?? '');
  const b = r.branding ?? {};
  const seo = r.seo ?? {};

  const Field = ({ label, value }: { label: string; value: any }) => {
    if (!value) return null;
    if (typeof value === 'string' && (value.startsWith('http') && /\.(png|jpe?g|webp|gif|svg)/i.test(value))) {
      return (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase">{label}</p>
          <img src={value} alt={label} className="h-20 max-w-[200px] object-contain border rounded" />
          <a href={value} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline break-all">{value}</a>
        </div>
      );
    }
    return (
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase">{label}</p>
        <p className="text-sm break-words">{String(value)}</p>
      </div>
    );
  };

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(r, null, 2));
    toast.success('Dados copiados em JSON');
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={copyJson}><Copy className="h-4 w-4" /> Copiar JSON</Button>
      </div>

      <section className="grid md:grid-cols-2 gap-3">
        <Field label="Nome" value={r.contact_name} />
        <Field label="E-mail" value={r.contact_email} />
        <Field label="Telefone" value={r.contact_phone} />
        <Field label="Enviado em" value={new Date(r.created_at).toLocaleString('pt-BR')} />
      </section>

      <section>
        <h3 className="font-semibold mb-2">Configuração</h3>
        <div className="grid md:grid-cols-2 gap-3">
          <Field label="Slug" value={r.slug} />
          <Field label="Domínio personalizado" value={r.custom_domain} />
          <Field label="Template" value={r.template_id} />
          <Field label="Fonte de imóveis" value={r.properties_source === 'OWN' ? 'Apenas do corretor' : `Cidade: ${r.city}/${r.state}`} />
        </div>
      </section>

      <section>
        <h3 className="font-semibold mb-2">Marca</h3>
        <div className="grid md:grid-cols-2 gap-3">
          <Field label="Logo" value={b.logo_url} />
          <Field label="CNPJ" value={b.cnpj} />
          <Field label="CRECI" value={b.creci} />
          <Field label="Cor principal" value={b.primary_color} />
          <Field label="Cor de destaque" value={b.accent_color} />
          <Field label="Cor de fundo" value={b.bg_color} />
        </div>
      </section>

      <section>
        <h3 className="font-semibold mb-2">Capa</h3>
        <div className="grid md:grid-cols-2 gap-3">
          <Field label="Título" value={b.hero_title} />
          <Field label="Subtítulo" value={b.hero_subtitle} />
          <Field label="Imagem de fundo" value={b.hero_bg_url} />
        </div>
      </section>

      <section>
        <h3 className="font-semibold mb-2">Sobre</h3>
        <div className="grid md:grid-cols-2 gap-3">
          <Field label="Texto" value={b.about_text} />
          <Field label="Imagem" value={b.about_image_url} />
        </div>
      </section>

      <section>
        <h3 className="font-semibold mb-2">Contato e redes</h3>
        <div className="grid md:grid-cols-2 gap-3">
          <Field label="WhatsApp" value={b.whatsapp} />
          <Field label="Telefone" value={b.phone} />
          <Field label="E-mail" value={b.email} />
          <Field label="Endereço" value={b.address} />
          <Field label="Instagram" value={b.instagram} />
          <Field label="Facebook" value={b.facebook} />
          <Field label="TikTok" value={b.tiktok} />
          <Field label="YouTube" value={b.youtube} />
          <Field label="LinkedIn" value={b.linkedin} />
        </div>
      </section>

      <section>
        <h3 className="font-semibold mb-2">Menu</h3>
        <div className="grid md:grid-cols-2 gap-3">
          {b.menu_labels && Object.entries(b.menu_labels).map(([k, v]) => (
            <Field key={k} label={k} value={v as string} />
          ))}
        </div>
      </section>

      <section>
        <h3 className="font-semibold mb-2">SEO</h3>
        <div className="grid md:grid-cols-2 gap-3">
          <Field label="Título" value={seo.title} />
          <Field label="Descrição" value={seo.description} />
          <Field label="Favicon" value={seo.favicon_url} />
        </div>
      </section>

      <section>
        <h3 className="font-semibold mb-2">Rodapé</h3>
        <Field label="Texto" value={b.footer_text} />
      </section>

      <section>
        <h3 className="font-semibold mb-2">Notas internas</h3>
        <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={() => onSaveNotes(notes)} placeholder="Anotações da equipe..." />
      </section>
    </div>
  );
}
