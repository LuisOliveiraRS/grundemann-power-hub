import { User, ShoppingCart } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import CartDrawer from "@/components/CartDrawer";
import SmartSearch from "@/components/SmartSearch";
import NotificationBell from "@/components/NotificationBell";
import logo from "@/assets/logo-grundemann.png";
import { supabase } from "@/integrations/supabase/client";

const Header = () => {
  const [cartOpen, setCartOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const { user, isAdmin, isSeller } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) { setCartCount(0); return; }
    loadCartCount();

    const channel = supabase
      .channel(`cart-count-${user.id}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "cart_items",
        filter: `user_id=eq.${user.id}`,
      }, () => loadCartCount())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const loadCartCount = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("cart_items")
      .select("quantity")
      .eq("user_id", user.id);
    const total = (data || []).reduce((s, i) => s + (i.quantity || 1), 0);
    setCartCount(total);
  };

  return (
    <>
      <header className="border-b border-border bg-background sticky top-0 z-40">
        <div className="container flex items-center justify-between py-3 gap-8">
          <a href="/" className="flex-shrink-0">
            <img src={logo} alt="Gründemann Geradores" className="h-24 md:h-36 w-auto" />
          </a>

          <SmartSearch />

          <div className="flex items-center gap-6">
            <NotificationBell />
            {isAdmin && (
              <button onClick={() => navigate("/admin")} className="text-xs font-bold text-primary hover:underline">
                Admin
              </button>
            )}
            {isSeller && !isAdmin && (
              <button onClick={() => navigate("/vendedor")} className="text-xs font-bold text-primary hover:underline">
                Vendedor
              </button>
            )}
            <button
              onClick={() => user ? navigate("/minha-conta") : navigate("/auth")}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <User className="h-5 w-5" />
              <span className="hidden md:inline">{user ? "Minha Conta" : "Entrar"}</span>
            </button>
            <button
              onClick={() => setCartOpen(true)}
              className="relative flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center px-1 shadow-sm">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>
      <CartDrawer open={cartOpen} onOpenChange={(open) => { setCartOpen(open); if (!open) loadCartCount(); }} />
    </>
  );
};

export default Header;
