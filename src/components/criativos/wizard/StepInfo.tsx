import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface Props {
  info: string;
  setInfo: (v: string) => void;
}

export function StepInfo({ info, setInfo }: Props) {
  return (
    <div className="space-y-3 max-w-2xl">
      <h3 className="text-lg font-semibold">Informações do imóvel</h3>
      <p className="text-sm text-muted-foreground">
        Descreva o imóvel: nome, localização, características, preço, contato e o que mais quiser destacar.
      </p>
      <div className="space-y-2">
        <Label htmlFor="info">Detalhes</Label>
        <Textarea
          id="info"
          value={info}
          onChange={(e) => setInfo(e.target.value)}
          rows={10}
          placeholder="Ex: Casa de alto padrão na Praia de Iracema, 4 suítes, vista mar, 350m², piscina, R$ 2.500.000. Contato: (85) 99999-9999"
        />
      </div>
    </div>
  );
}
