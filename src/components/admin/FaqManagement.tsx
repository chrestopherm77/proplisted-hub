import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Plus, Pencil, Trash2, FolderPlus, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface FaqCategory { id: string; title: string; sort_order: number; }
interface FaqItem { id: string; category_id: string; question: string; answer: string; sort_order: number; }

export function FaqManagement() {
  const [categories, setCategories] = useState<FaqCategory[]>([]);
  const [items, setItems] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // category dialog
  const [catOpen, setCatOpen] = useState(false);
  const [catEditing, setCatEditing] = useState<FaqCategory | null>(null);
  const [catTitle, setCatTitle] = useState('');
  const [catOrder, setCatOrder] = useState(0);

  // item dialog
  const [itemOpen, setItemOpen] = useState(false);
  const [itemEditing, setItemEditing] = useState<FaqItem | null>(null);
  const [itemCategory, setItemCategory] = useState('');
  const [itemQ, setItemQ] = useState('');
  const [itemA, setItemA] = useState('');
  const [itemOrder, setItemOrder] = useState(0);

  // delete confirm
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'cat' | 'item'; id: string; label: string } | null>(null);

  const load = async () => {
    setLoading(true);
    const [c, i] = await Promise.all([
      supabase.from('faq_categories').select('*').order('sort_order'),
      supabase.from('faq_items').select('*').order('sort_order'),
    ]);
    if (c.error || i.error) toast.error('Erro ao carregar FAQ');
    setCategories((c.data ?? []) as FaqCategory[]);
    setItems((i.data ?? []) as FaqItem[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNewCategory = () => {
    setCatEditing(null);
    setCatTitle('');
    setCatOrder(categories.length + 1);
    setCatOpen(true);
  };
  const openEditCategory = (c: FaqCategory) => {
    setCatEditing(c); setCatTitle(c.title); setCatOrder(c.sort_order); setCatOpen(true);
  };
  const saveCategory = async () => {
    if (!catTitle.trim()) { toast.error('Informe o título'); return; }
    const payload = { title: catTitle.trim(), sort_order: catOrder };
    const res = catEditing
      ? await supabase.from('faq_categories').update(payload).eq('id', catEditing.id)
      : await supabase.from('faq_categories').insert(payload);
    if (res.error) { toast.error('Erro ao salvar categoria'); return; }
    toast.success('Categoria salva');
    setCatOpen(false);
    load();
  };

  const openNewItem = (categoryId?: string) => {
    setItemEditing(null);
    setItemCategory(categoryId ?? categories[0]?.id ?? '');
    setItemQ(''); setItemA('');
    const count = items.filter((it) => it.category_id === (categoryId ?? '')).length;
    setItemOrder(count + 1);
    setItemOpen(true);
  };
  const openEditItem = (it: FaqItem) => {
    setItemEditing(it); setItemCategory(it.category_id);
    setItemQ(it.question); setItemA(it.answer); setItemOrder(it.sort_order);
    setItemOpen(true);
  };
  const saveItem = async () => {
    if (!itemCategory) { toast.error('Selecione a categoria'); return; }
    if (!itemQ.trim() || !itemA.trim()) { toast.error('Preencha pergunta e resposta'); return; }
    const payload = {
      category_id: itemCategory,
      question: itemQ.trim(),
      answer: itemA.trim(),
      sort_order: itemOrder,
    };
    const res = itemEditing
      ? await supabase.from('faq_items').update(payload).eq('id', itemEditing.id)
      : await supabase.from('faq_items').insert(payload);
    if (res.error) { toast.error('Erro ao salvar pergunta'); return; }
    toast.success('Pergunta salva');
    setItemOpen(false);
    load();
  };

  const doDelete = async () => {
    if (!confirmDelete) return;
    const table = confirmDelete.type === 'cat' ? 'faq_categories' : 'faq_items';
    const { error } = await supabase.from(table).delete().eq('id', confirmDelete.id);
    if (error) { toast.error('Erro ao excluir'); return; }
    toast.success('Removido');
    setConfirmDelete(null);
    load();
  };

  return (
    <div className="space-y-4" translate="no">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-semibold">FAQ — Central de Ajuda</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie as categorias e perguntas exibidas na Central de Ajuda dos usuários.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={openNewCategory}>
            <FolderPlus className="h-4 w-4 mr-2" /> Nova categoria
          </Button>
          <Button onClick={() => openNewItem()}>
            <Plus className="h-4 w-4 mr-2" /> Nova pergunta
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      ) : categories.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Nenhuma categoria cadastrada. Comece criando uma.
        </div>
      ) : (
        categories.map((cat) => {
          const catItems = items.filter((i) => i.category_id === cat.id);
          const isOpen = expanded[cat.id] ?? true;
          return (
            <Card key={cat.id}>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 py-3">
                <button
                  onClick={() => setExpanded((p) => ({ ...p, [cat.id]: !isOpen }))}
                  className="flex items-center gap-2 text-left flex-1"
                >
                  {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <CardTitle className="text-base">{cat.title}</CardTitle>
                  <span className="text-xs text-muted-foreground">
                    ({catItems.length} {catItems.length === 1 ? 'pergunta' : 'perguntas'})
                  </span>
                </button>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => openNewItem(cat.id)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => openEditCategory(cat)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setConfirmDelete({ type: 'cat', id: cat.id, label: cat.title })}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              {isOpen && (
                <CardContent className="space-y-2 pt-0">
                  {catItems.length === 0 ? (
                    <div className="text-sm text-muted-foreground py-3">
                      Sem perguntas nesta categoria.
                    </div>
                  ) : (
                    catItems.map((it) => (
                      <div
                        key={it.id}
                        className="border rounded-md p-3 flex items-start justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm">{it.question}</div>
                          <div className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {it.answer}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button size="sm" variant="ghost" onClick={() => openEditItem(it)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setConfirmDelete({ type: 'item', id: it.id, label: it.question })}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              )}
            </Card>
          );
        })
      )}

      {/* Category dialog */}
      <Dialog open={catOpen} onOpenChange={setCatOpen}>
        <DialogContent translate="no">
          <DialogHeader>
            <DialogTitle>{catEditing ? 'Editar categoria' : 'Nova categoria'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Título</label>
              <Input value={catTitle} onChange={(e) => setCatTitle(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Ordem</label>
              <Input
                type="number"
                value={catOrder}
                onChange={(e) => setCatOrder(Number(e.target.value) || 0)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatOpen(false)}>Cancelar</Button>
            <Button onClick={saveCategory}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Item dialog */}
      <Dialog open={itemOpen} onOpenChange={setItemOpen}>
        <DialogContent translate="no" className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{itemEditing ? 'Editar pergunta' : 'Nova pergunta'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Categoria</label>
              <Select value={itemCategory} onValueChange={setItemCategory}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Pergunta</label>
              <Input value={itemQ} onChange={(e) => setItemQ(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Resposta</label>
              <Textarea value={itemA} onChange={(e) => setItemA(e.target.value)} rows={5} />
            </div>
            <div>
              <label className="text-sm font-medium">Ordem</label>
              <Input
                type="number"
                value={itemOrder}
                onChange={(e) => setItemOrder(Number(e.target.value) || 0)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setItemOpen(false)}>Cancelar</Button>
            <Button onClick={saveItem}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent translate="no">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDelete?.type === 'cat'
                ? `A categoria "${confirmDelete?.label}" e todas as suas perguntas serão removidas. Esta ação não pode ser desfeita.`
                : `A pergunta "${confirmDelete?.label}" será removida. Esta ação não pode ser desfeita.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default FaqManagement;
