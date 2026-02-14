import { Phone, MessageCircle, Package, ShoppingCart } from "lucide-react";

const TopBar = () => {
  return (
    <div className="bg-topbar text-topbar-foreground">
      <div className="container flex items-center justify-between py-2 text-sm">
        <div className="flex items-center gap-6">
          <a href="tel:+5500000000000" className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
            <Phone className="h-3.5 w-3.5" />
            <span>Telefone: (00) 0000-0000</span>
          </a>
          <a href="https://wa.me/5500000000000" className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
            <MessageCircle className="h-3.5 w-3.5" />
            <span>WhatsApp: (00) 00000-0000</span>
          </a>
        </div>
        <div className="flex items-center gap-6">
          <a href="#" className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
            <Package className="h-3.5 w-3.5" />
            <span>Rastrear Pedido</span>
          </a>
          <a href="#" className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
            <ShoppingCart className="h-3.5 w-3.5" />
            <span>Meus Pedidos</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
