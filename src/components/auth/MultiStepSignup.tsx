import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StepIndicator } from "./StepIndicator";
import { PersonTypeStep } from "./steps/PersonTypeStep";
import { PFGeneralDataStep } from "./steps/PFGeneralDataStep";
import { PJGeneralDataStep } from "./steps/PJGeneralDataStep";
import { PFProfessionStep } from "./steps/PFProfessionStep";
import { PJCompanyTypeStep } from "./steps/PJCompanyTypeStep";
import { PFProfessionalDataStep } from "./steps/PFProfessionalDataStep";
import { PJProfessionalDataStep } from "./steps/PJProfessionalDataStep";
import { CredentialsStep } from "./steps/CredentialsStep";
import { EmailVerificationModal } from "./EmailVerificationModal";
import { SignupFormData, initialFormData, PersonType, CompanyType, Profession } from "@/types/signup";
import { validateCPF, validateCNPJ, validateEmail, validatePhone, validatePassword } from "@/lib/validators";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

interface MultiStepSignupProps {
  onSwitchToLogin: () => void;
}

export function MultiStepSignup({ onSwitchToLogin }: MultiStepSignupProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<SignupFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);

  const getTotalSteps = () => {
    if (!formData.personType) return 4;
    
    if (formData.personType === 'PF') {
      // PF: 1.Tipo -> 2.Dados Gerais -> 3.Profissão -> 4.Dados Prof (se aplicável) -> 5.Credenciais
      return formData.profession === 'NONE' ? 4 : 5;
    } else {
      // PJ: 1.Tipo -> 2.Dados Gerais -> 3.Tipo Empresa -> 4.Dados Prof -> 5.Credenciais
      return 5;
    }
  };

  const getStepLabels = () => {
    if (formData.personType === 'PF') {
      if (formData.profession === 'NONE') {
        return ['Tipo', 'Dados Pessoais', 'Profissão', 'Credenciais'];
      }
      return ['Tipo', 'Dados Pessoais', 'Profissão', 'Registro', 'Credenciais'];
    } else if (formData.personType === 'PJ') {
      return ['Tipo', 'Dados Empresa', 'Tipo Empresa', 'Registros', 'Credenciais'];
    }
    return ['Tipo', 'Dados', 'Detalhes', 'Credenciais'];
  };

  const handleFieldChange = (field: keyof SignupFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    // If email changes, reset verification status
    if (field === 'email') {
      setEmailVerified(false);
    }
  };

  const handlePersonTypeChange = (value: PersonType) => {
    setFormData(prev => ({ ...prev, personType: value }));
  };

  const handleCompanyTypeChange = (value: CompanyType) => {
    setFormData(prev => ({ ...prev, companyType: value }));
  };

  const handleProfessionChange = (value: Profession) => {
    setFormData(prev => ({ ...prev, profession: value }));
  };

  const isStepComplete = (): boolean => {
    if (currentStep === 1) {
      return !!formData.personType;
    }

    if (currentStep === 2) {
      if (formData.personType === 'PF') {
        return !!(
          formData.name.trim() &&
          formData.cpf.trim() &&
          formData.addressUf &&
          formData.addressCity &&
          formData.addressNeighborhood.trim() &&
          formData.address.trim() &&
          formData.email.trim() &&
          formData.phone.trim()
        );
      } else {
        return !!(
          formData.companyName.trim() &&
          formData.cnpj.trim() &&
          formData.addressUf &&
          formData.addressCity &&
          formData.addressNeighborhood.trim() &&
          formData.address.trim() &&
          formData.email.trim() &&
          formData.phone.trim()
        );
      }
    }

    if (currentStep === 3) {
      if (formData.personType === 'PF') return !!formData.profession;
      if (formData.personType === 'PJ') return !!formData.companyType;
      return false;
    }

    if (currentStep === 4) {
      if (formData.personType === 'PF' && formData.profession === 'NONE') {
        return !!(formData.password && formData.confirmPassword && formData.acceptedContract && formData.acceptedDPA && formData.acceptedTermsOfUse);
      }
      if (formData.personType === 'PF') {
        if (formData.profession === 'CORRETOR') return !!(formData.creci.trim() && formData.creciUf);
        if (formData.profession === 'ARQUITETO') return !!(formData.cau.trim() && formData.cauUf);
        if (formData.profession === 'ENGENHEIRO') return !!(formData.crea.trim() && formData.creaUf);
      }
      if (formData.personType === 'PJ') {
        if (formData.companyType === 'IMOBILIARIA') {
          return !!(formData.creciPj.trim() && formData.creciPjUf && formData.rtName.trim() && formData.rtCpf.trim());
        }
        if (formData.companyType === 'CONSTRUTORA') {
          return !!(formData.creaPj.trim() && formData.creaPjUf && formData.rtName.trim() && formData.rtCrea.trim() && formData.rtCreaUf && formData.rtCpf.trim());
        }
      }
      return false;
    }

    if (currentStep === 5) {
      return !!(formData.password && formData.confirmPassword && formData.acceptedContract && formData.acceptedDPA && formData.acceptedTermsOfUse);
    }

    return false;
  };

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.personType) {
        toast.error("Selecione o tipo de pessoa");
        return false;
      }
    }

    if (currentStep === 2) {
      if (formData.personType === 'PF') {
        if (!formData.name.trim()) newErrors.name = "Nome é obrigatório";
        if (!formData.cpf.trim()) {
          newErrors.cpf = "CPF é obrigatório";
        } else if (!validateCPF(formData.cpf)) {
          newErrors.cpf = "CPF inválido";
        }
        if (!formData.addressUf) newErrors.addressUf = "Estado é obrigatório";
        if (!formData.addressCity) newErrors.addressCity = "Cidade é obrigatória";
        if (!formData.addressNeighborhood.trim()) newErrors.addressNeighborhood = "Bairro é obrigatório";
        if (!formData.address.trim()) newErrors.address = "Endereço é obrigatório";
        if (!formData.email.trim()) {
          newErrors.email = "E-mail é obrigatório";
        } else if (!validateEmail(formData.email)) {
          newErrors.email = "E-mail inválido";
        }
        if (!formData.phone.trim()) {
          newErrors.phone = "Telefone é obrigatório";
        } else if (!validatePhone(formData.phone)) {
          newErrors.phone = "Telefone inválido";
        }
      } else {
        if (!formData.companyName.trim()) newErrors.companyName = "Razão Social é obrigatória";
        if (!formData.cnpj.trim()) {
          newErrors.cnpj = "CNPJ é obrigatório";
        } else if (!validateCNPJ(formData.cnpj)) {
          newErrors.cnpj = "CNPJ inválido";
        }
        if (!formData.addressUf) newErrors.addressUf = "Estado é obrigatório";
        if (!formData.addressCity) newErrors.addressCity = "Cidade é obrigatória";
        if (!formData.addressNeighborhood.trim()) newErrors.addressNeighborhood = "Bairro é obrigatório";
        if (!formData.address.trim()) newErrors.address = "Endereço é obrigatório";
        if (!formData.email.trim()) {
          newErrors.email = "E-mail é obrigatório";
        } else if (!validateEmail(formData.email)) {
          newErrors.email = "E-mail inválido";
        }
        if (!formData.phone.trim()) {
          newErrors.phone = "Telefone é obrigatório";
        } else if (!validatePhone(formData.phone)) {
          newErrors.phone = "Telefone inválido";
        }
      }
    }

    if (currentStep === 3) {
      if (formData.personType === 'PF' && !formData.profession) {
        toast.error("Selecione uma opção");
        return false;
      }
      if (formData.personType === 'PJ' && !formData.companyType) {
        toast.error("Selecione o tipo de empresa");
        return false;
      }
    }

    if (currentStep === 4 && formData.personType === 'PF' && formData.profession !== 'NONE') {
      if (formData.profession === 'CORRETOR') {
        if (!formData.creci.trim()) newErrors.creci = "CRECI é obrigatório";
        if (!formData.creciUf) newErrors.creciUf = "UF é obrigatória";
      } else if (formData.profession === 'ARQUITETO') {
        if (!formData.cau.trim()) newErrors.cau = "CAU é obrigatório";
        if (!formData.cauUf) newErrors.cauUf = "UF é obrigatória";
      } else if (formData.profession === 'ENGENHEIRO') {
        if (!formData.crea.trim()) newErrors.crea = "CREA é obrigatório";
        if (!formData.creaUf) newErrors.creaUf = "UF é obrigatória";
      }
    }

    if (currentStep === 4 && formData.personType === 'PJ') {
      if (formData.companyType === 'IMOBILIARIA') {
        if (!formData.creciPj.trim()) newErrors.creciPj = "CRECI é obrigatório";
        if (!formData.creciPjUf) newErrors.creciPjUf = "UF é obrigatória";
        if (!formData.rtName.trim()) newErrors.rtName = "Nome do RT é obrigatório";
        if (!formData.rtCpf.trim()) {
          newErrors.rtCpf = "CPF do RT é obrigatório";
        } else if (!validateCPF(formData.rtCpf)) {
          newErrors.rtCpf = "CPF inválido";
        }
      } else if (formData.companyType === 'CONSTRUTORA') {
        if (!formData.creaPj.trim()) newErrors.creaPj = "CREA é obrigatório";
        if (!formData.creaPjUf) newErrors.creaPjUf = "UF é obrigatória";
        if (!formData.rtName.trim()) newErrors.rtName = "Nome do RT é obrigatório";
        if (!formData.rtCrea.trim()) newErrors.rtCrea = "CREA/CAU do RT é obrigatório";
        if (!formData.rtCreaUf) newErrors.rtCreaUf = "UF é obrigatória";
        if (!formData.rtCpf.trim()) {
          newErrors.rtCpf = "CPF do RT é obrigatório";
        } else if (!validateCPF(formData.rtCpf)) {
          newErrors.rtCpf = "CPF inválido";
        }
      }
    }

    const isCredentialsStep = 
      (formData.personType === 'PF' && formData.profession === 'NONE' && currentStep === 4) ||
      (formData.personType === 'PF' && formData.profession !== 'NONE' && currentStep === 5) ||
      (formData.personType === 'PJ' && currentStep === 5);

    if (isCredentialsStep) {
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.valid) {
        newErrors.password = passwordValidation.message;
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "As senhas não conferem";
      }
      if (!formData.acceptedContract) {
        newErrors.acceptedContract = "Você deve aceitar o Contrato de Parceria";
      }
      if (!formData.acceptedDPA) {
        newErrors.acceptedDPA = "Você deve aceitar o Acordo de Tratamento de Dados";
      }
      if (!formData.acceptedTermsOfUse) {
        newErrors.acceptedTermsOfUse = "Você deve aceitar os Termos de Uso";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const sendEmailVerificationCode = async () => {
    setIsSendingCode(true);
    try {
      const { error } = await supabase.functions.invoke("send-email-code", {
        body: { email: formData.email },
      });

      if (error) throw error;

      toast.success("Código de verificação enviado para seu e-mail");
      setShowEmailVerification(true);
    } catch (error: any) {
      console.error("Error sending verification code:", error);
      toast.error("Erro ao enviar código de verificação");
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleNext = async () => {
    if (!validateStep()) return;

    const totalSteps = getTotalSteps();
    
    // If on step 2, check phone availability before proceeding
    if (currentStep === 2) {
      try {
        const { data: isAvailable, error } = await supabase.rpc('check_phone_availability', {
          p_phone: formData.phone,
        });

        if (error) {
          console.error("Error checking phone:", error);
          toast.error("Erro ao verificar telefone. Tente novamente.");
          return;
        }

        if (!isAvailable) {
          setErrors(prev => ({
            ...prev,
            phone: "Este telefone já possui o limite máximo de contas cadastradas",
          }));
          toast.error("Este telefone já possui o limite máximo de contas cadastradas");
          return;
        }
      } catch (err) {
        console.error("Error checking phone availability:", err);
        toast.error("Erro ao verificar telefone. Tente novamente.");
        return;
      }

      // If email not verified, send code
      if (!emailVerified) {
        await sendEmailVerificationCode();
        return;
      }
    }
    
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    } else {
      await handleSubmit();
    }
  };

  const handleEmailVerified = () => {
    setEmailVerified(true);
    setShowEmailVerification(false);
    // Advance to next step after email is verified
    setCurrentStep(prev => prev + 1);
  };

  const handleChangeEmail = () => {
    setShowEmailVerification(false);
    setEmailVerified(false);
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const metadata: Record<string, string | boolean> = {
        person_type: formData.personType || '',
        phone: formData.phone,
        address: formData.address,
        address_uf: formData.addressUf,
        address_city: formData.addressCity,
        address_neighborhood: formData.addressNeighborhood,
        accepted_contract: formData.acceptedContract,
        accepted_dpa: formData.acceptedDPA,
        accepted_terms_of_use: formData.acceptedTermsOfUse,
      };

      if (formData.personType === 'PF') {
        metadata.name = formData.name;
        metadata.cpf = formData.cpf;
        metadata.profession = formData.profession || '';
        
        if (formData.profession === 'CORRETOR') {
          metadata.creci = formData.creci;
          metadata.creci_uf = formData.creciUf;
        } else if (formData.profession === 'ARQUITETO') {
          metadata.cau = formData.cau;
          metadata.cau_uf = formData.cauUf;
        } else if (formData.profession === 'ENGENHEIRO') {
          metadata.crea = formData.crea;
          metadata.crea_uf = formData.creaUf;
        }
      } else if (formData.personType === 'PJ') {
        metadata.company_name = formData.companyName;
        metadata.cnpj = formData.cnpj;
        metadata.company_type = formData.companyType || '';
        
        if (formData.companyType === 'IMOBILIARIA') {
          metadata.creci_pj = formData.creciPj;
          metadata.creci_pj_uf = formData.creciPjUf;
          metadata.rt_name = formData.rtName;
          metadata.rt_cpf = formData.rtCpf;
        } else if (formData.companyType === 'CONSTRUTORA') {
          metadata.crea_pj = formData.creaPj;
          metadata.crea_pj_uf = formData.creaPjUf;
          metadata.rt_name = formData.rtName;
          metadata.rt_crea = formData.rtCrea;
          metadata.rt_crea_uf = formData.rtCreaUf;
          metadata.rt_cpf = formData.rtCpf;
        }
      }

      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: metadata,
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          toast.error("Este e-mail já está cadastrado. Tente fazer login.");
        } else {
          toast.error(error.message);
        }
        return;
      }

      toast.success("Cadastro realizado com sucesso! Você já pode acessar o sistema.");
    } catch (error: any) {
      toast.error("Erro ao criar conta. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderCurrentStep = () => {
    // Step 1: Person Type Selection
    if (currentStep === 1) {
      return (
        <PersonTypeStep
          value={formData.personType}
          onChange={handlePersonTypeChange}
        />
      );
    }

    // Step 2: General Data
    if (currentStep === 2) {
      if (formData.personType === 'PF') {
        return (
          <PFGeneralDataStep
            formData={formData}
            onChange={handleFieldChange}
            errors={errors}
            emailVerified={emailVerified}
          />
        );
      } else {
        return (
          <PJGeneralDataStep
            formData={formData}
            onChange={handleFieldChange}
            errors={errors}
            emailVerified={emailVerified}
          />
        );
      }
    }

    // Step 3: Profession/Company Type
    if (currentStep === 3) {
      if (formData.personType === 'PF') {
        return (
          <PFProfessionStep
            value={formData.profession}
            onChange={handleProfessionChange}
          />
        );
      } else {
        return (
          <PJCompanyTypeStep
            value={formData.companyType}
            onChange={handleCompanyTypeChange}
          />
        );
      }
    }

    // Step 4
    if (currentStep === 4) {
      // PF with profession NONE -> go to credentials
      if (formData.personType === 'PF' && formData.profession === 'NONE') {
        return (
          <CredentialsStep
            formData={formData}
            onChange={handleFieldChange}
            errors={errors}
          />
        );
      }
      
      // PF with profession -> professional data
      if (formData.personType === 'PF') {
        return (
          <PFProfessionalDataStep
            formData={formData}
            onChange={handleFieldChange}
            errors={errors}
          />
        );
      }
      
      // PJ -> professional data
      return (
        <PJProfessionalDataStep
          formData={formData}
          onChange={handleFieldChange}
          errors={errors}
        />
      );
    }

    // Step 5: Credentials (for PF with profession or PJ)
    if (currentStep === 5) {
      return (
        <CredentialsStep
          formData={formData}
          onChange={handleFieldChange}
          errors={errors}
        />
      );
    }

    return null;
  };

  const totalSteps = getTotalSteps();
  const isLastStep = currentStep === totalSteps;

  return (
    <div className="w-full max-w-lg mx-auto">
      <Card>
        <CardContent className="pt-6">
          <StepIndicator
            currentStep={currentStep}
            totalSteps={totalSteps}
            stepLabels={getStepLabels()}
          />
          
          <div className="min-h-[400px]">
            {renderCurrentStep()}
          </div>

          <div className="flex justify-between mt-6 pt-6 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1 || isLoading}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>

            <Button
              onClick={handleNext}
              disabled={isLoading || isSendingCode || !isStepComplete()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Criando conta...
                </>
              ) : isSendingCode ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando código...
                </>
              ) : isLastStep ? (
                "Finalizar Cadastro"
              ) : currentStep === 2 && !emailVerified ? (
                "Verificar E-mail"
              ) : (
                <>
                  Avançar
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>

          <div className="text-center mt-4">
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-sm text-muted-foreground hover:text-primary"
            >
              Já tem uma conta? <span className="font-medium">Fazer login</span>
            </button>
          </div>
        </CardContent>
      </Card>

      <EmailVerificationModal
        isOpen={showEmailVerification}
        onClose={() => setShowEmailVerification(false)}
        email={formData.email}
        onVerified={handleEmailVerified}
        onChangeEmail={handleChangeEmail}
      />
    </div>
  );
}
