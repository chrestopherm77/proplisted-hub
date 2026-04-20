import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MyCreatives } from '@/components/criativos/MyCreatives';
import { MyBrand } from '@/components/criativos/MyBrand';
import { GenerateCreative } from '@/components/criativos/GenerateCreative';

export default function Criativos() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'meus';
  const [tab, setTab] = useState(initialTab);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  const handleTabChange = (v: string) => {
    setTab(v);
    setSearchParams({ tab: v });
  };

  if (loading) {
    return <Layout><div className="text-center py-12">Carregando...</div></Layout>;
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Criativos</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Gere criativos imobiliários profissionais com IA
          </p>
        </div>

        <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 h-auto">
            <TabsTrigger value="meus">Meus Criativos</TabsTrigger>
            <TabsTrigger value="marca">Minha Marca</TabsTrigger>
            <TabsTrigger value="gerar">Gerar Criativo</TabsTrigger>
          </TabsList>

          <TabsContent value="meus"><MyCreatives onGenerate={() => handleTabChange('gerar')} /></TabsContent>
          <TabsContent value="marca"><MyBrand /></TabsContent>
          <TabsContent value="gerar"><GenerateCreative onDone={() => handleTabChange('meus')} /></TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
