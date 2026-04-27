import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { BrandLogo } from '@/components/BrandLogo';
import { MultiStepSignup } from '@/components/auth/MultiStepSignup';
import { ForgotPasswordModal } from '@/components/auth/ForgotPasswordModal';

export default function Auth() {
  const [searchParams] = useSearchParams();
  const refFromUrl = (searchParams.get('ref') || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
  const planFromUrl = (searchParams.get('plan') || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40);

  // Se vier ?ref= ou ?plan=, abre direto no signup
  const [isLogin, setIsLogin] = useState(!refFromUrl && !planFromUrl);
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  // Persiste o plano escolhido na LP (sessionStorage), de modo que o pós-cadastro
  // saiba para onde mandar o usuário (Planos com checkout aberto).
  useEffect(() => {
    if (planFromUrl) {
      import('@/lib/pendingPlan').then(({ setPendingPlan }) => setPendingPlan(planFromUrl));
    }
  }, [planFromUrl]);

  useEffect(() => {
    if (refFromUrl || planFromUrl) setIsLogin(false);
  }, [refFromUrl, planFromUrl]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      // Check if user is active
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_active')
        .eq('id', data.user.id)
        .single();

      if (profile && profile.is_active === false) {
        await supabase.auth.signOut();
        toast({
          title: 'Conta desativada',
          description: 'Sua conta foi desativada. Entre em contato com o suporte.',
          variant: 'destructive',
        });
        return;
      }

      // Record login history
      await supabase.from('login_history').insert({ user_id: data.user.id } as any);

      toast({
        title: 'Login realizado com sucesso!',
        description: 'Bem-vindo de volta.',
      });

      // Se o usuário veio de um CTA de plano, decidir o destino:
      // - Se já tem assinatura ATIVA nesse plano (ex.: o trigger já ativou "conexao"
      //   no signup), não faz sentido reabrir o checkout — vai direto pra /leads.
      // - Caso contrário, abre /planos?plan=slug pra concluir a contratação.
      const { getPendingPlan, clearPendingPlan } = await import('@/lib/pendingPlan');
      const pending = planFromUrl || getPendingPlan();
      if (pending) {
        clearPendingPlan();
        try {
          const { data: planRow } = await supabase
            .from('subscription_plans')
            .select('id')
            .eq('slug', pending)
            .maybeSingle();
          if (planRow?.id) {
            const { data: existingSub } = await supabase
              .from('user_subscriptions')
              .select('id')
              .eq('user_id', data.user.id)
              .eq('plan_id', planRow.id)
              .in('status', ['ACTIVE', 'OVERDUE'])
              .maybeSingle();
            if (existingSub) {
              navigate('/leads');
              return;
            }
          }
        } catch {
          /* segue fluxo padrão se a verificação falhar */
        }
        navigate(`/planos?plan=${pending}`);
      } else {
        navigate('/leads');
      }
    } catch (error: any) {
      const isNetworkError =
        error?.message?.includes('Failed to fetch') ||
        error?.name === 'TypeError' ||
        error?.message?.toLowerCase?.().includes('network');
      toast({
        title: isNetworkError ? 'Erro de conexão' : 'Erro no login',
        description: isNetworkError
          ? 'Não foi possível conectar ao servidor. Verifique sua internet, desative bloqueadores de anúncios/VPN ou tente outro navegador.'
          : error.message || 'Credenciais inválidas',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Show multi-step signup
  if (!isLogin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-background p-4">
        <div className="w-full max-w-lg">
          <div className="flex justify-center mb-6">
            <BrandLogo size="lg" />
          </div>
          <MultiStepSignup onSwitchToLogin={() => setIsLogin(true)} initialReferralCode={refFromUrl} />
        </div>
      </div>
    );
  }

  // Login form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <BrandLogo size="lg" />
          </div>
          <CardTitle className="text-2xl">Entrar no Conectae Imob</CardTitle>
          <CardDescription>Acesse sua conta para comprar leads</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Carregando...' : 'Entrar'}
            </Button>
          </form>
          <div className="mt-4 text-center space-y-2">
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className="text-primary hover:underline text-sm"
            >
              Não tem conta? Cadastre-se
            </button>
            <br />
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-muted-foreground hover:text-foreground text-sm"
            >
              Esqueci minha senha
            </button>
          </div>
        </CardContent>
      </Card>

      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />
    </div>
  );
}
