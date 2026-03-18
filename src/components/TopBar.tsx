import { MessageCircle, Package, ShoppingCart, Wrench, Store, Building } from "lucide-react";
import { Link } from "react-router-dom";

const TopBar = () => {
  return (
    <div className="bg-topbar text-topbar-foreground hidden md:block">
      <div className="container flex items-center justify-between py-2 text-sm">
        <div className="flex items-center gap-6">
          <a href="https://wa.me/5551981825748" className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
            <MessageCircle className="h-3.5 w-3.5" />
            <span>WhatsApp: (51) 98182-5748</span>
          </a>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/parceiros/fornecedor" className="flex items-center gap-1.5 hover:opacity-80 transition-opacity text-accent font-bold animate-topbar-pulse-a">
            <Store className="h-3.5 w-3.5" />
            <span>Fornecedores</span>
          </Link>
          <Link to="/parceiros/oficina-mecanico" className="flex items-center gap-1.5 hover:opacity-80 transition-opacity text-accent font-bold animate-topbar-pulse-b">
            <Wrench className="h-3.5 w-3.5" />
            <span>Oficinas e Mecânicos</span>
          </Link>
          <Link to="/parceiros/locadora" className="flex items-center gap-1.5 hover:opacity-80 transition-opacity text-accent font-bold animate-topbar-pulse-a">
            <Building className="h-3.5 w-3.5" />
            <span>Locadoras</span>
          </Link>
          <Link to="/minha-conta" className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
            <Package className="h-3.5 w-3.5" />
            <span>Rastrear Pedido</span>
          </Link>
          <Link to="/minha-conta" className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
            <ShoppingCart className="h-3.5 w-3.5" />
            <span>Meus Pedidos</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
