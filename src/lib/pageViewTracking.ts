import { supabase } from "@/integrations/supabase/client";

// Mapa de rotas → rótulo amigável em PT-BR.
// Use prefixos quando precisar capturar rotas com :param.
const ROUTE_LABELS: Array<{ match: (path: string) => boolean; label: string }> = [
  { match: (p) => p === "/", label: "Visitou a página inicial" },
  { match: (p) => p === "/auth", label: "Acessou tela de login" },
  { match: (p) => p === "/cadastro", label: "Acessou tela de cadastro" },
  { match: (p) => p === "/cadastro-realizado", label: "Visualizou confirmação de cadastro" },
  { match: (p) => p === "/primeiros-passos", label: "Acessou Primeiros Passos" },
  { match: (p) => p === "/leads", label: "Acessou o Balcão (Leads Disponíveis)" },
  { match: (p) => p === "/my-leads", label: "Acessou Meus Leads" },
  { match: (p) => p === "/cart", label: "Acessou o carrinho" },
  { match: (p) => p === "/checkout", label: "Acessou o checkout" },
  { match: (p) => p === "/checkout-success", label: "Concluiu pagamento" },
  { match: (p) => p === "/checkout-error", label: "Erro no checkout" },
  { match: (p) => p === "/checkout-expired", label: "Checkout expirado" },
  { match: (p) => p === "/profile", label: "Acessou Meu Perfil" },
  { match: (p) => p === "/property-searches", label: "Acessou Venda em Parceria" },
  { match: (p) => p === "/property-searches/new", label: "Iniciou nova captação em Venda em Parceria" },
  { match: (p) => p.startsWith("/property-searches/"), label: "Visualizou detalhes de uma captação" },
  { match: (p) => p === "/launches", label: "Acessou Lançamentos" },
  { match: (p) => p === "/launches/new", label: "Iniciou cadastro de novo lançamento" },
  { match: (p) => /^\/launches\/[^/]+\/edit$/.test(p), label: "Editando um lançamento" },
  { match: (p) => p.startsWith("/launches/"), label: "Visualizou detalhes de um lançamento" },
  { match: (p) => p === "/portal-imoveis", label: "Acessou Portal de Imóveis" },
  { match: (p) => p === "/portal-imoveis/novo", label: "Iniciou cadastro de novo imóvel" },
  { match: (p) => /^\/portal-imoveis\/[^/]+\/editar$/.test(p), label: "Editando um imóvel" },
  { match: (p) => p.startsWith("/portal-imoveis/"), label: "Visualizou detalhes de um imóvel" },
  { match: (p) => p === "/financiamento", label: "Acessou Financiamento" },
  { match: (p) => p === "/giro-do-mercado", label: "Acessou Giro do Mercado" },
  { match: (p) => p === "/nossa-ia", label: "Acessou Nossa IA" },
  { match: (p) => p === "/comprar-creditos", label: "Acessou Comprar Créditos" },
  { match: (p) => p === "/calculadora", label: "Acessou Calculadora" },
  { match: (p) => p === "/criativos", label: "Acessou Criativos" },
  { match: (p) => p === "/planos", label: "Acessou Planos" },
  { match: (p) => p === "/indicar", label: "Acessou Indicações" },
  { match: (p) => p === "/reset-password", label: "Acessou recuperação de senha" },
  { match: (p) => p.startsWith("/admin"), label: "Acessou área administrativa" },
];

// Rotas que NÃO devem ser rastreadas (públicas / lead form / landing pages)
const IGNORED_PREFIXES = ["/lp", "/v/", "/imovel/"];

function labelFor(path: string): string | null {
  if (IGNORED_PREFIXES.some((p) => path === p || path.startsWith(p + "/") || path === p)) return null;
  for (const r of ROUTE_LABELS) if (r.match(path)) return r.label;
  return null; // ignora rotas não mapeadas (custom slugs, etc.)
}

let lastTrackedPath: string | null = null;
let lastTrackedAt = 0;

export async function trackPageView(path: string) {
  // Dedupe: mesma rota num intervalo curto não loga de novo
  const now = Date.now();
  if (path === lastTrackedPath && now - lastTrackedAt < 30_000) return;

  const label = labelFor(path);
  if (!label) return;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  lastTrackedPath = path;
  lastTrackedAt = now;

  try {
    await supabase.from("user_activity_log" as any).insert({
      user_id: user.id,
      event_type: "PAGE_VIEW",
      event_label: label,
      metadata: { path },
    });
  } catch (e) {
    console.warn("[page-view-tracking] falha:", e);
  }
}
