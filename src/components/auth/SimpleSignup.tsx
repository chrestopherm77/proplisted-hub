import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { useIBGELocation } from "@/hooks/useIBGELocation";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { validateEmail, validatePhone, validatePassword, formatPhone } from "@/lib/validators";
import { UF_OPTIONS } from "@/types/signup";
import { GoogleAuthButton } from "./GoogleAuthButton";
import { Loader2, User, Phone, MapPin, Building2, Mail, IdCard, Lock, Eye, EyeOff, ChevronsUpDown, Check, CheckCircle, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { trackSignupProgress, markSignupCompleted } from "@/lib/signupTracking";
import type { SignupFormData } from "@/types/signup";

interface SimpleSignupProps {
  onSwitchToLogin: () => void;
  initialReferralCode?: string;
}

export function SimpleSignup({ onSwitchToLogin, initialReferralCode }: SimpleSignupProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [uf, setUf] = useState("");
  const [city, setCity] = useState("");
  const [email, setEmail] = useState("");
  const [creci, setCreci] = useState("");
  const [creciUf, setCreciUf] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [openCity, setOpenCity] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [isCheckingWa, setIsCheckingWa] = useState(false);

  const { states, cities, loadingStates, loadingCities, fetchCities, clearCities } = useIBGELocation();

  useEffect(() => {
    if (uf) fetchCities(uf);
    else clearCities();
  }, [uf, fetchCities, clearCities]);

  // Monta payload do tracking (etapa única)
  const buildTrackingData = (): SignupFormData => ({
    personType: "PF",
    email,
    phone,
    address: "",
    addressUf: uf,
    addressCity: city,
    addressNeighborhood: "",
    name,
    cpf: "",
    profession: creci.trim() ? "CORRETOR" : null,
    creci,
    creciUf,
    cau: "", cauUf: "", crea: "", creaUf: "",
    companyName: "", cnpj: "", companyType: null,
    creciPj: "", creciPjUf: "", creaPj: "", creaPjUf: "",
    rtName: "", rtCpf: "", rtCrea: "", rtCreaUf: "", rtCau: "", rtCauUf: "",
    password: "", confirmPassword: "",
    acceptedContract: false, acceptedDPA: false, acceptedTermsOfUse: false,
    referralCode: initialReferralCode || "",
  });

  // Rastreia "Em preenchimento" sempre que campos relevantes mudam
  useEffect(() => {
    const hasAnyData = !!(name.trim() || email.trim() || phone.trim());
    if (!hasAnyData) return;
    trackSignupProgress(buildTrackingData(), {
      currentStep: 1,
      stepLabel: "Em preenchimento",
      totalSteps: 1,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, email, phone, uf, city, creci, creciUf]);

  const handleUfChange = (newUf: string) => {
    setUf(newUf);
    setCity("");
  };

  const handlePhoneChange = (v: string) => {
    setPhone(formatPhone(v));
    if (phoneVerified) setPhoneVerified(false);
  };

  const handleCheckWhatsApp = async () => {
    if (!phone || !validatePhone(phone)) {
      setErrors((prev) => ({ ...prev, phone: "Telefone inválido" }));
      return;
    }
    setIsCheckingWa(true);
    setErrors((prev) => ({ ...prev, phone: "" }));
    try {
      const { data, error } = await supabase.functions.invoke("check-whatsapp", { body: { phone } });
      if (error) throw new Error(error.message);
      if (data?.exists) {
        setPhoneVerified(true);
        toast.success("WhatsApp verificado com sucesso!");
      } else {
        setErrors((prev) => ({ ...prev, phone: "Este número não possui WhatsApp ativo" }));
        toast.error("Este número não possui WhatsApp ativo");
      }
    } catch (err: any) {
      toast.error(err?.message || "Erro ao verificar WhatsApp");
    } finally {
      setIsCheckingWa(false);
    }
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Nome é obrigatório";
    if (!phone.trim()) e.phone = "Telefone é obrigatório";
    else if (!validatePhone(phone)) e.phone = "Telefone inválido";
    if (!phoneVerified) e.phone = "Valide seu WhatsApp antes de continuar";
    if (!uf) e.uf = "Estado é obrigatório";
    if (!city) e.city = "Cidade é obrigatória";
    if (!email.trim()) e.email = "E-mail é obrigatório";
    else if (!validateEmail(email)) e.email = "E-mail inválido";
    if (!creci.trim()) e.creci = "CRECI é obrigatório";
    if (!creciUf) e.creciUf = "UF do CRECI é obrigatória";

    const pwd = validatePassword(password);
    if (!pwd.valid) e.password = pwd.message;
    if (password !== confirmPassword) e.confirmPassword = "As senhas não conferem";

    setErrors(e);
    if (Object.keys(e).length > 0) {
      toast.error("Preencha todos os campos obrigatórios");
      return false;
    }
    return true;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      // Verifica limite de telefone
      const { data: phoneOk, error: phoneErr } = await supabase.rpc("check_phone_availability", { p_phone: phone });
      if (phoneErr) {
        toast.error("Erro ao validar telefone");
        setLoading(false);
        return;
      }
      if (!phoneOk) {
        setErrors((prev) => ({ ...prev, phone: "Este telefone já possui o limite máximo de contas" }));
        toast.error("Este telefone já possui o limite máximo de contas");
        setLoading(false);
        return;
      }

      const metadata: Record<string, string> = {
        person_type: "PF",
        name: name.trim(),
        phone,
        address_uf: uf,
        address_city: city,
        profession: "CORRETOR",
        creci: creci.trim(),
        creci_uf: creciUf,
        referral_code: (initialReferralCode || "").toUpperCase().trim(),
      };

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: metadata,
        },
      });

      if (error) {
        if (error.message.includes("already registered")) {
          toast.error("Este e-mail já está cadastrado. Tente fazer login.");
        } else {
          toast.error(error.message);
        }
        setLoading(false);
        return;
      }

      // Resgata indicação se houver
      const code = (initialReferralCode || "").toUpperCase().trim();
      if (code && data?.user?.id) {
        try {
          await supabase.rpc("redeem_referral", { p_user_id: data.user.id, p_referral_code: code });
        } catch { /* ignore */ }
      }

      toast.success("Cadastro realizado com sucesso!");
      if (data?.user?.id) {
        try { await markSignupCompleted(data.user.id, buildTrackingData(), 1); } catch { /* ignore */ }
      }
      const { clearPendingPlan } = await import("@/lib/pendingPlan");
      clearPendingPlan();
      setTimeout(() => { window.location.href = "/cadastro-realizado"; }, 600);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Erro ao criar conta");
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-6 md:p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">Crie sua conta</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cadastro rápido — você pode completar seus dados depois
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2"><User className="w-4 h-4" /> Nome completo *</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)}
              className={errors.name ? "border-destructive" : ""} placeholder="Seu nome completo" />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>

          {/* Telefone */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2"><Phone className="w-4 h-4" /> Telefone (WhatsApp) *</Label>
            <Input id="phone" value={phone} onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="(11) 91234-5678"
              disabled={phoneVerified}
              className={errors.phone ? "border-destructive" : ""} />
            {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
            {!phoneVerified ? (
              <Button type="button" variant="outline" className="w-full gap-2"
                onClick={handleCheckWhatsApp}
                disabled={isCheckingWa || !phone || !validatePhone(phone)}>
                {isCheckingWa ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Verificando WhatsApp...</>
                ) : (
                  <><Send className="w-4 h-4" /> Validar WhatsApp</>
                )}
              </Button>
            ) : (
              <div className="flex items-center justify-center gap-2 p-2 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 rounded-md border border-green-200 dark:border-green-900 text-sm">
                <CheckCircle className="w-4 h-4" />
                <span className="font-medium">WhatsApp verificado</span>
              </div>
            )}
          </div>

          {/* Estado / Cidade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Estado *</Label>
              <Select value={uf} onValueChange={handleUfChange}>
                <SelectTrigger className={errors.uf ? "border-destructive" : ""}>
                  <SelectValue placeholder={loadingStates ? "Carregando..." : "Selecione"} />
                </SelectTrigger>
                <SelectContent>
                  {states.map((s) => (
                    <SelectItem key={s.id} value={s.sigla}>{s.nome} ({s.sigla})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.uf && <p className="text-sm text-destructive">{errors.uf}</p>}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Building2 className="w-4 h-4" /> Cidade *</Label>
              <Popover open={openCity} onOpenChange={setOpenCity}>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" role="combobox"
                    className={cn("w-full justify-between font-normal", errors.city ? "border-destructive" : "")}
                    disabled={!uf || loadingCities}>
                    {loadingCities ? (
                      <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Carregando...</span>
                    ) : city ? city : (
                      <span className="text-muted-foreground">{!uf ? "Selecione o estado" : "Buscar..."}</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-0 pointer-events-auto" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar cidade..." />
                    <CommandList>
                      <CommandEmpty>Nenhuma cidade encontrada.</CommandEmpty>
                      <CommandGroup>
                        {cities.map((c) => (
                          <CommandItem key={c.id} value={c.nome} onSelect={() => { setCity(c.nome); setOpenCity(false); }}>
                            <Check className={cn("mr-2 h-4 w-4", city === c.nome ? "opacity-100" : "opacity-0")} />
                            {c.nome}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {errors.city && <p className="text-sm text-destructive">{errors.city}</p>}
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2"><Mail className="w-4 h-4" /> E-mail *</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className={errors.email ? "border-destructive" : ""} placeholder="seu@email.com" />
            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
          </div>

          {/* CRECI */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="creci" className="flex items-center gap-2"><IdCard className="w-4 h-4" /> CRECI <span className="text-xs text-muted-foreground">(opcional)</span></Label>
              <Input id="creci" value={creci} onChange={(e) => setCreci(e.target.value)}
                placeholder="Número" className={errors.creci ? "border-destructive" : ""} />
              {errors.creci && <p className="text-sm text-destructive">{errors.creci}</p>}
            </div>
            <div className="space-y-2">
              <Label>UF</Label>
              <Select value={creciUf} onValueChange={setCreciUf}>
                <SelectTrigger className={errors.creciUf ? "border-destructive" : ""}>
                  <SelectValue placeholder="UF" />
                </SelectTrigger>
                <SelectContent>
                  {UF_OPTIONS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.creciUf && <p className="text-sm text-destructive">{errors.creciUf}</p>}
            </div>
          </div>

          {/* Senha */}
          <div className="space-y-2">
            <Label htmlFor="password" className="flex items-center gap-2"><Lock className="w-4 h-4" /> Senha *</Label>
            <div className="relative">
              <Input id="password" type={showPwd ? "text" : "password"} value={password}
                onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres"
                className={cn("pr-10", errors.password ? "border-destructive" : "")} />
              <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPwd(!showPwd)}>
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
          </div>

          {/* Confirmar senha */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="flex items-center gap-2"><Lock className="w-4 h-4" /> Confirmar senha *</Label>
            <div className="relative">
              <Input id="confirmPassword" type={showConfirm ? "text" : "password"} value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Digite novamente"
                className={cn("pr-10", errors.confirmPassword ? "border-destructive" : "")} />
              <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowConfirm(!showConfirm)}>
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Criando conta...</> : "Criar conta"}
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">ou registre-se via</span>
          </div>
        </div>

        <GoogleAuthButton />

        <p className="text-center text-sm text-muted-foreground mt-6">
          Já tem conta?{" "}
          <button type="button" onClick={onSwitchToLogin} className="text-primary hover:underline">
            Faça login
          </button>
        </p>
      </CardContent>
    </Card>
  );
}
