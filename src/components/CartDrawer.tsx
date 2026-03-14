import { useEffect, useState, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, ShoppingCart, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import PaymentBadges from "@/components/PaymentBadges";
import { getGuestCart, updateGuestCartQty, removeFromGuestCart, type GuestCartItem } from "@/lib/guestCart";

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product: { name: string; price: number; image_url: string | null } | null;
}

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CartDrawer = forwardRef<HTMLDivElement, CartDrawerProps>(({ open, onOpenChange }, _ref) => {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [guestItems, setGuestItems] = useState<GuestCartItem[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    if (user) loadCart();
    else setGuestItems(getGuestCart());
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

  // Guest cart operations
  const updateGuestQty = (productId: string, quantity: number) => {
    if (quantity < 1) return removeGuestItem(productId);
    setGuestItems(updateGuestCartQty(productId, quantity));
  };

  const removeGuestItem = (productId: string) => {
    setGuestItems(removeFromGuestCart(productId));
  };

  const total = user
    ? items.reduce((s, i) => s + (i.product?.price || 0) * i.quantity, 0)
    : guestItems.reduce((s, i) => s + (i.product?.price || 0) * i.quantity, 0);

  const itemCount = user
    ? items.reduce((s, i) => s + i.quantity, 0)
    : guestItems.reduce((s, i) => s + i.quantity, 0);

  const isEmpty = user ? items.length === 0 : guestItems.length === 0;

  const goToCheckout = () => {
    onOpenChange(false);
    if (!user) {
      navigate("/auth?redirect=/checkout");
    } else {
      navigate("/checkout");
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm" onClick={() => onOpenChange(false)} />

      {/* Compact cart popup */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="fixed top-16 right-4 md:right-8 z-50 w-[360px] max-w-[calc(100vw-2rem)] bg-card rounded-2xl border border-border shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              <h3 className="font-heading font-bold text-base">Meu Carrinho</h3>
              {itemCount > 0 && (
                <span className="bg-primary text-primary-foreground text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                  {itemCount}
                </span>
              )}
            </div>
            <button onClick={() => onOpenChange(false)} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {isEmpty ? (
            <div className="p-8 text-center">
              <ShoppingCart className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Carrinho vazio</p>
            </div>
          ) : (
            <>
              {/* Items */}
              <div className="max-h-[280px] overflow-y-auto divide-y divide-border">
                {user ? items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors">
                    <div className="h-12 w-12 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                      {item.product?.image_url ? (
                        <img src={item.product.image_url} alt="" className="h-full w-full object-contain p-1" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs truncate">{item.product?.name}</p>
                      <p className="text-primary font-bold text-sm">R$ {(item.product?.price || 0).toFixed(2).replace(".", ",")}</p>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <button onClick={() => updateQty(item.id, item.quantity - 1)} className="p-1 hover:bg-muted rounded transition-colors">
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold">{item.quantity}</span>
                      <button onClick={() => updateQty(item.id, item.quantity + 1)} className="p-1 hover:bg-muted rounded transition-colors">
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <button onClick={() => removeItem(item.id)} className="text-destructive p-1 hover:bg-destructive/10 rounded transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )) : guestItems.map((item) => (
                  <div key={item.product_id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors">
                    <div className="h-12 w-12 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                      {item.product?.image_url ? (
                        <img src={item.product.image_url} alt="" className="h-full w-full object-contain p-1" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs truncate">{item.product?.name}</p>
                      <p className="text-primary font-bold text-sm">R$ {(item.product?.price || 0).toFixed(2).replace(".", ",")}</p>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <button onClick={() => updateGuestQty(item.product_id, item.quantity - 1)} className="p-1 hover:bg-muted rounded transition-colors">
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold">{item.quantity}</span>
                      <button onClick={() => updateGuestQty(item.product_id, item.quantity + 1)} className="p-1 hover:bg-muted rounded transition-colors">
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <button onClick={() => removeGuestItem(item.product_id)} className="text-destructive p-1 hover:bg-destructive/10 rounded transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="border-t border-border px-5 py-4 space-y-3 bg-muted/10">
                <div className="flex justify-between font-heading font-bold">
                  <span className="text-sm">Total</span>
                  <span className="text-primary text-lg">R$ {total.toFixed(2).replace(".", ",")}</span>
                </div>
                <Button className="w-full font-bold" onClick={goToCheckout}>
                  {user ? "Finalizar Pedido" : "Fazer Cadastro e Finalizar"}
                </Button>
                <PaymentBadges compact />
                <button
                  onClick={() => onOpenChange(false)}
                  className="w-full text-center text-xs text-primary hover:underline font-medium"
                >
                  Continuar comprando
                </button>
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </>
  );
};

export default CartDrawer;
