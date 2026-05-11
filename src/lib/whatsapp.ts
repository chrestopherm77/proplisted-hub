/**
 * Normaliza um telefone para o formato wa.me (apenas dígitos, com DDI 55).
 * Aceita números com ou sem máscara, com ou sem DDI, com ou sem o "9" extra.
 * Padrão final: 55 + DDD (2) + 8 dígitos = 12 dígitos (regra do projeto).
 * Nunca lança — retorna string vazia em caso de input inválido.
 */
export function normalizePhoneToWa(phone: string | null | undefined): string {
  try {
    if (phone === null || phone === undefined) return "";
    const raw = String(phone).trim();
    if (!raw) return "";
    let digits = raw.replace(/\D/g, "");
    if (!digits) return "";

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
  } catch (e) {
    console.warn("[normalizePhoneToWa] Falha ao normalizar telefone:", e);
    return "";
  }
}

export function buildWaLink(phone: string | null | undefined, message?: string): string {
  const num = normalizePhoneToWa(phone);
  if (!num) return "https://wa.me/";
  const base = `https://wa.me/${num}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/**
 * Formata telefone brasileiro como (DDD) Numero.
 * Aceita números com/sem DDI 55, com/sem máscara.
 * Ex.: 5516992456258 -> (16) 99245-6258
 */
export function formatPhoneBR(phone: string | null | undefined): string {
  if (!phone) return "";
  let d = String(phone).replace(/\D/g, "");
  if (!d) return "";
  if ((d.length === 12 || d.length === 13) && d.startsWith("55")) d = d.slice(2);
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  return String(phone);
}

