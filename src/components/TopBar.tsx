import { Phone, MessageCircle, Package, ShoppingCart } from "lucide-react";

const TopBar = () => {
  return (
    <div className="bg-topbar text-topbar-foreground hidden md:block">
      <div className="container flex items-center justify-between py-2 text-sm">
        <div className="flex items-center gap-6">
          <a href="tel:+555181825748" className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
            <Phone className="h-3.5 w-3.5" />
            <span>Telefone: (51) 8182-5748</span>
          </a>
          <a href="https://wa.me/555181825748" className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
            <MessageCircle className="h-3.5 w-3.5" />
            <span>WhatsApp: (51) 8182-5748</span>
          </a>
        </div>
        <div className="flex items-center gap-6">
          <a href="/minha-conta" className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
            <Package className="h-3.5 w-3.5" />
            <span>Rastrear Pedido</span>
          </a>
          <a href="/minha-conta" className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
            <ShoppingCart className="h-3.5 w-3.5" />
            <span>Meus Pedidos</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
