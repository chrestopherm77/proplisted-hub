import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useIBGELocation } from "@/hooks/useIBGELocation";
import { MapPin, Building2, Home, Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LocationSelectorProps {
  uf: string;
  city: string;
  neighborhood: string;
  onUFChange: (uf: string) => void;
  onCityChange: (city: string) => void;
  onNeighborhoodChange: (neighborhood: string) => void;
  showNeighborhood?: boolean;
  allowedStates?: string[];
  allowedCities?: string[];
}

export function LocationSelector({
  uf,
  city,
  neighborhood,
  onUFChange,
  onCityChange,
  onNeighborhoodChange,
  showNeighborhood = true,
  allowedStates,
  allowedCities,
}: LocationSelectorProps) {
  const { states, cities: ibgeCities, loadingStates, loadingCities, fetchCities, clearCities } = useIBGELocation();
  const [openCityCombobox, setOpenCityCombobox] = useState(false);

  const filteredStates = allowedStates
    ? states.filter((s) => allowedStates.includes(s.sigla))
    : states;

  const citiesToShow = allowedCities
    ? allowedCities.map((name, i) => ({ id: i, nome: name }))
    : ibgeCities;

  // Auto-select single allowed state
  useEffect(() => {
    if (allowedStates && allowedStates.length === 1 && !uf && filteredStates.length > 0) {
      onUFChange(allowedStates[0]);
    }
  }, [allowedStates, uf, filteredStates.length, onUFChange]);

  // Fetch cities when UF changes (only if not using allowedCities)
  useEffect(() => {
    if (allowedCities) return;
    if (uf) {
      fetchCities(uf);
    } else {
      clearCities();
    }
  }, [uf, fetchCities, clearCities, allowedCities]);

  const handleUFChange = (newUf: string) => {
    onUFChange(newUf);
    onCityChange('');
    onNeighborhoodChange('');
  };

  const handleCitySelect = (cityName: string) => {
    onCityChange(cityName);
    setOpenCityCombobox(false);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Estado */}
        <div className="space-y-2">
          <Label htmlFor="uf" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Estado
          </Label>
          <Select value={uf} onValueChange={handleUFChange}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder={loadingStates ? "Carregando..." : "Selecione o estado"} />
            </SelectTrigger>
            <SelectContent>
              {filteredStates.map((state) => (
                <SelectItem key={state.id} value={state.sigla}>
                  {state.nome} ({state.sigla})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Cidade - Combobox com busca */}
        <div className="space-y-2">
          <Label htmlFor="city" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Cidade
          </Label>
          <Popover open={openCityCombobox} onOpenChange={setOpenCityCombobox}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openCityCombobox}
                className="h-12 w-full justify-between font-normal"
                disabled={!uf || loadingCities}
              >
                {loadingCities ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carregando...
                  </span>
                ) : city ? (
                  city
                ) : (
                  <span className="text-muted-foreground">
                    {!uf ? "Selecione o estado primeiro" : "Buscar cidade..."}
                  </span>
                )}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0 pointer-events-auto" align="start">
              <Command>
                <CommandInput placeholder="Buscar cidade..." />
                <CommandList>
                  <CommandEmpty>Nenhuma cidade encontrada.</CommandEmpty>
                  <CommandGroup>
                    {cities.map((cityItem) => (
                      <CommandItem
                        key={cityItem.id}
                        value={cityItem.nome}
                        onSelect={() => handleCitySelect(cityItem.nome)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            city === cityItem.nome ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {cityItem.nome}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Bairro - Input livre */}
      {showNeighborhood && (
        <div className="space-y-2">
          <Label htmlFor="neighborhood" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Bairro
          </Label>
          <Input
            id="neighborhood"
            value={neighborhood}
            onChange={(e) => onNeighborhoodChange(e.target.value)}
            placeholder="Digite o bairro"
            className="h-12"
            disabled={!city}
          />
        </div>
      )}
    </div>
  );
}
