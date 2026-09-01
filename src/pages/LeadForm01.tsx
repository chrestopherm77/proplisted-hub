import { useEffect } from "react";
import { LeadFormWizard } from "@/components/leadform/LeadFormWizard";
import { CheckCircle2, Zap, Gift, ArrowDown } from "lucide-react";
import conectaeLogo from "@/assets/conectae-logo.png";

const HERO_BG = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80";

export default function LeadForm01() {
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
      fbq('init','1267609825231112');
      fbq('track','PageView');
    `;
    document.head.appendChild(inline);

    return () => {
      document.head.removeChild(script);
      document.head.removeChild(inline);
      delete (window as any).fbq;
      delete (window as any)._fbq;
    };
  }, []);

  const scrollToForm = () =>
    document.getElementById("formulario")?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="site-v2 min-h-screen bg-background">
      {/* ===== Hero ===== */}
      <section
        className="relative overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--v2-navy) / 0.85), hsl(var(--v2-blue) / 0.80)), url(${HERO_BG})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="relative mx-auto max-w-4xl px-5 pt-14 pb-16 md:pt-20 md:pb-24 text-center">
          <img
            src={conectaeLogo}
            alt="Conectaê Imob"
            className="h-14 md:h-20 w-auto mx-auto mb-8 brightness-0 invert"
          />

          <span className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--v2-mint)/0.4)] bg-[hsl(var(--v2-mint)/0.14)] px-4 py-1.5 text-[11px] md:text-xs font-bold uppercase tracking-wide text-[hsl(var(--v2-mint))]">
            <span className="h-1.5 w-5 rounded-full bg-[hsl(var(--v2-mint))]" />
            Ribeirão Preto e Região
          </span>

          <h1 className="mt-6 text-[30px] leading-[1.12] md:text-5xl font-extrabold text-white">
            Encontre o imóvel ideal em{" "}
            <span className="text-[hsl(var(--v2-mint))]">Ribeirão Preto</span> com quem realmente
            conhece a sua região
          </h1>

          <p className="mt-5 max-w-2xl mx-auto text-base md:text-lg text-white/85 leading-relaxed">
            A Conectaê conecta você a corretores parceiros de Ribeirão Preto e região —
            profissionais verificados, que conhecem cada bairro e vão te ajudar a encontrar o
            imóvel certo. Rápido, direto e sem custo pra você.
          </p>

          <div className="mt-8 flex justify-center">
            <button
              onClick={scrollToForm}
              className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-4 text-[15px] font-bold text-[hsl(var(--v2-blue))] shadow-xl hover:brightness-95 transition"
            >
              Quero encontrar meu imóvel
              <ArrowDown className="h-4 w-4" />
            </button>
          </div>

          {/* Bloco de confiança */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-x-10 gap-y-3 text-sm text-white/90">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[hsl(var(--v2-mint))]" />
              Corretores verificados, com CRECI ativo
            </span>
            <span className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-[hsl(var(--v2-mint))]" />
              Atendimento rápido, direto com quem conhece a região
            </span>
            <span className="flex items-center gap-2">
              <Gift className="h-4 w-4 text-[hsl(var(--v2-mint))]" />
              100% gratuito pra quem está buscando imóvel
            </span>
          </div>
        </div>
      </section>

      {/* ===== Formulário ===== */}
      <section id="formulario" className="bg-gradient-to-b from-muted/40 to-background py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight">
              Preencha e um corretor da sua região entra em contato
            </h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              Leva menos de 1 minuto. Assim que você enviar, um corretor parceiro especialista na
              sua região vai te chamar.
            </p>
          </div>

          <LeadFormWizard contactAtEnd thankYouPath="/lp-obrigado-01" sourceLp="/lp-01" />
        </div>
      </section>
    </div>
  );
}
