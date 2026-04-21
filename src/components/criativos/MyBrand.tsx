import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function MyBrand() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from('user_brands').select('logo_url').eq('user_id', user.id).maybeSingle();
    if (data) {
      setLogoUrl(data.logo_url);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/logo-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('brand-logos').upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from('brand-logos').getPublicUrl(path);
      setLogoUrl(publicUrl);
      toast({ title: 'Logo carregada' });
    } catch (err: any) {
      toast({ title: 'Erro ao enviar logo', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleRemoveLogo = () => setLogoUrl(null);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('user_brands').upsert({
      user_id: user.id,
      logo_url: logoUrl,
    }, { onConflict: 'user_id' });
    setSaving(false);
    if (error) return toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    toast({ title: 'Marca salva com sucesso' });
  };

  if (loading) return <div className="text-center py-12 text-muted-foreground">Carregando...</div>;

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Minha Marca</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label>Logo da marca</Label>
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-full bg-muted border-2 border-border flex items-center justify-center overflow-hidden">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
              ) : (
                <Upload className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleUpload} />
              <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                {logoUrl ? 'Trocar logo' : 'Enviar logo'}
              </Button>
              {logoUrl && (
                <Button type="button" variant="ghost" size="sm" onClick={handleRemoveLogo}>
                  <Trash2 className="h-4 w-4 mr-2" />Remover
                </Button>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">PNG transparente recomendado. Máx 5MB.</p>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full md:w-auto">
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Salvar marca
        </Button>
      </CardContent>
    </Card>
  );
}
