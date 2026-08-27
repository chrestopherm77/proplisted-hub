import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import BrandLogo from '@/components/BrandLogo';
import { Loader2, Store } from 'lucide-react';

export default function ParceiroBeneficios() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [form, setForm] = useState({
    company_name: '',
    contact_name: '',
    phone: '',
    email: '',
    password: '',
  });

  useEffect(() => {
    if (!authLoading && user) {
      supabase
        .from('benefit_partners' as any)
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) navigate('/painel-parceiro');
        });
    }
  }, [user, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail.trim(),
      password: loginPassword,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: 'Erro ao entrar', description: 'E-mail ou senha inválidos.', variant: 'destructive' });
      return;
    }
    navigate('/painel-parceiro');
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company_name || !form.contact_name || !form.phone || !form.email || form.password.length < 6) {
      toast({ title: 'Preencha todos os campos', description: 'A senha deve ter ao menos 6 caracteres.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);

    const cleanPhone = form.phone.replace(/\D/g, '');

    // Valida limite de contas por telefone antes de tentar criar o usuário
    const { data: phoneOk, error: phoneErr } = await supabase.rpc('check_phone_availability', { p_phone: cleanPhone });
    if (phoneErr) {
      setSubmitting(false);
      toast({ title: 'Erro', description: 'Não foi possível validar o telefone. Tente novamente.', variant: 'destructive' });
      return;
    }
    if (!phoneOk) {
      setSubmitting(false);
      toast({
        title: 'Telefone já cadastrado',
        description: 'Este telefone já possui o limite máximo de contas (2). Use outro número ou faça login.',
        variant: 'destructive',
      });
      return;
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/parceiro-beneficios`,
        data: {
          name: form.contact_name,
          company_name: form.company_name,
          phone: cleanPhone,
          person_type: 'PJ',
        },
      },
    });

    if (signUpError || !signUpData.user) {
      setSubmitting(false);
      const msg = signUpError?.message || '';
      let description = msg || 'Não foi possível criar a conta.';
      if (/already registered|already exists/i.test(msg)) {
        description = 'Este e-mail já está cadastrado. Faça login.';
      } else if (/database error|unexpected_failure/i.test(msg)) {
        description = 'Não foi possível criar a conta. Verifique se o telefone ou e-mail já estão em uso.';
      }
      toast({ title: 'Erro no cadastro', description, variant: 'destructive' });
      return;
    }


    const { error: partnerError } = await supabase.from('benefit_partners' as any).insert({
      user_id: signUpData.user.id,
      company_name: form.company_name,
      contact_name: form.contact_name,
      phone: form.phone.replace(/\D/g, ''),
      email: form.email.trim(),
    });
    setSubmitting(false);

    if (partnerError) {
      toast({ title: 'Erro', description: partnerError.message, variant: 'destructive' });
      return;
    }

    toast({
      title: 'Cadastro enviado!',
      description: 'Sua solicitação será analisada pela nossa equipe.',
    });
    navigate('/painel-parceiro');
  };

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center px-4 py-10">
      <div className="mb-6"><BrandLogo size="lg" /></div>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Store className="h-5 w-5 text-primary" /> Portal do Parceiro
          </CardTitle>
          <CardDescription>
            Cadastre sua empresa e ofereça benefícios exclusivos aos corretores da plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signup">
            <TabsList className="grid grid-cols-2 w-full mb-4">
              <TabsTrigger value="signup">Quero ser parceiro</TabsTrigger>
              <TabsTrigger value="login">Já sou parceiro</TabsTrigger>
            </TabsList>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-3">
                <div>
                  <Label>Nome da empresa</Label>
                  <Input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
                </div>
                <div>
                  <Label>Nome do responsável</Label>
                  <Input value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} />
                </div>
                <div>
                  <Label>WhatsApp</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(31) 99999-9999" />
                </div>
                <div>
                  <Label>E-mail</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div>
                  <Label>Senha</Label>
                  <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Enviar cadastro
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-3">
                <div>
                  <Label>E-mail</Label>
                  <Input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
                </div>
                <div>
                  <Label>Senha</Label>
                  <Input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Entrar
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
