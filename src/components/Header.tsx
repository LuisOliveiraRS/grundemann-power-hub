import { Search, User, ShoppingCart } from "lucide-react";
import { useState } from "react";

const Header = () => {
  const [cartCount] = useState(0);

  return (
    <header className="border-b border-border bg-background sticky top-0 z-40">
      <div className="container flex items-center justify-between py-4 gap-8">
        {/* Logo */}
        <a href="/" className="flex-shrink-0">
          <h1 className="font-heading text-2xl font-extrabold tracking-tight">
            <span className="text-primary">GRUNDEMANN</span>
            <br />
            <span className="text-secondary text-sm font-semibold tracking-widest">GERADORES</span>
          </h1>
        </a>

        {/* Search */}
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

        {/* Actions */}
        <div className="flex items-center gap-6">
          <a href="#" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <User className="h-5 w-5" />
            <span className="hidden md:inline">Minha Conta</span>
          </a>
          <a href="#" className="relative flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {cartCount}
              </span>
            )}
          </a>
        </div>
      </div>
    </header>
  );
};

export default Header;
