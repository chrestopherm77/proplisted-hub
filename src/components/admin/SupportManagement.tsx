import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  MessageSquare,
  Paperclip,
  Send,
  Phone,
  Copy,
  Search,
  ImageIcon,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
type TicketCategory = 'RECLAMACAO' | 'SUGESTAO' | 'DUVIDA' | 'OUTRO';

interface SupportTicket {
  id: string;
  user_id: string;
  subject: string | null;
  category: TicketCategory;
  status: TicketStatus;
  last_message_at: string;
  unread_by_admin: boolean;
  created_at: string;
}

interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_role: 'USER' | 'ADMIN';
  body: string;
  attachments: { url: string; name: string; size: number; type: string }[];
  created_at: string;
}

interface UserProfile {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
}

const CATEGORY_LABEL: Record<TicketCategory, string> = {
  RECLAMACAO: 'Reclamação',
  SUGESTAO: 'Sugestão',
  DUVIDA: 'Dúvida',
  OUTRO: 'Outro',
};

const STATUS_LABEL: Record<TicketStatus, string> = {
  OPEN: 'Aberto',
  IN_PROGRESS: 'Em andamento',
  RESOLVED: 'Resolvido',
  CLOSED: 'Fechado',
};

// Normaliza fone para 12 dígitos (55 + DDD + 8) — regra do projeto
function toWhatsAppDigits(raw: string | null | undefined): string {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 0) return '';
  // Já tem código do país?
  let normalized = digits.startsWith('55') ? digits.slice(2) : digits;
  // Remove o 9 extra se for celular (DDD + 9 + 8)
  if (normalized.length === 11 && normalized[2] === '9') {
    normalized = normalized.slice(0, 2) + normalized.slice(3);
  }
  if (normalized.length !== 10) return digits; // fallback
  return '55' + normalized;
}

export function SupportManagement() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({});
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'ALL'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<TicketCategory | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Reply
  const [replyBody, setReplyBody] = useState('');
  const [replyFiles, setReplyFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load tickets + profiles + realtime
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const { data: ts } = await supabase
        .from('support_tickets')
        .select('*')
        .order('last_message_at', { ascending: false });
      if (cancelled || !ts) return;
      setTickets(ts as SupportTicket[]);

      const userIds = Array.from(new Set(ts.map((t: any) => t.user_id)));
      if (userIds.length) {
        const { data: ps } = await supabase
          .from('profiles')
          .select('id, name, phone, email')
          .in('id', userIds);
        if (!cancelled && ps) {
          const map: Record<string, UserProfile> = {};
          ps.forEach((p: any) => (map[p.id] = p));
          setProfiles(map);
        }
      }
      setLoading(false);
    };
    load();

    const channel = supabase
      .channel('support-tickets-admin')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'support_tickets' },
        () => load(),
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  // Load messages for active ticket + realtime
  useEffect(() => {
    if (!activeTicketId) {
      setMessages([]);
      return;
    }
    let cancelled = false;

    const load = async () => {
      const { data } = await supabase
        .from('support_messages')
        .select('*')
        .eq('ticket_id', activeTicketId)
        .order('created_at', { ascending: true });
      if (!cancelled && data) setMessages(data as unknown as SupportMessage[]);
    };
    load();

    // mark as read by admin
    supabase
      .from('support_tickets')
      .update({ unread_by_admin: false })
      .eq('id', activeTicketId)
      .then(() => {});

    const channel = supabase
      .channel(`support-messages-admin-${activeTicketId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `ticket_id=eq.${activeTicketId}`,
        },
        (payload) => {
          setMessages((prev) => {
            const next = payload.new as unknown as SupportMessage;
            if (prev.some((m) => m.id === next.id)) return prev;
            return [...prev, next];
          });
          supabase
            .from('support_tickets')
            .update({ unread_by_admin: false })
            .eq('id', activeTicketId)
            .then(() => {});
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [activeTicketId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
      if (categoryFilter !== 'ALL' && t.category !== categoryFilter) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const profile = profiles[t.user_id];
        const haystack = [t.subject ?? '', profile?.name ?? '', profile?.email ?? '', profile?.phone ?? '']
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [tickets, statusFilter, categoryFilter, searchTerm, profiles]);

  const activeTicket = tickets.find((t) => t.id === activeTicketId);
  const activeProfile = activeTicket ? profiles[activeTicket.user_id] : null;

  const validateFiles = (files: File[]): boolean => {
    if (files.length > 5) {
      toast.error('Máximo de 5 imagens por mensagem');
      return false;
    }
    for (const f of files) {
      if (!f.type.startsWith('image/')) {
        toast.error('Apenas imagens são permitidas');
        return false;
      }
      if (f.size > 5 * 1024 * 1024) {
        toast.error(`"${f.name}" excede 5 MB`);
        return false;
      }
    }
    return true;
  };

  const uploadAttachments = async (
    ticketId: string,
    files: File[],
  ): Promise<SupportMessage['attachments']> => {
    if (!user) return [];
    const out: SupportMessage['attachments'] = [];
    for (const file of files) {
      const ext = file.name.split('.').pop() ?? 'bin';
      const path = `${user.id}/${ticketId}/admin-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('support-attachments').upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });
      if (error) {
        toast.error('Falha no upload de anexo');
        continue;
      }
      const { data } = supabase.storage.from('support-attachments').getPublicUrl(path);
      out.push({ url: data.publicUrl, name: file.name, size: file.size, type: file.type });
    }
    return out;
  };

  const handleReply = async () => {
    if (!activeTicketId || !user) return;
    if (!replyBody.trim() && replyFiles.length === 0) return;
    if (replyBody.length > 2000) {
      toast.error('Mensagem muito longa (máx. 2000 caracteres)');
      return;
    }
    setSending(true);
    try {
      const attachments = replyFiles.length ? await uploadAttachments(activeTicketId, replyFiles) : [];
      const { error } = await supabase.from('support_messages').insert({
        ticket_id: activeTicketId,
        sender_id: user.id,
        sender_role: 'ADMIN',
        body: replyBody.trim(),
        attachments,
      });
      if (error) {
        toast.error('Erro ao enviar resposta');
        return;
      }
      // Move to IN_PROGRESS if was OPEN
      if (activeTicket?.status === 'OPEN') {
        await supabase
          .from('support_tickets')
          .update({ status: 'IN_PROGRESS' })
          .eq('id', activeTicketId);
      }
      setReplyBody('');
      setReplyFiles([]);
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (status: TicketStatus) => {
    if (!activeTicketId) return;
    const { error } = await supabase
      .from('support_tickets')
      .update({ status })
      .eq('id', activeTicketId);
    if (error) toast.error('Erro ao atualizar status');
    else toast.success('Status atualizado');
  };

  const totalUnread = tickets.filter((t) => t.unread_by_admin).length;

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold">Chamados</h2>
        {totalUnread > 0 && (
          <Badge variant="destructive">{totalUnread} não lido{totalUnread > 1 ? 's' : ''}</Badge>
        )}
      </div>

      <div className="grid lg:grid-cols-[360px_1fr] gap-4 h-[calc(100vh-180px)]">
        {/* LEFT: List */}
        <Card className="flex flex-col overflow-hidden">
          <div className="p-3 space-y-2 border-b">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos status</SelectItem>
                  <SelectItem value="OPEN">Aberto</SelectItem>
                  <SelectItem value="IN_PROGRESS">Em andamento</SelectItem>
                  <SelectItem value="RESOLVED">Resolvido</SelectItem>
                  <SelectItem value="CLOSED">Fechado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={(v: any) => setCategoryFilter(v)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todas categorias</SelectItem>
                  <SelectItem value="RECLAMACAO">Reclamação</SelectItem>
                  <SelectItem value="SUGESTAO">Sugestão</SelectItem>
                  <SelectItem value="DUVIDA">Dúvida</SelectItem>
                  <SelectItem value="OUTRO">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <ScrollArea className="flex-1">
            {filteredTickets.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8 px-4">
                Nenhum chamado encontrado.
              </p>
            ) : (
              <div className="divide-y">
                {filteredTickets.map((t) => {
                  const p = profiles[t.user_id];
                  const isActive = t.id === activeTicketId;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveTicketId(t.id)}
                      className={`w-full text-left p-3 transition-colors ${
                        isActive ? 'bg-primary/10' : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {p?.name || 'Usuário'}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {t.subject || 'Sem assunto'}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {CATEGORY_LABEL[t.category]} •{' '}
                            {new Date(t.last_message_at).toLocaleString('pt-BR')}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant="outline" className="text-[10px]">
                            {STATUS_LABEL[t.status]}
                          </Badge>
                          {t.unread_by_admin && (
                            <span className="h-2 w-2 rounded-full bg-destructive" />
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </Card>

        {/* RIGHT: Thread */}
        <Card className="flex flex-col overflow-hidden">
          {!activeTicket ? (
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
              Selecione um chamado para ver a conversa
            </div>
          ) : (
            <>
              <div className="p-4 border-b space-y-2">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm">{activeProfile?.name || 'Usuário'}</p>
                    <p className="text-xs text-muted-foreground">
                      {activeProfile?.email || '—'} • {activeProfile?.phone || '—'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {CATEGORY_LABEL[activeTicket.category]} • {activeTicket.subject || 'Sem assunto'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Select value={activeTicket.status} onValueChange={(v: TicketStatus) => handleStatusChange(v)}>
                      <SelectTrigger className="h-8 w-[140px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OPEN">Aberto</SelectItem>
                        <SelectItem value="IN_PROGRESS">Em andamento</SelectItem>
                        <SelectItem value="RESOLVED">Resolvido</SelectItem>
                        <SelectItem value="CLOSED">Fechado</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!activeProfile?.phone}
                      onClick={() => {
                        const wp = toWhatsAppDigits(activeProfile?.phone);
                        if (wp) window.open(`https://wa.me/${wp}`, '_blank', 'noopener,noreferrer');
                      }}
                    >
                      <Phone className="h-3 w-3 mr-1" /> WhatsApp
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!activeProfile?.email}
                      onClick={() => {
                        if (activeProfile?.email) {
                          navigator.clipboard.writeText(activeProfile.email);
                          toast.success('E-mail copiado');
                        }
                      }}
                    >
                      <Copy className="h-3 w-3 mr-1" /> E-mail
                    </Button>
                  </div>
                </div>
              </div>

              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {messages.map((m) => (
                    <MessageBubble key={m.id} msg={m} />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <div className="border-t p-3 space-y-2">
                <FileChips
                  files={replyFiles}
                  onRemove={(i) => setReplyFiles(replyFiles.filter((_, idx) => idx !== i))}
                />
                <div className="flex items-end gap-2">
                  <Button variant="outline" size="icon" asChild>
                    <label className="cursor-pointer">
                      <Paperclip className="h-4 w-4" />
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const files = Array.from(e.target.files ?? []);
                          const all = [...replyFiles, ...files];
                          if (validateFiles(all)) setReplyFiles(all);
                          e.target.value = '';
                        }}
                      />
                    </label>
                  </Button>
                  <Textarea
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value.slice(0, 2000))}
                    placeholder="Responda ao usuário..."
                    className="min-h-[44px] max-h-32 flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleReply();
                      }
                    }}
                  />
                  <Button size="icon" onClick={handleReply} disabled={sending}>
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

function MessageBubble({ msg }: { msg: SupportMessage }) {
  const isAdmin = msg.sender_role === 'ADMIN';
  return (
    <div className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[70%] rounded-lg px-3 py-2 ${
          isAdmin ? 'bg-primary text-primary-foreground' : 'bg-muted'
        }`}
      >
        <p className="text-[10px] font-semibold uppercase mb-0.5 opacity-70">
          {isAdmin ? 'Você (admin)' : 'Usuário'}
        </p>
        {msg.body && <p className="text-sm whitespace-pre-wrap break-words">{msg.body}</p>}
        {msg.attachments?.length > 0 && (
          <div className="mt-2 grid grid-cols-2 gap-1">
            {msg.attachments.map((a, i) => (
              <a key={i} href={a.url} target="_blank" rel="noopener noreferrer">
                <img src={a.url} alt={a.name} className="rounded border max-h-32 object-cover w-full" />
              </a>
            ))}
          </div>
        )}
        <p className={`text-[10px] mt-1 ${isAdmin ? 'opacity-70' : 'text-muted-foreground'}`}>
          {new Date(msg.created_at).toLocaleString('pt-BR')}
        </p>
      </div>
    </div>
  );
}

function FileChips({ files, onRemove }: { files: File[]; onRemove: (i: number) => void }) {
  if (files.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {files.map((f, i) => (
        <div key={i} className="flex items-center gap-1 bg-muted rounded px-2 py-1 text-xs">
          <ImageIcon className="h-3 w-3" />
          <span className="max-w-[120px] truncate">{f.name}</span>
          <button onClick={() => onRemove(i)} className="text-muted-foreground hover:text-foreground">
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
