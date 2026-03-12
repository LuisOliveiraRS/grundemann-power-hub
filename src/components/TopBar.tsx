import { Phone, MessageCircle, Package, ShoppingCart, Wrench, Calculator } from "lucide-react";
import { Link } from "react-router-dom";

const TopBar = () => {
  return (
    <div className="bg-topbar text-topbar-foreground hidden md:block">
      <div className="container flex items-center justify-between py-2 text-sm">
        <div className="flex items-center gap-6">
          <a href="tel:+5551981825748" className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
            <Phone className="h-3.5 w-3.5" />
            <span>Telefone: (51) 98182-5748</span>
          </a>
          <a href="https://wa.me/5551981825748" className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
            <MessageCircle className="h-3.5 w-3.5" />
            <span>WhatsApp: (51) 98182-5748</span>
          </a>
          <span className="text-topbar-foreground/80 text-xs">CNPJ: 48.530.708/0001-80</span>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/calculadora-de-carga" className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
            <Calculator className="h-3.5 w-3.5" />
            <span>Calculadora de Carga</span>
          </Link>
          <Link to="/parceiros/revendedor" className="flex items-center gap-1.5 hover:opacity-80 transition-opacity animate-pulse text-accent font-bold">
            <Store className="h-3.5 w-3.5" />
            <span>Revendedores</span>
          </Link>
          <Link to="/parceiros/oficina-mecanico" className="flex items-center gap-1.5 hover:opacity-80 transition-opacity animate-pulse text-accent font-bold">
            <Wrench className="h-3.5 w-3.5" />
            <span>Oficinas e Mecânicos</span>
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
