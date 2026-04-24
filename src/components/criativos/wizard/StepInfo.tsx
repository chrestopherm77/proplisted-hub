import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { formatCurrencyInput } from '@/lib/propertyUtils';

export interface PropertyInfo {
  title: string;
  city: string;
  bedrooms: string;
  bathrooms: string;
  parking: string;
  price: string;
  size: string;
  extra: string;
}

export const emptyPropertyInfo = (): PropertyInfo => ({
  title: '',
  city: '',
  bedrooms: '',
  bathrooms: '',
  parking: '',
  price: '',
  size: '',
  extra: '',
});

export function formatPropertyInfo(info: PropertyInfo): string {
  const lines: string[] = [];
  if (info.title.trim()) lines.push(`Título: ${info.title.trim()}`);
  if (info.city.trim()) lines.push(`Cidade: ${info.city.trim()}`);
  if (info.bedrooms.trim()) lines.push(`Quartos: ${info.bedrooms.trim()}`);
  if (info.bathrooms.trim()) lines.push(`Banheiros: ${info.bathrooms.trim()}`);
  if (info.parking.trim()) lines.push(`Garagem: ${info.parking.trim()}`);
  if (info.price.trim()) lines.push(`Valor: ${info.price.trim()}`);
  if (info.size.trim()) lines.push(`Tamanho: ${info.size.trim()} m²`);
  if (info.extra.trim()) {
    if (lines.length) lines.push('');
    lines.push('Informações adicionais:');
    lines.push(info.extra.trim());
  }
  return lines.join('\n');
}

export function hasAnyInfo(info: PropertyInfo): boolean {
  return Object.values(info).some((v) => v.trim().length > 0);
}

interface Props {
  info: PropertyInfo;
  setInfo: (v: PropertyInfo) => void;
}

export function StepInfo({ info, setInfo }: Props) {
  const update = (field: keyof PropertyInfo, value: string) => setInfo({ ...info, [field]: value });

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h3 className="text-lg font-semibold">Informações do imóvel</h3>
        <p className="text-sm text-muted-foreground">
          Todos os campos são opcionais. Preencha o que quiser destacar — quanto mais detalhes, melhor o criativo.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="title">Título do imóvel</Label>
          <Input
            id="title"
            value={info.title}
            onChange={(e) => update('title', e.target.value)}
            placeholder="Ex: Casa de alto padrão na Praia de Iracema"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">Cidade</Label>
          <Input
            id="city"
            value={info.city}
            onChange={(e) => update('city', e.target.value)}
            placeholder="Ex: Fortaleza - CE"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Valor</Label>
          <Input
            id="price"
            value={info.price}
            onChange={(e) => update('price', formatCurrencyInput(e.target.value))}
            placeholder="R$ 0,00"
            inputMode="numeric"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bedrooms">Quartos</Label>
          <Input
            id="bedrooms"
            value={info.bedrooms}
            onChange={(e) => update('bedrooms', e.target.value.replace(/\D/g, ''))}
            placeholder="Ex: 4"
            inputMode="numeric"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bathrooms">Banheiros</Label>
          <Input
            id="bathrooms"
            value={info.bathrooms}
            onChange={(e) => update('bathrooms', e.target.value.replace(/\D/g, ''))}
            placeholder="Ex: 3"
            inputMode="numeric"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="parking">Garagem (vagas)</Label>
          <Input
            id="parking"
            value={info.parking}
            onChange={(e) => update('parking', e.target.value.replace(/\D/g, ''))}
            placeholder="Ex: 2"
            inputMode="numeric"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="size">Tamanho (m²)</Label>
          <Input
            id="size"
            value={info.size}
            onChange={(e) => update('size', e.target.value.replace(/[^\d.,]/g, ''))}
            placeholder="Ex: 350"
            inputMode="decimal"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="extra">Informações adicionais</Label>
          <Textarea
            id="extra"
            value={info.extra}
            onChange={(e) => update('extra', e.target.value)}
            rows={5}
            placeholder="Ex: Vista mar, piscina privativa, acabamento de luxo, contato: (85) 99999-9999"
          />
        </div>
      </div>
    </div>
  );
}
