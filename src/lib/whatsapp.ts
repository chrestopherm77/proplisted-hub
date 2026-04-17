/**
 * Normaliza um telefone para o formato wa.me (apenas dígitos, com DDI 55).
 * Aceita números com ou sem máscara, com ou sem DDI, com ou sem o "9" extra.
 * Padrão final: 55 + DDD (2) + 8 dígitos = 12 dígitos (regra do projeto).
 */
export function normalizePhoneToWa(phone: string | null | undefined): string {
  if (!phone) return "";
  let digits = String(phone).replace(/\D/g, "");

  // Remove DDI 55 se já tiver
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
    digits = digits.slice(2);
  }

  // Se tiver 11 dígitos (DDD + 9 + 8), remove o 9
  if (digits.length === 11) {
    digits = digits.slice(0, 2) + digits.slice(3);
  }

  // Garante 10 dígitos (DDD + 8)
  if (digits.length !== 10) {
    // fallback — devolve o que tiver com 55 na frente
    return `55${digits}`;
  }

  return `55${digits}`;
}

export function buildWaLink(phone: string, message?: string): string {
  const num = normalizePhoneToWa(phone);
  const base = `https://wa.me/${num}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
