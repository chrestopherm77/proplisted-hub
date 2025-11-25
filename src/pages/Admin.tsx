import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/Layout';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LeadsManagement } from '@/components/admin/LeadsManagement';
import { PurchasesOverview } from '@/components/admin/PurchasesOverview';
import { DashboardStats } from '@/components/admin/DashboardStats';

export default function Admin() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || isAdmin === null) return;
    
    if (!user) {
      navigate('/auth');
      return;
    }

    if (isAdmin === false) {
      toast({
        title: 'Acesso Negado',
        description: 'Você não tem permissão para acessar esta área',
        variant: 'destructive',
      });
      navigate('/leads');
      return;
    }

    setLoading(false);
  }, [user, authLoading, isAdmin, navigate, toast]);

  if (loading || authLoading) {
    return (
      <Layout>
        <div className="text-center py-12">Carregando...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Painel Administrativo</h1>
          <p className="text-muted-foreground">
            Gerencie leads, visualize compras e acompanhe estatísticas
          </p>
        </div>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="leads">Gerenciar Leads</TabsTrigger>
            <TabsTrigger value="purchases">Compras</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <DashboardStats />
          </TabsContent>

          <TabsContent value="leads">
            <LeadsManagement />
          </TabsContent>

          <TabsContent value="purchases">
            <PurchasesOverview />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
