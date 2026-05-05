import { BrokerPortal } from '@/hooks/useBrokerPortal';

interface Props {
  portal: BrokerPortal;
  properties: any[];
}

export default function Template1({ portal, properties }: Props) {
  const b = portal.branding ?? {};
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {b.logo_url && <img src={b.logo_url} alt="logo" className="h-10" />}
          <span className="font-bold">{portal.seo?.title ?? 'Portal de Imóveis'}</span>
        </div>
        <nav className="text-sm text-muted-foreground">Template 1 — placeholder</nav>
      </header>
      <main className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Imóveis</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {properties.map((p) => (
            <div key={p.id} className="border rounded-lg p-4">
              <div className="font-semibold">{p.title || p.reference_code}</div>
              <div className="text-sm text-muted-foreground">{p.city} - {p.state}</div>
              <div className="mt-2 font-bold">
                R$ {Number(p.price_sale ?? p.price_rent ?? 0).toLocaleString('pt-BR')}
              </div>
            </div>
          ))}
          {properties.length === 0 && <p className="text-muted-foreground">Nenhum imóvel disponível.</p>}
        </div>
      </main>
      <footer className="border-t p-6 mt-8 text-center text-sm text-muted-foreground">
        {b.about ?? ''} · {b.phone ?? ''} · {b.email ?? ''}
      </footer>
    </div>
  );
}
