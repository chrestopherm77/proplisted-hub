import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Copy, CheckCircle2, AlertTriangle, XCircle, Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

const VERCEL_A = '76.76.21.21';
const VERCEL_CNAME = 'cname.vercel-dns.com';

type CheckResult =
  | { state: 'idle' }
  | { state: 'loading' }
  | { state: 'ok'; ips: string[] }
  | { state: 'wrong'; ips: string[] }
  | { state: 'missing' }
  | { state: 'error'; message: string };

function copy(value: string, label: string) {
  navigator.clipboard.writeText(value);
  toast.success(`${label} copiado`);
}

async function resolveA(domain: string): Promise<string[]> {
  const res = await fetch(
    `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=A`,
  );
  if (!res.ok) throw new Error('Falha ao consultar DNS');
  const json = await res.json();
  const answers: any[] = Array.isArray(json.Answer) ? json.Answer : [];
  return answers.filter((a) => a.type === 1).map((a) => String(a.data));
}

export function PortalDomainPanel({
  customDomain,
  onChange,
}: {
  customDomain: string;
  onChange: (value: string) => void;
}) {
  const [check, setCheck] = useState<CheckResult>({ state: 'idle' });

  const cleaned = (customDomain || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '');

  const isValid = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(
    cleaned,
  );

  const runCheck = async () => {
    if (!isValid) return;
    setCheck({ state: 'loading' });
    try {
      const ips = await resolveA(cleaned);
      if (ips.length === 0) {
        setCheck({ state: 'missing' });
      } else if (ips.includes(VERCEL_A)) {
        setCheck({ state: 'ok', ips });
      } else {
        setCheck({ state: 'wrong', ips });
      }
    } catch (e: any) {
      setCheck({ state: 'error', message: e.message ?? 'Erro' });
    }
  };

  const StatusBadge = () => {
    if (!cleaned) return <Badge variant="secondary">Não configurado</Badge>;
    if (check.state === 'ok') return <Badge>DNS OK</Badge>;
    if (check.state === 'wrong')
      return <Badge variant="destructive">DNS apontando para outro lugar</Badge>;
    if (check.state === 'missing')
      return <Badge variant="secondary">DNS aguardando propagação</Badge>;
    return <Badge variant="outline">Aguardando verificação</Badge>;
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <Label className="text-base font-semibold">Domínio próprio</Label>
          <StatusBadge />
        </div>
        <p className="text-sm text-muted-foreground">
          Use o domínio do cliente (ex: <code>imoveisjoao.com.br</code>) para servir este portal.
          O apontamento é feito via Vercel como proxy.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Domínio personalizado</Label>
        <Input
          value={customDomain ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="imoveisjoao.com.br"
        />
        {customDomain && !isValid && (
          <p className="text-xs text-destructive">
            Formato inválido. Use apenas o domínio (sem http:// e sem barras).
          </p>
        )}
      </div>

      {isValid && (
        <>
          <div className="border rounded-md p-4 bg-muted/30 space-y-4">
            <div>
              <h4 className="font-semibold">Passo 1 — Apontar DNS para a Vercel</h4>
              <p className="text-xs text-muted-foreground">
                No painel do registrador do cliente (Registro.br, GoDaddy, Hostgator etc.),
                criar os registros abaixo:
              </p>
            </div>

            <div className="grid gap-2">
              <DnsRow label="A" name="@" value={VERCEL_A} />
              <DnsRow label="CNAME" name="www" value={VERCEL_CNAME} />
            </div>

            <p className="text-xs text-muted-foreground">
              A propagação pode levar de alguns minutos a 24h.
            </p>
          </div>

          <div className="border rounded-md p-4 bg-muted/30 space-y-2">
            <h4 className="font-semibold">Passo 2 — Adicionar o domínio na Vercel</h4>
            <p className="text-xs text-muted-foreground">
              No projeto <code>portais-proxy</code> da Vercel, em{' '}
              <strong>Settings → Domains</strong>, clicar em <strong>Add</strong> e colar:
            </p>
            <div className="grid gap-2">
              <DnsRow label="Domínio" name="" value={cleaned} />
              <DnsRow label="Domínio" name="" value={`www.${cleaned}`} />
            </div>
            <Button variant="outline" size="sm" asChild className="mt-1">
              <a
                href="https://vercel.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Abrir painel da Vercel
              </a>
            </Button>
          </div>

          <div className="border rounded-md p-4 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h4 className="font-semibold">Passo 3 — Verificar</h4>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={runCheck} disabled={check.state === 'loading'}>
                  {check.state === 'loading' ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : null}
                  Verificar DNS
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <a
                    href={`https://${cleaned}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Testar acesso
                  </a>
                </Button>
              </div>
            </div>

            {check.state === 'ok' && (
              <div className="flex items-start gap-2 text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4 mt-0.5" />
                <div>
                  DNS apontando corretamente para a Vercel ({check.ips.join(', ')}).
                  Se o site ainda não abrir, conclua o passo 2 na Vercel e aguarde o SSL.
                </div>
              </div>
            )}
            {check.state === 'wrong' && (
              <div className="flex items-start gap-2 text-sm text-destructive">
                <XCircle className="h-4 w-4 mt-0.5" />
                <div>
                  DNS aponta para <strong>{check.ips.join(', ')}</strong>, mas precisa apontar
                  para <strong>{VERCEL_A}</strong>. Ajuste no registrador.
                </div>
              </div>
            )}
            {check.state === 'missing' && (
              <div className="flex items-start gap-2 text-sm text-amber-600">
                <AlertTriangle className="h-4 w-4 mt-0.5" />
                <div>Nenhum registro A encontrado ainda. Aguarde a propagação.</div>
              </div>
            )}
            {check.state === 'error' && (
              <div className="flex items-start gap-2 text-sm text-destructive">
                <XCircle className="h-4 w-4 mt-0.5" />
                <div>Erro ao consultar DNS: {check.message}</div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function DnsRow({ label, name, value }: { label: string; name: string; value: string }) {
  return (
    <div className="flex items-center gap-2 text-sm bg-background border rounded px-2 py-1.5">
      <Badge variant="outline" className="shrink-0">{label}</Badge>
      {name && <span className="text-muted-foreground shrink-0">{name}</span>}
      <code className="flex-1 truncate">{value}</code>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2"
        onClick={() => copy(value, label)}
      >
        <Copy className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
