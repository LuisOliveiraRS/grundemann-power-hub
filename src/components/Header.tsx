import { Search, User, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import CartDrawer from "@/components/CartDrawer";
import logo from "@/assets/logo-grundemann.png";

const Header = () => {
  const [cartOpen, setCartOpen] = useState(false);
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      <header className="border-b border-border bg-background sticky top-0 z-40">
        <div className="container flex items-center justify-between py-3 gap-8">
          <a href="/" className="flex-shrink-0">
            <img src={logo} alt="Gründemann Geradores" className="h-20 md:h-28 w-auto" />
          </a>

          <div className="flex-1 max-w-xl">
            <div className="relative">
              <input
                type="text"
                placeholder="O que você procura hoje?"
                className="w-full rounded-lg border border-input bg-background px-4 py-2.5 pr-12 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md bg-primary p-2 text-primary-foreground hover:opacity-90 transition-opacity">
                <Search className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {isAdmin && (
              <button onClick={() => navigate("/admin")} className="text-xs font-bold text-primary hover:underline">
                Admin
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
            </button>
          </div>
        </div>
      </header>
      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
    </>
  );
};

export default Header;
