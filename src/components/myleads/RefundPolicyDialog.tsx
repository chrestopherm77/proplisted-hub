import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: () => void;
}

export function RefundPolicyDialog({ open, onOpenChange, onAccept }: Props) {
  const [accepted, setAccepted] = useState(false);
  const [scrolledToEnd, setScrolledToEnd] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setAccepted(false);
      setScrolledToEnd(false);
    }
  }, [open]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 40) {
      setScrolledToEnd(true);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Política de Estorno e Garantia de Leads – Conectae</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[60vh] pr-4">
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="text-sm space-y-4 leading-relaxed text-foreground/90"
          >
            <section>
              <h3 className="font-semibold text-base mb-1">1. Objetivo e Premissas</h3>
              <p>Esta política define as regras de devolução de créditos referentes à aquisição de leads na plataforma Conectae. Nosso compromisso é fornecer dados de contato íntegros e de clientes com intenção de compra latente.</p>
              <p>Por se tratar de leads frescos e disponibilizados em tempo real, a conversão e o engajamento dependem diretamente da velocidade e da qualidade da abordagem do corretor de imóveis. A Conectae oferece garantia contra contatos inválidos e contra a falta absoluta de resposta (ghosting), desde que o corretor cumpra rigorosamente os requisitos de atendimento estabelecidos nesta política.</p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-1">2. Condições ELEGÍVEIS para Estorno</h3>
              <p>O estorno de créditos será analisado e aprovado nas seguintes situações, mediante comprovação:</p>
              <p className="font-medium mt-2">A. Falhas Estruturais do Lead:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Contato Inexistente:</strong> Telefone não existe ou está permanentemente desativado.</li>
                <li><strong>Erro de Identidade:</strong> O titular do número desconhece o nome cadastrado e afirma não ter buscado imóveis.</li>
                <li><strong>Lead Duplicado:</strong> Aquisição do mesmo contato (CPF/Telefone) pelo mesmo corretor em um intervalo inferior a 30 dias.</li>
                <li><strong>Perfil Concorrente:</strong> O contato pertence a outro corretor de imóveis, imobiliária ou construtora (cliente oculto).</li>
                <li><strong>Incapacidade Civil:</strong> O titular é menor de 18 anos.</li>
              </ul>
              <p className="font-medium mt-2">B. Lead Sem Potencial Real de Compra (Exceção de Prazo Curto):</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Compra Já Realizada:</strong> O lead atende o primeiro contato e informa explicitamente que já adquiriu um imóvel, desde que essa resposta do lead ocorra e seja registrada (via print) em até 3 horas após o horário da aquisição do lead na plataforma. Respostas com esse teor após esse período serão consideradas recusa comercial comum e não são elegíveis a estorno.</li>
              </ul>
              <p className="font-medium mt-2">C. Falta Absoluta de Resposta (Ghosting):</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>O lead não visualiza ou não responde a nenhuma das tentativas de contato realizadas pelo corretor, mantendo silêncio absoluto desde o primeiro momento, desde que o corretor cumpra o Acordo de Nível de Serviço (SLA) detalhado no item 4.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-1">3. Condições NÃO ELEGÍVEIS para Estorno</h3>
              <p>Não haverá devolução de créditos sob nenhuma hipótese nas seguintes situações:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Quebra de Engajamento:</strong> O lead respondeu à primeira mensagem (mesmo que com um simples "olá" ou "estou ocupado") e parou de responder depois. A garantia de ghosting cobre apenas o silêncio absoluto.</li>
                <li><strong>Desistência ou Recusa Comercial:</strong> O lead atende, mas informa que "desistiu", "está apenas pesquisando", "achou caro", ou informa que "já comprou com outro corretor" após a janela de garantia de 3 horas.</li>
                <li><strong>Reprovação de Crédito:</strong> O cliente não possui capacidade de financiamento, entrada suficiente ou restrições no CPF.</li>
                <li><strong>Incompatibilidade de Produto:</strong> O corretor não possui em carteira o imóvel exato desejado pelo cliente.</li>
                <li><strong>Quebra de SLA de Atendimento:</strong> O corretor demorou além do tempo limite para iniciar a abordagem, permitindo que o lead esfriasse.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-1">4. Regras e Exigências para Estorno por Ghosting (SLA)</h3>
              <p>Para acionar a garantia por falta de resposta, o corretor deve comprovar que realizou um esforço ativo e imediato de prospecção. A solicitação só será aceita se cumprir todos os requisitos abaixo:</p>
              <ol className="list-decimal pl-5 space-y-1">
                <li><strong>SLA de Primeiro Contato (Tempo de Resposta):</strong> A primeira tentativa de contato (mensagem no WhatsApp) deve ter ocorrido em até 1 hora após a compra do lead na plataforma.</li>
                <li><strong>Régua de Contato (Cadência):</strong> O corretor deve comprovar um mínimo de 3 tentativas de contato via WhatsApp (em turnos/dias diferentes) e 1 tentativa de ligação telefônica.</li>
                <li><strong>Prazo de Carência:</strong> A solicitação de estorno por ghosting só pode ser aberta após 48 horas da compra do lead, para garantir que o cliente teve tempo hábil de ver as mensagens.</li>
              </ol>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-1">5. Procedimento de Solicitação (Análise Manual)</h3>
              <p>O processo de solicitação e análise de estornos seguirá o fluxo abaixo:</p>
              <ol className="list-decimal pl-5 space-y-1">
                <li><strong>Abertura do Chamado:</strong> O corretor deverá acionar o Suporte da Conectae via WhatsApp dentro do card do lead no CRM, através do botão "Não consegui contato com o lead", que fica no final.</li>
                <li><strong>Envio de Provas (Ônus do Corretor):</strong> É obrigatório anexar as evidências em formato de captura de tela (print). Para ghosting, os prints devem mostrar claramente a data e a hora da primeira mensagem enviada (comprovando o SLA) e o histórico de chamadas do celular comprovando a tentativa de ligação frustrada.</li>
                <li><strong>Auditoria Manual:</strong> A equipe de qualidade da Conectae analisará as provas e emitirá um parecer em até 3 dias úteis.</li>
              </ol>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-1">6. Cláusula de Prevenção à Fraude e Má-Fé</h3>
              <p>A equipe de auditoria da Conectae reserva-se o direito de realizar contatos por amostragem com os leads reportados como "inviáveis" ou "sem resposta".</p>
              <p>Caso o setor de qualidade consiga contato com o lead e seja constatado que houve manipulação de informações, omissão de respostas ou que o corretor já está em negociação com o cliente por vias externas, a conta do profissional sofrerá bloqueio imediato de 7 dias. Em caso de reincidência, o corretor será banido definitivamente da plataforma, sem direito a reembolso de créditos remanescentes.</p>
            </section>
          </div>
        </ScrollArea>

        <div className="flex items-start gap-2 pt-2 border-t">
          <Checkbox
            id="accept-refund-policy"
            checked={accepted}
            disabled={!scrolledToEnd}
            onCheckedChange={(v) => setAccepted(v === true)}
            className="mt-1"
          />
          <label htmlFor="accept-refund-policy" className="text-sm leading-snug cursor-pointer">
            Li e aceito integralmente os termos da Política de Estorno e Garantia de Leads.
            {!scrolledToEnd && (
              <span className="block text-xs text-muted-foreground mt-1">
                Role o texto até o final para habilitar o aceite.
              </span>
            )}
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            disabled={!accepted}
            onClick={onAccept}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Aceitar e abrir WhatsApp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
