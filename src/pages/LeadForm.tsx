import { LeadFormWizard } from "@/components/leadform/LeadFormWizard";

export default function LeadForm() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="container mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-2">
            LeadBay
          </h1>
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
