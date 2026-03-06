import { useEffect } from "react";
import { CheckCircle } from "lucide-react";
import leadbayLogo from "@/assets/leadbay-logo.png";

export default function ThankYou() {
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
      fbq('track','Lead');
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center">
      <div className="flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in zoom-in duration-500 px-4">
        <img src={leadbayLogo} alt="LeadBay" className="h-12 sm:h-14 mb-2" />

        <div className="h-24 w-24 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <CheckCircle className="h-14 w-14 text-green-600 dark:text-green-400" />
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-foreground">
            Obrigado pelo seu interesse!
          </h1>
          <p className="text-lg text-muted-foreground max-w-md">
            Recebemos suas informações com sucesso. Em breve, um de nossos especialistas entrará em contato com você.
          </p>
        </div>
      </div>
    </div>
  );
}
