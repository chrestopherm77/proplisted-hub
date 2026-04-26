import { useEffect } from "react";
import { LeadFormWizard } from "@/components/leadform/LeadFormWizard";
import { BrandLogo } from "@/components/BrandLogo";

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="text-center mb-8 sm:mb-12 flex flex-col items-center">
          <BrandLogo size="lg" className="mb-2" />
          <p className="text-muted-foreground">
            Encontre o imóvel ideal para você
          </p>
        </div>

        <LeadFormWizard contactAtEnd thankYouPath="/lp-obrigado-01" sourceLp="/lp-01" />
      </div>
    </div>
  );
}
