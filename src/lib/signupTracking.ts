import { supabase } from "@/integrations/supabase/client";
import type { SignupFormData } from "@/types/signup";

const STORAGE_KEY = "signup_session_id";

function getSessionId(): string {
  try {
    let id = localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = (crypto as any)?.randomUUID
        ? crypto.randomUUID()
        : `sess-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    return `sess-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

function sanitize(formData: SignupFormData): Record<string, unknown> {
  // Remove campos sensíveis antes de gravar
  const { password: _p, confirmPassword: _c, ...rest } = formData as any;
  return rest;
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

interface TrackOpts {
  currentStep: number;
  stepLabel?: string;
  totalSteps: number;
  immediate?: boolean;
}

async function send(payload: Record<string, unknown>) {
  try {
    await supabase.rpc("upsert_signup_progress" as any, {
      p_session_id: getSessionId(),
      p_payload: payload as any,
    });
  } catch (e) {
    console.warn("[signup-tracking] falha ao gravar progresso:", e);
  }
}

export function trackSignupProgress(formData: SignupFormData, opts: TrackOpts) {
  const sanitized = sanitize(formData);
  const payload = {
    email: formData.email || null,
    phone: formData.phone || null,
    name: formData.personType === "PJ" ? formData.companyName : formData.name,
    person_type: formData.personType || null,
    profession: formData.profession || null,
    company_type: formData.companyType || null,
    current_step: opts.currentStep,
    step_label: opts.stepLabel || null,
    total_steps: opts.totalSteps,
    form_data: sanitized,
  };

  if (opts.immediate) {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    void send(payload);
    return;
  }

  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    void send(payload);
  }, 600);
}

export async function markSignupCompleted(userId: string, formData: SignupFormData, totalSteps: number) {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  await send({
    email: formData.email || null,
    phone: formData.phone || null,
    name: formData.personType === "PJ" ? formData.companyName : formData.name,
    person_type: formData.personType || null,
    profession: formData.profession || null,
    company_type: formData.companyType || null,
    current_step: totalSteps,
    step_label: "Concluído",
    total_steps: totalSteps,
    form_data: sanitize(formData),
    completed: true,
    user_id: userId,
  });
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
