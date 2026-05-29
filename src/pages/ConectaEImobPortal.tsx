import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { getCoverPhoto, PropertyPhoto } from '@/lib/propertyUtils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Search, CheckSquare, MessageSquare, Calculator, Shield, Target,
  Home, Key, ArrowRight, MapPin,
} from 'lucide-react';
import heroStudio from '@/assets/hero-studio.webp';
import heroMansao from '@/assets/hero-mansao.avif';
import heroCasaPiscina from '@/assets/hero-casa-piscina.jpg';

interface HeroProperty {
  id: string;
  title: string | null;
  price: number | null;
  city: string | null;
  state: string | null;
  neighborhood: string | null;
  cover: string | null;
}

interface NewsItem {
  id: string;
  title: string | null;
  image_url: string | null;
  created_at: string | null;
  category: string;
}

// Studio fica por último para aparecer na frente do stack (z-index maior)
const PLACEHOLDER_PROPS: HeroProperty[] = [
  { id: 'p1', title: 'Mansão à beira-mar — Costa Rica', price: 4500000, city: 'Florianópolis', state: 'SC', neighborhood: 'Jurerê Internacional', cover: heroMansao },
  { id: 'p2', title: 'Casa com piscina — Granja Viana', price: 1890000, city: 'São Paulo', state: 'SP', neighborhood: 'Granja Viana', cover: heroCasaPiscina },
  { id: 'p3', title: 'Studio moderno — Pinheiros', price: 420000, city: 'São Paulo', state: 'SP', neighborhood: 'Pinheiros', cover: heroStudio },
];

const formatBRL = (n: number | null) => {
  if (n == null) return '—';
  return `R$ ${n.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;
};

const ConectaEImobPortal = () => {
  const [props, setProps] = useState<HeroProperty[]>(PLACEHOLDER_PROPS);
  const [news, setNews] = useState<NewsItem[]>([]);

  useEffect(() => {
    // Hero usa imagens fixas (PLACEHOLDER_PROPS) — não sobrescreve com dados ao vivo


    (async () => {
      const { data } = await supabase
        .from('news_posts')
        .select('id, title, image_url, created_at')
        .eq('is_active', true)
        .not('image_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(4);
      if (data) {
        const cats = ['MERCADO', 'FINANCIAMENTO', 'LOCALIZAÇÃO', 'DICAS'];
        setNews(data.map((n: any, i: number) => ({ ...n, category: cats[i % cats.length] })));
      }
    })();
  }, []);

  useEffect(() => {
    document.title = 'Conectae Imob — Conectamos quem compra e vende com corretores';
  }, []);

  return (
    <div translate="no" className="min-h-screen bg-white text-foreground">


      <PortalHeader />
      <Hero properties={props} />
      <Stats />
      <WhyUs />
      <FindBanner />
      <BrokerSection />
      <BlogSection news={news} />
      <FinancingSection />
      <PartnerBanner />
      <PortalFooter />
    </div>
  );
};

/* ============================ HEADER ============================ */
const PortalHeader = () => (
  <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-border">
    <div className="container mx-auto flex items-center justify-between py-4 gap-6">
      <Link to="/" aria-label="Conectae Imob" className="flex items-center">
        <BrandLogo size="md" />
      </Link>
      <div className="flex items-center gap-6 ml-auto">
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[hsl(var(--portal-navy))]">
          <a href="#home" className="hover:opacity-70">Home</a>
          <Link to="/corretor" className="hover:opacity-70">Sou Corretor</Link>
          <a href="#sobre" className="hover:opacity-70">Sobre</a>
          <Link to="/conectaeimob/noticias" className="hover:opacity-70">Blog</Link>
          <a href="#ajuda" className="hover:opacity-70">Ajuda</a>
        </nav>
        <Link
          to="/lp-01"
          data-cta="anunciar-gratis"
          className="rounded-full bg-[hsl(var(--portal-cta-red))] hover:bg-[hsl(var(--portal-cta-red-hover))] text-white px-5 py-2.5 text-sm font-semibold transition"
        >
          Anunciar Grátis
        </Link>
      </div>
    </div>
  </header>
);

/* ============================ HERO ============================ */
const Hero = ({ properties }: { properties: HeroProperty[] }) => (
  <section
    id="home"
    className="relative overflow-hidden bg-[hsl(var(--portal-soft))] text-[hsl(var(--portal-navy))]"
    style={{
      backgroundImage: `url("/images/world-map-bg.svg")`,
      backgroundSize: 'cover',
      backgroundBlendMode: 'soft-light',
    }}
  >
    <div className="container mx-auto py-20 lg:py-28 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative">
      <div>
        <span className="inline-flex items-center gap-2 rounded-full bg-white border border-[hsl(var(--portal-navy))]/15 px-4 py-1.5 text-xs font-semibold tracking-wide uppercase text-[hsl(var(--portal-navy))]">
          <Home className="h-3.5 w-3.5 text-[hsl(var(--portal-gold))]" />
          Plataforma #1 em Conexão Imobiliária
        </span>
        <h1 className="mt-6 font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05]">
          Conectamos pessoas que buscam{' '}
          <span className="text-[hsl(var(--portal-gold))]">comprar ou vender</span>{' '}
          com corretores de imóveis
        </h1>
        <p className="mt-6 text-lg text-[hsl(var(--portal-navy))]/80 max-w-xl leading-relaxed">
          Encontre o imóvel ideal ou o corretor perfeito para você.
          <br />
          Simples, rápido e seguro — do sonho à chave na mão.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            to="/portal-imoveis"
            data-cta="hero-buscar"
            className="rounded-full bg-[hsl(var(--portal-cta-red))] hover:bg-[hsl(var(--portal-cta-red-hover))] text-white px-7 py-3.5 font-semibold transition"
          >
            Buscar Imóveis
          </Link>
          <Link
            to="/corretor"
            data-cta="hero-corretor"
            className="rounded-full border border-[hsl(var(--portal-navy))]/40 hover:bg-white text-[hsl(var(--portal-navy))] px-7 py-3.5 font-semibold transition inline-flex items-center gap-2"
          >
            Sou Corretor <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Stack de cards */}
      <div className="relative h-[420px] hidden lg:block">
        {properties.slice(0, 3).map((p, i) => {
          const offsets = [
            { x: -40, y: 0, r: -8, z: 1 },
            { x: 20, y: 30, r: 4, z: 2 },
            { x: 80, y: 80, r: -2, z: 3 },
          ][i];
          return (
            <div
              key={p.id}
              className="absolute w-72 rounded-2xl overflow-hidden shadow-2xl border border-[hsl(var(--portal-navy))]/10 bg-white"
              style={{
                transform: `translate(${offsets.x}px, ${offsets.y}px) rotate(${offsets.r}deg)`,
                zIndex: offsets.z,
              }}
            >
              <div className="h-44 bg-[hsl(var(--portal-soft-deep))] flex items-center justify-center">
                {p.cover ? (
                  <img src={p.cover} alt={p.title || 'Imóvel'} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <Home className="h-16 w-16 text-[hsl(var(--portal-navy))]/30" />
                )}
              </div>
              <div className="p-4">
                <p className="text-sm font-semibold text-[hsl(var(--portal-navy))] truncate">{p.title || 'Imóvel'}</p>
                <p className="text-[hsl(var(--portal-gold))] font-bold text-lg mt-1">{formatBRL(p.price)}</p>
                <p className="text-xs text-[hsl(var(--portal-navy))]/70 mt-1 inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {p.neighborhood || p.city}{p.state ? `, ${p.state}` : ''}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </section>
);

/* ============================ STATS ============================ */
const Stats = () => (
  <section className="bg-[hsl(var(--portal-soft-deep))] border-t border-[hsl(var(--portal-navy))]/10">
    <div className="container mx-auto py-10 grid grid-cols-3 gap-6 text-[hsl(var(--portal-navy))]">
      {[
        { v: '45k', l: 'Imóveis anunciados' },
        { v: '12k', l: 'Corretores ativos' },
        { v: '98%', l: 'Clientes satisfeitos' },
      ].map((s) => (
        <div key={s.l}>
          <p className="font-display text-4xl md:text-5xl font-bold text-[hsl(var(--portal-gold))]">{s.v}</p>
          <p className="text-sm text-[hsl(var(--portal-navy))]/70 mt-1">{s.l}</p>
        </div>
      ))}
    </div>
  </section>
);


/* ============================ WHY US ============================ */
const WhyUs = () => {
  const items = [
    { icon: Search, title: 'Busca inteligente e rápida', desc: 'Filtre por bairro, preço, metragem e tipo de imóvel. Encontre exatamente o que procura em segundos.' },
    { icon: CheckSquare, title: 'Corretores verificados', desc: 'Todos os corretores da plataforma são verificados com CRECI ativo. Você negocia com profissionais de confiança.' },
    { icon: MessageSquare, title: 'Contato direto e sem intermediários', desc: 'Fale diretamente com o corretor via chat, WhatsApp ou telefone. Sem burocracia e sem intermediários.' },
    { icon: Calculator, title: 'Simulação de financiamento na hora', desc: 'Simule diferentes cenários de financiamento antes mesmo de visitar o imóvel. Saiba exatamente o que cabe no seu bolso.' },
    { icon: Shield, title: 'Segurança em cada etapa', desc: 'Da visita à assinatura do contrato, nossa plataforma garante transparência e proteção para o comprador.' },
    { icon: Target, title: 'Match com o corretor ideal', desc: 'Nossa tecnologia conecta você ao corretor especialista no tipo de imóvel e região que você procura.' },
  ];
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-xs font-bold tracking-widest text-[hsl(var(--portal-cta-red))] uppercase">Para você, cliente</p>
          <h2 className="mt-3 font-display text-4xl md:text-5xl font-bold text-[hsl(var(--portal-navy))]">
            Por que usar a Conectae Imob?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Comprar ou vender um imóvel nunca foi tão fácil. Veja tudo que preparamos pra você.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
          {items.map((it) => {
            const Icon = it.icon;
            return (
              <div
                key={it.title}
                className="rounded-xl bg-white border border-border shadow-sm hover:shadow-md transition overflow-hidden flex flex-col"
              >
                <div className="h-1.5 bg-gradient-to-r from-[hsl(var(--portal-cta-red))] via-[hsl(var(--portal-gold))] to-[hsl(var(--portal-cta-red))]" />
                <div className="p-5 flex flex-col gap-3">
                  <div className="h-10 w-10 rounded-md bg-[hsl(var(--portal-navy))] text-white flex items-center justify-center">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-sm text-[hsl(var(--portal-navy))] leading-snug">{it.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{it.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

/* ============================ FIND BANNER ============================ */
const FindBanner = () => (
  <section className="container mx-auto py-6">
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[hsl(var(--portal-cta-red))] to-[hsl(var(--portal-cta-red-hover))] text-white p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
      <div>
        <h3 className="font-display text-2xl md:text-3xl font-bold">Encontre o imóvel dos seus sonhos hoje mesmo</h3>
        <p className="text-white/90 text-sm mt-2">Mais de 48 mil imóveis esperando por você. Busca gratuita, sem cadastro obrigatório.</p>
      </div>
      <Link
        to="/portal-imoveis"
        data-cta="banner-buscar"
        className="shrink-0 rounded-full bg-white text-[hsl(var(--portal-cta-red))] hover:bg-white/90 px-6 py-3 font-semibold inline-flex items-center gap-2 transition"
      >
        Buscar agora <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  </section>
);

/* ============================ BROKER SECTION ============================ */
const BrokerSection = () => {
  const items = [
    { n: '01', title: 'Leads qualificados direto para você', desc: 'Receba contatos de clientes que já estão prontos para comprar ou vender. Sem filtros desnecessários.' },
    { n: '02', title: 'Perfil profissional completo', desc: 'Mostre seu portfólio, avaliações, especialidades e área de atuação para clientes que buscam exatamente o seu perfil.' },
    { n: '03', title: 'CRM e gestão de imóveis integrados', desc: 'Gerencie seus anúncios, conversas e pipeline de vendas em um único painel. Menos plataformas, mais foco.' },
    { n: '04', title: 'Plano gratuito para começar', desc: 'Cadastre-se sem custo e veja como a plataforma pode transformar seus resultados antes de investir.' },
  ];
  return (
    <section id="corretor" className="bg-[hsl(var(--portal-soft))] text-[hsl(var(--portal-navy))] py-24">
      <div className="container mx-auto">
        <p className="text-xs font-bold tracking-widest text-[hsl(var(--portal-gold))] uppercase">Para corretores</p>
        <h2 className="mt-3 font-display text-4xl md:text-5xl font-bold">Sua carteira de clientes começa aqui</h2>
        <p className="mt-4 text-[hsl(var(--portal-navy))]/70 max-w-xl">
          Conecte-se com compradores qualificados e aumente suas vendas com tecnologia.
        </p>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-5">
          {items.map((it) => (
            <div key={it.n} className="rounded-xl bg-white border border-[hsl(var(--portal-navy))]/10 shadow-sm p-6 flex gap-5">
              <span className="font-display text-3xl font-bold text-[hsl(var(--portal-gold))] shrink-0">{it.n}</span>
              <div>
                <h3 className="font-semibold text-[hsl(var(--portal-navy))]">{it.title}</h3>
                <p className="text-sm text-[hsl(var(--portal-navy))]/70 mt-1.5 leading-relaxed">{it.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <Link
          to="/cadastro"
          data-cta="cadastrar-corretor"
          className="mt-10 inline-block rounded-full bg-[hsl(var(--portal-cta-red))] hover:bg-[hsl(var(--portal-cta-red-hover))] text-white px-7 py-3.5 font-semibold transition"
        >
          Cadastrar como corretor
        </Link>
      </div>
    </section>
  );
};

/* ============================ BLOG ============================ */
const BlogSection = ({ news }: { news: NewsItem[] }) => {
  const fallback: NewsItem[] = [
    { id: '1', title: 'Mercado imobiliário bate recorde de vendas no 1º trimestre de 2025', image_url: null, created_at: '2025-05-15', category: 'MERCADO' },
    { id: '2', title: 'Caixa reduz taxa do FGTS: veja quem pode se beneficiar agora', image_url: null, created_at: '2025-05-10', category: 'FINANCIAMENTO' },
    { id: '3', title: 'Os 10 bairros que mais valorizaram em São Paulo nos últimos 12 meses', image_url: null, created_at: '2025-05-05', category: 'LOCALIZAÇÃO' },
    { id: '4', title: 'Checklist completo: o que verificar antes de assinar um contrato de compra', image_url: null, created_at: '2025-04-28', category: 'DICAS' },
  ];
  const items = news.length ? news : fallback;
  const tones = [
    'from-[hsl(216_60%_25%)] to-[hsl(216_60%_18%)]',
    'from-[hsl(200_60%_30%)] to-[hsl(200_60%_22%)]',
    'from-[hsl(15_60%_45%)] to-[hsl(15_60%_38%)]',
    'from-[hsl(160_50%_30%)] to-[hsl(160_50%_22%)]',
  ];
  return (
    <section id="blog" className="py-24 bg-white">
      <div className="container mx-auto">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs font-bold tracking-widest text-[hsl(var(--portal-cta-red))] uppercase">Blog & Notícias</p>
            <h2 className="mt-3 font-display text-4xl md:text-5xl font-bold text-[hsl(var(--portal-navy))]">
              Fique por dentro do mercado
            </h2>
          </div>
          <Link
            to="/conectaeimob/noticias"
            data-cta="blog-ver-todas"
            className="rounded-full border border-[hsl(var(--portal-navy))] text-[hsl(var(--portal-navy))] hover:bg-[hsl(var(--portal-navy))] hover:text-white px-5 py-2.5 text-sm font-semibold inline-flex items-center gap-2 transition"
          >
            Ver todas <ArrowRight className="h-4 w-4" />
          </Link>
        </div>


        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {items.map((n, i) => (
            <article key={n.id} className="rounded-xl overflow-hidden border border-border bg-white shadow-sm hover:shadow-md transition">
              <div className={`h-48 bg-gradient-to-br ${tones[i % tones.length]} flex items-center justify-center`}>
                {n.image_url ? (
                  <img src={n.image_url} alt={n.title || 'Notícia'} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <Home className="h-12 w-12 text-white/30" />
                )}
              </div>
              <div className="p-5">
                <p className="text-[10px] font-bold tracking-widest text-[hsl(var(--portal-cta-red))] uppercase">{n.category}</p>
                <h3 className="mt-2 font-semibold text-sm text-[hsl(var(--portal-navy))] leading-snug line-clamp-3">
                  {n.title}
                </h3>
                <p className="mt-3 text-xs text-muted-foreground">
                  {n.created_at ? format(new Date(n.created_at), "d 'de' MMM yyyy", { locale: ptBR }) : ''}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ============================ FINANCING ============================ */
const FinancingSection = () => {
  const chips = ['Caixa Econômica', 'FGTS', 'MCMV', 'SBPE', 'Resultado imediato'];
  const [form, setForm] = useState({
    name: '',
    whatsapp: '',
    property_value: '',
    down_payment: '20',
    term: '30 anos',
    monthly_income: '',
    modality: 'FGTS / Minha Casa Minha Vida',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const formatPhoneMask = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 11);
    if (d.length <= 2) return d;
    if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.name.trim();
    const phoneDigits = form.whatsapp.replace(/\D/g, '');
    if (!name || phoneDigits.length < 10) {
      alert('Por favor, informe seu nome e WhatsApp.');
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('financing_leads').insert({
      name,
      whatsapp: phoneDigits,
      property_value: form.property_value || null,
      down_payment: form.down_payment || null,
      term: form.term || null,
      monthly_income: form.monthly_income || null,
      modality: form.modality || null,
      source: 'conectaeimob-portal',
    });
    setSubmitting(false);
    if (error) {
      alert('Não foi possível enviar agora. Tente novamente.');
      return;
    }
    setSubmitted(true);
  };

  return (
    <section className="py-20 bg-[hsl(210_17%_97%)]">
      <div className="container mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <p className="text-xs font-bold tracking-widest text-[hsl(var(--portal-cta-red))] uppercase">Financiamento</p>
          <h2 className="mt-3 font-display text-3xl md:text-4xl font-bold text-[hsl(var(--portal-navy))]">
            Simule seu financiamento e fale com um especialista
          </h2>
          <p className="mt-4 text-muted-foreground max-w-lg">
            Deixe seu nome e WhatsApp que entramos em contato com as melhores condições para você — FGTS, Minha Casa Minha Vida, SBPE e outros programas.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {chips.map((c) => (
              <span key={c} className="text-xs font-medium px-3 py-1.5 rounded-full border border-[hsl(var(--portal-navy))]/20 text-[hsl(var(--portal-navy))]">
                {c}
              </span>
            ))}
          </div>
        </div>

        {submitted ? (
          <div className="bg-white rounded-2xl shadow-lg border border-border p-8 text-center">
            <div className="mx-auto h-14 w-14 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckSquare className="h-7 w-7 text-green-600" />
            </div>
            <h3 className="font-display text-xl font-bold text-[hsl(var(--portal-navy))]">Pedido recebido!</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Em breve nosso especialista entrará em contato pelo WhatsApp informado.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            data-cta="financing-form"
            className="bg-white rounded-2xl shadow-lg border border-border p-7 space-y-4"
          >
            <h3 className="font-display text-xl font-bold text-[hsl(var(--portal-navy))]">Simulação rápida</h3>
            <Field label="Nome completo *">
              <input
                className="input"
                placeholder="Seu nome"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </Field>
            <Field label="WhatsApp *">
              <input
                className="input"
                placeholder="(00) 00000-0000"
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: formatPhoneMask(e.target.value) })}
                required
              />
            </Field>
            <Field label="Valor do imóvel">
              <input
                className="input"
                placeholder="R$ 0,00"
                value={form.property_value}
                onChange={(e) => setForm({ ...form, property_value: e.target.value })}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Entrada (%)">
                <input
                  className="input"
                  value={form.down_payment}
                  onChange={(e) => setForm({ ...form, down_payment: e.target.value })}
                />
              </Field>
              <Field label="Prazo (anos)">
                <select
                  className="input"
                  value={form.term}
                  onChange={(e) => setForm({ ...form, term: e.target.value })}
                >
                  <option>20 anos</option><option>25 anos</option><option>30 anos</option><option>35 anos</option>
                </select>
              </Field>
            </div>
            <Field label="Renda mensal familiar">
              <input
                className="input"
                placeholder="R$ 0,00"
                value={form.monthly_income}
                onChange={(e) => setForm({ ...form, monthly_income: e.target.value })}
              />
            </Field>
            <Field label="Modalidade">
              <select
                className="input"
                value={form.modality}
                onChange={(e) => setForm({ ...form, modality: e.target.value })}
              >
                <option>FGTS / Minha Casa Minha Vida</option>
                <option>SBPE</option>
                <option>Caixa Econômica</option>
              </select>
            </Field>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-[hsl(var(--portal-navy))] hover:bg-[hsl(var(--portal-navy-deep))] text-white py-3.5 font-semibold transition inline-flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {submitting ? 'Enviando...' : <>Quero ser contatado <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>
        )}
      </div>
    </section>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block">
    <span className="text-xs font-medium text-[hsl(var(--portal-navy))]">{label}</span>
    <div className="mt-1.5">{children}</div>
  </label>
);

/* ============================ PARTNER BANNER ============================ */
const PartnerBanner = () => (
  <section className="container mx-auto py-12">
    <div className="relative overflow-hidden rounded-2xl bg-[hsl(var(--portal-navy))] text-white p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="relative z-10">
        <h3 className="font-display text-2xl md:text-3xl font-bold">Seja um corretor parceiro Conectae Imob</h3>
        <p className="text-white/80 text-sm mt-2">
          Junte-se a mais de 12 mil corretores que já estão gerando negócios pela plataforma. Cadastro gratuito e sem burocracia.
        </p>
      </div>
      <Link
        to="/cadastro"
        data-cta="banner-parceiro"
        className="shrink-0 rounded-full bg-[hsl(var(--portal-cta-red))] hover:bg-[hsl(var(--portal-cta-red-hover))] text-white px-6 py-3 font-semibold inline-flex items-center gap-2 transition relative z-10"
      >
        Quero ser parceiro <ArrowRight className="h-4 w-4" />
      </Link>
      <Key className="absolute right-44 top-1/2 -translate-y-1/2 h-28 w-28 text-white/10 hidden md:block" strokeWidth={1.2} />
    </div>
  </section>
);

/* ============================ FOOTER ============================ */
const PortalFooter = () => (
  <footer className="bg-[hsl(var(--portal-navy-deep))] text-white/80 mt-8">
    <div className="container mx-auto py-14 grid grid-cols-2 md:grid-cols-4 gap-8">
      <div>
        <p className="font-display text-xl font-bold text-white">Conectae Imob</p>
        <p className="text-xs text-white/60 mt-3 leading-relaxed">
          A plataforma #1 em conexão imobiliária do Brasil. Compre, venda e alugue com segurança.
        </p>
      </div>
      <FooterCol title="Plataforma" links={['Buscar Imóveis', 'Sou Corretor', 'Anunciar Grátis', 'Planos']} />
      <FooterCol title="Institucional" links={['Sobre', 'Blog', 'Ajuda', 'Contato']} />
      <FooterCol title="Legal" links={['Termos de Uso', 'Política de Privacidade', 'LGPD']} />
    </div>
    <div className="border-t border-white/10">
      <div className="container mx-auto py-5 text-xs text-white/50 flex flex-wrap justify-between gap-2">
        <span>© {new Date().getFullYear()} Conectae Imob. Todos os direitos reservados.</span>
        <span>Feito com 💙 para o mercado imobiliário</span>
      </div>
    </div>
  </footer>
);

const FooterCol = ({ title, links }: { title: string; links: string[] }) => (
  <div>
    <p className="font-semibold text-white text-sm">{title}</p>
    <ul className="mt-3 space-y-2 text-xs">
      {links.map((l) => (
        <li key={l}><a href="#" className="hover:text-white">{l}</a></li>
      ))}
    </ul>
  </div>
);

export default ConectaEImobPortal;
