import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Search, Eye, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SignupProgressRow {
  id: string;
  session_id: string;
  email: string | null;
  phone: string | null;
  name: string | null;
  person_type: string | null;
  profession: string | null;
  company_type: string | null;
  current_step: number;
  step_label: string | null;
  total_steps: number | null;
  form_data: Record<string, unknown>;
  completed: boolean;
  completed_at: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

const FIELD_LABELS: Record<string, string> = {
  name: "Nome",
  email: "E-mail",
  phone: "Telefone",
  cpf: "CPF",
  cnpj: "CNPJ",
  companyName: "Razão Social",
  companyType: "Tipo de Empresa",
  personType: "Tipo de Pessoa",
  profession: "Profissão",
  address: "Endereço",
  addressUf: "UF",
  addressCity: "Cidade",
  addressNeighborhood: "Bairro",
  creci: "CRECI",
  creciUf: "UF CRECI",
  cau: "CAU",
  cauUf: "UF CAU",
  crea: "CREA",
  creaUf: "UF CREA",
  creciPj: "CRECI PJ",
  creciPjUf: "UF CRECI PJ",
  creaPj: "CREA PJ",
  creaPjUf: "UF CREA PJ",
  rtName: "Nome do RT",
  rtCpf: "CPF do RT",
  rtCrea: "CREA do RT",
  rtCreaUf: "UF CREA RT",
  referralCode: "Código de Indicação",
  acceptedContract: "Aceitou Contrato",
  acceptedDPA: "Aceitou DPA",
  acceptedTermsOfUse: "Aceitou Termos",
};

function formatValue(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "Sim" : "Não";
  return String(v);
}

export function SignupProgressManagement() {
  const [rows, setRows] = useState<SignupProgressRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "in_progress" | "completed">("all");
  const [selected, setSelected] = useState<SignupProgressRow | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("signup_progress" as any)
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(500);
    if (!error && data) setRows(data as unknown as SignupProgressRow[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel("signup_progress_admin")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "signup_progress" },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (filter === "completed" && !r.completed) return false;
      if (filter === "in_progress" && r.completed) return false;
      if (search.trim()) {
        const s = search.toLowerCase();
        const blob = `${r.name || ""} ${r.email || ""} ${r.phone || ""}`.toLowerCase();
        if (!blob.includes(s)) return false;
      }
      return true;
    });
  }, [rows, search, filter]);

  const stats = useMemo(() => {
    const total = rows.length;
    const completed = rows.filter((r) => r.completed).length;
    const inProgress = total - completed;
    const conversion = total ? Math.round((completed / total) * 100) : 0;
    const byStep: Record<string, number> = {};
    rows
      .filter((r) => !r.completed)
      .forEach((r) => {
        const key = `Etapa ${r.current_step}${r.step_label ? ` · ${r.step_label}` : ""}`;
        byStep[key] = (byStep[key] || 0) + 1;
      });
    return { total, completed, inProgress, conversion, byStep };
  }, [rows]);

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de sessões</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Em andamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Concluídos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de conversão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversion}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Distribuição por etapa */}
      {Object.keys(stats.byStep).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Onde os leads pararam</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(stats.byStep)
              .sort((a, b) => b[1] - a[1])
              .map(([label, count]) => (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span>{label}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                  <Progress value={(count / stats.inProgress) * 100} className="h-2" />
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="in_progress">Em andamento</TabsTrigger>
            <TabsTrigger value="completed">Concluídos</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar nome, e-mail ou telefone"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 w-72"
            />
          </div>
          <Button variant="outline" size="icon" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          {loading && rows.length === 0 ? (
            <div className="p-12 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-sm">
              Nenhum cadastro encontrado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lead</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Etapa atual</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Atualizado</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => {
                    const total = r.total_steps || 5;
                    const pct = Math.min(100, Math.round((r.current_step / total) * 100));
                    return (
                      <TableRow key={r.id}>
                        <TableCell>
                          <div className="font-medium">{r.name || "—"}</div>
                          <div className="text-xs text-muted-foreground">{r.email || "—"}</div>
                          <div className="text-xs text-muted-foreground">{r.phone || "—"}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{r.person_type || "—"}</div>
                          <div className="text-xs text-muted-foreground">
                            {r.profession || r.company_type || ""}
                          </div>
                        </TableCell>
                        <TableCell className="min-w-[180px]">
                          <div className="text-sm font-medium">
                            {r.step_label || `Etapa ${r.current_step}`}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Progress value={pct} className="h-1.5 w-24" />
                            <span className="text-xs text-muted-foreground">
                              {r.current_step}/{total}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {r.completed ? (
                            <Badge className="bg-green-600 hover:bg-green-700">Concluído</Badge>
                          ) : (
                            <Badge variant="secondary">Em andamento</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(r.updated_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => setSelected(r)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de detalhes */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do cadastro</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-muted-foreground text-xs">Status</div>
                  <div>
                    {selected.completed ? (
                      <Badge className="bg-green-600">Concluído</Badge>
                    ) : (
                      <Badge variant="secondary">Em andamento</Badge>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Etapa</div>
                  <div className="font-medium">
                    {selected.step_label || `Etapa ${selected.current_step}`} ({selected.current_step}/{selected.total_steps || 5})
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Iniciado</div>
                  <div>{new Date(selected.created_at).toLocaleString("pt-BR")}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Última atualização</div>
                  <div>{new Date(selected.updated_at).toLocaleString("pt-BR")}</div>
                </div>
                {selected.completed_at && (
                  <div>
                    <div className="text-muted-foreground text-xs">Concluído em</div>
                    <div>{new Date(selected.completed_at).toLocaleString("pt-BR")}</div>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2">Dados preenchidos</h3>
                <div className="rounded-lg border divide-y">
                  {Object.entries(selected.form_data || {})
                    .filter(([, v]) => v !== "" && v !== null && v !== undefined)
                    .map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-4 px-3 py-2 text-sm">
                        <span className="text-muted-foreground">{FIELD_LABELS[k] || k}</span>
                        <span className="font-medium text-right break-all">{formatValue(v)}</span>
                      </div>
                    ))}
                  {Object.keys(selected.form_data || {}).length === 0 && (
                    <div className="px-3 py-4 text-center text-muted-foreground text-sm">
                      Nenhum dado preenchido ainda.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SignupProgressManagement;
