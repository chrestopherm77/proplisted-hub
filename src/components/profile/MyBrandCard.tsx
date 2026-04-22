import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Palette, Upload, Trash2 } from 'lucide-react';

export function MyBrandCard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [companyName, setCompanyName] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState('#1e40af');
  const [secondaryColor, setSecondaryColor] = useState('#22c55e');

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('user_brands')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) {
        setCompanyName((data as any).company_name || '');
        setLogoUrl(data.logo_url);
        setPrimaryColor(data.primary_color || '#1e40af');
        setSecondaryColor((data as any).secondary_color || '#22c55e');
      }
      setLoading(false);
    })();
  }, [user]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Imagem muito grande (máx 5MB)', variant: 'destructive' });
      return;
    }
    setUploading(true);
    const ext = file.name.split('.').pop() || 'png';
    const path = `brands/${user.id}/logo-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('properties').upload(path, file, { upsert: true });
    if (error) {
      toast({ title: 'Erro no upload', description: error.message, variant: 'destructive' });
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from('properties').getPublicUrl(path);
    setLogoUrl(data.publicUrl);
    setUploading(false);
    toast({ title: 'Logo enviado!' });
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from('user_brands')
      .upsert(
        {
          user_id: user.id,
          company_name: companyName || null,
          logo_url: logoUrl,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
        } as any,
        { onConflict: 'user_id' },
      );
    setSaving(false);
    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Marca salva!', description: 'Suas LPs públicas usarão essas cores.' });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Minha Marca
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Personalize as LPs dos imóveis que você anuncia com seu logo e cores.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Nome da imobiliária</Label>
          <Input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Ex: Imobiliária Silva"
          />
        </div>

        <div className="space-y-2">
          <Label>Logo</Label>
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <div className="relative w-20 h-20 rounded border bg-muted flex items-center justify-center overflow-hidden">
                <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className="w-20 h-20 rounded border-2 border-dashed flex items-center justify-center text-muted-foreground">
                <Upload className="h-6 w-6" />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <label>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                  disabled={uploading}
                />
                <Button type="button" variant="outline" size="sm" asChild disabled={uploading}>
                  <span className="cursor-pointer">
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {logoUrl ? 'Trocar logo' : 'Enviar logo'}
                  </span>
                </Button>
              </label>
              {logoUrl && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setLogoUrl(null)}>
                  <Trash2 className="h-4 w-4" /> Remover
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Cor primária</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-10 w-14 rounded border bg-transparent cursor-pointer"
              />
              <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="font-mono text-sm" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Cor secundária</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="h-10 w-14 rounded border bg-transparent cursor-pointer"
              />
              <Input value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="font-mono text-sm" />
            </div>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Salvar marca
        </Button>
      </CardContent>
    </Card>
  );
}
