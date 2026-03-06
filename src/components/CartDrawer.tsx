import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product: { name: string; price: number; image_url: string } | null;
}

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CartDrawer = ({ open, onOpenChange }: CartDrawerProps) => {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (open && user) loadCart();
  }, [open, user]);

  const loadCart = async () => {
    const { data } = await supabase
      .from("cart_items")
      .select("id, product_id, quantity, products(name, price, image_url)")
      .eq("user_id", user!.id);
    if (data) {
      setItems(data.map((d: any) => ({ ...d, product: d.products })));
    }
  };

  const updateQty = async (id: string, quantity: number) => {
    if (quantity < 1) return removeItem(id);
    await supabase.from("cart_items").update({ quantity }).eq("id", id);
    loadCart();
  };

  const removeItem = async (id: string) => {
    await supabase.from("cart_items").delete().eq("id", id);
    loadCart();
  };

  const total = items.reduce((s, i) => s + (i.product?.price || 0) * i.quantity, 0);

  const goToCheckout = () => {
    onOpenChange(false);
    navigate("/checkout");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="font-heading">Meu Carrinho</SheetTitle>
        </SheetHeader>

        {!user ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">Faça login para ver seu carrinho</p>
              <Button onClick={() => { onOpenChange(false); navigate("/auth"); }}>Entrar</Button>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">Carrinho vazio</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto space-y-3 py-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 border border-border rounded-lg p-3">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.product?.name}</p>
                    <p className="text-price font-bold text-sm">R$ {(item.product?.price || 0).toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateQty(item.id, item.quantity - 1)} className="p-1 hover:bg-muted rounded"><Minus className="h-4 w-4" /></button>
                    <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                    <button onClick={() => updateQty(item.id, item.quantity + 1)} className="p-1 hover:bg-muted rounded"><Plus className="h-4 w-4" /></button>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="text-destructive p-1"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-4 space-y-3">
              <div className="flex justify-between font-heading font-bold text-lg">
                <span>Total</span>
                <span className="text-price">R$ {total.toFixed(2)}</span>
              </div>
              <Button className="w-full" onClick={goToCheckout}>
                Finalizar Pedido
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;
