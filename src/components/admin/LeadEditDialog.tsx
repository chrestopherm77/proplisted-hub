import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  splitFormDataIntoPreferences,
  regenerateDescriptionFromFormData,
  type LeadPreference,
  type FlowKey,
} from "@/lib/leadPreferences";
import { intentionLabelsExport } from "@/lib/formatFormData";

interface LeadEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: {
    id: string;
    name: string;
    phone: string;
    description: string;
    price: number;
    max_purchases: number;
    is_active: boolean;
    is_promotion: boolean;
    is_exhausted: boolean;
    form_data?: any;
  } | null;
  onSaved: () => void;
}

const OPT = {
  purpose: [
    ["HOUSING", "Moradia"],
    ["INVESTMENT", "Investimento"],
    ["COMMERCIAL", "Comercial"],
    ["TEMPORARY", "Temporário"],
  ],
  propertyType: [
    ["RESIDENTIAL", "Residencial"],
    ["COMMERCIAL", "Comercial"],
    ["MIXED", "Misto"],
    ["RURAL", "Rural"],
    ["LAND", "Terreno"],
    ["HOUSE", "Casa"],
    ["APARTMENT", "Apartamento"],
    ["KITNET", "Kitnet"],
    ["OFFICE", "Sala comercial"],
    ["STORE", "Loja"],
    ["WAREHOUSE", "Galpão"],
    ["MULTIPLE", "Múltiplos tipos"],
  ],
  commercialType: [
    ["BUILDING", "Prédio comercial"],
    ["WAREHOUSE", "Galpão"],
    ["OFFICE", "Sala comercial"],
    ["STORE", "Loja"],
    ["HOUSE", "Casa"],
    ["OTHER", "Outro"],
    ["MULTIPLE", "Múltiplos tipos"],
  ],
  residentialType: [
    ["HOUSE", "Casa"],
    ["APARTMENT", "Apartamento"],
    ["KITNET", "Kitnet"],
    ["TOWNHOUSE", "Sobrado"],
    ["CONDO_HOUSE", "Casa de condomínio"],
    ["PENTHOUSE", "Cobertura"],
    ["LOFT", "Loft"],
    ["STUDIO", "Studio"],
    ["LAND", "Terreno"],
    ["MULTIPLE", "Múltiplos tipos"],
  ],
  mixedType: [
    ["RESIDENTIAL_COMMERCIAL", "Residencial + Comercial"],
    ["STORE_APARTMENT", "Loja + Apartamento"],
    ["OFFICE_RESIDENTIAL", "Escritório + Residencial"],
    ["OTHER", "Outro"],
  ],
  ruralType: [
    ["FARM", "Fazenda"],
    ["SITIO", "Sítio"],
    ["CHACARA", "Chácara"],
    ["OTHER", "Outro"],
  ],
  relation: [
    ["OWNER", "Proprietário"],
    ["LEGAL_REP", "Representante Legal"],
    ["FAMILY", "Familiar do proprietário"],
    ["BROKER", "Corretor/Imobiliária"],
  ],
  acceptsExclusivity: [
    ["YES", "Sim"],
    ["NO", "Não"],
    ["DEPENDS", "Depende das condições"],
  ],
  hasLand: [
    ["YES", "Sim, já possui"],
    ["NEGOTIATING", "Em negociação"],
    ["NO", "Não possui"],
    ["BTS", "Built To Suit (BTS)"],
    ["BTS_INTEREST", "Interesse em BTS"],
  ],
  topography: [
    ["FLAT", "Plano"],
    ["SLIGHT_SLOPE", "Leve declive"],
    ["UPHILL", "Aclive"],
    ["DOWNHILL", "Declive"],
    ["STEEP", "Acentuado"],
    ["IRREGULAR", "Irregular"],
    ["UNKNOWN", "Não sei informar"],
  ],
  hasProject: [
    ["YES", "Sim"],
    ["COMPLETE", "Projeto completo"],
    ["IN_PROGRESS", "Em andamento"],
    ["NONE", "Não possui"],
    ["NO", "Não"],
    ["NEED_HELP", "Precisa de ajuda"],
  ],
  paymentMethod: [
    ["CASH", "À vista"],
    ["FINANCING", "Financiamento"],
    ["INSTALLMENTS", "Parcelado"],
    ["FGTS", "FGTS"],
    ["CONSORTIUM", "Consórcio"],
    ["EXCHANGE", "Permuta"],
    ["MIXED", "Misto"],
  ],
  guarantee: [
    ["GUARANTOR", "Fiador"],
    ["DEPOSIT", "Caução"],
    ["INSURANCE", "Seguro fiança"],
    ["CAPITALIZATION", "Título de capitalização"],
    ["NONE", "Nenhuma"],
    ["UNKNOWN", "Ainda não sei"],
  ],
  propertyReadyStatus: [
    ["READY", "Pronto para morar"],
    ["UNDER_CONSTRUCTION", "Em construção"],
    ["BOTH", "Pronto ou em construção"],
  ],
  tradeOfferType: [
    ["PROPERTY", "Imóvel"],
    ["VEHICLE", "Veículo"],
    ["OTHER", "Outro"],
  ],
  documentation: [
    ["COMPLETE", "Toda regularizada"],
    ["PARTIAL", "Parcialmente regularizada"],
    ["PENDING", "Pendências a resolver"],
    ["UNKNOWN", "Não sei informar"],
  ],
  deadline: [
    ["IMMEDIATE", "Imediato"],
    ["UP_TO_1_MONTH", "Até 1 mês"],
    ["UP_TO_3_MONTHS", "Até 3 meses"],
    ["1_TO_3_MONTHS", "1 a 3 meses"],
    ["3_TO_6_MONTHS", "3 a 6 meses"],
    ["6_TO_12_MONTHS", "6 a 12 meses"],
    ["OVER_12_MONTHS", "Mais de 12 meses"],
    ["NO_RUSH", "Sem pressa"],
    ["FLEXIBLE", "Flexível"],
  ],
  moveInDeadline: [
    ["IMMEDIATE", "Imediato"],
    ["UP_TO_30_DAYS", "Até 30 dias"],
    ["UP_TO_3_MONTHS", "Até 3 meses"],
    ["MORE_THAN_3_MONTHS", "Mais de 3 meses"],
    ["FLEXIBLE", "Flexível"],
  ],
  terrainPosition: [
    ["CORNER", "Esquina"],
    ["MIDDLE", "Meio de quadra"],
    ["THROUGH", "De uma rua a outra"],
    ["IRREGULAR", "Formato irregular"],
    ["UNKNOWN", "Não sei informar"],
  ],
  occupantHasPreference: [
    ["YES", "Sim"],
    ["NO", "Não"],
    ["NOT_ASKED", "Não solicitado"],
  ],
} as const;

type OptionKey = keyof typeof OPT;

const FIELD_LABELS: Record<string, string> = {
  purpose: "Finalidade",
  propertyType: "Tipo de imóvel",
  commercialType: "Tipo comercial",
  residentialType: "Tipo residencial",
  mixedType: "Tipo misto",
  ruralType: "Tipo rural",
  relation: "Relação com o imóvel",
  acceptsExclusivity: "Aceita exclusividade",
  hasLand: "Possui terreno",
  topography: "Topografia",
  residentialTopography: "Topografia",
  hasProject: "Status do projeto",
  paymentMethod: "Forma de pagamento",
  guarantee: "Garantia",
  propertyReadyStatus: "Status do imóvel",
  tradeOfferType: "Tipo de permuta",
  tradeOfferValue: "Valor da permuta",
  tradeOfferPaidOff: "Permuta quitada",
  documentation: "Documentação",
  deadline: "Prazo",
  moveInDeadline: "Prazo para mudança",
  terrainPosition: "Posição do terreno",
  occupantHasPreference: "Ocupante tem preferência",
  bedrooms: "Dormitórios",
  bathrooms: "Banheiros",
  parkingSpots: "Vagas",
  commercialBedrooms: "Dormitórios (comercial)",
  commercialBathrooms: "Banheiros (comercial)",
  commercialParkingSpots: "Vagas (comercial)",
  size: "Tamanho",
  minSize: "Tamanho mínimo",
  landMinSize: "Tamanho mínimo terreno",
  budget: "Orçamento",
  budgetMin: "Orçamento mínimo",
  budgetMax: "Orçamento máximo",
  expectedValue: "Valor esperado",
  maxRent: "Aluguel máximo",
  region: "Região",
  location: "Localização",
  uf: "UF",
  city: "Cidade",
  neighborhood: "Bairro",
  area: "Área (m²)",
  floors: "Pavimentos",
  hasKnowledge: "Conhecimento em construção",
  prefersGatedCommunity: "Prefere condomínio fechado",
  landPrefersGated: "Prefere condomínio (terreno)",
  isFinancingApproved: "Financiamento aprovado",
  isConsortiumContemplated: "Consórcio contemplado",
  wasAppraised: "Foi avaliado",
  isOccupied: "Está ocupado",
  includesCondoAndTax: "Inclui condomínio e IPTU",
  isBTSConfirmed: "Built To Suit confirmado",
  btsRentRange: "Faixa de aluguel BTS",
  btsMinContractTerm: "Prazo mínimo BTS",
  motivation: "Motivação",
  ruralArea: "Área rural",
  ruralPurpose: "Finalidade rural",
};

const FIELD_TO_OPTION: Record<string, OptionKey> = {
  purpose: "purpose",
  propertyType: "propertyType",
  commercialType: "commercialType",
  residentialType: "residentialType",
  mixedType: "mixedType",
  ruralType: "ruralType",
  relation: "relation",
  acceptsExclusivity: "acceptsExclusivity",
  hasLand: "hasLand",
  topography: "topography",
  residentialTopography: "topography",
  hasProject: "hasProject",
  paymentMethod: "paymentMethod",
  guarantee: "guarantee",
  propertyReadyStatus: "propertyReadyStatus",
  tradeOfferType: "tradeOfferType",
  documentation: "documentation",
  deadline: "deadline",
  moveInDeadline: "moveInDeadline",
  terrainPosition: "terrainPosition",
  occupantHasPreference: "occupantHasPreference",
};

const BOOLEAN_FIELDS = new Set([
  "hasKnowledge",
  "prefersGatedCommunity",
  "landPrefersGated",
  "isFinancingApproved",
  "isConsortiumContemplated",
  "wasAppraised",
  "isOccupied",
  "includesCondoAndTax",
  "isBTSConfirmed",
  "tradeOfferPaidOff",
]);

const FIELD_ORDER = [
  "purpose",
  "propertyType",
  "commercialType",
  "residentialType",
  "mixedType",
  "ruralType",
  "relation",
  "acceptsExclusivity",
  "hasLand",
  "topography",
  "residentialTopography",
  "hasProject",
  "uf",
  "city",
  "neighborhood",
  "region",
  "location",
  "bedrooms",
  "bathrooms",
  "parkingSpots",
  "commercialBedrooms",
  "commercialBathrooms",
  "commercialParkingSpots",
  "size",
  "minSize",
  "landMinSize",
  "area",
  "floors",
  "terrainPosition",
  "propertyReadyStatus",
  "prefersGatedCommunity",
  "landPrefersGated",
  "wasAppraised",
  "isOccupied",
  "occupantHasPreference",
  "expectedValue",
  "budget",
  "budgetMin",
  "budgetMax",
  "maxRent",
  "includesCondoAndTax",
  "paymentMethod",
  "isFinancingApproved",
  "isConsortiumContemplated",
  "tradeOfferType",
  "tradeOfferValue",
  "tradeOfferPaidOff",
  "guarantee",
  "isBTSConfirmed",
  "btsRentRange",
  "btsMinContractTerm",
  "documentation",
  "deadline",
  "moveInDeadline",
  "motivation",
  "ruralArea",
  "ruralPurpose",
  "hasKnowledge",
];

interface BasicForm {
  name: string;
  phone: string;
  price: string;
  max_purchases: string;
  description: string;
  is_active: boolean;
  is_promotion: boolean;
  is_exhausted: boolean;
}

export function LeadEditDialog({ open, onOpenChange, lead, onSaved }: LeadEditDialogProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [basic, setBasic] = useState<BasicForm>({
    name: "",
    phone: "",
    price: "",
    max_purchases: "5",
    description: "",
    is_active: true,
    is_promotion: false,
    is_exhausted: false,
  });

  const [prefs, setPrefs] = useState<LeadPreference[]>([]);
  const [activeTab, setActiveTab] = useState<string>("basic");

  useEffect(() => {
    if (!lead || !open) return;

    setBasic({
      name: lead.name || "",
      phone: lead.phone || "",
      price: String(lead.price ?? ""),
      max_purchases: String(lead.max_purchases ?? "5"),
      description: lead.description || "",
      is_active: !!lead.is_active,
      is_promotion: !!lead.is_promotion,
      is_exhausted: !!lead.is_exhausted,
    });

    let parsed: any = lead.form_data;
    if (typeof parsed === "string") {
      try { parsed = JSON.parse(parsed); } catch { parsed = null; }
    }
    setPrefs(splitFormDataIntoPreferences(parsed));
    setActiveTab("basic");
  }, [lead, open]);

  const updatePrefField = (prefIdx: number, key: string, value: any) => {
    setPrefs((cur) => {
      const next = [...cur];
      const target = { ...next[prefIdx] };
      const newData: Record<string, any> = { ...target.flowData };
      if (value === "" || value === null || value === undefined) {
        delete newData[key];
      } else {
        newData[key] = value;
      }
      target.flowData = newData;
      next[prefIdx] = target;
      return next;
    });
  };

  const removePref = (prefIdx: number) => {
    if (!confirm("Remover esta preferência? Esta ação não pode ser desfeita até salvar.")) return;
    setPrefs((cur) => cur.filter((_, i) => i !== prefIdx).map((p, i) => ({ ...p, index: i + 1 })));
    setActiveTab("basic");
  };

  const buildMergedFormData = (): any => {
    const out: Record<string, any> = {};
    const intentions: string[] = [];

    const byFlow: Record<FlowKey, Record<string, any>[]> = {
      sell: [], buy: [], build: [], rent: [],
    };
    for (const p of prefs) {
      byFlow[p.flowKey].push(p.flowData);
      if (!intentions.includes(p.intention)) intentions.push(p.intention);
    }

    for (const flowKey of ["sell", "buy", "build", "rent"] as FlowKey[]) {
      const arr = byFlow[flowKey];
      if (arr.length === 1) out[flowKey] = arr[0];
      else if (arr.length > 1) out[flowKey] = arr;
    }

    if (intentions.length === 1) out.intention = intentions[0];
    else if (intentions.length > 1) out.intention = intentions;

    return out;
  };

  const handleSave = async () => {
    if (!lead) return;
    setSaving(true);
    try {
      const mergedFormData = buildMergedFormData();
      const wasDescriptionEdited = basic.description.trim() !== (lead.description || "").trim();
      const newDescription = wasDescriptionEdited
        ? basic.description
        : (regenerateDescriptionFromFormData(mergedFormData) || basic.description);

      const updates = {
        name: basic.name.trim(),
        phone: basic.phone.trim(),
        price: parseFloat(basic.price) || 0,
        max_purchases: parseInt(basic.max_purchases) || 5,
        description: newDescription,
        is_active: basic.is_active,
        is_promotion: basic.is_promotion,
        is_exhausted: basic.is_exhausted,
        form_data: mergedFormData,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("leads").update(updates).eq("id", lead.id);
      if (error) throw error;

      toast({ title: "Lead atualizado", description: "Todas as alterações foram salvas." });
      onSaved();
      onOpenChange(false);
    } catch (err: any) {
      toast({
        title: "Erro ao salvar",
        description: err?.message || "Não foi possível atualizar o lead.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const orderedKeys = (data: Record<string, any>): string[] => {
    const keysInData = new Set(Object.keys(data));
    const ordered: string[] = [];
    for (const k of FIELD_ORDER) {
      if (keysInData.has(k)) ordered.push(k);
    }
    for (const k of Object.keys(data)) {
      if (!ordered.includes(k)) ordered.push(k);
    }
    return ordered;
  };

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="flex-shrink-0 px-6 pt-6">
          <DialogTitle>Editar Lead — {basic.name || "sem nome"}</DialogTitle>
          <DialogDescription>
            Edite dados básicos e cada preferência preenchida no formulário.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 px-6 pb-2 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="flex-shrink-0 flex w-full overflow-x-auto justify-start h-auto flex-wrap">
              <TabsTrigger value="basic">Dados básicos</TabsTrigger>
              {prefs.map((p, i) => (
                <TabsTrigger key={`pref-${i}`} value={`pref-${i}`}>
                  Preferência {i + 1} ({intentionLabelsExport[p.intention] || p.intention})
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="flex-1 min-h-0 mt-4">
              <ScrollArea className="h-full pr-2">
                <TabsContent value="basic" className="mt-0 space-y-4 pb-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="le-name">Nome</Label>
                      <Input id="le-name" value={basic.name}
                        onChange={(e) => setBasic({ ...basic, name: e.target.value })} />
                    </div>
                    <div>
                      <Label htmlFor="le-phone">Telefone</Label>
                      <Input id="le-phone" value={basic.phone}
                        onChange={(e) => setBasic({ ...basic, phone: e.target.value })} />
                    </div>
                    <div>
                      <Label htmlFor="le-price">Créditos</Label>
                      <Input id="le-price" type="number" step="1" value={basic.price}
                        onChange={(e) => setBasic({ ...basic, price: e.target.value })} />
                    </div>
                    <div>
                      <Label htmlFor="le-max">Máximo de vendas</Label>
                      <Input id="le-max" type="number" value={basic.max_purchases}
                        onChange={(e) => setBasic({ ...basic, max_purchases: e.target.value })} />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-6 pt-2">
                    <div className="flex items-center gap-2">
                      <Switch id="le-active" checked={basic.is_active}
                        onCheckedChange={(v) => setBasic({ ...basic, is_active: v })} />
                      <Label htmlFor="le-active">Ativo</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch id="le-promo" checked={basic.is_promotion}
                        onCheckedChange={(v) => setBasic({ ...basic, is_promotion: v })} />
                      <Label htmlFor="le-promo">Promoção</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch id="le-exh" checked={basic.is_exhausted}
                        onCheckedChange={(v) => setBasic({ ...basic, is_exhausted: v })} />
                      <Label htmlFor="le-exh">Esgotado</Label>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="le-desc">
                      Descrição{" "}
                      <span className="text-xs text-muted-foreground font-normal">
                        (regenerada automaticamente ao salvar se você não editar manualmente)
                      </span>
                    </Label>
                    <Textarea id="le-desc" rows={6} value={basic.description}
                      onChange={(e) => setBasic({ ...basic, description: e.target.value })} />
                  </div>
                </TabsContent>

                {prefs.map((pref, prefIdx) => (
                  <TabsContent key={`pref-content-${prefIdx}`} value={`pref-${prefIdx}`} className="mt-0 space-y-4 pb-6">
                    <div className="flex items-center justify-between gap-4 pb-2 border-b">
                      <div>
                        <h3 className="text-base font-semibold">
                          Preferência {prefIdx + 1} — {intentionLabelsExport[pref.intention] || pref.intention}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Flow: <code>{pref.flowKey}</code>
                        </p>
                      </div>
                      <Button variant="destructive" size="sm" onClick={() => removePref(prefIdx)}>
                        <Trash2 className="h-4 w-4 mr-1" /> Excluir esta preferência
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {orderedKeys(pref.flowData).map((key) => (
                        <FieldEditor
                          key={key}
                          fieldKey={key}
                          value={pref.flowData[key]}
                          onChange={(v) => updatePrefField(prefIdx, key, v)}
                        />
                      ))}
                    </div>

                    <AddFieldRow
                      existing={Object.keys(pref.flowData)}
                      onAdd={(k) => updatePrefField(prefIdx, k, BOOLEAN_FIELDS.has(k) ? false : "")}
                    />
                  </TabsContent>
                ))}
              </ScrollArea>
            </div>
          </Tabs>
        </div>

        <div className="flex-shrink-0 px-6 py-4 border-t flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Salvar tudo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FieldEditor({
  fieldKey,
  value,
  onChange,
}: {
  fieldKey: string;
  value: any;
  onChange: (v: any) => void;
}) {
  const label = FIELD_LABELS[fieldKey] || fieldKey;

  if (BOOLEAN_FIELDS.has(fieldKey) || typeof value === "boolean") {
    return (
      <div className="flex items-center justify-between gap-2 rounded-md border border-border p-3">
        <Label className="text-sm">{label}</Label>
        <Switch checked={!!value} onCheckedChange={(v) => onChange(v)} />
      </div>
    );
  }

  if (Array.isArray(value)) {
    return (
      <div>
        <Label>{label} <span className="text-xs text-muted-foreground">(separe por vírgula)</span></Label>
        <Input
          value={value.join(", ")}
          onChange={(e) => {
            const parts = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
            onChange(parts);
          }}
        />
      </div>
    );
  }

  const optKey = FIELD_TO_OPTION[fieldKey];
  if (optKey) {
    const options = OPT[optKey];
    const strValue = value == null ? "" : String(value);
    return (
      <div>
        <Label>{label}</Label>
        <Select value={strValue} onValueChange={(v) => onChange(v)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            {options.map(([val, lbl]) => (
              <SelectItem key={val} value={val}>{lbl}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div>
      <Label>{label}</Label>
      <Input
        value={value == null ? "" : String(value)}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

const COMMON_FIELDS = [
  "uf", "city", "neighborhood", "region", "location",
  "bedrooms", "bathrooms", "parkingSpots", "size", "area",
  "expectedValue", "budget", "budgetMin", "budgetMax", "maxRent",
  "paymentMethod", "guarantee", "deadline", "moveInDeadline",
  "purpose", "propertyType",
];

function AddFieldRow({ existing, onAdd }: { existing: string[]; onAdd: (key: string) => void }) {
  const available = COMMON_FIELDS.filter((k) => !existing.includes(k));
  if (available.length === 0) return null;
  return (
    <div className="flex items-center gap-2 pt-2 border-t border-dashed">
      <Label className="text-xs text-muted-foreground">Adicionar campo:</Label>
      <Select value="" onValueChange={(v) => v && onAdd(v)}>
        <SelectTrigger className="w-[280px] h-8 text-xs">
          <SelectValue placeholder="Selecione um campo para adicionar..." />
        </SelectTrigger>
        <SelectContent>
          {available.map((k) => (
            <SelectItem key={k} value={k}>{FIELD_LABELS[k] || k}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
