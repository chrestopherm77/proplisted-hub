import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PasswordRecoveryModal from '@/components/profile/PasswordRecoveryModal';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Phone, Loader2, Mail } from 'lucide-react';
import { ProfilePersonalCard } from '@/components/profile/ProfilePersonalCard';
import { ProfileLocationCard } from '@/components/profile/ProfileLocationCard';
import { ProfileProfessionalCard } from '@/components/profile/ProfileProfessionalCard';
import { ProfilePasswordCard } from '@/components/profile/ProfilePasswordCard';
import { MyBrandCard } from '@/components/profile/MyBrandCard';
import { MySubscriptionCard } from '@/components/profile/MySubscriptionCard';
import { CompleteProfileBanner } from '@/components/profile/CompleteProfileBanner';
import { CompleteProfileModal } from '@/components/profile/CompleteProfileModal';

interface ProfileState {
  person_type: string;
  name: string;
  cpf: string;
  profession: string;
  company_name: string;
  cnpj: string;
  company_type: string;
  phone: string;
  address: string;
  address_uf: string;
  address_city: string;
  address_neighborhood: string;
  creci: string;
  creci_uf: string;
  cau: string;
  cau_uf: string;
  crea: string;
  crea_uf: string;
  creci_pj: string;
  creci_pj_uf: string;
  crea_pj: string;
  crea_pj_uf: string;
  rt_name: string;
  rt_cpf: string;
  rt_crea: string;
  rt_crea_uf: string;
  rt_cau: string;
  rt_cau_uf: string;
}

const defaultProfile: ProfileState = {
  person_type: '', name: '', cpf: '', profession: '',
  company_name: '', cnpj: '', company_type: '',
  phone: '', address: '', address_uf: '', address_city: '', address_neighborhood: '',
  creci: '', creci_uf: '', cau: '', cau_uf: '', crea: '', crea_uf: '',
  creci_pj: '', creci_pj_uf: '', crea_pj: '', crea_pj_uf: '',
  rt_name: '', rt_cpf: '', rt_crea: '', rt_crea_uf: '', rt_cau: '', rt_cau_uf: '',
};

const Profile = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileState>(defaultProfile);
  const [initialProfile, setInitialProfile] = useState<ProfileState>(defaultProfile);

  const FIELD_LABELS: Partial<Record<keyof ProfileState, string>> = {
    name: 'Nome', cpf: 'CPF', profession: 'Profissão',
    company_name: 'Razão Social', cnpj: 'CNPJ', company_type: 'Tipo de Empresa',
    phone: 'Telefone', address: 'Endereço', address_uf: 'Estado',
    address_city: 'Cidade', address_neighborhood: 'Bairro',
    creci: 'CRECI', creci_uf: 'UF do CRECI', cau: 'CAU', cau_uf: 'UF do CAU',
    crea: 'CREA', crea_uf: 'UF do CREA',
    creci_pj: 'CRECI PJ', creci_pj_uf: 'UF do CRECI PJ',
    crea_pj: 'CREA PJ', crea_pj_uf: 'UF do CREA PJ',
    rt_name: 'Nome do RT', rt_cpf: 'CPF do RT',
    rt_crea: 'CREA do RT', rt_crea_uf: 'UF do CREA do RT',
    rt_cau: 'CAU do RT', rt_cau_uf: 'UF do CAU do RT',
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }
    if (user) {
      fetchProfile();
      if (searchParams.get('recovery') === 'true') {
        setIsRecoveryModalOpen(true);
      }
    }
  }, [user, authLoading, navigate]);

  const handleCloseRecoveryModal = () => {
    setIsRecoveryModalOpen(false);
    searchParams.delete('recovery');
    setSearchParams(searchParams, { replace: true });
  };

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const mapped: ProfileState = { ...defaultProfile };
        for (const key of Object.keys(defaultProfile) as (keyof ProfileState)[]) {
          if (data[key] != null) mapped[key] = data[key] as string;
        }
        setProfile(mapped);
        setInitialProfile(mapped);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({ title: "Erro", description: "Não foi possível carregar o perfil.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = (updates: Partial<ProfileState>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  };

  const handleSave = async () => {
    if (!user) return;

    // Bloqueia remoção de dados já preenchidos
    for (const key of Object.keys(FIELD_LABELS) as (keyof ProfileState)[]) {
      const wasFilled = (initialProfile[key] || '').toString().trim().length > 0;
      const nowEmpty = !(profile[key] || '').toString().trim();
      if (wasFilled && nowEmpty) {
        toast({
          title: "Não é possível remover",
          description: `O campo "${FIELD_LABELS[key]}" não pode ser deixado em branco. Você pode atualizá-lo, mas não removê-lo.`,
          variant: "destructive",
        });
        return;
      }
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...profile,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      setInitialProfile(profile);
      toast({ title: "Sucesso", description: "Perfil atualizado com sucesso!" });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({ title: "Erro", description: "Não foi possível salvar o perfil.", variant: "destructive" });
    } finally {
      setSaving(false);
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
      <PasswordRecoveryModal isOpen={isRecoveryModalOpen} onClose={handleCloseRecoveryModal} />
      <div className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
        {/* Banner Completar Cadastro */}
        <CompleteProfileBanner />

        {/* Minha Assinatura */}
        <MySubscriptionCard />

        {/* Dados Pessoais / Empresa */}
        <ProfilePersonalCard profile={profile} onChange={updateProfile} />

        {/* Contato */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Contato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                E-mail
              </Label>
              <Input value={user?.email || ''} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">O e-mail não pode ser alterado.</p>
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input
                value={profile.phone}
                onChange={(e) => updateProfile({ phone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>
          </CardContent>
        </Card>

        {/* Localização */}
        <ProfileLocationCard
          address_uf={profile.address_uf}
          address_city={profile.address_city}
          address_neighborhood={profile.address_neighborhood}
          address={profile.address}
          onChange={updateProfile}
        />

        {/* Dados Profissionais */}
        <ProfileProfessionalCard
          person_type={profile.person_type}
          profession={profile.profession}
          company_type={profile.company_type}
          creci={profile.creci}
          creci_uf={profile.creci_uf}
          cau={profile.cau}
          cau_uf={profile.cau_uf}
          crea={profile.crea}
          crea_uf={profile.crea_uf}
          creci_pj={profile.creci_pj}
          creci_pj_uf={profile.creci_pj_uf}
          crea_pj={profile.crea_pj}
          crea_pj_uf={profile.crea_pj_uf}
          rt_name={profile.rt_name}
          rt_cpf={profile.rt_cpf}
          rt_crea={profile.rt_crea}
          rt_crea_uf={profile.rt_crea_uf}
          rt_cau={profile.rt_cau}
          rt_cau_uf={profile.rt_cau_uf}
          onChange={updateProfile}
        />

        {/* Botão Salvar */}
        <Button onClick={handleSave} disabled={saving} className="w-full" size="lg">
          {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</> : 'Salvar Alterações'}
        </Button>

        {/* Minha Marca */}
        <MyBrandCard />

        {/* Alterar Senha */}
        <ProfilePasswordCard />
      </div>
    </Layout>
  );
};

export default Profile;
