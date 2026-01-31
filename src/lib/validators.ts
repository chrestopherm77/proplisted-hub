// Validação de CPF
export function validateCPF(cpf: string): boolean {
  const cleanCPF = cpf.replace(/\D/g, '');
  
  if (cleanCPF.length !== 11) return false;
  if (/^(\d)\1+$/.test(cleanCPF)) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(10))) return false;
  
  return true;
}

// Validação de CNPJ
export function validateCNPJ(cnpj: string): boolean {
  const cleanCNPJ = cnpj.replace(/\D/g, '');
  
  if (cleanCNPJ.length !== 14) return false;
  if (/^(\d)\1+$/.test(cleanCNPJ)) return false;
  
  let size = cleanCNPJ.length - 2;
  let numbers = cleanCNPJ.substring(0, size);
  const digits = cleanCNPJ.substring(size);
  let sum = 0;
  let pos = size - 7;
  
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;
  
  size = size + 1;
  numbers = cleanCNPJ.substring(0, size);
  sum = 0;
  pos = size - 7;
  
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;
  
  return true;
}

// Formatação de CPF
export function formatCPF(value: string): string {
  const numbers = value.replace(/\D/g, '').slice(0, 11);
  
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9)}`;
}

// Formatação de CNPJ
export function formatCNPJ(value: string): string {
  const numbers = value.replace(/\D/g, '').slice(0, 14);
  
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 5) return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
  if (numbers.length <= 8) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
  if (numbers.length <= 12) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`;
  return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12)}`;
}

// Formatação de telefone
export function formatPhone(value: string): string {
  const numbers = value.replace(/\D/g, '').slice(0, 11);
  
  if (numbers.length <= 2) return numbers.length ? `(${numbers}` : '';
  if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  if (numbers.length <= 10) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
}

// Validação de email
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validação de telefone
export function validatePhone(phone: string): boolean {
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone.length >= 10 && cleanPhone.length <= 11;
}

// Validação de senha
export function validatePassword(password: string): { valid: boolean; message: string } {
  if (password.length < 6) {
    return { valid: false, message: 'A senha deve ter pelo menos 6 caracteres' };
  }
  return { valid: true, message: '' };
}

// Constantes de limites monetários
export const CURRENCY_MIN = 5000;      // R$ 50,00 em centavos
export const CURRENCY_MAX = 1000000000; // R$ 10.000.000,00 em centavos

// Formatação de moeda brasileira (R$ X.XXX,XX)
export function formatCurrency(value: string): string {
  const numbers = value.replace(/\D/g, '');
  
  if (!numbers) return '';
  
  const amount = parseInt(numbers, 10);
  
  const formatted = (amount / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  return `R$ ${formatted}`;
}

// Formatação de moeda com limite (R$ 50 a R$ 10.000.000)
export function formatCurrencyWithLimits(value: string): string {
  const numbers = value.replace(/\D/g, '');
  
  if (!numbers) return '';
  
  let amount = parseInt(numbers, 10);
  
  // Aplicar limite máximo (R$ 10.000.000,00 = 1.000.000.000 centavos)
  if (amount > CURRENCY_MAX) {
    amount = CURRENCY_MAX;
  }
  
  const formatted = (amount / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  return `R$ ${formatted}`;
}

// Validar se o valor está dentro dos limites
export function validateCurrencyLimits(value: string): { 
  valid: boolean; 
  message: string;
  amountInCents: number;
} {
  const numbers = value.replace(/\D/g, '');
  
  if (!numbers) {
    return { valid: false, message: 'Valor é obrigatório', amountInCents: 0 };
  }
  
  const amount = parseInt(numbers, 10);
  
  if (amount < CURRENCY_MIN) {
    return { 
      valid: false, 
      message: 'Valor mínimo é R$ 50,00',
      amountInCents: amount
    };
  }
  
  if (amount > CURRENCY_MAX) {
    return { 
      valid: false, 
      message: 'Valor máximo é R$ 10.000.000,00',
      amountInCents: amount
    };
  }
  
  return { valid: true, message: '', amountInCents: amount };
}

// Formatar apenas números para campos de área (m²)
export function formatArea(value: string): string {
  // Remove tudo exceto dígitos
  const numbers = value.replace(/\D/g, '');
  
  if (!numbers) return '';
  
  // Limitar a um valor razoável (máximo 99.999.999 m²)
  const num = Math.min(parseInt(numbers, 10), 99999999);
  
  return num.toString();
}
