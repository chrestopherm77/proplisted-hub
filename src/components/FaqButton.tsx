import { useMemo, useState } from 'react';
import { HelpCircle, Search, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FaqItem { q: string; a: string; }
interface FaqCategory { title: string; items: FaqItem[]; }

const FAQ: FaqCategory[] = [
  {
    title: 'Conta e cadastro',
    items: [
      { q: 'Como criar minha conta?', a: 'Clique em "Entrar" no topo da página e depois em "Criar conta". Preencha seus dados, confirme o email e pronto: você já pode acessar a plataforma.' },
      { q: 'Posso ter mais de uma conta com o mesmo telefone?', a: 'Por segurança, permitimos no máximo 2 contas por número de telefone. Tentativas adicionais serão bloqueadas automaticamente.' },
      { q: 'Como verificar meu CRECI/CAU/CREA?', a: 'Após o cadastro, vá em "Meu Perfil" e informe o número e UF do seu registro profissional. Anexe o comprovante quando solicitado para liberar funcionalidades de corretor/arquiteto/engenheiro.' },
      { q: 'Esqueci minha senha, como redefinir?', a: 'Na tela de login, clique em "Esqueci minha senha". Enviaremos um link por email para você criar uma nova senha em segurança.' },
      { q: 'Como atualizar meus dados de perfil?', a: 'Acesse "Meu Perfil" pelo menu do avatar. Você pode atualizar nome, telefone, foto, especialidades e regiões de atuação a qualquer momento.' },
    ],
  },
  {
    title: 'Leads e marketplace',
    items: [
      { q: 'O que é o Marketplace de Leads?', a: 'É o espaço onde você encontra leads qualificados disponíveis para compra, com filtros por cidade, tipo de imóvel, faixa de preço e intenção (compra, locação ou construção).' },
      { q: 'Como compro um lead?', a: 'Abra o lead desejado em "Leads Disponíveis", revise as informações públicas e clique em "Comprar". O lead vai direto para sua área de "Meus Leads".' },
      { q: 'Quantos parceiros podem comprar o mesmo lead?', a: 'Cada lead pode ser adquirido por até 5 parceiros. Após esse limite o lead aparece como "esgotado" e não pode mais ser comprado.' },
      { q: 'Por que alguns dados do lead ficam ocultos antes da compra?', a: 'Para proteger o cliente final, ocultamos nome completo, telefone e email até a confirmação da compra. Após a compra, todos os dados ficam disponíveis imediatamente.' },
      { q: 'Como funciona o reembolso/contestação de leads?', a: 'Se o lead estiver com dados inválidos ou duplicado, você pode abrir uma contestação em até 72 horas pela tela do lead. Nossa equipe analisa e, se procedente, devolve o crédito.' },
      { q: 'O que significa "lead esgotado"?', a: 'Quer dizer que o lead já atingiu o número máximo de compradores (5) ou foi removido pelo administrador. Ele permanece visível apenas para histórico.' },
    ],
  },
  {
    title: 'Pagamentos e créditos',
    items: [
      { q: 'Quais formas de pagamento são aceitas?', a: 'Aceitamos Pix, cartão de crédito e boleto bancário através do nosso provedor de pagamentos. Compras via Pix e cartão são liberadas em segundos.' },
      { q: 'Como funcionam os créditos da plataforma?', a: 'Você pode comprar pacotes de crédito antecipados e usar para adquirir leads sem precisar pagar a cada compra. O saldo fica visível no topo da página.' },
      { q: 'Onde vejo minhas faturas e recibos?', a: 'Acesse "Meu Perfil" → "Histórico financeiro" para baixar faturas, ver compras e acompanhar o saldo de créditos.' },
    ],
  },
  {
    title: 'Lançamentos e parcerias',
    items: [
      { q: 'Como cadastro um lançamento?', a: 'Construtoras autorizadas acessam "Lançamentos" → "Novo lançamento", preenchem dados do empreendimento, anexam material e publicam para a rede de parceiros.' },
      { q: 'Como funciona o "Balcão de Parcerias"?', a: 'É o canal onde corretores divulgam parcerias e construtoras anunciam vagas em lançamentos. Notificamos automaticamente os parceiros compatíveis quando há um match.' },
      { q: 'Posso indicar parceiros para um lançamento?', a: 'Sim. Dentro do lançamento, use o botão "Indicar parceiro" para enviar convite por email ou WhatsApp para corretores da sua rede.' },
    ],
  },
  {
    title: 'Portal do corretor (White Label)',
    items: [
      { q: 'O que é o Portal do Corretor?', a: 'É um site personalizado, com seu domínio e identidade visual, para você apresentar imóveis aos seus clientes — totalmente integrado ao seu cadastro na Conectae.' },
      { q: 'Posso usar meus imóveis no portal?', a: 'Sim. Todos os imóveis cadastrados na sua conta aparecem automaticamente no seu portal, com fotos, descrição e formulário de contato direto.' },
      { q: 'Posso anunciar imóveis de outros corretores?', a: 'Sim, desde que haja parceria registrada na plataforma. Imóveis de parceiros podem ser exibidos no seu portal com a devida divisão de comissão configurada.' },
    ],
  },
  {
    title: 'Integrações',
    items: [
      { q: 'Como funcionam as notificações por email?', a: 'Enviamos emails transacionais para confirmação de cadastro, compras, novos leads compatíveis e atualizações importantes. Você pode ajustar preferências em "Meu Perfil".' },
      { q: 'Posso integrar com meu CRM?', a: 'Sim. Oferecemos webhooks para enviar leads comprados automaticamente ao seu CRM. Configure em "Meu Perfil" → "Integrações".' },
    ],
  },
  {
    title: 'Suporte e segurança',
    items: [
      { q: 'Como falo com o suporte?', a: 'Use o botão de chat no canto inferior direito ou envie email para suporte@conectaeimob.com.br. Atendemos em horário comercial, de segunda a sexta.' },
      { q: 'Meus dados estão seguros?', a: 'Sim. Utilizamos criptografia em trânsito e em repouso, autenticação segura e seguimos a LGPD. Apenas você acessa seus dados pessoais e financeiros.' },
      { q: 'Como excluir minha conta?', a: 'Solicite a exclusão pelo suporte. Após confirmação, removemos seus dados pessoais conforme a LGPD, mantendo apenas registros fiscais obrigatórios por lei.' },
    ],
  },
];

const norm = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export function FaqButton() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = norm(query.trim());
    if (!q) return FAQ;
    return FAQ
      .map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (it) => norm(it.q).includes(q) || norm(it.a).includes(q),
        ),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [query]);

  const totalResults = filtered.reduce((acc, c) => acc + c.items.length, 0);

  const openSupport = () => {
    setOpen(false);
    window.dispatchEvent(new CustomEvent('open-support-chat'));
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full h-9 w-9"
          aria-label="Perguntas frequentes"
          title="Perguntas frequentes"
        >
          <HelpCircle className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[480px] p-0 flex flex-col"
        translate="no"
      >
        <SheetHeader className="px-5 py-4 border-b">
          <SheetTitle>Central de Ajuda</SheetTitle>
          <SheetDescription>
            Respostas rápidas para as principais dúvidas sobre a plataforma.
          </SheetDescription>
          <div className="relative pt-2">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 mt-1 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar pergunta..."
              className="pl-8"
            />
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="px-5 py-4 space-y-6">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground">
                Nenhuma pergunta encontrada para "{query}".
              </div>
            ) : (
              filtered.map((cat) => (
                <div key={cat.title} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">{cat.title}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {cat.items.length} {cat.items.length === 1 ? 'pergunta' : 'perguntas'}
                    </span>
                  </div>
                  <Accordion type="single" collapsible className="w-full">
                    {cat.items.map((it, idx) => (
                      <AccordionItem key={idx} value={`${cat.title}-${idx}`}>
                        <AccordionTrigger className="text-left text-sm font-medium">
                          {it.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                          {it.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              ))
            )}
            {query && filtered.length > 0 && (
              <div className="text-xs text-muted-foreground text-center pt-2">
                {totalResults} resultado(s) para "{query}"
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="border-t px-5 py-3 bg-muted/30">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={openSupport}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Falar com o suporte
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default FaqButton;
