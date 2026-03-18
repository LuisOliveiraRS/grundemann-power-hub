import { User, ShoppingCart, Menu, LogIn, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, getPartnerDashboardPath, getPartnerLabel } from "@/contexts/AuthContext";
import CartDrawer from "@/components/CartDrawer";
import SmartSearch from "@/components/SmartSearch";
import NotificationBell from "@/components/NotificationBell";
import MobileMenu from "@/components/MobileMenu";
import logo from "@/assets/logo-grundemann.png";
import { supabase } from "@/integrations/supabase/client";
import { getGuestCartCount } from "@/lib/guestCart";

const Header = () => {
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const { user, isAdmin, isSeller, userName, partnerType, signOut } = useAuth();
  const navigate = useNavigate();

  const loadCartCount = async () => {
    if (user) {
      const { data, error } = await supabase
        .from("cart_items")
        .select("quantity")
        .eq("user_id", user.id);
      if (error) { console.error("Erro ao carregar carrinho:", error.message); return; }
      const total = (data || []).reduce((s, i) => s + (i.quantity || 1), 0);
      setCartCount(total);
    } else {
      setCartCount(getGuestCartCount());
    }
  };

  useEffect(() => {
    loadCartCount();

    const handleOpenCart = () => { setCartOpen(true); loadCartCount(); };
    window.addEventListener("open-cart-drawer", handleOpenCart);

    if (user) {
      const channel = supabase
        .channel(`cart-count-${user.id}`)
        .on("postgres_changes", {
          event: "*",
          schema: "public",
          table: "cart_items",
          filter: `user_id=eq.${user.id}`,
        }, () => loadCartCount())
        .subscribe();

      return () => { supabase.removeChannel(channel); window.removeEventListener("open-cart-drawer", handleOpenCart); };
    }

    return () => { window.removeEventListener("open-cart-drawer", handleOpenCart); };
  }, [user]);

  return (
    <>
      <header className="border-b border-border bg-background relative z-50">
        <div className="container flex items-center justify-between py-3 gap-3 md:gap-8">
          <button
            onClick={() => setMenuOpen(true)}
            className="md:hidden flex-shrink-0 p-1.5 -ml-1.5 text-foreground hover:text-primary transition-colors"
            aria-label="Abrir menu"
          >
            <Menu className="h-6 w-6" />
          </button>

          <a href="/" className="flex-shrink-0">
            <img src={logo} alt="Gründemann Geradores" className="h-10 md:h-14 w-auto" />
          </a>

          <SmartSearch />

          <div className="flex items-center gap-3 md:gap-6">
            <NotificationBell />
            {isAdmin && (
              <button onClick={() => navigate("/admin")} className="hidden md:block text-xs font-bold text-primary hover:underline">
                Admin
              </button>
            )}
            {isSeller && !isAdmin && (
              <button onClick={() => navigate("/vendedor")} className="hidden md:block text-xs font-bold text-primary hover:underline">
                Vendedor
              </button>
            )}
            {!isAdmin && !isSeller && partnerType && (
              <button
                onClick={() => navigate(getPartnerDashboardPath(partnerType))}
                className="hidden md:block text-xs font-bold text-primary hover:underline"
              >
                {getPartnerLabel(partnerType)}
              </button>
            )}
            {user ? (
              <div className="hidden md:flex items-center gap-2">
                <button
                  onClick={() => navigate("/minha-conta")}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <User className="h-5 w-5" />
                  <span>{userName || "Minha Conta"}</span>
                </button>
                <button
                  onClick={async () => { await signOut(); navigate("/"); }}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors ml-1"
                  title="Sair"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate("/auth")}
                className="hidden md:flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <LogIn className="h-5 w-5" />
                <span>Entrar</span>
              </button>
            )}
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
      <MobileMenu open={menuOpen} onOpenChange={setMenuOpen} />
      <CartDrawer open={cartOpen} onOpenChange={(open) => { setCartOpen(open); if (!open) loadCartCount(); }} />
    </>
  );
};

export default Header;
