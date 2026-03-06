import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { validatePassword } from '@/lib/validators';
import { Lock, Eye, EyeOff, Loader2 } from 'lucide-react';

export function ProfilePasswordCard() {
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});

  const handleChange = async () => {
    const newErrors: typeof errors = {};
    const validation = validatePassword(newPassword);
    if (!validation.valid) newErrors.password = validation.message;
    if (newPassword !== confirmPassword) newErrors.confirm = "As senhas não conferem";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        toast({ title: "Erro", description: error.message.includes("should be different") ? "A nova senha deve ser diferente da anterior." : error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Sucesso", description: "Senha alterada com sucesso!" });
      setNewPassword('');
      setConfirmPassword('');
      setErrors({});
    } catch {
      toast({ title: "Erro", description: "Não foi possível alterar a senha.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          Alterar Senha
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Nova Senha</Label>
          <div className="relative">
            <Input
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); if (errors.password) setErrors(p => ({ ...p, password: undefined })); }}
              placeholder="Digite a nova senha"
              className="pr-10"
            />
            <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
          <p className="text-xs text-muted-foreground">Mínimo 6 caracteres, com letra maiúscula, minúscula e número</p>
        </div>
        <div className="space-y-2">
          <Label>Confirmar Nova Senha</Label>
          <div className="relative">
            <Input
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); if (errors.confirm) setErrors(p => ({ ...p, confirm: undefined })); }}
              placeholder="Confirme a nova senha"
              className="pr-10"
            />
            <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirm && <p className="text-sm text-destructive">{errors.confirm}</p>}
        </div>
        <Button onClick={handleChange} disabled={saving || !newPassword || !confirmPassword} className="w-full">
          {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Alterando...</> : 'Alterar Senha'}
        </Button>
      </CardContent>
    </Card>
  );
}
