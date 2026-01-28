import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Package, TrendingUp, Shield, Zap, CheckCircle, ArrowRight, Users, Target, Clock } from 'lucide-react';
import FakeNotification from '@/components/FakeNotification';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/leads');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="container mx-auto px-4 py-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Package className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-primary">LeadBay</span>
          </div>
          <Button onClick={() => navigate('/auth')} size="lg">
            Entrar
          </Button>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-12 md:py-20 text-center bg-gradient-to-br from-primary-light to-white">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 md:mb-6 leading-tight px-2">
            Leads Qualificados para{' '}
            <span className="text-primary">Seu Negócio Imobiliário</span>
          </h1>
          <p className="text-base md:text-xl text-muted-foreground mb-6 md:mb-8 max-w-2xl mx-auto leading-relaxed px-4">
            Conecte-se com clientes em potencial prontos para comprar ou vender imóveis.
            Aumente suas vendas com leads verificados.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center px-4">
            <Button size="lg" onClick={() => navigate('/auth')} className="text-base md:text-lg px-6 md:px-8 h-12 md:h-auto">
              Começar Agora
              <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/leads')} className="text-base md:text-lg px-6 md:px-8 h-12 md:h-auto">
              Ver Leads Disponíveis
            </Button>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-12 md:py-20">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-3 md:mb-4">Por que escolher o LeadBay?</h2>
          <p className="text-center text-sm md:text-base text-muted-foreground mb-8 md:mb-12 max-w-2xl mx-auto px-4">
            A plataforma que corretores, imobiliárias e construtoras confiam para encontrar clientes com intenção real de compra
          </p>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
            <div className="bg-card p-8 rounded-xl shadow-lg border border-border hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Leads Qualificados</h3>
              <p className="text-muted-foreground leading-relaxed">
                Leads 100% verificados com interesse real de compra ou venda. Economize tempo com contatos desqualificados.
              </p>
            </div>
            <div className="bg-card p-8 rounded-xl shadow-lg border border-border hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Seguro e Confiável</h3>
              <p className="text-muted-foreground leading-relaxed">
                Total segurança e conformidade com a LGPD. Seus dados e investimentos protegidos em cada transação.
              </p>
            </div>
            <div className="bg-card p-8 rounded-xl shadow-lg border border-border hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Acesso Instantâneo</h3>
              <p className="text-muted-foreground leading-relaxed">
                Receba acesso imediato aos contatos após a confirmação do pagamento. 
                Sem espera, sem burocracia.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="bg-muted py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Como Funciona</h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              3 passos simples para começar a fechar negócios hoje
            </p>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                  1
                </div>
                <h3 className="text-xl font-semibold mb-2">Escolha o Lead</h3>
                <p className="text-muted-foreground">
                  Navegue pela plataforma e escolha leads que se encaixam no seu perfil de cliente
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                  2
                </div>
                <h3 className="text-xl font-semibold mb-2">Realize o Pagamento</h3>
                <p className="text-muted-foreground">
                  Adicione ao carrinho e finalize a compra de forma segura via PIX ou cartão
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                  3
                </div>
                <h3 className="text-xl font-semibold mb-2">Entre em Contato</h3>
                <p className="text-muted-foreground">
                  Acesse imediatamente nome e telefone do lead e comece a negociar
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="p-8">
              <Users className="h-12 w-12 text-primary mx-auto mb-4" />
              <div className="text-4xl font-bold text-primary mb-2">500+</div>
              <p className="text-muted-foreground">Corretores Ativos</p>
            </div>
            <div className="p-8">
              <Target className="h-12 w-12 text-primary mx-auto mb-4" />
              <div className="text-4xl font-bold text-primary mb-2">2.000+</div>
              <p className="text-muted-foreground">Leads Vendidos</p>
            </div>
            <div className="p-8">
              <Clock className="h-12 w-12 text-primary mx-auto mb-4" />
              <div className="text-4xl font-bold text-primary mb-2">24/7</div>
              <p className="text-muted-foreground">Suporte Disponível</p>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="bg-primary-light py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Benefícios Exclusivos</h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4 bg-white p-6 rounded-lg shadow-sm">
                  <CheckCircle className="h-6 w-6 text-success flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Leads Exclusivos por Região</h3>
                    <p className="text-muted-foreground">
                      Cada lead é compartilhado com no máximo 5 corretores. Mais exclusividades, menos concorrência.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 bg-white p-6 rounded-lg shadow-sm">
                  <CheckCircle className="h-6 w-6 text-success flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Informações Completas</h3>
                    <p className="text-muted-foreground">
                      Nome, telefone e descrição detalhada do interesse do cliente
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 bg-white p-6 rounded-lg shadow-sm">
                  <CheckCircle className="h-6 w-6 text-success flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Pagamento Seguro</h3>
                    <p className="text-muted-foreground">
                      Pagamento 100% seguro via PIX ou cartão, processado pela Asaas
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 bg-white p-6 rounded-lg shadow-sm">
                  <CheckCircle className="h-6 w-6 text-success flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Histórico Completo</h3>
                    <p className="text-muted-foreground">
                      Histórico completo de todos os leads adquiridos disponível 24/7
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-12 text-center text-white shadow-2xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Pronto para Aumentar suas Vendas?
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Junte-se a centenas de corretores que já estão fechando mais negócios com o LeadBay
            </p>
            <Button 
              size="lg" 
              onClick={() => navigate('/auth')}
              className="bg-white text-primary hover:bg-gray-100 text-lg px-10 py-6 h-auto"
            >
              Cadastre-se
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </section>
      </main>

      <footer className="bg-card border-t border-border">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-2">
              <Package className="h-6 w-6 text-primary" />
              <span className="font-bold text-primary">LeadBay</span>
            </div>
            <div className="text-sm text-muted-foreground text-center">
              © 2025 LeadBay. Todos os direitos reservados.
            </div>
          </div>
        </div>
      </footer>

      <FakeNotification />
    </div>
  );
};

export default Index;
