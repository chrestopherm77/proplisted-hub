import { useState } from "react";
import { StepProps } from "../types";
import { StepContainer } from "../StepContainer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { formatPhone } from "@/lib/validators";
import { User, Phone, Mail, FileText, Check, CheckCircle, Loader2, Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const CONSENT_TERMS = `TERMO DE CONSENTIMENTO PARA TRATAMENTO E COMPARTILHAMENTO DE DADOS PESSOAIS

Ao preencher este formulário, o titular declara que leu, compreendeu e concorda expressamente com os termos abaixo, nos termos da Lei nº 13.709/2018 – Lei Geral de Proteção de Dados Pessoais (LGPD).

1. CONTROLADOR E NATUREZA DA OPERAÇÃO

A CONECTAE atua como plataforma de geração, qualificação e intermediação comercial de contatos (leads), exercendo o papel de Controladora dos Dados Pessoais no âmbito das atividades de coleta, armazenamento temporário, organização, qualificação e disponibilização limitada dos dados, conforme o consentimento do titular.

O tratamento posterior realizado pelos parceiros comerciais ocorre sob sua exclusiva responsabilidade, na condição de Controladores Independentes, não havendo qualquer ingerência, controle ou corresponsabilidade da CONECTAE sobre o uso dos dados após sua disponibilização.

2. DADOS PESSOAIS COLETADOS

Serão coletados e tratados, de forma voluntária pelo titular, os seguintes dados pessoais:

a) Nome
b) Telefone
c) E-mail

d) Informações declaradas pelo próprio titular relacionadas às suas preferências de interesse comercial, tais como tipo de produto ou serviço desejado, características gerais pretendidas, faixa de valor, localização de interesse e outras informações não sensíveis, fornecidas exclusivamente para fins de qualificação do contato.

As informações de preferência não incluem, nem deverão incluir, dados sensíveis, nos termos do art. 5º, II, da LGPD, sendo vedada a coleta de dados relacionados à origem racial ou étnica, convicção religiosa, opinião política, filiação sindical, dados de saúde, vida sexual ou informações biométricas.

e) Dados técnicos de registro da coleta, tais como data, hora, endereço IP, origem da solicitação, identificadores de campanha e metadados de navegação.

3. FINALIDADE ESPECÍFICA DO TRATAMENTO

Os dados pessoais fornecidos pelo titular serão tratados exclusivamente, de forma compatível com o consentimento concedido, para as seguintes finalidades determinadas:

a) Identificar o titular como potencial interessado em produtos ou serviços compatíveis com as preferências voluntariamente informadas;

b) Disponibilizar o contato do titular a até 5 (cinco) parceiros comerciais previamente cadastrados na plataforma, no contexto de intermediação comercial realizada pela CONECTAE;

c) Permitir que os parceiros comerciais que adquirirem o contato entrem em contato direto com o titular, no prazo máximo de 60 (sessenta) dias, para apresentação de produtos ou serviços compatíveis com o interesse manifestado.

4. LIMITES OBJETIVOS DO COMPARTILHAMENTO

O titular declara estar expressamente ciente e de acordo que:

a) Seus dados pessoais (nome, telefone e e-mail) poderão ser disponibilizados a até 5 (cinco) parceiros comerciais, exclusivamente para fins de contato relacionados ao interesse manifestado;

b) O compartilhamento dos dados e os contatos realizados pelos parceiros ocorrerão no prazo máximo de 60 (sessenta) dias, contados a partir do fornecimento dos dados pelo titular;

c) Após o decurso desse prazo, os dados não serão novamente disponibilizados a novos parceiros, devendo os parceiros que os receberam cessar o tratamento e proceder à eliminação ou anonimização dos dados, salvo obrigação legal em sentido diverso;

d) O tratamento posterior realizado pelos parceiros ocorre sob sua exclusiva responsabilidade, na condição de Controladores Independentes, nos termos da legislação aplicável.

5. INTERMEDIAÇÃO E CONTATO COMERCIAL

O titular autoriza expressamente que a CONECTAE realize a intermediação comercial e a disponibilização limitada de seu contato a parceiros comerciais previamente cadastrados, estando ciente de que:

a) O contato por parte dos parceiros ocorrerá somente após a disponibilização do lead no âmbito da plataforma, conforme o consentimento concedido;

b) O contato poderá ocorrer por telefone, aplicativos de mensagens instantâneas (como WhatsApp) ou meios equivalentes;

c) Cada parceiro poderá realizar contato exclusivamente para a finalidade informada neste Termo, sendo vedado o uso dos dados para finalidades diversas.

6. OBRIGAÇÕES DOS PARCEIROS COMERCIAIS

Os parceiros comerciais que adquirirem o contato do titular, na condição de Controladores Independentes, ficam contratualmente obrigados a:

a) Utilizar os dados pessoais exclusivamente para a finalidade autorizada pelo titular;

b) Não revender, compartilhar, ceder, enriquecer bases próprias ou reutilizar os dados para finalidades diversas;

c) Realizar o tratamento dos dados pelo prazo máximo de 60 (sessenta) dias, devendo, após esse período, cessar o tratamento e proceder à eliminação ou anonimização, salvo obrigação legal;

d) Adotar medidas técnicas e administrativas adequadas à proteção dos dados pessoais;

e) Interromper imediatamente novos contatos mediante solicitação do titular ou revogação do consentimento;

f) Fornecer à CONECTAE feedback mínimo sobre a utilização do lead, como condição para manutenção do acesso à plataforma;

g) Assumir responsabilidade integral por qualquer tratamento realizado após o recebimento dos dados.

7. BASE LEGAL

O tratamento, a organização, a qualificação e a disponibilização do contato do titular a parceiros comerciais têm como base legal o consentimento livre, informado, específico e inequívoco, nos termos do artigo 7º, inciso I, da LGPD.

8. DIREITOS DO TITULAR

O titular poderá exercer, a qualquer momento, os direitos previstos no artigo 18 da LGPD, inclusive confirmação de tratamento, acesso, correção, eliminação, revogação do consentimento e informações sobre compartilhamento, conforme detalhado na Política de Privacidade.

9. REVOGAÇÃO DO CONSENTIMENTO

A revogação do consentimento poderá ser solicitada a qualquer tempo. A partir do recebimento da solicitação, a CONECTAE compromete-se a:

a) Cessar novas disponibilizações dos dados;

b) Comunicar, de forma diligente, os parceiros comerciais para interrupção de novos contatos, observados os limites legais, técnicos e operacionais.

A revogação não afeta a licitude dos tratamentos realizados anteriormente.

10. CIÊNCIA E ACEITE

Ao marcar o campo de aceite e enviar seus dados, o titular declara que:

a) Fornece seus dados de forma livre, consciente, informada e inequívoca;

b) Está ciente da intermediação e do compartilhamento limitado de seus dados, nos termos deste instrumento;

c) Poderá ser contatado por até 5 (cinco) parceiros comerciais, no prazo máximo de 60 (sessenta) dias;

d) Leu e concorda integralmente com este Termo, a Política de Privacidade e os Termos de Uso.`;

type VerificationStep = 'input' | 'verified';

export function ContactStep({ data, updateData }: StepProps) {
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [hasReadTerms, setHasReadTerms] = useState(false);
  const [verificationStep, setVerificationStep] = useState<VerificationStep>(
    data.phoneVerified ? 'verified' : 'input'
  );
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    updateData({ phone: formatted, phoneVerified: false });
    if (verificationStep !== 'input') {
      setVerificationStep('input');
      setError(null);
    }
  };

  const handleCheckWhatsApp = async () => {
    if (!data.phone || data.phone.length < 14) {
      setError('Digite um número de telefone válido');
      return;
    }

    setIsChecking(true);
    setError(null);

    try {
      const { data: responseData, error: invokeError } = await supabase.functions.invoke('check-whatsapp', {
        body: { phone: data.phone }
      });

      if (invokeError) {
        throw new Error(invokeError.message);
      }

      if (responseData?.exists) {
        updateData({ phoneVerified: true });
        setVerificationStep('verified');
        toast({
          title: "WhatsApp verificado!",
          description: "Seu número foi verificado com sucesso.",
        });
      } else {
        setError('Este número não possui WhatsApp ativo. Verifique o número e tente novamente.');
      }
    } catch (err: any) {
      console.error('Error checking WhatsApp:', err);
      setError(err.message || 'Erro ao verificar WhatsApp. Tente novamente.');
    } finally {
      setIsChecking(false);
    }
  };

  const handleCheckboxClick = () => {
    if (!data.acceptedTerms) {
      setIsTermsOpen(true);
    } else {
      updateData({ acceptedTerms: false });
      setHasReadTerms(false);
    }
  };

  const handleAcceptTerms = () => {
    updateData({ acceptedTerms: true });
    setIsTermsOpen(false);
  };

  const canValidatePhone = data.name.trim().length > 0 && data.phone.length >= 14;

  return (
    <>
      <StepContainer
        title="Confirme que você é real"
        subtitle="Verificação de número real para receber ofertas de imóveis da sua preferência por um de nossos corretores"
      >
        <div className="space-y-6 max-w-md mx-auto">
          {/* Alerta de validação */}
          <div className="flex items-start gap-3 p-4 rounded-lg border bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900 text-amber-800 dark:text-amber-300">
            <Info className="h-5 w-5 mt-0.5 shrink-0" />
            <p className="text-sm leading-relaxed">
              <strong>É necessário validar seu número</strong> para que os corretores possam entrar em contato com você.
              Sem essa validação, seu lead não será liberado.
            </p>
          </div>

          {/* Name Input */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Nome completo *
            </Label>
            <Input
              id="name"
              value={data.name}
              onChange={(e) => updateData({ name: e.target.value })}
              placeholder="Digite seu nome completo"
              className="h-12"
              disabled={verificationStep === 'verified'}
            />
          </div>

          {/* Phone Input */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Telefone / WhatsApp *
            </Label>
            <Input
              id="phone"
              value={data.phone}
              onChange={handlePhoneChange}
              placeholder="(00) 00000-0000"
              className="h-12"
              maxLength={15}
              disabled={verificationStep === 'verified'}
            />
          </div>

          {/* Validate WhatsApp Button */}
          {verificationStep === 'input' && (
            <Button
              onClick={handleCheckWhatsApp}
              disabled={!canValidatePhone || isChecking}
              className="w-full h-12 gap-2"
              variant="outline"
            >
              {isChecking ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verificando WhatsApp...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Validar WhatsApp
                </>
              )}
            </Button>
          )}

          {/* Error Message */}
          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          {/* Verified Success */}
          {verificationStep === 'verified' && (
            <>
              <div className="flex items-center justify-center gap-2 p-3 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 rounded-lg border border-green-200 dark:border-green-900">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">WhatsApp verificado com sucesso!</span>
              </div>

              {/* Email Input (optional, only shown after verification) */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  E-mail (opcional)
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={data.email}
                  onChange={(e) => updateData({ email: e.target.value })}
                  placeholder="seu@email.com"
                  className="h-12"
                />
              </div>

              {/* Consent Checkbox (only shown after verification) */}
              <div className="pt-4 border-t">
                <div
                  className="flex items-start gap-3 cursor-pointer group"
                  onClick={handleCheckboxClick}
                >
                  <Checkbox
                    id="consent"
                    checked={data.acceptedTerms}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor="consent"
                      className="flex items-center gap-2 cursor-pointer text-sm font-medium leading-relaxed"
                    >
                      <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                      <span>
                        Concordo com o{" "}
                        <span className="text-primary underline underline-offset-2 group-hover:text-primary/80">
                          Termo de Consentimento para Tratamento e Compartilhamento de Dados
                        </span>{" "}
                        *
                      </span>
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1 ml-6">
                      Clique para ler e aceitar os termos
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </StepContainer>

      {/* Terms Modal */}
      <Dialog open={isTermsOpen} onOpenChange={setIsTermsOpen}>
        <DialogContent className="max-w-2xl h-[85vh] flex flex-col overflow-hidden p-0">
          <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-primary" />
              Termo de Consentimento
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="px-6 py-4">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground bg-transparent p-0 m-0 overflow-visible">
                    {CONSENT_TERMS}
                  </pre>
                </div>
              </div>
            </ScrollArea>
          </div>

          <div className="flex-shrink-0 px-6 py-4 border-t bg-muted/30">
            <div className="flex items-center gap-3 mb-4">
              <Checkbox
                id="read-terms"
                checked={hasReadTerms}
                onCheckedChange={(checked) => setHasReadTerms(checked === true)}
              />
              <Label htmlFor="read-terms" className="text-sm cursor-pointer">
                Li e compreendi os termos acima
              </Label>
            </div>
            <Button
              onClick={handleAcceptTerms}
              disabled={!hasReadTerms}
              className="w-full gap-2"
            >
              <Check className="h-4 w-4" />
              Aceito os Termos
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
