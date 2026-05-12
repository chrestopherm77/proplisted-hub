import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, FileText, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { ProfilePersonalCard } from "./ProfilePersonalCard";
import { ProfileLocationCard } from "./ProfileLocationCard";
import { ProfileProfessionalCard } from "./ProfileProfessionalCard";
import { CONTRACT_TERMS, DPA_TERMS, TERMS_OF_USE } from "@/components/auth/constants/registrationTerms";

interface CompleteProfileModalProps {
  open: boolean;
  onClose: () => void;
  onCompleted?: () => void;
  forceCompletion?: boolean;
}

interface ProfileState {
  person_type: string;
  name: string; cpf: string; profession: string;
  company_name: string; cnpj: string; company_type: string;
  phone: string;
  address: string; address_uf: string; address_city: string; address_neighborhood: string;
  creci: string; creci_uf: string; cau: string; cau_uf: string; crea: string; crea_uf: string;
  creci_pj: string; creci_pj_uf: string; crea_pj: string; crea_pj_uf: string;
  rt_name: string; rt_cpf: string; rt_crea: string; rt_crea_uf: string; rt_cau: string; rt_cau_uf: string;
}

const defaultProfile: ProfileState = {
  person_type: "PF", name: "", cpf: "", profession: "",
  company_name: "", cnpj: "", company_type: "",
  phone: "",
  address: "", address_uf: "", address_city: "", address_neighborhood: "",
  creci: "", creci_uf: "", cau: "", cau_uf: "", crea: "", crea_uf: "",
  creci_pj: "", creci_pj_uf: "", crea_pj: "", crea_pj_uf: "",
  rt_name: "", rt_cpf: "", rt_crea: "", rt_crea_uf: "", rt_cau: "", rt_cau_uf: "",
};

const STEPS = [
  { id: 1, label: "Dados Pessoais" },
  { id: 2, label: "Endereço" },
  { id: 3, label: "Dados Profissionais" },
  { id: 4, label: "Contratos e Termos" },
];

type TermKey = "contract" | "dpa" | "termsOfUse";

const TERM_DETAILS: Record<TermKey, { title: string; content: string; field: string; label: string }> = {
  contract: { title: "Contrato de Parceria Comercial para Aquisição e Uso de Leads", content: CONTRACT_TERMS, field: "accepted_contract", label: "Contrato de Parceria Comercial" },
  dpa: { title: "Acordo de Tratamento de Dados Pessoais (DPA)", content: DPA_TERMS, field: "accepted_dpa", label: "Acordo de Tratamento de Dados (DPA)" },
  termsOfUse: { title: "Termo de Uso e Política de Privacidade", content: TERMS_OF_USE, field: "accepted_terms_of_use", label: "Termo de Uso e Política de Privacidade" },
};

export function CompleteProfileModal({ open, onClose, onCompleted, forceCompletion }: CompleteProfileModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileState>(defaultProfile);
  const [initialProfile, setInitialProfile] = useState<ProfileState>(defaultProfile);

  const [acceptedContract, setAcceptedContract] = useState(false);
  const [acceptedDPA, setAcceptedDPA] = useState(false);
  const [acceptedTermsOfUse, setAcceptedTermsOfUse] = useState(false);

  const [openTerm, setOpenTerm] = useState<TermKey | null>(null);
  const [hasReadOpenTerm, setHasReadOpenTerm] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    setStep(1);
    setLoading(true);
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data) {
        const mapped: ProfileState = { ...defaultProfile };
        for (const key of Object.keys(defaultProfile) as (keyof ProfileState)[]) {
          if ((data as any)[key] != null) mapped[key] = (data as any)[key] as string;
        }
        if (!mapped.person_type) mapped.person_type = "PF";
        setProfile(mapped);
        setInitialProfile(mapped);
        setAcceptedContract(!!(data as any).accepted_contract);
        setAcceptedDPA(!!(data as any).accepted_dpa);
        setAcceptedTermsOfUse(!!(data as any).accepted_terms_of_use);
      }
      setLoading(false);
    });
  }, [open, user?.id]);

  const updateProfile = (updates: Partial<ProfileState> | Record<string, string>) => {
    setProfile((prev) => ({ ...prev, ...(updates as any) }));
  };

  const validateStep = (s: number): string | null => {
    const req = (v: string) => v && v.toString().trim().length > 0;
    if (s === 1) {
      if (!profile.person_type) return "Selecione o tipo de pessoa";
      if (profile.person_type === "PF") {
        if (!req(profile.name)) return "Informe seu nome completo";
        if (!req(profile.cpf)) return "Informe seu CPF";
      } else {
        if (!req(profile.company_name)) return "Informe a razão social";
        if (!req(profile.cnpj)) return "Informe o CNPJ";
        if (!req(profile.company_type)) return "Selecione o tipo de empresa";
      }
    }
    if (s === 2) {
      if (!req(profile.address_uf)) return "Selecione o estado";
      if (!req(profile.address_city)) return "Selecione a cidade";
      if (!req(profile.address_neighborhood)) return "Informe o bairro";
      if (!req(profile.address)) return "Informe o endereço";
    }
    if (s === 3) {
      if (profile.person_type === "PF" && profile.profession === "corretor") {
        if (!req(profile.creci) || !req(profile.creci_uf)) return "Informe CRECI e UF";
      }
      if (profile.person_type === "PF" && profile.profession === "arquiteto") {
        if (!req(profile.cau) || !req(profile.cau_uf)) return "Informe CAU e UF";
      }
      if (profile.person_type === "PF" && profile.profession === "engenheiro") {
        if (!req(profile.crea) || !req(profile.crea_uf)) return "Informe CREA e UF";
      }
      if (profile.person_type === "PJ" && profile.company_type === "imobiliaria") {
        if (!req(profile.creci_pj) || !req(profile.creci_pj_uf)) return "Informe CRECI PJ e UF";
        if (!req(profile.rt_name) || !req(profile.rt_cpf)) return "Informe os dados do RT";
      }
      if (profile.person_type === "PJ" && profile.company_type === "construtora") {
        if (!req(profile.crea_pj) || !req(profile.crea_pj_uf)) return "Informe CREA PJ e UF";
        if (!req(profile.rt_name) || !req(profile.rt_cpf)) return "Informe os dados do RT";
      }
    }
    if (s === 4) {
      if (!acceptedContract || !acceptedDPA || !acceptedTermsOfUse) return "Aceite todos os termos para concluir";
    }
    // Bloqueia remoção de dado já preenchido
    for (const key of Object.keys(initialProfile) as (keyof ProfileState)[]) {
      const wasFilled = (initialProfile[key] || "").toString().trim().length > 0;
      const nowEmpty = !(profile[key] || "").toString().trim();
      if (wasFilled && nowEmpty) return `Não é possível remover o campo já preenchido (${key})`;
    }
    return null;
  };

  const next = () => {
    const err = validateStep(step);
    if (err) { toast.error(err); return; }
    setStep((s) => Math.min(STEPS.length, s + 1));
  };
  const prev = () => setStep((s) => Math.max(1, s - 1));

  const openTermDialog = (key: TermKey) => {
    const accepted = key === "contract" ? acceptedContract : key === "dpa" ? acceptedDPA : acceptedTermsOfUse;
    if (accepted) return;
    setHasReadOpenTerm(false);
    setOpenTerm(key);
  };
  const acceptCurrentTerm = () => {
    if (!openTerm) return;
    if (openTerm === "contract") setAcceptedContract(true);
    if (openTerm === "dpa") setAcceptedDPA(true);
    if (openTerm === "termsOfUse") setAcceptedTermsOfUse(true);
    setOpenTerm(null);
  };

  const handleFinish = async () => {
    if (!user) return;
    const err = validateStep(4);
    if (err) { toast.error(err); return; }
    setSaving(true);
    try {
      const { error: upErr } = await supabase
        .from("profiles")
        .update({
          ...profile,
          accepted_terms: true,
          accepted_contract: true,
          accepted_dpa: true,
          accepted_terms_of_use: true,
          terms_accepted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", user.id);
      if (upErr) throw upErr;

      const { data, error } = await supabase.rpc("mark_profile_complete", { p_user_id: user.id });
      if (error) throw error;
      const result = data as { success?: boolean; error?: string };
      if (result?.error) { toast.error(result.error); return; }

      toast.success("Cadastro completo! Obrigado.");
      onCompleted?.();
      onClose();
    } catch (e: any) {
      toast.error(e?.message || "Erro ao concluir cadastro");
    } finally {
      setSaving(false);
    }
  };

  const progress = (step / STEPS.length) * 100;

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (!o && !forceCompletion) onClose();
        }}
      >
        <DialogContent
          className="max-w-2xl h-[90vh] flex flex-col p-0 gap-0"
          onPointerDownOutside={(e) => { if (forceCompletion) e.preventDefault(); }}
          onEscapeKeyDown={(e) => { if (forceCompletion) e.preventDefault(); }}
        >
          <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
            <DialogTitle>Complete seu cadastro</DialogTitle>
            <DialogDescription>
              Etapa {step} de {STEPS.length} — {STEPS[step - 1].label}
            </DialogDescription>
            <Progress value={progress} className="h-2 mt-2" />
          </DialogHeader>

          <ScrollArea className="flex-1 min-h-0">
            <div className="p-6 space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  {step === 1 && (
                    <ProfilePersonalCard profile={profile} onChange={updateProfile} />
                  )}

                  {step === 2 && (
                    <ProfileLocationCard
                      address_uf={profile.address_uf}
                      address_city={profile.address_city}
                      address_neighborhood={profile.address_neighborhood}
                      address={profile.address}
                      onChange={updateProfile}
                    />
                  )}

                  {step === 3 && (
                    <>
                      <ProfileProfessionalCard
                        person_type={profile.person_type}
                        profession={profile.profession}
                        company_type={profile.company_type}
                        creci={profile.creci} creci_uf={profile.creci_uf}
                        cau={profile.cau} cau_uf={profile.cau_uf}
                        crea={profile.crea} crea_uf={profile.crea_uf}
                        creci_pj={profile.creci_pj} creci_pj_uf={profile.creci_pj_uf}
                        crea_pj={profile.crea_pj} crea_pj_uf={profile.crea_pj_uf}
                        rt_name={profile.rt_name} rt_cpf={profile.rt_cpf}
                        rt_crea={profile.rt_crea} rt_crea_uf={profile.rt_crea_uf}
                        rt_cau={profile.rt_cau} rt_cau_uf={profile.rt_cau_uf}
                        onChange={updateProfile}
                      />
                      {((profile.person_type === "PF" && !profile.profession) ||
                        (profile.person_type === "PJ" && !profile.company_type)) && (
                        <p className="text-sm text-muted-foreground text-center py-6">
                          Volte à etapa 1 e selecione {profile.person_type === "PF" ? "uma profissão" : "o tipo de empresa"} para preencher os registros profissionais.
                        </p>
                      )}
                    </>
                  )}

                  {step === 4 && (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Para concluir, leia e aceite os três termos abaixo. Clique em cada item para abrir o documento.
                      </p>
                      {(Object.keys(TERM_DETAILS) as TermKey[]).map((key) => {
                        const accepted = key === "contract" ? acceptedContract : key === "dpa" ? acceptedDPA : acceptedTermsOfUse;
                        const t = TERM_DETAILS[key];
                        return (
                          <div
                            key={key}
                            onClick={() => openTermDialog(key)}
                            className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                              accepted ? "bg-primary/5 border-primary/30" : "hover:bg-muted/50"
                            }`}
                          >
                            <Checkbox checked={accepted} className="mt-0.5" onCheckedChange={() => openTermDialog(key)} />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 font-medium text-sm">
                                <FileText className="w-4 h-4 text-primary" />
                                {t.label} *
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {accepted ? "Aceito" : "Clique para ler e aceitar"}
                              </p>
                            </div>
                            {accepted && <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </ScrollArea>

          <div className="border-t bg-muted/30 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
            {!forceCompletion ? (
              <Button variant="ghost" onClick={onClose} disabled={saving}>Continuar depois</Button>
            ) : <span />}
            <div className="flex gap-2 w-full sm:w-auto">
              {step > 1 && (
                <Button variant="outline" onClick={prev} disabled={saving} className="flex-1 sm:flex-none">
                  <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
                </Button>
              )}
              {step < STEPS.length ? (
                <Button onClick={next} className="flex-1 sm:flex-none">
                  Avançar <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={handleFinish} disabled={saving || !acceptedContract || !acceptedDPA || !acceptedTermsOfUse} className="flex-1 sm:flex-none">
                  {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Concluindo...</> : "Concluir cadastro"}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de leitura do termo */}
      <Dialog open={openTerm !== null} onOpenChange={(o) => { if (!o) setOpenTerm(null); }}>
        <DialogContent className="max-w-2xl h-[85vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
            <DialogTitle>{openTerm ? TERM_DETAILS[openTerm].title : ""}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 min-h-0">
            <div className="px-6 py-4">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {openTerm ? TERM_DETAILS[openTerm].content : ""}
              </pre>
            </div>
          </ScrollArea>
          <div className="px-6 py-4 border-t bg-muted/30 space-y-3 shrink-0">
            <div className="flex items-center space-x-2">
              <Checkbox id="readTerm" checked={hasReadOpenTerm} onCheckedChange={(c) => setHasReadOpenTerm(c === true)} />
              <label htmlFor="readTerm" className="text-sm font-medium leading-none">Li e compreendi os termos acima</label>
            </div>
            <Button onClick={acceptCurrentTerm} disabled={!hasReadOpenTerm} className="w-full">Aceito os Termos</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
