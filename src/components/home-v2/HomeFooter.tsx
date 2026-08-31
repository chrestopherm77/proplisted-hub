import { Link } from 'react-router-dom';
import logoAsset from '@/assets/conectae-logo-branco.png.asset.json';

const logo = logoAsset.url;

export function HomeFooter() {
  return (
    <footer className="bg-foreground text-background py-12">
      <div className="container mx-auto px-4 grid md:grid-cols-4 gap-8">
        <div className="md:col-span-2">
          <img src={logo} alt="Conectaê Imob" className="h-10 w-auto" />
          <p className="text-sm opacity-70 mt-4 max-w-sm">
            A plataforma que conecta quem procura imóvel com corretores parceiros em todo o Brasil.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-sm uppercase tracking-wider">Navegue</h4>
          <ul className="space-y-2 text-sm opacity-80">
            <li><button onClick={() => document.getElementById('imoveis')?.scrollIntoView({ behavior: 'smooth' })} className="hover:opacity-100">Imóveis</button></li>
            <li><Link to="/conectaeimob/noticias" className="hover:opacity-100">Giro do Mercado</Link></li>
            <li><Link to="/corretor" className="hover:opacity-100">Para corretores</Link></li>
            <li><Link to="/planos" className="hover:opacity-100">Planos</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-sm uppercase tracking-wider">Conta</h4>
          <ul className="space-y-2 text-sm opacity-80">
            <li><Link to="/auth" className="hover:opacity-100">Entrar</Link></li>
            <li><Link to="/cadastro" className="hover:opacity-100">Criar conta</Link></li>
          </ul>
        </div>
      </div>
      <div className="container mx-auto px-4 mt-10 pt-6 border-t border-background/15 text-xs opacity-60">
        © {new Date().getFullYear()} Conectaê Imob. Todos os direitos reservados.
      </div>
    </footer>
  );
}
