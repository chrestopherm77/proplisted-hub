import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";

const REDIRECT_SECONDS = 5;

export default function CadastroRealizado() {
  const navigate = useNavigate();
  const [seconds, setSeconds] = useState(REDIRECT_SECONDS);

  // Meta Pixel
  useEffect(() => {
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(script);

    const inline = document.createElement("script");
    inline.textContent = `
      !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){
      n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[]}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
      fbq('init','1603394050952329');
      fbq('track','PageView');
      if (!sessionStorage.getItem('lead_fired')) {
        fbq('track','Lead', {}, { eventID: crypto.randomUUID() });
        sessionStorage.setItem('lead_fired','true');
      }
    `;
    document.head.appendChild(inline);

    const noscript = document.createElement("noscript");
    const img = document.createElement("img");
    img.height = 1;
    img.width = 1;
    img.style.display = "none";
    img.src = "https://www.facebook.com/tr?id=1603394050952329&ev=PageView&noscript=1";
    noscript.appendChild(img);
    document.body.appendChild(noscript);

    return () => {
      script.remove();
      inline.remove();
      noscript.remove();
      delete (window as any).fbq;
      delete (window as any)._fbq;
    };
  }, []);

  // Contador regressivo
  useEffect(() => {
    if (seconds <= 0) {
      navigate("/primeiros-passos", { replace: true });
      return;
    }
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds, navigate]);

  const goNow = () => navigate("/primeiros-passos", { replace: true });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center px-4">
      <div className="flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in zoom-in duration-500 max-w-md">
        <BrandLogo size="lg" className="mb-2" />

        <div className="h-24 w-24 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <CheckCircle className="h-14 w-14 text-green-600 dark:text-green-400" />
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-foreground">
            Cadastro realizado com sucesso!
          </h1>
          <p className="text-lg text-muted-foreground">
            Bem-vindo(a) ao Conectae Imob. Vamos te mostrar como aproveitar a plataforma ao máximo.
          </p>
        </div>

        <Button size="lg" className="w-full sm:w-auto" onClick={goNow}>
          Conhecer plataforma
        </Button>

        <p className="text-sm text-muted-foreground">
          Redirecionando em {seconds} segundo{seconds === 1 ? "" : "s"}...
        </p>
      </div>
    </div>
  );
}
