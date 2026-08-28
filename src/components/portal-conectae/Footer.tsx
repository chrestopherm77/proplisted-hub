import logoAsset from '@/assets/conectae-logo-branco.png.asset.json';

const logo = logoAsset.url;

export function Footer() {
  return (
    <footer className="bg-[var(--pc-bg)] text-[var(--pc-fg)] py-10 mt-12">
      <div className="container mx-auto px-4 grid md:grid-cols-3 gap-8 text-sm">
        <div>
          <img src={logo} alt="Conectaê Imob" className="h-12 w-auto mb-3" />
          <p className="text-white/70">
            O portal de imóveis da Conectaê Imob. Anúncios publicados por profissionais parceiros da plataforma.
          </p>
        </div>
        <div>
          <h4 className="font-semibold uppercase tracking-wider mb-2 text-[var(--pc-accent)]">Como funciona</h4>
          <p className="text-white/70">
            Encontre o imóvel que combina com você, clique em “Tenho interesse neste imóvel” e informe seu nome e WhatsApp.
            Um parceiro responsável pelo anúncio entra em contato.
          </p>
        </div>
        <div>
          <h4 className="font-semibold uppercase tracking-wider mb-2 text-[var(--pc-accent)]">É corretor?</h4>
          <p className="text-white/70">
            Anuncie seus imóveis gratuitamente e receba interessados direto no seu WhatsApp.
          </p>
          <a href="/cadastro" className="inline-block mt-3 px-4 py-2 bg-[var(--pc-accent)] text-black font-semibold rounded">
            Quero anunciar
          </a>
        </div>
      </div>
      <div className="container mx-auto px-4 mt-8 pt-4 border-t border-white/10 text-xs text-white/50">
        © {new Date().getFullYear()} Conectaê Imob. Todos os direitos reservados.
      </div>
    </footer>
  );
}
