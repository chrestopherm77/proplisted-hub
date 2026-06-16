import { useEffect, useState } from "react";
import { StepProps } from "../types";
import { StepContainer } from "../StepContainer";
import { OptionCard } from "../OptionCard";
import { Tag, ShoppingCart, HardHat, Key, Briefcase } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const ICONS: Record<string, JSX.Element> = {
  SELL: <Tag className="h-8 w-8" />,
  BUY: <ShoppingCart className="h-8 w-8" />,
  BUILD: <HardHat className="h-8 w-8" />,
  RENT: <Key className="h-8 w-8" />,
};

const FALLBACK = [
  { intention: 'SELL', label: 'Vender um imóvel' },
  { intention: 'BUY', label: 'Comprar um imóvel' },
  { intention: 'BUILD', label: 'Construir um imóvel' },
  { intention: 'RENT', label: 'Quero alugar um imóvel para mim' },
];

export function IntentionStep({ data, updateData }: StepProps) {
  const [options, setOptions] = useState(FALLBACK);

  useEffect(() => {
    (async () => {
      const { data: rows } = await supabase
        .from('lead_form_intentions')
        .select('intention,label,is_active,sort_order')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (rows && rows.length > 0) {
        setOptions(rows.map((r) => ({ intention: r.intention, label: r.label })));
      }
    })();
  }, []);

  return (
    <StepContainer
      title="O que você deseja fazer neste momento?"
      subtitle="Selecione a opção que melhor descreve sua intenção"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {options.map((option) => (
          <OptionCard
            key={option.intention}
            label={option.label}
            icon={ICONS[option.intention]}
            isSelected={data.intention === option.intention}
            onClick={() => updateData({ intention: option.intention as any })}
          />
        ))}
        <OptionCard
          label="Sou corretor"
          icon={<Briefcase className="h-8 w-8" />}
          isSelected={false}
          onClick={() => {
            window.location.href = "https://conectaeimob.com.br";
          }}
        />
      </div>
    </StepContainer>
  );
}
