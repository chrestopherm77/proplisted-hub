import { useEffect, useMemo, useState } from "react";
import DOMPurify from "dompurify";
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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Calculator as CalculatorIcon,
  Loader2,
  Building2,
  Landmark,
  FileText,
  ArrowLeft,
  Info,
  Percent,
  X,
  Check,
} from "lucide-react";
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

type ServiceId = "1" | "2" | "3";

interface ServiceOption {
  id: ServiceId;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  needsFinancing: boolean;
  observations: string;
}

const SERVICES: ServiceOption[] = [
  {
    id: "1",
    title: "Registro em Geral",
    subtitle: "Registro de Compra e Venda e outros",
    icon: Building2,
    needsFinancing: false,
    observations:
      "Use esta opção para registros de compra e venda à vista, doações, permutas e demais atos sem financiamento bancário com alienação fiduciária. O valor é estimado com base na tabela do registro de imóveis vigente para o município selecionado.",
  },
  {
    id: "2",
    title: "Registro de Compra e Venda com Alienação Fiduciária",
    subtitle:
      "Registro de Contrato de Compra com Alienação Fiduciária (com financiamento)",
    icon: Landmark,
    needsFinancing: true,
    observations:
      "Use esta opção quando há financiamento imobiliário com garantia de alienação fiduciária. Informe o valor total do imóvel e o valor financiado. O cálculo considera os dois atos: o registro da compra e venda e o registro da alienação fiduciária.",
  },
  {
    id: "3",
    title: "Averbação com Valor Econômico",
    subtitle: "Averbação de atos com expressão econômica",
    icon: FileText,
    needsFinancing: false,
    observations:
      "Use esta opção para averbações que envolvam valor econômico, como construções, ampliações ou alterações que precisem ser registradas na matrícula do imóvel.",
  },
];

const INTRO_TEXT =
  "A Calculadora de Emolumentos estima os custos do registro do imóvel de forma rápida, eficaz e gratuita. Desta forma não é necessário se deslocar até o cartório para realizar a previsão do preço do registro do imóvel. Caso o negócio jurídico envolva mais de um imóvel, deve ser realizado um cálculo separado para cada um dos imóveis. O valor definitivo será calculado pelo respectivo Registro de Imóveis após o protocolo.";

interface DiscountOption {
  code: string;
  label: string;
  shortText: string;
  fullText?: string;
}

const DISCOUNT_OPTIONS: DiscountOption[] = [
  {
    code: "SFH",
    label: "1ª Aquisição SFH",
    shortText:
      "Lei 6.015/73, Art. 290 — Os emolumentos devidos pelos atos relacionados com a primeira aquisição imobiliária para fins residenciais, financiada pelo Sistema Financeiro da Habitação, serão reduzidos em 50%.",
    fullText:
      "Lei 3350/99 RJ, Art. 44 — São isentos do pagamento do acréscimo de 20% (vinte por cento) instituído pela Lei nº 713/1983, com a redação da Lei nº 723/1984, e das taxas previstas nas Leis nº 489/1981 e nº 590/1987, os atos notariais e de registro que comprovadamente se referirem à primeira aquisição da casa própria ou praticados com a interveniência de Cooperativas Habitacionais quando destinados a residência do adquirente.\n\n§ 3º — O notário ou registrador, para o cumprimento do disposto no caput, exigirá certidões dos Ofícios de Distribuição competentes.",
  },
  {
    code: "PCVA_MCMV",
    label: "Minha Casa Minha Vida",
    shortText:
      "Lei nº 11.977/09, Art. 42, II — Os emolumentos devidos pelos atos de abertura de matrícula, registro de incorporação, parcelamento do solo, averbação de construção, instituição de condomínio, averbação da carta de “habite-se” e demais atos referentes à construção de empreendimentos no âmbito do PMCMV serão reduzidos em 50% para os atos relacionados aos demais empreendimentos do PMCMV.",
  },
  {
    code: "FAR_FDS",
    label: "FAR e FDS",
    shortText:
      "Lei nº 11.977/09, Art. 42, I — Os emolumentos devidos pelos atos de abertura de matrícula, registro de incorporação, parcelamento do solo, averbação de construção, instituição de condomínio, averbação da carta de “habite-se” e demais atos referentes à construção de empreendimentos no âmbito do PMCMV serão reduzidos em 75% para os empreendimentos do FAR e do FDS.",
  },
  {
    code: "HAP",
    label: "Habitação Popular",
    shortText:
      "Lei 2.751/2002 — Todos os atos dos ofícios notariais e de registro para habitação popular terão redução de metade das custas a pagar, desde a aquisição do terreno até a averbação ou registro da habitação construída.",
  },
];

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

function parseCurrencyInput(raw: string): number {
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

// Tenta converter qualquer valor (number, string com vírgula/ponto) em número
function toNumber(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const cleaned = v.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
    const n = parseFloat(cleaned);
    if (!isNaN(n)) return n;
    const n2 = parseFloat(v);
    if (!isNaN(n2)) return n2;
  }
  return 0;
}

// Pega primeira chave existente de um objeto (case-insensitive, com aliases)
function pick(obj: any, keys: string[]): unknown {
  if (!obj || typeof obj !== "object") return undefined;
  const lowerMap: Record<string, string> = {};
  for (const k of Object.keys(obj)) lowerMap[k.toLowerCase()] = k;
  for (const k of keys) {
    const real = lowerMap[k.toLowerCase()];
    if (real !== undefined && obj[real] !== undefined && obj[real] !== null) {
      return obj[real];
    }
  }
  return undefined;
}

// Transforma chave técnica em label legível: "tribunal_de_justica-34,30%" → "Tribunal de Justiça (34,30%)"
function humanizeKey(key: string): string {
  // Separa parte de porcentagem (ex: "tribunal_de_justica-34,30%")
  const match = key.match(/^(.+?)[-_](\d+[,.]?\d*%?)$/);
  let base = match ? match[1] : key;
  const pct = match ? match[2] : "";

  base = base.replace(/_/g, " ").trim();
  // Capitaliza cada palavra, mantendo "de", "da", "do" minúsculos
  const small = new Set(["de", "da", "do", "e", "dos", "das"]);
  base = base
    .split(" ")
    .map((w, i) => {
      const lower = w.toLowerCase();
      if (i > 0 && small.has(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");

  // Acentos comuns
  base = base
    .replace(/Tribunal De Justica/i, "Tribunal de Justiça")
    .replace(/Justica/i, "Justiça")
    .replace(/Defensoria Publica/i, "Defensoria Pública")
    .replace(/Ministerio Publico/i, "Ministério Público")
    .replace(/Procuradoria Geral/i, "Procuradoria Geral")
    .replace(/Taxa De Fiscalizacao/i, "Taxa de Fiscalização")
    .replace(/Registro Civil E Renda Minima/i, "Registro Civil e Renda Mínima")
    .replace(/Registro Civil/i, "Registro Civil");

  return pct ? `${base} (${pct})` : base;
}

// Identifica colunas que não devem virar "componente" (descrição/subtotal)
const NON_COMPONENT_KEYS = new Set([
  "descricao",
  "description",
  "ato",
  "nome",
  "name",
  "servico",
  "subtotal",
  "total",
  "valor_total",
  "soma",
]);

interface ResultRow {
  descricao: string;
  values: Record<string, number>; // chave técnica → valor
  subtotal: number;
}

interface ExtraTax {
  descricao: string;
  valor: number;
}

interface ParsedResult {
  rows: ResultRow[];
  columnKeys: string[]; // ordem das colunas a exibir
  extras: ExtraTax[];
  total: number;
  extraInformation: string | null;
}

function parseApiResult(raw: any): ParsedResult {
  const empty: ParsedResult = {
    rows: [],
    columnKeys: [],
    extras: [],
    total: 0,
    extraInformation: null,
  };
  if (!raw || typeof raw !== "object") return empty;

  // A API real retorna { result: { total, atos, taxas_extras, extra_information } }
  // Edge function pode envolver em { ok, data: { result: ... } }
  const data: any =
    raw.result ??
    (raw.data && typeof raw.data === "object" ? raw.data.result ?? raw.data : raw);

  if (!data || typeof data !== "object") return empty;

  const atos: any[] = Array.isArray(data.atos)
    ? data.atos
    : Array.isArray(data.itens)
    ? data.itens
    : Array.isArray(data.servicos)
    ? data.servicos
    : Array.isArray(data.items)
    ? data.items
    : [];

  // Coletar TODAS as chaves de componentes que aparecem em qualquer ato (preserva ordem)
  const columnKeys: string[] = [];
  const seen = new Set<string>();
  for (const ato of atos) {
    if (!ato || typeof ato !== "object") continue;
    for (const k of Object.keys(ato)) {
      if (NON_COMPONENT_KEYS.has(k.toLowerCase())) continue;
      if (typeof ato[k] === "number" || typeof ato[k] === "string") {
        if (!seen.has(k)) {
          seen.add(k);
          columnKeys.push(k);
        }
      }
    }
  }

  const rows: ResultRow[] = atos.map((ato: any) => {
    const values: Record<string, number> = {};
    for (const k of columnKeys) {
      values[k] = toNumber(ato?.[k]);
    }
    let subtotal = toNumber(
      pick(ato, ["subtotal", "total", "valor_total", "soma"])
    );
    if (!subtotal) {
      subtotal = Object.values(values).reduce((s, n) => s + n, 0);
    }
    return {
      descricao: String(
        pick(ato, ["descricao", "description", "ato", "nome", "name", "servico"]) ?? "Serviço"
      ),
      values,
      subtotal,
    };
  });

  const extrasRaw: any[] = Array.isArray(data.taxas_extras)
    ? data.taxas_extras
    : Array.isArray(data.taxas)
    ? data.taxas
    : [];
  const extras: ExtraTax[] = extrasRaw.map((t: any) => ({
    descricao: String(
      pick(t, ["descricao", "description", "nome", "name"]) ?? "Taxa"
    ),
    valor: toNumber(pick(t, ["valor", "value", "total"])),
  }));

  let total = toNumber(
    pick(data, ["total", "total_geral", "valor_total", "totalGeral", "grand_total"])
  );
  if (!total && rows.length > 0) {
    total =
      rows.reduce((s, r) => s + r.subtotal, 0) +
      extras.reduce((s, e) => s + e.valor, 0);
  }

  const extraInformation =
    typeof data.extra_information === "string" && data.extra_information.trim()
      ? data.extra_information
      : null;

  return { rows, columnKeys, extras, total, extraInformation };
}

type Step = "location" | "service" | "form" | "result";

export default function Calculadora() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { cities, loadingCities, fetchCities } = useIBGELocation();

  const [step, setStep] = useState<Step>("location");
  const [uf, setUf] = useState("");
  const [municipioId, setMunicipioId] = useState("");
  const [serviceId, setServiceId] = useState<ServiceId>("1");

  const [valorImovel, setValorImovel] = useState(0);
  const [valorImovelStr, setValorImovelStr] = useState("");
  const [valorFinanciamento, setValorFinanciamento] = useState(0);
  const [valorFinanciamentoStr, setValorFinanciamentoStr] = useState("");
  const [desconto, setDesconto] = useState("");
  const [descontoOpen, setDescontoOpen] = useState(false);
  const [expandedDiscount, setExpandedDiscount] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [parsed, setParsed] = useState<ParsedResult | null>(null);

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

  const selectedService = SERVICES.find((s) => s.id === serviceId)!;
  const selectedCity = sortedCities.find((c) => String(c.id) === municipioId);
  const selectedUf = COVERED_UFS.find((u) => u.sigla === uf);

  const handleLocationContinue = () => {
    if (!uf) return toast({ title: "Selecione o estado", variant: "destructive" });
    if (!municipioId) return toast({ title: "Selecione o município", variant: "destructive" });
    setStep("service");
  };

  const handleSelectService = (id: ServiceId) => {
    setServiceId(id);
    setValorImovel(0);
    setValorImovelStr("");
    setValorFinanciamento(0);
    setValorFinanciamentoStr("");
    setDesconto("");
    setDescontoOpen(false);
    setStep("form");
  };

  const handleCalcular = async () => {
    if (!valorImovel || valorImovel <= 0) {
      return toast({ title: "Informe o valor do imóvel", variant: "destructive" });
    }
    if (selectedService.needsFinancing) {
      if (!valorFinanciamento || valorFinanciamento <= 0) {
        return toast({
          title: "Informe o valor do financiamento",
          variant: "destructive",
        });
      }
      if (valorFinanciamento > valorImovel) {
        return toast({
          title: "Valor de financiamento inválido",
          description: "Deve ser menor ou igual ao valor do imóvel.",
          variant: "destructive",
        });
      }
    }

    setLoading(true);
    setParsed(null);
    try {
      const body: Record<string, unknown> = {
        codigo_municipio: parseInt(municipioId, 10),
        consulta_id: parseInt(serviceId, 10),
        valor_imovel: valorImovel,
      };
      if (selectedService.needsFinancing && valorFinanciamento > 0) {
        body.valor_financiamento = valorFinanciamento;
      }
      if (desconto.trim()) body.desconto = `${desconto.trim()}/${uf}`;

      const { data: response, error } = await supabase.functions.invoke(
        "calculate-emoluments",
        { body }
      );

      // Logs apenas no console — não na UI
      console.log("[Calculadora] request:", body);
      console.log("[Calculadora] response:", response);
      if (error) console.error("[Calculadora] invoke error:", error);

      if (error) {
        toast({
          title: "Erro de conexão",
          description: error.message ?? "Não foi possível chamar a Calculadora.",
          variant: "destructive",
        });
        return;
      }

      if (response && typeof response === "object") {
        if (response.ok === false) {
          const errMsg: string = response.error ?? "Tente novamente.";
          toast({
            title: "Não foi possível calcular",
            description: errMsg,
            variant: "destructive",
          });
          // Se o erro veio por causa do desconto incompatível com o estado,
          // limpa a seleção para o usuário tentar de novo sem ficar preso.
          if (/desconto/i.test(errMsg) && desconto) {
            setDesconto("");
          }
          return;
        }
        const result = parseApiResult(response.ok === true ? response.data : response);
        if (result.rows.length === 0 && result.total === 0) {
          toast({
            title: "Resposta inesperada",
            description: "Não foi possível interpretar o resultado. Tente outro município.",
            variant: "destructive",
          });
          return;
        }
        setParsed(result);
        setStep("result");
        toast({ title: "Cálculo concluído" });
      }
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

  const handleNovoCalculo = () => {
    setParsed(null);
    setStep("service");
  };

  const headerTitle = `${selectedService.title} (${uf}${selectedCity ? " - " + selectedCity.nome : ""})`;

  return (
    <Layout>
      <div className={`container ${step === "result" ? "max-w-7xl" : "max-w-5xl"} py-6 space-y-6`}>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <CalculatorIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Calculadora de Emolumentos</h1>
            <p className="text-sm text-muted-foreground">
              Disponível para AM, BA, ES, GO, MG, MS, PA, PR, RJ, RS e SP.
            </p>
          </div>
        </div>

        {/* Etapa 1: Localização */}
        {step === "location" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Comece pela localização</CardTitle>
              <CardDescription className="leading-relaxed pt-2">
                {INTRO_TEXT}
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

              <Button onClick={handleLocationContinue} className="w-full" size="lg">
                Continuar
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Etapa 2: Tipo de serviço */}
        {step === "service" && (
          <div className="space-y-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep("location")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Alterar localização ({uf}
              {selectedCity ? " - " + selectedCity.nome : ""})
            </Button>

            <div>
              <h2 className="text-xl font-semibold mb-1">
                Escolha o tipo de serviço a calcular
              </h2>
              <p className="text-sm text-muted-foreground">
                Selecione o tipo que melhor se aplica ao seu cálculo.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {SERVICES.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.id}
                    onClick={() => handleSelectService(s.id)}
                    className="text-left rounded-lg border border-border bg-card p-5 hover:border-primary hover:shadow-md transition-all group"
                  >
                    <div className="rounded-lg bg-primary/10 p-3 w-fit mb-4 group-hover:bg-primary/20 transition-colors">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-base mb-2 leading-snug">
                      {s.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {s.subtitle}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Etapa 3: Formulário condicional */}
        {step === "form" && (
          <div className="space-y-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep("service")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Trocar tipo de serviço
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg leading-snug">{headerTitle}</CardTitle>
                  <CardDescription>
                    Preencha os valores para calcular os emolumentos.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Valor do imóvel / Transação (R$)</Label>
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

                  {selectedService.needsFinancing && (
                    <div className="space-y-2">
                      <Label>Valor do financiamento (R$)</Label>
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
                  )}

                  {(() => {
                    const selected = DISCOUNT_OPTIONS.find((d) => d.code === desconto);
                    return (
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          variant={selected ? "default" : "outline"}
                          size="sm"
                          onClick={() => setDescontoOpen(true)}
                          className="gap-2"
                        >
                          <Percent className="h-4 w-4" />
                          {selected ? `Desconto: ${selected.label}` : "Possui desconto?"}
                        </Button>
                        {selected && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setDesconto("")}
                            className="gap-1 text-muted-foreground hover:text-foreground"
                            aria-label="Remover desconto"
                          >
                            <X className="h-4 w-4" />
                            Limpar
                          </Button>
                        )}
                      </div>
                    );
                  })()}

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

              <Card className="bg-muted/30">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Info className="h-4 w-4 text-primary" />
                    Observações importantes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {selectedService.observations}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-3 pt-3 border-t border-border">
                    O valor definitivo será calculado pelo respectivo Registro de Imóveis após o protocolo.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Etapa 4: Resultado */}
        {step === "result" && parsed && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep("form")}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Refazer cálculo
              </Button>
              <Button variant="outline" size="sm" onClick={handleNovoCalculo}>
                Novo cálculo
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg leading-snug">{headerTitle}</CardTitle>
                <CardDescription>
                  Valor do imóvel: {formatBRL(valorImovel)}
                  {selectedService.needsFinancing && valorFinanciamento > 0 && (
                    <> • Financiamento: {formatBRL(valorFinanciamento)}</>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-lg border border-border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold min-w-[220px]">Descrição</TableHead>
                        {parsed.columnKeys.map((k) => (
                          <TableHead key={k} className="text-right font-semibold whitespace-nowrap">
                            {humanizeKey(k)}
                          </TableHead>
                        ))}
                        <TableHead className="text-right font-semibold">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsed.rows.map((row, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{row.descricao}</TableCell>
                          {parsed.columnKeys.map((k) => (
                            <TableCell key={k} className="text-right">
                              {formatBRL(row.values[k] ?? 0)}
                            </TableCell>
                          ))}
                          <TableCell className="text-right font-semibold">
                            {formatBRL(row.subtotal)}
                          </TableCell>
                        </TableRow>
                      ))}
                      {parsed.rows.length > 1 && (
                        <TableRow className="bg-muted/30 font-semibold">
                          <TableCell>SUBTOTAIS</TableCell>
                          {parsed.columnKeys.map((k) => (
                            <TableCell key={k} className="text-right">
                              {formatBRL(
                                parsed.rows.reduce((s, r) => s + (r.values[k] ?? 0), 0)
                              )}
                            </TableCell>
                          ))}
                          <TableCell className="text-right">
                            {formatBRL(parsed.rows.reduce((s, r) => s + r.subtotal, 0))}
                          </TableCell>
                        </TableRow>
                      )}
                      {parsed.extras.map((extra, idx) => (
                        <TableRow key={`extra-${idx}`}>
                          <TableCell
                            className="font-medium"
                            colSpan={parsed.columnKeys.length + 1}
                          >
                            {extra.descricao}
                          </TableCell>
                          <TableCell className="text-right">{formatBRL(extra.valor)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="rounded-lg bg-primary/10 border border-primary/20 p-4 flex items-center justify-between">
                  <span className="text-base font-semibold text-foreground">
                    TOTAL
                  </span>
                  <span className="text-2xl font-bold text-primary">
                    {formatBRL(parsed.total)}
                  </span>
                </div>

                {parsed.extraInformation && (
                  <div
                    className="rounded-lg bg-muted/40 border border-border p-4 text-sm text-muted-foreground leading-relaxed [&_a]:text-primary [&_a]:underline [&_b]:text-foreground"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(parsed.extraInformation, { ALLOWED_TAGS: ["a","b","strong","i","em","br","p","ul","ol","li","span"], ALLOWED_ATTR: ["href","target","rel"] }) }}
                  />
                )}

                <p className="text-xs text-muted-foreground leading-relaxed">
                  * O valor definitivo será calculado pelo respectivo Registro de Imóveis após o protocolo. Esta é uma estimativa baseada nas tabelas vigentes do município selecionado.
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Modal de seleção de desconto */}
        <Dialog open={descontoOpen} onOpenChange={setDescontoOpen}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Selecione o desconto aplicável</DialogTitle>
              <DialogDescription>
                Escolha a categoria que se aplica ao seu cálculo. O desconto será aplicado conforme a legislação vigente.
              </DialogDescription>
              <div className="mt-2 rounded-md border border-border bg-muted px-3 py-2 text-xs text-muted-foreground">
                ⚠️ Nem todos os descontos estão disponíveis em todos os estados. Se o cálculo falhar, tente sem desconto ou outra opção.
              </div>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 py-2">
              {DISCOUNT_OPTIONS.map((opt) => {
                const isSelected = desconto === opt.code;
                const isExpanded = expandedDiscount === opt.code;
                return (
                  <button
                    key={opt.code}
                    type="button"
                    onClick={() => {
                      setDesconto(opt.code);
                      setDescontoOpen(false);
                      setExpandedDiscount(null);
                    }}
                    className={`text-left rounded-lg border-2 p-4 transition-all bg-card hover:border-primary hover:shadow-md flex flex-col ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h3 className="font-semibold text-sm leading-snug">{opt.label}</h3>
                      {isSelected && (
                        <div className="rounded-full bg-primary p-1 shrink-0">
                          <Check className="h-3 w-3 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                      {opt.shortText}
                    </p>
                    {opt.fullText && isExpanded && (
                      <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line mt-2 pt-2 border-t border-border">
                        {opt.fullText}
                      </p>
                    )}
                    {opt.fullText && (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedDiscount(isExpanded ? null : opt.code);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            e.stopPropagation();
                            setExpandedDiscount(isExpanded ? null : opt.code);
                          }
                        }}
                        className="text-xs text-primary font-medium mt-2 self-start hover:underline cursor-pointer"
                      >
                        {isExpanded ? "menos" : "mais"}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <DialogFooter className="sm:justify-between gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setDesconto("");
                  setDescontoOpen(false);
                  setExpandedDiscount(null);
                }}
              >
                Sem desconto
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDescontoOpen(false)}
              >
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
