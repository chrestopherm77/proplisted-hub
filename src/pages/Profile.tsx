import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { User, Phone, FileText, Loader2, Lock, Eye, EyeOff } from 'lucide-react';
import { validatePassword } from '@/lib/validators';

const Profile = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    phone: '',
    creci_number: ''
  });

  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<{ password?: string; confirm?: string }>({});

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }
    
    if (user) {
      fetchProfile();
    }
  }, [user, authLoading, navigate]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile({
          name: data.name || '',
          phone: data.phone || '',
          creci_number: data.creci_number || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o perfil.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          name: profile.name,
          phone: profile.phone,
          creci_number: profile.creci_number,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Perfil atualizado com sucesso!"
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o perfil.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    const newErrors: { password?: string; confirm?: string } = {};
    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      newErrors.password = validation.message;
    }
    if (newPassword !== confirmPassword) {
      newErrors.confirm = "As senhas não conferem";
    }
    setPasswordErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        if (error.message.includes("should be different")) {
          toast({ title: "Erro", description: "A nova senha deve ser diferente da anterior.", variant: "destructive" });
        } else {
          toast({ title: "Erro", description: error.message, variant: "destructive" });
        }
        return;
      }
      toast({ title: "Sucesso", description: "Senha alterada com sucesso!" });
      setNewPassword('');
      setConfirmPassword('');
      setPasswordErrors({});
    } catch (error) {
      console.error('Error changing password:', error);
      toast({ title: "Erro", description: "Não foi possível alterar a senha.", variant: "destructive" });
    } finally {
      setSavingPassword(false);
    }
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Meu Perfil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input 
                id="email" 
                value={user?.email || ''} 
                disabled 
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                O e-mail não pode ser alterado.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="name" 
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  placeholder="Seu nome completo"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="phone" 
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpf_cnpj">CPF/CNPJ</Label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="cpf_cnpj" 
                  value={profile.creci_number}
                  onChange={(e) => setProfile({ ...profile, creci_number: e.target.value })}
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  className="pl-10"
                />
              </div>
            </div>

            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="w-full"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Alterações'
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Alterar Senha
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova Senha</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (passwordErrors.password) setPasswordErrors(prev => ({ ...prev, password: undefined }));
                  }}
                  placeholder="Digite a nova senha"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordErrors.password && (
                <p className="text-sm text-destructive">{passwordErrors.password}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Mínimo 6 caracteres, com letra maiúscula, minúscula e número
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmNewPassword">Confirmar Nova Senha</Label>
              <div className="relative">
                <Input
                  id="confirmNewPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (passwordErrors.confirm) setPasswordErrors(prev => ({ ...prev, confirm: undefined }));
                  }}
                  placeholder="Confirme a nova senha"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordErrors.confirm && (
                <p className="text-sm text-destructive">{passwordErrors.confirm}</p>
              )}
            </div>

            <Button
              onClick={handlePasswordChange}
              disabled={savingPassword || !newPassword || !confirmPassword}
              className="w-full"
            >
              {savingPassword ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Alterando...
                </>
              ) : (
                'Alterar Senha'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Profile;
