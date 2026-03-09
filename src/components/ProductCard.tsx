import { ShoppingCart, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import FavoriteButton from "@/components/FavoriteButton";

interface ProductCardProps {
  id?: string;
  name: string;
  image: string;
  price: number;
  oldPrice?: number;
  installments?: string;
  sku?: string;
  stockQuantity?: number;
  isFavorite?: boolean;
  onToggleFavorite?: (productId: string, productName?: string) => void;
}

const ProductCard = ({ id, name, image, price, oldPrice, installments, sku, stockQuantity, isFavorite = false, onToggleFavorite }: ProductCardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const addToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) { navigate("/auth"); return; }
    if (!id) return;
    const { data: existing } = await supabase.from("cart_items").select("id, quantity").eq("user_id", user.id).eq("product_id", id).maybeSingle();
    let error;
    if (existing) {
      ({ error } = await supabase.from("cart_items").update({ quantity: existing.quantity + 1 }).eq("id", existing.id));
    } else {
      ({ error } = await supabase.from("cart_items").insert({ user_id: user.id, product_id: id, quantity: 1 }));
    }
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Adicionado ao carrinho!" });
      window.dispatchEvent(new CustomEvent("open-cart-drawer"));
    }
  };

  return (
    <div className="group rounded-lg border border-border bg-card overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={() => id && navigate(`/produto/${id}`)}>
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img src={image} alt={name} loading="lazy" className="h-full w-full object-contain p-4 group-hover:scale-105 transition-transform duration-300" />
        {oldPrice && (
          <span className="absolute top-2 left-2 rounded bg-destructive px-2 py-0.5 text-xs font-bold text-destructive-foreground">OFERTA</span>
        )}
        {id && onToggleFavorite && (
          <div className="absolute top-2 right-2">
            <FavoriteButton productId={id} productName={name} isFavorite={isFavorite} onToggle={onToggleFavorite} />
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-heading text-sm font-semibold text-card-foreground line-clamp-2 min-h-[2.5rem]">{name}</h3>
        {sku && <p className="text-[10px] text-muted-foreground mt-1">Cód: {sku}</p>}
        {oldPrice && <p className="mt-2 text-xs text-muted-foreground line-through">R$ {oldPrice.toFixed(2).replace(".", ",")}</p>}
        <p className="mt-1 font-heading text-xl font-extrabold text-price">R$ {price.toFixed(2).replace(".", ",")}</p>
        {installments && <p className="text-xs text-muted-foreground">{installments}</p>}
        {stockQuantity !== undefined && <p className="text-[10px] text-muted-foreground mt-1">{stockQuantity > 0 ? `${stockQuantity} em estoque` : "Indisponível"}</p>}
        <button onClick={addToCart} className="mt-3 flex w-full items-center justify-center gap-2 rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity">
          <ShoppingCart className="h-4 w-4" /> Comprar
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
