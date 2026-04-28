export type PersonType = 'PF' | 'PJ';
export type CompanyType = 'IMOBILIARIA' | 'CONSTRUTORA';
export type Profession = 'CORRETOR' | 'ARQUITETO' | 'ENGENHEIRO';

export interface SignupFormData {
  // Tipo de pessoa
  personType: PersonType | null;
  
  // Dados gerais (comum)
  email: string;
  phone: string;
  address: string;
  addressUf: string;
  addressCity: string;
  addressNeighborhood: string;
  
  // Dados PF
  name: string;
  cpf: string;
  profession: Profession | null;
  creci: string;
  creciUf: string;
  cau: string;
  cauUf: string;
  crea: string;
  creaUf: string;
  
  // Dados PJ
  companyName: string;
  cnpj: string;
  companyType: CompanyType | null;
  creciPj: string;
  creciPjUf: string;
  creaPj: string;
  creaPjUf: string;
  rtName: string;
  rtCpf: string;
  rtCrea: string;
  rtCreaUf: string;
  rtCau: string;
  rtCauUf: string;
  
  // Credenciais
  password: string;
  confirmPassword: string;
  
  // Termos (3 contratos separados)
  acceptedContract: boolean;      // Contrato de Parceria Comercial
  acceptedDPA: boolean;           // Acordo de Tratamento de Dados (DPA)
  acceptedTermsOfUse: boolean;    // Termo de Uso + Política de Privacidade

  // Indicação
  referralCode: string;
}

export const initialFormData: SignupFormData = {
  personType: null,
  email: '',
  phone: '',
  address: '',
  addressUf: '',
  addressCity: '',
  addressNeighborhood: '',
  name: '',
  cpf: '',
  profession: null,
  creci: '',
  creciUf: '',
  cau: '',
  cauUf: '',
  crea: '',
  creaUf: '',
  companyName: '',
  cnpj: '',
  companyType: null,
  creciPj: '',
  creciPjUf: '',
  creaPj: '',
  creaPjUf: '',
  rtName: '',
  rtCpf: '',
  rtCrea: '',
  rtCreaUf: '',
  rtCau: '',
  rtCauUf: '',
  password: '',
  confirmPassword: '',
  acceptedContract: false,
  acceptedDPA: false,
  acceptedTermsOfUse: false,
  referralCode: '',
};

export const UF_OPTIONS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
] as const;
