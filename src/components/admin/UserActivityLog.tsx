import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Loader2,
  Search,
  RefreshCw,
  UserPlus,
  LogIn,
  ShoppingCart,
  CreditCard,
  Home,
  Building2,
  Target,
  Sparkles,
  Bell,
  CheckCircle2,
  Activity,
  ChevronLeft,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ActivityRow {
  id: string;
  user_id: string;
  event_type: string;
  event_label: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface UserSummary {
  user_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  total_events: number;
  last_event_at: string;
}

const EVENT_META: Record<string, { icon: any; color: string; bg: string }> = {
  SIGNUP: { icon: UserPlus, color: "text-emerald-600", bg: "bg-emerald-50" },
  LOGIN: { icon: LogIn, color: "text-slate-600", bg: "bg-slate-50" },
  PROFILE_COMPLETED: { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
  LEAD_PURCHASE: { icon: ShoppingCart, color: "text-blue-600", bg: "bg-blue-50" },
  CREDIT_PURCHASE: { icon: CreditCard, color: "text-violet-600", bg: "bg-violet-50" },
  PROPERTY_PUBLISHED: { icon: Home, color: "text-indigo-600", bg: "bg-indigo-50" },
  LAUNCH_PUBLISHED: { icon: Building2, color: "text-orange-600", bg: "bg-orange-50" },
  PROPERTY_SEARCH_CREATED: { icon: Target, color: "text-pink-600", bg: "bg-pink-50" },
  CREATIVE_GENERATED: { icon: Sparkles, color: "text-amber-600", bg: "bg-amber-50" },
  LEAD_ALERT_CREATED: { icon: Bell, color: "text-cyan-600", bg: "bg-cyan-50" },
  ONBOARDING_VIEW: { icon: Activity, color: "text-teal-600", bg: "bg-teal-50" },
  SUPPORT_TICKET: { icon: Activity, color: "text-rose-600", bg: "bg-rose-50" },
};

function metaFor(type: string) {
  return EVENT_META[type] ?? { icon: Activity, color: "text-muted-foreground", bg: "bg-muted" };
}

function formatMetadata(m: Record<string, unknown>): string | null {
  if (!m || Object.keys(m).length === 0) return null;
  const parts: string[] = [];
  if (m.title) parts.push(String(m.title));
  if (m.name && !m.title) parts.push(String(m.name));
  if (m.city) parts.push(String(m.city));
  if (m.amount !== undefined && m.amount !== null) {
    parts.push(`R$ ${Number(m.amount).toFixed(2)}`);
  }
  if (m.credits !== undefined && m.credits !== null) parts.push(`${m.credits} créditos`);
  if (m.payment_method) parts.push(String(m.payment_method));
  if (m.reference_code) parts.push(String(m.reference_code));
  return parts.length ? parts.join(" · ") : null;
}

export function UserActivityLog() {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserSummary | null>(null);
  const [events, setEvents] = useState<ActivityRow[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  const loadUsers = async () => {
    setLoadingUsers(true);
    // Pega todos os logs e agrega por user_id no client (até 5000 eventos é suficiente)
    const { data: logs } = await supabase
      .from("user_activity_log" as any)
      .select("user_id, created_at")
      .order("created_at", { ascending: false })
      .limit(5000);

    const agg = new Map<string, { total: number; last: string }>();
    (logs || []).forEach((l: any) => {
      const cur = agg.get(l.user_id);
      if (!cur) agg.set(l.user_id, { total: 1, last: l.created_at });
      else cur.total += 1;
    });

    const ids = Array.from(agg.keys());
    if (ids.length === 0) {
      setUsers([]);
      setLoadingUsers(false);
      return;
    }

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name, email, phone, avatar_url")
      .in("id", ids);

    const byId = new Map((profiles || []).map((p: any) => [p.id, p]));
    const summary: UserSummary[] = ids.map((uid) => {
      const a = agg.get(uid)!;
      const p: any = byId.get(uid) || {};
      return {
        user_id: uid,
        name: p.name ?? null,
        email: p.email ?? null,
        phone: p.phone ?? null,
        avatar_url: p.avatar_url ?? null,
        total_events: a.total,
        last_event_at: a.last,
      };
    });
    summary.sort((a, b) => +new Date(b.last_event_at) - +new Date(a.last_event_at));
    setUsers(summary);
    setLoadingUsers(false);
  };

  const loadEvents = async (userId: string) => {
    setLoadingEvents(true);
    const { data } = await supabase
      .from("user_activity_log" as any)
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(500);
    setEvents((data || []) as unknown as ActivityRow[]);
    setLoadingEvents(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (selectedUser) loadEvents(selectedUser.user_id);
  }, [selectedUser]);

  const filtered = useMemo(() => {
    if (!search.trim()) return users;
    const s = search.toLowerCase();
    return users.filter((u) =>
      `${u.name || ""} ${u.email || ""} ${u.phone || ""}`.toLowerCase().includes(s),
    );
  }, [users, search]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4 min-h-[calc(100vh-180px)]">
      {/* Lista de usuários */}
      <Card className={cn("flex flex-col", selectedUser && "hidden lg:flex")}>
        <div className="p-4 border-b space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Corretores ({filtered.length})</h2>
            <Button variant="ghost" size="icon" onClick={loadUsers} disabled={loadingUsers}>
              <RefreshCw className={cn("h-4 w-4", loadingUsers && "animate-spin")} />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar nome, e-mail ou telefone"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          {loadingUsers ? (
            <div className="p-8 text-center">
              <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Nenhum usuário encontrado.
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((u) => (
                <button
                  key={u.user_id}
                  onClick={() => setSelectedUser(u)}
                  className={cn(
                    "w-full text-left p-3 hover:bg-muted/50 transition-colors",
                    selectedUser?.user_id === u.user_id && "bg-muted",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm truncate">{u.name || "Sem nome"}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {u.email || u.phone || "—"}
                      </div>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      {u.total_events}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Última atividade{" "}
                    {formatDistanceToNow(new Date(u.last_event_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </Card>

      {/* Timeline */}
      <Card className={cn("flex flex-col", !selectedUser && "hidden lg:flex")}>
        {!selectedUser ? (
          <div className="flex-1 flex items-center justify-center text-center text-muted-foreground p-8">
            <div>
              <Activity className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Selecione um corretor para ver o histórico de atividades.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="p-4 border-b flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSelectedUser(null)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold truncate">{selectedUser.name || "Sem nome"}</h2>
                <div className="text-xs text-muted-foreground truncate">
                  {selectedUser.email} {selectedUser.phone && `· ${selectedUser.phone}`}
                </div>
              </div>
              <Badge variant="outline">{events.length} eventos</Badge>
            </div>
            <ScrollArea className="flex-1 p-4">
              {loadingEvents ? (
                <div className="p-8 text-center">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                </div>
              ) : events.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  Nenhuma atividade registrada.
                </div>
              ) : (
                <div className="relative pl-6 space-y-4">
                  <div className="absolute left-[10px] top-2 bottom-2 w-px bg-border" />
                  {events.map((ev) => {
                    const meta = metaFor(ev.event_type);
                    const Icon = meta.icon;
                    const detail = formatMetadata(ev.metadata || {});
                    return (
                      <div key={ev.id} className="relative">
                        <div
                          className={cn(
                            "absolute -left-6 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-background",
                            meta.bg,
                          )}
                        >
                          <Icon className={cn("h-3 w-3", meta.color)} />
                        </div>
                        <div className="bg-muted/30 rounded-lg p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="text-sm font-medium">{ev.event_label}</div>
                              {detail && (
                                <div className="text-xs text-muted-foreground mt-0.5 break-all">
                                  {detail}
                                </div>
                              )}
                            </div>
                            <div
                              className="text-xs text-muted-foreground shrink-0"
                              title={format(new Date(ev.created_at), "dd/MM/yyyy HH:mm:ss", {
                                locale: ptBR,
                              })}
                            >
                              {formatDistanceToNow(new Date(ev.created_at), {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </div>
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-1">
                            {format(new Date(ev.created_at), "dd/MM/yyyy 'às' HH:mm", {
                              locale: ptBR,
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </>
        )}
      </Card>
    </div>
  );
}

export default UserActivityLog;
