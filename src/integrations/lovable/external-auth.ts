// Wrapper para autenticação OAuth gerenciada do Lovable Cloud que funciona
// também em deploys externos (Vercel/GitHub Pages/etc).
//
// O fluxo padrão usa o caminho relativo `/~oauth/initiate`, que só é
// interceptado pela infraestrutura de hospedagem do Lovable. Em qualquer
// outro host (ex.: domínios servidos pela Vercel) esse caminho cai em 404.
//
// Para resolver, apontamos o broker para a URL absoluta
// `https://oauth.lovable.app/initiate` e enviamos o `project_id` correto,
// que o broker passou a exigir quando chamado de fora do proxy do Lovable.

import { createLovableAuth } from "@lovable.dev/cloud-auth-js";
import { supabase } from "../supabase/client";

// Lovable project ID (não é segredo — usado apenas para o broker OAuth saber
// qual projeto autenticar).
const LOVABLE_PROJECT_ID = "cb8760c6-0b3f-47ef-bdaa-d125c325b434";

const externalAuth = createLovableAuth({
  oauthBrokerUrl: "https://oauth.lovable.app/initiate",
});

type SignInOptions = {
  redirect_uri?: string;
  extraParams?: Record<string, string>;
};

export const lovableExternal = {
  auth: {
    signInWithOAuth: async (
      provider: "google" | "apple",
      opts?: SignInOptions,
    ) => {
      const result = await externalAuth.signInWithOAuth(provider, {
        redirect_uri: opts?.redirect_uri,
        extraParams: {
          project_id: LOVABLE_PROJECT_ID,
          ...opts?.extraParams,
        },
      });

      if (result.redirected) return result;
      if (result.error) return result;

      try {
        await supabase.auth.setSession(result.tokens);
      } catch (e) {
        return {
          error: e instanceof Error ? e : new Error(String(e)),
        };
      }
      return result;
    },
  },
};
