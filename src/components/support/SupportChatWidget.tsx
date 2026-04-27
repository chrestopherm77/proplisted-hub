import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MessageCircle,
  ArrowLeft,
  Paperclip,
  Send,
  Plus,
  Loader2,
  X,
  ImageIcon,
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
  unread_by_user: boolean;
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

const STATUS_VARIANT: Record<TicketStatus, 'default' | 'secondary' | 'outline'> = {
  OPEN: 'default',
  IN_PROGRESS: 'default',
  RESOLVED: 'secondary',
  CLOSED: 'outline',
};

const HIDDEN_PREFIXES = ['/admin', '/lp', '/auth', '/reset-password'];

export function SupportChatWidget() {
  const { user } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [view, setView] = useState<'list' | 'thread' | 'new'>('list');
  const [profile, setProfile] = useState<{ name: string; phone: string; email: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // New ticket form
  const [newCategory, setNewCategory] = useState<TicketCategory>('DUVIDA');
  const [newBody, setNewBody] = useState('');
  const [newFiles, setNewFiles] = useState<File[]>([]);

  // Reply form
  const [replyBody, setReplyBody] = useState('');
  const [replyFiles, setReplyFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const hidden = useMemo(
    () => HIDDEN_PREFIXES.some((p) => location.pathname.startsWith(p)),
    [location.pathname],
  );

  // Load profile
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('name, phone, email')
        .eq('id', user.id)
        .maybeSingle();
      if (data) setProfile({ name: data.name ?? '', phone: data.phone ?? '', email: data.email ?? '' });
    })();
  }, [user]);

  // Load tickets + realtime
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const load = async () => {
      const { data } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('last_message_at', { ascending: false });
      if (!cancelled && data) setTickets(data as SupportTicket[]);
    };
    load();

    const channel = supabase
      .channel(`support-tickets-user-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'support_tickets', filter: `user_id=eq.${user.id}` },
        () => load(),
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user]);

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

    // Mark as read
    supabase
      .from('support_tickets')
      .update({ unread_by_user: false })
      .eq('id', activeTicketId)
      .then(() => {});

    const channel = supabase
      .channel(`support-messages-${activeTicketId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `ticket_id=eq.${activeTicketId}` },
        (payload) => {
          setMessages((prev) => {
            const next = payload.new as unknown as SupportMessage;
            if (prev.some((m) => m.id === next.id)) return prev;
            return [...prev, next];
          });
          // Mark as read whenever a new admin message arrives while open
          supabase
            .from('support_tickets')
            .update({ unread_by_user: false })
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

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, view]);

  if (!user || hidden) return null;

  const totalUnread = tickets.filter((t) => t.unread_by_user).length;

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
    const out: SupportMessage['attachments'] = [];
    for (const file of files) {
      const ext = file.name.split('.').pop() ?? 'bin';
      const path = `${user.id}/${ticketId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
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

  const handleCreateTicket = async () => {
    if (!newBody.trim() && newFiles.length === 0) {
      toast.error('Escreva uma mensagem ou anexe uma imagem');
      return;
    }
    if (newBody.length > 2000) {
      toast.error('Mensagem muito longa (máx. 2000 caracteres)');
      return;
    }
    setSending(true);
    try {
      const { data: ticket, error: tErr } = await supabase
        .from('support_tickets')
        .insert({ user_id: user.id, category: newCategory })
        .select()
        .single();
      if (tErr || !ticket) {
        toast.error('Erro ao abrir chamado');
        return;
      }

      const attachments = newFiles.length ? await uploadAttachments(ticket.id, newFiles) : [];

      const { error: mErr } = await supabase.from('support_messages').insert({
        ticket_id: ticket.id,
        sender_id: user.id,
        sender_role: 'USER',
        body: newBody.trim(),
        attachments,
      });
      if (mErr) {
        toast.error('Erro ao enviar mensagem');
        return;
      }
      toast.success('Chamado aberto!');
      setNewBody('');
      setNewFiles([]);
      setNewCategory('DUVIDA');
      setActiveTicketId(ticket.id);
      setView('thread');
    } finally {
      setSending(false);
    }
  };

  const handleReply = async () => {
    if (!activeTicketId) return;
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
        sender_role: 'USER',
        body: replyBody.trim(),
        attachments,
      });
      if (error) {
        toast.error('Erro ao enviar mensagem');
        return;
      }
      setReplyBody('');
      setReplyFiles([]);
    } finally {
      setSending(false);
    }
  };

  const activeTicket = tickets.find((t) => t.id === activeTicketId);

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => {
          setOpen(true);
          setView('list');
        }}
        className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-105 transition-transform flex items-center justify-center"
        aria-label="Abrir suporte"
      >
        <MessageCircle className="h-6 w-6" />
        {totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-destructive text-destructive-foreground text-xs font-bold flex items-center justify-center">
            {totalUnread}
          </span>
        )}
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
          <SheetHeader className="px-4 py-3 border-b">
            <div className="flex items-center gap-2">
              {view !== 'list' && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setView('list');
                    setActiveTicketId(null);
                  }}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <div className="flex-1">
                <SheetTitle className="text-base">
                  {view === 'list' && 'Suporte'}
                  {view === 'new' && 'Novo chamado'}
                  {view === 'thread' && (activeTicket?.subject || 'Chamado')}
                </SheetTitle>
                {view === 'thread' && activeTicket && (
                  <SheetDescription className="text-xs">
                    {CATEGORY_LABEL[activeTicket.category]} • {STATUS_LABEL[activeTicket.status]}
                  </SheetDescription>
                )}
                {view === 'list' && profile && (
                  <SheetDescription className="text-xs">
                    Te respondemos por aqui ou no seu WhatsApp
                  </SheetDescription>
                )}
              </div>
            </div>
          </SheetHeader>

          {/* LIST */}
          {view === 'list' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-3">
                <Button className="w-full" onClick={() => setView('new')}>
                  <Plus className="h-4 w-4 mr-1" /> Abrir novo chamado
                </Button>
              </div>
              <ScrollArea className="flex-1 px-3 pb-3">
                {tickets.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Você ainda não tem chamados. Abra um para falar com nosso time.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {tickets.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          setActiveTicketId(t.id);
                          setView('thread');
                        }}
                        className="w-full text-left p-3 rounded-md border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {t.subject || 'Sem assunto'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {CATEGORY_LABEL[t.category]} •{' '}
                              {new Date(t.last_message_at).toLocaleString('pt-BR')}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge variant={STATUS_VARIANT[t.status]} className="text-[10px]">
                              {STATUS_LABEL[t.status]}
                            </Badge>
                            {t.unread_by_user && (
                              <span className="h-2 w-2 rounded-full bg-destructive" />
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}

          {/* NEW */}
          {view === 'new' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Categoria</label>
                    <Select value={newCategory} onValueChange={(v: TicketCategory) => setNewCategory(v)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DUVIDA">Dúvida</SelectItem>
                        <SelectItem value="RECLAMACAO">Reclamação</SelectItem>
                        <SelectItem value="SUGESTAO">Sugestão</SelectItem>
                        <SelectItem value="OUTRO">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Mensagem</label>
                    <Textarea
                      value={newBody}
                      onChange={(e) => setNewBody(e.target.value.slice(0, 2000))}
                      placeholder="Descreva sua mensagem..."
                      className="mt-1 min-h-[120px]"
                    />
                    <p className="text-xs text-muted-foreground mt-1">{newBody.length}/2000</p>
                  </div>
                  {profile && (
                    <div className="rounded-md bg-muted p-3 text-xs space-y-1">
                      <p className="font-medium">Vamos te responder em:</p>
                      <p>📱 {profile.phone || '(telefone não cadastrado)'}</p>
                      <p>✉️ {profile.email || '(e-mail não cadastrado)'}</p>
                    </div>
                  )}
                  <FileChips files={newFiles} onRemove={(i) => setNewFiles(newFiles.filter((_, idx) => idx !== i))} />
                </div>
              </ScrollArea>
              <div className="border-t p-3 flex items-center gap-2">
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
                        const all = [...newFiles, ...files];
                        if (validateFiles(all)) setNewFiles(all);
                        e.target.value = '';
                      }}
                    />
                  </label>
                </Button>
                <Button className="flex-1" onClick={handleCreateTicket} disabled={sending}>
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
                  Enviar
                </Button>
              </div>
            </div>
          )}

          {/* THREAD */}
          {view === 'thread' && activeTicket && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {messages.map((m) => (
                    <MessageBubble key={m.id} msg={m} />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              {activeTicket.status === 'CLOSED' ? (
                <div className="border-t p-3 text-center text-sm text-muted-foreground">
                  Este chamado está fechado.
                </div>
              ) : (
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
                      placeholder="Escreva uma mensagem..."
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
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

function MessageBubble({ msg }: { msg: SupportMessage }) {
  const mine = msg.sender_role === 'USER';
  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-lg px-3 py-2 ${
          mine ? 'bg-primary text-primary-foreground' : 'bg-muted'
        }`}
      >
        {!mine && (
          <p className="text-[10px] font-semibold uppercase mb-0.5 opacity-70">Suporte</p>
        )}
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
        <p className={`text-[10px] mt-1 ${mine ? 'opacity-70' : 'text-muted-foreground'}`}>
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
