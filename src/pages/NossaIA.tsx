import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Play, Bot } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

import crmImg from '@/assets/nossa-ia-crm.png';
import dashboardImg from '@/assets/nossa-ia-dashboard.png';
import agentesImg from '@/assets/nossa-ia-agentes.png';
import agendamentosImg from '@/assets/nossa-ia-agendamentos.png';

const sections = [
  {
    title: 'CRM Inteligente',
    description:
      'Gerencie seus leads com um pipeline visual estilo Kanban. Acompanhe cada oportunidade do primeiro contato até o fechamento, com movimentação automática e priorização por inteligência artificial.',
    image: crmImg,
  },
  {
    title: 'Dashboard de Performance',
    description:
      'Tenha visão completa das suas métricas de vendas em tempo real. Acompanhe faturamento, conversões, ticket médio e tendências — tudo em um painel intuitivo que transforma dados em decisões.',
    image: dashboardImg,
  },
  {
    title: 'Agentes IA Especialistas',
    description:
      'Nossos agentes de inteligência artificial atendem seus leads 24h por dia, qualificando, respondendo dúvidas e encaminhando oportunidades quentes direto para você. Atendimento humanizado, em escala.',
    image: agentesImg,
  },
  {
    title: 'Agendamento de Visitas',
    description:
      'Automatize o agendamento de visitas com seus clientes. A IA coordena horários, envia lembretes e organiza sua agenda para que você foque no que importa: fechar negócios.',
    image: agendamentosImg,
  },
];

const NossaIA = () => {
  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
            <Bot className="h-4 w-4" />
            Inteligência Artificial
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Nossa IA
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Conheça as ferramentas de inteligência artificial que vão transformar a forma como você gera e gerencia negócios imobiliários.
          </p>
        </div>

        {/* Video placeholder */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <AspectRatio ratio={16 / 9}>
              <div className="w-full h-full bg-muted flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-muted/80 transition-colors">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Play className="h-8 w-8 text-primary ml-1" />
                </div>
                <span className="text-muted-foreground font-medium">Vídeo em breve</span>
              </div>
            </AspectRatio>
          </CardContent>
        </Card>

        {/* Sections */}
        <div className="space-y-16">
          {sections.map((section, index) => (
            <div
              key={section.title}
              className={`flex flex-col ${
                index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
              } gap-8 items-center`}
            >
              <div className="flex-1 space-y-4">
                <h2 className="text-2xl font-bold text-foreground">{section.title}</h2>
                <p className="text-muted-foreground leading-relaxed">{section.description}</p>
              </div>
              <div className="flex-1">
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    <img
                      src={section.image}
                      alt={section.title}
                      className="w-full h-auto object-cover"
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default NossaIA;
