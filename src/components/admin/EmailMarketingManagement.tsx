import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, Send, Users, Mail } from 'lucide-react';
import { ImageUploadField } from '@/components/admin/shared/ImageUploadField';

const CONECTAE_LOGO_URL = 'https://hmcpfedcvkurttyolurv.supabase.co/storage/v1/object/public/landing-pages/email-assets/conectae-logo.png';

interface ProfileRow { id: string; name: string | null; email: string | null; }

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function EmailMarketingManagement() {
  const { toast } = useToast();
  const [subject, setSubject] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [delaySec, setDelaySec] = useState(17);

  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [manualEmails, setManualEmails] = useState('');
  const [sending, setSending] = useState(false);
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    (async () => {
      setLoadingProfiles(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email')
        .eq('is_active', true)
        .not('email', 'is', null)
        .order('name', { ascending: true })
        .limit(1000);
      if (error) {
        toast({ title: 'Erro ao carregar usuários', description: error.message, variant: 'destructive' });
      } else {
        setProfiles((data || []).filter((p: any) => p.email));
      }
      setLoadingProfiles(false);
    })();
  }, [toast]);

  const filteredProfiles = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter((p) =>
      (p.name || '').toLowerCase().includes(q) || (p.email || '').toLowerCase().includes(q),
    );
  }, [profiles, search]);

  const manualList = useMemo(() => {
    return manualEmails
      .split(/[\s,;]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => EMAIL_RX.test(e));
  }, [manualEmails]);

  const recipients = useMemo(() => {
    const map = new Map<string, { email: string; name?: string }>();
    profiles.forEach((p) => {
      if (selectedIds.has(p.id) && p.email) {
        const e = p.email.toLowerCase();
        if (!map.has(e)) map.set(e, { email: e, name: p.name || undefined });
      }
    });
    manualList.forEach((e) => { if (!map.has(e)) map.set(e, { email: e }); });
    return Array.from(map.values());
  }, [profiles, selectedIds, manualList]);

  const totalSec = recipients.length > 1 ? (recipients.length - 1) * delaySec : 0;
  const estMinutes = Math.ceil(totalSec / 60);

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const selectAllFiltered = () => {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      filteredProfiles.forEach((p) => n.add(p.id));
      return n;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const canSend = subject.trim().length > 0 && bodyText.trim().length > 0 && recipients.length > 0 && !sending;

  const handleSend = async () => {
    setSending(true);
    setReport(null);
    try {
      const { data, error } = await supabase.functions.invoke('send-marketing-blast', {
        body: { subject, bodyText, imageUrl: imageUrl.trim() || undefined, delaySeconds: delaySec, recipients },
      });
      if (error) throw error;
      setReport(data);
      toast({ title: 'Disparo concluído', description: `${data.sent} enviados, ${data.failed} falharam.` });
    } catch (e: any) {
      toast({ title: 'Erro no disparo', description: e.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const previewHtml = useMemo(() => {
    const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
    const body = bodyText
      .split(/\n{2,}/)
      .map((p) => `<p style="color:#3f3f46;font-size:15px;line-height:24px;margin:0 0 16px;">${esc(p).replace(/\n/g, '<br/>')}</p>`)
      .join('');
    return `<div style="font-family:-apple-system,sans-serif;background:#f4f4f5;padding:20px;">
      <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;">
        <div style="padding:20px;border-bottom:1px solid #e4e4e7;text-align:center;"><strong style="color:#18181b;font-size:18px;">Conectae</strong></div>
        ${imageUrl ? `<img src="${esc(imageUrl)}" style="display:block;width:100%;height:auto;"/>` : ''}
        <div style="padding:24px;">${body || '<p style="color:#a1a1aa;">Pré-visualização da mensagem...</p>'}</div>
      </div>
    </div>`;
  }, [bodyText, imageUrl]);

  return (
    <div className="space-y-4" translate="no">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2"><Mail className="h-6 w-6" /> Email Marketing</h2>
        <p className="text-sm text-muted-foreground">Crie e dispare campanhas de email para usuários cadastrados ou listas manuais.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Composição */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Composição</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Assunto</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} placeholder="Ex: Novidades da semana" />
            </div>
            <div>
              <Label>URL da imagem (opcional)</Label>
              <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <Label>Mensagem</Label>
              <Textarea value={bodyText} onChange={(e) => setBodyText(e.target.value)} rows={10} maxLength={20000}
                placeholder="Escreva o corpo do email. Use linhas em branco para separar parágrafos." />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Delay entre envios</Label>
                <Badge variant="secondary">{delaySec}s</Badge>
              </div>
              <Slider min={15} max={20} step={1} value={[delaySec]} onValueChange={(v) => setDelaySec(v[0])} />
              <p className="text-xs text-muted-foreground mt-1">Entre 15 e 20 segundos para evitar bloqueio do provedor.</p>
            </div>
            <div>
              <Label>Pré-visualização</Label>
              <div className="border rounded-md overflow-hidden mt-1 max-h-72 overflow-y-auto" dangerouslySetInnerHTML={{ __html: previewHtml }} />
            </div>
          </CardContent>
        </Card>

        {/* Destinatários */}
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Users className="h-4 w-4" /> Destinatários</CardTitle></CardHeader>
          <CardContent>
            <Tabs defaultValue="users">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="users">Usuários cadastrados</TabsTrigger>
                <TabsTrigger value="manual">Emails manuais</TabsTrigger>
              </TabsList>

              <TabsContent value="users" className="space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input className="pl-8" placeholder="Buscar nome ou email..." value={search} onChange={(e) => setSearch(e.target.value)} />
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={selectAllFiltered}>Selecionar todos</Button>
                  <Button type="button" variant="ghost" size="sm" onClick={clearSelection}>Limpar</Button>
                </div>
                <div className="text-xs text-muted-foreground">
                  {selectedIds.size} selecionado(s) · {filteredProfiles.length} listado(s)
                </div>
                <div className="border rounded-md max-h-96 overflow-y-auto divide-y">
                  {loadingProfiles ? (
                    <div className="p-4 text-center text-sm text-muted-foreground"><Loader2 className="inline h-4 w-4 animate-spin mr-2" />Carregando...</div>
                  ) : filteredProfiles.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">Nenhum usuário encontrado</div>
                  ) : (
                    filteredProfiles.map((p) => (
                      <label key={p.id} className="flex items-center gap-3 p-2 hover:bg-muted/50 cursor-pointer">
                        <Checkbox checked={selectedIds.has(p.id)} onCheckedChange={() => toggle(p.id)} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{p.name || '(sem nome)'}</div>
                          <div className="text-xs text-muted-foreground truncate">{p.email}</div>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="manual" className="space-y-2">
                <Label>Cole emails (um por linha, vírgula ou ponto-e-vírgula)</Label>
                <Textarea rows={10} value={manualEmails} onChange={(e) => setManualEmails(e.target.value)}
                  placeholder="exemplo@dominio.com&#10;outro@dominio.com" />
                <div className="text-xs text-muted-foreground">{manualList.length} email(s) válido(s) detectado(s)</div>
              </TabsContent>
            </Tabs>

            <div className="mt-4 p-3 rounded-md bg-muted/50 border">
              <div className="text-sm">Total único de destinatários: <strong>{recipients.length}</strong></div>
              {recipients.length > 1 && (
                <div className="text-xs text-muted-foreground mt-1">
                  Tempo estimado: ~{estMinutes} min ({delaySec}s entre envios)
                </div>
              )}
              {recipients.length > 50 && (
                <div className="text-xs text-amber-600 mt-1">
                  Atenção: lotes grandes podem exceder o tempo limite da função. Recomendado ≤ 50 por disparo.
                </div>
              )}
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="w-full mt-4" disabled={!canSend}>
                  {sending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Enviando...</> : <><Send className="h-4 w-4 mr-2" />Disparar emails</>}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar disparo</AlertDialogTitle>
                  <AlertDialogDescription>
                    Você está prestes a enviar para <strong>{recipients.length}</strong> destinatário(s) com delay de <strong>{delaySec}s</strong>.
                    Tempo estimado: ~{estMinutes} min. Continuar?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSend}>Disparar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {report && (
              <div className="mt-4 p-3 rounded-md border bg-card text-sm space-y-1">
                <div>Total: <strong>{report.total}</strong></div>
                <div className="text-emerald-600">Enviados: {report.sent}</div>
                <div className="text-destructive">Falharam: {report.failed}</div>
                {report.errors?.length > 0 && (
                  <details className="mt-2"><summary className="cursor-pointer text-xs text-muted-foreground">Ver erros</summary>
                    <ul className="text-xs mt-1 space-y-1">{report.errors.map((e: string, i: number) => <li key={i}>{e}</li>)}</ul>
                  </details>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
