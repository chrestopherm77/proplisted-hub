import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { usePartner } from '@/contexts/PartnerContext';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, Coins, Crown, LogOut, Camera, Trash2, Loader2, PlayCircle, Gift, TrendingUp } from 'lucide-react';

const ALLOWED = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
const MAX_BYTES = 2 * 1024 * 1024;

function getInitials(name?: string | null, email?: string | null) {
  const base = (name || email || 'U').trim();
  const parts = base.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return base.substring(0, 2).toUpperCase();
}

export function UserAvatarMenu() {
  const { user, signOut } = useAuth();
  const { isPartnerSite } = usePartner();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('name, avatar_url')
        .eq('id', user.id)
        .single();
      if (data) {
        setName(data.name);
        setAvatarUrl((data as any).avatar_url ?? null);
      }
    };
    fetchProfile();

    const channel = supabase
      .channel('user-avatar-profile')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${user.id}`,
      }, (payload: any) => {
        if (payload?.new) {
          setName(payload.new.name ?? null);
          setAvatarUrl(payload.new.avatar_url ?? null);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handlePickFile = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !user) return;

    if (!ALLOWED.includes(file.type)) {
      toast.error('Formato inválido. Use PNG, JPG ou WEBP.');
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error('Imagem muito grande. Máximo 2 MB.');
      return;
    }

    setUploading(true);
    try {
      const ext = (file.name.split('.').pop() || 'png').toLowerCase();
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
      const publicUrl = pub.publicUrl;

      const { error: updErr } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);
      if (updErr) throw updErr;

      setAvatarUrl(publicUrl);
      toast.success('Foto atualizada!');
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Erro ao enviar a foto.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!user || !avatarUrl) return;
    setUploading(true);
    try {
      const { error: updErr } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user.id);
      if (updErr) throw updErr;

      // best-effort: remove the file from storage if it lives in our bucket
      try {
        const marker = '/storage/v1/object/public/avatars/';
        const idx = avatarUrl.indexOf(marker);
        if (idx >= 0) {
          const path = avatarUrl.substring(idx + marker.length);
          await supabase.storage.from('avatars').remove([path]);
        }
      } catch { /* ignore */ }

      setAvatarUrl(null);
      toast.success('Foto removida.');
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao remover foto.');
    } finally {
      setUploading(false);
    }
  };

  if (!user) return null;

  const initials = getInitials(name, user.email);

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        hidden
        accept="image/png,image/jpeg,image/webp"
        onChange={handleFileChange}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="rounded-full ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Abrir menu do usuário"
          >
            <Avatar className="h-9 w-9 border border-border">
              {avatarUrl ? <AvatarImage src={avatarUrl} alt={name || 'Avatar'} /> : null}
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="font-normal">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border border-border">
                {avatarUrl ? <AvatarImage src={avatarUrl} alt={name || 'Avatar'} /> : null}
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{name || 'Usuário'}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handlePickFile} disabled={uploading}>
            {uploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Camera className="mr-2 h-4 w-4" />
            )}
            <span>{avatarUrl ? 'Trocar foto' : 'Adicionar foto'}</span>
          </DropdownMenuItem>
          {avatarUrl && (
            <DropdownMenuItem onClick={handleRemovePhoto} disabled={uploading}>
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Remover foto</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate('/profile')}>
            <User className="mr-2 h-4 w-4" />
            <span>Meu Perfil</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/primeiros-passos')}>
            <PlayCircle className="mr-2 h-4 w-4" />
            <span>Primeiros Passos</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/comprar-creditos')}>
            <Coins className="mr-2 h-4 w-4" />
            <span>Comprar Créditos</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/indicar')}>
            <Gift className="mr-2 h-4 w-4 text-primary" />
            <span>Indicar e ganhar</span>
          </DropdownMenuItem>
          {!isPartnerSite && (
            <DropdownMenuItem onClick={() => navigate('/planos')}>
              <Crown className="mr-2 h-4 w-4" />
              <span>Planos</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sair</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
