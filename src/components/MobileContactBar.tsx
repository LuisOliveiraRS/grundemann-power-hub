import { Phone, MessageCircle } from "lucide-react";

const MobileContactBar = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9998] md:hidden bg-foreground/95 backdrop-blur-sm border-t border-border safe-area-bottom">
      <div className="flex items-stretch divide-x divide-background/10">
        <a
          href="tel:+5551981825748"
          className="flex-1 flex items-center justify-center gap-2 py-3 text-background hover:bg-primary/20 transition-colors"
        >
          <Phone className="h-5 w-5 text-primary" />
          <span className="text-sm font-semibold">Ligar</span>
        </a>
        <a
          href="https://wa.me/5551981825748"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 py-3 text-background hover:bg-primary/20 transition-colors"
        >
          <MessageCircle className="h-5 w-5 text-primary" />
          <span className="text-sm font-semibold">WhatsApp</span>
        </a>
      </div>
    </div>
  );
};

export default MobileContactBar;
