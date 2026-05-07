import { useEffect, useMemo, useState } from 'react';
import { HelpCircle, Search, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';

interface FaqItem { id: string; question: string; answer: string; sort_order: number; category_id: string; }
interface FaqCategoryRow { id: string; title: string; sort_order: number; }
interface FaqCategory { title: string; items: { q: string; a: string }[]; }

const norm = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export function FaqButton() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [data, setData] = useState<FaqCategory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || data.length > 0) return;
    setLoading(true);
    (async () => {
      const [c, i] = await Promise.all([
        supabase.from('faq_categories').select('*').order('sort_order'),
        supabase.from('faq_items').select('*').order('sort_order'),
      ]);
      const cats = (c.data ?? []) as FaqCategoryRow[];
      const items = (i.data ?? []) as FaqItem[];
      setData(
        cats.map((cat) => ({
          title: cat.title,
          items: items
            .filter((it) => it.category_id === cat.id)
            .map((it) => ({ q: it.question, a: it.answer })),
        })),
      );
      setLoading(false);
    })();
  }, [open, data.length]);

  const filtered = useMemo(() => {
    const q = norm(query.trim());
    if (!q) return data;
    return data
      .map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (it) => norm(it.q).includes(q) || norm(it.a).includes(q),
        ),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [query, data]);

  const totalResults = filtered.reduce((acc, c) => acc + c.items.length, 0);

  const openSupport = () => {
    setOpen(false);
    window.dispatchEvent(new CustomEvent('open-support-chat'));
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full h-11 w-11"
          aria-label="Perguntas frequentes"
          title="Perguntas frequentes"
        >
          <HelpCircle className="!h-6 !w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[480px] p-0 flex flex-col"
        translate="no"
      >
        <SheetHeader className="px-5 py-4 border-b">
          <SheetTitle>Central de Ajuda</SheetTitle>
          <SheetDescription>
            Respostas rápidas para as principais dúvidas sobre a plataforma.
          </SheetDescription>
          <div className="relative pt-2">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 mt-1 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar pergunta..."
              className="pl-8"
            />
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="px-5 py-4 space-y-6">
            {loading ? (
              <div className="text-center py-12 text-sm text-muted-foreground">
                Carregando perguntas...
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground">
                {query
                  ? `Nenhuma pergunta encontrada para "${query}".`
                  : 'Nenhuma pergunta cadastrada ainda.'}
              </div>
            ) : (
              filtered.map((cat) => (
                <div key={cat.title} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">{cat.title}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {cat.items.length} {cat.items.length === 1 ? 'pergunta' : 'perguntas'}
                    </span>
                  </div>
                  <Accordion type="single" collapsible className="w-full">
                    {cat.items.map((it, idx) => (
                      <AccordionItem key={idx} value={`${cat.title}-${idx}`}>
                        <AccordionTrigger className="text-left text-sm font-medium">
                          {it.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                          {it.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              ))
            )}
            {query && filtered.length > 0 && (
              <div className="text-xs text-muted-foreground text-center pt-2">
                {totalResults} resultado(s) para "{query}"
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="border-t px-5 py-3 bg-muted/30">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={openSupport}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Abrir chamado com o suporte
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default FaqButton;
