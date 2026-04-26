import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, ExternalLink, Pencil, Trash2, Copy, Loader2 } from 'lucide-react';
import type { CustomLandingPage } from '@/components/admin/landing-page/types';

export function LandingPagesManagement() {
  const navigate = useNavigate();
  const [items, setItems] = useState<CustomLandingPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [toDelete, setToDelete] = useState<CustomLandingPage | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('custom_landing_pages')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      toast.error('Erro ao carregar LPs');
    } else {
      setItems((data as unknown as CustomLandingPage[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async () => {
    if (!toDelete) return;
    const { error } = await supabase.from('custom_landing_pages').delete().eq('id', toDelete.id);
    if (error) toast.error('Erro ao excluir');
    else {
      toast.success('LP excluída');
      load();
    }
    setToDelete(null);
  };

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copiado');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Landing Pages</h2>
          <p className="text-sm text-muted-foreground">
            Crie e gerencie LPs personalizadas com slug livre.
          </p>
        </div>
        <Button onClick={() => navigate('/admin/landing-pages/new')}>
          <Plus className="h-4 w-4" /> Nova LP
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          Nenhuma LP criada ainda. Clique em "Nova LP" para começar.
        </Card>
      ) : (
        <div className="grid gap-3">
          {items.map((lp) => (
            <Card key={lp.id} className="p-4 flex items-center justify-between gap-4 flex-wrap">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold truncate">{lp.title}</h3>
                  {lp.is_published ? (
                    <Badge variant="default">Publicada</Badge>
                  ) : (
                    <Badge variant="secondary">Rascunho</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  /{lp.slug} · criada em {new Date(lp.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={() => copyLink(lp.slug)}>
                  <Copy className="h-4 w-4" /> Copiar link
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={`/${lp.slug}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" /> Abrir
                  </a>
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate(`/admin/landing-pages/${lp.id}`)}>
                  <Pencil className="h-4 w-4" /> Editar
                </Button>
                <Button variant="outline" size="sm" onClick={() => setToDelete(lp)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir LP?</AlertDialogTitle>
            <AlertDialogDescription>
              A página "{toDelete?.title}" (/{toDelete?.slug}) será permanentemente removida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
