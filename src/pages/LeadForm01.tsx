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
    <div className="min-h-screen bg-background">
      {/* ===== Hero ===== */}
      <section
        className="relative overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--v2-navy, 222 60% 14%) / 0.85), hsl(var(--v2-blue, 221 70% 35%) / 0.80)), url(${HERO_BG})`,
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

          <span className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--v2-mint,160```

I should not guess the v2 tokens; better to check the token names. Actually simpler: use arbitrary colors from the design guide? Let me check index.css v2 tokens quickly. Actually the earlier rg showed `--v2-mint`, `--v2-blue`, `--v2-navy`, `--v2-on-dark` exist. I'll write the full file with those.

Let me write the complete file properly.