import { useEffect } from "react";
import { LeadFormWizard } from "@/components/leadform/LeadFormWizard";
import { BrandLogo } from "@/components/BrandLogo";

export default function LeadForm() {
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
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '27910388055250579');
      fbq('track', 'PageView');
    `;
    document.head.appendChild(inline);

    const noscript = document.createElement("noscript");
    const img = document.createElement("img");
    img.height = 1;
    img.width = 1;
    img.style.display = "none";
    img.src = "https://www.facebook.com/tr?id=27910388055250579&ev=PageView&noscript=1";
    noscript.appendChild(img);
    document.body.appendChild(noscript);

    return () => {
      document.head.removeChild(script);
      document.head.removeChild(inline);
      document.body.removeChild(noscript);
      delete (window as any).fbq;
      delete (window as any)._fbq;
    };
  }, []);
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="container mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12 flex flex-col items-center">
          <BrandLogo size="lg" className="mb-2" />
          <p className="text-muted-foreground">
            Encontre o imóvel ideal para você
          </p>
        </div>

        {/* Form Wizard */}
        <LeadFormWizard sourceLp="/lp" />
      </div>
    </div>
  );
}
