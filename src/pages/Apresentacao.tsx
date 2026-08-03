import { useEffect } from 'react';
import BrandLogo from '@/components/BrandLogo';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend, LabelList,
} from 'recharts';
import {
  AlertTriangle, Building2, Percent, Users, Layers, Wallet, GraduationCap,
  Scale, Handshake, Rocket, Target, TrendingUp, Mail, Phone, CheckCircle2,
  XCircle, MinusCircle, Sparkles, MapPin,
} from 'lucide-react';
import gustavoPhoto from '@/assets/team-gustavo.jpg.asset.json';
import chrestopherPhoto from '@/assets/team-chrestopher.jpg.asset.json';
import lucasPhoto from '@/assets/team-lucas.jpg.asset.json';


/* ---------------- Dados ---------------- */

const marketData = [
  { name: 'TAM · Brasil', value: 620000, label: '620.000+' },
  { name: 'SAM · Sul/Sudeste', value: 415000, label: '400–430 mil' },
  { name: 'SOM · Ribeirão Preto', value: 6000, label: '5–7 mil' },
];

const channelData = [
  { name: 'SDR / Comercial interno', value: 40 },
  { name: 'Meta Ads', value: 30 },
  { name: 'Google Ads', value: 15 },
  { name: 'Plataformas', value: 10 },
  { name: 'Indicação', value: 5 },
];

const investmentData = [
  { name: 'Meta Ads', value: 6000 },
  { name: 'Google Ads', value: 6000 },
  { name: 'Marketing interno', value: 6000 },
  { name: 'Comercial', value: 6000 },
  { name: 'Evento', value: 4000 },
];

const scenarioData = [
  { name: 'Pessimista', cac: 70, assinantes: 250, mrr: 9975, total: 18000 },
  { name: 'Intermediário', cac: 45, assinantes: 450, mrr: 17955, total: 32000 },
  { name: 'Otimista', cac: 30, assinantes: 700, mrr: 27930, total: 55000 },
];

const useOfFunds = [
  { name: 'Hunters + Tráfego B2C', value: 55 },
  { name: 'Estrutura e equipe', value: 20 },
  { name: 'Roadmap tecnológico', value: 15 },
  { name: 'Capital de giro', value: 10 },
];

const PIE_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(var(--brand-green))',
  'hsl(var(--accent))',
  'hsl(var(--primary-dark))',
];

const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

/* ---------------- Blocos ---------------- */

const Slide = ({ id, children, tone = 'light' }: { id: string; children: React.ReactNode; tone?: 'light' | 'soft' | 'dark' }) => (
  <section
    id={id}
    className={[
      'w-full py-20 md:py-28 px-6',
      tone === 'dark'
        ? 'bg-[hsl(var(--portal-navy-deep))] text-white'
        : tone === 'soft'
          ? 'bg-[hsl(var(--portal-soft))] text-foreground'
          : 'bg-background text-foreground',
    ].join(' ')}
  >
    <div className="max-w-6xl mx-auto">{children}</div>
  </section>
);

const SlideTitle = ({ kicker, title, subtitle, invert }: { kicker: string; title: string; subtitle?: string; invert?: boolean }) => (
  <header className="mb-12">
    <p className={`text-xs font-semibold uppercase tracking-[0.25em] mb-3 ${invert ? 'text-[hsl(var(--brand-green))]' : 'text-primary'}`}>{kicker}</p>
    <h2 className={`text-3xl md:text-5xl font-bold tracking-tight ${invert ? 'text-white' : 'text-[hsl(var(--portal-navy))]'}`}>{title}</h2>
    {subtitle && <p className={`mt-4 text-base md:text-lg max-w-3xl ${invert ? 'text-white/70' : 'text-muted-foreground'}`}>{subtitle}</p>}
  </header>
);

const Card = ({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) => (
  <div className="rounded-xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
    <div className="w-11 h-11 rounded-lg bg-primary-light flex items-center justify-center mb-4">
      <Icon className="w-5 h-5 text-primary" />
    </div>
    <h3 className="font-semibold text-lg text-[hsl(var(--portal-navy))] mb-2">{title}</h3>
    <p className="text-sm leading-relaxed text-muted-foreground">{children}</p>
  </div>
);

const chartTooltip = {
  contentStyle: {
    background: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: 8,
    fontSize: 12,
    color: 'hsl(var(--card-foreground))',
  },
};

/* ---------------- Página ---------------- */

const Apresentacao = () => {
  useEffect(() => {
    document.title = 'Conectae Imob — Apresentação Institucional';
    const meta = document.querySelector('meta[name="description"]');
    const content = 'Apresentação da Conectae Imob: o ecossistema completo (Brokerage-as-a-Service) para o corretor de imóveis.';
    if (meta) meta.setAttribute('content', content);
  }, []);

  return (
    <main className="min-h-screen">
      {/* 1 · Capa */}
      <section className="relative overflow-hidden bg-[hsl(var(--portal-navy-deep))] text-white px-6 py-28 md:py-40">
        <div className="absolute inset-0 bg-dots-pattern opacity-30" />
        <div className="absolute -top-32 -right-32 w-[420px] h-[420px] rounded-full bg-[hsl(var(--brand-green))] opacity-20 blur-3xl animate-pulse-glow" />
        <div className="absolute -bottom-40 -left-24 w-[380px] h-[380px] rounded-full bg-primary opacity-30 blur-3xl animate-float-slow" />
        <div className="relative max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl px-6 py-4 inline-flex shadow-lg">
            <BrandLogo size="lg" />
          </div>
          <h1 className="mt-10 text-4xl md:text-6xl font-bold leading-[1.1] tracking-tight">
            Conectae Imob
            <span className="block mt-3 text-2xl md:text-4xl font-light text-white/80">
              O Ecossistema Completo para o Corretor de Imóveis
            </span>
          </h1>
          <p className="mt-8 text-lg md:text-xl text-white/70 max-w-3xl leading-relaxed">
            Conectando o corretor aos principais players, ferramentas e soluções para acelerar vendas
            e impulsionar carreiras no mercado imobiliário.
          </p>
          <div className="mt-10 flex flex-wrap gap-3 text-sm">
            {['Brokerage-as-a-Service', 'Leads pré-qualificados', 'Rede de parcerias'].map((t) => (
              <span key={t} className="px-4 py-2 rounded-full border border-white/25 bg-white/10 backdrop-blur">
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 2 · Problema */}
      <Slide id="problema" tone="light">
        <SlideTitle kicker="02 · O Problema" title="A dor do mercado" subtitle="Um mercado com baixa barreira de entrada, suporte defasado e colaboração amadora." />
        <div className="grid md:grid-cols-2 gap-6">
          <Card icon={AlertTriangle} title="O risco do despreparo">
            A baixa barreira de entrada inunda o mercado de profissionais sem o devido preparo. O resultado são
            corretores que não performam e, pior, geram insegurança e riscos reais para o cliente comprador
            durante a transação.
          </Card>
          <Card icon={Building2} title="O suporte arcaico das imobiliárias">
            Boa parte das imobiliárias limitam-se a um back-office burocrático. Operam em um formato ultrapassado,
            que não dá o direcionamento necessário nem para a evolução do profissional, nem para o
            desenvolvimento da venda.
          </Card>
          <Card icon={Percent} title="Comissões esgotadas">
            Além de deixarem de 40% a 60% da comissão na imobiliária por um suporte limitado, a margem do corretor
            reduz drasticamente se a venda for feita em parceria — frustrando quem fecha o negócio e limitando a
            venda em parceria.
          </Card>
          <Card icon={Users} title="Falta de uma sistemática de parcerias">
            O mercado brasileiro não conta com uma estrutura organizada para vendas em parceria. Hoje a
            colaboração acontece de forma amadora, pulverizada em dezenas de grupos desordenados de WhatsApp.
          </Card>
        </div>

        {/* gráfico da comissão */}
        <div className="mt-12 rounded-xl border border-border bg-card p-6">
          <h3 className="font-semibold text-[hsl(var(--portal-navy))] mb-1">Quanto da comissão sobra para o corretor hoje</h3>
          <p className="text-sm text-muted-foreground mb-6">Retenção média das imobiliárias sobre a comissão da venda.</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Venda direta', Corretor: 50, Imobiliária: 50 },
                { name: 'Venda em parceria', Corretor: 25, Imobiliária: 75 },
                { name: 'Com a Conectae', Corretor: 100, Imobiliária: 0 },
              ]} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" unit="%" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip {...chartTooltip} formatter={(v: number) => `${v}%`} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Corretor" stackId="a" fill="hsl(var(--brand-green))" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Imobiliária" stackId="a" fill="hsl(var(--muted-foreground))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Slide>

      {/* 3 · Solução */}
      <Slide id="solucao" tone="soft">
        <SlideTitle kicker="03 · A Solução" title="Brokerage-as-a-Service" subtitle="Infraestrutura para o corretor autônomo — e também para as imobiliárias." />
        <div className="grid md:grid-cols-3 gap-6">
          <Card icon={Layers} title="O ecossistema Conectae">
            Uma nova possibilidade de infraestrutura (BaaS), utilizável tanto pelo corretor autônomo quanto pelas
            próprias imobiliárias. Nosso hub gera ferramentas práticas, integra players estratégicos e desenvolve
            o profissional.
          </Card>
          <Card icon={Target} title="Foco no desenvolvimento da venda">
            Entregamos em um só lugar tudo o que o corretor precisa para acessar demandas de forma organizada,
            conduzir o cliente com segurança e fechar a venda de maneira eficiente e autônoma.
          </Card>
          <Card icon={TrendingUp} title="Retorno justo (ROI)">
            Modelo de assinatura ou custo por operação onde a conta final fecha: o corretor maximiza o lucro,
            protege a comissão (mesmo em parceria) e ganha um suporte que realmente impulsiona a carreira.
          </Card>
        </div>
      </Slide>

      {/* 4 · Mercado */}
      <Slide id="mercado" tone="light">
        <SlideTitle kicker="04 · Tamanho do Mercado" title="TAM · SAM · SOM" subtitle="Fontes: Sistema COFECI-CRECI, FENACI, CRECI-SP/PR/SC/RS/MG e Secovi-SP." />
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div className="h-80 rounded-xl border border-border bg-card p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={marketData} margin={{ top: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip {...chartTooltip} formatter={(v: number) => v.toLocaleString('pt-BR')} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {marketData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                  <LabelList dataKey="label" position="top" style={{ fontSize: 12, fill: 'hsl(var(--foreground))' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-4">
            {[
              { t: 'TAM · Mercado Total — Brasil', v: 'Mais de 620.000 corretores ativos', f: 'COFECI-CRECI e FENACI' },
              { t: 'SAM · Endereçável — Sul e Sudeste', v: '≈ 400.000 a 430.000 corretores (65%–70% da base nacional)', f: 'Relatórios demográficos do COFECI e CRECI-SP, PR, SC, RS e MG' },
              { t: 'SOM · Conquistável — Ribeirão Preto e Região', v: '≈ 5.000 a 7.000 corretores ativos', f: 'Delegacia Regional do CRECI-SP em Ribeirão Preto e Secovi-SP' },
            ].map((m, i) => (
              <div key={m.t} className="rounded-xl border border-border bg-card p-5 border-l-4" style={{ borderLeftColor: PIE_COLORS[i] }}>
                <p className="text-sm font-semibold text-[hsl(var(--portal-navy))]">{m.t}</p>
                <p className="text-base font-medium mt-1">{m.v}</p>
                <p className="text-xs text-muted-foreground mt-2">Fontes: {m.f}</p>
              </div>
            ))}
          </div>
        </div>
      </Slide>

      {/* 5 · Plataforma */}
      <Slide id="plataforma" tone="dark">
        <SlideTitle invert kicker="05 · A Plataforma" title="Tudo em um só lugar" />
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { i: Sparkles, t: 'Leads pré-qualificados', d: 'Marketplace inteligente com preferências de compra e venda já mapeadas, otimizando tempo e assertividade.' },
            { i: Handshake, t: 'Estrutura de relacionamento', d: 'Metodologia estruturada para venda em parceria e acesso direto aos estoques das principais construtoras e incorporadoras.' },
            { i: Scale, t: 'Back-office jurídico', d: 'Emissão rápida de CNDs (imóvel e proprietário) e contratos padrão com assinatura digital, blindando a transação.' },
            { i: GraduationCap, t: 'Capacitação prática', d: 'Trilhas de educação e performance comercial focadas nas dores reais, com cursos de profissionais referência no mercado.' },
            { i: Wallet, t: 'Fintech integrada', d: 'Soluções financeiras customizadas voltadas ao corretor de imóveis.' },
            { i: Layers, t: 'Ecossistema de parceiros', d: 'Acesso direto a fornecedores de toda a cadeia construtiva.' },
          ].map(({ i: Icon, t, d }) => (
            <div key={t} className="rounded-xl border border-white/15 bg-white/5 p-6 backdrop-blur hover:bg-white/10 transition-colors">
              <div className="w-11 h-11 rounded-lg bg-[hsl(var(--brand-green))]/20 flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-[hsl(var(--brand-green))]" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{t}</h3>
              <p className="text-sm text-white/70 leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
      </Slide>

      {/* 6 · Receita */}
      <Slide id="receita" tone="light">
        <SlideTitle kicker="06 · Modelo de Receitas" title="Monetização múltipla" subtitle="Recorrência previsível somada a receitas transacionais e take rate." />
        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-semibold text-[hsl(var(--portal-navy))] mb-4">Recorrência — planos de assinatura</h3>
            <div className="grid grid-cols-2 gap-4">
              {['R$ 39,90', 'R$ 79,90'].map((p) => (
                <div key={p} className="rounded-lg bg-primary-light p-5 text-center">
                  <p className="text-2xl font-bold text-primary">{p}</p>
                  <p className="text-xs text-muted-foreground mt-1">por mês</p>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Valores acessíveis que garantem previsibilidade de caixa e funcionam como porta de entrada para novos corretores.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-semibold text-[hsl(var(--portal-navy))] mb-1">Transacional — leads</h3>
            <p className="text-sm text-muted-foreground mb-5">Precificação inteligente para incentivar a assinatura.</p>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'Lead premium', 'Não assinante': 28, Assinante: 14 },
                  { name: 'Lead padrão', 'Não assinante': 20, Assinante: 10 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `R$${v}`} />
                  <Tooltip {...chartTooltip} formatter={(v: number) => brl(v)} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Não assinante" fill="hsl(var(--muted-foreground))" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Assinante" fill="hsl(var(--brand-green))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {[
            { t: 'Transacional — CND', d: 'R$ 99,00 pelo pacote de emissão de CNDs de imóvel e proprietário.' },
            { t: 'Comissionamento & take rate', d: '10% sobre a compra de cursos na plataforma e percentual sobre operações de crédito liberado (antecipação de comissão e parcelamento de pró-soluto).' },
            { t: 'Serviços on-demand', d: 'R$ 99,00 pelo pacote de emissão de CNDs de imóvel e proprietário.' },
            { t: 'Mídia & B2B', d: 'Espaços publicitários e mensalidade para fornecedores homologados na plataforma, a partir de R$ 50,00/mês.' },
          ].map((r) => (
            <div key={r.t} className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-semibold text-[hsl(var(--portal-navy))] mb-2">{r.t}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{r.d}</p>
            </div>
          ))}
        </div>
      </Slide>

      {/* 7 · GTM */}
      <Slide id="gtm" tone="soft">
        <SlideTitle kicker="07 · Go-To-Market" title="Como vamos tracionar" />
        <div className="grid md:grid-cols-2 gap-6">
          <Card icon={Rocket} title="Aquisição descentralizada">
            Eliminação do CAC fixo. Operamos com um exército de recrutadores autônomos comissionados com 100% da
            primeira mensalidade + 5% de revenue share sobre o consumo na plataforma. Eles prospectam, embarcam e
            engajam os corretores.
          </Card>
          <Card icon={Sparkles} title="O gatilho da demanda inédita">
            Geração contínua de leads frescos disponibilizados simultaneamente na plataforma. Não vendemos
            software; vendemos acesso imediato a clientes reais.
          </Card>
          <Card icon={Users} title="Eventos locais de conversão">
            Rodadas de negócios presenciais e eventos estratégicos apoiados por parceiros institucionais de peso.
          </Card>
          <Card icon={Target} title="Tráfego pago B2C">
            Investimento cirúrgico em campanhas geolocalizadas (Google e Meta Ads) focadas no cliente final, para
            captar intenção real de compra e venda.
          </Card>
        </div>
      </Slide>

      {/* 8 · Diferencial */}
      <Slide id="diferencial" tone="light">
        <SlideTitle kicker="08 · Diferencial Competitivo" title="Por que a Conectae é diferente" />
        <div className="grid md:grid-cols-2 gap-6">
          <Card icon={Layers} title="Infraestrutura aberta ao ecossistema">
            Não somos uma imobiliária digital concorrente tentando prender profissionais. Somos a infraestrutura de
            tecnologia e serviços estratégicos (BaaS) que potencializa o autônomo e abre uso real para as próprias
            imobiliárias.
          </Card>
          <Card icon={Handshake} title="O verdadeiro efeito de rede">
            Somos o centro relacional do mercado. A Conectae centraliza o acesso a diversos players da cadeia
            imobiliária.
          </Card>
          <Card icon={CheckCircle2} title="A entrega da independência real">
            A verdadeira liberdade vem de poder fazer tudo em uma única plataforma, onde o corretor centraliza toda
            a sua jornada operacional.
          </Card>
          <Card icon={Sparkles} title="Demanda fresca e simultânea">
            Enquanto o mercado vende leads reciclados e desgastados, nossa arquitetura disponibiliza demandas
            inéditas pré-qualificadas para centenas de corretores simultaneamente.
          </Card>
          <div className="md:col-span-2">
            <Card icon={TrendingUp} title="Poder de escala">
              Quanto maior o número de corretores na plataforma, maior o nosso poder de negociação corporativa —
              entregando ao usuário um benefício financeiro coletivo que ele jamais conseguiria negociar sozinho.
            </Card>
          </div>
        </div>
      </Slide>

      {/* 9 · Concorrência */}
      <Slide id="concorrencia" tone="soft">
        <SlideTitle kicker="09 · Análise de Concorrência" title="Conectae x mercado" />
        <CompetitionTable />
      </Slide>

      {/* 10 · Equipe */}
      <Slide id="equipe" tone="light">
        <SlideTitle kicker="10 · A Equipe" title="Quem está construindo" />
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              name: 'Gustavo Rech Beltrami', role: 'CEO', photo: gustavoPhoto.url,
              items: [
                ['Formação', 'Graduado em Administração de Empresas e pós-graduado em Finanças, Controladoria e Auditoria.'],
                ['Gestão e escala', '8 anos nas indústrias metalúrgica e automotiva, escalando de trainee a Sócio-Diretor.'],
                ['DNA de mercado', 'Corretor, avaliador de imóveis, correspondente bancário e especialista em leilões. Full-time na linha de frente do mercado imobiliário.'],
              ],
            },
            {
              name: 'Chrestopher Marcelo', role: 'CTO', photo: chrestopherPhoto.url,
              items: [
                ['Formação', 'Especialista em automação, inteligência artificial e estruturação de operações digitais.'],
                ['Tecnologia & automação', 'Criação e implantação de agentes de IA, automações comerciais e integração de sistemas.'],
                ['DNA de mercado', 'Atuação direta na linha de frente de negócios digitais: IA, automação, sites e sistemas para empresas.'],
              ],
            },
            {
              name: 'Lucas Philip', role: 'Growth & Vendas', photo: lucasPhoto.url,
              items: [
                ['Formação', 'Especialista em growth marketing e inside sales B2B, com fechamento de contas de alta complexidade.'],
                ['Marketing e escala', '8 anos de mercado, com captação de leads e vendas consultivas B2C e B2B.'],
                ['DNA de mercado', 'Atuação em processos comerciais e captação de leads em grande escala.'],
              ],
            },
          ].map((p) => (
            <div key={p.name} className="rounded-xl border border-border bg-card p-6">
              <div className="mb-5 flex justify-center">
                <div className="relative">
                  <div className="absolute -inset-1 rounded-2xl bg-gradient-primary opacity-70 blur-[2px]" aria-hidden />
                  <div className="relative h-40 w-40 overflow-hidden rounded-2xl ring-2 ring-white shadow-xl">
                    <img
                      src={p.photo}
                      alt={`Retrato de ${p.name}, ${p.role} da Conectae`}
                      loading="lazy"
                      className="h-full w-full object-cover object-top"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[hsl(var(--portal-navy))]/45 via-transparent to-transparent" />
                  </div>
                </div>
              </div>
              <h3 className="font-bold text-lg text-[hsl(var(--portal-navy))] text-center">{p.name}</h3>
              <p className="text-sm text-primary font-medium mb-4 text-center">{p.role}</p>
              <ul className="space-y-3">
                {p.items.map(([k, v]) => (
                  <li key={k} className="text-sm">
                    <span className="font-semibold text-foreground">{k}: </span>
                    <span className="text-muted-foreground">{v}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}

        </div>
      </Slide>

      {/* 11 · The Ask */}
      <Slide id="pedido" tone="dark">
        <SlideTitle invert kicker="11 · O Pedido" title="Captação & milestones" />
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <div className="rounded-xl border border-white/15 bg-white/5 p-8">
              <p className="text-sm uppercase tracking-widest text-[hsl(var(--brand-green))] mb-2">Estamos buscando</p>
              <p className="text-4xl md:text-5xl font-bold">R$ 420.000</p>
              <p className="mt-2 text-white/70">por 7% de equity — valuation de R$ 6 milhões pós-money.</p>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/5 p-6">
              <h3 className="font-semibold mb-2">Milestones</h3>
              <p className="text-sm text-white/70 leading-relaxed">
                Com este capital garantimos runway seguro para atingir os primeiros 350 assinantes ativos em
                Ribeirão Preto, tracionar o volume de negócios na plataforma e alcançar o breakeven operacional
                nos próximos 12 meses.
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-white/15 bg-white/5 p-6">
            <h3 className="font-semibold mb-4">Uso dos recursos</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={useOfFunds} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={3}>
                    {useOfFunds.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} stroke="none" />)}
                  </Pie>
                  <Tooltip {...chartTooltip} formatter={(v: number) => `${v}%`} />
                  <Legend wrapperStyle={{ fontSize: 12, color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </Slide>

      {/* 12 · Escala e expansão */}
      <Slide id="expansao" tone="light">
        <SlideTitle
          kicker="Plano de escala"
          title="Expansão e recorrência"
          subtitle="Tornar a Conectae Imob a maior plataforma de relacionamento entre compradores e corretores do Brasil, alcançando 500 corretores assinantes ativos em cidades estratégicas."
        />
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="rounded-xl bg-gradient-primary p-6 text-primary-foreground">
            <p className="text-sm opacity-80">Meta de assinantes ativos</p>
            <p className="text-4xl font-bold mt-1">500</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <p className="text-sm text-muted-foreground">Recorrência aproximada</p>
            <p className="text-4xl font-bold mt-1 text-[hsl(var(--brand-green))]">R$ 19.500</p>
            <p className="text-xs text-muted-foreground mt-1">MRR em assinaturas</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <p className="text-sm text-muted-foreground">Nossa missão</p>
            <p className="text-sm mt-2 leading-relaxed">
              Capacitar corretores brasileiros com tecnologia, inteligência e geração de oportunidades para que
              vendam mais gastando menos e, acima de tudo, sejam independentes.
            </p>
          </div>
        </div>

        <h3 className="font-semibold text-xl text-[hsl(var(--portal-navy))] mb-6">Plano de expansão</h3>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { fase: 'Fase 1 · Consolidação', cidades: ['Ribeirão Preto — SP'] },
            { fase: 'Fase 2 · Regional', cidades: ['Campinas — SP', 'Sorocaba — SP', 'São Paulo — SP', 'Goiânia — GO', 'Rio de Janeiro — RJ', 'Nova Lima — MG'] },
            { fase: 'Fase 3 · Nacional', cidades: ['Expansão para novas praças estratégicas'] },
          ].map((f, i) => (
            <div key={f.fase} className="rounded-xl border border-border bg-card p-6 border-t-4" style={{ borderTopColor: PIE_COLORS[i] }}>
              <h4 className="font-semibold text-[hsl(var(--portal-navy))] mb-4">{f.fase}</h4>
              <ul className="space-y-2">
                {f.cidades.map((c) => (
                  <li key={c} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 text-primary shrink-0" /> {c}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Árvore de receita */}
        <h3 className="font-semibold text-xl text-[hsl(var(--portal-navy))] mt-14 mb-6">Estrutura de receita</h3>
        <div className="rounded-xl border border-border bg-card p-8">
          <div className="flex flex-col items-center">
            <div className="px-6 py-3 rounded-lg bg-gradient-primary text-primary-foreground font-semibold">Receita principal</div>
            <div className="w-px h-6 bg-border" />
            <div className="px-6 py-3 rounded-lg bg-primary-light text-primary font-semibold">Assinaturas recorrentes</div>
            <div className="w-px h-6 bg-border" />
            <div className="grid md:grid-cols-3 gap-4 w-full">
              {[
                { t: 'Marketplace', d: 'Leads' },
                { t: 'Créditos', d: 'I.A. e funcionalidades' },
                { t: 'Corporativo', d: 'Parcerias e publicidade dentro da plataforma' },
              ].map((n, i) => (
                <div key={n.t} className="rounded-lg border border-border p-5 text-center">
                  <p className="font-semibold text-[hsl(var(--portal-navy))]">{n.t}</p>
                  <p className="text-sm text-muted-foreground mt-1">{n.d}</p>
                  <div className="h-1 w-12 mx-auto mt-4 rounded-full" style={{ background: PIE_COLORS[i] }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </Slide>

      {/* 13 · Canais + investimento + cenários */}
      <Slide id="canais" tone="soft">
        <SlideTitle kicker="Tração" title="Canais, investimento e cenários" />
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-semibold text-[hsl(var(--portal-navy))] mb-5">Canais de aquisição</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={channelData} layout="vertical" margin={{ left: 20, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" unit="%" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip {...chartTooltip} formatter={(v: number) => `${v}%`} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {channelData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                    <LabelList dataKey="value" position="right" formatter={(v: number) => `${v}%`} style={{ fontSize: 11, fill: 'hsl(var(--foreground))' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-semibold text-[hsl(var(--portal-navy))] mb-1">Plano de investimento trimestral</h3>
            <p className="text-sm text-muted-foreground mb-4">Total: <span className="font-semibold text-foreground">R$ 28.000,00</span></p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={investmentData} margin={{ top: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} interval={0} angle={-15} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip {...chartTooltip} formatter={(v: number) => brl(v)} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]}>
                    <LabelList dataKey="value" position="top" formatter={(v: number) => brl(v)} style={{ fontSize: 10, fill: 'hsl(var(--foreground))' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Cenários */}
        <h3 className="font-semibold text-xl text-[hsl(var(--portal-navy))] mt-12 mb-6">Possíveis cenários do projeto</h3>
        <div className="grid md:grid-cols-3 gap-6">
          {scenarioData.map((s, i) => {
            const colors = ['hsl(var(--error))', 'hsl(var(--warning))', 'hsl(var(--brand-green))'];
            return (
              <div key={s.name} className="rounded-xl border border-border bg-card p-6 border-t-4" style={{ borderTopColor: colors[i] }}>
                <h4 className="font-bold text-lg text-[hsl(var(--portal-navy))]">{s.name}</h4>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between"><dt className="text-muted-foreground">CAC</dt><dd className="font-semibold">{brl(s.cac)}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">Assinantes</dt><dd className="font-semibold">{s.assinantes}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">MRR</dt><dd className="font-semibold">{brl(s.mrr)}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">Receita total projetada</dt><dd className="font-semibold" style={{ color: colors[i] }}>≈ {brl(s.total)}/mês</dd></div>
                </dl>
              </div>
            );
          })}
        </div>

        <div className="mt-8 h-72 rounded-xl border border-border bg-card p-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={scenarioData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip {...chartTooltip} formatter={(v: number) => brl(v)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar name="MRR (assinaturas)" dataKey="mrr" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              <Bar name="Receita total projetada" dataKey="total" fill="hsl(var(--brand-green))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <p className="mt-6 text-sm text-muted-foreground max-w-3xl">
          Este funil será validado nos próximos 3 meses — por isso tratamos o investimento em período trimestral.
          Os cenários levantados são uma base do retorno em potencial executando nos próximos 90 dias.
        </p>
      </Slide>

      {/* 14 · Contato */}
      <section className="bg-[hsl(var(--portal-navy-deep))] text-white px-6 py-24">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="bg-white rounded-2xl px-6 py-4 inline-flex shadow-lg mb-8">
              <BrandLogo size="md" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold">Vamos conversar</h2>
            <div className="mt-6 space-y-3 text-white/80">
              <a href="mailto:contato@conectaeimob.com.br" className="flex items-center gap-3 hover:text-white transition-colors">
                <Mail className="w-5 h-5 text-[hsl(var(--brand-green))]" /> contato@conectaeimob.com.br
              </a>
              <a href="https://wa.me/5516981334182" target="_blank" rel="noreferrer" className="flex items-center gap-3 hover:text-white transition-colors">
                <Phone className="w-5 h-5 text-[hsl(var(--brand-green))]" /> (16) 98133-4182
              </a>
            </div>
          </div>
          <div className="flex flex-col items-center md:items-end">
            <img
              src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=https://conectaeimob.com.br"
              alt="QR Code para acessar a plataforma Conectae Imob"
              className="w-44 h-44 rounded-xl bg-white p-3"
              loading="lazy"
            />
            <p className="mt-3 text-sm text-white/60">Acesse o protótipo: conectaeimob.com.br</p>
          </div>
        </div>
      </section>
    </main>
  );
};

/* ---------------- Tabela de concorrência ---------------- */

type Mark = 'yes' | 'no' | 'partial' | string;

const rows: { attr: string; values: Mark[] }[] = [
  { attr: 'Posicionamento', values: ['Infraestrutura (BaaS)', 'Imobiliária digital', 'Rede de parcerias', 'Vitrine B2B', 'Rede de parcerias'] },
  { attr: 'Geração de leads B2C', values: ['yes|Pré-qualificados', 'yes|Fechados/internos', 'no', 'no', 'no'] },
  { attr: 'Imóveis de construtoras', values: ['yes', 'partial|Foco no secundário', 'no|Foco no secundário', 'yes|Foco principal', 'yes'] },
  { attr: 'Venda em parceria', values: ['yes', 'no|Eles controlam', 'yes', 'no', 'no'] },
  { attr: 'Ferramentas p/ autônomo', values: ['yes|Hub completo', 'no|Corretor engessado', 'partial|Sem motor de leads', 'partial|Apenas vitrine', 'yes|Apenas gestão'] },
  { attr: 'Inteligência de crédito', values: ['yes|Direto na esteira', 'yes|Base própria', 'yes|Homer Financiamentos', 'no', 'yes|Direto na esteira'] },
  { attr: 'Educação do corretor', values: ['yes', 'no|Treina regras internas', 'partial|Comunidade', 'no', 'no'] },
  { attr: 'Modelo de aquisição (CAC)', values: ['Descentralizado (Hunters)', 'Centralizado (mídia de massa)', 'Comunidade / App', 'Mídia B2B', 'Inbound tradicional'] },
];

const companies = ['Conectae', 'QuintoAndar', 'Homer', 'Órulo', 'Fullimob'];

const CellValue = ({ raw }: { raw: string }) => {
  const [mark, note] = raw.split('|');
  if (mark === 'yes' || mark === 'no' || mark === 'partial') {
    const Icon = mark === 'yes' ? CheckCircle2 : mark === 'no' ? XCircle : MinusCircle;
    const color = mark === 'yes' ? 'text-[hsl(var(--brand-green))]' : mark === 'no' ? 'text-muted-foreground' : 'text-[hsl(var(--warning))]';
    return (
      <div className="flex flex-col items-center gap-1">
        <Icon className={`w-5 h-5 ${color}`} />
        {note && <span className="text-[11px] text-muted-foreground leading-tight">{note}</span>}
      </div>
    );
  }
  return <span className="text-xs text-foreground">{raw}</span>;
};

const CompetitionTable = () => (
  <div className="overflow-x-auto rounded-xl border border-border bg-card">
    <table className="w-full min-w-[760px] text-sm">
      <thead>
        <tr className="border-b border-border">
          <th className="text-left p-4 font-semibold text-[hsl(var(--portal-navy))]">Atributo estratégico</th>
          {companies.map((c, i) => (
            <th key={c} className={`p-4 font-semibold text-center ${i === 0 ? 'bg-primary-light text-primary' : 'text-muted-foreground'}`}>{c}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.attr} className="border-b border-border last:border-0">
            <td className="p-4 font-medium text-foreground">{r.attr}</td>
            {r.values.map((v, i) => (
              <td key={i} className={`p-4 text-center align-middle ${i === 0 ? 'bg-primary-light/40' : ''}`}>
                <CellValue raw={v} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default Apresentacao;
