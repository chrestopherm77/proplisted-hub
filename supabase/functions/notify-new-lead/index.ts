import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface NotifyNewLeadRequest {
  leadId: string;
  city: string;
  uf?: string;
  intention: string;
  description: string;
  formData: Record<string, any>;
}

// Map intention to Portuguese label
const intentionLabels: Record<string, string> = {
  SELL: "Vender",
  BUY: "Comprar",
  BUILD: "Construir",
  RENT: "Alugar",
};

// Format currency
const formatCurrency = (value: string | number | undefined): string => {
  if (!value) return "Não informado";
  const numValue = typeof value === "string" 
    ? parseFloat(value.replace(/[^\d,]/g, "").replace(",", "."))
    : value;
  if (isNaN(numValue)) return "Não informado";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numValue);
};

// Extract characteristics from form data
const extractCharacteristics = (formData: Record<string, any>): string[] => {
  const characteristics: string[] = [];
  const intention = formData.intention;
  const flowData = formData[intention?.toLowerCase()] || {};

  // Property type
  const propertyTypeLabels: Record<string, string> = {
    HOUSE: "Casa",
    APARTMENT: "Apartamento",
    KITNET: "Kitnet",
    COMMERCIAL: "Comercial",
    LAND: "Terreno",
    RURAL: "Rural",
    MIXED: "Misto",
  };
  if (flowData.propertyType) {
    characteristics.push(`Tipo: ${propertyTypeLabels[flowData.propertyType] || flowData.propertyType}`);
  }

  // Bedrooms
  if (flowData.bedrooms) {
    characteristics.push(`Quartos: ${flowData.bedrooms}`);
  }

  // Bathrooms
  if (flowData.bathrooms) {
    characteristics.push(`Banheiros: ${flowData.bathrooms}`);
  }

  // Size
  if (flowData.size) {
    characteristics.push(`Área: ${flowData.size} m²`);
  }

  // Value based on intention
  if (intention === "SELL" && flowData.expectedValue) {
    characteristics.push(`Valor pretendido: ${formatCurrency(flowData.expectedValue)}`);
  }
  if (intention === "BUY" && flowData.budgetMax) {
    characteristics.push(`Orçamento: até ${formatCurrency(flowData.budgetMax)}`);
  }
  if (intention === "BUILD" && flowData.budget) {
    characteristics.push(`Orçamento: ${formatCurrency(flowData.budget)}`);
  }
  if (intention === "RENT" && flowData.maxRent) {
    characteristics.push(`Aluguel máximo: ${formatCurrency(flowData.maxRent)}/mês`);
  }

  // Purpose
  const purposeLabels: Record<string, string> = {
    HOUSING: "Moradia",
    INVESTMENT: "Investimento",
    COMMERCIAL: "Comercial",
    TEMPORARY: "Temporada",
  };
  if (flowData.purpose) {
    characteristics.push(`Finalidade: ${purposeLabels[flowData.purpose] || flowData.purpose}`);
  }

  // Deadline
  if (flowData.deadline || flowData.moveInDeadline) {
    characteristics.push(`Prazo: ${flowData.deadline || flowData.moveInDeadline}`);
  }

  return characteristics;
};

// Generate email HTML
const generateEmailHTML = (
  city: string,
  uf: string,
  intention: string,
  characteristics: string[],
  leadId: string
): string => {
  const leadUrl = `https://proplisted-hub.lovable.app/leads?leadId=${leadId}`;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5; padding: 40px 20px; margin: 0;">
      <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        
        <!-- Logo -->
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #0d9488; font-size: 28px; font-weight: 700; margin: 0;">🏠 LeadBay</h1>
        </div>
        
        <!-- Title -->
        <h2 style="color: #18181b; font-size: 22px; font-weight: 600; text-align: center; margin-bottom: 8px;">
          Novo lead na sua região!
        </h2>
        
        <!-- Location Badge -->
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="display: inline-block; background-color: #f0fdfa; color: #0d9488; padding: 6px 16px; border-radius: 20px; font-size: 14px; font-weight: 500;">
            📍 ${city}${uf ? `/${uf}` : ""}
          </span>
        </div>
        
        <!-- Intention -->
        <div style="background-color: #f4f4f5; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <p style="color: #71717a; font-size: 14px; margin: 0 0 8px 0;">Interesse:</p>
          <p style="color: #18181b; font-size: 18px; font-weight: 600; margin: 0;">
            ${intentionLabels[intention] || intention}
          </p>
        </div>
        
        <!-- Characteristics -->
        ${characteristics.length > 0 ? `
        <div style="margin-bottom: 32px;">
          <p style="color: #71717a; font-size: 14px; margin: 0 0 12px 0;">Características:</p>
          <ul style="list-style: none; padding: 0; margin: 0;">
            ${characteristics.map(char => `
              <li style="color: #3f3f46; font-size: 15px; padding: 8px 0; border-bottom: 1px solid #e4e4e7;">
                ${char}
              </li>
            `).join("")}
          </ul>
        </div>
        ` : ""}
        
        <!-- CTA Button -->
        <div style="text-align: center; margin-top: 32px;">
          <a href="${leadUrl}" style="display: inline-block; background-color: #0d9488; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
            Ver Lead →
          </a>
        </div>
        
        <!-- Footer Note -->
        <p style="color: #a1a1aa; font-size: 12px; text-align: center; margin-top: 32px; line-height: 18px;">
          Você recebeu este e-mail porque está cadastrado na mesma cidade deste lead.<br>
          Para deixar de receber notificações, atualize suas preferências no LeadBay.
        </p>
        
      </div>
      
      <p style="color: #a1a1aa; font-size: 12px; text-align: center; margin-top: 24px;">
        © ${new Date().getFullYear()} LeadBay. Todos os direitos reservados.
      </p>
    </body>
    </html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { leadId, city, uf, intention, description, formData }: NotifyNewLeadRequest = await req.json();

    // Validate required fields
    if (!leadId || !city || !intention) {
      console.error("Missing required fields:", { leadId, city, intention });
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Processing notification for lead ${leadId} in ${city}/${uf}`);

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Normalize city for comparison (uppercase, trim)
    const normalizedCity = city.toUpperCase().trim();

    // Find all profiles in the same city
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, address_city, address_uf")
      .not("address_city", "is", null);

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch profiles" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Filter profiles by normalized city
    const matchingProfiles = (profiles || []).filter(
      (p) => p.address_city?.toUpperCase().trim() === normalizedCity
    );

    console.log(`Found ${matchingProfiles.length} profiles in ${city}`);

    if (matchingProfiles.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No users in this city", emailsSent: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get emails for matching profiles from auth.users
    const userIds = matchingProfiles.map((p) => p.id);
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error("Error fetching auth users:", authError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch user emails" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Filter to only users with matching IDs
    const targetUsers = authUsers.users.filter((u) => userIds.includes(u.id));
    const emails = targetUsers.map((u) => u.email).filter(Boolean) as string[];

    console.log(`Sending notifications to ${emails.length} users`);

    if (emails.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No valid emails found", emailsSent: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Extract characteristics from form data
    const characteristics = extractCharacteristics(formData);

    // Generate email HTML
    const emailHTML = generateEmailHTML(city, uf || "", intention, characteristics, leadId);

    // Send emails (in batches to avoid rate limits)
    let successCount = 0;
    let failCount = 0;

    for (const email of emails) {
      try {
        await resend.emails.send({
          from: "LeadBay <noreply@leadbay.com.br>",
          to: [email],
          subject: `🏠 Novo lead em ${city}! Confira agora`,
          html: emailHTML,
        });
        successCount++;
        console.log(`Email sent to ${email}`);
      } catch (emailError) {
        failCount++;
        console.error(`Failed to send email to ${email}:`, emailError);
      }
    }

    console.log(`Notification complete: ${successCount} sent, ${failCount} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Notifications sent`, 
        emailsSent: successCount,
        emailsFailed: failCount 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in notify-new-lead:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
