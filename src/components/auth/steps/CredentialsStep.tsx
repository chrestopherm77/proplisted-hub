import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { SignupFormData } from "@/types/signup";
import { Lock, Eye, EyeOff, FileText, Gift } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CONTRACT_TERMS, DPA_TERMS, TERMS_OF_USE } from "../constants/registrationTerms";

interface CredentialsStepProps {
  formData: SignupFormData;
  onChange: (field: keyof SignupFormData, value: string | boolean) => void;
  errors: Record<string, string>;
  referralLocked?: boolean;
}

export function CredentialsStep({ formData, onChange, errors, referralLocked }: CredentialsStepProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Modal states
  const [isContractOpen, setIsContractOpen] = useState(false);
  const [isDPAOpen, setIsDPAOpen] = useState(false);
  const [isTermsOfUseOpen, setIsTermsOfUseOpen] = useState(false);

  // Read confirmation states
  const [hasReadContract, setHasReadContract] = useState(false);
  const [hasReadDPA, setHasReadDPA] = useState(false);
  const [hasReadTermsOfUse, setHasReadTermsOfUse] = useState(false);

  const handleContractCheckboxClick = () => {
    if (!formData.acceptedContract) {
      setIsContractOpen(true);
    }
  };

  const handleDPACheckboxClick = () => {
    if (!formData.acceptedDPA) {
      setIsDPAOpen(true);
    }
  };

  const handleTermsOfUseCheckboxClick = () => {
    if (!formData.acceptedTermsOfUse) {
      setIsTermsOfUseOpen(true);
    }
  };

  const handleAcceptContract = () => {
    onChange('acceptedContract', true);
    setIsContractOpen(false);
    setHasReadContract(false);
  };

  const handleAcceptDPA = () => {
    onChange('acceptedDPA', true);
    setIsDPAOpen(false);
    setHasReadDPA(false);
  };

  const handleAcceptTermsOfUse = () => {
    onChange('acceptedTermsOfUse', true);
    setIsTermsOfUseOpen(false);
    setHasReadTermsOfUse(false);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">Credenciais de Acesso</h2>
        <p className="text-muted-foreground mt-2">
          Crie sua senha para acessar o sistema
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2">
            E-mail de acesso
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            disabled
            className="bg-muted"
          />
          <p className="text-xs text-muted-foreground">
            Este será seu e-mail de login
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Senha *
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Mínimo 6 caracteres"
              value={formData.password}
              onChange={(e) => onChange('password', e.target.value)}
              className={errors.password ? "border-destructive pr-10" : "pr-10"}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
          {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Confirmar Senha *
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirme sua senha"
              value={formData.confirmPassword}
              onChange={(e) => onChange('confirmPassword', e.target.value)}
              className={errors.confirmPassword ? "border-destructive pr-10" : "pr-10"}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
          {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
        </div>

        {/* Referral Code (optional) */}
        <div className="space-y-2 pt-4 border-t">
          <Label htmlFor="referralCode" className="flex items-center gap-2">
            <Gift className="w-4 h-4 text-primary" />
            Foi indicado? Coloque o código aqui
          </Label>
          <Input
            id="referralCode"
            type="text"
            placeholder="Ex: LB7K9X2A"
            maxLength={12}
            value={formData.referralCode}
            onChange={(e) => onChange('referralCode', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').trim())}
            className="font-mono tracking-widest uppercase"
          />
          <p className="text-xs text-muted-foreground">
            Opcional — se um amigo te indicou, ele ganha 280 créditos quando você se cadastrar.
          </p>
        </div>

        {/* Three Terms Checkboxes */}
        <div className="space-y-4 pt-4 border-t">
          <p className="text-sm font-medium text-foreground">
            Para continuar, você deve ler e aceitar os termos abaixo:
          </p>

          {/* 1. Contrato de Parceria Comercial */}
          <div 
            className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
              formData.acceptedContract 
                ? 'bg-primary/5 border-primary/30' 
                : errors.acceptedContract 
                  ? 'border-destructive bg-destructive/5' 
                  : 'hover:bg-muted/50'
            }`}
            onClick={handleContractCheckboxClick}
          >
            <Checkbox
              id="acceptedContract"
              checked={formData.acceptedContract}
              className="mt-0.5"
              onCheckedChange={() => {
                if (!formData.acceptedContract) {
                  setIsContractOpen(true);
                }
              }}
            />
            <div className="grid gap-1 leading-none flex-1">
              <label
                htmlFor="acceptedContract"
                className="text-sm font-medium leading-none flex items-center gap-2"
              >
                <FileText className="w-4 h-4 text-primary" />
                Contrato de Parceria Comercial *
              </label>
              <p className="text-xs text-muted-foreground">
                Contrato para aquisição e uso de leads na plataforma
              </p>
            </div>
          </div>
          {errors.acceptedContract && <p className="text-sm text-destructive -mt-2">{errors.acceptedContract}</p>}

          {/* 2. DPA - Acordo de Tratamento de Dados */}
          <div 
            className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
              formData.acceptedDPA 
                ? 'bg-primary/5 border-primary/30' 
                : errors.acceptedDPA 
                  ? 'border-destructive bg-destructive/5' 
                  : 'hover:bg-muted/50'
            }`}
            onClick={handleDPACheckboxClick}
          >
            <Checkbox
              id="acceptedDPA"
              checked={formData.acceptedDPA}
              className="mt-0.5"
              onCheckedChange={() => {
                if (!formData.acceptedDPA) {
                  setIsDPAOpen(true);
                }
              }}
            />
            <div className="grid gap-1 leading-none flex-1">
              <label
                htmlFor="acceptedDPA"
                className="text-sm font-medium leading-none flex items-center gap-2"
              >
                <FileText className="w-4 h-4 text-primary" />
                Acordo de Tratamento de Dados (DPA) *
              </label>
              <p className="text-xs text-muted-foreground">
                Data Processing Agreement conforme LGPD
              </p>
            </div>
          </div>
          {errors.acceptedDPA && <p className="text-sm text-destructive -mt-2">{errors.acceptedDPA}</p>}

          {/* 3. Termo de Uso e Política de Privacidade */}
          <div 
            className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
              formData.acceptedTermsOfUse 
                ? 'bg-primary/5 border-primary/30' 
                : errors.acceptedTermsOfUse 
                  ? 'border-destructive bg-destructive/5' 
                  : 'hover:bg-muted/50'
            }`}
            onClick={handleTermsOfUseCheckboxClick}
          >
            <Checkbox
              id="acceptedTermsOfUse"
              checked={formData.acceptedTermsOfUse}
              className="mt-0.5"
              onCheckedChange={() => {
                if (!formData.acceptedTermsOfUse) {
                  setIsTermsOfUseOpen(true);
                }
              }}
            />
            <div className="grid gap-1 leading-none flex-1">
              <label
                htmlFor="acceptedTermsOfUse"
                className="text-sm font-medium leading-none flex items-center gap-2"
              >
                <FileText className="w-4 h-4 text-primary" />
                Termo de Uso e Política de Privacidade *
              </label>
              <p className="text-xs text-muted-foreground">
                Regras de uso da plataforma e política de privacidade
              </p>
            </div>
          </div>
          {errors.acceptedTermsOfUse && <p className="text-sm text-destructive -mt-2">{errors.acceptedTermsOfUse}</p>}
        </div>
      </div>

      {/* Contract Modal */}
      <Dialog open={isContractOpen} onOpenChange={setIsContractOpen}>
        <DialogContent className="max-w-2xl h-[85vh] flex flex-col overflow-hidden p-0">
          <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b">
            <DialogTitle>Contrato de Parceria Comercial para Aquisição e Uso de Leads</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 min-h-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="px-6 py-4">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                  {CONTRACT_TERMS}
                </pre>
              </div>
            </ScrollArea>
          </div>
          
          <div className="flex-shrink-0 px-6 py-4 border-t bg-muted/30 space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="readContract"
                checked={hasReadContract}
                onCheckedChange={(checked) => setHasReadContract(checked === true)}
              />
              <label
                htmlFor="readContract"
                className="text-sm font-medium leading-none"
              >
                Li e compreendi os termos acima
              </label>
            </div>
            <Button
              onClick={handleAcceptContract}
              disabled={!hasReadContract}
              className="w-full"
            >
              Aceito os Termos
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* DPA Modal */}
      <Dialog open={isDPAOpen} onOpenChange={setIsDPAOpen}>
        <DialogContent className="max-w-2xl h-[85vh] flex flex-col overflow-hidden p-0">
          <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b">
            <DialogTitle>Acordo de Tratamento de Dados Pessoais (DPA)</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 min-h-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="px-6 py-4">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                  {DPA_TERMS}
                </pre>
              </div>
            </ScrollArea>
          </div>
          
          <div className="flex-shrink-0 px-6 py-4 border-t bg-muted/30 space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="readDPA"
                checked={hasReadDPA}
                onCheckedChange={(checked) => setHasReadDPA(checked === true)}
              />
              <label
                htmlFor="readDPA"
                className="text-sm font-medium leading-none"
              >
                Li e compreendi os termos acima
              </label>
            </div>
            <Button
              onClick={handleAcceptDPA}
              disabled={!hasReadDPA}
              className="w-full"
            >
              Aceito os Termos
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Terms of Use Modal */}
      <Dialog open={isTermsOfUseOpen} onOpenChange={setIsTermsOfUseOpen}>
        <DialogContent className="max-w-2xl h-[85vh] flex flex-col overflow-hidden p-0">
          <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b">
            <DialogTitle>Termo de Uso e Política de Privacidade</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 min-h-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="px-6 py-4">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                  {TERMS_OF_USE}
                </pre>
              </div>
            </ScrollArea>
          </div>
          
          <div className="flex-shrink-0 px-6 py-4 border-t bg-muted/30 space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="readTermsOfUse"
                checked={hasReadTermsOfUse}
                onCheckedChange={(checked) => setHasReadTermsOfUse(checked === true)}
              />
              <label
                htmlFor="readTermsOfUse"
                className="text-sm font-medium leading-none"
              >
                Li e compreendi os termos acima
              </label>
            </div>
            <Button
              onClick={handleAcceptTermsOfUse}
              disabled={!hasReadTermsOfUse}
              className="w-full"
            >
              Aceito os Termos
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
