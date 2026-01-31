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
  errors?: {
    uf?: string;
    city?: string;
    neighborhood?: string;
  };
}

export function LocationSelector({
  uf,
  city,
  neighborhood,
  onUFChange,
  onCityChange,
  onNeighborhoodChange,
  errors = {},
}: LocationSelectorProps) {
  const { states, cities, loadingStates, loadingCities, fetchCities, clearCities } = useIBGELocation();
  const [openCityCombobox, setOpenCityCombobox] = useState(false);

  // Fetch cities when UF changes
  useEffect(() => {
    if (uf) {
      fetchCities(uf);
    } else {
      clearCities();
    }
  }, [uf, fetchCities, clearCities]);

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
          <Label htmlFor="addressUf" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Estado *
          </Label>
          <Select value={uf} onValueChange={handleUFChange}>
            <SelectTrigger className={errors.uf ? "border-destructive" : ""}>
              <SelectValue placeholder={loadingStates ? "Carregando..." : "Selecione"} />
            </SelectTrigger>
            <SelectContent>
              {states.map((state) => (
                <SelectItem key={state.id} value={state.sigla}>
                  {state.nome} ({state.sigla})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.uf && <p className="text-sm text-destructive">{errors.uf}</p>}
        </div>

        {/* Cidade - Combobox com busca */}
        <div className="space-y-2">
          <Label htmlFor="addressCity" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Cidade *
          </Label>
          <Popover open={openCityCombobox} onOpenChange={setOpenCityCombobox}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openCityCombobox}
                className={cn(
                  "w-full justify-between font-normal",
                  errors.city ? "border-destructive" : ""
                )}
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
                    {!uf ? "Selecione o estado" : "Buscar cidade..."}
                  </span>
                )}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-0 pointer-events-auto" align="start">
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
          {errors.city && <p className="text-sm text-destructive">{errors.city}</p>}
        </div>
      </div>

      {/* Bairro - Input livre */}
      <div className="space-y-2">
        <Label htmlFor="addressNeighborhood" className="flex items-center gap-2">
          <Home className="w-4 h-4" />
          Bairro *
        </Label>
        <Input
          id="addressNeighborhood"
          value={neighborhood}
          onChange={(e) => onNeighborhoodChange(e.target.value)}
          placeholder="Digite o bairro"
          disabled={!city}
          className={errors.neighborhood ? "border-destructive" : ""}
        />
        {errors.neighborhood && <p className="text-sm text-destructive">{errors.neighborhood}</p>}
      </div>
    </div>
  );
}
