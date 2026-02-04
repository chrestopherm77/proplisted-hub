import { useNavigate } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface FloatingCartProps {
  itemCount: number;
}

export function FloatingCart({ itemCount }: FloatingCartProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate("/cart")}
      className="fixed bottom-6 right-6 z-50 flex flex-col items-center justify-center
                 bg-primary text-primary-foreground rounded-2xl p-4 shadow-lg
                 hover:scale-105 transition-all duration-200 hover:shadow-xl
                 min-w-[72px] min-h-[72px]"
      aria-label={`Carrinho com ${itemCount} itens`}
    >
      <div className="relative">
        <ShoppingCart className="h-6 w-6" />
        {itemCount > 0 && (
          <Badge 
            className="absolute -top-3 -right-3 h-5 min-w-5 flex items-center justify-center 
                       bg-destructive text-destructive-foreground text-xs font-bold px-1.5"
          >
            {itemCount > 99 ? "99+" : itemCount}
          </Badge>
        )}
      </div>
      <span className="text-xs mt-1.5 font-medium whitespace-nowrap">Carrinho</span>
    </button>
  );
}
