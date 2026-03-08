import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingCart, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const AbandonedCartReminder = () => {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const [count, setCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const checkCart = async () => {
      const lastDismissed = localStorage.getItem(`cart_reminder_dismissed_${user.id}`);
      if (lastDismissed) {
        const diff = Date.now() - parseInt(lastDismissed);
        if (diff < 1000 * 60 * 60 * 24) return; // 24h cooldown
      }

      const { data } = await supabase
        .from("cart_items")
        .select("id")
        .eq("user_id", user.id);

      if (data && data.length > 0) {
        setCount(data.length);
        // Show after 3s delay
        setTimeout(() => setShow(true), 3000);
      }
    };

    checkCart();
  }, [user]);

  const dismiss = () => {
    setShow(false);
    if (user) localStorage.setItem(`cart_reminder_dismissed_${user.id}`, Date.now().toString());
  };

  const goToCart = () => {
    dismiss();
    navigate("/checkout");
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-20 right-4 z-50 max-w-sm animate-in slide-in-from-right-5 duration-500">
      <div className="bg-card border border-border rounded-xl shadow-2xl p-4">
        <button onClick={dismiss} className="absolute top-2 right-2 text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-start gap-3">
          <div className="bg-primary/10 rounded-full p-2 flex-shrink-0">
            <ShoppingCart className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="font-heading font-bold text-sm text-foreground">
              Você tem {count} {count === 1 ? "item" : "itens"} no carrinho!
            </p>
            <p className="text-xs text-muted-foreground">
              Não perca suas peças selecionadas. Finalize sua compra agora.
            </p>
            <Button size="sm" className="mt-2 text-xs h-8" onClick={goToCart}>
              Finalizar Compra
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AbandonedCartReminder;
