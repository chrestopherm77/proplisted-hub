import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Style {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  prompt: string;
  is_active: boolean;
}

export function CreativeStylesManagement() {
  const { toast } = useToast();
  const [styles, setStyles] = useState<Style[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('creative_styles').select('*').order('name');
    setStyles((data as Style[]) || []);
    setLoading(false);
  };

  const general = styles.find((s) => s.slug === '__general__');
  const regularStyles = styles.filter((s) => s.slug !== '__general__');

  useEffect(() => { load(); }, []);

  const updateField = (id: string, field: keyof Style, value: any) => {
    setStyles((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const handleSave = async (s: Style) => {
    setSavingId(s.id);
    const { error } = await supabase.from('creative_styles').update({
      name: s.name,
      slug: s.slug,
      description: s.description,
      prompt: s.prompt,
      is_active: s.is_active,
    }).eq('id', s.id);
    setSavingId(null);
    if (error) return toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    toast({ title: 'Estilo salvo' });
  };

  if (loading) return <div className="text-center py-12 text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Estilos de Criativos</h2>
        <p className="text-sm text-muted-foreground">Edite os prompts usados pela IA para cada estilo.</p>
      </div>

      {general && (
        <Card className="border-primary/40 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span className="inline-flex items-center rounded-md bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                Global
              </span>
              {general.name}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Este prompt é <strong>sempre concatenado antes</strong> do prompt do estilo escolhido pelo cliente. Não aparece para o usuário final.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>Prompt Geral (base de toda geração)</Label>
              <Textarea
                rows={8}
                value={general.prompt}
                onChange={(e) => updateField(general.id, 'prompt', e.target.value)}
                placeholder="Instruções globais aplicadas a toda geração de criativo..."
              />
            </div>
            <Button onClick={() => handleSave(general)} disabled={savingId === general.id}>
              {savingId === general.id ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Salvar Prompt Geral
            </Button>
          </CardContent>
        </Card>
      )}

      {regularStyles.map((s) => (
        <Card key={s.id}>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="text-base">{s.name}</CardTitle>
            <div className="flex items-center gap-2">
              <Label className="text-xs">Ativo</Label>
              <Switch checked={s.is_active} onCheckedChange={(v) => updateField(s.id, 'is_active', v)} />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Nome</Label>
                <Input value={s.name} onChange={(e) => updateField(s.id, 'name', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Slug</Label>
                <Input value={s.slug} onChange={(e) => updateField(s.id, 'slug', e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Descrição</Label>
              <Input value={s.description || ''} onChange={(e) => updateField(s.id, 'description', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Prompt para IA</Label>
              <Textarea
                rows={6}
                value={s.prompt}
                onChange={(e) => updateField(s.id, 'prompt', e.target.value)}
                placeholder="Descreva o estilo visual, paleta de cores, mood, elementos gráficos..."
              />
            </div>
            <Button onClick={() => handleSave(s)} disabled={savingId === s.id}>
              {savingId === s.id ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Salvar
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
