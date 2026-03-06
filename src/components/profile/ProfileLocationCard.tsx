import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LocationSelector } from '@/components/auth/LocationSelector';
import { MapPin } from 'lucide-react';

interface ProfileLocationCardProps {
  address_uf: string;
  address_city: string;
  address_neighborhood: string;
  address: string;
  onChange: (updates: Record<string, string>) => void;
}

export function ProfileLocationCard({ address_uf, address_city, address_neighborhood, address, onChange }: ProfileLocationCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Localização
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <LocationSelector
          uf={address_uf}
          city={address_city}
          neighborhood={address_neighborhood}
          onUFChange={(v) => onChange({ address_uf: v, address_city: '', address_neighborhood: '' })}
          onCityChange={(v) => onChange({ address_city: v })}
          onNeighborhoodChange={(v) => onChange({ address_neighborhood: v })}
        />
        <div className="space-y-2">
          <Label>Endereço</Label>
          <Input
            value={address}
            onChange={(e) => onChange({ address: e.target.value })}
            placeholder="Rua, número, complemento"
          />
        </div>
      </CardContent>
    </Card>
  );
}
