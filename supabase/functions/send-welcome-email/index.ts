import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const ALLOWED_ORIGINS = [
  'https://conectaeimob.com.br',
  'https://www.conectaeimob.com.br',
  'https://proplisted-hub.lovable.app',
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

function buildHtml(name: string): string {
  const firstName = (name || '').trim().split(/\s+/)[0] || 'Corretor';
  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8" /><title>Bem-vindo à Conectae Imob</title></head>
<body style="margin:0;padding:0;background:#f5f6f8;font-family:Arial,sans-serif;color:#1f2937;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f6f8;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.04);">
        <tr><td style="background:linear-gradient(135deg,#dc2626,#b91c1c);padding:28px 32px;color:#fff;">
          <h1 style="margin:0;font-size:22px;line-height:1.3;">Bem-vindo à Conectae Imob! Seu hub completo está pronto 🚀</h1>
        </td></tr>
        <tr><td style="padding:28px 32px;">
          <p style="font-size:16px;margin:0 0 16px;">Olá, <strong>${firstName}</strong>!</p>
          <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">Seu cadastro foi confirmado com sucesso e sua conta já está ativa! 🎉</p>

          <h2 style="font-size:16px;color:#b91c1c;margin:24px 0 12px;">O QUE VOCÊ TEM ACESSO AGORA:</h2>

          ${[
            ['Leads Pré-Qualificados','Receba clientes com orçamento, prazo e intenção de compra mapeados. Chega de perder tempo com leads frios!'],
            ['CRM Inteligente','Gerencie todos os seus atendimentos em um funil Kanban visual. Adicione notas e fale com o lead direto pelo WhatsApp em 1 clique.'],
            ['Gerador de Criativos com IA','Crie posts profissionais para suas redes sociais em segundos. Nossa inteligência artificial faz o trabalho pesado por você.'],
            ['Financiamento Descomplicado','Simule crédito imobiliário integrado com a Beltrami Capital. Suporte via WhatsApp para aprovação rápida do seu cliente.'],
            ['Balcão de Parcerias','Tem o cliente mas falta o imóvel? Publique o interesse e receba ofertas de corretores parceiros na região.'],
            ['Portal White-Label','Compartilhe imóveis de parceiros com a identidade visual da SUA empresa. O cliente volta pra você!'],
            ['Calculadora de Emolumentos','Calcule custos de cartório e registro na hora. Passe profissionalismo e segurança ao seu cliente.'],
            ['Acesso a Lançamentos','Books, tabelas e contatos diretos de coordenadores de vendas das principais construtoras em um só lugar.'],
            ['Giro do Mercado','Notícias curadas do setor imobiliário para você se manter atualizado e argumentar melhor com clientes.'],
          ].map(([t,d]) => `<div style="margin:0 0 14px;"><p style="margin:0;font-weight:bold;font-size:14px;color:#111827;">${t}</p><p style="margin:4px 0 0;font-size:14px;color:#4b5563;line-height:1.5;">${d}</p></div>`).join('')}

          <div style="background:#fef2f2;border-left:4px solid #dc2626;padding:16px 18px;border-radius:6px;margin:24px 0;">
            <p style="margin:0 0 8px;font-weight:bold;color:#b91c1c;">🎁 SEU BÔNUS DE BOAS-VINDAS:</p>
            <p style="margin:0 0 6px;font-size:14px;">Como você faz parte dos primeiros corretores cadastrados, você ganhou:</p>
            <p style="margin:4px 0;font-size:14px;">✅ <strong>10 créditos GRÁTIS</strong></p>
            <p style="margin:4px 0;font-size:14px;">✅ <strong>Conta no plano free</strong> para testar a plataforma</p>
          </div>

          <h2 style="font-size:16px;color:#b91c1c;margin:24px 0 12px;">PRIMEIROS PASSOS:</h2>
          <ol style="padding-left:20px;margin:0 0 20px;font-size:14px;line-height:1.6;color:#374151;">
            <li>Acesse a plataforma: <a href="https://conectaeimob.com.br" style="color:#dc2626;">conectaeimob.com.br</a></li>
            <li>Complete seu perfil (cidade de atuação, especialidade, etc)</li>
            <li>Explore o CRM e veja como é fácil organizar seus atendimentos</li>
            <li>Veja os leads qualificados na sua região em "Leads Disponíveis"</li>
          </ol>

          <div style="text-align:center;margin:28px 0;">
            <a href="https://conectaeimob.com.br" style="background:#dc2626;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:bold;display:inline-block;">Acessar a plataforma</a>
          </div>

          <div style="background:#f9fafb;padding:16px 18px;border-radius:6px;margin:20px 0;">
            <p style="margin:0 0 8px;font-weight:bold;">💬 PRECISA DE AJUDA?</p>
            <p style="margin:4px 0;font-size:14px;">📱 WhatsApp: <a href="https://wa.me/5516996256685" style="color:#dc2626;">16 99625-6685</a></p>
            <p style="margin:4px 0;font-size:14px;">📧 Email: <a href="mailto:suporte@conectaeimob.com.br" style="color:#dc2626;">suporte@conectaeimob.com.br</a></p>
            <p style="margin:4px 0;font-size:14px;">🕐 Horário: Segunda a sexta, 9h às 18h</p>
          </div>

          <p style="font-size:14px;line-height:1.6;margin:20px 0 6px;">Bem-vindo ao futuro da corretagem de imóveis! 🏠</p>
          <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">Vamos juntos transformar leads em comissões! 💰</p>
          <p style="font-size:14px;margin:0;">Abraço,<br/><strong>Equipe Conectae Imob</strong></p>
        </td></tr>
        <tr><td style="background:#f9fafb;padding:16px 32px;text-align:center;color:#9ca3af;font-size:12px;">
          © Conectae Imob — Todos os direitos reservados
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { email, name } = await req.json();
    if (!email || typeof email !== 'string') {
      return new Response(JSON.stringify({ error: "Email é obrigatório" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { data, error } = await resend.emails.send({
      from: "Conectae <noreply@conectaeimob.com.br>",
      to: [email],
      subject: "Bem-vindo à Conectae Imob! Seu hub completo está pronto",
      html: buildHtml(name || ''),
    });

    if (error) {
      console.error("Resend error:", error);
      return new Response(JSON.stringify({ error: error.message || "Falha ao enviar email" }), {
        status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ success: true, id: data?.id }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err: any) {
    console.error("send-welcome-email error:", err);
    return new Response(JSON.stringify({ error: err?.message || "Erro interno" }), {
      status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
