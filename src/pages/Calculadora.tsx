import { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Calculator as CalculatorIcon, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useIBGELocation } from "@/hooks/useIBGELocation";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const COVERED_UFS = [
  { sigla: "AM", nome: "Amazonas" },
  { sigla: "BA", nome: "Bahia" },
  { sigla: "ES", nome: "Espírito Santo" },
  { sigla: "GO", nome: "Goiás" },
  { sigla: "MG", nome: "Minas Gerais" },
  { sigla: "MS", nome: "Mato Grosso do Sul" },
  { sigla: "PA", nome: "Pará" },
  { sigla: "PR", nome: "Paraná" },
  { sigla: "RJ", nome: "Rio de Janeiro" },
  { sigla: "RS", nome: "Rio Grande do Sul" },
  { sigla: "SP", nome: "São Paulo" },
];

const CONSULTAS = [
  { id: "1", label: "Registro em Geral" },
  { id: "2", label: "Registro de Compra e Venda com Alienação Fiduciária" },
  { id: "3", label: "Averbação com Valor Econômico" },
];

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

function parseCurrencyInput(raw: string): number {
  // Remove tudo exceto dígitos
  const digits = raw.replace(/\D/g, "");
  if (!digits) return 0;
  return parseInt(digits, 10) / 100;
}

function formatCurrencyInput(value: number): string {
  if (!value) return "";
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function Calculadora() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { cities, loadingCities, fetchCities } = useIBGELocation();

  const [uf, setUf] = useState("");
  const [municipioId, setMunicipioId] = useState("");
  const [consultaId, setConsultaId] = useState("1");
  const [valorImovel, setValorImovel] = useState(0);
  const [valorImovelStr, setValorImovelStr] = useState("");
  const [valorFinanciamento, setValorFinanciamento] = useState(0);
  const [valorFinanciamentoStr, setValorFinanciamentoStr] = useState("");
  const [desconto, setDesconto] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [diagnostics, setDiagnostics] = useState<{
    upstreamStatus?: number;
    upstreamBody?: unknown;
    sentPayload?: Record<string, string>;
  } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (uf) {
      fetchCities(uf);
      setMunicipioId("");
    }
  }, [uf, fetchCities]);

  const sortedCities = useMemo(
    () => [...cities].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
    [cities]
  );

  const handleCalcular = async () => {
    if (!uf) return toast({ title: "Selecione o estado", variant: "destructive" });
    if (!municipioId) return toast({ title: "Selecione o município", variant: "destructive" });
    if (!valorImovel || valorImovel <= 0)
      return toast({ title: "Informe o valor do imóvel", variant: "destructive" });
    if (valorFinanciamento && valorFinanciamento > valorImovel) {
      return toast({
        title: "Valor de financiamento inválido",
        description: "Deve ser menor ou igual ao valor do imóvel.",
        variant: "destructive",
      });
    }

    setLoading(true);
    setResult(null);
    try {
      const body: Record<string, unknown> = {
        codigo_municipio: parseInt(municipioId, 10),
        consulta_id: parseInt(consultaId, 10),
        valor_imovel: valorImovel,
      };
      if (valorFinanciamento > 0) body.valor_financiamento = valorFinanciamento;
      if (desconto.trim()) body.desconto = desconto.trim();

      const { data, error } = await supabase.functions.invoke("calculate-emoluments", {
        body,
      });

      if (error) {
        console.error(error);
        toast({
          title: "Erro ao calcular",
          description: error.message ?? "Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      if (data?.error) {
        toast({
          title: "Erro da Calculadora",
          description:
            typeof data.error === "string" ? data.error : JSON.stringify(data.error),
          variant: "destructive",
        });
        setResult(data);
        return;
      }

      setResult(data);
      toast({ title: "Cálculo concluído" });
    } catch (e: any) {
      toast({
        title: "Erro inesperado",
        description: e?.message ?? "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Extrair principais valores numéricos da resposta para destaque
  const renderHighlights = () => {
    if (!result || typeof result !== "object") return null;
    const entries: Array<[string, number]> = [];
    const walk = (obj: any, prefix = "") => {
      if (!obj || typeof obj !== "object") return;
      for (const [k, v] of Object.entries(obj)) {
        const key = prefix ? `${prefix}.${k}` : k;
        if (typeof v === "number") {
          entries.push([key, v]);
        } else if (typeof v === "string" && /^-?\d+(\.\d+)?$/.test(v)) {
          entries.push([key, parseFloat(v)]);
        } else if (typeof v === "object" && v !== null) {
          walk(v, key);
        }
      }
    };
    walk(result);
    if (entries.length === 0) return null;

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {entries.map(([k, v]) => (
          <div
            key={k}
            className="rounded-lg border border-border bg-muted/30 p-3 flex flex-col"
          >
            <span className="text-xs text-muted-foreground truncate" title={k}>
              {k}
            </span>
            <span className="text-base font-semibold text-foreground">
              {formatBRL(v)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Layout>
      <div className="container max-w-3xl py-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <CalculatorIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Calculadora de Emolumentos</h1>
            <p className="text-sm text-muted-foreground">
              Calcule taxas de registro de imóveis para os estados disponíveis.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Dados do imóvel</CardTitle>
            <CardDescription>
              Disponível para AM, BA, ES, GO, MG, MS, PA, PR, RJ, RS e SP.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Estado (UF)</Label>
                <Select value={uf} onValueChange={setUf}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {COVERED_UFS.map((u) => (
                      <SelectItem key={u.sigla} value={u.sigla}>
                        {u.sigla} — {u.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Município</Label>
                <Select
                  value={municipioId}
                  onValueChange={setMunicipioId}
                  disabled={!uf || loadingCities}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        !uf
                          ? "Selecione a UF primeiro"
                          : loadingCities
                          ? "Carregando..."
                          : "Selecione"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {sortedCities.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tipo de consulta</Label>
              <Select value={consultaId} onValueChange={setConsultaId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONSULTAS.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.id} — {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor do imóvel (R$)</Label>
                <Input
                  inputMode="numeric"
                  placeholder="0,00"
                  value={valorImovelStr}
                  onChange={(e) => {
                    const v = parseCurrencyInput(e.target.value);
                    setValorImovel(v);
                    setValorImovelStr(formatCurrencyInput(v));
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>Valor do financiamento (R$) — opcional</Label>
                <Input
                  inputMode="numeric"
                  placeholder="0,00"
                  value={valorFinanciamentoStr}
                  onChange={(e) => {
                    const v = parseCurrencyInput(e.target.value);
                    setValorFinanciamento(v);
                    setValorFinanciamentoStr(formatCurrencyInput(v));
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Código de desconto — opcional</Label>
              <Input
                placeholder="Ex: MCMV"
                value={desconto}
                onChange={(e) => setDesconto(e.target.value)}
                maxLength={50}
              />
            </div>

            <Button
              onClick={handleCalcular}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Calculando...
                </>
              ) : (
                <>
                  <CalculatorIcon className="h-4 w-4 mr-2" />
                  Calcular
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle>Resultado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderHighlights()}
              <Accordion type="single" collapsible>
                <AccordionItem value="raw">
                  <AccordionTrigger>Ver resposta completa (JSON)</AccordionTrigger>
                  <AccordionContent>
                    <pre className="text-xs bg-muted/50 p-3 rounded-lg overflow-x-auto">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
