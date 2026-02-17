import { LeadFormWizard } from "@/components/leadform/LeadFormWizard";
import leadbayLogo from "@/assets/leadbay-logo.png";

export default function LeadForm() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="container mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12 flex flex-col items-center">
          <img src={leadbayLogo} alt="LeadBay" className="h-12 sm:h-14 mb-2" />
          <p className="text-muted-foreground">
            Encontre o imóvel ideal para você
          </p>
        </div>

        {/* Form Wizard */}
        <LeadFormWizard />
      </div>
    </div>
  );
}
